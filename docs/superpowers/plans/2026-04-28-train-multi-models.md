# Universal Multi-Model Insurance Fraud Training & Deployment Plan

## Overview
A fully automated, end-to-end pipeline to acquire data, train new Machine Learning models for Health and Travel insurance, integrate them into the Flask Model Registry, and update the React frontend schemas.

## Architecture
1. **Data Acquisition:** The AI will execute a Python script to fetch open-source datasets (or generate high-fidelity synthetic datasets mimicking the Kaggle structure if GitHub blocks the automated download).
2. **Model Training:** `scikit-learn` will train distinct `health_model.joblib` and `travel_model.joblib` artifacts using RandomForest/XGBoost.
3. **Backend Integration:** The trained models will be moved to `ml-service/models/health/` and `ml-service/models/travel/`.
4. **Frontend Integration:** `insuranceTypes.ts` will be updated to set `isAvailable: true` for these models.

## Implementation Steps
1. **Script Generation:** Write `acquire_and_train.py` in `ml-service/`.
2. **Data Generation/Download:** Run the script to produce `health_fraud.csv` and `travel_fraud.csv`.
3. **Training Pipeline:** The script will preprocess the data, train the classifiers, and export the `.joblib` artifacts to their respective folders.
4. **UI Update:** Update the React schema so the dropdowns unlock Health and Travel insurance.
5. **Deployment:** Commit to Git, push to Vercel, and push the new backend models to Hugging Face Spaces.