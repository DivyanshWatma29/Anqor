"""
Anqor — Core Preprocessor
====================================
Loads trained pipeline models, preprocesses input, and runs predictions.
Supports both new Pipeline models and legacy models.
"""
import os
import json
import joblib
import pandas as pd
import numpy as np

MODEL_BASE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models')
REGISTRY = {}


def load_models():
    """Load all available models from the models directory."""
    if not os.path.exists(MODEL_BASE_DIR):
        print(f"WARNING: Model directory not found: {MODEL_BASE_DIR}")
        return
    
    for claim_type in os.listdir(MODEL_BASE_DIR):
        type_dir = os.path.join(MODEL_BASE_DIR, claim_type)
        if not os.path.isdir(type_dir):
            continue
        
        pipeline_path = os.path.join(type_dir, 'pipeline.joblib')
        sample_path = os.path.join(type_dir, 'sample.joblib')
        config_path = os.path.join(type_dir, 'feature_config.json')
        metrics_path = os.path.join(type_dir, 'metrics.json')
        
        if os.path.exists(pipeline_path):
            try:
                pipeline = joblib.load(pipeline_path)
                sample = joblib.load(sample_path) if os.path.exists(sample_path) else None
                
                config = {}
                if os.path.exists(config_path):
                    with open(config_path, 'r') as f:
                        config = json.load(f)
                
                metrics = {}
                if os.path.exists(metrics_path):
                    with open(metrics_path, 'r') as f:
                        metrics = json.load(f)
                
                REGISTRY[claim_type] = {
                    'type': 'pipeline',
                    'pipeline': pipeline,
                    'sample': sample,
                    'config': config,
                    'metrics': metrics,
                }
                print(f"  ✅ Loaded {claim_type} model ({config.get('display_name', claim_type)})")
            except Exception as e:
                print(f"  ❌ Failed to load {claim_type}: {e}")

print("Loading models...")
load_models()
print(f"Models ready: {list(REGISTRY.keys())}")


# === FEATURE ENGINEERING FUNCTIONS ===
# These MUST match what was done during training

def _engineer_auto_features(df):
    """Add derived features for auto insurance."""
    df = df.copy()
    # Rename capital-gains/loss
    if 'capital-gains' in df.columns:
        df = df.rename(columns={'capital-gains': 'capital_gains', 'capital-loss': 'capital_loss'})
    
    injury = pd.to_numeric(df.get('injury_claim', 0), errors='coerce').fillna(0)
    prop = pd.to_numeric(df.get('property_claim', 0), errors='coerce').fillna(0)
    vehicle = pd.to_numeric(df.get('vehicle_claim', 0), errors='coerce').fillna(0)
    premium = pd.to_numeric(df.get('policy_annual_premium', 1), errors='coerce').fillna(1)
    
    df['total_claim'] = injury + prop + vehicle
    df['claim_to_premium_ratio'] = df['total_claim'] / (premium + 1)
    df['vehicle_claim_ratio'] = vehicle / (df['total_claim'] + 1)
    return df

def _engineer_health_features(df):
    """Add derived features for health insurance."""
    df = df.copy()
    claim = pd.to_numeric(df.get('Claim_Amount', 0), errors='coerce').fillna(0)
    approved = pd.to_numeric(df.get('Approved_Amount', 0), errors='coerce').fillna(0)
    stay = pd.to_numeric(df.get('Length_of_Stay', 0), errors='coerce').fillna(0)
    visits = pd.to_numeric(df.get('Prior_Visits_12m', 0), errors='coerce').fillna(0)
    
    df['approval_ratio'] = approved / (claim + 1)
    df['claim_discrepancy'] = claim - approved
    df['claim_per_day'] = claim / (stay + 1)
    df['is_high_claim'] = (claim > claim.quantile(0.9) if len(df) > 1 else 0).astype(int) if len(df) > 1 else 0
    df['visits_per_month'] = visits / 12.0
    return df

def _engineer_travel_features(df):
    """Add derived features for travel insurance."""
    df = df.copy()
    duration = pd.to_numeric(df.get('duration', 1), errors='coerce').fillna(1).clip(lower=1)
    net_sales = pd.to_numeric(df.get('net_sales', 0), errors='coerce').fillna(0)
    commission = pd.to_numeric(df.get('commission', 0), errors='coerce').fillna(0)
    age = pd.to_numeric(df.get('age', 30), errors='coerce').fillna(30)
    
    df['sales_per_day'] = (net_sales / duration).clip(-1000, 1000)
    df['commission_ratio'] = (commission / net_sales.abs().clip(lower=0.01)).clip(-100, 100)
    df['is_long_trip'] = (duration > 30).astype(int)
    df['is_negative_sales'] = (net_sales < 0).astype(int)
    
    def age_bucket(a):
        if a < 25: return 'young'
        elif a < 35: return 'adult'
        elif a < 50: return 'middle'
        elif a < 65: return 'senior'
        else: return 'elderly'
    df['age_group'] = age.apply(age_bucket)
    return df

