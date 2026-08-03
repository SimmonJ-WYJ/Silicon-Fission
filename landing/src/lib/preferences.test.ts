import { afterEach, describe, expect, it, vi } from 'vitest';
import { getInitialLocale, getInitialTheme } from './preferences';

afterEach(() => {
  localStorage.clear();
  document.documentElement.dataset.theme = '';
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('getInitialLocale', () => {
  it('prefers an explicit saved locale over the browser language', () => {
    expect(getInitialLocale({ stored: 'en', browser: 'zh-CN' })).toBe('en');
  });

  it('chooses Chinese for any Chinese browser locale when no saved locale exists', () => {
    expect(getInitialLocale({ stored: null, browser: 'zh-TW' })).toBe('zh-CN');
  });

  it('uses English for a non-Chinese browser locale when no saved locale exists', () => {
    expect(getInitialLocale({ stored: null, browser: 'fr-FR' })).toBe('en');
  });
});

describe('getInitialTheme', () => {
  it('prefers an explicit saved theme over the system preference', () => {
    expect(getInitialTheme({ stored: 'light', prefersDark: true })).toBe('light');
  });

  it('uses matchMedia for the system dark-mode preference and applies it to the document', () => {
    const matchMedia = vi.fn().mockReturnValue({ matches: true });
    vi.stubGlobal('matchMedia', matchMedia);

    expect(getInitialTheme({ stored: null })).toBe('dark');
    expect(matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
