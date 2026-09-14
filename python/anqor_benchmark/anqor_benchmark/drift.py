"""Distribution drift utilities for model scores."""

from math import isfinite
from typing import Sequence


def _validate_scores(values: Sequence[float]) -> list[float]:
    scores = [float(v) for v in values]
    if not scores:
        raise ValueError("at least one score is required")
    if any(not isfinite(v) or not 0.0 <= v <= 1.0 for v in scores):
        raise ValueError("scores must be finite values between 0 and 1")
    return scores


def psi(expected: Sequence[float], actual: Sequence[float], bins: int = 10, epsilon: float = 1e-6) -> float:
    """Population Stability Index between two score distributions."""
    if bins < 2:
        raise ValueError("bins must be at least 2")
    base = _validate_scores(expected)
    current = _validate_scores(actual)
    edges = [i / bins for i in range(bins + 1)]
    total = 0.0
    for i in range(bins):
        lo, hi = edges[i], edges[i + 1]
        base_count = sum(lo <= x < hi or (i == bins - 1 and x == hi) for x in base)
        cur_count = sum(lo <= x < hi or (i == bins - 1 and x == hi) for x in current)
        base_rate = max(base_count / len(base), epsilon)
        cur_rate = max(cur_count / len(current), epsilon)
        total += (cur_rate - base_rate) * __import__("math").log(cur_rate / base_rate)
    return total
