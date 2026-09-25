# StudioNet verification

Verified on StudioNet (chain ID `61999`) on 2026-09-25.

- Contract: [`0x6D91302e87f9c3A8BD9887F9Ea94afbDEb34748b`](https://explorer-studio.genlayer.com/address/0x6D91302e87f9c3A8BD9887F9Ea94afbDEb34748b)
- Test wallet A: `0x67A1A08Fc4cf7D05c859d0d3D8398a3A30B1677e`
- Test wallet B: `0x7C87B10a3d43F3b3551414401F8b26B9F662bAB5`
- Deployment wallet performed no lifecycle or adversarial call.
- Reproducible source snapshot: `d1dad225ebe22577c0bb84683cc6be0f7b1e0e5c`

## Happy path

| Step | Actor | Finalized transaction |
|---|---|---|
| Create audit | A | `0x7b0c91b451ce6c8feda10c416d5cfe4e544f0418042d0844b74b1c98f1907e5f` |
| Attach documentation | B | `0x1cbd550ff66d3ba3ae67cf1096fea5b26c79b468f10854a8664dc0226d21d5ab` |
| Attach implementation | B | `0x5199bfab0b81563282f08599356979829cf3eaa1396fe2a49c04865813f1cc01` |
| Attach tests | B | `0xfeda61e8392f6bdd44c29d49910204ae9e1f9fff2382e5b3175aeb5b42df4a7d` |
| Seal matrix | A | `0x76f39aeff1125c1b6cef120190bdf6b99442868512f816ba59f71f1c9f94bd0c` |
| Comparative assessment | B | `0x64637ae8840cf48677f97c013244561cda445001dae90226542a36bdcff90693` |

Authoritative result: `FINALIZED`, verdict `CONSISTENT`, confidence `HIGH`, reason `ALL_LAYERS_ALIGNED`; all three support booleans are `true`.

## Fail-closed source path

Audit 1 uses a deliberately incorrect documentation SHA-256 while retaining otherwise valid immutable GitHub provenance.

| Step | Actor | Finalized transaction |
|---|---|---|
| Create bad-digest audit | B | `0xfc70fda820bb794ba90967f119bc419413636094309feb3ec695b3b329944f5f` |
| Attach tampered digest | A | `0x4577408b7154be8b53e1dfeacd9f00a28d6e6cfcf3f10340fea7597abc135b20` |
| Attach implementation | A | `0x689757dd526cabc6ff7bf0579304d5c2795e33a8f9f7d02f43afe03feb0f40cc` |
| Attach tests | A | `0xb8caa586cf11b2bfdb34cfb65e020d30e30b99984d91469ed2530451e0fe9c6d` |
| Seal matrix | B | `0x366dcaa9272c2e56d101ae7dcdca8cbfaea77ef973acecff3e53615ea72ffe14` |
| Assess invalid source | A | `0x5e3df924cbf9bf4b22587db6cc77f4af2cc92051e7494521dde9c14e12d59cd3` |

Authoritative result: `FINALIZED`, verdict `SOURCE_UNVERIFIED`, confidence `LOW`, reason `SOURCE_FAILURE`; no unverified content reached the comparative decision.

## Adversarial state guards

All transactions finalized, returned their bounded failure result, and left the counters unchanged.

| Guard | Actor | Finalized transaction |
|---|---|---|
| Post-seal evidence mutation | A | `0x3da838146bc782bd850c463ac405f9ed7913fbb25212e8a33ddd22e472135442` |
| Terminal assessment replay | B | `0xf32fa98e38fa7344320502f8d5278c497095ea48353175513c9fac9eaf20a177` |
| Missing audit attachment | A | `0xd278227cfe48d6608d018283299ae28b30efcff0702238f72209c49e11e8880d` |
| Invalid audit fields | B | `0x44cacbb43eb01011e8cbb3d2c8da12edadac44ecebc2edc4864131c00eb56784` |

Final counters: `audit_count=2`, `evidence_count=6`, `sealed_count=2`, `finalized_count=2`.

Runner: [`scripts/run_studionet_lifecycle.mjs`](../scripts/run_studionet_lifecycle.mjs). Private keys are environment-only and are never persisted.
