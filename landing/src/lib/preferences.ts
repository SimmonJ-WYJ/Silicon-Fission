export type Locale = 'zh-CN' | 'en';
export type Theme = 'light' | 'dark';

const LOCALE_KEY = 'sf-locale';
const THEME_KEY = 'sf-theme';

interface LocaleOptions {
  stored?: string | null;
  browser?: string | null;
}

interface ThemeOptions {
  stored?: string | null;
  prefersDark?: boolean;
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isLocale(value: string | null | undefined): value is Locale {
  return value === 'zh-CN' || value === 'en';
}

function isTheme(value: string | null | undefined): value is Theme {
  return value === 'light' || value === 'dark';
}

function readPreference(key: string): string | null {
  try {
    return getStorage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function browserLocale(): string | null {
  return typeof navigator === 'undefined' ? null : navigator.language;
}

function prefersDarkTheme(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;
}

export function applyTheme(theme: Theme): void {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = theme;
  }
}

export function getInitialLocale(options: LocaleOptions = {}): Locale {
  const stored = options.stored === undefined ? readPreference(LOCALE_KEY) : options.stored;
  if (isLocale(stored)) return stored;

  const browser = options.browser === undefined ? browserLocale() : options.browser;
  return browser?.toLowerCase().startsWith('zh-') ? 'zh-CN' : 'en';
}

export function getInitialTheme(options: ThemeOptions = {}): Theme {
  const stored = options.stored === undefined ? readPreference(THEME_KEY) : options.stored;
  const theme = isTheme(stored)
    ? stored
    : options.prefersDark === undefined
      ? prefersDarkTheme()
        ? 'dark'
        : 'light'
      : options.prefersDark
        ? 'dark'
        : 'light';

  applyTheme(theme);
  return theme;
}

export function persistLocale(locale: Locale): void {
  try {
    getStorage()?.setItem(LOCALE_KEY, locale);
  } catch {
    // Storage may be unavailable in private browsing; the current choice still works.
  }
}

export function persistTheme(theme: Theme): void {
  applyTheme(theme);
  try {
    getStorage()?.setItem(THEME_KEY, theme);
  } catch {
    // Storage may be unavailable in private browsing; the current choice still works.
  }
}
