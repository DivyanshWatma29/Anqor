# Architecture

Anqor separates evaluation logic from the model or application that produced the predictions.

```text
model / pipeline
      |
 labels + scores
      |
      v
+------------------------+
|      Anqor Core        |
| metrics / calibration  |
| drift / quality / gate |
| provenance / reports   |
+-----------+------------+
            |
      +-----+-----+
      |           |
   JSON report  exit code
      |           |
 experiment log   CI gate
```

## Boundary

The core toolkit accepts ordinary Python values. It does not train models, manage application authentication, store customer records, or require cloud credentials.

## Evaluation flow

1. A model or pipeline produces labels and/or probability scores.
2. Anqor validates the inputs and computes evaluation metrics.
3. Optional quality, calibration, drift, and provenance checks add context.
4. A policy gate evaluates explicit `min` and `max` rules.
5. The CLI emits machine-readable JSON and uses a non-zero exit code when a configured gate fails.

Keeping these concerns separate makes the evaluator reusable across ML frameworks and CI systems.
