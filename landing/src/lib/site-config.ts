import { DEFAULT_NAVIGATION } from '../config/default-navigation';
import type { NavKey, NavigationItem, SiteConfig } from '../types/site';

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

type UnknownRecord = Record<string, unknown>;

interface CachedSiteConfig {
  timestamp: number;
  config: SiteConfig;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNavKey(value: unknown): value is NavKey {
  return typeof value === 'string' && value in MODULES;
}

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function booleanValue(value: unknown): boolean {
  return value === true;
}

function copyDefaultNavigation(): NavigationItem[] {
  return DEFAULT_NAVIGATION.map((item) => ({ ...item }));
}

function parseModules(value: unknown): UnknownRecord | null {
  if (isRecord(value)) return value;
  if (typeof value !== 'string') return null;

  try {
    const parsed: unknown = JSON.parse(value);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isEnabled(value: unknown): boolean {
  return value === true || (isRecord(value) && value.enabled === true);
}

function requiresAuth(value: unknown): boolean {
  return isRecord(value) && value.requireAuth === true;
}

function normalizeNavigation(value: unknown): NavigationItem[] {
  const modules = parseModules(value);
  if (!modules) return copyDefaultNavigation();

  const navigation = (Object.keys(MODULES) as NavKey[]).flatMap((key) => {
    if (key === 'docs') return [];

    const module = modules[key];
    return isEnabled(module)
      ? [{ key, href: MODULES[key], requireAuth: requiresAuth(module) }]
      : [];
  });

  return navigation;
}

function applicationsFrom(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((application) => (isRecord(application) ? Object.keys(application) : []));
}

function statusData(payload: unknown): UnknownRecord | null {
  return isRecord(payload) && isRecord(payload.data) ? payload.data : null;
}

function fallbackConfig(): SiteConfig {
  return {
    systemName: 'Siliconfission',
    logoUrl: '',
    footerHtml: '',
    navigation: copyDefaultNavigation(),
    applications: [],
    registration: {
      enabled: false,
      password: false,
      github: false,
      oidc: false,
    },
  };
}

export function normalizeStatus(payload: unknown): SiteConfig {
  const data = statusData(payload);
  if (!data) return fallbackConfig();

  return {
    systemName: stringValue(data.system_name, 'Siliconfission'),
    logoUrl: stringValue(data.logo),
    footerHtml: stringValue(data.footer_html),
    navigation: normalizeNavigation(data.HeaderNavModules),
    applications: applicationsFrom(data.chats),
    registration: {
      enabled: booleanValue(data.register_enabled),
      password: booleanValue(data.password_register_enabled),
      github: booleanValue(data.github_oauth),
      oidc: booleanValue(data.oidc_enabled),
    },
  };
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isSiteConfig(value: unknown): value is SiteConfig {
  if (!isRecord(value) || !isRecord(value.registration) || !Array.isArray(value.navigation) || !Array.isArray(value.applications)) {
    return false;
  }

  return (
    typeof value.systemName === 'string' &&
    typeof value.logoUrl === 'string' &&
    typeof value.footerHtml === 'string' &&
    value.navigation.every(
      (item) =>
        isRecord(item) &&
        isNavKey(item.key) &&
        item.key !== 'docs' &&
        typeof item.href === 'string' &&
        typeof item.requireAuth === 'boolean',
    ) &&
    value.applications.every((application) => typeof application === 'string') &&
    typeof value.registration.enabled === 'boolean' &&
    typeof value.registration.password === 'boolean' &&
    typeof value.registration.github === 'boolean' &&
    typeof value.registration.oidc === 'boolean'
  );
}

function readCachedConfig(): SiteConfig | null {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const stored = storage.getItem(CACHE_KEY);
    if (!stored) return null;

    const cached: unknown = JSON.parse(stored);
    if (!isRecord(cached) || typeof cached.timestamp !== 'number' || !isSiteConfig(cached.config)) {
      return null;
    }

    const now = Date.now();
    const age = now - cached.timestamp;
    return Number.isFinite(cached.timestamp) && cached.timestamp <= now && age < CACHE_TTL_MS
      ? cached.config
      : null;
  } catch {
    return null;
  }
}

function cacheConfig(config: SiteConfig): void {
  const storage = getStorage();
  if (!storage) return;

  const cached: CachedSiteConfig = { timestamp: Date.now(), config };
  try {
    storage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch {
    // Private browsing or quota errors must not prevent the public site loading.
  }
}

function hasSuccessfulStatus(payload: unknown): boolean {
  return isRecord(payload) && payload.success === true && statusData(payload) !== null;
}

export async function loadSiteConfig(fetcher: typeof fetch = fetch): Promise<SiteConfig> {
  try {
    const response = await fetcher('/api/status', {
      signal: AbortSignal.timeout(3_000),
    });

    if (!response.ok) throw new Error(`Status request failed with ${response.status}`);

    const payload: unknown = await response.json();
    if (!hasSuccessfulStatus(payload)) throw new Error('Status response was unsuccessful');

    const config = normalizeStatus(payload);
    cacheConfig(config);
    return config;
  } catch {
    return readCachedConfig() ?? fallbackConfig();
  }
}
