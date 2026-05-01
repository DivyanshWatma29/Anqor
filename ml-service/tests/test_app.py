import pytest
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['DEBUG'] = False
    with app.test_client() as client:
        yield client

def test_predict_missing_body(client):
    # To test if not data: we need to send data='{}' because request.get_json(force=True)
    # returns {} for empty objects, which evaluates to False in `if not data:`
    response = client.post('/predict', data='{}', content_type='application/json')
    assert response.status_code == 400
    assert response.get_json() == {'error': 'Request body is required'}
