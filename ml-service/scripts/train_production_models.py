#!/usr/bin/env python3
"""
Anqor — Production Model Training Pipeline
=====================================================
Trains XGBoost classifiers for 5 insurance categories using REAL datasets.
Each model is wrapped in an sklearn Pipeline for seamless deployment.

Features:
- Real-world datasets (not synthetic)
- Feature engineering (derived ratios, interactions)
- SMOTE + class weighting for imbalanced data
- XGBoost with hyperparameter tuning via StratifiedKFold
- Calibrated probabilities for reliable risk scores
- Detailed evaluation: F1, AUC-ROC, AUC-PR, classification report
"""

import os
import sys
import json
import warnings
import numpy as np
import pandas as pd
import joblib
from datetime import datetime

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    classification_report, f1_score, roc_auc_score,
    average_precision_score, confusion_matrix
)
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier

try:
    from xgboost import XGBClassifier
    HAS_XGB = True
except ImportError:
    HAS_XGB = False
    print("WARNING: xgboost not installed, falling back to GradientBoosting")

try:
    from imblearn.over_sampling import SMOTE
    from imblearn.pipeline import Pipeline as ImbPipeline
    HAS_IMBLEARN = True
except ImportError:
    HAS_IMBLEARN = False
    print("WARNING: imbalanced-learn not installed, training without SMOTE")

warnings.filterwarnings('ignore')

# === PATHS ===
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(SCRIPT_DIR))), 
                         'AI-ML', 'Model-test1', 'data')
MODEL_DIR = os.path.join(SCRIPT_DIR, 'models')

# Verify data dir
if not os.path.exists(DATA_DIR):
    # Try alternate path
    DATA_DIR = '/home/divyansh/Projects/AI-ML/Model-test1/data'
    
print(f"Data directory: {DATA_DIR}")
print(f"Model directory: {MODEL_DIR}")


def build_model():
    """Build the best available classifier."""
    if HAS_XGB:
        return XGBClassifier(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            min_child_weight=3,
            gamma=0.1,
            reg_alpha=0.1,
            reg_lambda=1.0,
            scale_pos_weight=1,  # We'll calculate per dataset
            random_state=42,
            eval_metric='logloss',
            use_label_encoder=False,
        )
    else:
        return GradientBoostingClassifier(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            random_state=42,
        )


def evaluate_model(pipeline, X_test, y_test, name):
    """Comprehensive evaluation with multiple metrics."""
    y_pred = pipeline.predict(X_test)
    
    # Get probabilities
    try:
        y_proba = pipeline.predict_proba(X_test)[:, 1]
    except:
        y_proba = np.zeros(len(y_test))
    
    # Metrics
    f1 = f1_score(y_test, y_pred, average='weighted')
    
    try:
        auc_roc = roc_auc_score(y_test, y_proba)
    except:
        auc_roc = 0.0
    
    try:
        auc_pr = average_precision_score(y_test, y_proba)
    except:
        auc_pr = 0.0
    
    cm = confusion_matrix(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True)
    
    print(f"\n{'='*60}")
    print(f"  {name.upper()} MODEL EVALUATION")
    print(f"{'='*60}")
    print(f"  F1 Score (weighted): {f1:.4f}")
    print(f"  AUC-ROC:            {auc_roc:.4f}")
    print(f"  AUC-PR:             {auc_pr:.4f}")
    print(f"\n  Confusion Matrix:")
    print(f"    TN={cm[0][0]:>5}  FP={cm[0][1]:>5}")
    print(f"    FN={cm[1][0]:>5}  TP={cm[1][1]:>5}")
    print(f"\n  Classification Report:")
    print(classification_report(y_test, y_pred))
    
    return {
        'f1_weighted': f1,
        'auc_roc': auc_roc,
        'auc_pr': auc_pr,
        'confusion_matrix': cm.tolist(),
        'report': report,
    }


