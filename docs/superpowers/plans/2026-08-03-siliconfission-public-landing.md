# Siliconfission Public Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a bilingual, theme-aware public landing page at `siliconfission.com`, move the existing New API UI to `console.siliconfission.com`, and keep `api.siliconfission.com` unchanged.

**Architecture:** A React/Vite/TypeScript static site reads public site and navigation configuration from New API through the same-origin `/api/status` proxy. Caddy serves the landing build on the apex domain, proxies the console subdomain to `sf-new-api:3000`, and preserves the API subdomain route to `sf-gateway:8788`.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, Playwright, CSS custom properties, Docker Compose, Caddy 2.

## Global Constraints

- The public landing page is the only redesigned surface; New API console pages are not restyled.
- Do not modify the model gateway, billing, database, channel configuration, or API request flow.
- Do not show unverified model counts, uptime percentages, latency promises, or official-partnership claims.
- Chinese and English are separate complete copy sets; they are never displayed together.
- The public site does not store credentials or reimplement authentication, search, notifications, or API key management.
- The docs entry remains disabled.
- `siliconfission.com` serves the landing, `console.siliconfission.com` serves New API, and `api.siliconfission.com` continues serving the gateway.
- Current `/api/status` evidence: `HeaderNavModules` is a JSON string containing fixed module visibility/auth flags. Sync only the fields exposed by that public API; do not invent unsupported custom labels or ordering controls.
- Registration target: password registration plus GitHub OAuth and Google through a custom OIDC provider. Never commit OAuth secrets.
- All paths below are relative to the repository root `/root/Silicon-Fission` on the VPS; create the same tree in the local Git checkout used for implementation.

## File Map

- `landing/package.json` — scripts and dependencies.
- `landing/vite.config.ts` — Vite, test, and development proxy configuration.
- `landing/src/types/site.ts` — public site configuration types.
- `landing/src/config/copy.ts` — complete Chinese and English copy.
- `landing/src/config/default-navigation.ts` — safe navigation fallback.
- `landing/src/lib/site-config.ts` — `/api/status` parsing, normalization, cache, and fallback.
- `landing/src/lib/preferences.ts` — locale and theme persistence.
- `landing/src/components/Header.tsx` — synchronized navigation and controls.
- `landing/src/components/Hero.tsx` — headline, CTAs, and code demo.
- `landing/src/components/FeatureGrid.tsx` — three verified capability messages.
- `landing/src/components/IntegrationSteps.tsx` — three-step onboarding flow.
- `landing/src/components/Compatibility.tsx` — verified protocols and applications only.
- `landing/src/components/FinalCta.tsx` — bottom conversion section.
- `landing/src/components/Footer.tsx` — public legal/footer configuration.
- `landing/src/styles/tokens.css` — light/dark design tokens.
- `landing/src/styles/global.css` — layout, responsive behavior, focus, and reduced motion.
- `landing/src/App.tsx` — page composition and site configuration lifecycle.
- `landing/src/main.tsx` — application entry.
- `landing/src/test/*` — unit and component test support.
- `landing/e2e/landing.spec.ts` — production-like browser acceptance tests.
- `deploy/production/Caddyfile` — apex, console, status proxy, static assets, and API routes.
- `deploy/production/docker-compose.yml` — read-only landing build mount for `sf-caddy`.
- `deploy/production/deploy-landing.sh` — repeatable build, validation, reload, and smoke checks.

---

### Task 1: Scaffold the Landing and Normalize Public Site Configuration

**Files:**
- Create: `landing/package.json`
- Create: `landing/tsconfig.json`
- Create: `landing/vite.config.ts`
- Create: `landing/index.html`
- Create: `landing/src/types/site.ts`
- Create: `landing/src/config/default-navigation.ts`
- Create: `landing/src/lib/site-config.ts`
- Test: `landing/src/lib/site-config.test.ts`
- Create: `landing/src/test/setup.ts`

**Interfaces:**
- Consumes: New API `GET /api/status` response, specifically `data.HeaderNavModules`, `data.system_name`, `data.logo`, `data.footer_html`, `data.register_enabled`, `data.password_register_enabled`, `data.github_oauth`, and `data.oidc_enabled`.
- Produces: `loadSiteConfig(fetcher?: typeof fetch): Promise<SiteConfig>` and `normalizeStatus(payload: unknown): SiteConfig`.

- [ ] **Step 1: Create the package manifest and test configuration**

