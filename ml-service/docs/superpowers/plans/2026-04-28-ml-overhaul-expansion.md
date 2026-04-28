# FraudShield.ai V2: ML Overhaul & Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the existing ML pipeline to fix scikit-learn version issues and probability bugs, rewrite data generation with robust synthetic patterns for Auto, Health, Travel, Property, and Life, and deploy the new multi-model architecture.

**Architecture:** A centralized synthetic data generator building pandas DataFrames. A unified training loop using scikit-learn `Pipeline` (StandardScaler + OneHotEncoder/OrdinalEncoder + RandomForest) exported as `.joblib` artifacts. A fixed `preprocessor.py` that utilizes these pipelines instead of fragile pandas manipulation, and an updated React frontend schema for the new domains.

**Tech Stack:** Python 3.10, scikit-learn (1.7.2), pandas, joblib, Flask, React, TypeScript.

---

### Task 1: Create Universal Data Generator & Training Script

**Files:**
- Create: `ml-service/train_all_models.py`
- Modify: `ml-service/core/preprocessor.py`

- [ ] **Step 1: Write `train_all_models.py` script**
Write a script that defines data generation functions for `auto`, `health`, `travel`, `property`, and `life`. Train models using `sklearn.pipeline.Pipeline` with `ColumnTransformer` (for numeric scaling and categorical one-hot encoding) and `RandomForestClassifier`. Save the entire pipeline object as `pipeline.joblib`.

