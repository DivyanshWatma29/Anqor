from flask import Flask, request, jsonify
from flask_cors import CORS
import os

# Import refactored core modules
from core.preprocessor import preprocess_input, get_prediction_and_probability, get_model_column_count, get_required_fields, get_available_models
from core.indicators import generate_indicators

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'available_models': get_available_models(),
    })

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({'error': 'Request body is required'}), 400

        claim_type = data.get('claim_type', 'auto').lower()
        if claim_type not in get_available_models():
            return jsonify({'error': f"Model for claim type '{claim_type}' is not currently available."}), 400

        # Validate required fields for the specific model
        required_fields = get_required_fields(claim_type)
        missing = [f for f in required_fields if f not in data]
        if missing:
            return jsonify({
                'error': f'Missing required fields for {claim_type} claim: {", ".join(missing)}',
                'missing_fields': missing,
            }), 400

        # Preprocess and Predict
        processed = preprocess_input(claim_type, data)
        prediction, probability = get_prediction_and_probability(claim_type, processed)

        # Currently, indicators are only tuned for auto insurance
        indicators = generate_indicators(data) if claim_type == 'auto' else ["No indicators available for this claim type yet."]

        return jsonify({
            'prediction': prediction,
            'probability': round(probability, 4),
            'indicators': indicators,
        })

    except Exception as e:
        app.logger.exception("An internal error occurred during prediction.")
        return jsonify({'error': 'An internal error occurred.'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
