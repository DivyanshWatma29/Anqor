from flask import Flask, request, jsonify
from flask_cors import CORS
import os

# Import refactored core modules
from core.preprocessor import preprocess_input, get_prediction_and_probability, get_model_column_count, RAW_FIELDS
from core.indicators import generate_indicators

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model': 'SVM',
        'features': get_model_column_count(),
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

        # Preprocess and Predict
        processed = preprocess_input(data)
        prediction, probability = get_prediction_and_probability(processed)
        indicators = generate_indicators(data)

        return jsonify({
            'prediction': prediction,
            'probability': round(probability, 4),
            'indicators': indicators,
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
