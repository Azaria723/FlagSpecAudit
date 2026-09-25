# Cloudflare production verification

Verified on 2026-09-25.

- Production URL: [`https://flagspecaudit.pages.dev/`](https://flagspecaudit.pages.dev/)
- Immutable deployment URL: [`https://5eda1f2c.flagspecaudit.pages.dev/`](https://5eda1f2c.flagspecaudit.pages.dev/)
- Production HTTP response: `200`
- Production JavaScript bundle: `/assets/index-CfVUA2bt.js`
- Configured contract found in production bundle: `0x6D91302e87f9c3A8BD9887F9Ea94afbDEb34748b`
- Logo response: `200`, exact deployed size `918555` bytes
- Target network: StudioNet, chain ID `61999`

The deployment was built from the repository frontend using `npm run build` and uploaded to the Cloudflare Pages project `flagspecaudit`. No API token, private key, or wallet secret is stored in the repository or frontend bundle.

The corresponding finalized contract lifecycle and adversarial transactions are recorded in [StudioNet verification](studionet-verification.md).
