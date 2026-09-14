"""Framework-neutral ML evaluation primitives for Anqor."""

from .drift import psi
from .gates import GateResult, evaluate_gate
from .metrics import EvaluationResult, evaluate_binary_classifier
from .metrics_extra import brier_score, expected_calibration_error, pr_auc, roc_auc, safe_log_loss
from .provenance import artifact_record, sha256_file
from .quality import profile_binary_dataset

__all__ = [
    "EvaluationResult",
    "GateResult",
    "artifact_record",
    "brier_score",
    "evaluate_binary_classifier",
    "evaluate_gate",
    "expected_calibration_error",
    "pr_auc",
    "profile_binary_dataset",
    "psi",
    "roc_auc",
    "safe_log_loss",
    "sha256_file",
]
