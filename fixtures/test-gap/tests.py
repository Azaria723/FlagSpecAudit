from pathlib import Path
from implementation import safe_destination

def test_normal_member(tmp_path: Path):
    assert safe_destination(tmp_path, "docs/readme.txt") == tmp_path / "docs/readme.txt"
