import os
import joblib
import pandas as pd
import numpy as np

MODEL_BASE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models')
REGISTRY = {}

def load_models():
    if not os.path.exists(MODEL_BASE_DIR): return
    for claim_type in os.listdir(MODEL_BASE_DIR):
        type_dir = os.path.join(MODEL_BASE_DIR, claim_type)
        if os.path.isdir(type_dir):
            try:
                pipeline = joblib.load(os.path.join(type_dir, 'pipeline.joblib'))
                sample = joblib.load(os.path.join(type_dir, 'sample.joblib'))
                REGISTRY[claim_type] = {'pipeline': pipeline, 'sample': sample}
                print(f"Loaded {claim_type} model successfully.")
            except Exception as e:
                pass

load_models()

def get_required_fields(claim_type: str) -> list:
    if claim_type in REGISTRY:
        return list(REGISTRY[claim_type]['sample'].columns)
    return []

def preprocess_input(claim_type: str, raw_data: dict) -> pd.DataFrame:
    if claim_type not in REGISTRY:
        raise ValueError(f"Model '{claim_type}' not found.")
    
    sample = REGISTRY[claim_type]['sample'].copy()
    
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

def get_prediction_and_probability(claim_type: str, processed_data: pd.DataFrame) -> tuple:
    if claim_type not in REGISTRY:
        raise ValueError(f"Model '{claim_type}' not found.")
    
    pipeline = REGISTRY[claim_type]['pipeline']
    prediction = pipeline.predict(processed_data)[0]
    
    try:
        # For RandomForest/tree models, get probability of class 'Y'
        classes = list(pipeline.classes_)
        if 'Y' in classes:
            idx = classes.index('Y')
            probability = float(pipeline.predict_proba(processed_data)[0][idx])
        else:
            probability = 0.5
    except AttributeError:
        try:
            decision = pipeline.decision_function(processed_data)[0]
            probability = float(1 / (1 + np.exp(-decision)))
        except AttributeError:
            probability = 0.5

    return prediction, probability

def get_model_column_count(claim_type: str) -> int:
    if claim_type in REGISTRY:
        return len(REGISTRY[claim_type]['sample'].columns)
    return 0

def get_available_models() -> list:
    return list(REGISTRY.keys())
