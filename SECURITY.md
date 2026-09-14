# Security Policy

## Scope

This policy covers the Anqor source repository and its reusable benchmark toolkit.

Do not include real customer, claimant, medical, financial, credential, or other sensitive data in issues, pull requests, examples, or test fixtures.

## Reporting a vulnerability

Please do not disclose security vulnerabilities in a public GitHub issue.

Use GitHub's private vulnerability reporting feature for this repository when available. Include:

- affected component and version/commit;
- a concise description of the vulnerability;
- reproduction steps or a minimal proof of concept;
- impact and likely attack prerequisites;
- any suggested mitigation.

Allow maintainers reasonable time to investigate before public disclosure.

## Security practices

- Never commit API keys, passwords, tokens, private certificates, or production data.
- Treat uploaded documents and CSV files as untrusted input.
- Keep dependencies updated and review automated dependency alerts.
- Do not use benchmark outputs as an automatic basis for adverse decisions about people.
