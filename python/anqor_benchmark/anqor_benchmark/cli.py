"""Command-line interface for Anqor benchmark workflows."""

import argparse
import csv
import json
from collections.abc import Mapping
from pathlib import Path
from typing import Any

from .gates import evaluate_gate
from .metrics import evaluate_binary_classifier
from .metrics_extra import brier_score, expected_calibration_error, pr_auc, roc_auc, safe_log_loss
from .report import build_report, write_json


def _read_predictions(path: str) -> tuple[list[int], list[float]]:
    """Read a CSV containing y_true and y_score columns."""
    input_path = Path(path)
    if not input_path.is_file():
        raise FileNotFoundError(input_path)
    with input_path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames or not {"y_true", "y_score"}.issubset(reader.fieldnames):
            raise ValueError("CSV must contain y_true and y_score columns")
        rows = list(reader)

    if not rows:
        raise ValueError("CSV must contain at least one prediction row")

    y_true: list[int] = []
    y_score: list[float] = []
    for line_number, row in enumerate(rows, start=2):
        try:
            y_true.append(int(row["y_true"]))
            y_score.append(float(row["y_score"]))
        except (KeyError, TypeError, ValueError) as exc:
            raise ValueError(f"invalid y_true/y_score values on CSV line {line_number}") from exc
    return y_true, y_score


def _load_gate(raw: str | None, gate_file: str | None) -> Mapping[str, Mapping[str, float]] | None:
    if raw and gate_file:
        raise ValueError("use either --gate or --gate-file, not both")
    if gate_file:
        path = Path(gate_file)
        if not path.is_file():
            raise FileNotFoundError(path)
        data: Any = json.loads(path.read_text(encoding="utf-8"))
    elif raw:
        data = json.loads(raw)
    else:
        return None

    if not isinstance(data, dict) or any(
        not isinstance(policy, dict) for policy in data.values()
    ):
        raise ValueError("gate policy must be a JSON object mapping metric names to rule objects")
    return data


def main() -> int:
    parser = argparse.ArgumentParser(
        prog="anqor",
        description="Evaluate ML predictions and enforce release policies.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    evaluate = subparsers.add_parser(
        "evaluate",
        help="Evaluate a CSV containing y_true and y_score columns",
    )
    evaluate.add_argument("csv")
    evaluate.add_argument("--threshold", type=float, default=0.5)
    evaluate.add_argument("--json", dest="json_path")
    evaluate.add_argument(
        "--gate",
        help='Inline JSON rules, e.g. {"f1":{"min":0.8},"pr_auc":{"min":0.7}}',
    )
    evaluate.add_argument("--gate-file", help="Path to a JSON gate-policy file")
    args = parser.parse_args()

    if args.command != "evaluate":
        return 1

    y_true, y_score = _read_predictions(args.csv)
    base = evaluate_binary_classifier(y_true, y_score, threshold=args.threshold)
    metrics = dict(base.metrics)
    metrics.update(
        {
            "roc_auc": roc_auc(y_true, y_score),
            "pr_auc": pr_auc(y_true, y_score),
            "brier_score": brier_score(y_true, y_score),
            "log_loss": safe_log_loss(y_true, y_score),
            "ece": expected_calibration_error(y_true, y_score),
        }
    )
    result = type(base)(
        metrics=metrics,
        confusion_matrix=base.confusion_matrix,
        threshold=base.threshold,
    )
    report = build_report(result, metadata={"rows": len(y_true), "input": args.csv})

    gate_policy = _load_gate(args.gate, args.gate_file)
    if gate_policy is not None:
        gate = evaluate_gate(metrics, gate_policy)
        report["gate"] = gate.to_dict()
        if not gate.passed:
            print(json.dumps(report, indent=2, sort_keys=True))
            return 2

    if args.json_path:
        write_json(report, args.json_path)
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
