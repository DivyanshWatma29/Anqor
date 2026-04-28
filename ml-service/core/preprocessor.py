import os
import joblib
import pandas as pd
import numpy as np

MODEL_BASE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models')

# Model Registry
REGISTRY = {}

def load_models():
    """Dynamically load all models from the models directory."""
    if not os.path.exists(MODEL_BASE_DIR):
        return

    for claim_type in os.listdir(MODEL_BASE_DIR):
        type_dir = os.path.join(MODEL_BASE_DIR, claim_type)
        if os.path.isdir(type_dir):
            try:
                model = joblib.load(os.path.join(type_dir, 'best_model.joblib'))
                scaler = joblib.load(os.path.join(type_dir, 'scaler.joblib'))
                model_columns = joblib.load(os.path.join(type_dir, 'model_columns.joblib'))
                numeric_cols = scaler.feature_names_in_.tolist()

                REGISTRY[claim_type] = {
                    'model': model,
                    'scaler': scaler,
                    'columns': model_columns,
                    'numeric_cols': numeric_cols
                }
                print(f"Loaded {claim_type} model successfully.")
            except Exception as e:
                print(f"Failed to load {claim_type} model: {e}")

# Load models at startup
load_models()

# --- AUTO INSURANCE CONSTANTS ---
AUTO_RAW_FIELDS = [
    'months_as_customer', 'insured_sex', 'insured_education_level',
    'insured_occupation', 'insured_relationship', 'policy_deductable',
    'policy_annual_premium', 'umbrella_limit', 'policy_csl',
    'capital_gains', 'capital_loss', 'incident_hour_of_the_day',
    'incident_type', 'collision_type', 'incident_severity',
    'authorities_contacted', 'number_of_vehicles_involved',
    'bodily_injuries', 'witnesses', 'injury_claim', 'property_claim',
    'vehicle_claim', 'property_damage', 'police_report_available',
]

AUTO_CATEGORICAL_FIELDS = {
    'policy_csl': 'policy_csl',
    'insured_sex': 'insured_sex',
    'insured_education_level': 'insured_education_level',
    'insured_occupation': 'insured_occupation',
    'insured_relationship': 'insured_relationship',
    'incident_type': 'incident_type',
    'collision_type': 'collision_type',
    'incident_severity': 'incident_severity',
    'authorities_contacted': 'authorities_contacted',
    'property_damage': 'property_damage',
    'police_report_available': 'police_report_available',
}

AUTO_FIELD_RENAMES = {
    'capital_gains': 'capital-gains',
    'capital_loss': 'capital-loss',
}

def get_required_fields(claim_type: str) -> list:
    if claim_type == 'auto':
        return AUTO_RAW_FIELDS
    # Future models will return their own fields
    return []

def preprocess_input(claim_type: str, raw_data: dict) -> pd.DataFrame:
    """Preprocess data for a specific model type."""
    if claim_type not in REGISTRY:
        raise ValueError(f"Model for claim type '{claim_type}' not found.")

    model_artifacts = REGISTRY[claim_type]
    model_columns = model_artifacts['columns']
    scaler = model_artifacts['scaler']
    numeric_cols = model_artifacts['numeric_cols']

    processed = pd.DataFrame(0, index=[0], columns=model_columns)

    if claim_type == 'auto':
        _set_numeric_fields_auto(raw_data, processed, model_columns)
        _set_categorical_fields_auto(raw_data, processed, model_columns)

    # Scale numeric columns
    processed[numeric_cols] = scaler.transform(processed[numeric_cols])

    return processed

def _set_numeric_fields_auto(raw_data: dict, processed: pd.DataFrame, model_columns: list):
    for field in AUTO_RAW_FIELDS:
        model_field = AUTO_FIELD_RENAMES.get(field, field)
        if model_field in model_columns and field in raw_data:
            try:
                processed[model_field] = float(raw_data[field])
            except (ValueError, TypeError):
                pass

def _set_categorical_fields_auto(raw_data: dict, processed: pd.DataFrame, model_columns: list):
    for field, prefix in AUTO_CATEGORICAL_FIELDS.items():
        if field not in raw_data:
            continue
        value = str(raw_data[field])
        col_name = f"{prefix}_{value}"
        if col_name in model_columns:
            processed[col_name] = 1

def get_prediction_and_probability(claim_type: str, processed_data: pd.DataFrame) -> tuple:
    """Return the prediction label ('Y'/'N') and the probability score."""
    if claim_type not in REGISTRY:
        raise ValueError(f"Model for claim type '{claim_type}' not found.")

    model = REGISTRY[claim_type]['model']
    prediction = model.predict(processed_data)[0]

    try:
        decision = model.decision_function(processed_data)[0]
        probability = float(1 / (1 + np.exp(-decision)))
    except AttributeError:
        probability = 0.5

    return 'Y' if prediction == 'Y' else 'N', probability

def get_model_column_count(claim_type: str) -> int:
    if claim_type in REGISTRY:
        return len(REGISTRY[claim_type]['columns'])
    return 0

def get_available_models() -> list:
    return list(REGISTRY.keys())
