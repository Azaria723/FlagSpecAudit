# Local verification

Run `python -m pytest -q` from the project root. The suite covers the complete sealed-matrix happy path, every bounded verdict, commit/tree/raw-source failures, digest mismatch, malformed model output, prompt injection, incomplete evidence, duplicate slot, invalid slot, missing audit, post-seal immutability, and terminal replay.

StudioNet evidence remains pending deployment and must not be inferred from local mocks.
