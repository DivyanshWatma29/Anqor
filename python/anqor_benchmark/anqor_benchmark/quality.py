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
) -> dict:
    if not rows:
        raise ValueError("rows must not be empty")
    required = list(required)
    columns = set(rows[0])
    missing_required = [name for name in required if name not in columns]
    target_counts = Counter(row.get(target) for row in rows)
    missing = {
        column: sum(row.get(column) in (None, "") for row in rows) / len(rows)
        for column in columns
    }
    labels = set(target_counts) - {None, ""}
    report = {
        "rows": len(rows),
        "columns": sorted(columns),
        "missing_required_columns": missing_required,
        "missing_rate": missing,
        "target": target,
        "target_counts": {str(k): v for k, v in target_counts.items()},
        "class_balance": min(target_counts.values()) / max(target_counts.values()) if target_counts and max(target_counts.values()) else 0.0,
        "passed": not missing_required and missing.get(target, 1.0) <= max_missing_rate,
        "warnings": [],
    }
    if missing_required:
        report["warnings"].append("required columns are missing")
    if missing.get(target, 1.0) > max_missing_rate:
        report["warnings"].append("target missingness exceeds configured limit")
    if allowed_labels is not None and not labels.issubset(allowed_labels):
        report["warnings"].append("unexpected target labels detected")
        report["passed"] = False
    return report