Create `landing/package.json`:

```json
{
  "name": "siliconfission-landing",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test",
    "preview": "vite preview"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "lucide-react": "latest",
    "react": "latest",
    "react-dom": "latest",
    "vite": "latest"
  },
  "devDependencies": {
    "@playwright/test": "latest",
    "@testing-library/jest-dom": "latest",
    "@testing-library/react": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "jsdom": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

Configure `landing/vite.config.ts` so Vitest uses `jsdom`, loads `src/test/setup.ts`, and development requests to `/api/status` proxy to `https://siliconfission.com`.

- [ ] **Step 2: Write the failing status-normalization tests**

Create `landing/src/lib/site-config.test.ts` with a fixture matching the observed production response:

```ts
import { describe, expect, it } from 'vitest';
import { normalizeStatus } from './site-config';

describe('normalizeStatus', () => {
  it('parses New API HeaderNavModules and maps console paths', () => {
    const result = normalizeStatus({
      success: true,
      data: {
        HeaderNavModules: JSON.stringify({
          home: true,
          console: true,
          pricing: { enabled: true, requireAuth: false },
          rankings: { enabled: true, requireAuth: false },
          docs: false,
          about: false,
        }),
        system_name: 'Siliconfission',
        logo: 'https://siliconfission.com/brand/siliconfission.svg',
        footer_html: '',
        register_enabled: true,
        password_register_enabled: true,
        github_oauth: false,
        oidc_enabled: false,
        chats: [
          { 'Cherry Studio': 'cherrystudio://providers/api-keys?v=1&data={cherryConfig}' },
          { 'CC Switch': 'ccswitch' },
        ],
      },
    });

    expect(result.navigation.map((item) => item.href)).toEqual([
      '/',
      'https://console.siliconfission.com/dashboard',
      'https://console.siliconfission.com/pricing',
      'https://console.siliconfission.com/rankings',
    ]);
    expect(result.systemName).toBe('Siliconfission');
    expect(result.applications).toEqual(['Cherry Studio', 'CC Switch']);
  });

  it('falls back when HeaderNavModules is invalid JSON', () => {
    const result = normalizeStatus({ success: true, data: { HeaderNavModules: '{' } });
    expect(result.navigation.length).toBeGreaterThan(0);
    expect(result.navigation.some((item) => item.key === 'docs')).toBe(false);
  });
});
```

- [ ] **Step 3: Run the tests and verify the failure**

Run:

```bash
cd /root/Silicon-Fission/landing
npm install
npm test -- src/lib/site-config.test.ts
```

Expected: FAIL because `normalizeStatus` does not exist.

- [ ] **Step 4: Implement types, defaults, normalization, timeout, and cache**

Define the stable public interface in `landing/src/types/site.ts`:

```ts
export type NavKey = 'home' | 'console' | 'pricing' | 'rankings' | 'docs' | 'about';

export interface NavigationItem {
  key: NavKey;
  href: string;
  requireAuth: boolean;
}

export interface SiteConfig {
  systemName: string;
  logoUrl: string;
  footerHtml: string;
  navigation: NavigationItem[];
  applications: string[];
  registration: {
    enabled: boolean;
    password: boolean;
    github: boolean;
    oidc: boolean;
  };
}
```

Implement fixed module mapping in `site-config.ts`:

```ts
const MODULES = {
  home: '/',
  console: 'https://console.siliconfission.com/dashboard',
  pricing: 'https://console.siliconfission.com/pricing',
  rankings: 'https://console.siliconfission.com/rankings',
  docs: 'https://console.siliconfission.com/docs',
  about: 'https://console.siliconfission.com/about',
} as const;

const CACHE_KEY = 'sf-public-site-config-v1';
const CACHE_TTL_MS = 60_000;
```

`loadSiteConfig` must request `/api/status` with a 3-second `AbortSignal.timeout`, cache only successfully normalized configuration with a timestamp, use non-expired cached configuration on request failure, and otherwise return the fallback. Never enable `docs` in the fallback.

- [ ] **Step 5: Run unit tests and build**

Run:

```bash
npm test -- src/lib/site-config.test.ts
npm run build
```

Expected: both commands exit 0; Vitest reports both tests passing and Vite writes `landing/dist/index.html`.

- [ ] **Step 6: Commit the configuration slice**

