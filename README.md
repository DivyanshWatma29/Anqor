# Insurance Fraud Detection System

A machine learning-based web application for detecting fraudulent insurance claims. This project integrates a predictive machine learning model with a React frontend dashboard for real-time analysis and data visualization.

## Project Overview

The system allows users to manually input claim details or upload claim documents for automated field extraction. It then evaluates the data against a trained Support Vector Machine (SVM) model to output a fraud probability score and identify risk indicators.

### Key Components

1. **Frontend Dashboard**: Built with React and Tailwind CSS. Provides interfaces for single claim prediction, bulk CSV uploads, and analytical dashboards using Recharts.
2. **Machine Learning API**: A Python/Flask backend that serves the pre-trained classification model.
3. **Data Storage**: Supabase (PostgreSQL) is used to persist claim history and provide authentication.
4. **Document Analysis**: Integration with Vision AI to extract structured text from uploaded claim PDFs and images.

## Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS
- **Backend / ML Service**: Python 3.10, Flask, scikit-learn, pandas
- **Database & Auth**: Supabase (PostgreSQL)
- **State Management**: TanStack Query

## Repository Structure

```
.
├── src/                  # React application source code
│   ├── components/       # UI components and layout
│   ├── contexts/         # React Context providers
│   ├── lib/              # API and utility functions
│   └── pages/            # Route components
├── ml-service/           # Machine Learning backend
│   ├── models/           # Serialized ML models (.pkl)
│   ├── app.py            # Flask API entry point
│   └── requirements.txt  # Python dependencies
└── package.json          # Node.js dependencies
```

## Local Development Setup

### 1. Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### 2. Frontend Setup
Install the necessary JavaScript dependencies:
```bash
npm install
```

Start the Vite development server:
```bash
npm run dev
```

### 3. ML Service Setup
Navigate to the machine learning directory and set up a virtual environment:
```bash
cd ml-service
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Start the Flask server:
```bash
python3 app.py
```
The ML API will run on `http://localhost:5000` and the React frontend will run on `http://localhost:8081` (or whichever port Vite assigns).
