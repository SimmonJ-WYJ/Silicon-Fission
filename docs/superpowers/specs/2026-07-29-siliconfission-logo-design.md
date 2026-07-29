# SiliconFission Logo Design

## Goal

Create an original, compact technology wordmark for SiliconFission and replace the current temporary `裂` badge in the website header.

## Brand Mark

The icon consists of two offset geometric modules connected through a narrow central transition. The negative space reads as a controlled fracture or routing handoff, expressing silicon infrastructure, model routing, and fission without copying SiliconFlow's symbol.

The mark must remain recognizable at 24 to 32 pixels tall. It uses flat geometry without gradients, shadows, outlines, particles, or fine detail.

## Wordmark

- Exact text: `SiliconFission`
- One word with capital `S` and `F`
- Modern rounded sans-serif character construction
- Medium weight with open counters and compact spacing
- The wordmark must remain legible in a navigation header

## Color Variants

- Primary purple: `#6D4AFF`, matching the existing brand token
- Light-background variant: purple icon with dark `#171A20` wordmark
- Dark-background variant: purple icon with white wordmark
- Icon-only variant: purple mark on a transparent background

## Deliverables

- `web/public/brand/siliconfission-logo.svg`: light-background horizontal logo
- `web/public/brand/siliconfission-logo-dark.svg`: dark-background horizontal logo
- `web/public/brand/siliconfission-mark.svg`: icon-only mark

All files use transparent backgrounds, deterministic SVG geometry, accessible titles where displayed directly, and tight view boxes without excessive padding.

## Website Integration

Replace the temporary gradient square containing `裂` in `web/components/nav.tsx` with the primary horizontal SVG. Keep the existing home link, header height, and navigation behavior unchanged.

Responsive behavior:

- Desktop and tablet show the complete `SiliconFission` horizontal logo.
- Narrow mobile widths show the icon-only mark to preserve space.
- The logo height stays within the existing 56-pixel header.

## Constraints

- Do not copy or trace SiliconFlow's icon.
- Do not include the Chinese temporary badge in the new header logo.
- Do not rasterize the final website asset.
- Do not change the global brand color token or unrelated navigation styling.
- Do not modify authentication, sidebar, routing, or API behavior.

## Acceptance Criteria

- The icon is visually distinct from SiliconFlow while retaining the approved geometric technology direction.
- The exact wordmark `SiliconFission` is present and legible.
- All SVGs have transparent backgrounds and render without external fonts or image references.
- The horizontal logo fits the current header at desktop widths.
- The icon-only logo fits the current header at mobile widths.
- TypeScript and the production build pass after integration.
