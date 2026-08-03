import { useState } from 'react';
import { navigationCopy } from '../config/copy';
import { persistLocale, persistTheme, type Locale, type Theme } from '../lib/preferences';
import type { SiteConfig } from '../types/site';

interface HeaderProps {
  config: SiteConfig;
  locale: Locale;
  theme: Theme;
  onLocaleChange: (locale: Locale) => void;
  onThemeChange: (theme: Theme) => void;
}

const FALLBACK_SYSTEM_NAME = 'Siliconfission';
const CONSOLE_SEARCH_URL = 'https://console.siliconfission.com/dashboard?search=open';
const CONSOLE_LOGIN_URL = 'https://console.siliconfission.com/login';

export function Header({ config, locale, theme, onLocaleChange, onThemeChange }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);
  const labels = navigationCopy[locale];
  const systemName = config.systemName.trim() || FALLBACK_SYSTEM_NAME;
  const navigation = config.navigation.filter((item) => item.key !== 'docs');
  const nextLocale: Locale = locale === 'en' ? 'zh-CN' : 'en';
  const nextTheme: Theme = theme === 'light' ? 'dark' : 'light';

  function changeLocale(): void {
    persistLocale(nextLocale);
    onLocaleChange(nextLocale);
  }

  function changeTheme(): void {
    persistTheme(nextTheme);
    onThemeChange(nextTheme);
  }

  return (
    <header className="site-header">
      <a className="site-header__brand" href="/" aria-label={systemName}>
        {config.logoUrl && !logoLoadFailed ? (
          <img
            className="site-header__logo"
            src={config.logoUrl}
            alt=""
            onError={() => {
              setLogoLoadFailed(true);
            }}
          />
        ) : (
          <span className="site-header__logo-fallback" aria-hidden="true">SF</span>
        )}
        <span>{systemName}</span>
      </a>

      <button
        className="site-header__menu-button"
        type="button"
        aria-label="Toggle primary navigation"
        aria-controls="primary-navigation"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span aria-hidden="true">☰</span>
      </button>

      <nav
        id="primary-navigation"
        className="site-header__navigation"
        aria-label="Primary navigation"
        data-open={menuOpen}
      >
        <div className="site-header__links">
          {navigation.map((item) => (
            <a key={item.key} href={item.href} onClick={() => setMenuOpen(false)}>
              {labels[item.key]}
            </a>
          ))}
        </div>
        <div className="site-header__controls" role="group" aria-label="Landing preferences">
          <a className="site-header__search" href={CONSOLE_SEARCH_URL}>
            {labels.search}
          </a>
          <button
            type="button"
            aria-label={locale === 'en' ? '切换至中文' : 'Switch to English'}
            onClick={changeLocale}
          >
            {locale === 'en' ? '中文' : 'EN'}
          </button>
          <button
            type="button"
            aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
            onClick={changeTheme}
          >
            <span aria-hidden="true">{theme === 'light' ? '◐' : '☀'}</span>
          </button>
          <a className="site-header__account" href={CONSOLE_LOGIN_URL}>
            {labels.account}
          </a>
        </div>
      </nav>
    </header>
  );
}
