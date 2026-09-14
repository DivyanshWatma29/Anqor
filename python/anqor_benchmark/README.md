# anqor-benchmark

A dependency-light Python toolkit for evaluating binary risk-model predictions.

## Install

```bash
pip install -e '.[dev]'
```

## Quick start

```python
from anqor_benchmark import evaluate_binary_classifier

result = evaluate_binary_classifier(
    y_true=[0, 0, 1, 1],
    y_score=[0.1, 0.4, 0.7, 0.9],
    threshold=0.5,
)

print(result.metrics)
```

The package intentionally accepts plain sequences. This keeps the evaluation layer independent from pandas, NumPy, scikit-learn, and any particular model framework.
