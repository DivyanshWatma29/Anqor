# ModelFort Benchmark

`anqor-benchmark` is the framework-neutral evaluation engine behind the ModelFort project. It accepts labels and model scores rather than a specific ML framework, so it can be used with scikit-learn, XGBoost, LightGBM, PyTorch, or custom pipelines.

## Install

```bash
pip install -e '.[dev]'
```

## Evaluate predictions

Create a CSV containing `y_true` and `y_score`, then run:

```bash
modelfort evaluate ../../examples/predictions.csv --threshold 0.5 --json report.json
```

Enforce a release policy:

```bash
modelfort evaluate ../../examples/predictions.csv \
  --gate '{"f1":{"min":0.75},"pr_auc":{"min":0.70},"ece":{"max":0.10}}'
```

A failed policy exits with status code `2`, which makes the command usable as a CI release gate.

## Python API

```python
from anqor_benchmark import evaluate_binary_classifier, evaluate_gate, pr_auc, roc_auc

result = evaluate_binary_classifier(y_true, y_score, threshold=0.5)
print(result.metrics)
print(roc_auc(y_true, y_score), pr_auc(y_true, y_score))

gate = evaluate_gate(result.metrics, {"f1": {"min": 0.80}})
assert gate.passed
```

The package intentionally uses plain Python sequences for core calculations and has no runtime ML-framework dependency.

## Stability

The package is alpha software. Metric definitions and report schemas are versioned in the repository. Behavior changes should include tests and documentation.
