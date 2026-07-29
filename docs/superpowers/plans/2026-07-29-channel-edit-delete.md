# Channel Edit and Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let administrators safely edit saved channel parameters, optionally rotate upstream keys, and delete channels from the simplified `/admin` interface.

**Architecture:** Pure helpers validate channel IDs and mutation bodies and build a safe new-api update payload that omits blank keys and status. A new per-channel API route performs authenticated real-backend or Demo Cookie mutations, while the admin client presents controlled edit and typed-name deletion dialogs.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Node.js built-in test runner, new-api admin API

## Global Constraints

- Never return or prefill an existing upstream API Key.
- A blank edit Key preserves the existing Key; a non-blank Key rotates it.
- Preserve the existing channel type, group, priority, and unsupported new-api fields.
- Require an exact channel-name match in both browser and server before deletion.
- Editing and deletion require an authenticated administrator session.
- Keep existing channel creation and connectivity testing behavior unchanged.

---

### Task 1: Channel mutation validation and payload helpers

**Files:**
- Create: `web/lib/channel-mutations.ts`
- Create: `web/lib/channel-mutations.test.ts`

**Interfaces:**
- Produces: `ChannelUpdateInput` with `name`, `baseUrl`, `models`, `enabled`, and optional `key`.
- Produces: `parseChannelId(value: string): number | null`.
- Produces: `parseChannelUpdate(value: unknown): { value: ChannelUpdateInput } | { error: string }`.
- Produces: `buildChannelUpdatePayload(existing: Record<string, unknown>, id: number, input: ChannelUpdateInput): Record<string, unknown>`.
- Produces: `deletionNameMatches(existingName: string, confirmName: unknown): boolean`.

- [x] **Step 1: Write failing helper tests**

Create tests that assert: only positive decimal IDs are accepted; blank names/models and non-boolean status are rejected; surrounding whitespace is trimmed; blank Key is absent from the update payload; a new Key is present; `status` is absent; existing `type`, `group`, and `priority` remain unchanged; deletion confirmation requires an exact match.

- [x] **Step 2: Verify RED**

Run `npm test` in `web`. Expected: failure because `channel-mutations.ts` does not exist.

- [x] **Step 3: Implement minimal helpers**

Implement the declared functions. `buildChannelUpdatePayload` must spread the existing channel, overwrite only `id`, `name`, `base_url`, and `models`, delete `status` and `key`, then add a trimmed `key` only when non-empty.

- [x] **Step 4: Verify GREEN**

Run `npm test` in `web`. Expected: all protocol and mutation tests pass with zero failures.

### Task 2: Authenticated update and delete API

**Files:**
- Create: `web/app/api/admin/channels/[id]/route.ts`

**Interfaces:**
- Consumes all Task 1 helpers.
- `PUT /api/admin/channels/:id` accepts `ChannelUpdateInput`.
- `DELETE /api/admin/channels/:id` accepts `{ confirmName: string }`.

- [x] **Step 1: Implement PUT validation and Demo mutation**

Parse the ID and body, require a Demo user, find the channel, update `name`, `baseUrl`, `models`, and `enabled`, preserve metrics, write `DEMO_CH_COOKIE`, and return `{ success: true }`. Return 400 for bad input and 404 for a missing channel.

- [x] **Step 2: Implement real new-api PUT mutation**

Require `getSessionToken()`, fetch `GET /api/channel/:id`, build the safe payload, call `PUT /api/channel/`, then call `POST /api/channel/:id/status` with `{ status: enabled ? 1 : 2 }` only when the current state differs. Return the upstream message on failure; if only status fails, return `参数已更新，但状态更新失败：<message>`.

- [x] **Step 3: Implement DELETE for Demo and real modes**

For both modes, read the existing channel and require `deletionNameMatches`. Demo mode filters the Cookie list. Real mode calls `DELETE /api/channel/:id`. Return 400 for a name mismatch and preserve all other channels.

- [x] **Step 4: Run automated and type checks**

Run `npm test` and `npx tsc --noEmit` in `web`. Expected: both exit `0`.

### Task 3: Admin edit and delete interactions

**Files:**
- Modify: `web/app/admin/admin-client.tsx`

**Interfaces:**
- Edit state: selected `Channel`, editable name/Base URL/models/enabled, blank optional Key.
- Delete state: selected `Channel` and typed confirmation name.
- Calls Task 2 API route with `PUT` and `DELETE`.

- [x] **Step 1: Add row actions and dialog state**

Add `编辑` and red `删除` buttons beside `测试连通`. Opening edit copies non-secret fields and always initializes Key to `""`. Opening delete initializes confirmation text to `""`.

- [x] **Step 2: Add edit dialog**

Render a fixed overlay dialog with fields for name, Base URL, models, enabled status, and password-type optional new Key. Show helper text `留空表示保持现有 Key；填写后将替换旧 Key`. Disable save when busy or required fields are blank. On success close, show success notice, and call `detect()`.

- [x] **Step 3: Add typed-name delete dialog**

Render a destructive warning naming the affected channel and models. Require exact input equality before enabling `永久删除`. Send `{ confirmName }`; on success close, show success notice, and call `detect()`.

- [x] **Step 4: Verify accessible behavior and TypeScript**

Ensure both dialogs have headings, Cancel buttons, disabled submission states, and do not render existing Key material. Run `npx tsc --noEmit`; expected exit `0`.

### Task 4: Full regression verification and delivery

**Files:**
- Verify all files changed by Tasks 1–3 and this plan.

- [x] **Step 1: Run tests**

Run `npm test` in `web`. Expected: all tests pass with zero failures.

- [x] **Step 2: Run production build**

Run `npm run build` in `web`. Expected: Next.js production build exits `0`.

- [x] **Step 3: Review security-sensitive diff**

Run `git diff --check`, inspect the complete diff, and search added lines for literal secret-shaped `sk-` values. Confirm that no Key is included in GET responses, dialog initial state, logs, or error messages.

- [x] **Step 4: Commit and push**

Commit implementation and plan with message `Add channel editing and deletion`, then push `main` to `origin/main` as explicitly requested for this admin feature workflow.
