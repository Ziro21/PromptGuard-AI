# PromptGuard AI — MVP Deployment Guide
# Complete this in ~1 hour. Two people working in parallel.

# ════════════════════════════════════════════════════════════
# PERSON 1+2 — BACKEND (Cloud Run + Cloud DLP)
# ════════════════════════════════════════════════════════════

# STEP 1 — Set your GCP project
export PROJECT_ID="your-gcp-project-id"   # ← CHANGE THIS
export REGION="europe-west2"               # London region

# STEP 2 — Enable required APIs
gcloud config set project $PROJECT_ID
gcloud services enable run.googleapis.com
gcloud services enable dlp.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# STEP 3 — Update main.py with your project ID
# Open backend/main.py and replace:
#   GCP_PROJECT = os.environ.get("GCP_PROJECT", "your-gcp-project-id")
# OR just set it via environment variable in the deploy command below

# STEP 4 — Deploy to Cloud Run (from the backend/ folder)
cd backend/

gcloud run deploy promptguard-api \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars GCP_PROJECT=$PROJECT_ID \
  --memory 512Mi \
  --cpu 1 \
  --timeout 30

# STEP 5 — Copy the URL printed after deployment
# It looks like: https://promptguard-api-xxxxxxxxxx-nw.a.run.app
# You need this for the extension in Step 6

# STEP 6 — Test your API is live
curl https://YOUR-CLOUD-RUN-URL/health
# Should return: {"status":"ok","service":"PromptGuard API"}

# STEP 7 — Test the analyse endpoint
curl -X POST https://YOUR-CLOUD-RUN-URL/analyse \
  -H "Content-Type: application/json" \
  -d '{"text": "We are acquiring Vertex Corp for £800M, keep confidential"}'
# Should return a JSON response with risk_score, action, categories etc.


# ════════════════════════════════════════════════════════════
# PERSON 3 — CHROME EXTENSION
# ════════════════════════════════════════════════════════════

# STEP 1 — Once you have the Cloud Run URL from Person 1+2:
# Open extension/content.js
# Find line 2:
#   const API_URL = "https://YOUR-CLOUD-RUN-URL/analyse";
# Replace with your actual URL:
#   const API_URL = "https://promptguard-api-xxxxxxxxxx-nw.a.run.app/analyse";

# STEP 2 — Load the extension in Chrome
# 1. Open Chrome
# 2. Go to: chrome://extensions
# 3. Enable "Developer mode" (top right toggle)
# 4. Click "Load unpacked"
# 5. Select the extension/ folder
# The PromptGuard shield icon should appear in your toolbar

# STEP 3 — Test it
# Go to https://chatgpt.com
# Type one of these demo prompts and hit Enter:

# HIGH RISK (should BLOCK):
#   "We are acquiring Vertex Corp in Q2 for £800M — keep this confidential until announcement"

# CREDENTIALS (should BLOCK):
#   "Here is my AWS key: AKIAIOSFODNN7EXAMPLE, help me debug this connection"

# MEDIUM RISK (should WARN):
#   "Can you help me analyse this email list: john@company.com, sarah@firm.co.uk"

# LOW RISK (should ALLOW):
#   "Can you help me write a Python function to sort a list?"

# ════════════════════════════════════════════════════════════
# TROUBLESHOOTING
# ════════════════════════════════════════════════════════════

# If the overlay doesn't appear:
# - Check the Chrome extension is enabled (chrome://extensions)
# - Open DevTools (F12) > Console — look for "PromptGuard AI active on..."
# - Check for CORS errors — if present, redeploy backend with --allow-unauthenticated

# If Cloud Run deploy fails:
# - Make sure billing is enabled on the GCP project
# - Run: gcloud auth login
# - Run: gcloud auth application-default login

# If DLP returns no results on obvious PII:
# - Check the GCP project ID is set correctly in environment variables
# - The contextual keyword rules will still fire even if DLP is misconfigured
