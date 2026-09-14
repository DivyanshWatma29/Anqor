# Release Process

Anqor uses small, reviewable releases with reproducible verification.

## Before release

1. Run the Python test suite.
2. Run the public example.
3. Review dependency and security alerts.
4. Verify CLI behavior and release-gate examples.
5. Update `CHANGELOG.md` with user-facing changes.
6. Confirm documentation and examples match the current API.

## Versioning

Use semantic versioning for the Python package. Breaking changes to the public API or report schema require a migration note.

## Release evidence

A release should record the package version, source commit, supported Python versions, representative evaluation fixture, and relevant security status. Artifact hashes can be produced with `sha256_file()`.

## Release principle

A passing metric is not by itself proof that a model is production-ready. Release policy should consider the relevant quality, calibration, drift, data, and operational checks configured for the use case.