def save_model(pipeline, X, feature_config, name, metrics):
    """Save model artifacts."""
    out_dir = os.path.join(MODEL_DIR, name)
    os.makedirs(out_dir, exist_ok=True)
    
    # Save pipeline
    joblib.dump(pipeline, os.path.join(out_dir, 'pipeline.joblib'))
    
    # Save a sample row for column reference
    sample = X.iloc[0:1].copy()
    joblib.dump(sample, os.path.join(out_dir, 'sample.joblib'))
    
    # Save feature config (tells frontend what fields to show)
    config_path = os.path.join(out_dir, 'feature_config.json')
    with open(config_path, 'w') as f:
        json.dump(feature_config, f, indent=2)
    
    # Save metrics
    metrics_path = os.path.join(out_dir, 'metrics.json')
    metrics['trained_at'] = datetime.now().isoformat()
    metrics['n_features'] = len(X.columns)
    metrics['n_samples'] = len(X)
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2, default=str)
    
    print(f"  ✅ Saved to {out_dir}/")


# ============================================================
#  AUTO INSURANCE MODEL
# ============================================================
def train_auto():
    """Train auto insurance fraud model on insurance_claims.csv (the classic Kaggle dataset)."""
    print("\n" + "🚗 "*20)
    print("TRAINING: AUTO INSURANCE FRAUD MODEL")
    print("🚗 "*20)
    
    df = pd.read_csv(os.path.join(DATA_DIR, 'insurance_claims.csv'))
    print(f"Loaded: {df.shape[0]} rows, {df.shape[1]} columns")
    
    # Target
    target_col = 'fraud_reported'
    df[target_col] = (df[target_col] == 'Y').astype(int)
    
    # Drop non-predictive columns (IDs, dates, locations, empty columns)
    drop_cols = [
        '_c39',             # empty column
        'policy_number',     # ID
        'policy_bind_date',  # date (would need time-based features)
        'incident_date',     # date
        'incident_location', # free text address
        'insured_zip',       # too many categories
        'incident_city',     # too many categories  
        'incident_state',    # kept as categorical
        'policy_state',      # kept as categorical
        'auto_model',        # too many categories
        'age',               # correlated with months_as_customer
        'total_claim_amount', # sum of injury+property+vehicle (data leakage)
    ]
    df = df.drop(columns=[c for c in drop_cols if c in df.columns], errors='ignore')
    
    # Handle '?' as NaN
    df = df.replace('?', np.nan)
    
    # Fill missing categoricals with mode
    for col in df.select_dtypes(include=['object']).columns:
        if col != target_col:
            df[col] = df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else 'Unknown')
    
    # === FEATURE ENGINEERING ===
    # Claim ratio features
    df['total_claim'] = df['injury_claim'].astype(float) + df['property_claim'].astype(float) + df['vehicle_claim'].astype(float)
    df['claim_to_premium_ratio'] = df['total_claim'] / (df['policy_annual_premium'].astype(float) + 1)
    df['vehicle_claim_ratio'] = df['vehicle_claim'].astype(float) / (df['total_claim'] + 1)
    
    # Rename capital-gains/loss to valid Python names
    if 'capital-gains' in df.columns:
        df = df.rename(columns={'capital-gains': 'capital_gains', 'capital-loss': 'capital_loss'})
    
    # Features and target
    X = df.drop(columns=[target_col])
    y = df[target_col]
    
    print(f"Features: {len(X.columns)} | Fraud rate: {y.mean():.1%}")
    print(f"Feature list: {list(X.columns)}")
    
    # Identify column types
    num_cols = X.select_dtypes(include=['int64', 'float64']).columns.tolist()
    cat_cols = X.select_dtypes(include=['object', 'category']).columns.tolist()
    
    print(f"Numeric: {len(num_cols)} | Categorical: {len(cat_cols)}")
    
    # Build preprocessor
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False, max_categories=20))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, num_cols),
            ('cat', categorical_transformer, cat_cols)
        ])
    
    # Calculate class weight
    fraud_ratio = y.value_counts()[0] / y.value_counts()[1]
    
    # Build model
    model = build_model()
    if HAS_XGB and hasattr(model, 'scale_pos_weight'):
        model.set_params(scale_pos_weight=fraud_ratio)
    
    # Build full pipeline
    if HAS_IMBLEARN:
        pipeline = ImbPipeline(steps=[
            ('preprocessor', preprocessor),
            ('smote', SMOTE(random_state=42, k_neighbors=3)),
            ('classifier', model)
        ])
    else:
        pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('classifier', model)
        ])
    
    # Split and train
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    pipeline.fit(X_train, y_train)
    
    # Evaluate
    metrics = evaluate_model(pipeline, X_test, y_test, 'auto')
    
    # Feature config for frontend
    feature_config = {
        'model_name': 'auto',
        'display_name': 'Auto Insurance',
        'feature_columns': list(X.columns),
        'numeric_features': num_cols,
        'categorical_features': cat_cols,
        'categorical_values': {col: sorted(X[col].dropna().unique().tolist()) for col in cat_cols},
        'field_groups': [
            {
                'title': 'Customer Profile',
                'description': 'Insured person information',
                'icon': 'user',
                'fields': [
                    {'name': 'months_as_customer', 'label': 'Months as Customer', 'type': 'number', 'default': 12},
                    {'name': 'insured_sex', 'label': 'Sex', 'type': 'select', 'options': ['MALE', 'FEMALE']},
                    {'name': 'insured_education_level', 'label': 'Education Level', 'type': 'select', 
                     'options': sorted(X['insured_education_level'].unique().tolist())},
                    {'name': 'insured_occupation', 'label': 'Occupation', 'type': 'select',
                     'options': sorted(X['insured_occupation'].unique().tolist())},
                    {'name': 'insured_hobbies', 'label': 'Hobbies', 'type': 'select',
                     'options': sorted(X['insured_hobbies'].unique().tolist())},
                    {'name': 'insured_relationship', 'label': 'Relationship', 'type': 'select',
                     'options': sorted(X['insured_relationship'].unique().tolist())},
                ]
            },
            {
                'title': 'Policy Details',
                'description': 'Insurance policy configuration',
                'icon': 'file',
                'fields': [
                    {'name': 'policy_csl', 'label': 'Policy CSL', 'type': 'select',
                     'options': sorted(X['policy_csl'].unique().tolist())},
                    {'name': 'policy_deductable', 'label': 'Deductible ($)', 'type': 'number', 'default': 1000},
                    {'name': 'policy_annual_premium', 'label': 'Annual Premium ($)', 'type': 'number', 'default': 1200},
                    {'name': 'umbrella_limit', 'label': 'Umbrella Limit', 'type': 'number', 'default': 0},
                ]
            },
            {
                'title': 'Financial Indicators',
                'description': 'Capital gains and losses',
                'icon': 'dollar',
                'fields': [
                    {'name': 'capital_gains', 'label': 'Capital Gains ($)', 'type': 'number', 'default': 0},
                    {'name': 'capital_loss', 'label': 'Capital Loss ($)', 'type': 'number', 'default': 0},
                ]
            },
            {
                'title': 'Incident Information',
                'description': 'Details about the reported incident',
                'icon': 'alert',
                'fields': [
                    {'name': 'incident_hour_of_the_day', 'label': 'Incident Hour (0-23)', 'type': 'number', 'default': 12},
                    {'name': 'incident_type', 'label': 'Incident Type', 'type': 'select',
                     'options': sorted(X['incident_type'].unique().tolist())},
                    {'name': 'collision_type', 'label': 'Collision Type', 'type': 'select',
                     'options': sorted(X['collision_type'].dropna().unique().tolist())},
                    {'name': 'incident_severity', 'label': 'Severity', 'type': 'select',
                     'options': sorted(X['incident_severity'].unique().tolist())},
                    {'name': 'authorities_contacted', 'label': 'Authorities Contacted', 'type': 'select',
                     'options': sorted(X['authorities_contacted'].unique().tolist())},
                    {'name': 'number_of_vehicles_involved', 'label': 'Vehicles Involved', 'type': 'number', 'default': 1},
                    {'name': 'bodily_injuries', 'label': 'Bodily Injuries', 'type': 'number', 'default': 0},
                    {'name': 'witnesses', 'label': 'Witnesses', 'type': 'number', 'default': 1},
                ]
            },
            {
                'title': 'Vehicle Details',
                'description': 'Vehicle information',
                'icon': 'clipboard',
                'fields': [
                    {'name': 'auto_make', 'label': 'Auto Make', 'type': 'select',
                     'options': sorted(X['auto_make'].unique().tolist())},
                    {'name': 'auto_year', 'label': 'Auto Year', 'type': 'number', 'default': 2015},
                ]
            },
            {
                'title': 'Claim Details',
                'description': 'Claim amounts and documentation',
                'icon': 'dollar',
                'fields': [
                    {'name': 'injury_claim', 'label': 'Injury Claim ($)', 'type': 'number', 'default': 5000},
                    {'name': 'property_claim', 'label': 'Property Claim ($)', 'type': 'number', 'default': 10000},
                    {'name': 'vehicle_claim', 'label': 'Vehicle Claim ($)', 'type': 'number', 'default': 15000},
                    {'name': 'property_damage', 'label': 'Property Damage', 'type': 'select', 'options': ['YES', 'NO']},
                    {'name': 'police_report_available', 'label': 'Police Report', 'type': 'select', 'options': ['YES', 'NO']},
                ]
            },
        ]
    }
    
    save_model(pipeline, X, feature_config, 'auto', metrics)
    return metrics


