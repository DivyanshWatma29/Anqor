# Anqor

An AI-powered insurance fraud detection platform that uses 5 specialised XGBoost models to identify fraudulent claims across Auto, Health, Travel, Life, and Property insurance — and explains **why** each claim was flagged.

## Why This Exists

Insurance fraud costs the industry **$80+ billion annually**. Traditional claim review is manual, slow, and inconsistent. Anqor automates this process — an adjuster can input claim details, upload a document, or batch-process an entire CSV, and get an instant fraud probability score backed by trained ML models, with a structured explanation of what triggered the flag.

## What It Does

- **Single Claim Prediction** — Fill in claim details through a guided form for any of the 5 insurance types. The system returns a fraud probability, risk level, fraud explanation with categorised reasons, and SHAP feature importance.
- **"Why Is This Fraud?"** — Every prediction includes a plain-English explanation: financial red flags, behavioral patterns, missing documentation, temporal anomalies, and ML-identified statistical signals — each with severity ratings and actionable recommendations.
- **Document AI Extraction** — Upload a claim PDF or image. GPT-4o-mini extracts structured fields automatically, auto-detects the insurance category, and pre-fills the prediction form.
- **Bulk CSV Processing** — Upload CSV/Excel files with up to 5,000 claims for batch fraud analysis with exportable CSV/PDF results.
- **Analytics Dashboard** — Visualize fraud trends, claim distributions, and risk breakdowns with interactive charts.
- **Guest Mode** — All prediction features work without an account. Auth unlocks saved history and dashboards.

## How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────────┐
│  React Frontend │────▶│  Flask ML Service │────▶│  5× XGBoost Models │
│  (Vite + TS)    │     │  (scikit-learn)   │     │  + Fraud Explainer │
└────────┬────────┘     └──────────────────┘     └────────────────────┘
         │
         ├──▶ InsForge (Auth + PostgreSQL)
         └──▶ InsForge AI Gateway (GPT-4o-mini for Document AI)
```

1. User submits claim data (manual form, document upload, or CSV)
2. Frontend sends features to the Flask ML API
3. XGBoost pipeline returns fraud probability + SHAP importance
4. Explainer module generates structured reasons (rule-based + ML-based)
5. Results displayed with risk meter, categorised explanations, and recommendations

## Model Performance

| Model | F1 Score | AUC-ROC | Training Data |
|-------|----------|---------|---------------|
| Health | **0.994** | **0.999** | 10,000 claims |
| Property | **0.936** | 0.906 | 5,000 claims |
| Life | 0.882 | 0.721 | 5,000 claims |
| Travel | 0.864 | 0.813 | 63,326 claims |
| Auto | 0.809 | 0.833 | 1,000 claims |

## Tech Stack

| Layer | Technology |
|-------|-----------:|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion |
| ML Service | Python 3.10, Flask, scikit-learn 1.7.2, XGBoost, pandas, NumPy |
| Auth & DB | InsForge (Supabase-compatible PostgreSQL BaaS) |
| Document AI | GPT-4o-mini via InsForge AI Gateway |
| Charts | Recharts |
| Data Fetching | TanStack React Query |
| Deployment | Vercel (frontend), Hugging Face Spaces Docker (ML API) |

## Project Structure

```
fraud.ai/
├── src/                          # React frontend
│   ├── pages/                    # Route-level components
│   ├── components/               # Reusable UI (ClaimForm, PredictionResult, RiskMeter...)
│   │   └── ui/                   # shadcn/ui primitives
│   ├── schemas/
│   │   └── insuranceTypes.ts     # Source of truth for all form fields
│   ├── lib/                      # API clients, Document AI, utilities
│   ├── contexts/                 # Auth context
│   └── hooks/
├── ml-service/                   # Python ML backend
│   ├── app.py                    # Flask API (v3.1) — 20+ endpoints
│   ├── core/                     # preprocessor, indicators, explainer, SHAP, PDF
│   ├── models/                   # 5× trained pipelines (.joblib) + feature configs
│   ├── scripts/                  # Training & upload scripts
│   └── Dockerfile                # HF Spaces deployment
├── public/                       # Static assets (sample CSV, fonts)
└── CLAUDE.md                     # AI assistant project context
```

## User Walkthrough

1. **Predict Claim** — Select insurance type (Auto, Health, Travel, Life, Property). Fill in claim fields. Hit "Analyze Claim" → get fraud probability, risk level, categorised reasons, and SHAP feature importance.
2. **Upload Document** — Upload a claim PDF or image. GPT-4o-mini extracts fields automatically and pre-fills the form. Review and submit.
3. **Bulk Check** — Upload a CSV/Excel file with up to 5,000 claims. Get batch fraud predictions with exportable CSV/PDF results.
4. **Dashboard** — View fraud trends, claim distributions, and risk breakdowns (requires login).

## Getting Started

### Prerequisites

- Node.js v18+
- Python 3.10+

### 1. Clone the repository

```bash
git clone https://github.com/DivyanshWatma29/fraud-shield-ai.git
cd fraud-shield-ai
```

### 2. Set up environment variables

Create a `.env` file in the project root:

```env
VITE_INSFORGE_URL=<your-insforge-project-url>
VITE_INSFORGE_ANON_KEY=<your-insforge-anon-key>
VITE_ML_SERVICE_URL=http://localhost:5000
```

### 3. Start the frontend

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:8081`.

### 4. Start the ML service

```bash
cd ml-service
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python3 app.py
```

The ML API will be available at `http://localhost:5000`.

## Deployment

- **Frontend** is deployed on Vercel with automatic builds from the `master` branch.
- **ML Service** is containerized and deployed on Hugging Face Spaces using the included Dockerfile.

## License

This project was built as part of an academic course on Insurance & Security Systems.