```bash
git add landing/package.json landing/package-lock.json landing/tsconfig.json landing/vite.config.ts landing/index.html landing/src/types landing/src/config/default-navigation.ts landing/src/lib/site-config.ts landing/src/lib/site-config.test.ts landing/src/test/setup.ts
git commit -m "feat(landing): normalize public site configuration"
```

---

### Task 2: Implement Locale, Theme, and Synchronized Header

**Files:**
- Create: `landing/src/config/copy.ts`
- Create: `landing/src/lib/preferences.ts`
- Create: `landing/src/lib/preferences.test.ts`
- Create: `landing/src/components/Header.tsx`
- Test: `landing/src/components/Header.test.tsx`
- Create: `landing/src/styles/tokens.css`

**Interfaces:**
- Consumes: `SiteConfig`, `NavigationItem[]` from Task 1.
- Produces: `Locale = 'zh-CN' | 'en'`, `Theme = 'light' | 'dark'`, `getInitialLocale()`, `getInitialTheme()`, and `<Header config locale theme onLocaleChange onThemeChange />`.

- [ ] **Step 1: Write failing preference tests**

Test that an explicit local preference wins, otherwise `zh-*` browser languages choose `zh-CN`, all other languages choose `en`, and theme falls back to `matchMedia('(prefers-color-scheme: dark)')`.

```ts
expect(getInitialLocale({ stored: 'en', browser: 'zh-CN' })).toBe('en');
expect(getInitialLocale({ stored: null, browser: 'zh-TW' })).toBe('zh-CN');
expect(getInitialLocale({ stored: null, browser: 'fr-FR' })).toBe('en');
```

- [ ] **Step 2: Run the preference test and verify failure**

Run `npm test -- src/lib/preferences.test.ts`.

Expected: FAIL because `getInitialLocale` and `getInitialTheme` do not exist.

- [ ] **Step 3: Implement preferences and complete bilingual navigation copy**

Use these exact navigation labels in `copy.ts`:

```ts
export const navigationCopy = {
  'zh-CN': {
    home: '首页', console: '控制台', pricing: '模型广场', rankings: '排行榜',
    docs: '文档', about: '关于', search: '搜索', account: '登录 / 注册',
  },
  en: {
    home: 'Home', console: 'Console', pricing: 'Models', rankings: 'Leaderboard',
    docs: 'Docs', about: 'About', search: 'Search', account: 'Sign in / Register',
  },
} as const;
```

Persist locale under `sf-locale` and theme under `sf-theme`; apply theme to `document.documentElement.dataset.theme` before React renders.

- [ ] **Step 4: Write failing Header tests**

Cover four behaviors: only enabled navigation renders, disabled docs never renders, locale labels switch, and the account link points to `https://console.siliconfission.com/login`.

- [ ] **Step 5: Implement Header and design tokens**

Header requirements:

- Use the configured logo and system name with a fallback.
- Match the console's 64px desktop header density.
- Render dynamic modules in API-provided object order.
- Keep language and theme controls local to the landing.
- Link search to `https://console.siliconfission.com/dashboard?search=open` and account to the console login route.
- Collapse primary navigation behind an accessible menu button below 768px.
- Do not attempt to read console authentication from another subdomain.

- [ ] **Step 6: Run component tests**

Run:

```bash
npm test -- src/lib/preferences.test.ts src/components/Header.test.tsx
```

Expected: all preference and Header tests pass.

- [ ] **Step 7: Commit the shell**

```bash
git add landing/src/config/copy.ts landing/src/lib/preferences.ts landing/src/lib/preferences.test.ts landing/src/components/Header.tsx landing/src/components/Header.test.tsx landing/src/styles/tokens.css
git commit -m "feat(landing): add synchronized bilingual header"
```

---

### Task 3: Build the Conversion-Focused Homepage Sections

**Files:**
- Create: `landing/src/components/Hero.tsx`
- Create: `landing/src/components/CodeDemo.tsx`
- Create: `landing/src/components/FeatureGrid.tsx`
- Create: `landing/src/components/IntegrationSteps.tsx`
- Create: `landing/src/components/Compatibility.tsx`
- Create: `landing/src/components/FinalCta.tsx`
- Create: `landing/src/components/Footer.tsx`
- Create: `landing/src/App.tsx`
- Create: `landing/src/main.tsx`
- Test: `landing/src/App.test.tsx`

**Interfaces:**
- Consumes: `loadSiteConfig`, locale/theme state, and complete copy from Tasks 1-2.
- Produces: the complete public landing DOM and CTA routes.

