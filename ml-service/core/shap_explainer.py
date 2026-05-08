"""
Anqor — SHAP Explainer
=================================
Generates SHAP-style feature importance explanations for predictions.
Uses permutation-based importance when SHAP is not installed.
"""
import numpy as np


def get_shap_explanation(claim_type: str, processed_data) -> dict:
    """
    Generate feature importance explanation for a single prediction.
    Returns top contributing features with their impact direction and magnitude.
    """
    from core.preprocessor import REGISTRY

    if claim_type not in REGISTRY:
        return {'error': 'Model not found', 'features': []}

    pipeline = REGISTRY[claim_type]['pipeline']
    config = REGISTRY[claim_type].get('config', {})
    feature_columns = config.get('feature_columns', [])

    try:
        # Try SHAP if available
        return _shap_explanation(pipeline, processed_data, feature_columns)
    except (ImportError, Exception):
        # Fallback: permutation-based importance
        return _permutation_explanation(pipeline, processed_data, feature_columns, claim_type)


def _shap_explanation(pipeline, processed_data, feature_columns) -> dict:
    """Use SHAP library for explanation."""
    import shap

    # Get the underlying model from the pipeline
    model = pipeline
    if hasattr(pipeline, 'named_steps'):
        # Get the last step (classifier)
        last_step_name = list(pipeline.named_steps.keys())[-1]
        model = pipeline.named_steps[last_step_name]

    # Create SHAP explainer
    try:
        explainer = shap.TreeExplainer(model)
        # Transform data through pipeline (except last step)
        if hasattr(pipeline, 'named_steps'):
            steps = list(pipeline.named_steps.keys())
            transformed = processed_data.copy()
            for step_name in steps[:-1]:
                transformed = pipeline.named_steps[step_name].transform(transformed)
            shap_values = explainer.shap_values(transformed)
        else:
            shap_values = explainer.shap_values(processed_data)

        # Handle multi-class
        if isinstance(shap_values, list):
            shap_values = shap_values[-1]  # Use fraud class

        values = shap_values[0] if len(shap_values.shape) > 1 else shap_values

        # Get feature names
        if hasattr(transformed, 'columns'):
            names = list(transformed.columns)
        else:
            names = [f'feature_{i}' for i in range(len(values))]

        # Build explanation
        features = []
        for i, (name, val) in enumerate(sorted(
            zip(names, values), key=lambda x: abs(x[1]), reverse=True
        )[:10]):
            features.append({
                'feature': name,
                'impact': round(float(val), 4),
                'direction': 'increases_fraud_risk' if val > 0 else 'decreases_fraud_risk',
                'magnitude': 'high' if abs(val) > 0.1 else 'medium' if abs(val) > 0.05 else 'low',
            })

        return {
            'method': 'shap_tree',
            'features': features,
            'base_value': round(float(explainer.expected_value if np.isscalar(explainer.expected_value) else explainer.expected_value[-1]), 4),
        }

    except Exception:
        raise  # Let fallback handle it


def _permutation_explanation(pipeline, processed_data, feature_columns, claim_type) -> dict:
    """
    Fallback: Estimate feature importance by permuting each feature
    and measuring prediction change. Lightweight, no dependencies.
    """
    from core.preprocessor import get_prediction_and_probability

    try:
        _, base_prob = get_prediction_and_probability(claim_type, processed_data)

        features = []
        df = processed_data.copy()

        for col in df.columns:
            # Save original value
            original = df[col].values.copy()

            # Permute: set to 0 for numeric, 'Unknown' for categorical
            if df[col].dtype in ['int64', 'float64', 'int32', 'float32']:
                # Set to mean of training data (use 0 as proxy)
                df[col] = 0
            else:
                df[col] = 'Unknown'

            try:
                _, perm_prob = get_prediction_and_probability(claim_type, df)
                impact = base_prob - perm_prob  # Positive = this feature increased fraud prob
            except Exception:
                impact = 0.0

            # Restore
            df[col] = original

            if abs(impact) > 0.001:
                features.append({
                    'feature': col,
                    'impact': round(float(impact), 4),
                    'direction': 'increases_fraud_risk' if impact > 0 else 'decreases_fraud_risk',
                    'magnitude': 'high' if abs(impact) > 0.1 else 'medium' if abs(impact) > 0.03 else 'low',
                })

        # Sort by absolute impact
        features.sort(key=lambda x: abs(x['impact']), reverse=True)

        return {
            'method': 'permutation_importance',
            'features': features[:10],
            'base_value': round(float(base_prob), 4),
        }

    except Exception as e:
        return {
            'method': 'unavailable',
            'features': [],
            'error': str(e),
        }
