import json

import pytest

from anqor_benchmark import (
    EvaluationResult,
    artifact_record,
    evaluate_gate,
    expected_calibration_error,
    profile_binary_dataset,
    psi,
    sha256_file,
)
from anqor_benchmark.report import build_report, write_json


def test_psi_is_zero_for_identical_distributions():
    values = [0.1, 0.2, 0.4, 0.7, 0.9]
    assert psi(values, values) == pytest.approx(0.0)


def test_psi_rejects_invalid_values():
    with pytest.raises(ValueError, match="between 0 and 1"):
        psi([0.1], [1.1])


def test_dataset_profile_detects_missing_required_column():
    report = profile_binary_dataset(
        [{"label": 0, "score": 0.1}, {"label": 1, "score": 0.9}],
        target="label",
        required=["score", "id"],
    )
    assert report["passed"] is False
    assert "id" in report["missing_required_columns"]


def test_dataset_profile_accepts_valid_fixture():
    report = profile_binary_dataset(
        [{"label": 0, "score": 0.1}, {"label": 1, "score": 0.9}],
        target="label",
        allowed_labels={0, 1},
    )
    assert report["passed"] is True
    assert report["class_balance"] == 1.0


def test_gate_reports_failed_policy():
    result = evaluate_gate({"f1": 0.72}, {"f1": {"min": 0.75}})
    assert result.passed is False
    assert result.checks["f1"] is False
    assert result.failures


def test_gate_rejects_invalid_operator():
    with pytest.raises(ValueError, match="unsupported gate operator"):
        evaluate_gate({"f1": 0.8}, {"f1": {"target": 0.75}})


def test_artifact_hash_and_report(tmp_path):
    artifact = tmp_path / "fixture.csv"
    artifact.write_text("y_true,y_score\n0,0.1\n1,0.9\n", encoding="utf-8")
    record = artifact_record(artifact)
    assert record["size_bytes"] == artifact.stat().st_size
    assert len(record["sha256"]) == 64
    assert sha256_file(artifact) == record["sha256"]

    result = EvaluationResult(
        metrics={"f1": 1.0},
        confusion_matrix={"tp": 1, "fp": 0, "tn": 1, "fn": 0},
        threshold=0.5,
    )
    report = build_report(result, metadata={"rows": 2})
    output = tmp_path / "report.json"
    write_json(report, output)
    assert json.loads(output.read_text(encoding="utf-8"))["schema_version"] == "1.0"


def test_calibration_error_requires_non_empty_inputs():
    with pytest.raises(ValueError, match="non-zero"):
        expected_calibration_error([], [])
