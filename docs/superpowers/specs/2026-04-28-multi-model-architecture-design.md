# Multi-Model Insurance Fraud Architecture

## Overview
A major architectural expansion of FraudShield.ai to evolve from a single Auto Insurance model into a Universal Insurance Fraud Gateway. The system will support multiple claim categories (Auto, Health, Travel, Property) by utilizing a dynamic model registry, schema-driven UIs, and targeted data extraction.

## 1. Data Acquisition Strategy
To maintain scientific validity, we rely exclusively on real-world datasets rather than synthetic generation.
- **Auto:** (Already implemented)
- **Health:** We will scrape Kaggle for Medicare/Provider fraud datasets (e.g., predicting fraudulent billing or patient claims).
- **Property/Travel:** We will search Kaggle/GitHub for datasets containing features like `damage_type`, `weather_conditions`, or `flight_delay_hours`.
- *Note:* If a dataset cannot be sourced for a specific category (e.g., specialized Cyber Insurance), that category will be omitted from the platform until data is acquired.

## 2. Dynamic Model Registry (Flask Backend)
The Flask backend will be refactored from a monolithic script into a routing gateway.
- **Model Storage:** The `models/` directory will hold subdirectories for each category (e.g., `models/auto/`, `models/health/`). Each will contain its own `model.joblib`, `scaler.joblib`, and `model_columns.joblib`.
- **The Registry:** At startup, Flask will load all available models into a dictionary registry.
- **Routing:** The `/predict` endpoint will require a `claim_type` parameter. The backend will route the payload to the corresponding preprocessor and model.

## 3. Dynamic Frontend Schema
Instead of hardcoding 24 fields, the frontend will be driven by configuration schemas.
- **Schema Definitions:** We will create a `schemas/` directory defining the required fields, data types, and default values for each insurance type.
- **Dynamic Forms:** The `<ClaimForm />` component will read the schema based on the user's selected `claim_type` and render the appropriate text, number, and select inputs dynamically.
- **UX Flow:** The user must select the `claim_type` (Auto, Health, etc.) before uploading documents, processing CSVs, or filling out manual forms.

## 4. Context-Aware AI Extraction
The Document AI and Bulk CSV mapping logic will become context-aware.
- **Document AI:** The extraction prompt will dynamically inject the target schema based on the user's selected `claim_type`. It will only look for fields relevant to that specific insurance type.
- **Bulk CSV:** The AI header mapping will map the user's CSV headers strictly to the schema of the selected `claim_type`.

## Implementation Phasing
1. **Phase 1: Dataset Acquisition & Training**
   - Source datasets from Kaggle.
   - Clean data, train SVM/XGBoost models, and save `.joblib` artifacts.
2. **Phase 2: Backend Refactor**
   - Implement the Model Registry and dynamic `/predict` routing.
3. **Phase 3: Frontend Dynamic UI**
   - Create schema configuration files.
   - Update `<ClaimForm />`, `PredictPage`, and `BulkCheckPage` to require category selection and render dynamically.
4. **Phase 4: AI Context Injection**
   - Update `documentAI.ts` to accept a `claim_type` and dynamically construct the GPT-4o-mini prompts.