def _engineer_life_features(df):
    """Add derived features for life insurance."""
    df = df.copy()
    months = pd.to_numeric(df.get('policy_duration_months', 24), errors='coerce').fillna(24)
    df['is_early_claim'] = (months < 24).astype(int)
    df['is_very_early_claim'] = (months < 6).astype(int)
    df['policy_years'] = months / 12.0
    return df

def _engineer_property_features(df):
    """Add derived features for property insurance."""
    df = df.copy()
    age = pd.to_numeric(df.get('home_age', 15), errors='coerce').fillna(15)
    estimate = pd.to_numeric(df.get('repair_estimate', 10000), errors='coerce').fillna(10000)
    weather = df.get('weather_conditions', pd.Series(['Normal']))
    
    df['is_old_property'] = (age > 50).astype(int)
    df['is_high_estimate'] = (estimate > 50000).astype(int)
    df['estimate_per_year'] = estimate / (age + 1)
    df['is_severe_weather'] = weather.isin(['Hurricane', 'Storm']).astype(int)
    return df

FEATURE_ENGINEERS = {
    'auto': _engineer_auto_features,
    'health': _engineer_health_features,
    'travel': _engineer_travel_features,
    'life': _engineer_life_features,
    'property': _engineer_property_features,
}


def get_required_fields(claim_type: str) -> list:
    """Get the list of user-facing fields for a claim type."""
    if claim_type not in REGISTRY:
        return []
    
    config = REGISTRY[claim_type].get('config', {})
    if config and 'field_groups' in config:
        fields = []
        for group in config['field_groups']:
            for field in group.get('fields', []):
                fields.append(field['name'])
        return fields
    
    # Fallback: use sample columns
    sample = REGISTRY[claim_type].get('sample')
    if sample is not None:
        return list(sample.columns)
    return []


def get_feature_config(claim_type: str) -> dict:
    """Get the full feature config for a claim type."""
    if claim_type not in REGISTRY:
        return {}
    return REGISTRY[claim_type].get('config', {})


def preprocess_input(claim_type: str, raw_data: dict) -> pd.DataFrame:
    """Convert raw user input into a DataFrame ready for the pipeline."""
    if claim_type not in REGISTRY:
        raise ValueError(f"Model '{claim_type}' not found.")
    
    config = REGISTRY[claim_type]
    sample = config.get('sample')
    
    if sample is None:
        raise ValueError(f"No sample data for model '{claim_type}'")
    
    # Start with a copy of the sample (ensures all columns exist with correct dtypes)
    df = sample.copy()
    
    # Fill in values from raw_data
    for col in df.columns:
        if col in raw_data:
            val = raw_data[col]
            if df[col].dtype in ['int64', 'float64', 'int32']:
                try:
                    df.loc[df.index[0], col] = float(val)
                except (ValueError, TypeError):
                    df.loc[df.index[0], col] = 0.0
            else:
                df.loc[df.index[0], col] = str(val)
    
    # Apply feature engineering
    engineer = FEATURE_ENGINEERS.get(claim_type)
    if engineer:
        df = engineer(df)
        
        # Ensure engineered columns match what pipeline expects
        pipeline_features = sample.columns.tolist()
        # The pipeline was trained with engineered features, so we need to match
        # Get the expected feature names from the config
        feature_config = config.get('config', {})
        expected_cols = feature_config.get('feature_columns', pipeline_features)
        
        # Add any missing columns with defaults
        for col in expected_cols:
            if col not in df.columns:
                df[col] = 0
        
        # Only keep expected columns (in order)
        df = df[[c for c in expected_cols if c in df.columns]]
    
    # Clean infinity
    df = df.replace([np.inf, -np.inf], np.nan)
    for col in df.select_dtypes(include=['float64', 'int64']).columns:
        df[col] = df[col].fillna(0)
    for col in df.select_dtypes(include=['object', 'category']).columns:
        df[col] = df[col].fillna('Unknown')
    
    return df