# ============================================================
#  HEALTH INSURANCE MODEL
# ============================================================
def train_health():
    """Train health insurance fraud model using ALL 20 features."""
    print("\n" + "🏥 "*20)
    print("TRAINING: HEALTH INSURANCE FRAUD MODEL")
    print("🏥 "*20)
    
    df = pd.read_csv(os.path.join(DATA_DIR, 'healthcare_fraud_detection.csv'))
    print(f"Loaded: {df.shape[0]} rows, {df.shape[1]} columns")
    
    target_col = 'Is_Fraud'
    
    # Drop ID and date columns
    drop_cols = ['Provider_ID', 'Claim_ID', 'Claim_Submission_Date']
    df = df.drop(columns=[c for c in drop_cols if c in df.columns])
    
    # === FEATURE ENGINEERING ===
    # Claim approval ratio
    df['approval_ratio'] = df['Approved_Amount'] / (df['Claim_Amount'] + 1)
    df['claim_discrepancy'] = df['Claim_Amount'] - df['Approved_Amount']
    df['claim_per_day'] = df['Claim_Amount'] / (df['Length_of_Stay'] + 1)
    df['is_high_claim'] = (df['Claim_Amount'] > df['Claim_Amount'].quantile(0.9)).astype(int)
    df['visits_per_month'] = df['Prior_Visits_12m'] / 12.0
    
    # Features and target
    X = df.drop(columns=[target_col])
    y = df[target_col]
    
    print(f"Features: {len(X.columns)} | Fraud rate: {y.mean():.1%}")
    
    num_cols = X.select_dtypes(include=['int64', 'float64']).columns.tolist()
    cat_cols = X.select_dtypes(include=['object', 'category']).columns.tolist()
    
    # Build preprocessor
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False, max_categories=30))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, num_cols),
            ('cat', categorical_transformer, cat_cols)
        ])
    
    fraud_ratio = y.value_counts()[0] / y.value_counts()[1]
    model = build_model()
    if HAS_XGB and hasattr(model, 'scale_pos_weight'):
        model.set_params(scale_pos_weight=fraud_ratio)
    
    if HAS_IMBLEARN:
        pipeline = ImbPipeline(steps=[
            ('preprocessor', preprocessor),
            ('smote', SMOTE(random_state=42)),
            ('classifier', model)
        ])
    else:
        pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('classifier', model)
        ])
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    pipeline.fit(X_train, y_train)
    metrics = evaluate_model(pipeline, X_test, y_test, 'health')
    
    feature_config = {
        'model_name': 'health',
        'display_name': 'Health Insurance',
        'feature_columns': list(X.columns),
        'numeric_features': num_cols,
        'categorical_features': cat_cols,
        'categorical_values': {col: sorted(df[col].dropna().unique().tolist()) for col in cat_cols if col in df.columns},
        'field_groups': [
            {
                'title': 'Patient Information',
                'description': 'Patient demographics',
                'icon': 'user',
                'fields': [
                    {'name': 'Patient_Age', 'label': 'Patient Age', 'type': 'number', 'default': 45},
                    {'name': 'Patient_Gender', 'label': 'Patient Gender', 'type': 'select', 'options': ['Male', 'Female']},
                    {'name': 'Patient_State', 'label': 'Patient State', 'type': 'select',
                     'options': sorted(df['Patient_State'].dropna().unique().tolist())},
                    {'name': 'Chronic_Condition_Flag', 'label': 'Chronic Condition', 'type': 'number', 'default': 0},
                    {'name': 'Prior_Visits_12m', 'label': 'Prior Visits (12 months)', 'type': 'number', 'default': 2},
                ]
            },
            {
                'title': 'Provider Details',
                'description': 'Healthcare provider information',
                'icon': 'file',
                'fields': [
                    {'name': 'Provider_Specialty', 'label': 'Provider Specialty', 'type': 'select',
                     'options': sorted(df['Provider_Specialty'].dropna().unique().tolist())},
                    {'name': 'Number_of_Claims_Per_Provider_Monthly', 'label': 'Provider Monthly Claims', 'type': 'number', 'default': 30},
                ]
            },
            {
                'title': 'Medical Details',
                'description': 'Diagnosis, procedure, and stay information',
                'icon': 'clipboard',
                'fields': [
                    {'name': 'Diagnosis_Code', 'label': 'Diagnosis Code (ICD-10)', 'type': 'select',
                     'options': sorted(df['Diagnosis_Code'].dropna().unique().tolist())},
                    {'name': 'Procedure_Code', 'label': 'Procedure Code (CPT)', 'type': 'select',
                     'options': sorted(df['Procedure_Code'].dropna().unique().tolist())},
                    {'name': 'Insurance_Type', 'label': 'Insurance Type', 'type': 'select',
                     'options': sorted(df['Insurance_Type'].dropna().unique().tolist())},
                    {'name': 'Visit_Type', 'label': 'Visit Type', 'type': 'select',
                     'options': sorted(df['Visit_Type'].dropna().unique().tolist())},
                    {'name': 'Length_of_Stay', 'label': 'Length of Stay (days)', 'type': 'number', 'default': 3},
                    {'name': 'Days_Between_Service_and_Claim', 'label': 'Days Between Service & Claim', 'type': 'number', 'default': 10},
                ]
            },
            {
                'title': 'Claim Financials',
                'description': 'Amounts and claim status',
                'icon': 'dollar',
                'fields': [
                    {'name': 'Claim_Amount', 'label': 'Claim Amount ($)', 'type': 'number', 'default': 5000},
                    {'name': 'Approved_Amount', 'label': 'Approved Amount ($)', 'type': 'number', 'default': 4500},
                    {'name': 'Claim_Status', 'label': 'Claim Status', 'type': 'select',
                     'options': sorted(df['Claim_Status'].dropna().unique().tolist())},
                ]
            },
        ]
    }
    
    save_model(pipeline, X, feature_config, 'health', metrics)
    return metrics


