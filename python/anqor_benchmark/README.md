# Anqor Benchmark

`anqor-benchmark` is the reusable Python evaluation layer in Anqor. It accepts labels and model scores instead of depending on a particular ML framework.

## Install

```bash
cd python/anqor_benchmark
python -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
```

## Evaluate predictions

Create a CSV containing `y_true` and `y_score`, then run:

```bash
anqor evaluate ../../examples/predictions.csv --threshold 0.5 --json report.json
```

Enforce an explicit release policy:

```bash
anqor evaluate ../../examples/predictions.csv \
  --gate '{"f1":{"min":0.75},"pr_auc":{"min":0.70},"ece":{"max":0.10}}'
```

A failed policy exits with status code `2`, which makes the command suitable for CI.

## Python API

```python
from anqor_benchmark import evaluate_binary_classifier, evaluate_gate, pr_auc, roc_auc

result = evaluate_binary_classifier(y_true, y_score, threshold=0.5)
print(result.metrics)
print(roc_auc(y_true, y_score), pr_auc(y_true, y_score))

gate = evaluate_gate(result.metrics, {"f1": {"min": 0.80}})
assert gate.passed
```

The runtime has no ML-framework dependency and uses ordinary Python sequences and mappings for core calculations.

## Scope

The package currently covers binary evaluation, calibration, score-distribution drift, dataset quality profiling, artifact hashing, JSON reports, and metric release gates. It does not train models or manage application infrastructure.

Anqor is alpha software; public APIs and report schemas may evolve before a stable release.
