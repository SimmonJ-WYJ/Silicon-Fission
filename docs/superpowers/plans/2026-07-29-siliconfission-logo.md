# SiliconFission Logo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create an original three-variant SiliconFission SVG logo system and replace the temporary header badge with responsive brand assets.

**Architecture:** Deterministic self-contained SVG files provide horizontal light, horizontal dark, and icon-only variants. The existing header selects full or compact assets using responsive CSS without changing navigation behavior.

**Tech Stack:** SVG, Next.js 16, React 19, Tailwind CSS 4

## Global Constraints

- Exact wordmark: `SiliconFission`.
- Primary purple: `#6D4AFF`.
- Do not copy or trace the SiliconFlow icon.
- SVGs must have transparent backgrounds and no external fonts or image references.
- Preserve header height, home link, routes, authentication, sidebar, and API behavior.

---

### Task 1: Create the SVG brand assets

**Files:**
- Create: `web/public/brand/siliconfission-logo.svg`
- Create: `web/public/brand/siliconfission-logo-dark.svg`
- Create: `web/public/brand/siliconfission-mark.svg`

**Interfaces:**
- Horizontal logos share the same geometry and `viewBox` dimensions.
- Icon-only mark uses a tight square-ish `viewBox`.
- All shapes use path/rect geometry and the wordmark uses deterministic SVG paths or a self-contained geometric text treatment.

- [ ] **Step 1: Build the original fracture-routing mark**

Construct two offset rounded modules joined by a narrow bridge. Use `#6D4AFF`, no stroke, no gradient, and a transparent background. Confirm the silhouette is distinct from the two-block SiliconFlow reference.

- [ ] **Step 2: Build light and dark horizontal wordmarks**

Use the exact text `SiliconFission`; the light version uses `#171A20`, the dark version uses white. Keep identical spacing and geometry between variants.

- [ ] **Step 3: Validate SVG structure**

Run an XML parse check and search each file for `<image`, external URLs, and background rectangles. Expected: valid XML, no external assets, no opaque canvas background.

### Task 2: Integrate the responsive header logo

**Files:**
- Modify: `web/components/nav.tsx`

**Interfaces:**
- The existing `/` `Link` remains the clickable brand container.
- Mobile renders `/brand/siliconfission-mark.svg`.
- `sm` and wider renders `/brand/siliconfission-logo.svg`.

- [ ] **Step 1: Replace the temporary badge**

Replace the `裂` gradient square and text span with:

```tsx
<img src="/brand/siliconfission-mark.svg" alt="SiliconFission" className="h-7 w-auto sm:hidden" />
<img src="/brand/siliconfission-logo.svg" alt="SiliconFission" className="hidden h-7 w-auto sm:block" />
```

Do not change global navigation links or auth controls.

- [ ] **Step 2: Run TypeScript and production build**

Run `npx tsc --noEmit` and `npm run build` in `web`. Expected: both exit `0`.

### Task 3: Visual verification and delivery

**Files:**
- Verify all Task 1 and Task 2 files.
- Update this plan's checkboxes.

**Interfaces:**
- No new runtime interface.

- [ ] **Step 1: Inspect SVG previews**

Render all three assets and confirm: transparent background, exact wordmark, clear 28-pixel header rendering, and distinct mark silhouette.

- [ ] **Step 2: Inspect desktop and mobile header**

Open the local site at desktop and 390-pixel widths. Confirm full logo at desktop, icon-only at mobile, no header overflow, and the home link remains functional.

- [ ] **Step 3: Review final diff**

Run `git diff --check`; confirm only logo assets, header markup, and documentation changed.

- [ ] **Step 4: Commit and push**

Commit with message `Add SiliconFission logo`, push `main` to `origin/main`, fetch, and verify local `HEAD` equals `origin/main`.
