# Cloudflare production verification

Verified on 2026-09-25.

- Production URL: [`https://flagspecaudit.pages.dev/`](https://flagspecaudit.pages.dev/)
- Latest immutable deployment URL: [`https://47b190fe.flagspecaudit.pages.dev/`](https://47b190fe.flagspecaudit.pages.dev/)
- Production HTTP response: `200`
- Production JavaScript bundle: `/assets/index-DHHKJqCB.js`
- Configured contract found in production bundle: `0x6D91302e87f9c3A8BD9887F9Ea94afbDEb34748b`
- Logo response: `200`, exact deployed size `918555` bytes
- Target network: StudioNet, chain ID `61999`

The deployment was built from the repository frontend using `npm run build` and uploaded to the Cloudflare Pages project `flagspecaudit`. No API token, private key, or wallet secret is stored in the repository or frontend bundle.

The live UI was allowed to complete its retrying canonical read and displayed `LIVE CANONICAL STATE`, 5 audits, 12 evidence records, 4 sealed audits, and 3 finalized audits. It displayed the fresh audit `SafeArchive CLI E2E` as `FINALIZED / CONSISTENT` with all three evidence slots bound.

The corresponding finalized contract lifecycle and adversarial transactions are recorded in [StudioNet verification](studionet-verification.md).