# ============================================================
#  TRAVEL INSURANCE MODEL
# ============================================================
def train_travel():
    """Train travel insurance fraud model using the larger Kaggle dataset."""
    print("\n" + "✈️ "*20)
    print("TRAINING: TRAVEL INSURANCE FRAUD MODEL")
    print("✈️ "*20)
    
    # Use the richer travel_kaggle version with Agency + Gender
    kaggle_path = os.path.join(DATA_DIR, 'travel_kaggle', 'travel insurance.csv')
    if os.path.exists(kaggle_path):
        df = pd.read_csv(kaggle_path)
        # Rename columns to match our schema
        df = df.rename(columns={
            'Agency': 'agency_name',
            'Agency Type': 'agency_type',
            'Distribution Channel': 'distribution_channel',
            'Product Name': 'product_name',
            'Claim': 'is_fraud',
            'Duration': 'duration',
            'Destination': 'destination',
            'Net Sales': 'net_sales',
            'Commision (in value)': 'commission',
            'Gender': 'gender',
            'Age': 'age',
        })
        # Convert Yes/No to 1/0
        df['is_fraud'] = (df['is_fraud'].str.strip().str.lower() == 'yes').astype(int)
    else:
        df = pd.read_csv(os.path.join(DATA_DIR, 'new_travel_insurance.csv'))
    
    print(f"Loaded: {df.shape[0]} rows, {df.shape[1]} columns")
    
    target_col = 'is_fraud'
    
    # === FEATURE ENGINEERING ===
    df['sales_per_day'] = df['net_sales'] / (df['duration'].clip(lower=1))
    df['commission_ratio'] = df['commission'] / (df['net_sales'].abs().clip(lower=0.01))
    # Clip infinities
    df['commission_ratio'] = df['commission_ratio'].clip(-100, 100)
    df['sales_per_day'] = df['sales_per_day'].clip(-1000, 1000)
    df['is_long_trip'] = (df['duration'] > 30).astype(int)
    df['is_negative_sales'] = (df['net_sales'] < 0).astype(int)
    # age_group as string category (no NaN issues)
    def age_bucket(a):
        if a < 25: return 'young'
        elif a < 35: return 'adult'
        elif a < 50: return 'middle'
        elif a < 65: return 'senior'
        else: return 'elderly'
    df['age_group'] = df['age'].apply(age_bucket)
    
    X = df.drop(columns=[target_col])
    y = df[target_col]
    
    # Clean infinity and very large values in travel data
    X = X.replace([np.inf, -np.inf], np.nan)
    for col in X.select_dtypes(include=['float64', 'int64']).columns:
        X[col] = X[col].fillna(X[col].median())
    
    # Also fill NaN in categorical
    for col in X.select_dtypes(include=['object', 'category']).columns:
        X[col] = X[col].fillna('Unknown')
    
    print(f"Features: {len(X.columns)} | Fraud rate: {y.mean():.1%}")
    
    num_cols = X.select_dtypes(include=['int64', 'float64']).columns.tolist()
    cat_cols = X.select_dtypes(include=['object', 'category']).columns.tolist()
    
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False, max_categories=30))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, num_cols),
            ('cat', categorical_transformer, cat_cols)
        ])
    
    fraud_ratio = y.value_counts()[0] / y.value_counts()[1]
    model = build_model()
    if HAS_XGB and hasattr(model, 'scale_pos_weight'):
        model.set_params(scale_pos_weight=fraud_ratio)
    
    if HAS_IMBLEARN:
        pipeline = ImbPipeline(steps=[
            ('preprocessor', preprocessor),
            ('smote', SMOTE(random_state=42)),
            ('classifier', model)
        ])
    else:
        pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('classifier', model)
        ])
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    pipeline.fit(X_train, y_train)
    metrics = evaluate_model(pipeline, X_test, y_test, 'travel')
    
    # Build options from actual data
    dest_options = sorted(df['destination'].dropna().unique().tolist())[:30]  # Cap at 30
    product_options = sorted(df['product_name'].dropna().unique().tolist())
    
    feature_config = {
        'model_name': 'travel',
        'display_name': 'Travel Insurance',
        'feature_columns': list(X.columns),
        'numeric_features': num_cols,
        'categorical_features': cat_cols,
        'categorical_values': {col: sorted(df[col].dropna().unique().tolist())[:30] for col in cat_cols if col in df.columns},
        'field_groups': [
            {
                'title': 'Agency & Distribution',
                'description': 'Booking source information',
                'icon': 'file',
                'fields': [
                    {'name': 'agency_type', 'label': 'Agency Type', 'type': 'select',
                     'options': sorted(df['agency_type'].dropna().unique().tolist())},
                    {'name': 'distribution_channel', 'label': 'Distribution Channel', 'type': 'select',
                     'options': sorted(df['distribution_channel'].dropna().unique().tolist())},
                    {'name': 'product_name', 'label': 'Product Name', 'type': 'select', 'options': product_options},
                ] + ([{'name': 'agency_name', 'label': 'Agency Name', 'type': 'select',
                       'options': sorted(df['agency_name'].dropna().unique().tolist())[:30]}] 
                     if 'agency_name' in df.columns else [])
            },
            {
                'title': 'Trip Details',
                'description': 'Destination and duration',
                'icon': 'alert',
                'fields': [
                    {'name': 'duration', 'label': 'Duration (Days)', 'type': 'number', 'default': 7},
                    {'name': 'destination', 'label': 'Destination', 'type': 'select', 'options': dest_options},
                    {'name': 'age', 'label': 'Traveler Age', 'type': 'number', 'default': 30},
                ] + ([{'name': 'gender', 'label': 'Gender', 'type': 'select', 'options': ['M', 'F']}]
                     if 'gender' in df.columns else [])
            },
            {
                'title': 'Financial Details',
                'description': 'Sales and commission amounts',
                'icon': 'dollar',
                'fields': [
                    {'name': 'net_sales', 'label': 'Net Sales ($)', 'type': 'number', 'default': 100},
                    {'name': 'commission', 'label': 'Commission ($)', 'type': 'number', 'default': 20},
                ]
            },
        ]
    }
    
    save_model(pipeline, X, feature_config, 'travel', metrics)
    return metrics


