"""Distribution-drift utilities for model scores."""

from math import isfinite, log
from typing import Sequence


def _validate_scores(values: Sequence[float]) -> list[float]:
    scores = [float(value) for value in values]
    if not scores:
        raise ValueError("at least one score is required")
    if any(not isfinite(value) or not 0.0 <= value <= 1.0 for value in scores):
        raise ValueError("scores must be finite values between 0 and 1")
    return scores


def psi(
    expected: Sequence[float],
    actual: Sequence[float],
    bins: int = 10,
    epsilon: float = 1e-6,
) -> float:
    """Compute Population Stability Index between two score distributions."""
    if bins < 2:
        raise ValueError("bins must be at least 2")
    if not 0.0 < epsilon < 1.0:
        raise ValueError("epsilon must be between 0 and 1")

    base = _validate_scores(expected)
    current = _validate_scores(actual)
    edges = [index / bins for index in range(bins + 1)]
    total = 0.0

    for index in range(bins):
        lo, hi = edges[index], edges[index + 1]
        base_count = sum(lo <= value < hi or (index == bins - 1 and value == hi) for value in base)
        current_count = sum(lo <= value < hi or (index == bins - 1 and value == hi) for value in current)
        base_rate = max(base_count / len(base), epsilon)
        current_rate = max(current_count / len(current), epsilon)
        total += (current_rate - base_rate) * log(current_rate / base_rate)

    return total
