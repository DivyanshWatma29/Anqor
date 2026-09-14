"""Policy gates for deciding whether an ML evaluation passes."""

from dataclasses import dataclass
from math import isfinite
from typing import Mapping


@dataclass(frozen=True)
class GateResult:
    """Outcome of applying metric threshold rules."""

    passed: bool
    checks: dict[str, bool]
    failures: tuple[str, ...]

    def to_dict(self) -> dict[str, object]:
        return {
            "passed": self.passed,
            "checks": self.checks,
            "failures": list(self.failures),
        }


def evaluate_gate(
    metrics: Mapping[str, float],
    rules: Mapping[str, Mapping[str, float]],
) -> GateResult:
    """Apply supported min/max rules to named metrics."""
    checks: dict[str, bool] = {}
    failures: list[str] = []
    operators = {
        "min": lambda value, target: value >= target,
        "max": lambda value, target: value <= target,
    }

    for metric, policy in rules.items():
        if not policy:
            raise ValueError(f"gate policy for {metric!r} must not be empty")
        if metric not in metrics:
            checks[metric] = False
            failures.append(f"missing metric: {metric}")
            continue

        value = float(metrics[metric])
        if not isfinite(value):
            checks[metric] = False
            failures.append(f"metric is not finite: {metric}={value}")
            continue

        result = True
        for operator, target in policy.items():
            if operator not in operators:
                raise ValueError(f"unsupported gate operator: {operator}")
            target_value = float(target)
            if not isfinite(target_value):
                raise ValueError(f"gate target must be finite: {metric}.{operator}")
            result = result and operators[operator](value, target_value)

        checks[metric] = result
        if not result:
            failures.append(f"gate failed: {metric}={value} policy={dict(policy)}")

    return GateResult(not failures, checks, tuple(failures))