def get_prediction_and_probability(claim_type: str, processed_data: pd.DataFrame) -> tuple:
    """Run prediction and return (label, probability)."""
    if claim_type not in REGISTRY:
        raise ValueError(f"Model '{claim_type}' not found.")
    
    pipeline = REGISTRY[claim_type]['pipeline']
    
    prediction = pipeline.predict(processed_data)[0]
    
    # Get fraud probability
    try:
        classes = list(pipeline.classes_)
        proba = pipeline.predict_proba(processed_data)[0]
        
        # Find the fraud class (1 or 'Y')
        fraud_idx = None
        for i, cls in enumerate(classes):
            if cls in [1, '1', 'Y', 'Yes', 'yes']:
                fraud_idx = i
                break
        
        if fraud_idx is not None:
            probability = float(proba[fraud_idx])
        else:
            # If no fraud class found, use the probability of the positive class
            probability = float(proba[-1])
    except (AttributeError, IndexError):
        probability = 0.5
    
    # Convert prediction to Y/N for compatibility
    if prediction in [1, '1', True]:
        prediction = 'Y'
    elif prediction in [0, '0', False]:
        prediction = 'N'
    
    return prediction, probability


def get_model_column_count(claim_type: str) -> int:
    """Get the number of features for a model."""
    if claim_type not in REGISTRY:
        return 0
    sample = REGISTRY[claim_type].get('sample')
    if sample is not None:
        return len(sample.columns)
    return 0


def get_available_models() -> list:
    """Get list of available model names."""
    return list(REGISTRY.keys())


def get_model_metrics(claim_type: str) -> dict:
    """Get training metrics for a model."""
    if claim_type not in REGISTRY:
        return {}
    return REGISTRY[claim_type].get('metrics', {})


def classify_claim_category(data: dict, return_confidence: bool = False):
    """
    Auto-detect which insurance category a claim belongs to based on field names.
    If return_confidence=True, returns (category, confidence_score) tuple.
    """
    field_names = set(k.lower() for k in data.keys())
    
    # Score each category by matching fields
    scores = {}
    
    for claim_type in REGISTRY:
        config = REGISTRY[claim_type].get('config', {})
        expected = set(f.lower() for f in config.get('feature_columns', []))
        
        if not expected:
            continue
        
        overlap = len(field_names & expected)
        scores[claim_type] = overlap / len(expected) if expected else 0
    
    if not scores:
        if return_confidence:
            return 'auto', 0.0
        return 'auto'
    
    # Also check for keyword-based classification
    keyword_scores = {
        'auto': ['vehicle', 'collision', 'auto', 'car', 'driver', 'bodily_injuries'],
        'health': ['diagnosis', 'procedure', 'patient', 'hospital', 'medical', 'provider'],
        'travel': ['travel', 'destination', 'agency', 'trip', 'flight'],
        'life': ['death', 'nominee', 'beneficiary', 'policy_duration'],
        'property': ['property', 'home', 'repair', 'weather', 'building', 'fire'],
    }
    
    for cat, keywords in keyword_scores.items():
        if cat in scores:
            for kw in keywords:
                if any(kw in f for f in field_names):
                    scores[cat] = scores.get(cat, 0) + 0.1
    
    best = max(scores, key=scores.get)
    confidence = min(scores[best], 1.0)
    
    result = best if scores[best] > 0.1 else 'auto'
    if return_confidence:
        return result, confidence
    return result


def get_model_confidence_info(claim_type: str) -> dict:
    """Get model confidence/reliability information."""
    if claim_type not in REGISTRY:
        return {'reliability': 'unknown', 'margin_of_error': 0.1}
    
    metrics = REGISTRY[claim_type].get('metrics', {})
    f1 = metrics.get('f1_weighted', 0)
    auc = metrics.get('auc_roc', 0)
    n_samples = metrics.get('n_samples', 0)
    
    # Calculate reliability based on metrics
    if f1 > 0.95 and auc > 0.95:
        reliability = 'very_high'
        margin = 0.02
    elif f1 > 0.90 and auc > 0.85:
        reliability = 'high'
        margin = 0.05
    elif f1 > 0.80:
        reliability = 'medium'
        margin = 0.08
    else:
        reliability = 'low'
        margin = 0.12
    
    # Adjust margin based on sample size
    if n_samples < 1000:
        margin *= 1.5
    elif n_samples > 10000:
        margin *= 0.8
    
    return {
        'reliability': reliability,
        'margin_of_error': round(margin, 4),
        'f1_score': round(f1, 4),
        'auc_roc': round(auc, 4),
        'training_samples': n_samples,
        'confidence_level': 0.95,
    }