- [ ] **Step 1: Add complete Chinese and English page copy**

Add this structured copy to `copy.ts`:

```ts
export const pageCopy = {
  'zh-CN': {
    eyebrow: '统一的大模型接入平台',
    title: '一个 API Key，连接多种大模型',
    subtitle: '通过统一、兼容的接口接入 OpenAI 与 Claude 生态，为每个任务灵活选择合适的模型。',
    primaryCta: '创建 API Key',
    secondaryCta: '浏览模型',
    featuresTitle: '一次接入，保留更多模型选择',
    features: [
      ['一个 Key，统一管理', '无需维护多套凭证，通过一个平台管理不同模型的调用。'],
      ['延续熟悉的开发方式', '兼容常见的 OpenAI 与 Claude 请求格式，降低迁移与集成成本。'],
      ['为任务选择合适模型', '根据质量、响应速度、上下文能力和成本灵活选择。'],
    ],
    stepsTitle: '三步开始调用',
    steps: ['注册或登录', '创建 API Key', '选择模型并发送请求'],
    compatibilityTitle: '连接你熟悉的 AI 工作流',
    finalTitle: '准备好开始构建了吗？',
    finalBody: '用一个 API Key，连接你的产品所需的大模型能力。',
  },
  en: {
    eyebrow: 'UNIFIED MODEL ACCESS',
    title: 'One API Key. Multiple AI models.',
    subtitle: 'Access models across the OpenAI and Claude ecosystems through one unified, compatible interface.',
    primaryCta: 'Create API Key',
    secondaryCta: 'Explore Models',
    featuresTitle: 'Integrate once. Keep more model options.',
    features: [
      ['One key, centrally managed', 'Manage requests to different models without juggling separate credentials.'],
      ['Keep your existing workflow', 'Use familiar OpenAI- and Claude-compatible request formats with less integration work.'],
      ['Choose the right model', 'Balance quality, latency, context capacity, and cost for each task.'],
    ],
    stepsTitle: 'Start in three steps',
    steps: ['Register or sign in', 'Create an API key', 'Choose a model and send a request'],
    compatibilityTitle: 'Connect your existing AI workflow',
    finalTitle: 'Ready to start building?',
    finalBody: 'Use one API key to connect the model capabilities your product needs.',
  },
} as const;
```

- [ ] **Step 2: Write the failing App test**

Verify that Chinese and English never appear together, CTA paths are exact, no numeric reliability claims exist, and disabled compatibility items are absent.

```ts
expect(screen.getByRole('heading', { name: '一个 API Key，连接多种大模型' })).toBeVisible();
expect(screen.queryByText('One API Key. Multiple AI models.')).not.toBeInTheDocument();
expect(screen.getByRole('link', { name: '创建 API Key' })).toHaveAttribute(
  'href',
  'https://console.siliconfission.com/console/token',
);
expect(document.body.textContent).not.toMatch(/99\.9%|50\+|uptime/i);
```

- [ ] **Step 3: Run the App test and verify failure**

Run `npm test -- src/App.test.tsx`.

Expected: FAIL because the homepage components do not exist.

- [ ] **Step 4: Implement the page sections**

Compose sections in this order:

```tsx
<Header />
<main>
  <Hero />
  <FeatureGrid />
  <IntegrationSteps />
  <Compatibility />
  <FinalCta />
</main>
<Footer />
```

The Hero must link primary CTA to `https://console.siliconfission.com/console/token` and secondary CTA to `https://console.siliconfission.com/pricing`.

The code demo may expose only these confirmed protocol tabs from the current platform: OpenAI Chat (`POST /v1/chat/completions`), Responses (`POST /v1/responses`), and Claude (`POST /v1/messages`). Use `your-model` rather than naming a model that may be unavailable. Copy buttons announce success through an `aria-live="polite"` region.

Compatibility cards must use the normalized `SiteConfig.applications` names sourced from the public `/api/status` `chats` array. Render names only and link the section CTA to the authenticated console; never expose or expand the API-key templates in the source values. Render `footer_html` as sanitized text and links through an allowlist parser; never pass it directly to `dangerouslySetInnerHTML`.

- [ ] **Step 5: Run tests and build**

Run:

```bash
npm test
npm run build
```

Expected: all unit/component tests pass and Vite creates the complete `dist` bundle.

- [ ] **Step 6: Commit the homepage**

