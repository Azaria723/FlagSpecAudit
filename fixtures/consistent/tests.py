from pathlib import Path
import pytest
from implementation import safe_destination

@pytest.mark.parametrize("member", ["../secret", "/etc/passwd", "link/../../secret"])
def test_escape_is_rejected(tmp_path: Path, member: str):
    with pytest.raises(ValueError):
        safe_destination(tmp_path, member)
