"""Additional framework-neutral metrics for ML release assurance."""

from math import log, sqrt
from typing import Sequence


def roc_auc(y_true: Sequence[int], y_score: Sequence[float]) -> float:
    if len(y_true) != len(y_score) or not y_true:
        raise ValueError("y_true and y_score must have the same non-zero length")
    positives = sum(1 for y in y_true if y == 1)
    negatives = sum(1 for y in y_true if y == 0)
    if positives == 0 or negatives == 0:
        return 0.5
    order = sorted(range(len(y_score)), key=lambda i: float(y_score[i]))
    rank_sum = 0.0
    rank = 1
    i = 0
    while i < len(order):
        j = i + 1
        while j < len(order) and y_score[order[j]] == y_score[order[i]]:
            j += 1
        avg_rank = (rank + rank + (j - i) - 1) / 2
        rank_sum += sum(avg_rank for k in order[i:j] if y_true[k] == 1)
        rank += j - i
        i = j
    return (rank_sum - positives * (positives + 1) / 2) / (positives * negatives)


def pr_auc(y_true: Sequence[int], y_score: Sequence[float]) -> float:
    if len(y_true) != len(y_score) or not y_true:
        raise ValueError("y_true and y_score must have the same non-zero length")
    positives = sum(1 for y in y_true if y == 1)
    if positives == 0:
        return 0.0
    order = sorted(range(len(y_score)), key=lambda i: float(y_score[i]), reverse=True)
    tp = fp = 0
    prev_recall = 0.0
    area = 0.0
    for i in order:
        if y_true[i] == 1:
            tp += 1
        else:
            fp += 1
        recall = tp / positives
        precision = tp / (tp + fp)
        area += (recall - prev_recall) * precision
        prev_recall = recall
    return area


def brier_score(y_true: Sequence[int], y_score: Sequence[float]) -> float:
    if len(y_true) != len(y_score) or not y_true:
        raise ValueError("y_true and y_score must have the same non-zero length")
    return sum((float(s) - int(y)) ** 2 for y, s in zip(y_true, y_score)) / len(y_true)


def expected_calibration_error(y_true: Sequence[int], y_score: Sequence[float], bins: int = 10) -> float:
    if bins < 1:
        raise ValueError("bins must be at least 1")
    if len(y_true) != len(y_score) or not y_true:
        raise ValueError("y_true and y_score must have the same non-zero length")
    total = len(y_true)
    error = 0.0
    for bucket in range(bins):
        lo = bucket / bins
        hi = (bucket + 1) / bins
        members = [i for i, s in enumerate(y_score) if lo <= float(s) < hi or (bucket == bins - 1 and float(s) == 1.0)]
        if not members:
            continue
        confidence = sum(float(y_score[i]) for i in members) / len(members)
        accuracy = sum(int(y_true[i]) for i in members) / len(members)
        error += len(members) / total * abs(confidence - accuracy)
    return error


def safe_log_loss(y_true: Sequence[int], y_score: Sequence[float], eps: float = 1e-15) -> float:
    if len(y_true) != len(y_score) or not y_true:
        raise ValueError("y_true and y_score must have the same non-zero length")
    loss = 0.0
    for y, score in zip(y_true, y_score):
        p = min(max(float(score), eps), 1.0 - eps)
        loss -= int(y) * log(p) + (1 - int(y)) * log(1 - p)
    return loss / len(y_true)
