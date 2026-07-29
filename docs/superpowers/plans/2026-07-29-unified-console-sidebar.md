# Unified Console Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render one responsive, OpenRouter-inspired sidebar across all existing console routes while exposing only working destinations and preserving every public URL.

**Architecture:** Pure navigation helpers define menu sections and active-state rules. A focused client sidebar handles pathname/hash state, administrator visibility, and the mobile drawer. A Next.js `(console)` route-group layout applies the shell to existing console pages without changing their URLs.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Node.js built-in test runner

## Global Constraints

- Keep `/dashboard`, `/models`, `/chat`, `/docs`, `/topup`, `/settings`, and `/admin` URLs unchanged.
- Render links only for existing functional destinations.
- Hide Channel Configuration unless `fetchMe()` confirms `isAdmin === true`.
- Keep server-side `/admin` authorization as the final access-control boundary.
- Preserve the existing global header, footer, APIs, authentication, billing, keys, chat, models, and channel behavior.
- Desktop uses a persistent sidebar; mobile uses an accessible dismissible drawer.
- `/dashboard#api-keys` must scroll to and activate the API Keys destination.

---

### Task 1: Testable console navigation model

**Files:**
- Create: `web/lib/console-navigation.ts`
- Create: `web/lib/console-navigation.test.ts`

**Interfaces:**
- Produces: `ConsoleNavItem`, `ConsoleNavSection`, and `CONSOLE_NAV_SECTIONS`.
- Produces: `visibleConsoleSections(isAdmin: boolean): ConsoleNavSection[]`.
- Produces: `isConsoleItemActive(item: ConsoleNavItem, pathname: string, hash: string): boolean`.
- Consumes: no React or browser globals.

- [x] **Step 1: Write failing navigation tests**

Test the exact information architecture, normal/admin visibility, exact pathname matching, Overview behavior on `/dashboard`, and API Keys behavior on `/dashboard#api-keys`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  CONSOLE_NAV_SECTIONS,
  isConsoleItemActive,
  visibleConsoleSections,
} from "./console-navigation.ts";

test("exposes only implemented console destinations", () => {
  assert.deepEqual(
    CONSOLE_NAV_SECTIONS.flatMap((section) => section.items.map((item) => item.href)),
    ["/dashboard", "/dashboard#api-keys", "/models", "/chat", "/docs", "/topup", "/settings", "/admin"],
  );
});

test("hides administration from standard users", () => {
  assert.equal(visibleConsoleSections(false).some((section) => section.id === "administration"), false);
  assert.equal(visibleConsoleSections(true).some((section) => section.id === "administration"), true);
});

test("distinguishes overview from the API Keys hash", () => {
  const items = CONSOLE_NAV_SECTIONS.flatMap((section) => section.items);
  const overview = items.find((item) => item.id === "overview")!;
  const keys = items.find((item) => item.id === "api-keys")!;
  assert.equal(isConsoleItemActive(overview, "/dashboard", ""), true);
  assert.equal(isConsoleItemActive(overview, "/dashboard", "#api-keys"), false);
  assert.equal(isConsoleItemActive(keys, "/dashboard", "#api-keys"), true);
});
```

- [x] **Step 2: Run tests and verify RED**

Run `npm test` in `web`. Expected: FAIL because `console-navigation.ts` does not exist.

- [x] **Step 3: Implement the minimal navigation model**

Define the three sections and active-state rules. Mark the administration section or item with `adminOnly: true`; do not include unfinished OpenRouter destinations. Hash matching must normalize both `api-keys` and `#api-keys` to `#api-keys`.

- [x] **Step 4: Run tests and verify GREEN**

Run `npm test` in `web`. Expected: all protocol, channel mutation, and console navigation tests pass with zero failures.

### Task 2: Shared responsive console sidebar

**Files:**
- Create: `web/components/console-sidebar.tsx`
- Create: `web/components/console-shell.tsx`
- Consume: `web/lib/api.ts`
- Consume: `web/lib/console-navigation.ts`

**Interfaces:**
- `ConsoleSidebar` consumes `visibleConsoleSections`, `isConsoleItemActive`, `usePathname()`, the current hash, and `fetchMe()`.
- `ConsoleShell({ children }: { children: React.ReactNode })` produces the desktop grid and mobile menu region.
- Sidebar icon keys map to small inline semantic icons with `aria-hidden="true"`; links retain visible text labels.

- [x] **Step 1: Implement the sidebar state boundary**

Create a client component that:

