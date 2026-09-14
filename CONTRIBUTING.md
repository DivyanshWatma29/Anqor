# Contributing to Anqor

Anqor values small, reviewable changes, reproducible evaluation, and clear documentation.

## Before opening an issue

Search existing issues first. For bugs, include the affected version or commit, environment, reproduction steps, expected behavior, actual behavior, and relevant logs without secrets or personal data.

For feature requests, describe the user problem and why the change belongs in Anqor.

## Development

```bash
cd python/anqor_benchmark
python -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
pytest
```

Run the example from the repository root:

```bash
python examples/evaluate_predictions.py
```

## Pull requests

- Keep changes focused.
- Add or update tests for behavior changes.
- Update documentation when public behavior changes.
- Do not commit secrets, generated credentials, private datasets, or real claimant information.
- Explain important metric or policy changes in the PR description.

## Commit messages

Prefer concise prefixes such as `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, and `chore:`.