```bash
git add landing/src/config/copy.ts landing/src/components landing/src/App.tsx landing/src/App.test.tsx landing/src/main.tsx
git commit -m "feat(landing): build bilingual conversion homepage"
```

---

### Task 4: Add Responsive Layout, Accessibility, and Motion Controls

**Files:**
- Create: `landing/src/styles/global.css`
- Modify: `landing/src/styles/tokens.css`
- Modify: `landing/src/main.tsx`
- Test: `landing/src/components/Header.test.tsx`
- Test: `landing/src/App.test.tsx`

**Interfaces:**
- Consumes: semantic markup from Task 3.
- Produces: desktop, tablet, mobile, dark theme, focus, and reduced-motion behavior.

- [ ] **Step 1: Add failing structural accessibility assertions**

Assert there is one `main`, one level-one heading, a skip link, accessible labels for language/theme/menu/copy controls, and no empty links.

- [ ] **Step 2: Run tests and verify failure**

Run `npm test`.

Expected: accessibility structure assertions fail before markup and styles are completed.

- [ ] **Step 3: Implement global styles**

Use these exact layout breakpoints and constraints:

- Content max width: `1200px`.
- Desktop: `min-width: 1024px`, two-column Hero.
- Tablet: `768px` through `1023px`, compact two-column Hero.
- Mobile: below `768px`, single-column Hero and collapsed navigation.
- Header height: `64px` desktop, `56px` mobile.
- Focus ring: `2px solid var(--color-primary)` with `2px` offset.
- Under `prefers-reduced-motion: reduce`, set animation and transition durations to `0.01ms` and disable smooth scrolling.

- [ ] **Step 4: Verify accessibility and production build**

Run:

```bash
npm test
npm run build
```

Expected: all tests pass and the production build exits 0.

- [ ] **Step 5: Commit responsive polish**

```bash
git add landing/src/styles landing/src/main.tsx landing/src/components/Header.test.tsx landing/src/App.test.tsx
git commit -m "feat(landing): add responsive accessible presentation"
```

---

### Task 5: Add Browser Acceptance Tests

**Files:**
- Create: `landing/playwright.config.ts`
- Create: `landing/e2e/landing.spec.ts`
- Modify: `landing/package.json`

**Interfaces:**
- Consumes: built landing and mocked `/api/status`.
- Produces: repeatable acceptance coverage for route, language, theme, navigation sync, and viewport behavior.

- [ ] **Step 1: Write failing Playwright tests**

Cover:

1. Direct `/` load and reload render the same H1.
2. `/api/status` with `pricing.enabled=false` removes Models from the header.
3. Language switch changes the H1 and persists after reload.
4. Dark theme persists after reload.
5. Primary CTA targets `/console/token` on the console subdomain.
6. At 390px width, the mobile menu opens and no horizontal overflow exists.

- [ ] **Step 2: Run and verify the first failure**

Run:

```bash
npx playwright install chromium
npm run e2e
```

Expected: FAIL until Playwright webServer and route fixtures are configured.

- [ ] **Step 3: Configure Playwright and deterministic status fixtures**

Use `npm run dev -- --host 127.0.0.1` as the Playwright web server and intercept `/api/status` in each test with the exact Task 1 fixture. Do not call production from tests.

- [ ] **Step 4: Run all automated checks**

Run:

```bash
npm test
npm run build
npm run e2e
```

Expected: unit, component, build, and six browser acceptance cases all pass.

- [ ] **Step 5: Commit acceptance coverage**

```bash
git add landing/playwright.config.ts landing/e2e/landing.spec.ts landing/package.json landing/package-lock.json
git commit -m "test(landing): cover public conversion flows"
```

---

### Task 6: Split Apex and Console Routing in Caddy

**Files:**
- Modify: `deploy/production/Caddyfile`
- Modify: `deploy/production/docker-compose.yml`
- Create: `deploy/production/deploy-landing.sh`

**Interfaces:**
- Consumes: `landing/dist`, `sf-new-api:3000`, `sf-gateway:8788`, `${DOMAIN}`.
- Produces: static apex site, same-origin `/api/status`, console reverse proxy, and unchanged API gateway proxy.

- [ ] **Step 1: Back up the live deployment files**

Run on the VPS:

```bash
cd /root/Silicon-Fission
cp deploy/production/Caddyfile deploy/production/Caddyfile.pre-landing
cp deploy/production/docker-compose.yml deploy/production/docker-compose.yml.pre-landing
```