```tsx
const pathname = usePathname();
const [hash, setHash] = useState("");
const [mobileOpen, setMobileOpen] = useState(false);
const [isAdmin, setIsAdmin] = useState(false);

useEffect(() => {
  const syncHash = () => setHash(window.location.hash);
  syncHash();
  window.addEventListener("hashchange", syncHash);
  return () => window.removeEventListener("hashchange", syncHash);
}, [pathname]);

useEffect(() => {
  let active = true;
  fetchMe().then((me) => active && setIsAdmin(Boolean(me?.isAdmin))).catch(() => undefined);
  return () => { active = false; };
}, []);
```

Close the mobile drawer when a link is selected. Use the approved Chinese labels and section grouping.

- [x] **Step 2: Implement desktop and mobile presentation**

Desktop sidebar requirements:

- `hidden md:block`, approximately `w-60`, border-right, sticky below the 56-pixel global header.
- Compact section labels and active link tint using existing `--color-brand` tokens.
- No unfinished or disabled items.

Mobile requirements:

- `md:hidden` menu button above content.
- Backdrop plus left drawer with `role="dialog"`, `aria-modal="true"`, and `aria-label="控制台导航"`.
- A visible close button and backdrop click dismissal.

- [x] **Step 3: Implement the shared shell**

`ConsoleShell` renders `ConsoleSidebar` once; that component supplies the desktop sidebar plus the mobile button and drawer:

```tsx
<div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-[1600px]">
  <ConsoleSidebar />
  <div className="min-w-0 flex-1">
    {children}
  </div>
</div>
```

Keep drawer state inside one component boundary so desktop and mobile navigation use the same items and active logic.

- [x] **Step 4: Run TypeScript verification**

Run `npx tsc --noEmit` in `web`. Expected: exit `0`.

### Task 3: Apply shell without URL changes

**Files:**
- Create: `web/app/(console)/layout.tsx`
- Move unchanged route directories under `web/app/(console)/`: `dashboard`, `models`, `chat`, `docs`, `topup`, `settings`, `admin`
- Modify after move: `web/app/(console)/dashboard/dashboard-client.tsx`

**Interfaces:**
- The route-group layout imports and renders `ConsoleShell`.
- Public URLs remain identical because parenthesized route groups do not contribute URL segments.
- The dashboard API Keys heading container exposes `id="api-keys"`.

- [x] **Step 1: Add the route-group layout**

Create:

```tsx
import { ConsoleShell } from "@/components/console-shell";

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return <ConsoleShell>{children}</ConsoleShell>;
}
```

- [x] **Step 2: Move console route directories into the group**

Move the seven directories as a single mechanical change. Do not modify imports unless TypeScript reports a path that is not alias-based. Confirm these files now exist:

```text
web/app/(console)/dashboard/page.tsx
web/app/(console)/models/page.tsx
web/app/(console)/chat/page.tsx
web/app/(console)/docs/page.tsx
web/app/(console)/topup/page.tsx
web/app/(console)/settings/page.tsx
web/app/(console)/admin/page.tsx
```

- [x] **Step 3: Add the API Keys anchor**

Change the existing API Keys section wrapper to:

```tsx
<div id="api-keys" className="mt-8 scroll-mt-24 ...">
```

Keep all form and table behavior unchanged.

- [x] **Step 4: Verify route compilation**

Run `npx tsc --noEmit` and `npm run build` in `web`. Expected: both exit `0`; the build route list still contains `/dashboard`, `/models`, `/chat`, `/docs`, `/topup`, `/settings`, and `/admin` without a `/console` prefix.

### Task 4: Responsive and regression verification

**Files:**
- Verify every file changed by Tasks 1–3.
- Update this plan's checkboxes with completed evidence.

**Interfaces:**
- No new production interface.
- Verifies accessibility, permission visibility, URL preservation, and regression safety.

- [x] **Step 1: Run the full automated suite**

Run `npm test` in `web`. Expected: all tests pass with zero failures.

- [x] **Step 2: Run compiler and production build**

Run `npx tsc --noEmit` and `npm run build` in `web`. Expected: both exit `0`.

- [x] **Step 3: Verify representative pages in a local browser**

Start the app and inspect `/dashboard`, `/dashboard#api-keys`, `/models`, `/chat`, `/settings`, and `/admin` at desktop and mobile widths. Confirm:

- Desktop sidebar remains visible and active state follows navigation.
- Mobile menu opens, closes, and does not overflow horizontally.
- API Keys anchor scrolls to the section and activates API Keys.
- Standard users do not see Channel Configuration; administrators do.
- Existing page controls remain usable.

- [x] **Step 4: Review the final diff**

Run `git diff --check`, inspect all route moves, and confirm no API, authentication, billing, key, model, chat, or channel mutation logic changed except the API Keys anchor attribute.

- [x] **Step 5: Commit and push**

Commit implementation and plan with message `Add unified console sidebar`, push `main` to `origin/main`, fetch, and verify local `HEAD` equals `origin/main`.
