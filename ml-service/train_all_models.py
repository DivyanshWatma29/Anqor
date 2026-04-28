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
