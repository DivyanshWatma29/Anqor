# Maintainer Readiness Checklist

Use this checklist before asking others to rely on a ModelFort release.

- [ ] CI is green on the release commit.
- [ ] Security workflow is green and no known critical dependency issue remains unreviewed.
- [ ] Public API changes are documented.
- [ ] Benchmark fixtures reproduce the documented result.
- [ ] Report schema changes are versioned and explained.
- [ ] Changelog is updated.
- [ ] Contributor-facing documentation is current.
- [ ] Release notes identify known limitations.
- [ ] Model claims are supported by reproducible evidence.
- [ ] Sensitive datasets and credentials are excluded from the repository.

A strong maintainer process treats a passing metric as evidence, not as a guarantee of safe production behavior.
