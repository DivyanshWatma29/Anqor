"""Command-line interface for Anqor benchmark workflows."""

import argparse
import csv
import json
from pathlib import Path

from .gates import evaluate_gate
from .metrics import evaluate_binary_classifier
from .metrics_extra import brier_score, expected_calibration_error, pr_auc, roc_auc, safe_log_loss
from .report import build_report, write_json


def _read_predictions(path: str) -> tuple[list[int], list[float]]:
    """Read a CSV containing y_true and y_score columns."""
    with Path(path).open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    if not rows or not {"y_true", "y_score"}.issubset(rows[0]):
        raise ValueError("CSV must contain y_true and y_score columns")
    try:
        y_true = [int(row["y_true"]) for row in rows]
        y_score = [float(row["y_score"]) for row in rows]
    except (TypeError, ValueError) as exc:
        raise ValueError("y_true must be integers and y_score must be numbers") from exc
    return y_true, y_score


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
        help='JSON rules, e.g. {"f1":{"min":0.8},"pr_auc":{"min":0.7}}',
    )
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

    if args.gate:
        gate = evaluate_gate(metrics, json.loads(args.gate))
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
