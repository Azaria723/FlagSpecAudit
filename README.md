# FlagSpecAudit

FlagSpecAudit is a GenLayer Intelligent Contract that verifies whether a CLI security claim is consistently supported by its documentation, implementation, and tests.

Live application: [`https://flagspecaudit.pages.dev/`](https://flagspecaudit.pages.dev/). See the [Cloudflare production verification](verification/cloudflare-production.md), [finalized StudioNet evidence](verification/studionet-verification.md), and [fresh steward-requested lifecycle proof](verification/steward-followup.md).

## Architecture

Each audit is a sealed three-slot evidence matrix, not a graph or version lineage. Users may register any public GitHub repository; the included fixtures are reproducible first-party reference cases, not an allowlist.

Every source is bound to GitHub owner, repository, full 40-character commit, canonical path, and exact SHA-256. Validators reconstruct the commit/tree/blob provenance, reject truncated or ambiguous trees, recompute Git blob SHA-1 and SHA-256, then use comparative consensus across the three verified texts.

Lifecycle: `DRAFT → SEALED → FINALIZED`. All three slots are required before sealing, and sealed evidence is immutable. The contract has no owner, administrator, or deployer capability.

## Verdicts

`CONSISTENT`, `DOC_CODE_DRIFT`, `TEST_GAP`, `IMPLEMENTATION_UNSAFE`, `CLAIM_UNSUPPORTED`, `INCONCLUSIVE`, or fail-closed `SOURCE_UNVERIFIED`.

## Development

```bash
python -m pytest -q
cd frontend
npm install
npm run build
```

Target: GenLayer StudioNet, chain ID `61999`. Contract runtime and tests use `0.2.16`.
