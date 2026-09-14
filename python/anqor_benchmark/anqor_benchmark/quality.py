"""Dependency-free dataset quality checks for tabular ML data."""

from collections import Counter
from typing import Iterable, Mapping, Sequence


def profile_binary_dataset(
    rows: Sequence[Mapping[str, object]],
    *,
    target: str,
    required: Iterable[str] = (),
    allowed_labels: set[object] | None = None,
    max_missing_rate: float = 0.25,
) -> dict[str, object]:
    """Profile a tabular binary-classification dataset without pandas dependencies."""
    if not rows:
        raise ValueError("rows must not be empty")
    if not target:
        raise ValueError("target must not be empty")
    if not 0.0 <= max_missing_rate <= 1.0:
        raise ValueError("max_missing_rate must be between 0 and 1")

    row_columns = [set(row) for row in rows]
    columns = sorted(set().union(*row_columns))
    required_columns = list(dict.fromkeys(required))
    missing_required = [name for name in required_columns if any(name not in cols for cols in row_columns)]

    missing_rate = {
        column: sum(row.get(column) in (None, "") for row in rows) / len(rows)
        for column in columns
    }
    target_values = [row.get(target) for row in rows]
    target_counts = Counter(value for value in target_values if value not in (None, ""))
    labels = set(target_counts)

    balance = 0.0
    if target_counts:
        largest = max(target_counts.values())
        smallest = min(target_counts.values())
        balance = smallest / largest if largest else 0.0

    passed = (
        not missing_required
        and target in columns
        and missing_rate.get(target, 1.0) <= max_missing_rate
    )
    warnings: list[str] = []

    if missing_required:
        warnings.append("required columns are missing in one or more rows")
    if target not in columns:
        warnings.append("target column is missing")
    elif missing_rate[target] > max_missing_rate:
        warnings.append("target missingness exceeds configured limit")
    if allowed_labels is not None and not labels.issubset(allowed_labels):
        warnings.append("unexpected target labels detected")
        passed = False

    return {
        "rows": len(rows),
        "columns": columns,
        "missing_required_columns": missing_required,
        "missing_rate": missing_rate,
        "target": target,
        "target_counts": {str(key): value for key, value in target_counts.items()},
        "class_balance": balance,
        "passed": passed,
        "warnings": warnings,
    }
