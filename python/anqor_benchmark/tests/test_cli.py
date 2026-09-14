import json

from anqor_benchmark.cli import main


def test_cli_gate_file_passes(capsys, monkeypatch, tmp_path):
    predictions = tmp_path / "predictions.csv"
    predictions.write_text("y_true,y_score\n0,0.05\n0,0.10\n1,0.90\n1,0.95\n", encoding="utf-8")
    gate_file = tmp_path / "policy.json"
    gate_file.write_text(json.dumps({"f1": {"min": 0.75}}), encoding="utf-8")
    monkeypatch.setattr(
        "sys.argv",
        ["anqor", "evaluate", str(predictions), "--gate-file", str(gate_file)],
    )

    assert main() == 0
    report = json.loads(capsys.readouterr().out)
    assert report["gate"]["passed"] is True


def test_cli_rejects_both_gate_inputs(monkeypatch, tmp_path):
    predictions = tmp_path / "predictions.csv"
    predictions.write_text("y_true,y_score\n0,0.1\n1,0.9\n", encoding="utf-8")
    gate_file = tmp_path / "policy.json"
    gate_file.write_text("{}", encoding="utf-8")
    monkeypatch.setattr(
        "sys.argv",
        [
            "anqor",
            "evaluate",
            str(predictions),
            "--gate",
            '{"f1":{"min":0.5}}',
            "--gate-file",
            str(gate_file),
        ],
    )

    import pytest

    with pytest.raises(ValueError, match="either --gate or --gate-file"):
        main()
