# Anqor

**Open, reproducible tooling for explainable tabular fraud-risk models.**

Anqor is an open-source reference stack for building, evaluating, and operating machine-learning systems that flag suspicious financial or insurance claims. It combines a production-style web application with a small, provider-neutral Python evaluation toolkit so developers can measure model quality, threshold trade-offs, subgroup performance, and calibration before deployment.

> Anqor is a research and engineering toolkit. It is not a substitute for human investigation, regulatory review, or professional insurance decisions.

[![CI](https://github.com/DivyanshWatma29/Anqor/actions/workflows/ci.yml/badge.svg)](https://github.com/DivyanshWatma29/Anqor/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.10%2B-blue.svg)](python/anqor_benchmark/pyproject.toml)

## Why Anqor exists

Fraud datasets are usually treated as ordinary binary-classification problems even though production systems have asymmetric costs, changing prevalence, imperfect labels, and fairness requirements. Anqor provides a transparent evaluation layer around those realities.

The project has two parts:

1. **Anqor app** — a reference application for insurance-claim fraud analysis with prediction, bulk processing, dashboards, and explainability.
2. **Anqor Benchmark** — a lightweight Python toolkit for evaluating predictions independently of the web application or model provider.

The benchmark layer is deliberately dependency-light so it can be reused with scikit-learn, XGBoost, LightGBM, PyTorch, or custom models.

## Benchmark capabilities

- Precision, recall, F1, specificity, balanced accuracy, and MCC
- ROC-AUC and PR-AUC when probability scores are available
- Threshold sweeps and operating-point selection
- Expected-cost analysis for asymmetric false-positive/false-negative costs
- Calibration error and reliability statistics
- Optional subgroup evaluation using user-supplied group columns
- Machine-readable JSON reports for CI and experiment tracking
- Deterministic, tested metric calculations

## Example

```python
from anqor_benchmark import evaluate_binary_classifier

report = evaluate_binary_classifier(
    y_true=[0, 0, 1, 1, 1],
    y_score=[0.10, 0.30, 0.55, 0.80, 0.95],
    threshold=0.50,
    positive_label=1,
)

print(report.metrics["f1"])
print(report.metrics["pr_auc"])
```

See [`examples/evaluate_predictions.py`](examples/evaluate_predictions.py) for a complete example.

## Repository structure

```text
.
├── python/
│   └── anqor_benchmark/       # reusable evaluation toolkit
│       ├── anqor_benchmark/
│       ├── tests/
│       └── pyproject.toml
├── examples/                   # reproducible usage examples
├── docs/                       # benchmark methodology and threat model
├── .github/                    # CI, issue forms, PR workflow
├── ml-service/                 # existing reference ML service
├── api/                        # application API entrypoint
└── src/                        # React application
```

## Getting started

### Benchmark toolkit

```bash
cd python/anqor_benchmark
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -e '.[dev]'
pytest
```

### Existing web application

The application requires Node.js 18+ and Python 3.10+. See [`DEPLOYMENT.md`](DEPLOYMENT.md) for deployment configuration and the environment-variable examples in the repository.

## Design principles

**Reproducibility.** Every benchmark result should be explainable from its inputs, metric definitions, and threshold.

**Model-provider neutrality.** The evaluation layer accepts predictions and scores rather than depending on one ML framework.

**Human oversight.** Fraud scores are decision-support signals; they should not become automatic adverse decisions without appropriate review.

**Security by default.** Secrets stay outside source control, uploads are validated, dependencies are continuously checked, and security reports have a documented disclosure path.

**Contributor friendliness.** Small issues should be independently actionable, tests should run in CI, and significant behavior changes should be documented.

## Documentation

- [Benchmark methodology](docs/benchmark.md)
- [Threat model](docs/threat-model.md)
- [Contributing](CONTRIBUTING.md)
- [Security policy](SECURITY.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Changelog](CHANGELOG.md)
- [Citation](CITATION.cff)

## Roadmap

- [x] Core binary-classification metrics
- [x] Threshold and cost evaluation
- [x] Calibration statistics
- [x] JSON evaluation reports
- [ ] Dataset quality checks and schema validation
- [ ] Drift and temporal-slice evaluation
- [ ] Fairness metrics with explicit group definitions
- [ ] Model-card generation
- [ ] CLI: `anqor evaluate predictions.csv`
- [ ] Public benchmark datasets and baseline results

Roadmap items are intentionally tracked as issues so contributors can propose implementations and discuss scope before coding.

## Contributing

Anqor is maintained as an open-source project. Bug reports, documentation improvements, benchmark methodology reviews, tests, and code contributions are welcome. Start with [`CONTRIBUTING.md`](CONTRIBUTING.md).

## License

Anqor is released under the [MIT License](LICENSE).
