export const mockIncidents = [
  {
    id: "INC-9041",
    timestamp: "2026-03-14T09:12:33Z",
    user_id: "sarah.jenkins@natwest.com",
    department: "M&A Strategy",
    platform: "ChatGPT",
    risk_score: 99,
    action: "BLOCK",
    categories: ["FINANCIAL_DATA", "CREDIT_CARD_NUMBER"],
    prompt_snippet: "My [REDACTED_FINANCIAL_DATA] forecast is 12M and check test card [REDACTED_CREDIT_CARD_NUMBER]",
    reasoning: "Client pre-masked: CREDIT_CARD_NUMBER | Contextual analysis flagged: FINANCIAL_DATA"
  },
  {
    id: "INC-9040",
    timestamp: "2026-03-14T08:45:12Z",
    user_id: "david.chen@natwest.com",
    department: "Engineering",
    platform: "Claude",
    risk_score: 75,
    action: "WARN",
    categories: ["SOURCE_CODE", "INTERNAL_API"],
    prompt_snippet: "Can you optimize this python script that calls our [REDACTED_INTERNAL_API] to sync user data?",
    reasoning: "Contextual analysis flagged: SOURCE_CODE, INTERNAL_API"
  },
  {
    id: "INC-9039",
    timestamp: "2026-03-14T08:15:00Z",
    user_id: "emily.blunt@natwest.com",
    department: "HR",
    platform: "Gemini",
    risk_score: 45,
    action: "REDACT",
    categories: ["PERSON_NAME", "EMAIL_ADDRESS"],
    prompt_snippet: "Draft a rejection letter for [REDACTED_PERSON_NAME] at [REDACTED_EMAIL_ADDRESS]",
    reasoning: "Client pre-masked: EMAIL_ADDRESS | Cloud DLP detected: PERSON_NAME"
  },
  {
    id: "INC-9038",
    timestamp: "2026-03-14T07:30:22Z",
    user_id: "michael.scott@natwest.com",
    department: "Sales",
    platform: "ChatGPT",
    risk_score: 85,
    action: "BLOCK",
    categories: ["CREDENTIALS", "GCP_API_KEY"],
    prompt_snippet: "Why is this failing? Here is my connection string: AIzaSyB[REDACTED_GCP_API_KEY]...",
    reasoning: "Cloud DLP detected: GCP_API_KEY | Contextual analysis flagged: CREDENTIALS"
  },
  {
    id: "INC-9037",
    timestamp: "2026-03-13T16:22:15Z",
    user_id: "jessica.alba@natwest.com",
    department: "Legal",
    platform: "ChatGPT",
    risk_score: 65,
    action: "WARN",
    categories: ["LEGAL_DOCUMENT"],
    prompt_snippet: "Summarize this [REDACTED_LEGAL_DOCUMENT] NDA agreement regarding the Project Phoenix merger.",
    reasoning: "Contextual analysis flagged: LEGAL_DOCUMENT"
  }
];
