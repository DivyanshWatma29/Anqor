# Threat model

Anqor processes potentially sensitive claim information and uploaded documents. This document records the primary security boundaries for contributors.

## Assets

- application credentials and API tokens;
- claim and document contents supplied by users;
- model artifacts and configuration;
- authentication/session state;
- generated prediction reports.

## Trust boundaries

1. Browser to application API.
2. Application API to storage/authentication services.
3. Application API to ML service.
4. Uploaded files to document parsing and model inference.
5. External AI provider calls, when document extraction is enabled.

## Threats

- malicious file uploads and parser abuse;
- oversized requests and resource exhaustion;
- prompt injection through untrusted document contents;
- credential leakage through logs or client bundles;
- unauthorized access to stored prediction history;
- dependency vulnerabilities;
- model abuse through repeated automated requests.

## Mitigations

Contributors should validate file type and size, enforce authentication and authorization at the server boundary, keep secrets server-side, avoid logging raw sensitive inputs, constrain external AI prompts and treat extracted content as untrusted data, and run dependency/security checks in CI.

This is a living document. Security-sensitive architectural changes should update it as part of the same pull request.
