# Header Edge Spacing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Position the desktop header's left and right groups 56px from the viewport edges while retaining compact responsive padding.

**Architecture:** Keep the existing navigation component and behavior. Change only its inner layout container from a centered maximum-width wrapper to a full-width responsive-padding wrapper.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4

## Global Constraints

- Desktop (`lg` and above) horizontal header padding is exactly 56px.
- Tablet (`sm` through `md`) horizontal padding is 24px.
- Mobile horizontal padding is 16px.
- Preserve the 56px header height, navigation, authentication, sticky positioning, and responsive visibility.

---

### Task 1: Apply responsive viewport-edge spacing

**Files:**
- Modify: `web/components/nav.tsx:15`

**Interfaces:**
- Consumes: existing `Nav` component markup and Tailwind breakpoints.
- Produces: a full-width header content row with responsive viewport padding.

- [x] **Step 1: Verify the current source does not implement the approved spacing**

Run:

```bash
rg 'flex h-14 w-full.*px-4.*sm:px-6.*lg:px-14' web/components/nav.tsx
```

Expected: exit `1`, because the current container still uses `max-w-7xl`.

- [x] **Step 2: Replace the container classes**

Change the inner header container to:

```tsx
<div className="flex h-14 w-full items-center gap-6 px-4 sm:px-6 lg:px-14">
```

Do not change any child elements.

- [x] **Step 3: Verify the source contract**

Run the command from Step 1 again. Expected: one match and exit `0`. Also run `git diff --check`.

### Task 2: Verify layout and deliver

**Files:**
- Verify: `web/components/nav.tsx`
- Update: `docs/superpowers/plans/2026-07-29-header-edge-spacing.md`

**Interfaces:**
- No new runtime interface.

- [x] **Step 1: Run automated verification**

Run in `web`:

```bash
npm test
npx tsc --noEmit
npm run build
```

Expected: all commands exit `0`.

- [x] **Step 2: Measure desktop and mobile layouts**

At a 1440px viewport, confirm the header content container's left and right padding are both `56px`. At 390px, confirm both are `16px` and header horizontal overflow equals `0`.

- [x] **Step 3: Review and commit**

Run `git diff --check`, confirm only the navigation class and plan checkbox state changed, then commit with:

```bash
git add web/components/nav.tsx docs/superpowers/plans/2026-07-29-header-edge-spacing.md
git commit -m "Adjust header edge spacing"
```

- [x] **Step 4: Push and verify synchronization**

Push `main` to `origin/main`, fetch, and verify local `HEAD` equals `origin/main`.
