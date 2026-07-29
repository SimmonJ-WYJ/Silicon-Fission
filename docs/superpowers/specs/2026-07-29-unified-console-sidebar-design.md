# Unified Console Sidebar Design

## Goal

Add an OpenRouter-inspired, consistently partitioned sidebar to every existing user console page without exposing unfinished destinations. Preserve all existing business logic, URLs, and public top navigation.

## Scope

The shared console shell applies to these existing routes:

- `/dashboard`
- `/models`
- `/chat`
- `/docs`
- `/topup`
- `/settings`
- `/admin`

Public pages such as `/`, `/login`, `/rankings`, `/privacy`, and `/terms` keep the existing full-width layout.

## Information Architecture

The sidebar mirrors the visual grouping of the supplied OpenRouter reference while linking only to implemented features.

### Workspace

- Overview: `/dashboard`
- API Keys: `/dashboard#api-keys`
- Models: `/models`
- Chat Playground: `/chat`
- API Documentation: `/docs`

### Account

- Balance and Top Up: `/topup`
- Account Settings: `/settings`

### Administration

- Channel Configuration: `/admin`

The Administration group and Channel Configuration item are rendered only for authenticated administrators. The server-side `/admin` authorization behavior remains unchanged and is the final access-control boundary.

## Layout Architecture

Create a reusable console shell rather than copying sidebar markup into each page. A route-aware client component owns active states and the mobile drawer. A route-group layout applies the shell to the scoped pages while preserving each page's existing content component.

Because the existing routes currently live at the app root, reorganize them into a Next.js route group such as `(console)` without changing their public URLs. The route group receives a shared layout containing the sidebar and content region. The root layout continues to render the global header and footer.

## Desktop Behavior

- Sidebar sits below the existing sticky global header.
- Width is approximately 240 pixels.
- Sidebar remains visible while console content scrolls.
- Content fills the remaining width and retains each page's own maximum-width rules.
- The active destination uses the existing brand accent with a restrained tinted background.
- Section labels visually separate Workspace, Account, and Administration.

## Mobile Behavior

- At widths below the desktop breakpoint, the fixed sidebar is hidden.
- A compact console-menu button appears above the page content.
- Activating it opens an accessible left drawer with a backdrop.
- Selecting a destination or pressing the close control closes the drawer.
- The drawer uses `role="dialog"`, an accessible label, and keyboard-focusable controls.

## Active Navigation Rules

- Exact pathname matching highlights Overview, Models, Chat Playground, API Documentation, Balance and Top Up, Account Settings, and Channel Configuration.
- API Keys is active when the pathname is `/dashboard` and the URL hash is `#api-keys`.
- Overview remains the default active item for `/dashboard` without the API Keys hash.
- The existing API Keys section receives `id="api-keys"` and appropriate scroll spacing so the anchor is not obscured by the sticky header.

## Authentication and Data

The sidebar may call the existing `fetchMe()` client helper to determine whether to render the administrator group. Failure or logged-out state hides administrator navigation and does not block rendering normal navigation.

No API response shape, authentication flow, channel behavior, key behavior, billing behavior, or model routing changes are part of this feature.

## Visual Direction

- Reuse the current Tailwind tokens, typography, border colors, and brand accent.
- Match the reference's information hierarchy, not its branding.
- Use compact line icons from an existing or lightweight icon source; do not add decorative imagery.
- Avoid placeholder or disabled menu items for unfinished functionality.
- Keep the current top navigation so public discovery routes remain accessible.

## Error and Loading Behavior

- Sidebar navigation remains usable while identity information loads.
- Administrator navigation appears only after identity is confirmed.
- Identity fetch failures silently fall back to standard-user navigation.
- Mobile drawer state resets after navigation.

## Testing and Acceptance Criteria

- All scoped routes render inside one consistent console shell without changing their URLs.
- Public routes do not render the sidebar.
- Every visible sidebar item reaches an existing functional destination.
- `/dashboard#api-keys` scrolls to the API Keys section and highlights API Keys.
- Administrators see Channel Configuration; non-administrators do not.
- Desktop and mobile layouts remain usable without horizontal overflow.
- Current tests, TypeScript checks, and the production build pass.
- Existing dashboard, model, chat, documentation, top-up, settings, and admin functionality remains unchanged.

## Out of Scope

- Guardrails, BYOK, routing rules, presets, plugins, observability, classifiers, activity, logs, management keys, privacy controls, or preference pages.
- Changes to the global header navigation.
- New backend endpoints or database schema changes.
- Redesigning the contents of existing pages beyond the spacing required by the shared shell.
