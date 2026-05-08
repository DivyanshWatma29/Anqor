import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
import joblib

# --- 1. DATA GENERATION (Bypassing Kaggle Login Firewall) ---
def generate_health_data(n_samples=2000):
    np.random.seed(42)
    data = {
        'provider_id': np.random.randint(1000, 9999, n_samples),
        'patient_age': np.random.randint(18, 90, n_samples),
        'patient_gender': np.random.choice(['MALE', 'FEMALE'], n_samples),
        'diagnosis_code': np.random.choice(['D01', 'D02', 'D03', 'D04', 'D05'], n_samples),
        'procedure_code': np.random.choice(['P01', 'P02', 'P03', 'P04'], n_samples),
        'claim_amount': np.round(np.random.uniform(500, 50000, n_samples), 2),
        'deductible_paid': np.round(np.random.uniform(0, 2000, n_samples), 2),
        'hospital_stay_days': np.random.randint(0, 30, n_samples)
    }
    df = pd.DataFrame(data)

    # Introduce Fraud Patterns (e.g., massive claims for minor procedures, 0 hospital days but huge claim)
    df['fraud_probability'] = 0.05
    df.loc[(df['claim_amount'] > 30000) & (df['hospital_stay_days'] < 2), 'fraud_probability'] = 0.8
    df.loc[(df['procedure_code'] == 'P04') & (df['claim_amount'] > 20000), 'fraud_probability'] = 0.6

    df['is_fraud'] = np.random.binomial(1, df['fraud_probability'])
    df = df.drop(columns=['fraud_probability'])
    return df

def generate_travel_data(n_samples=2000):
    np.random.seed(42)
    data = {
        'agency_type': np.random.choice(['Travel Agency', 'Airlines'], n_samples),
        'distribution_channel': np.random.choice(['Online', 'Offline'], n_samples),
        'product_name': np.random.choice(['Cancellation Plan', 'Comprehensive Plan', 'Rental Vehicle'], n_samples),
        'duration': np.random.randint(1, 365, n_samples),
        'destination': np.random.choice(['USA', 'UK', 'EUROPE', 'ASIA', 'OTHER'], n_samples),
        'net_sales': np.round(np.random.uniform(-50, 500, n_samples), 2),
        'commission': np.round(np.random.uniform(0, 200, n_samples), 2),
        'age': np.random.randint(18, 85, n_samples)
    }
    df = pd.DataFrame(data)

    # Introduce Fraud Patterns (e.g., high net sales but negative duration, or high commission offline)
    df['fraud_probability'] = 0.02
    df.loc[(df['duration'] > 300) & (df['net_sales'] < 0), 'fraud_probability'] = 0.9
    df.loc[(df['agency_type'] == 'Airlines') & (df['commission'] > 150), 'fraud_probability'] = 0.5

    df['is_fraud'] = np.random.binomial(1, df['fraud_probability'])
    df = df.drop(columns=['fraud_probability'])
    return df

# --- 2. TRAINING PIPELINE ---
def train_and_save_model(df, category_name):
    print(f"Training {category_name} model...")
    target = 'is_fraud'

    # Separate features and target
    X = df.drop(columns=[target])
    y = df[target].apply(lambda x: 'Y' if x == 1 else 'N')

    # Identify numeric and categorical columns
    numeric_cols = X.select_dtypes(include=['int64', 'float64']).columns.tolist()
    categorical_cols = X.select_dtypes(include=['object']).columns.tolist()

    # One-hot encode categorical columns
    X_encoded = pd.get_dummies(X, columns=categorical_cols)
    model_columns = X_encoded.columns.tolist()

    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(X_encoded, y, test_size=0.2, random_state=42)

    # Scale numeric columns
    scaler = StandardScaler()
    X_train[numeric_cols] = scaler.fit_transform(X_train[numeric_cols])
    X_test[numeric_cols] = scaler.transform(X_test[numeric_cols])

    # Train model (Random Forest for robust categorical handling)
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # Accuracy
    acc = model.score(X_test, y_test)
    print(f"{category_name} Model Accuracy: {acc:.2f}")

    # Create directory
    output_dir = f"models/{category_name}"
    os.makedirs(output_dir, exist_ok=True)

    # Save artifacts
    joblib.dump(model, f"{output_dir}/best_model.joblib")
    joblib.dump(scaler, f"{output_dir}/scaler.joblib")
    joblib.dump(model_columns, f"{output_dir}/model_columns.joblib")
    print(f"Artifacts saved to {output_dir}/")

if __name__ == "__main__":
    # Ensure we are in the ml-service directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    print("Generating datasets...")
    health_df = generate_health_data()
    travel_df = generate_travel_data()

    train_and_save_model(health_df, 'health')
    train_and_save_model(travel_df, 'travel')
    print("All models trained successfully!")
