# Anqor

Framework-neutral, reproducible tooling for evaluating machine-learning predictions before release.

Anqor is a small Python toolkit for measuring model quality, calibration, score drift, dataset quality, artifact provenance, and explicit release policies. It is designed to work with predictions produced by scikit-learn, XGBoost, LightGBM, PyTorch, or custom ML pipelines without coupling evaluation to a specific framework.

Anqor is evaluation infrastructure, not a model-training framework and not an automatic decision system.

## What it provides

- Binary classification metrics at a configurable threshold
- ROC-AUC and step-wise PR-AUC
- Brier score, log loss, and expected calibration error
- Population Stability Index (PSI) for score-distribution drift
- Lightweight tabular dataset quality profiling
- SHA-256 artifact provenance helpers
- JSON evaluation reports
- CI release gates using `min` and `max` metric rules
- A command-line interface for reproducible evaluation

## Quick start

```bash
cd python/anqor_benchmark
python -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
pytest
```

Evaluate a prediction file:

```bash
anqor evaluate ../../examples/predictions.csv --threshold 0.5 --json report.json
```

Apply release rules:

```bash
anqor evaluate ../../examples/predictions.csv \
  --gate '{"f1":{"min":0.75},"pr_auc":{"min":0.70},"ece":{"max":0.10}}'
```

The expected CSV format is:

```csv
y_true,y_score
0,0.08
0,0.22
1,0.62
1,0.93
```

A failed gate exits with status code `2`, making it suitable for CI checks.

## Repository layout

```text
.
├── .github/                 # CI, security, issue and contribution workflows
├── docs/                    # methodology, architecture and security notes
├── examples/                # small reproducible fixtures and examples
├── python/anqor_benchmark/  # reusable Python package
├── CHANGELOG.md
├── CITATION.cff
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE
├── README.md
└── SECURITY.md
```

## Design principles

**Reproducibility.** Evaluation results should be explainable from their inputs, definitions, threshold, and provenance.

**Framework neutrality.** The core API accepts ordinary Python sequences and mappings rather than a specific model library.

**Explicit policy.** A metric is evidence; a release decision is a separately defined policy expressed through gates.

**Human oversight.** Evaluation results should support engineering and risk review, not silently replace human judgment.

**Security by default.** Repository automation should avoid secrets, validate untrusted inputs, and run dependency and code scanning.

## Documentation

- [Benchmark methodology](docs/benchmark.md)
- [Architecture](docs/architecture.md)
- [Threat model](docs/threat-model.md)
- [Contributing](CONTRIBUTING.md)
- [Security policy](SECURITY.md)
- [Release process](docs/release-process.md)

## Project status

Anqor is alpha software. The public API and report schema may evolve before a stable release. Changes should include tests and documentation.

## License

Anqor is released under the MIT License.
