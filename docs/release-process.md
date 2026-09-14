# Release Process

ModelFort uses small, reviewable releases. Every release should have a clear scope and reproducible verification.

## Before release

1. Run the Python test suite.
2. Run frontend lint, tests and build.
3. Re-run representative benchmark fixtures.
4. Review dependency changes and security alerts.
5. Update `CHANGELOG.md` with user-facing changes.
6. Confirm documentation and examples still work.

## Versioning

Use semantic versioning for the Python package and keep report-schema changes explicitly documented. Breaking changes require a migration note.

## Release evidence

A release should record its tested Python versions, relevant benchmark fixture, package version, source commit and security status. Artifact hashes can be generated with `sha256_file()`.

## Maintainer rule

No release is considered production-ready solely because a model metric improved. The release policy must also consider calibration, data quality, drift and operational risk where those checks are configured.
