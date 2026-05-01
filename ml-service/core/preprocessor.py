import os
import joblib
import pandas as pd
import numpy as np

MODEL_BASE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models')
REGISTRY = {}

# --- LEGACY AUTO INSURANCE CONSTANTS ---
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

def load_models():
    if not os.path.exists(MODEL_BASE_DIR): return
    for claim_type in os.listdir(MODEL_BASE_DIR):
        type_dir = os.path.join(MODEL_BASE_DIR, claim_type)
        if not os.path.isdir(type_dir): continue
        
        # Check if new Pipeline style
        if os.path.exists(os.path.join(type_dir, 'pipeline.joblib')):
            try:
                pipeline = joblib.load(os.path.join(type_dir, 'pipeline.joblib'))
                sample = joblib.load(os.path.join(type_dir, 'sample.joblib'))
                REGISTRY[claim_type] = {'type': 'pipeline', 'pipeline': pipeline, 'sample': sample}
                print(f"Loaded {claim_type} (Pipeline) model successfully.")
            except (FileNotFoundError, EOFError, ValueError, ImportError, KeyError) as e:
                print(f"Failed to load {claim_type} pipeline model: {e}")
        
        # Check if legacy style (like the original auto model)
        elif os.path.exists(os.path.join(type_dir, 'best_model.joblib')):
            try:
                model = joblib.load(os.path.join(type_dir, 'best_model.joblib'))
                scaler = joblib.load(os.path.join(type_dir, 'scaler.joblib'))
                model_columns = joblib.load(os.path.join(type_dir, 'model_columns.joblib'))
                numeric_cols = scaler.feature_names_in_.tolist()
                REGISTRY[claim_type] = {
                    'type': 'legacy', 'model': model, 'scaler': scaler, 
                    'columns': model_columns, 'numeric_cols': numeric_cols
                }
                print(f"Loaded {claim_type} (Legacy) model successfully.")
            except (FileNotFoundError, EOFError, ValueError, ImportError, KeyError) as e:
                print(f"Failed to load {claim_type} legacy model: {e}")

load_models()

def get_required_fields(claim_type: str) -> list:
    if claim_type not in REGISTRY: return []
    if REGISTRY[claim_type]['type'] == 'pipeline':
        return list(REGISTRY[claim_type]['sample'].columns)
    elif REGISTRY[claim_type]['type'] == 'legacy':
        if claim_type == 'auto': return AUTO_RAW_FIELDS
    return []

def preprocess_input(claim_type: str, raw_data: dict) -> pd.DataFrame:
    if claim_type not in REGISTRY:
        raise ValueError(f"Model '{claim_type}' not found.")
    
    config = REGISTRY[claim_type]
    
    if config['type'] == 'pipeline':
        sample = config['sample'].copy()
        for col in sample.columns:
            if col in raw_data:
                if sample[col].dtype in ['int64', 'float64', 'int32']:
                    try:
                        sample.loc[0, col] = float(raw_data[col])
                    except ValueError:
                        sample.loc[0, col] = 0.0
                else:
                    sample.loc[0, col] = str(raw_data[col])
        return sample
        
    elif config['type'] == 'legacy':
        model_columns = config['columns']
        scaler = config['scaler']
        numeric_cols = config['numeric_cols']
        
        processed = pd.DataFrame(0, index=[0], columns=model_columns)
        
        if claim_type == 'auto':
            for field in AUTO_RAW_FIELDS:
                model_field = AUTO_FIELD_RENAMES.get(field, field)
                if model_field in model_columns and field in raw_data:
                    try:
                        processed[model_field] = float(raw_data[field])
                    except (ValueError, TypeError):
                        pass

            for field, prefix in AUTO_CATEGORICAL_FIELDS.items():
                if field not in raw_data: continue
                col_name = f"{prefix}_{str(raw_data[field])}"
                if col_name in model_columns:
                    processed[col_name] = 1
                    
        processed[numeric_cols] = scaler.transform(processed[numeric_cols])
        return processed

def get_prediction_and_probability(claim_type: str, processed_data: pd.DataFrame) -> tuple:
    if claim_type not in REGISTRY:
        raise ValueError(f"Model '{claim_type}' not found.")
    
    config = REGISTRY[claim_type]
    
    if config['type'] == 'pipeline':
        pipeline = config['pipeline']
        prediction = pipeline.predict(processed_data)[0]
        try:
            classes = list(pipeline.classes_)
            if 'Y' in classes:
                idx = classes.index('Y')
                probability = float(pipeline.predict_proba(processed_data)[0][idx])
            else:
                probability = 0.5
        except AttributeError:
            probability = 0.5
            
    elif config['type'] == 'legacy':
        model = config['model']
        prediction = model.predict(processed_data)[0]
        try:
            decision = model.decision_function(processed_data)[0]
            probability = float(1 / (1 + np.exp(-decision)))
        except AttributeError:
            probability = 0.5

    return prediction, probability

def get_model_column_count(claim_type: str) -> int:
    if claim_type in REGISTRY:
        if REGISTRY[claim_type]['type'] == 'pipeline':
            return len(REGISTRY[claim_type]['sample'].columns)
        else:
            return len(REGISTRY[claim_type]['columns'])
    return 0

def get_available_models() -> list:
    return list(REGISTRY.keys())
