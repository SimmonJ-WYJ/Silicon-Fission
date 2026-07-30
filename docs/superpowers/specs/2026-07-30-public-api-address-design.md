# Public API Address Correction Design

## Goal

Make every public configuration example use the verified production gateway address instead of deriving an API address from the frontend website origin.

## Canonical Address

The only public OpenAI-compatible base URL displayed by the website is:

```text
https://api.siliconfission.com/v1
```

The frontend website address `https://www.siliconfission.com` must never be used as an API base URL.

## Scope

- Replace the documentation page's browser-origin inference with the canonical API base URL.
- Ensure the documentation table and its Python, Node.js, and cURL copy examples all consume the same canonical value.
- Keep the homepage Python example aligned with the canonical production API base URL.
- Search the public web source for stale frontend-origin API variants and remove any obsolete example URLs.
- Do not change upstream channel addresses, internal gateway routing, authentication, or API behavior.

## Behavior

- The displayed and copied base URL stays correct regardless of whether the frontend is opened through `siliconfission.com`, `www.siliconfission.com`, a Vercel preview, or localhost.
- Existing code tabs and copy feedback remain unchanged.
- The API key remains a placeholder and no real secret is placed in source control.

## Verification

- Confirm all public configuration examples contain `https://api.siliconfission.com/v1`.
- Confirm no stale public SiliconFission API address remains in `web` source.
- Run tests, TypeScript, and the production build.
- Inspect the documentation page and copied snippets in a browser.
