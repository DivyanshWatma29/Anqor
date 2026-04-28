# FraudShield.ai V2: ML Architecture Overhaul & Expansion Design

## 1. Overview
The current ML pipeline requires a structural overhaul to fix probability calculation bugs, scikit-learn version mismatches, and fragile categorical preprocessing. Simultaneously, the platform will expand to support Property and Life insurance claims, while mapping out Business and Liability for the future.

## 2. Component Overhaul (Fixing A, B, and C)

### 2.1 Backend Preprocessing & Prediction Fixes (Addressing B & C)
*   **Probability Calculation Fix:** The current `preprocessor.py` assumes all models have a `decision_function` (like SVM). Tree-based models (RandomForest) throw an `AttributeError` and default to a flat 0.5 probability. This will be fixed to use `model.predict_proba()` when available, ensuring accurate 0-100% confidence scores.
*   **Scikit-Learn Version Fix:** The Auto model is throwing an `InconsistentVersionWarning` (trained on 1.6.1, running on 1.7.2). We will completely retrain the Auto model using a generated script to match the current environment.
*   **Robust Categorical Encoding:** The current manual `get_dummies` string concatenation in `preprocessor.py` (`f"{prefix}_{value}"`) is fragile. The training scripts will be updated to use `sklearn.preprocessing.OneHotEncoder` or `DictVectorizer` saved as a `.joblib` artifact, ensuring inference exactly matches training.

### 2.2 Dataset & Feature Enrichment (Addressing A)
The synthetic data generation scripts will be heavily upgraded to produce more realistic patterns:
*   **Health:** Add complex fraud indicators like *Upcoding* (billing for more expensive procedures than performed) and *Ghost Billing* (claims for deceased patients or non-existent providers).
*   **Travel:** Enhance with *Phantom Policy* patterns (buying policy after the incident occurred) and *Exaggerated Delay* metrics.
*   **Auto:** Retrain with a highly realistic generated dataset mirroring the standard Kaggle vehicle claim dataset, mapping perfectly to the 24 frontend fields.

## 3. Multi-Model Expansion (Approach 3)

### 3.1 New Active Models
We will write data generation and training pipelines for:
*   **Property / Home Insurance:** Detecting arson, exaggerated weather damage, and inflated repair estimates. Features: `home_age`, `claim_amount`, `weather_conditions`, `police_report`, `repair_estimate_ratio`.
*   **Life Insurance:** Detecting fake deaths and contestable period fraud. Features: `policy_duration_months`, `cause_of_death`, `nominee_relationship`, `medical_history_disclosed`.

### 3.2 Roadmap Models (Stubbed)
*   **Business Insurance & Liability Insurance:** Added to `insuranceTypes.ts` with `isAvailable: false`. They will render the "Manual Form Not Available - Under Construction" UI, demonstrating the platform's enterprise vision without overloading the current HuggingFace instance.

## 4. Execution Flow
1. Write a unified `train_all_models.py` script that generates robust synthetic data and trains Auto, Health, Travel, Property, and Life models using a standardized `Pipeline` (StandardScaler + OneHotEncoder + RandomForest).
2. Rewrite `preprocessor.py` to use the standardized sklearn pipelines instead of manual pandas manipulation, fixing the probability bug.
3. Update `insuranceTypes.ts` with the new categories and fields.
4. Deploy updated models to HuggingFace and frontend to Vercel.
