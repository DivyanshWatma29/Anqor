"""Additional framework-neutral metrics for ML evaluation."""

from math import isfinite, log
from typing import Sequence


def _validate_inputs(y_true: Sequence[int], y_score: Sequence[float]) -> None:
    if len(y_true) != len(y_score) or not y_true:
        raise ValueError("y_true and y_score must have the same non-zero length")
    if any(label not in (0, 1) for label in y_true):
        raise ValueError("y_true must contain only 0 and 1")
    if any((not isfinite(float(score))) or not 0.0 <= float(score) <= 1.0 for score in y_score):
        raise ValueError("y_score values must be finite values between 0 and 1")


def roc_auc(y_true: Sequence[int], y_score: Sequence[float]) -> float:
    """Compute ROC-AUC using average ranks for tied scores."""
    _validate_inputs(y_true, y_score)
    positives = sum(1 for y in y_true if y == 1)
    negatives = len(y_true) - positives
    if positives == 0 or negatives == 0:
        raise ValueError("roc_auc requires both positive and negative labels")

    order = sorted(range(len(y_score)), key=lambda i: float(y_score[i]))
    rank_sum = 0.0
    rank = 1
    i = 0
    while i < len(order):
        j = i + 1
        while j < len(order) and float(y_score[order[j]]) == float(y_score[order[i]]):
            j += 1
        avg_rank = (rank + rank + (j - i) - 1) / 2
        rank_sum += sum(avg_rank for k in order[i:j] if y_true[k] == 1)
        rank += j - i
        i = j
    return (rank_sum - positives * (positives + 1) / 2) / (positives * negatives)


def pr_auc(y_true: Sequence[int], y_score: Sequence[float]) -> float:
    """Compute step-wise precision-recall area using score-tied groups."""
    _validate_inputs(y_true, y_score)
    positives = sum(1 for y in y_true if y == 1)
    if positives == 0:
        raise ValueError("pr_auc requires at least one positive label")

    order = sorted(range(len(y_score)), key=lambda i: float(y_score[i]), reverse=True)
    tp = fp = 0
    previous_recall = 0.0
    area = 0.0
    index = 0
    while index < len(order):
        end = index + 1
        score = float(y_score[order[index]])
        while end < len(order) and float(y_score[order[end]]) == score:
            end += 1

        for position in order[index:end]:
            if y_true[position] == 1:
                tp += 1
            else:
                fp += 1

        recall = tp / positives
        precision = tp / (tp + fp)
        area += (recall - previous_recall) * precision
        previous_recall = recall
        index = end
    return area


def brier_score(y_true: Sequence[int], y_score: Sequence[float]) -> float:
    """Compute mean squared probability error."""
    _validate_inputs(y_true, y_score)
    return sum((float(score) - int(label)) ** 2 for label, score in zip(y_true, y_score)) / len(y_true)


def expected_calibration_error(
    y_true: Sequence[int], y_score: Sequence[float], bins: int = 10
) -> float:
    """Compute equal-width expected calibration error over score bins."""
    _validate_inputs(y_true, y_score)
    if bins < 1:
        raise ValueError("bins must be at least 1")

    total = len(y_true)
    error = 0.0
    for bucket in range(bins):
        lo = bucket / bins
        hi = (bucket + 1) / bins
        members = [
            i
            for i, score in enumerate(y_score)
            if lo <= float(score) < hi or (bucket == bins - 1 and float(score) == 1.0)
        ]
        if not members:
            continue
        confidence = sum(float(y_score[i]) for i in members) / len(members)
        accuracy = sum(int(y_true[i]) for i in members) / len(members)
        error += len(members) / total * abs(confidence - accuracy)
    return error


def safe_log_loss(
    y_true: Sequence[int], y_score: Sequence[float], eps: float = 1e-15
) -> float:
    """Compute binary log loss with probability clipping."""
    _validate_inputs(y_true, y_score)
    if not 0.0 < eps < 0.5:
        raise ValueError("eps must be between 0 and 0.5")
    loss = 0.0
    for label, score in zip(y_true, y_score):
        probability = min(max(float(score), eps), 1.0 - eps)
        loss -= int(label) * log(probability) + (1 - int(label)) * log(1 - probability)
    return loss / len(y_true)