```python
import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
import joblib

def generate_property_data(n=2000):
    np.random.seed(42)
    df = pd.DataFrame({
        'property_type': np.random.choice(['Residential', 'Commercial', 'Industrial'], n),
        'home_age': np.random.randint(0, 100, n),
        'claim_type': np.random.choice(['Fire', 'Water', 'Burglary', 'Structural'], n),
        'weather_conditions': np.random.choice(['Normal', 'Storm', 'Hurricane'], n),
        'police_report': np.random.choice(['YES', 'NO'], n),
        'repair_estimate': np.round(np.random.uniform(1000, 100000, n), 2)
    })
    df['is_fraud'] = np.where((df['repair_estimate'] > 50000) & (df['police_report'] == 'NO'), 1, 0)
    # Add noise
    noise = np.random.binomial(1, 0.05, n)
    df['is_fraud'] = np.abs(df['is_fraud'] - noise)
    return df

def generate_life_data(n=2000):
    np.random.seed(42)
    df = pd.DataFrame({
        'policy_duration_months': np.random.randint(1, 360, n),
        'cause_of_death': np.random.choice(['Natural', 'Accident', 'Homicide', 'Unknown'], n),
        'nominee_relationship': np.random.choice(['Spouse', 'Child', 'Other', 'None'], n),
        'medical_history_disclosed': np.random.choice(['YES', 'NO'], n)
    })
    # Fraud if death soon after policy start and no medical history disclosed
    df['is_fraud'] = np.where((df['policy_duration_months'] < 12) & (df['medical_history_disclosed'] == 'NO'), 1, 0)
    noise = np.random.binomial(1, 0.05, n)
    df['is_fraud'] = np.abs(df['is_fraud'] - noise)
    return df

# ... (Include existing health, travel, and auto generation adapted here) ...
def generate_health_data(n=2000):
    np.random.seed(42)
    df = pd.DataFrame({
        'provider_id': np.random.randint(1000, 9999, n),
        'patient_age': np.random.randint(18, 90, n),
        'patient_gender': np.random.choice(['MALE', 'FEMALE'], n),
        'diagnosis_code': np.random.choice(['D01', 'D02', 'D03'], n),
        'procedure_code': np.random.choice(['P01', 'P02', 'P03'], n),
        'claim_amount': np.round(np.random.uniform(500, 50000, n), 2),
        'deductible_paid': np.round(np.random.uniform(0, 2000, n), 2),
        'hospital_stay_days': np.random.randint(0, 30, n)
    })
    df['is_fraud'] = np.where((df['claim_amount'] > 30000) & (df['hospital_stay_days'] < 2), 1, 0)
    noise = np.random.binomial(1, 0.05, n)
    df['is_fraud'] = np.abs(df['is_fraud'] - noise)
    return df

def generate_travel_data(n=2000):
    np.random.seed(42)
    df = pd.DataFrame({
        'agency_type': np.random.choice(['Travel Agency', 'Airlines'], n),
        'distribution_channel': np.random.choice(['Online', 'Offline'], n),
        'product_name': np.random.choice(['Cancellation Plan', 'Comprehensive Plan'], n),
        'duration': np.random.randint(1, 365, n),
        'destination': np.random.choice(['USA', 'UK', 'ASIA'], n),
        'net_sales': np.round(np.random.uniform(-50, 500, n), 2),
        'commission': np.round(np.random.uniform(0, 200, n), 2),
        'age': np.random.randint(18, 85, n)
    })
    df['is_fraud'] = np.where((df['duration'] > 300) & (df['net_sales'] < 0), 1, 0)
    noise = np.random.binomial(1, 0.05, n)
    df['is_fraud'] = np.abs(df['is_fraud'] - noise)
    return df

def generate_auto_data(n=2000):
    np.random.seed(42)
    df = pd.DataFrame({
        'months_as_customer': np.random.randint(1, 240, n),
        'insured_sex': np.random.choice(['MALE', 'FEMALE'], n),
        'insured_education_level': np.random.choice(['MD', 'PhD', 'High School', 'College'], n),
        'insured_occupation': np.random.choice(['exec-managerial', 'prof-specialty', 'sales', 'farming'], n),
        'insured_relationship': np.random.choice(['husband', 'wife', 'unmarried'], n),
        'policy_deductable': np.random.choice([500, 1000, 2000], n),
        'policy_annual_premium': np.round(np.random.uniform(500, 3000, n), 2),
        'umbrella_limit': np.random.choice([0, 1000000, 2000000], n),
        'policy_csl': np.random.choice(['100/300', '250/500', '500/1000'], n),
        'capital_gains': np.random.randint(0, 100000, n),
        'capital_loss': np.random.randint(-100000, 0, n),
        'incident_hour_of_the_day': np.random.randint(0, 24, n),
        'incident_type': np.random.choice(['Single Vehicle Collision', 'Multi-vehicle Collision', 'Parked Car', 'Vehicle Theft'], n),
        'collision_type': np.random.choice(['Side Collision', 'Rear Collision', 'Front Collision', '?'], n),
        'incident_severity': np.random.choice(['Major Damage', 'Minor Damage', 'Total Loss'], n),
        'authorities_contacted': np.random.choice(['Police', 'Fire', 'Ambulance', 'None'], n),
        'number_of_vehicles_involved': np.random.randint(1, 5, n),
        'bodily_injuries': np.random.randint(0, 3, n),
        'witnesses': np.random.randint(0, 4, n),
        'injury_claim': np.round(np.random.uniform(0, 20000, n), 2),
        'property_claim': np.round(np.random.uniform(0, 20000, n), 2),
        'vehicle_claim': np.round(np.random.uniform(0, 50000, n), 2),
        'property_damage': np.random.choice(['YES', 'NO', '?'], n),
        'police_report_available': np.random.choice(['YES', 'NO', '?'], n)
    })
    df['is_fraud'] = np.where((df['incident_severity'] == 'Total Loss') & (df['witnesses'] == 0), 1, 0)
    noise = np.random.binomial(1, 0.05, n)
    df['is_fraud'] = np.abs(df['is_fraud'] - noise)
    return df

def train_and_save(df, name):
    X = df.drop('is_fraud', axis=1)
    y = df['is_fraud'].apply(lambda x: 'Y' if x == 1 else 'N')
    
    numeric_features = X.select_dtypes(include=['int64', 'float64', 'int32']).columns
    categorical_features = X.select_dtypes(include=['object', 'category']).columns

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numeric_features),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_features)
        ])

    pipeline = Pipeline(steps=[('preprocessor', preprocessor),
                               ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))])

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    pipeline.fit(X_train, y_train)
    
    acc = pipeline.score(X_test, y_test)
    print(f"{name} accuracy: {acc:.3f}")
    
    os.makedirs(f"models/{name}", exist_ok=True)
    joblib.dump(pipeline, f"models/{name}/pipeline.joblib")
    
    # Save dummy sample for column reference in backend
    sample = X.iloc[0:1]
    joblib.dump(sample, f"models/{name}/sample.joblib")

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    train_and_save(generate_auto_data(), 'auto')
    train_and_save(generate_health_data(), 'health')
    train_and_save(generate_travel_data(), 'travel')
    train_and_save(generate_property_data(), 'property')
    train_and_save(generate_life_data(), 'life')
```

- [ ] **Step 2: Run the script to generate all 5 models**
Run: `cd ml-service && python3 train_all_models.py`
Expected: Success logs with accuracy metrics for auto, health, travel, property, and life. Artifacts saved in `ml-service/models/*/`.

- [ ] **Step 3: Commit the training script**
```bash
git add ml-service/train_all_models.py ml-service/models/
git commit -m "feat: universal training pipeline with standardized sklearn Pipeline"
```

---

### Task 2: Refactor Preprocessor and Fix Probability Bug

**Files:**
- Modify: `ml-service/core/preprocessor.py`

