"""Reusable evaluation primitives for binary risk models."""

from .metrics import EvaluationResult, evaluate_binary_classifier

__all__ = ["EvaluationResult", "evaluate_binary_classifier"]