Expected: both `.pre-landing` files exist and are non-empty.

- [ ] **Step 2: Add the landing mount to the Caddy service**

Add this read-only volume beside the existing Caddyfile and brand mounts:

```yaml
- ../../landing/dist:/srv/landing:ro
```

- [ ] **Step 3: Replace the main-domain routing and add console routing**

Use this Caddy structure while preserving the existing API block and its `flush_interval -1`:

```caddy
www.{$DOMAIN} {
    redir https://{$DOMAIN}{uri} permanent
}

{$DOMAIN} {
    encode gzip

    handle /api/status {
        reverse_proxy new-api:3000
    }

    handle /brand/* {
        root * /srv/brand
        file_server
    }

    handle {
        root * /srv/landing
        try_files {path} /index.html
        file_server
    }
}

console.{$DOMAIN} {
    encode gzip
    reverse_proxy new-api:3000
}

api.{$DOMAIN} {
    encode gzip
    reverse_proxy gateway:8788 {
        flush_interval -1
    }
}
```

- [ ] **Step 4: Create a repeatable deployment script**

`deploy-landing.sh` must use `set -euo pipefail` and perform these exact stages:

```bash
docker run --rm \
  -v /root/Silicon-Fission/landing:/app \
  -w /app node:22-alpine \
  sh -c 'npm ci && npm test && npm run build'

docker exec sf-caddy caddy validate --config /etc/caddy/Caddyfile
docker exec sf-caddy caddy reload --config /etc/caddy/Caddyfile
curl -fsS https://siliconfission.com/ >/dev/null
curl -fsS https://siliconfission.com/api/status >/dev/null
curl -fsS https://console.siliconfission.com/api/status >/dev/null
```

Do not restart PostgreSQL, Redis, the gateway, or New API.

- [ ] **Step 5: Validate Compose and Caddy before changing live routing**

Run:

```bash
cd /root/Silicon-Fission/deploy/production
docker compose config --quiet
docker compose up -d --no-deps caddy
docker exec sf-caddy caddy validate --config /etc/caddy/Caddyfile
```

Expected: all commands exit 0 and only `sf-caddy` is recreated if the new mount requires recreation.

- [ ] **Step 6: Commit deployment configuration**

```bash
git add deploy/production/Caddyfile deploy/production/docker-compose.yml deploy/production/deploy-landing.sh
git commit -m "ops: split public site and New API console"
```

---

### Task 7: Configure DNS, Public Address, and Registration Providers

**Files:**
- No committed secret files.
- Modify through DNS provider, GitHub OAuth App, Google Cloud OAuth, and New API system settings.

**Interfaces:**
- Consumes: server public IPv4 address, console HTTPS endpoint, provider-issued client IDs and secrets.
- Produces: resolvable console subdomain and password/GitHub/Google registration options.

- [ ] **Step 1: Add and verify console DNS**

Create an `A` record:

```text
Name: console
Value: 45.77.176.91
TTL: 300
```

Verify:

```bash
dig +short console.siliconfission.com A
```

Expected: `45.77.176.91`.

- [ ] **Step 2: Set New API's public server address**

In **System Settings → Site & Brand → System Information**, set server address to:

```text
https://console.siliconfission.com
```

Save, then verify:

```bash
curl -fsS https://console.siliconfission.com/api/status | jq -r '.data.server_address'
```

Expected: `https://console.siliconfission.com`.

- [ ] **Step 3: Keep password registration enabled**

In **System Settings → Authentication**, verify registration, password login, password registration, and email verification are enabled. Send one email verification message to a controlled test mailbox and complete one registration before launch.

- [ ] **Step 4: Configure GitHub OAuth**

Create a GitHub OAuth App with:

```text
Homepage URL: https://siliconfission.com
Authorization callback URL: https://console.siliconfission.com/api/oauth/github
```

Enter the issued Client ID and Client Secret in New API's GitHub OAuth settings, enable GitHub OAuth, and complete one sign-in. The secret remains only in GitHub/New API configuration.

- [ ] **Step 5: Configure Google through custom OIDC**

Create a Google OAuth web application for the console origin. In New API's **Custom OAuth** settings, add a provider named `Google`, use discovery URL:

```text
https://accounts.google.com/.well-known/openid-configuration
```

