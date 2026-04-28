# FraudShield.ai

An AI-powered insurance fraud detection platform that combines machine learning with document intelligence to identify fraudulent claims in real time.

## Why This Exists

Insurance fraud costs the industry billions annually. Traditional claim review is manual, slow, and inconsistent. FraudShield.ai automates this process — an adjuster can input claim details, upload a document, or batch-process an entire CSV, and get an instant fraud probability score backed by a trained SVM model.

## What It Does

- **Single Claim Prediction** — Fill in claim details through a guided form. The system returns a fraud probability score, risk level classification, and key risk indicators.
- **Document AI Extraction** — Upload a claim PDF or image. GPT-4o-mini extracts structured fields automatically, eliminating manual data entry.
- **Bulk CSV Processing** — Upload a CSV of claims for batch fraud analysis with exportable results.
- **Analytics Dashboard** — Visualize fraud trends, claim distributions, and risk breakdowns with interactive Recharts graphs.
- **Guest Mode** — Try predictions without creating an account. Results stay in-memory and are not persisted.

## How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   React Frontend│────▶│  Flask ML Service │────▶│  SVM Classifier │
│   (Vite + TS)   │     │  (scikit-learn)   │     │  (trained model)│
└────────┬────────┘     └──────────────────┘     └─────────────────┘
         │
         ├──▶ InsForge (Auth + PostgreSQL)
         └──▶ InsForge AI Gateway (GPT-4o-mini for Document AI)
```

1. User submits claim data (manual form, document upload, or CSV)
2. Frontend sends features to the Flask ML API
3. SVM model returns fraud probability + risk factors
4. Results are displayed with a visual risk meter and stored in the database (for authenticated users)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion |
| ML Service | Python 3.10, Flask, scikit-learn, pandas, NumPy |
| Database & Auth | InsForge (Supabase-compatible PostgreSQL BaaS) |
| Document AI | GPT-4o-mini via InsForge AI Gateway |
| Data Fetching | TanStack React Query |
| Charts | Recharts |
| Deployment | Vercel (frontend), Hugging Face Spaces (ML API) |

## Project Structure

```
fraud.ai/
├── src/
│   ├── pages/              # Route-level page components
│   ├── components/         # Reusable UI components
│   │   └── ui/             # shadcn/ui primitives
│   ├── contexts/           # React context providers (Auth, Theme)
│   ├── hooks/              # Custom React hooks
│   └── lib/                # API clients, utilities, document AI logic
│       ├── api.ts          # ML service + InsForge API calls
│       ├── documentAI.ts   # GPT-4o-mini document extraction
│       ├── insforge.ts     # InsForge client initialization
│       └── pdfGenerator.ts # PDF report generation
├── ml-service/
│   ├── app.py              # Flask API server
│   ├── models/             # Trained SVM model + scaler + columns (.joblib)
│   ├── data/               # Training dataset
│   ├── notebooks/          # Jupyter notebook for model training & evaluation
│   ├── Dockerfile          # Hugging Face Spaces deployment
│   └── requirements.txt    # Python dependencies
├── public/
│   └── sample_claims.csv   # Sample CSV for bulk check demo
├── package.json
├── tailwind.config.ts
├── vite.config.ts
└── tsconfig.json
```

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

## ML Model

The fraud detection model is a Support Vector Machine (SVM) trained on ~1,000 labeled insurance claims. The training pipeline is documented in `ml-service/notebooks/Insurance_Fraud_Detection_.ipynb`.

**Input features include:** policy details, incident type, severity, claim amounts, number of vehicles, bodily injuries, witnesses, and more.

**Output:** Fraud probability score (0-100%) with risk level classification (Low / Medium / High).

## Deployment

- **Frontend** is deployed on Vercel with automatic builds from the `master` branch.
- **ML Service** is containerized and deployed on Hugging Face Spaces using the included Dockerfile.

## License

This project was built as part of an academic course on Insurance & Security Systems.