- [ ] **Step 1: Rewrite `preprocessor.py`**
Replace the brittle manual one-hot encoding with loading the pipeline directly. Use `predict_proba` for probability calculation.

```python
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
                print(f"Failed to load {claim_type} model: {e}")

load_models()

def get_required_fields(claim_type: str) -> list:
    if claim_type in REGISTRY:
        return list(REGISTRY[claim_type]['sample'].columns)
    return []

def preprocess_input(claim_type: str, raw_data: dict) -> pd.DataFrame:
    if claim_type not in REGISTRY:
        raise ValueError(f"Model '{claim_type}' not found.")
    
    sample = REGISTRY[claim_type]['sample'].copy()
    # Fill sample with raw_data, applying basic type casting
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
        # For RandomForest, get probability of class 'Y'
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
```

- [ ] **Step 2: Test the refactored logic locally**
Create a quick `test.py` script:
```python
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'ml-service'))
from core.preprocessor import preprocess_input, get_prediction_and_probability
import pandas as pd
data = {'home_age': 20, 'claim_type': 'Fire', 'weather_conditions': 'Normal', 'police_report': 'YES', 'repair_estimate': 15000, 'property_type': 'Residential'}
processed = preprocess_input('property', data)
pred, prob = get_prediction_and_probability('property', processed)
print(f"Pred: {pred}, Prob: {prob}")
```
Run `python3 test.py`. Expected: Pred: N/Y, Prob: numeric (e.g., 0.15). Remove `test.py` after verification.

- [ ] **Step 3: Commit preprocessor changes**
```bash
git add ml-service/core/preprocessor.py
git commit -m "refactor: use sklearn Pipeline and fix probability calculation"
```

---

### Task 3: Update Frontend Schemas

**Files:**
- Modify: `src/schemas/insuranceTypes.ts`

- [ ] **Step 1: Update `insuranceTypes.ts` with new domains**

```typescript
export type ClaimCategory = "auto" | "health" | "travel" | "property" | "life" | "business" | "liability";

export interface InsuranceSchema {
  id: ClaimCategory;
  label: string;
  description: string;
  isAvailable: boolean; 
  requiredFields: string[];
}

export const INSURANCE_SCHEMAS: Record<ClaimCategory, InsuranceSchema> = {
  auto: {
    id: "auto",
    label: "Auto Insurance",
    description: "Detect fraud in vehicle collisions, theft, and property damage.",
    isAvailable: true,
    requiredFields: [
      "months_as_customer", "insured_sex", "insured_education_level", "insured_occupation", "insured_relationship", "policy_deductable", "policy_annual_premium", "umbrella_limit", "policy_csl", "capital_gains", "capital_loss", "incident_hour_of_the_day", "incident_type", "collision_type", "incident_severity", "authorities_contacted", "number_of_vehicles_involved", "bodily_injuries", "witnesses", "injury_claim", "property_claim", "vehicle_claim", "property_damage", "police_report_available"
    ]
  },
  health: {
    id: "health",
    label: "Health Insurance",
    description: "Detect Medicare and healthcare provider billing fraud.",
    isAvailable: true,
    requiredFields: [
      "provider_id", "patient_age", "patient_gender", "diagnosis_code", "procedure_code", "claim_amount", "deductible_paid", "hospital_stay_days"
    ]
  },
  travel: {
    id: "travel",
    label: "Travel Insurance",
    description: "Detect fraudulent trip cancellation and delay claims.",
    isAvailable: true,
    requiredFields: [
      "agency_type", "distribution_channel", "product_name", "duration", "destination", "net_sales", "commission", "age"
    ]
  },
  property: {
    id: "property",
    label: "Property / Home Insurance",
    description: "Detect fraud in homeowners and commercial property claims.",
    isAvailable: true,
    requiredFields: [
      "property_type", "home_age", "claim_type", "weather_conditions", "police_report", "repair_estimate"
    ]
  },
  life: {
    id: "life",
    label: "Life Insurance",
    description: "Detect fake deaths and contestable period fraud.",
    isAvailable: true,
    requiredFields: [
      "policy_duration_months", "cause_of_death", "nominee_relationship", "medical_history_disclosed"
    ]
  },
  business: {
    id: "business",
    label: "Business Interruption",
    description: "Detect exaggerated revenue loss and commercial claims.",
    isAvailable: false,
    requiredFields: []
  },
  liability: {
    id: "liability",
    label: "Liability Insurance",
    description: "Detect fraudulent injury or property damage claims.",
    isAvailable: false,
    requiredFields: []
  }
};
```

- [ ] **Step 2: Commit frontend schema updates**
```bash
git add src/schemas/insuranceTypes.ts
git commit -m "feat: add property, life, business, liability to frontend schemas"
```
