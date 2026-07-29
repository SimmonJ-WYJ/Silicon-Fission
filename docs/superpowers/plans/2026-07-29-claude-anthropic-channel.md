# Claude / Anthropic Channel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Claude / Anthropic preset to the simplified admin and create new-api Anthropic channels without changing existing OpenAI-compatible behavior.

**Architecture:** A small shared protocol module owns validation and the new-api numeric type mapping. The admin preset sends an explicit protocol to the existing channel API, and that API validates and maps it before constructing the new-api request.

**Tech Stack:** Next.js 16, React 19, TypeScript, Node.js built-in test runner

## Global Constraints

- Existing OpenAI-compatible presets continue to create channel type `1`.
- Anthropic channels create new-api channel type `14`.
- Unknown protocols return HTTP 400 before contacting new-api.
- Do not add a generic protocol selector, channel editing, image protocol support, or deployment changes.

---

### Task 1: Protocol validation and mapping

**Files:**
- Create: `web/lib/channel-protocol.ts`
- Create: `web/lib/channel-protocol.test.ts`
- Modify: `web/package.json`

**Interfaces:**
- Produces: `type ChannelProtocol = "openai" | "anthropic"`
- Produces: `parseChannelProtocol(value: unknown): ChannelProtocol | null`
- Produces: `channelTypeForProtocol(protocol: ChannelProtocol): number`

- [x] **Step 1: Write failing tests**

Create tests asserting omitted/`openai` values parse to `openai`, `anthropic` maps to `14`, and an unknown string parses to `null`. Add `"test": "node --test lib/*.test.ts"` to `web/package.json`.

- [x] **Step 2: Verify RED**

Run `npm test` in `web`. Expected: failure because `channel-protocol.ts` does not exist.

- [x] **Step 3: Implement the mapping**

Implement the exact union type, parser, and exhaustive mapping. Map `openai` to `1` and `anthropic` to `14`.

- [x] **Step 4: Verify GREEN**

Run `npm test` in `web`. Expected: all protocol tests pass.

### Task 2: Channel API protocol support

**Files:**
- Modify: `web/app/api/admin/channels/route.ts`

**Interfaces:**
- Consumes: `parseChannelProtocol` and `channelTypeForProtocol` from `@/lib/channel-protocol`
- Accepts: optional JSON property `protocol`

- [x] **Step 1: Add API integration of tested mapping**

Read `protocol` from the JSON body, reject `null` parsing with `{ success: false, message: "不支持的渠道协议" }` and status `400`, and replace hard-coded `type: 1` with `channelTypeForProtocol(channelProtocol)`.

- [x] **Step 2: Run protocol tests and TypeScript check**

Run `npm test` and `npx tsc --noEmit` in `web`. Expected: both exit `0`.

### Task 3: Claude / Anthropic admin preset

**Files:**
- Modify: `web/app/admin/admin-client.tsx`

**Interfaces:**
- Each preset contains `protocol: ChannelProtocol`
- `addChannel` sends the active preset protocol in its JSON request

- [x] **Step 1: Add explicit protocol metadata**

Add `protocol: "openai"` to existing presets and a preset `{ id: "anthropic", label: "Claude / Anthropic", protocol: "anthropic", baseUrl: "", models: "" }`.

- [x] **Step 2: Submit the selected protocol**

Resolve the active preset in `addChannel` and include `protocol` in the request body. Keep all existing fields unchanged.

- [x] **Step 3: Verify UI source and compilation**

Run `rg -n 'Claude / Anthropic|protocol' web/app/admin/admin-client.tsx` and `npx tsc --noEmit` in `web`. Expected: the preset and submitted protocol are present; TypeScript exits `0`.

### Task 4: Full verification and delivery

**Files:**
- Verify all changed files

- [x] **Step 1: Run tests**

Run `npm test` in `web`. Expected: all tests pass.

- [x] **Step 2: Run production build**

Run `npm run build` in `web`. Expected: Next.js production build exits `0`.

- [x] **Step 3: Review diff**

Run `git diff --check`, inspect `git diff`, and confirm no secrets or unrelated changes are present.

- [x] **Step 4: Commit and push**

Commit implementation and plan with message `Add Anthropic channel preset`, then push `main` to `origin/main`.
