# Architecture

ModelFort separates evaluation logic from the application layer so that release assurance can be reused in any ML stack.

```text
             model / pipeline
                    |
             prediction scores
                    |
        +-----------v------------+
        |     ModelFort Core     |
        | metrics / calibration  |
        | quality / drift / gate |
        +-----------+------------+
                    |
       +------------+-------------+
       |                          |
   JSON evidence             CI exit code
       |                          |
       v                          v
 dashboards / audit        deployment gate
```

## Boundaries

The core Python package accepts ordinary Python values. It deliberately does not own model training, databases, authentication, or cloud credentials.

The application layer can add persistence, visualisation, authentication and model-specific adapters. This prevents the reusable evaluator from being coupled to one vendor or web framework.

## Evidence model

A release evaluation consists of:

- inputs: labels, scores and optional metadata;
- metrics: discrimination, classification and calibration statistics;
- policy: explicit threshold rules;
- provenance: artifact hashes and evaluation metadata;
- outcome: pass/fail with human-readable failures.

The JSON report is intended to become the stable integration surface for CI and other tools.
