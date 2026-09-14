# Threat Model

Anqor is a local and CI-oriented evaluation toolkit. Its primary inputs are prediction files and other evaluation artifacts supplied by users or automation.

## Assets

- prediction labels and probability scores;
- evaluation reports;
- model or dataset artifact metadata;
- CI credentials and release configuration.

## Trust boundaries

1. User or CI process to the Anqor CLI.
2. CSV and JSON-like inputs to parser and validation logic.
3. Anqor output to CI release decisions and stored reports.
4. Repository automation to package publication.

## Threats

- malformed or adversarial input values;
- very large inputs causing resource exhaustion;
- sensitive data accidentally written to reports or logs;
- dependency or GitHub Action supply-chain vulnerabilities;
- release automation using unintended credentials or artifacts;
- misleading evaluation results caused by invalid labels, scores, or policy rules.

## Mitigations

Anqor validates labels, scores, thresholds, gate rules, finite numeric values, and required dataset fields. Core calculations do not execute model or document code. CI runs tests, dependency auditing, and Python-focused CodeQL analysis. Contributors should keep secrets outside source control, avoid sensitive fixtures, review generated reports, and treat all externally supplied evaluation data as untrusted.
