import { ArrowRight } from 'lucide-react';
import { pageCopy } from '../config/copy';
import type { Locale } from '../lib/preferences';
import { CodeDemo } from './CodeDemo';

interface HeroProps {
  locale: Locale;
}

const CREATE_KEY_URL = 'https://console.siliconfission.com/console/token';
const MODELS_URL = 'https://console.siliconfission.com/pricing';

export function Hero({ locale }: HeroProps) {
  const copy = pageCopy[locale];

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__halo" aria-hidden="true" />
      <div className="page-shell hero__layout">
        <div className="hero__copy">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 id="hero-title">{copy.title}</h1>
          <p className="hero__subtitle">{copy.subtitle}</p>
          <div className="button-row">
            <a className="button button--primary" href={CREATE_KEY_URL}>
              {copy.primaryCta}
              <ArrowRight aria-hidden="true" />
            </a>
            <a className="button button--secondary" href={MODELS_URL}>
              {copy.secondaryCta}
            </a>
          </div>
        </div>
        <div className="hero__visual">
          <CodeDemo locale={locale} />
        </div>
      </div>
    </section>
  );
}
