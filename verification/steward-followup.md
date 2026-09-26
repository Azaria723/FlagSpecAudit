# Steward follow-up: complete live lifecycle

Verified on StudioNet (chain ID `61999`) on 2026-09-26 against contract [`0x6D91302e87f9c3A8BD9887F9Ea94afbDEb34748b`](https://explorer-studio.genlayer.com/address/0x6D91302e87f9c3A8BD9887F9Ea94afbDEb34748b).

## Frontend hardening

The frontend now:

- restores an already-authorized wallet with `eth_accounts` after reload, while clearly requesting reconnection when no account is authorized;
- tracks `accountsChanged` and `chainChanged`, and blocks writes unless the live account matches and the wallet is on StudioNet `61999`;
- keeps the configured contract and network as build-time constants;
- retries transient canonical reads and never replaces a verified snapshot with fabricated zero records;
- displays `—` and `Canonical state unavailable` if no authoritative snapshot has ever loaded;
- distinguishes `SUBMITTED`, `PENDING`, `FINALIZED`, `REVERTED`, `REJECTED`, `TIMEOUT`, and `FAILED` transaction outcomes;
- persists the last transaction hash/status across reloads, retains its Explorer link, and offers `Check status` after a timeout or failure;
- reconciles every finalized write by re-reading counts, audits, and all evidence slots from the canonical contract.

## Fresh end-to-end audit

Fresh audit ID: `4`. Wallet A created and sealed the audit. Wallet B attached all three sources and requested comparative assessment.

| Step | Actor | Finalized transaction |
|---|---|---|
| Create audit | A | [`0x548c…3d92a`](https://explorer-studio.genlayer.com/tx/0x548cd6e95f17053dc1d1b2a5a327bccbb8919ff62b26d00829699b5f13e3d92a) |
| Attach documentation | B | [`0x97a7…57591`](https://explorer-studio.genlayer.com/tx/0x97a7bd5eb20c4588f28b78040b55a2513dc9440fe96963f3414efc80db557591) |
| Attach implementation | B | [`0xa5b1…99853`](https://explorer-studio.genlayer.com/tx/0xa5b167e16bcbd87e11d942008e42005008993911fc38ea5c529a291ee7799853) |
| Attach tests | B | [`0xbaa6…595da`](https://explorer-studio.genlayer.com/tx/0xbaa66983d3464bcafb91535cde76ebabf7b4fc3d9e9745de2f2f942b5db595da) |
| Seal audit | A | [`0xcc3a…f336c`](https://explorer-studio.genlayer.com/tx/0xcc3a4582b4513fcfd6c58f725f72a437fc225e515b96099897b4e1fb0a1f336c) |
| Assess audit | B | [`0x77ed…2c2e7`](https://explorer-studio.genlayer.com/tx/0x77ed769833379272bf3f0418ba9fc56a713c42c1b7dfa5c20064aa713132c2e7) |

Canonical audit result:

- status: `FINALIZED`
- verdict: `CONSISTENT`
- confidence: `HIGH`
- reason: `ALL_LAYERS_ALIGNED`
- coverage bitmap: `7`
- documentation support: `true`
- implementation support: `true`
- test support: `true`

Canonical counter delta for this isolated run:

| Counter | Before | After | Expected delta |
|---|---:|---:|---:|
| Audits | 4 | 5 | +1 |
| Evidence | 9 | 12 | +3 |
| Sealed | 3 | 4 | +1 |
| Finalized | 2 | 3 | +1 |

Reproduction runner: [`scripts/run_studionet_fresh_e2e.mjs`](../scripts/run_studionet_fresh_e2e.mjs). Wallet keys remain environment-only.
