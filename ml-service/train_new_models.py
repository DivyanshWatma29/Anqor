import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
import joblib
from data.data_generation import generate_health_data, generate_travel_data

# --- 1. DATA GENERATION (Bypassing Kaggle Login Firewall) ---

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
