# Public API Address Correction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every public website configuration example use the verified production base URL `https://api.siliconfission.com/v1`.

**Architecture:** Define the canonical address directly in the documentation client rather than deriving it from `window.location.origin`. Correct the separate homepage example to the same value while leaving internal upstream routing untouched.

**Tech Stack:** Next.js 16, React 19, TypeScript

## Global Constraints

- The only public base URL is `https://api.siliconfission.com/v1`.
- Never derive the API base URL from the frontend origin.
- Do not place a real API key in source control.
- Do not modify upstream channel addresses or API behavior.

---

### Task 1: Correct public configuration sources

**Files:**
- Modify: `web/app/(console)/docs/docs-client.tsx:1-16`
- Modify: `web/app/page.tsx:96`

**Interfaces:**
- Consumes: the existing `base` interpolation used by the documentation table and three snippets.
- Produces: a stable `PUBLIC_API_BASE_URL` used by every documentation example.

- [ ] **Step 1: Run the stale-address check and verify it fails**

Run:

```bash
rg -n 'window\.location\.origin|api\.siliconfission\.ai/v1' web/app
```

Expected: matches in `docs-client.tsx` and `page.tsx`.

- [ ] **Step 2: Replace dynamic inference with the canonical constant**

In `docs-client.tsx`, remove `useEffect`, keep `useState` for UI state, and add:

```tsx
const PUBLIC_API_BASE_URL = "https://api.siliconfission.com/v1";
```

Replace the `base` state and effect with:

```tsx
const base = PUBLIC_API_BASE_URL;
```

In `page.tsx`, change the Python example to:

```python
base_url="https://api.siliconfission.com/v1",
```

- [ ] **Step 3: Verify stale addresses are gone**

Run:

```bash
rg -n 'window\.location\.origin|api\.siliconfission\.ai/v1|www\.siliconfission\.com/v1' web/app
rg -n 'https://api\.siliconfission\.com/v1' web/app
git diff --check
```

Expected: the first search exits `1`; the canonical address appears in the docs client and homepage.

### Task 2: Verify display, copied snippets, and delivery

**Files:**
- Verify: `web/app/(console)/docs/docs-client.tsx`
- Verify: `web/app/page.tsx`
- Update: `docs/superpowers/plans/2026-07-30-public-api-address.md`

**Interfaces:**
- No new runtime API.

- [ ] **Step 1: Run automated verification**

Run in `web`:

```bash
npm test
npx tsc --noEmit
npm run build
```

Expected: all commands exit `0`.

- [ ] **Step 2: Inspect the documentation page**

Open `/docs` and confirm the table displays `https://api.siliconfission.com/v1`. Switch through Python, Node.js, and cURL and confirm each code block contains the same base URL. Click copy for each tab and confirm the clipboard contains that address.

- [ ] **Step 3: Review and commit**

Run `git diff --check` and confirm the product diff contains only the two public address corrections. Commit with:

```bash
git add web/app/'(console)'/docs/docs-client.tsx web/app/page.tsx docs/superpowers/plans/2026-07-30-public-api-address.md
git commit -m "Correct public API address"
```

- [ ] **Step 4: Push and verify synchronization**

Push `main` to `origin/main`, fetch, and verify local `HEAD` equals `origin/main`.
