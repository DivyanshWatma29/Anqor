# Security Policy

## Scope

This policy covers the Anqor repository and its reusable ML evaluation toolkit.

Do not include real customer data, claimant information, credentials, private model artifacts, or other sensitive material in issues, pull requests, examples, or tests.

## Reporting a vulnerability

Please do not disclose suspected vulnerabilities in a public issue. Use GitHub's private vulnerability reporting feature when available. Include the affected component or commit, a concise description, reproduction steps or a minimal proof of concept, impact, and any suggested mitigation.

Please allow reasonable time for investigation and remediation before public disclosure. Security fixes should include regression tests where practical.

## Security practices

- Never commit API keys, passwords, tokens, private certificates, or production data.
- Treat prediction files and other evaluation inputs as untrusted input.
- Keep dependencies and GitHub Actions up to date.
- Review CI and release changes for credential and supply-chain impact.
- Avoid placing sensitive evaluation data in logs or generated reports.
- Do not treat benchmark results as an automatic basis for adverse decisions about people.
