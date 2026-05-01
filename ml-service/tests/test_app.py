import sys
from unittest.mock import MagicMock, patch

# 1. Setup all mocks
mock_joblib = MagicMock()
mock_pandas = MagicMock()
mock_numpy = MagicMock()
mock_flask = MagicMock()
mock_flask_cors = MagicMock()

# 2. Configure flask mock
mock_app = MagicMock()
mock_flask.Flask.return_value = mock_app
mock_app.route.return_value = lambda x: x
# Mock jsonify to return the data so we can inspect it
mock_flask.jsonify.side_effect = lambda x: x

# 3. Inject mocks into sys.modules
sys.modules['joblib'] = mock_joblib
sys.modules['pandas'] = mock_pandas
sys.modules['numpy'] = mock_numpy
sys.modules['flask'] = mock_flask
sys.modules['flask_cors'] = mock_flask_cors

# 4. Import app
# We import it here so that app.request, app.jsonify etc. are set to our mocks
import app

# 5. Tests
def test_predict_invalid_claim_type():
    """
    Test that the predict endpoint returns 400 when an invalid claim_type is provided.
    """
    # Patch get_available_models where it is used in app.py
    with patch('app.get_available_models', return_value=['auto']):
        payload = {'claim_type': 'invalid'}
        mock_flask.request.get_json.return_value = payload

        # Call the predict function directly
        result = app.predict()

        # Since jsonify returns its input, and we return (jsonify_output, 400)
        assert isinstance(result, tuple)
        assert result[1] == 400
        assert result[0]['error'] == "Model for claim type 'invalid' is not currently available."

def test_predict_no_body():
    """
    Test that the predict endpoint returns 400 when no request body is provided.
    """
    mock_flask.request.get_json.return_value = None

    result = app.predict()

    assert isinstance(result, tuple)
    assert result[1] == 400
    assert result[0]['error'] == 'Request body is required'
