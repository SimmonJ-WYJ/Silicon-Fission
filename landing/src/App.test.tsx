import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import type { SiteConfig } from './types/site';

const { loadSiteConfigMock } = vi.hoisted(() => ({
  loadSiteConfigMock: vi.fn(),
}));

vi.mock('./lib/site-config', () => ({
  loadSiteConfig: loadSiteConfigMock,
}));

const baseConfig: SiteConfig = {
  systemName: 'Siliconfission',
  logoUrl: '',
  footerHtml: '',
  navigation: [
    { key: 'home', href: '/', requireAuth: false },
    { key: 'pricing', href: 'https://console.siliconfission.com/pricing', requireAuth: false },
  ],
  applications: ['Cherry Studio'],
  registration: { enabled: true, password: true, github: false, oidc: false },
};

beforeEach(() => {
  localStorage.clear();
  loadSiteConfigMock.mockResolvedValue(baseConfig);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('renders one complete Chinese page with exact CTA routes and no unsupported claims', async () => {
    localStorage.setItem('sf-locale', 'zh-CN');
    render(<App />);

    const title = await screen.findByRole('heading', { name: '一个 API Key，连接多种大模型' });
    expect(title).toBeVisible();
    expect(screen.queryByText('One API Key. Multiple AI models.')).not.toBeInTheDocument();

    for (const link of screen.getAllByRole('link', { name: '创建 API Key' })) {
      expect(link).toHaveAttribute('href', 'https://console.siliconfission.com/console/token');
    }
    expect(screen.getByRole('link', { name: '浏览模型' })).toHaveAttribute(
      'href',
      'https://console.siliconfission.com/pricing',
    );
    expect(document.body.textContent).not.toMatch(/99\.9%|50\+|uptime/i);
    expect(document.body.textContent).not.toMatch(/partner|trusted by|collaborat/i);
  });

  it('places the real-logo compatibility grid immediately after the hero', async () => {
    localStorage.setItem('sf-locale', 'zh-CN');
    render(<App />);

    const heroTitle = await screen.findByRole('heading', { name: '一个 API Key，连接多种大模型' });
    const logoTitle = screen.getByRole('heading', { name: '兼容你熟悉的模型与工具' });
    const hero = heroTitle.closest('section');
    const logoCloud = logoTitle.closest('section');

    expect(hero?.nextElementSibling).toBe(logoCloud);
    expect(within(logoCloud!).getByRole('img', { name: 'OpenAI logo' })).toBeVisible();
    expect(within(logoCloud!).getByRole('img', { name: 'Claude logo' })).toBeVisible();
    expect(within(logoCloud!).getByRole('img', { name: 'Gemini logo' })).toBeVisible();
    expect(within(logoCloud!).getByRole('img', { name: 'DeepSeek logo' })).toBeVisible();
    expect(within(logoCloud!).getByRole('img', { name: 'Cherry Studio logo' })).toBeVisible();
    expect(within(logoCloud!).queryByRole('img', { name: 'CC Switch logo' })).not.toBeInTheDocument();
    for (const logo of within(logoCloud!).getAllByRole('img')) {
      expect(logo).toHaveAttribute('src', expect.stringMatching(/^\/compatibility-logos\//));
    }
  });

  it('renders the configured CC Switch logo from a bundled path and rejects unknown logos', async () => {
    loadSiteConfigMock.mockResolvedValue({
      ...baseConfig,
      applications: ['CC Switch', 'Unknown Client'],
    });
    render(<App />);

    const logoTitle = await screen.findByRole('heading', {
      name: 'Compatible with the models and tools you know',
    });
    const logoCloud = logoTitle.closest('section');
    const ccSwitch = within(logoCloud!).getByRole('img', { name: 'CC Switch logo' });

    expect(ccSwitch).toHaveAttribute('src', expect.stringMatching(/^\/compatibility-logos\/.+\.png$/));
    expect(within(logoCloud!).queryByRole('img', { name: 'Unknown Client logo' })).not.toBeInTheDocument();
    expect(within(logoCloud!).getAllByRole('img')).toHaveLength(5);
  });

  it('uses only normalized public applications in the workflow compatibility section', async () => {
    localStorage.setItem('sf-locale', 'en');
    render(<App />);

    const heading = await screen.findByRole('heading', { name: 'Connect your existing AI workflow' });
    const section = heading.closest('section');

    expect(within(section!).getByText('Cherry Studio')).toBeVisible();
    expect(within(section!).queryByText('CC Switch')).not.toBeInTheDocument();
    expect(within(section!).getByRole('link', { name: 'Create API Key' })).toHaveAttribute(
      'href',
      'https://console.siliconfission.com/console/token',
    );
  });

  it('renders only English copy when English is selected', async () => {
    localStorage.setItem('sf-locale', 'en');
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'One API Key. Multiple AI models.' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Integrate once. Keep more model options.' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Start in three steps' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Ready to start building?' })).toBeVisible();
    expect(screen.queryByText('一个 API Key，连接多种大模型')).not.toBeInTheDocument();
  });

  it('shows only confirmed protocol examples and announces copied code', async () => {
    localStorage.setItem('sf-locale', 'en');
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    render(<App />);

    await screen.findByRole('heading', { name: 'One API Key. Multiple AI models.' });
    expect(screen.getByRole('tab', { name: 'OpenAI Chat' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/POST \/v1\/chat\/completions/)).toBeVisible();
    expect(screen.getByText(/"model": "your-model"/)).toBeVisible();

    fireEvent.click(screen.getByRole('tab', { name: 'Responses' }));
    expect(screen.getByText(/POST \/v1\/responses/)).toBeVisible();

    fireEvent.click(screen.getByRole('tab', { name: 'Claude' }));
    expect(screen.getByText(/POST \/v1\/messages/)).toBeVisible();
    expect(document.body.textContent).not.toMatch(/gpt-4|sonnet|opus|haiku/i);

    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledOnce());
    expect(await screen.findByRole('status')).toHaveTextContent('Code copied');
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('renders configured footer text and allowlisted links without injecting HTML', async () => {
    loadSiteConfigMock.mockResolvedValue({
      ...baseConfig,
      footerHtml:
        '<span>Service notice</span> <a href="https://example.com/legal">Legal</a>' +
        '<a href="javascript:alert(1)">Unsafe</a><script>malicious()</script>',
    });
    render(<App />);

    await screen.findByRole('heading', { name: 'One API Key. Multiple AI models.' });
    expect(document.querySelector('.site-footer')).toHaveTextContent('Service notice');
    expect(screen.getByRole('link', { name: 'Legal' })).toHaveAttribute('href', 'https://example.com/legal');
    expect(screen.queryByRole('link', { name: 'Unsafe' })).not.toBeInTheDocument();
    expect(document.querySelector('.site-footer')).toHaveTextContent('Unsafe');
    expect(screen.queryByText('malicious()')).not.toBeInTheDocument();
    expect(document.querySelector('.site-footer script')).not.toBeInTheDocument();
  });
});
