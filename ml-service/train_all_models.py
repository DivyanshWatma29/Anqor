import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
import joblib
from data.data_generation import generate_health_data, generate_travel_data, generate_auto_data, generate_property_data, generate_life_data


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
