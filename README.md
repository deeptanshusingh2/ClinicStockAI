# ClinicStock AI — VisionStock

> **"Scan the shelf. Review the evidence. Verify the stock."**  
> *AI drafts the inventory; authorized staff verify it.*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-teal.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38bdf8.svg)](https://tailwindcss.com)
[![Ollama](https://img.shields.io/badge/Ollama-Gemma%204-purple.svg)](https://ollama.ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 1. Executive Summary

Small healthcare facilities and rural clinics often struggle with manual stock counts, hard-to-read batch numbers, glare on expiry dates, and confusingly similar medicine packaging.

**VisionStock** transforms photographs of medicine shelves into structured, reviewable inventory records. It pairs vision-capable AI models with strict human-in-the-loop verification and transparent inventory rules:

1. **AI Visual Extraction**: Analyzes shelf photographs to draft medicine names, strengths, legible batch numbers, and visible package counts.
2. **Explicit Uncertainty Flagging**: Missing or glare-obscured expiry dates and batch codes are marked `null` with visual amber badges—**never hallucinated**.
3. **Authorized Human Verification**: Drafts are strictly excluded from confirmed inventory and expiry alerts until staff verify actual physical stock.
4. **Deterministic Expiry Risk Intelligence**: Proximity alerts (30d, 60d, 90d, 180d) calculated strictly from confirmed records.
5. **Quality & Evaluation Benchmarks**: Pre-annotated benchmark dataset reporting precision, completeness, and edge latency per PRD Section 13.

---

## 2. System Architecture

```
[ Medicine Shelf Photo (JPG/PNG/WEBP < 8MB) ]
                      │
                      ▼
[ FastAPI Backend Validation (Pillow: format & integrity) ]
                      │
                      ▼
[ Vision Inference (Live Gemma 4 via Ollama / Resilient Fallback Engine) ]
                      │
                      ▼
[ Schema Validation & Uncertainty Flagging (Pydantic v2) ]
                      │
                      ▼
[ React Split-Screen Review Interface ]
   ├─ Shelf photograph viewer with candidate bounding boxes
   └─ Editable Candidate Cards (Name, Strength, Batch, Expiry, Qty)
                      │
           ┌──────────┴──────────┐
           ▼                     ▼
     [ Verify & Confirm ]   [ Reject Draft ]
           │                     │
           ▼                     ▼
 [ SQLite Persistent DB ]   [ Marked Rejected ]
 (Status: verified)
           │
           ▼
[ Expiry Risk Engine ] (Configurable 30/60/90/180-day alerts)
           │
           ▼
[ Confirmed Inventory Dashboard & CSV Export ]
```

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS v4, Lucide Icons.
- **Backend**: Python 3.11, FastAPI, Pydantic v2, Pillow, HTTPX, SQLite3 (WAL mode).
- **AI / Vision**: Gemma 4 (`gemma4:e2b`) via Ollama with automated resilient fallback engine.
- **Testing**: Pytest with automated schema, uncertainty, and persistence test suites.

---

## 4. Quick Start Guide

### Prerequisites
- Python 3.11+
- Node.js v18+ & npm
- [Optional] Ollama with Gemma 4 (`ollama run gemma4:e2b`)

### 1. Clone & Configure
```bash
git clone https://github.com/your-org/ClinicStockAi.git
cd ClinicStockAi
cp .env.example .env
```

### 2. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
*Backend runs on `http://127.0.0.1:8000` (API docs at `http://127.0.0.1:8000/docs`).*

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```
*Frontend runs on `http://127.0.0.1:5173`.*

---

## 5. Running Ollama Locally

To run the live vision model:
```bash
# Pull and run Gemma 4 in Ollama
ollama run gemma4:e2b
```
The VisionStock header will instantly show a green status pill: `gemma4:e2b (Active)`. If Ollama is offline or warming up, the built-in resilient vision engine seamlessly processes audits with full uncertainty callouts.

---

## 6. Running Automated Tests

Run the backend test suite:
```bash
cd backend
python -m pytest tests/test_api.py -v
```

All 7 test suites validate:
- Image format & file size boundary checks (FR-01).
- Unreadable batch/expiry handling without hallucination (FR-02).
- Human-in-the-loop candidate verification (FR-04).
- Exclusion of unverified drafts from confirmed inventory (FR-05).
- Expiry date proximity calculations across thresholds (FR-06).
- AI benchmark metrics and latency calculations (Section 13).

---

## 7. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check & Ollama model connectivity |
| `GET` | `/api/ollama/status` | Live status of Ollama server & available models |
| `POST` | `/api/analyze` | Visual shelf audit (accepts file or `sample_name`) |
| `GET` | `/api/inventory` | Retrieve confirmed stock (supports `search` & `status`) |
| `POST` | `/api/inventory` | Manually add a confirmed inventory record |
| `PATCH` | `/api/inventory/{id}` | Update existing inventory record |
| `DELETE` | `/api/inventory/{id}` | Delete inventory record |
| `POST` | `/api/inventory/verify-candidate` | Verify AI draft into confirmed inventory |
| `GET` | `/api/alerts/expiry` | Expiry risk alerts (`?threshold_days=90`) |
| `GET` | `/api/sample-images` | List pre-annotated test shelf images |
| `GET` | `/api/evaluation` | Section 13 AI quality benchmark report |

---

## 8. Clinical & Regulatory Disclaimer

VisionStock is an inventory auditing assistance tool designed to eliminate manual data entry. **It does not provide medical recommendations, clinical advice, or automated dispensing decisions.** A date-based alert does not determine whether a pharmaceutical product is safe for patient use; authorized healthcare personnel must follow institutional protocols and statutory pharmaceutical regulations.

---

## 9. License

This project is licensed under the [MIT License](LICENSE).
