# PromptGuard AI

<div align="center">
  <h3>Privacy-first, AI-powered real-time text redaction</h3>
  <p>Protecting sensitive data and PII directly in your browser before it ever reaches third-party AI tools.</p>
</div>

---

## 📖 Overview

PromptGuard AI is a comprehensive data loss prevention (DLP) solution for enterprise teams using Large Language Models (LLMs) like ChatGPT or Claude. As employees increasingly paste sensitive data into external AI tools, the risk of data leaks grows. 

PromptGuard AI intercepts text automatically within the browser, scans it locally via a high-performance NLP engine, and redacts Personally Identifiable Information (PII), credentials, and context-specific sensitive data (e.g., M&A strategy, HR data, or source code) before it is sent to the LLM.

## ✨ Key Features

- **Real-time Browser Interception**: An elegant, non-intrusive Chrome Extension that sits quietly in the background, only intervening when a risk is detected.
- **Hybrid Scanning Engine**: 
  - *NLP Models*: Uses **spaCy** for Named Entity Recognition (NER), dynamically catching person names, companies, and locations.
  - *Regex/Pattern Matching*: Detects AWS keys, API tokens, JWTs, and structured PII (credit cards, IBANs, etc.).
  - *Contextual Scanning*: Flag text based on intent (e.g., "confidential", "takeover", "due diligence").
- **Dynamic Policy Management**: Administrators use a responsive **React/Vite** dashboard to update security rules via Firebase Firestore, pushing updates to the extension in real-time.
- **Action Thresholds**: Calculates a risk score allowing different responses: `ALLOW`, `REDACT` (safely tokenize data), `WARN` (prompt user for confirmation), and `BLOCK` (prevent transmission entirely).

---

## 🏗️ Architecture

The project follows a modern decoupled architecture across three primary components:

### 1. The Core Engine (FastAPI)
The backend service processes interception requests. Designed to run locally or be deployed to Google Cloud Run, it evaluates the risk score of strings and returns actions.
- **Tech**: Python 3, FastAPI, spaCy, Uvicorn 
- **Location**: `./main.py`

### 2. The Policy Dashboard (React + Vite)
The admin-facing portal where security teams configure keyword rules, view activity logs, and manage policies. 
- **Tech**: React, Vite, TailwindCSS, Firebase (Firestore)
- **Location**: `./admin-dashboard/`

### 3. The Browser Extension (Vanilla JS)
A lightweight Chrome Extension that interfaces with the DOM of ChatGPT, Claude, and other target sites to read content before submission. Fast, low-latency communication with the API ensures no UX degradation.
- **Tech**: Vanilla JavaScript, Chrome Extension APIs v3
- **Location**: `./extension/`

---

## 🚀 Getting Started

To run the entire suite locally for development and testing:

### Prerequisites
- Node.js (v18+)
- Python 3.9+
- Google Chrome

### 1. Start the API Engine
```bash
# In the root directory, create a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies and download spaCy models
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# Start the FastAPI server
uvicorn main:app --reload
```
The API will be available at `http://localhost:8000`.

### 2. Start the Admin Dashboard
```bash
cd admin-dashboard
npm install
npm run dev
```
The dashboard will run on `http://localhost:5173`.

### 3. Load the Extension
1. Open Google Chrome and navigate to `chrome://extensions`.
2. Enable **Developer Mode** in the top right.
3. Click **Load Unpacked** and select the `extension/` folder from this repository.
4. Pin the PromptGuard icon to your toolbar. The tool will begin scanning inputs on targeted websites.

---

## 🛡️ Security & Privacy Notice
*This repository is built with a "zero-trust" approach. The Python engine is designed to run locally or wholly within a VPC, ensuring sensitive data never hits the open internet before being scrubbed.*

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
