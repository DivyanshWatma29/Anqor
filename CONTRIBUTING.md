# Contributing to Anqor

Thank you for contributing. Anqor values reproducible experiments, small reviewable changes, and clear documentation.

## Before opening an issue

Search existing issues first. For bugs, include the affected version/commit, environment, reproduction steps, expected behavior, actual behavior, and relevant logs without secrets or personal data.

For feature requests, explain the user problem and why the proposed behavior belongs in the project rather than only describing an implementation.

## Development

For the Python benchmark:

```bash
cd python/anqor_benchmark
python -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
pytest
```

For frontend changes:

```bash
npm ci
npm run lint
npm test
npm run build
```

## Pull requests

- Keep changes focused.
- Add or update tests for behavior changes.
- Update documentation when public behavior changes.
- Do not commit secrets, generated credentials, private datasets, or real claimant information.
- Explain important design or metric changes in the PR description.

Maintainers may ask for benchmarks, additional tests, or a smaller patch when a change is difficult to review.

## Commit messages

Prefer concise conventional prefixes such as `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, and `chore:`.
