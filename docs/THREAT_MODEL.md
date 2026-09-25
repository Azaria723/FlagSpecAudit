# Threat model

- Branch movement: full commits are mandatory.
- Content substitution: SHA-256 and Git blob SHA-1 are recomputed.
- SSRF: sources use a strict GitHub owner/repo/commit/path schema.
- Tree ambiguity: truncated trees and duplicate paths fail closed.
- Prompt injection: source is quoted as untrusted data and output identity/schema are enforced.
- Evidence replacement: slots cannot be overwritten and sealed audits reject attachment.
- Model authority: validators cannot choose IDs, lifecycle state, coverage, or counters.
- Deployer capture: no owner/admin/deployer authority exists.