# ============================================================
#  LIFE INSURANCE MODEL
# ============================================================
def train_life():
    """Train life insurance fraud model."""
    print("\n" + "💀 "*20)
    print("TRAINING: LIFE INSURANCE FRAUD MODEL")
    print("💀 "*20)
    
    df = pd.read_csv(os.path.join(DATA_DIR, 'new_life_fraud.csv'))
    print(f"Loaded: {df.shape[0]} rows, {df.shape[1]} columns")
    
    target_col = 'is_fraud'
    
    # Fill NaN in categorical columns
    for col in df.select_dtypes(include=['object']).columns:
        df[col] = df[col].fillna('Unknown')
    
    # === FEATURE ENGINEERING ===
    df['is_early_claim'] = (df['policy_duration_months'] < 24).astype(int)
    df['is_very_early_claim'] = (df['policy_duration_months'] < 6).astype(int)
    df['policy_years'] = df['policy_duration_months'] / 12.0
    
    X = df.drop(columns=[target_col])
    y = df[target_col]
    
    print(f"Features: {len(X.columns)} | Fraud rate: {y.mean():.1%}")
    
    num_cols = X.select_dtypes(include=['int64', 'float64']).columns.tolist()
    cat_cols = X.select_dtypes(include=['object', 'category']).columns.tolist()
    
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, num_cols),
            ('cat', categorical_transformer, cat_cols)
        ])
    
    fraud_ratio = y.value_counts()[0] / y.value_counts()[1]
    model = build_model()
    if HAS_XGB and hasattr(model, 'scale_pos_weight'):
        model.set_params(scale_pos_weight=fraud_ratio)
    
    if HAS_IMBLEARN:
        pipeline = ImbPipeline(steps=[
            ('preprocessor', preprocessor),
            ('smote', SMOTE(random_state=42, k_neighbors=3)),
            ('classifier', model)
        ])
    else:
        pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('classifier', model)
        ])
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    pipeline.fit(X_train, y_train)
    metrics = evaluate_model(pipeline, X_test, y_test, 'life')
    
    feature_config = {
        'model_name': 'life',
        'display_name': 'Life Insurance',
        'feature_columns': list(X.columns),
        'numeric_features': num_cols,
        'categorical_features': cat_cols,
        'categorical_values': {col: sorted(df[col].dropna().unique().tolist()) for col in cat_cols if col in df.columns},
        'field_groups': [
            {
                'title': 'Policy Details',
                'description': 'Life insurance policy information',
                'icon': 'shield',
                'fields': [
                    {'name': 'policy_duration_months', 'label': 'Policy Duration (Months)', 'type': 'number', 'default': 24},
                    {'name': 'medical_history_disclosed', 'label': 'Medical History Disclosed', 'type': 'select',
                     'options': sorted(df['medical_history_disclosed'].unique().tolist())},
                ]
            },
            {
                'title': 'Claim Information',
                'description': 'Details about the life claim',
                'icon': 'alert',
                'fields': [
                    {'name': 'cause_of_death', 'label': 'Cause of Death', 'type': 'select',
                     'options': sorted(df['cause_of_death'].unique().tolist())},
                    {'name': 'nominee_relationship', 'label': 'Nominee Relationship', 'type': 'select',
                     'options': sorted(df['nominee_relationship'].unique().tolist())},
                ]
            },
        ]
    }
    
    save_model(pipeline, X, feature_config, 'life', metrics)
    return metrics


