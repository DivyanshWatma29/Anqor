# Anqor

Framework-neutral, reproducible tooling for evaluating machine-learning predictions before release.

Anqor is a small Python toolkit for measuring model quality, calibration, score drift, dataset quality, artifact provenance, and explicit release policies. It works with predictions produced by scikit-learn, XGBoost, LightGBM, PyTorch, or custom ML pipelines without coupling evaluation to a specific framework.

Anqor is evaluation infrastructure, not a model-training framework and not an automatic decision system.

## What it provides

- Binary classification metrics at a configurable threshold
- ROC-AUC and tie-aware step-wise PR-AUC
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
python -m pip install -e '.[dev]'
pytest
```

Evaluate a prediction file:

```bash
anqor evaluate ../../examples/predictions.csv --threshold 0.5 --json report.json
```

Apply the checked-in release policy:

```bash
anqor evaluate ../../examples/predictions.csv --gate-file ../../examples/release-policy.json
```

The expected CSV format is:

```csv
y_true,y_score
0,0.08
0,0.22
1,0.62
1,0.93
```

A failed gate exits with status code `2`, making the command suitable for CI checks.

## Repository layout

```text
.
├── .github/                 # CI, security, issue and contribution configuration
├── docs/                    # methodology, architecture and security notes
├── examples/                # small synthetic fixtures and examples
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

**Reproducibility.** Results should be explainable from their inputs, metric definitions, threshold, and provenance.

**Framework neutrality.** The core API accepts ordinary Python sequences and mappings rather than requiring a model library.

**Explicit policy.** Metrics are evidence; release decisions are separately defined policies expressed through gates.

**Human oversight.** Evaluation results support engineering and risk review; they do not silently replace human judgment.

**Security by default.** Repository automation avoids application secrets, validates untrusted evaluation inputs, and uses dependency and code scanning.

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
