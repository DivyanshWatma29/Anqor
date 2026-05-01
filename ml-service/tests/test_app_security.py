import sys
from unittest.mock import MagicMock, patch

# Mock all dependencies
sys.modules['joblib'] = MagicMock()
sys.modules['pandas'] = MagicMock()
sys.modules['numpy'] = MagicMock()
sys.modules['flask_cors'] = MagicMock()

# Setup Flask mock manually since it's not installed
flask_mock = MagicMock()
sys.modules['flask'] = flask_mock

import pytest

def test_predict_error_does_not_leak_details():
    if 'app' in sys.modules:
        del sys.modules['app']

    mock_app_instance = MagicMock()
    flask_mock.Flask.return_value = mock_app_instance
    # Make the route decorator return the function itself
    mock_app_instance.route.return_value = lambda f: f

    import app

    # Now app.predict should be the actual function
    with patch('app.get_available_models') as mock_available, \
         patch('app.get_required_fields') as mock_required, \
         patch('app.preprocess_input') as mock_preprocess, \
         patch('app.request') as mock_request, \
         patch('app.jsonify') as mock_jsonify:

        mock_available.return_value = ['auto']
        mock_request.get_json.return_value = {'claim_type': 'auto'}
        mock_required.return_value = []

        sensitive_msg = "Sensitive database connection error: user=admin password=secret"
        mock_preprocess.side_effect = Exception(sensitive_msg)

        mock_jsonify.side_effect = lambda x: x

        response = app.predict()

        assert isinstance(response, tuple)
        result, status_code = response

        assert status_code == 500
        assert 'error' in result
        # VERIFY: Sensitive message is NOT in the response
        assert sensitive_msg not in result['error']
        # VERIFY: Generic message is returned
        assert result['error'] == 'An internal error occurred.'

        # VERIFY: Exception was logged
        app.app.logger.exception.assert_called_once_with("An error occurred during prediction")
