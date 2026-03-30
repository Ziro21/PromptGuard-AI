// ── PromptGuard AI — Content Script ──────────────────────────────────────────
// Local backend API URL
const API_URL = "http://127.0.0.1:8000/analyse";

// ── Firestore Live Policy Engine ─────────────────────────────────────────────
const FIRESTORE_PROJECT = "nastwest-u26wck-620";
const FIRESTORE_REST = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT}/databases/(default)/documents/policies`;

let livePolicies = {}; // { category: action } e.g. { FINANCIAL_DATA: 'BLOCK' }

async function loadPolicies() {
  try {
    const res = await fetch(FIRESTORE_REST);
    if (!res.ok) return;
    const data = await res.json();
    const docs = data.documents || [];
    docs.forEach(doc => {
      const fields = doc.fields || {};
      const category = fields.category?.stringValue;
      const action   = fields.action?.stringValue;
      if (category && action) livePolicies[category] = action;
    });
    console.log('[PromptGuard] Policies loaded from Firestore:', livePolicies);
  } catch (err) {
    console.warn('[PromptGuard] Could not load Firestore policies, using backend defaults.', err);
  }
}

// Apply any admin-configured overrides on top of the API result
function applyPolicyOverride(result) {
  if (!result.categories || Object.keys(livePolicies).length === 0) return result;
  let overrideAction = null;
  // Find highest-priority admin rule for detected categories
  const priority = { BLOCK: 4, WARN: 3, REDACT: 2, ALLOW: 1 };
  for (const cat of result.categories) {
    const adminAction = livePolicies[cat];
    if (adminAction && (priority[adminAction] || 0) > (priority[overrideAction] || 0)) {
      overrideAction = adminAction;
    }
  }
  if (overrideAction && overrideAction !== result.action) {
    console.log(`[PromptGuard] Policy override: ${result.action} → ${overrideAction} (admin rule for ${result.categories.join(', ')})`);
    result.action = overrideAction;
    result.safe = (overrideAction === 'ALLOW');
  }
  return result;
}

// Load policies on boot, refresh every 5 minutes
loadPolicies();
setInterval(loadPolicies, 5 * 60 * 1000);

function getPromptText(e) {
  // If triggered by Enter key, the target element itself contains the text
  if (e && e.type === "keydown") {
    return e.target.value?.trim() || e.target.innerText?.trim() || "";
  }

  // Otherwise, find all potential text inputs on the screen
  const editors = Array.from(document.querySelectorAll('textarea, div[contenteditable="true"]'));
  
  // Filter out elements that are completely hidden
  const visibleEditors = editors.filter(el => {
    return el.offsetParent !== null && el.style.display !== "none";
  });
  
  // Heuristic: The active prompt is usually the one with the most text,
  // especially when an edit textarea appears alongside an empty main prompt bar.
  let bestText = "";
  for (const el of visibleEditors) {
    const t = el.value?.trim() || el.innerText?.trim() || "";
    if (t.length > bestText.length) bestText = t;
  }
  
  return bestText;
}

function setPromptText(newText, e) {
  let target = null;
  
  if (e && e.type === "keydown") {
    target = e.target;
  } else {
    // ── Gemini: uses a custom <rich-textarea> web component ──────────────────
    // The actual editable is a <p> inside it (or the rich-textarea itself)
    const richTextarea = document.querySelector('rich-textarea .ql-editor, rich-textarea [contenteditable="true"], rich-textarea p');
    if (richTextarea) {
      // Walk up to find the real contenteditable container
      let geminiEditable = richTextarea;
      while (geminiEditable && geminiEditable.getAttribute('contenteditable') !== 'true') {
        geminiEditable = geminiEditable.parentElement;
      }
      target = geminiEditable || richTextarea;
    }

    // ── Fallback: standard textarea / contenteditable ─────────────────────────
    if (!target) {
      const editors = Array.from(document.querySelectorAll('textarea, div[contenteditable="true"]'))
          .filter(el => el.offsetParent !== null && el.style.display !== "none");
          
      let bestEl = null;
      let bestLen = -1;
      for (const el of editors) {
        const t = el.value?.trim() || el.innerText?.trim() || "";
        if (t.length > bestLen) {
          bestLen = t.length;
          bestEl = el;
        }
      }
      target = bestEl;
    }
  }

  if (!target) return false;

  target.focus();

  if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
    // 1. Set values securely using native setter bypassing React wrapper
    let nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
    if (!nativeInputValueSetter) {
        nativeInputValueSetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(target), "value")?.set;
    }
    
    if (nativeInputValueSetter) {
        nativeInputValueSetter.call(target, newText);
    } else {
        target.value = newText;
    }
    
    // 2. Clear internal tracker for old React versions
    const tracker = target._valueTracker;
    if (tracker) {
        tracker.setValue('');
    }

    // 3. Dispatch events to force state update 
    target.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    target.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    
  } else {
    // Contenteditable (ChatGPT ProseMirror, Gemini Quill, Claude Lexical, etc.)
    const range = document.createRange();
    range.selectNodeContents(target);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    
    // execCommand is the most reliable cross-editor approach
    const success = document.execCommand('insertText', false, newText);

    // Fallback: direct innerText + input event (works for Gemini Quill)
    if (!success || target.innerText.trim() !== newText.trim()) {
      target.innerText = newText;
      target.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: newText, inputType: 'insertText' }));
    }
  }
  
  return true;
}


// ── Local Tokenization Engine (Pre-flight Regex) ──────────────────────────────
const LOCAL_REGEX_RULES = [
  {
    name: "CREDIT_CARD_NUMBER",
    regex: /\b(?:\d{4}[ -]?){3}\d{4}\b/g
  },
  {
    name: "EMAIL_ADDRESS",
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
  }
];

function tokenizePrompt(originalText) {
  let tokenizedText = originalText;
  const localMaskedTokens = [];
  const tokenCounters = {};

  LOCAL_REGEX_RULES.forEach(rule => {
    tokenizedText = tokenizedText.replace(rule.regex, (match) => {
      if (!tokenCounters[rule.name]) tokenCounters[rule.name] = 1;
      const tokenId = `[${rule.name}_${tokenCounters[rule.name]}]`;
      tokenCounters[rule.name]++;
      
      localMaskedTokens.push({
        tokenId: tokenId,
        type: rule.name,
        originalValue: match
      });
      
      return tokenId;
    });
  });

  return { tokenizedText, localMaskedTokens };
}

// ── Overlay ───────────────────────────────────────────────────────────────────
function removeOverlay() {
  const existing = document.getElementById("promptguard-overlay");
  if (existing) existing.remove();
}

function showOverlay(result, originalSubmit, triggerEvent, localMaskedTokens = []) {
  removeOverlay();

  const overlay = document.createElement("div");
  overlay.id = "promptguard-overlay";

  const actionLabels = {
    BLOCK:  { bg: "#FEF2F2", border: "#DC2626", badge: "#DC2626", text: "Submission Blocked" },
    WARN:   { bg: "#FFFBEB", border: "#D97706", badge: "#D97706", text: "Sensitive Content Detected" },
    REDACT: { bg: "#EFF6FF", border: "#0891B2", badge: "#0891B2", text: "Redaction Recommended" },
    ALLOW:  { bg: "#F0FDF4", border: "#059669", badge: "#059669", text: "Content Looks Safe" },
  };

  const style = actionLabels[result.action] || actionLabels.WARN;
  const categoriesBadges = result.categories.map(cat =>
    `<span style="
      display:inline-block;
      background:#0D1B2A;
      color:#fff;
      font-size:11px;
      font-weight:600;
      padding:3px 8px;
      border-radius:4px;
      margin:2px 3px 2px 0;
      font-family:monospace;
      letter-spacing:0.5px;
    ">${cat}</span>`
  ).join("");

  const localTokensHTML = localMaskedTokens.map(token => 
    `<span style="
      display:inline-block;
      background:#F59E0B;
      color:#fff;
      font-size:11px;
      font-weight:600;
      padding:3px 8px;
      border-radius:4px;
      margin:2px 3px 2px 0;
      font-family:monospace;
      letter-spacing:0.5px;
    ">LOCAL: ${token.type}</span>`
  ).join("");

  overlay.innerHTML = `
    <div style="
      position:fixed;
      top:0; left:0; right:0; bottom:0;
      background:rgba(0,0,0,0.55);
      z-index:2147483647;
      display:flex;
      align-items:center;
      justify-content:center;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
    ">
      <div style="
        background:${style.bg};
        border:2px solid ${style.border};
        border-radius:12px;
        padding:28px 32px;
        max-width:480px;
        width:90%;
        box-shadow:0 20px 60px rgba(0,0,0,0.3);
        position:relative;
      ">

        <!-- Header -->
        <div style="display:flex;align-items:center;margin-bottom:18px;">
          <div style="
            background:${style.badge};
            color:#fff;
            width:40px; height:40px;
            border-radius:50%;
            display:flex; align-items:center; justify-content:center;
            font-size:20px;
            margin-right:12px;
            flex-shrink:0;
          ">${result.action_emoji}</div>
          <div>
            <div style="font-size:16px;font-weight:700;color:#0D1B2A;">${style.text}</div>
            <div style="font-size:12px;color:#64748B;margin-top:2px;">PromptGuard AI</div>
          </div>
          <div style="
            margin-left:auto;
            background:${style.badge};
            color:#fff;
            font-size:22px;
            font-weight:800;
            padding:6px 14px;
            border-radius:8px;
            font-family:monospace;
          ">
            ${result.risk_score}<span style="font-size:13px;font-weight:400;">/99</span>
          </div>
        </div>

        <!-- Risk bar -->
        <div style="margin-bottom:18px;">
          <div style="font-size:11px;color:#64748B;margin-bottom:5px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Risk Score</div>
          <div style="background:#E2E8F0;border-radius:4px;height:8px;overflow:hidden;">
            <div style="
              background:${style.badge};
              width:${result.risk_score}%;
              height:100%;
              border-radius:4px;
              transition:width 0.4s ease;
            "></div>
          </div>
        </div>

        <!-- Categories -->
        ${(result.categories.length > 0 || localMaskedTokens.length > 0) ? `
        <div style="margin-bottom:16px;">
          <div style="font-size:11px;color:#64748B;margin-bottom:6px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Detected Parameters</div>
          <div>${localTokensHTML}${categoriesBadges}</div>
        </div>` : ""}

        <!-- Reasoning -->
        <div style="
          background:rgba(0,0,0,0.04);
          border-radius:6px;
          padding:10px 12px;
          font-size:12px;
          color:#475569;
          margin-bottom:20px;
          line-height:1.5;
        ">
          <strong style="color:#0D1B2A;">Why:</strong> ${result.reasoning}
        </div>

        <!-- Buttons -->
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          ${result.action === "WARN" ? `
          <button id="pg-proceed" style="
            background:transparent;
            color:#D97706;
            border:1px solid #D97706;
            padding:10px 20px;
            border-radius:8px;
            font-size:13px;
            font-weight:600;
            cursor:pointer;
          ">
            Proceed Anyway
          </button>` : ""}
          
          ${result.action !== "ALLOW" ? `
          <button id="pg-redact" style="
            background:#0891B2;
            color:#fff;
            border:none;
            padding:10px 20px;
            border-radius:8px;
            font-size:13px;
            font-weight:600;
            cursor:pointer;
          ">
            Send Redacted
          </button>` : ""}
          <button id="pg-cancel" style="
            background:#F1F5F9;
            color:#0D1B2A;
            border:1px solid #CBD5E1;
            padding:10px 20px;
            border-radius:8px;
            font-size:13px;
            font-weight:600;
            cursor:pointer;
          ">
            ${result.action === "BLOCK" ? "Edit My Prompt" : "Cancel"}
          </button>
        </div>

        <!-- Footer -->
        <div style="text-align:center;margin-top:14px;font-size:11px;color:#94A3B8;">
          🛡️ Protected by PromptGuard AI
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Proceed button (only available on WARN)
  const proceedBtn = document.getElementById("pg-proceed");
  if (proceedBtn) {
    proceedBtn.addEventListener("click", () => {
      removeOverlay();
      if (originalSubmit) originalSubmit();
    });
  }

  // Send Redacted button (available on BLOCK, WARN, REDACT)
  const redactBtn = document.getElementById("pg-redact");
  if (redactBtn) {
    redactBtn.addEventListener("click", () => {
      removeOverlay();
      if (result.redacted_text) {
        setPromptText(result.redacted_text, triggerEvent);
        // Delay to let React process the DOM update before clicking send
        setTimeout(() => {
          if (originalSubmit) originalSubmit();
        }, 250);
      }
    });
  }

  // Cancel / edit button
  document.getElementById("pg-cancel").addEventListener("click", removeOverlay);

  // Click outside to dismiss (only for non-block)
  if (result.action !== "BLOCK") {
    overlay.querySelector("div").addEventListener("click", (e) => {
      if (e.target === overlay.querySelector("div")) removeOverlay();
    });
  }
}

// ── Intercept logic ───────────────────────────────────────────────────────────
let isAnalysing = false;

async function interceptAndAnalyse(originalSubmitFn, triggerEvent) {
  if (isAnalysing) return;
  const text = getPromptText(triggerEvent);

  // Don't intercept empty or very short prompts
  if (!text || text.length < 10) {
    if (originalSubmitFn) originalSubmitFn();
    return;
  }

  isAnalysing = true;

  // 1. Run local tokenization FIRST
  const { tokenizedText, localMaskedTokens } = tokenizePrompt(text);

  // Show a brief loading indicator
  const loader = document.createElement("div");
  loader.id = "pg-loader";
  loader.style.cssText = `
    position:fixed; top:16px; right:16px; z-index:2147483646;
    background:#0D1B2A; color:#fff;
    padding:10px 16px; border-radius:8px;
    font-family:-apple-system,sans-serif; font-size:13px;
    box-shadow:0 4px 20px rgba(0,0,0,0.3);
    display:flex; align-items:center; gap:8px;
  `;
  loader.innerHTML = `<span style="animation:pg-spin 1s linear infinite;display:inline-block;">🛡️</span> PromptGuard analysing...`;
  document.body.appendChild(loader);

  // Inject spin animation
  if (!document.getElementById("pg-style")) {
    const style = document.createElement("style");
    style.id = "pg-style";
    style.textContent = `@keyframes pg-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`;
    document.head.appendChild(style);
  }

  try {
    // 2. Send exclusively the SAFE tokenized text over the wire (Bypass CSP via background script)
    const result = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: "ANALYSE_PROMPT",
        url: API_URL,
        payload: { text: tokenizedText, user_id: "demo-user", department: "General" }
      }, (res) => {
        if (chrome.runtime.lastError) {
           reject(new Error(chrome.runtime.lastError.message));
        } else if (!res || !res.success) {
           reject(new Error(res ? res.error : "Unknown backend error"));
        } else {
           resolve(res.data);
        }
      });
    });

    loader.remove();

    if (result.safe || result.action === "ALLOW") {
      // Safe — let it through silently (using the original unmasked event)
      if (originalSubmitFn) originalSubmitFn();
    } else {
      // Apply any live admin policy overrides from Firestore before showing overlay
      applyPolicyOverride(result);
      // Show overlay — pass the local tokens so the user knows they were protected locally
      showOverlay(result, originalSubmitFn, triggerEvent, localMaskedTokens);
    }
  } catch (err) {
    loader.remove();
    console.warn("PromptGuard: API unreachable, allowing prompt through.", err);
    // Fail open — don't block the user if our API is down
    if (originalSubmitFn) originalSubmitFn();
  } finally {
    isAnalysing = false;
  }
}

// ── Robust DOM Button Binding (Bypasses React event stopping) ────────────────

function isSubmitBtn(btn) {
  const ariaLabel = (btn.getAttribute("aria-label") || "").toLowerCase();
  const testId = (btn.getAttribute("data-testid") || "").toLowerCase();
  const text = (btn.innerText || "").toLowerCase();
  const classes = (btn.className || "").toLowerCase();

  return (
    testId.includes("send-button") || 
    ariaLabel.includes("send") || 
    classes.includes("send-button") ||
    classes.includes("update-button") || // Gemini edit
    text.includes("save & submit") || 
    text.includes("save and submit") ||
    text === "update" || text === "aggiorna" // Gemini edit
  );
}

function bindToButton(btn) {
  if (btn._pgAttached) return;

  btn._pgAttached = true;
  btn.addEventListener("click", async (e) => {
    if (e.__pgBypass) return; // Prevent infinite loop
    
    e.preventDefault();
    e.stopImmediatePropagation();
    
    const bypassSubmit = () => {
      const clickEvent = new MouseEvent("click", {
        bubbles: true, cancelable: true, view: window, composed: true
      });
      clickEvent.__pgBypass = true;
      btn.dispatchEvent(clickEvent);
    };

    await interceptAndAnalyse(bypassSubmit, e);
  }, true); // Use capture phase to intercept before React
}

function scanAndBindButtons() {
  const buttons = document.querySelectorAll('button, div[role="button"]');
  buttons.forEach(btn => {
    if (isSubmitBtn(btn)) {
      bindToButton(btn);
    }
  });
}

// Watch the DOM for new buttons appearing (SPAs like ChatGPT/Gemini)
const observer = new MutationObserver((mutations) => {
  let shouldScan = false;
  for (const m of mutations) {
    if (m.addedNodes.length > 0) {
      shouldScan = true;
      break;
    }
  }
  if (shouldScan) scanAndBindButtons();
});

observer.observe(document.body, { childList: true, subtree: true });
scanAndBindButtons(); // Initial scan


document.addEventListener("keydown", async (e) => {
  if (e.__pgBypass) return;

  if (e.key === "Enter" && !e.shiftKey) {
    const text = getPromptText(e);
    if (!text || text.length < 10) return;

    const active = document.activeElement;
    const isPromptArea = active &&
      (active.getAttribute("contenteditable") === "true" ||
       active.tagName === "TEXTAREA" ||
       active.closest('[data-lexical-editor]') ||
       active.closest('.ProseMirror'));

    if (!isPromptArea) return;

    e.preventDefault();
    e.stopImmediatePropagation();
    
    const bypassSubmit = () => {
      const enterEvent = new KeyboardEvent("keydown", {
        key: "Enter", code: "Enter", keyCode: 13, which: 13,
        bubbles: true, cancelable: true, view: window, composed: true
      });
      enterEvent.__pgBypass = true;
      active.dispatchEvent(enterEvent);
    };

    await interceptAndAnalyse(bypassSubmit, e);
  }
}, true); // Use capture phase!

console.log("✅ PromptGuard AI active on", window.location.hostname);
