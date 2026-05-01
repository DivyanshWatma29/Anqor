import sys
from unittest.mock import MagicMock, patch

# Mock dependencies before they are imported by core.preprocessor
sys.modules['joblib'] = MagicMock()
sys.modules['pandas'] = MagicMock()
sys.modules['numpy'] = MagicMock()

import pytest
# Now we can import the function to test
from core.preprocessor import preprocess_input

def test_preprocess_input_invalid_claim_type():
    invalid_claim_type = "invalid_model"
    raw_data = {}

    # Use patch.dict to ensure REGISTRY is empty for this test
    with patch.dict('core.preprocessor.REGISTRY', {}, clear=True):
        with pytest.raises(ValueError, match=f"Model '{invalid_claim_type}' not found."):
            preprocess_input(invalid_claim_type, raw_data)
