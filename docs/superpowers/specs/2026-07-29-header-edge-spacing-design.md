# Header Edge Spacing Design

## Goal

Make the desktop header's left brand group and right account group sit 56px from the browser edges while preserving usable spacing on narrower screens.

## Layout

- Remove the header content container's `max-w-7xl` width constraint so spacing is measured from the viewport edges.
- Keep the header container full width.
- Use 16px horizontal padding on mobile, 24px from the `sm` breakpoint, and 56px from the `lg` breakpoint.
- Preserve the existing 56px header height, navigation links, responsive visibility, authentication controls, and sticky behavior.

## Acceptance Criteria

- At desktop widths (`lg` and above), left and right header groups are 56px from their corresponding viewport edges.
- At tablet widths (`sm` through `md`), horizontal padding is 24px.
- Below `sm`, horizontal padding is 16px.
- The header has no horizontal overflow at 390px.
- Existing navigation and authentication behavior is unchanged.

## Verification

- Run TypeScript, project tests, and the production build.
- Inspect the header at desktop and 390px widths and measure its left/right padding and overflow.
