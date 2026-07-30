# Admin Quota Adjustment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a signed-in administrator increase or decrease any user's New API quota from the SiliconFission admin user table.

**Architecture:** Add a small server-side quota conversion and validation module, then expose it through a dedicated Next.js route that translates USD-equivalent adjustments into New API's `POST /api/user/manage` request (`action: add_quota`, `mode: add|subtract`). Add an admin modal that submits to this route and refreshes the user table after success.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Node test runner, New API admin HTTP API.

## Global Constraints

- Keep upstream `quota` as the source of truth and use `500000 quota = 1 USD`.
- The amount must be positive, finite, and have at most four decimal places.
- Demo mode reports success without persisting data.
- The action must work for every listed user, including the root user; existing destructive root-user restrictions remain unchanged.
- The user-facing `/topup` demo page and payment behavior are out of scope.
- An optional remark is accepted by the local route but is not forwarded because New API's current `ManageRequest` has no remark field.

---

### Task 1: Quota adjustment validation and upstream payload

**Files:**
- Create: `web/lib/quota-adjustment.ts`
- Test: `web/lib/quota-adjustment.test.ts`

**Interfaces:**
- Produces: `parseQuotaAdjustment(input: unknown): { ok: true; value: QuotaAdjustment } | { ok: false; message: string }`
- Produces: `toNewApiQuotaRequest(adjustment: QuotaAdjustment): { id: number; action: "add_quota"; mode: "add" | "subtract"; value: number }`

- [ ] **Step 1: Write failing tests for valid increase/decrease conversion and invalid values**

Test IDs, actions, four-decimal USD amounts, zero, negative, non-finite, excessive precision, malformed IDs, and remarks longer than the accepted local limit.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `cd web && node --test lib/quota-adjustment.test.ts`

Expected: FAIL because `quota-adjustment.ts` does not exist.

- [ ] **Step 3: Implement the parser and payload converter**

Convert USD-equivalent amount with `Math.round(amount * QUOTA_PER_USD)`, require the result to be a positive safe integer, map `increase` to `add`, and map `decrease` to `subtract`.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `cd web && node --test lib/quota-adjustment.test.ts`

Expected: all quota-adjustment tests pass.

- [ ] **Step 5: Commit the tested domain helper**

```bash
git add web/lib/quota-adjustment.ts web/lib/quota-adjustment.test.ts
git commit -m "Add quota adjustment validation"
```

### Task 2: Admin quota API route

**Files:**
- Create: `web/app/api/admin/users/quota/route.ts`
- Modify: `web/lib/quota-adjustment.test.ts`

**Interfaces:**
- Consumes: `parseQuotaAdjustment` and `toNewApiQuotaRequest` from Task 1.
- Produces: `POST /api/admin/users/quota` accepting `{ id, action, amount, remark? }`.

- [ ] **Step 1: Add a failing test for the exact New API request shape**

Assert that `{ id: 7, action: "increase", amount: 10 }` becomes `{ id: 7, action: "add_quota", mode: "add", value: 5000000 }` and that decrease maps to `subtract`.

- [ ] **Step 2: Run the test and verify RED for any missing behavior**

Run: `cd web && node --test lib/quota-adjustment.test.ts`

- [ ] **Step 3: Add the route with authentication, demo mode, and fail-closed upstream handling**

Use the session token, call `napiFetch("/api/user/manage", { method: "POST", body: JSON.stringify(payload) }, token)`, preserve the upstream error message, and return success only when New API returns `success: true`.

- [ ] **Step 4: Run tests and TypeScript checking**

Run: `cd web && npm test && npx tsc --noEmit`

Expected: all tests pass and TypeScript exits `0`.

- [ ] **Step 5: Commit the API route**

```bash
git add web/app/api/admin/users/quota/route.ts web/lib/quota-adjustment.test.ts
git commit -m "Add admin quota adjustment API"
```

### Task 3: Admin user-table interaction

**Files:**
- Modify: `web/app/(console)/admin/admin-client.tsx`

**Interfaces:**
- Consumes: `POST /api/admin/users/quota`.
- Produces: Per-user `调整额度` action and adjustment modal.

- [ ] **Step 1: Add modal state and form submission behavior**

Track selected user, increase/decrease operation, amount, optional remark, form-specific error, and submitting state. On success close the modal, show a success notice, and call `detect()` to refresh balances.

- [ ] **Step 2: Render `调整额度` for every user row**

Keep existing promote/demote/enable/disable/delete actions unavailable for root, but render quota adjustment independently so root can also be credited or debited.

- [ ] **Step 3: Render the accessible confirmation modal**

Show the target username and current balance, require a positive amount, show the resulting action clearly, and disable submission while invalid or busy.

- [ ] **Step 4: Run TypeScript, tests, and production build**

Run: `cd web && npm test && npx tsc --noEmit && npm run build`

Expected: tests pass, TypeScript exits `0`, and the Next.js production build completes with `/api/admin/users/quota` in the route list.

- [ ] **Step 5: Commit the UI**

```bash
git add 'web/app/(console)/admin/admin-client.tsx'
git commit -m "Add admin quota adjustment controls"
```

### Task 4: Documentation and final verification

**Files:**
- Modify: `docs/FEATURES.md`
- Modify: `web/README.md`

**Interfaces:**
- Documents: direct admin quota adjustment versus the separate demo top-up page.

- [ ] **Step 1: Document the new admin route and behavior**

Add `/api/admin/users/quota` to the proxy table and state that it forwards to New API's `/api/user/manage` with `add_quota` mode.

- [ ] **Step 2: Document the admin workflow**

Explain that `调整额度` directly modifies quota and does not create or complete a payment order.

- [ ] **Step 3: Run final verification**

Run: `cd web && npm test && npx tsc --noEmit && npm run build`

Expected: all commands exit `0`.

- [ ] **Step 4: Commit documentation**

```bash
git add docs/FEATURES.md web/README.md
git commit -m "Document admin quota adjustments"
```

