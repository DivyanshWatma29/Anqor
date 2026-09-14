import pytest

from anqor_benchmark import evaluate_binary_classifier


def test_perfect_predictions():
    result = evaluate_binary_classifier([0, 0, 1, 1], [0.1, 0.2, 0.8, 0.9])
    assert result.metrics["precision"] == 1.0
    assert result.metrics["recall"] == 1.0
    assert result.metrics["f1"] == 1.0
    assert result.confusion_matrix == {"tp": 2, "fp": 0, "tn": 2, "fn": 0}


def test_threshold_changes_operating_point():
    low = evaluate_binary_classifier([0, 1, 1], [0.4, 0.45, 0.9], threshold=0.4)
    high = evaluate_binary_classifier([0, 1, 1], [0.4, 0.45, 0.9], threshold=0.5)
    assert low.confusion_matrix["fp"] == 1
    assert high.confusion_matrix["fp"] == 0
    assert high.confusion_matrix["fn"] == 1


def test_invalid_lengths():
    with pytest.raises(ValueError, match="same length"):
        evaluate_binary_classifier([0, 1], [0.2])


def test_invalid_threshold():
    with pytest.raises(ValueError, match="threshold"):
        evaluate_binary_classifier([0, 1], [0.2, 0.8], threshold=1.2)


def test_invalid_label():
    with pytest.raises(ValueError, match="only 0 and 1"):
        evaluate_binary_classifier([0, 2], [0.2, 0.8])
