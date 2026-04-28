from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import os

app = Flask(__name__)
CORS(app)

# Load ML artifacts
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
model = joblib.load(os.path.join(MODEL_DIR, 'best_model.joblib'))
scaler = joblib.load(os.path.join(MODEL_DIR, 'scaler.joblib'))
model_columns = joblib.load(os.path.join(MODEL_DIR, 'model_columns.joblib'))
numeric_cols = scaler.feature_names_in_.tolist()

# Raw input fields expected from the frontend
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

# Categorical fields and their one-hot column prefix
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

# Field name mapping (frontend uses underscores, model uses hyphens for some)
FIELD_RENAMES = {
    'capital_gains': 'capital-gains',
    'capital_loss': 'capital-loss',
}


def preprocess_input(raw_data: dict) -> pd.DataFrame:
    """Convert raw 24-field input into model-ready 54-column DataFrame."""
    # Start with all zeros
    processed = pd.DataFrame(0, index=[0], columns=model_columns)

    # Set numeric fields
    for field in RAW_FIELDS:
        model_field = FIELD_RENAMES.get(field, field)
        if model_field in model_columns and field in raw_data:
            try:
                processed[model_field] = float(raw_data[field])
            except (ValueError, TypeError):
                pass

    # One-hot encode categorical fields
    for field, prefix in CATEGORICAL_FIELDS.items():
        if field not in raw_data:
            continue
        value = str(raw_data[field])
        col_name = f"{prefix}_{value}"
        if col_name in model_columns:
            processed[col_name] = 1

    # Scale numeric columns
    processed[numeric_cols] = scaler.transform(processed[numeric_cols])

    return processed


def generate_indicators(raw_data: dict) -> list:
    """Generate heuristic fraud indicators based on raw input values."""
    indicators = []

    total_claim = (
        float(raw_data.get('injury_claim', 0)) +
        float(raw_data.get('property_claim', 0)) +
        float(raw_data.get('vehicle_claim', 0))
    )

    if total_claim > 40000:
        indicators.append(f"Very high total claim amount (${total_claim:,.0f})")
    elif total_claim > 25000:
        indicators.append(f"High total claim amount (${total_claim:,.0f})")

    witnesses = int(raw_data.get('witnesses', 0))
    if witnesses == 0:
        indicators.append("No witnesses reported at the scene")

    police_report = str(raw_data.get('police_report_available', ''))
    if police_report in ('NO', '?'):
        indicators.append("No police report available for the incident")

    severity = str(raw_data.get('incident_severity', ''))
    if severity == 'Total Loss':
        indicators.append("Incident reported as total loss — highest severity")
    elif severity == 'Major Damage':
        indicators.append("Incident reported with major damage")

    incident_hour = int(raw_data.get('incident_hour_of_the_day', 12))
    if incident_hour >= 22 or incident_hour <= 4:
        indicators.append(f"Incident occurred during late/early hours ({incident_hour}:00)")

    months = int(raw_data.get('months_as_customer', 0))
    if months < 6:
        indicators.append(f"Very new customer ({months} months)")
    elif months < 12:
        indicators.append(f"Relatively new customer ({months} months)")

    vehicles = int(raw_data.get('number_of_vehicles_involved', 0))
    if vehicles >= 3:
        indicators.append(f"Multiple vehicles involved ({vehicles})")

    bodily = int(raw_data.get('bodily_injuries', 0))
    if bodily >= 2:
        indicators.append(f"Multiple bodily injuries reported ({bodily})")

    incident_type = str(raw_data.get('incident_type', ''))
    if incident_type == 'Vehicle Theft':
        indicators.append("Incident type is vehicle theft")

    property_damage = str(raw_data.get('property_damage', ''))
    if property_damage == '?':
        indicators.append("Property damage status is uncertain")

    collision_type = str(raw_data.get('collision_type', ''))
    if collision_type == '?':
        indicators.append("Collision type is unspecified")

    premium = float(raw_data.get('policy_annual_premium', 0))
    if premium > 2000:
        indicators.append(f"High annual premium (${premium:,.0f})")

    deductible = float(raw_data.get('policy_deductable', 0))
    if total_claim > 0 and deductible / total_claim < 0.05:
        indicators.append("Very low deductible relative to claim amount")

    capital_gains = float(raw_data.get('capital_gains', 0))
    capital_loss = float(raw_data.get('capital_loss', 0))
    if capital_loss > 50000:
        indicators.append(f"Significant capital losses (${capital_loss:,.0f})")
    if capital_gains > 80000:
        indicators.append(f"High capital gains reported (${capital_gains:,.0f})")

    # Ensure at least 1 indicator
    if not indicators:
        indicators.append("No significant fraud indicators detected")

    return indicators[:8]


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model': 'SVM',
        'features': len(model_columns),
    })


@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({'error': 'Request body is required'}), 400

        # Validate required fields
        missing = [f for f in RAW_FIELDS if f not in data]
        if missing:
            return jsonify({
                'error': f'Missing required fields: {", ".join(missing)}',
                'missing_fields': missing,
            }), 400

        # Preprocess
        processed = preprocess_input(data)

        # Predict
        prediction = model.predict(processed)[0]

        # Get probability via decision_function (SVM)
        try:
            decision = model.decision_function(processed)[0]
            probability = float(1 / (1 + np.exp(-decision)))
        except AttributeError:
            probability = 0.5

        # Generate indicators
        indicators = generate_indicators(data)

        return jsonify({
            'prediction': 'Y' if prediction == 'Y' else 'N',
            'probability': round(probability, 4),
            'indicators': indicators,
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
