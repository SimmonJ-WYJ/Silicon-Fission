import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SiteConfig } from '../types/site';
import { Header } from './Header';

afterEach(cleanup);

function configWith(navigation: SiteConfig['navigation']): SiteConfig {
  return {
    systemName: 'Siliconfission',
    logoUrl: '',
    footerHtml: '',
    navigation,
    applications: [],
    registration: { enabled: true, password: true, github: false, oidc: false },
  };
}

function renderHeader(config: SiteConfig, locale: 'zh-CN' | 'en' = 'en') {
  return render(
    <Header
      config={config}
      locale={locale}
      theme="light"
      onLocaleChange={vi.fn()}
      onThemeChange={vi.fn()}
    />,
  );
}

describe('Header', () => {
  it('renders only enabled navigation in its configured order', () => {
    renderHeader(
      configWith([
        { key: 'rankings', href: 'https://console.siliconfission.com/rankings', requireAuth: false },
        { key: 'console', href: 'https://console.siliconfission.com/dashboard', requireAuth: false },
      ]),
    );

    const navigation = screen.getByRole('navigation', { name: 'Primary navigation' });
    expect(within(navigation).getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Leaderboard',
      'Console',
    ]);
    expect(screen.queryByRole('link', { name: 'Models' })).not.toBeInTheDocument();
  });

  it('never renders the docs module even if it is included in the configuration', () => {
    renderHeader(
      configWith([{ key: 'docs', href: 'https://console.siliconfission.com/docs', requireAuth: false }]),
    );

    expect(screen.queryByRole('link', { name: 'Docs' })).not.toBeInTheDocument();
  });

  it('switches navigation labels with the selected locale', () => {
    const config = configWith([{ key: 'pricing', href: 'https://console.siliconfission.com/pricing', requireAuth: false }]);
    const { rerender } = renderHeader(config);

    expect(screen.getByRole('link', { name: 'Models' })).toBeInTheDocument();

    rerender(
      <Header config={config} locale="zh-CN" theme="light" onLocaleChange={vi.fn()} onThemeChange={vi.fn()} />,
    );

    expect(screen.getByRole('link', { name: '模型广场' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Models' })).not.toBeInTheDocument();
  });

  it('sends the account link to the console login route', () => {
    renderHeader(configWith([]));

    expect(screen.getByRole('link', { name: 'Sign in / Register' })).toHaveAttribute(
      'href',
      'https://console.siliconfission.com/login',
    );
  });

  it('falls back to a wordmark when the configured logo cannot load', () => {
    const { container } = renderHeader({
      ...configWith([]),
      logoUrl: 'https://example.com/logo.svg',
    });
    fireEvent.error(container.querySelector('img')!);

    expect(screen.getByText('SF')).toBeInTheDocument();
  });
});