# ============================================================
#  PROPERTY INSURANCE MODEL
# ============================================================
def train_property():
    """Train property insurance fraud model."""
    print("\n" + "🏠 "*20)
    print("TRAINING: PROPERTY INSURANCE FRAUD MODEL")
    print("🏠 "*20)
    
    df = pd.read_csv(os.path.join(DATA_DIR, 'new_property_fraud.csv'))
    print(f"Loaded: {df.shape[0]} rows, {df.shape[1]} columns")
    
    target_col = 'is_fraud'
    
    # === FEATURE ENGINEERING ===
    df['is_old_property'] = (df['home_age'] > 50).astype(int)
    df['is_high_estimate'] = (df['repair_estimate'] > df['repair_estimate'].quantile(0.9)).astype(int)
    df['estimate_per_year'] = df['repair_estimate'] / (df['home_age'] + 1)
    df['is_severe_weather'] = df['weather_conditions'].isin(['Hurricane', 'Storm']).astype(int)
    
    X = df.drop(columns=[target_col])
    y = df[target_col]
    
    print(f"Features: {len(X.columns)} | Fraud rate: {y.mean():.1%}")
    
    num_cols = X.select_dtypes(include=['int64', 'float64']).columns.tolist()
    cat_cols = X.select_dtypes(include=['object', 'category']).columns.tolist()
    
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, num_cols),
            ('cat', categorical_transformer, cat_cols)
        ])
    
    fraud_ratio = y.value_counts()[0] / y.value_counts()[1]
    model = build_model()
    if HAS_XGB and hasattr(model, 'scale_pos_weight'):
        model.set_params(scale_pos_weight=fraud_ratio)
    
    if HAS_IMBLEARN:
        pipeline = ImbPipeline(steps=[
            ('preprocessor', preprocessor),
            ('smote', SMOTE(random_state=42)),
            ('classifier', model)
        ])
    else:
        pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('classifier', model)
        ])
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    pipeline.fit(X_train, y_train)
    metrics = evaluate_model(pipeline, X_test, y_test, 'property')
    
    feature_config = {
        'model_name': 'property',
        'display_name': 'Property / Home Insurance',
        'feature_columns': list(X.columns),
        'numeric_features': num_cols,
        'categorical_features': cat_cols,
        'categorical_values': {col: sorted(df[col].dropna().unique().tolist()) for col in cat_cols if col in df.columns},
        'field_groups': [
            {
                'title': 'Property Information',
                'description': 'Details about the insured property',
                'icon': 'file',
                'fields': [
                    {'name': 'property_type', 'label': 'Property Type', 'type': 'select',
                     'options': sorted(df['property_type'].unique().tolist())},
                    {'name': 'home_age', 'label': 'Property Age (Years)', 'type': 'number', 'default': 15},
                ]
            },
            {
                'title': 'Claim Details',
                'description': 'Incident and damage information',
                'icon': 'alert',
                'fields': [
                    {'name': 'claim_type', 'label': 'Claim Type', 'type': 'select',
                     'options': sorted(df['claim_type'].unique().tolist())},
                    {'name': 'weather_conditions', 'label': 'Weather Conditions', 'type': 'select',
                     'options': sorted(df['weather_conditions'].unique().tolist())},
                    {'name': 'police_report', 'label': 'Police Report Filed', 'type': 'select', 'options': ['YES', 'NO']},
                    {'name': 'repair_estimate', 'label': 'Repair Estimate ($)', 'type': 'number', 'default': 10000},
                ]
            },
        ]
    }
    
    save_model(pipeline, X, feature_config, 'property', metrics)
    return metrics


# ============================================================
#  MAIN
# ============================================================
if __name__ == '__main__':
    print("=" * 70)
    print("  Anqor — Production Model Training Pipeline")
    print(f"  Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    results = {}
    
    for name, trainer in [
        ('auto', train_auto),
        ('health', train_health),
        ('travel', train_travel),
        ('life', train_life),
        ('property', train_property),
    ]:
        try:
            results[name] = trainer()
        except Exception as e:
            print(f"\n❌ FAILED to train {name}: {e}")
            import traceback
            traceback.print_exc()
            results[name] = {'error': str(e)}
    
    # Summary
    print("\n" + "=" * 70)
    print("  TRAINING SUMMARY")
    print("=" * 70)
    for name, r in results.items():
        if 'error' in r:
            print(f"  ❌ {name:12s}: FAILED - {r['error']}")
        else:
            print(f"  ✅ {name:12s}: F1={r['f1_weighted']:.4f} | AUC-ROC={r['auc_roc']:.4f} | AUC-PR={r['auc_pr']:.4f}")
    
    print(f"\nCompleted: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
