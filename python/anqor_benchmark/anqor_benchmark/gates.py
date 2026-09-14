"""Policy gates for deciding whether an ML evaluation is release-ready."""

from dataclasses import dataclass
from typing import Mapping


@dataclass(frozen=True)
class GateResult:
    passed: bool
    checks: dict[str, bool]
    failures: tuple[str, ...]

    def to_dict(self) -> dict:
        return {"passed": self.passed, "checks": self.checks, "failures": list(self.failures)}


def evaluate_gate(metrics: Mapping[str, float], rules: Mapping[str, Mapping[str, float]]) -> GateResult:
    checks: dict[str, bool] = {}
    failures: list[str] = []
    operators = {
        "min": lambda value, target: value >= target,
        "max": lambda value, target: value <= target,
    }
    for metric, policy in rules.items():
        if metric not in metrics:
            checks[metric] = False
            failures.append(f"missing metric: {metric}")
            continue
        result = True
        for operator, target in policy.items():
            if operator not in operators:
                raise ValueError(f"unsupported gate operator: {operator}")
            result = result and operators[operator](float(metrics[metric]), float(target))
        checks[metric] = result
        if not result:
            failures.append(f"gate failed: {metric}={metrics[metric]} policy={dict(policy)}")
    return GateResult(not failures, checks, tuple(failures))