Use the redirect URL displayed by New API's provider form in the Google OAuth application's authorized redirect URIs. Enter the issued Client ID and Client Secret only in New API, save, and complete one Google sign-in. Do not guess or hard-code the provider-specific callback path.

- [ ] **Step 6: Confirm public status reflects enabled registration**

Run:

```bash
curl -fsS https://console.siliconfission.com/api/status | jq '{register: .data.register_enabled, password: .data.password_register_enabled, github: .data.github_oauth}'
```

Expected: `register`, `password`, and `github` are `true`. Confirm the Google button visually on `/login` because custom providers are not represented by the legacy `oidc_enabled` boolean in every New API version.

---

### Task 8: Production Verification and Rollback Drill

**Files:**
- Create: `docs/releases/2026-08-03-public-landing.md`
- Test: production URLs and container state.

**Interfaces:**
- Consumes: deployed landing, Caddy routes, configured authentication.
- Produces: evidence that the release meets the approved design without API regression.

- [ ] **Step 1: Verify public responses**

Run:

```bash
curl -fsSI https://siliconfission.com/
curl -fsS https://siliconfission.com/api/status | jq -e '.success == true'
curl -fsS https://console.siliconfission.com/api/status | jq -e '.success == true'
curl -fsSI https://api.siliconfission.com/
```

Expected: the landing and both status requests succeed; the API domain returns its existing healthy HTTP response without a route change.

- [ ] **Step 2: Run browser acceptance against production**

Verify in desktop and 390px mobile viewports:

- Direct load and refresh show the same landing.
- Logo returns to the landing.
- Backend HeaderNavModules changes appear within 60 seconds.
- Chinese/English and light/dark selections persist.
- Create API Key reaches `/console/token` and unauthenticated users are sent to authentication.
- Models and Leaderboard reach their console routes.
- Docs is absent.

- [ ] **Step 3: Run an API regression request with a dedicated test key**

Send one non-streaming and one streaming request to the same test model used before the landing deployment. Verify HTTP success, streamed chunks, usage logging, and token accounting. Do not paste the key into logs or the plan.

- [ ] **Step 4: Confirm only intended containers changed**

Run:

```bash
docker ps --format 'table {{.Names}}\t{{.Status}}'
docker inspect sf-postgres --format '{{.State.StartedAt}}'
docker inspect sf-redis --format '{{.State.StartedAt}}'
docker inspect sf-gateway --format '{{.State.StartedAt}}'
```

Expected: PostgreSQL, Redis, and gateway start times predate the landing deployment; all remain healthy.

- [ ] **Step 5: Prove rollback commands without executing them**

Create `docs/releases/2026-08-03-public-landing.md` with this exact structure only after every listed check has passed:

````markdown
# Public Landing Release Verification — 2026-08-03

## Result

PASS: apex landing, console status, navigation sync, authentication flows, responsive layouts, and API regression checks completed.

## Automated checks

- `npm test`: PASS
- `npm run build`: PASS
- `npm run e2e`: PASS

## Production smoke checks

```text
https://siliconfission.com/: HTTP 200
https://siliconfission.com/api/status: true
https://console.siliconfission.com/api/status: true
```

## Authentication checks

- Password registration: PASS
- GitHub OAuth: PASS
- Google OIDC: PASS

## API regression

- Non-streaming request: PASS
- Streaming request: PASS
- Usage log and token accounting: PASS

## Rollback

```bash
cd /root/Silicon-Fission
cp deploy/production/Caddyfile.pre-landing deploy/production/Caddyfile
cp deploy/production/docker-compose.yml.pre-landing deploy/production/docker-compose.yml
cd deploy/production
docker compose up -d --no-deps caddy
docker exec sf-caddy caddy validate --config /etc/caddy/Caddyfile
```
````

The release note must not contain API keys, cookies, OAuth secrets, email addresses, or authenticated response bodies. Record these exact recovery commands in its Rollback section:

```bash
cd /root/Silicon-Fission
cp deploy/production/Caddyfile.pre-landing deploy/production/Caddyfile
cp deploy/production/docker-compose.yml.pre-landing deploy/production/docker-compose.yml
cd deploy/production
docker compose up -d --no-deps caddy
docker exec sf-caddy caddy validate --config /etc/caddy/Caddyfile
```

Do not run the rollback when verification passes.

- [ ] **Step 6: Commit release verification notes**

```bash
git add docs/releases/2026-08-03-public-landing.md
git commit -m "docs: record public landing verification"
```
