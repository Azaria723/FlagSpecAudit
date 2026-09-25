from pathlib import Path

def safe_destination(root: Path, member: str) -> Path:
    destination = (root / member).resolve()
    destination.relative_to(root.resolve())
    return destination
