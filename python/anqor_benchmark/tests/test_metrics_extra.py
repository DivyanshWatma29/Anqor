import pytest

from anqor_benchmark.metrics_extra import (
    brier_score,
    expected_calibration_error,
    pr_auc,
    roc_auc,
    safe_log_loss,
)


def test_roc_auc_perfect_ranked():
    assert roc_auc([0, 0, 1, 1], [0.1, 0.2, 0.8, 0.9]) == 1.0


def test_roc_auc_tied_scores_use_average_ranks():
    assert roc_auc([0, 1], [0.5, 0.5]) == 0.5


def test_roc_auc_requires_two_classes():
    with pytest.raises(ValueError, match="both positive and negative"):
        roc_auc([1, 1], [0.8, 0.9])


def test_pr_auc_perfect_ranked():
    assert pr_auc([0, 0, 1, 1], [0.1, 0.2, 0.8, 0.9]) == 1.0


def test_brier_score_zero_for_perfect_probabilities():
    assert brier_score([0, 1], [0.0, 1.0]) == 0.0


def test_calibration_error_zero_for_perfect_predictions():
    assert expected_calibration_error([0, 1], [0.0, 1.0]) == 0.0


def test_log_loss_is_finite_at_extremes():
    assert safe_log_loss([0, 1], [0.0, 1.0]) >= 0.0


def test_extra_metrics_reject_invalid_scores():
    with pytest.raises(ValueError, match="between 0 and 1"):
        brier_score([0, 1], [0.2, 1.2])
