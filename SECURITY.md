# Security Policy

## Scope

This policy covers ModelFort and its reusable ML evaluation toolkit.

Do not include real customer, claimant, medical, financial, credential, model-secret, or other sensitive data in issues, pull requests, examples, or test fixtures.

## Reporting a vulnerability

Please do not disclose security vulnerabilities in a public GitHub issue. Use GitHub's private vulnerability reporting feature for this repository when available. Include the affected component and version/commit, a concise description, reproduction steps or a minimal proof of concept, impact and likely attack prerequisites, and any suggested mitigation.

Allow maintainers reasonable time to investigate before public disclosure. Security fixes should include regression tests where practical.

## Security practices

- Never commit API keys, passwords, tokens, private certificates, or production data.
- Treat uploaded documents, CSV files, model artifacts, and evaluation inputs as untrusted input.
- Keep dependencies updated and review automated dependency alerts.
- Use least-privilege credentials in CI and deployments.
- Pin or constrain critical dependencies and review lockfile changes.
- Generate provenance hashes for release artifacts where practical.
- Do not use benchmark outputs as an automatic basis for adverse decisions about people.
