import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadSiteConfig, normalizeStatus } from './site-config';

const successfulStatus = {
  success: true,
  data: {
    HeaderNavModules: JSON.stringify({ home: true, console: true }),
    system_name: 'Siliconfission',
    logo: 'https://siliconfission.com/brand/siliconfission.svg',
    footer_html: '',
    register_enabled: true,
    password_register_enabled: true,
    github_oauth: false,
    oidc_enabled: false,
  },
};

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

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

  it('honors a valid configuration that disables every navigation module', () => {
    const result = normalizeStatus({
      success: true,
      data: {
        HeaderNavModules: JSON.stringify({ home: false, console: false, pricing: false }),
      },
    });

    expect(result.navigation).toEqual([]);
  });

  it('keeps docs disabled even when the status configuration enables it', () => {
    const result = normalizeStatus({
      success: true,
      data: {
        HeaderNavModules: JSON.stringify({ home: true, docs: true }),
      },
    });

    expect(result.navigation.map((item) => item.key)).toEqual(['home']);
  });

  it('preserves the status module key order while excluding unknown and docs modules', () => {
    const result = normalizeStatus({
      success: true,
      data: {
        HeaderNavModules: JSON.stringify({
          rankings: true,
          unsupported: true,
          docs: true,
          console: { enabled: true, requireAuth: false },
          home: true,
        }),
      },
    });

    expect(result.navigation.map((item) => item.key)).toEqual(['rankings', 'console', 'home']);
  });

  it('uses a three-second timeout and caches a successful response', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout');
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(successfulStatus), { status: 200 }),
    );

    const result = await loadSiteConfig(fetcher);

    expect(timeout).toHaveBeenCalledWith(3_000);
    expect(fetcher).toHaveBeenCalledWith('/api/status', {
      signal: expect.any(AbortSignal),
    });
    expect(result.systemName).toBe('Siliconfission');
    expect(localStorage.getItem('sf-public-site-config-v1')).not.toBeNull();
  });

  it('uses a non-expired cached configuration after a request failure', async () => {
    localStorage.setItem(
      'sf-public-site-config-v1',
      JSON.stringify({
        timestamp: Date.now(),
        config: {
          systemName: 'Cached Siliconfission',
          logoUrl: '',
          footerHtml: '',
          navigation: [{ key: 'home', href: '/', requireAuth: false }],
          applications: [],
          registration: { enabled: false, password: false, github: false, oidc: false },
        },
      }),
    );

    const result = await loadSiteConfig(vi.fn().mockRejectedValue(new Error('offline')));

    expect(result.systemName).toBe('Cached Siliconfission');
  });

  it('uses the safe fallback rather than an expired cache after a request failure', async () => {
    localStorage.setItem(
      'sf-public-site-config-v1',
      JSON.stringify({
        timestamp: Date.now() - 60_000,
        config: {
          systemName: 'Expired Siliconfission',
          logoUrl: '',
          footerHtml: '',
          navigation: [{ key: 'docs', href: 'https://console.siliconfission.com/docs', requireAuth: false }],
          applications: [],
          registration: { enabled: false, password: false, github: false, oidc: false },
        },
      }),
    );

    const result = await loadSiteConfig(vi.fn().mockRejectedValue(new Error('offline')));

    expect(result.systemName).toBe('Siliconfission');
    expect(result.navigation.some((item) => item.key === 'docs')).toBe(false);
  });

  it('uses the safe fallback rather than a future-dated cache after a request failure', async () => {
    localStorage.setItem(
      'sf-public-site-config-v1',
      JSON.stringify({
        timestamp: Date.now() + 1,
        config: {
          systemName: 'Future Siliconfission',
          logoUrl: '',
          footerHtml: '',
          navigation: [{ key: 'home', href: '/', requireAuth: false }],
          applications: [],
          registration: { enabled: false, password: false, github: false, oidc: false },
        },
      }),
    );

    const result = await loadSiteConfig(vi.fn().mockRejectedValue(new Error('offline')));

    expect(result.systemName).toBe('Siliconfission');
  });
});
