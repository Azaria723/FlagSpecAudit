from implementation import inspect

def test_returns_command_output(monkeypatch):
    monkeypatch.setattr("subprocess.run", lambda *a, **k: type("R", (), {"stdout": b"ok"})())
    assert inspect("archive.tar") == b"ok"
