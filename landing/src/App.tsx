import { useEffect, useState } from 'react';
import { Compatibility } from './components/Compatibility';
import { FeatureGrid } from './components/FeatureGrid';
import { FinalCta } from './components/FinalCta';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { IntegrationSteps } from './components/IntegrationSteps';
import { LogoCloud } from './components/LogoCloud';
import { getInitialLocale, getInitialTheme, type Locale, type Theme } from './lib/preferences';
import { loadSiteConfig } from './lib/site-config';
import type { SiteConfig } from './types/site';

interface AppProps {
  initialLocale?: Locale;
  initialTheme?: Theme;
}

export default function App({ initialLocale, initialTheme }: AppProps) {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [locale, setLocale] = useState<Locale>(() => initialLocale ?? getInitialLocale());
  const [theme, setTheme] = useState<Theme>(() => initialTheme ?? getInitialTheme());

  useEffect(() => {
    let active = true;
    loadSiteConfig().then((nextConfig) => {
      if (active) setConfig(nextConfig);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  if (!config) return <div className="site-loading" aria-hidden="true" />;

  return (
    <>
      <Header
        config={config}
        locale={locale}
        theme={theme}
        onLocaleChange={setLocale}
        onThemeChange={setTheme}
      />
      <main>
        <Hero locale={locale} />
        <LogoCloud applications={config.applications} locale={locale} />
        <FeatureGrid locale={locale} />
        <IntegrationSteps locale={locale} />
        <Compatibility applications={config.applications} locale={locale} />
        <FinalCta locale={locale} />
      </main>
      <Footer config={config} locale={locale} />
    </>
  );
}
