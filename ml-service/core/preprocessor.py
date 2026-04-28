import os
import joblib
import pandas as pd
import numpy as np

# Define paths and load artifacts
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models')
model = joblib.load(os.path.join(MODEL_DIR, 'best_model.joblib'))
scaler = joblib.load(os.path.join(MODEL_DIR, 'scaler.joblib'))
model_columns = joblib.load(os.path.join(MODEL_DIR, 'model_columns.joblib'))
numeric_cols = scaler.feature_names_in_.tolist()

# Constants
RAW_FIELDS = [
    'months_as_customer', 'insured_sex', 'insured_education_level',
    'insured_occupation', 'insured_relationship', 'policy_deductable',
    'policy_annual_premium', 'umbrella_limit', 'policy_csl',
    'capital_gains', 'capital_loss', 'incident_hour_of_the_day',
    'incident_type', 'collision_type', 'incident_severity',
    'authorities_contacted', 'number_of_vehicles_involved',
    'bodily_injuries', 'witnesses', 'injury_claim', 'property_claim',
    'vehicle_claim', 'property_damage', 'police_report_available',
]

CATEGORICAL_FIELDS = {
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

FIELD_RENAMES = {
    'capital_gains': 'capital-gains',
    'capital_loss': 'capital-loss',
}

def preprocess_input(raw_data: dict) -> pd.DataFrame:
    """Convert raw 24-field input into model-ready 54-column DataFrame."""
    processed = pd.DataFrame(0, index=[0], columns=model_columns)

    _set_numeric_fields(raw_data, processed)
    _set_categorical_fields(raw_data, processed)

    # Scale numeric columns
    processed[numeric_cols] = scaler.transform(processed[numeric_cols])

    return processed

def _set_numeric_fields(raw_data: dict, processed: pd.DataFrame):
    """Map and extract numeric fields from the raw payload."""
    for field in RAW_FIELDS:
        model_field = FIELD_RENAMES.get(field, field)
        if model_field in model_columns and field in raw_data:
            try:
                processed[model_field] = float(raw_data[field])
            except (ValueError, TypeError):
                pass

def _set_categorical_fields(raw_data: dict, processed: pd.DataFrame):
    """One-hot encode categorical fields."""
    for field, prefix in CATEGORICAL_FIELDS.items():
        if field not in raw_data:
            continue
        value = str(raw_data[field])
        col_name = f"{prefix}_{value}"
        if col_name in model_columns:
            processed[col_name] = 1

def get_prediction_and_probability(processed_data: pd.DataFrame) -> tuple:
    """Return the prediction label ('Y'/'N') and the probability score."""
    prediction = model.predict(processed_data)[0]

    try:
        decision = model.decision_function(processed_data)[0]
        probability = float(1 / (1 + np.exp(-decision)))
    except AttributeError:
        probability = 0.5

    return 'Y' if prediction == 'Y' else 'N', probability

def get_model_column_count() -> int:
    return len(model_columns)
