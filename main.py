from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
# GCP dependencies removed for local-only deployment
import datetime
import traceback
import re
import os
import spacy

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    import spacy.cli
    spacy.cli.download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

app = FastAPI(title="PromptGuard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# DLP and BigQuery clients removed for local deploy

INFO_TYPE_WEIGHTS = {
    "AUTH_TOKEN": 95, "BASIC_AUTH_HEADER": 95, "ENCRYPTION_KEY": 95,
    "GCP_API_KEY": 95, "OAUTH_CLIENT_SECRET": 95,
    "CREDIT_CARD_NUMBER": 85,
    "UK_NATIONAL_INSURANCE_NUMBER": 80, "PASSPORT": 80,
    "IBAN_CODE": 80, "MEDICAL_RECORD_NUMBER": 80,
    "DRIVERS_LICENSE_NUMBER": 75, "SWIFT_CODE": 75,
    "DATE_OF_BIRTH": 65, "STREET_ADDRESS": 55,
    "EMAIL_ADDRESS": 50, "PHONE_NUMBER": 50, "PERSON_NAME": 40,
    "DEFAULT": 45,
}

CATEGORY_MAP = {
    "AUTH_TOKEN": "CREDENTIALS", "BASIC_AUTH_HEADER": "CREDENTIALS",
    "ENCRYPTION_KEY": "CREDENTIALS", "GCP_API_KEY": "CREDENTIALS",
    "OAUTH_CLIENT_SECRET": "CREDENTIALS",
    "CREDIT_CARD_NUMBER": "FINANCIAL_DATA", "IBAN_CODE": "FINANCIAL_DATA",
    "SWIFT_CODE": "FINANCIAL_DATA",
    "UK_NATIONAL_INSURANCE_NUMBER": "HR_DATA", "PASSPORT": "HR_DATA",
    "DRIVERS_LICENSE_NUMBER": "HR_DATA", "DATE_OF_BIRTH": "HR_DATA",
    "MEDICAL_RECORD_NUMBER": "HR_DATA",
    "EMAIL_ADDRESS": "CLIENT_DATA", "PHONE_NUMBER": "CLIENT_DATA",
    "PERSON_NAME": "CLIENT_DATA", "STREET_ADDRESS": "CLIENT_DATA",
}

CONTEXTUAL_RULES = [
    {"keywords": ["acquiring", "acquisition", "merger", "takeover", "due diligence", "term sheet"],
     "category": "INTERNAL_STRATEGY", "weight": 88},
    {"keywords": ["confidential", "do not share", "keep this between", "off the record", "embargoed"],
     "category": "INTERNAL_STRATEGY", "weight": 75},
    {"keywords": ["def ", "class ", "import ", "function(", "SELECT ", "api_key =", "private key", "source code"],
     "category": "SOURCE_CODE", "weight": 78},
    {"keywords": ["salary", "earns", "compensation", "performance review", "employee id", "payroll"],
     "category": "HR_DATA", "weight": 72},
    {"keywords": ["without prejudice", "attorney-client", "legal privilege", "litigation", "settlement", "NDA"],
     "category": "LEGAL_PRIVILEGED", "weight": 82},
    {"keywords": ["revenue", "EBITDA", "profit margin", "forecast", "financial results", "earnings"],
     "category": "FINANCIAL_DATA", "weight": 70},
]

def contextual_scan(text):
    text_lower = text.lower()
    hits = []
    seen = set()
    for rule in CONTEXTUAL_RULES:
        for kw in rule["keywords"]:
            idx = text_lower.find(kw.lower())
            if idx != -1 and rule["category"] not in seen:
                hits.append({
                    "category": rule["category"], 
                    "weight": rule["weight"],
                    "trigger": kw, 
                    "source": "contextual",
                    "start": idx,
                    "end": idx + len(kw)
                })
                seen.add(rule["category"])
                break
    return hits

def token_scan(text):
    """Scans for tokens pre-masked by the frontend extension like [CREDIT_CARD_NUMBER_1]"""
    hits = []
    # Regex to find [SOMETHING_LIKE_THIS_1]
    pattern = r'\[([A-Z_]+)_\d+\]'
    for match in re.finditer(pattern, text):
        token_type = match.group(1)
        # Attempt to map the token type back to our internal categories/weights
        category = CATEGORY_MAP.get(token_type, "PII")
        weight = INFO_TYPE_WEIGHTS.get(token_type, 70) # default high-ish risk if unknown
        
        hits.append({
            "info_type": token_type,
            "category": category,
            "weight": weight,
            "source": "client_token",
            "start": match.start(),
            "end": match.end()
        })
    return hits

CREDENTIAL_PATTERNS = [
    # AWS secret access key (40-char base64-ish)
    (re.compile(r'(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])'), "AWS_SECRET_KEY", False),
    # AWS access key ID
    (re.compile(r'AKIA[0-9A-Z]{16}'), "AWS_ACCESS_KEY", False),
    # Generic: apikey=, api_key=, secret=, password=, token= followed by a value
    (re.compile(r'(?i)(?:api[_-]?key|token|secret|password|passwd|pwd)[\s]*[=:][\s]*[\'"]?([\w\-./+=]{8,})[\'"]?'), "CREDENTIALS", True),
    # Bearer tokens
    (re.compile(r'(?i)Bearer\s+([A-Za-z0-9\-._~+/]+=*)'), "AUTH_TOKEN", True),
    # Private key headers
    (re.compile(r'-----BEGIN [A-Z ]+PRIVATE KEY-----'), "ENCRYPTION_KEY", False),
    # Common conversational intro for a name
    (re.compile(r'(?i)(?:my name is|i am|i\'m|this is|call me)\s+([A-Za-z]+(\s+[A-Za-z]+)?)'), "PERSON_NAME", True),
]

def regex_credential_scan(text):
    """Regex-based scanner for credentials that Cloud DLP misses (AWS keys, tokens, etc.)"""
    hits = []
    for pattern, cred_type, has_group in CREDENTIAL_PATTERNS:
        for match in pattern.finditer(text):
            start = match.start(1) if has_group and match.lastindex else match.start()
            end   = match.end(1)   if has_group and match.lastindex else match.end()
            hits.append({
                "info_type": cred_type,
                "category": CATEGORY_MAP.get(cred_type, "CREDENTIALS"),
                "weight": 65 if cred_type == "PERSON_NAME" else 95,
                "source": "regex",
                "start": start,
                "end": end
            })
    return hits

def calculate_risk_score(hits):
    weights = sorted([h["weight"] for h in hits], reverse=True)
    if not weights:
        return 0
    score = weights[0]
    for i, w in enumerate(weights[1:], 1):
        score += w * (0.3 / i)
    return min(int(score), 99)

def get_action(score, categories):
    if "CREDENTIALS" in categories or score >= 85:
        return {"action": "BLOCK",  "color": "#DC2626", "emoji": "🚫"}
    elif score >= 60:
        return {"action": "WARN",   "color": "#D97706", "emoji": "⚠️"}
    elif score >= 30:
        return {"action": "REDACT", "color": "#0891B2", "emoji": "✂️"}
    else:
        return {"action": "ALLOW",  "color": "#059669", "emoji": "✓"}

def build_reasoning(dlp_hits, ctx_hits, token_hits, regex_hits=None):
    parts = []
    if token_hits:
        types = ", ".join(set(h["info_type"] for h in token_hits))
        parts.append(f"Client pre-masked: {types}")
    if dlp_hits:
        types = ", ".join(set(h["info_type"] for h in dlp_hits))
        parts.append(f"Cloud DLP detected: {types}")
    if ctx_hits:
        cats = ", ".join(set(h["category"] for h in ctx_hits))
        parts.append(f"Contextual analysis flagged: {cats}")
    if regex_hits:
        types = ", ".join(set(h["info_type"] for h in regex_hits))
        parts.append(f"Regex scanner detected: {types}")
    return " | ".join(parts) if parts else "No sensitive content detected."

def redact_text(original_text, all_hits):
    # Sort hits from end to beginning so replacing text doesn't mess up earlier indices
    sorted_hits = sorted([h for h in all_hits if "start" in h and "end" in h], 
                         key=lambda x: x["start"], reverse=True)
    
    redacted = original_text
    for hit in sorted_hits:
        start = hit["start"]
        end = hit["end"]
        # Use the category name to provide context to the LLM (e.g., [REDACTED_FINANCIAL_DATA])
        label = hit.get("category", "INFO")
        redacted = redacted[:start] + f"[REDACTED_{label}]" + redacted[end:]
    
    return redacted


class AnalyseRequest(BaseModel):
    text: str
    user_id: str = "demo-user"
    department: str = "General"

class AnalyseResponse(BaseModel):
    risk_score: int
    action: str
    action_color: str
    action_emoji: str
    categories: list
    reasoning: str
    safe: bool
    redacted_text: str


@app.post("/analyse", response_model=AnalyseResponse)
async def analyse(req: AnalyseRequest, background_tasks: BackgroundTasks):
    text = req.text.strip()
    if not text or len(text) < 5:
        return AnalyseResponse(risk_score=0, action="ALLOW", action_color="#059669",
                               action_emoji="✓", categories=[], reasoning="No content.", safe=True, redacted_text=text)

    dlp_hits = []
    ctx_hits = contextual_scan(text)

    # Cloud DLP is disabled in local mode.
    # Instead, we use spaCy to detect Person Names:
    if 'nlp' in globals() and nlp is not None:
        doc = nlp(text)
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                dlp_hits.append({
                    "info_type": "PERSON_NAME",
                    "category": "CLIENT_DATA",
                    "weight": 65, # Trigger a WARN (>= 60) so the user sees it working!
                    "source": "spacy",
                    "start": ent.start_char,
                    "end": ent.end_char
                })

    # 4. Local Token scan (find tags like [CREDIT_CARD_NUMBER_1])
    token_hits = token_scan(text)
    
    # 5. Local Regex scan for credentials
    regex_hits = regex_credential_scan(text)
    
    # 6. Combine and calculate risk
    all_hits = dlp_hits + ctx_hits + token_hits + regex_hits
    score = calculate_risk_score(all_hits)
    
    categories = sorted(list(set(h["category"] for h in all_hits)))
    action_data = get_action(score, categories)
    reasoning = build_reasoning(dlp_hits, ctx_hits, token_hits, regex_hits)
    
    safe_text = redact_text(text, all_hits)
    
    # BigQuery logging disabled in local mode

    return AnalyseResponse(
        risk_score=score,
        action=action_data["action"],
        action_color=action_data["color"],
        action_emoji=action_data["emoji"],
        categories=categories,
        reasoning=reasoning,
        safe=(action_data["action"] == "ALLOW"),
        redacted_text=safe_text
    )

@app.get("/health")
def health():
    return {"status": "ok", "service": "PromptGuard API"}
