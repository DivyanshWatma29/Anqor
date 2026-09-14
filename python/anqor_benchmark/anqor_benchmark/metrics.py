"""Dependency-free binary classification metrics.

The implementation intentionally uses only the Python standard library so the
benchmark layer can be embedded in different ML stacks.
"""

from dataclasses import dataclass
from math import sqrt
from typing import Sequence


@dataclass(frozen=True)
class EvaluationResult:
    """Metrics and confusion-matrix counts for one operating threshold."""

    metrics: dict[str, float]
    confusion_matrix: dict[str, int]
    threshold: float


def _validate(y_true: Sequence[int], y_score: Sequence[float], threshold: float) -> None:
    if len(y_true) != len(y_score):
        raise ValueError("y_true and y_score must have the same length")
    if not y_true:
        raise ValueError("at least one observation is required")
    if not 0.0 <= threshold <= 1.0:
        raise ValueError("threshold must be between 0 and 1")
    if any(label not in (0, 1) for label in y_true):
        raise ValueError("y_true must contain only 0 and 1")
    if any(not 0.0 <= float(score) <= 1.0 for score in y_score):
        raise ValueError("y_score values must be between 0 and 1")


def evaluate_binary_classifier(
    y_true: Sequence[int],
    y_score: Sequence[float],
    threshold: float = 0.5,
    positive_label: int = 1,
) -> EvaluationResult:
    """Evaluate binary predictions at a chosen probability threshold."""
    if positive_label != 1:
        raise ValueError("positive_label must be 1; encode labels before evaluation")
    _validate(y_true, y_score, threshold)

    tp = fp = tn = fn = 0
    for truth, score in zip(y_true, y_score):
        predicted = int(float(score) >= threshold)
        if truth == 1 and predicted == 1:
            tp += 1
        elif truth == 0 and predicted == 1:
            fp += 1
        elif truth == 0 and predicted == 0:
            tn += 1
        else:
            fn += 1

    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    specificity = tn / (tn + fp) if tn + fp else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    balanced_accuracy = (recall + specificity) / 2
    denominator = sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn))
    mcc = ((tp * tn) - (fp * fn)) / denominator if denominator else 0.0

    return EvaluationResult(
        metrics={
            "precision": precision,
            "recall": recall,
            "specificity": specificity,
            "f1": f1,
            "balanced_accuracy": balanced_accuracy,
            "mcc": mcc,
        },
        confusion_matrix={"tp": tp, "fp": fp, "tn": tn, "fn": fn},
        threshold=threshold,
    )
