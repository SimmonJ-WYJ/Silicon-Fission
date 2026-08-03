import { Braces, KeyRound, SlidersHorizontal } from 'lucide-react';
import { pageCopy } from '../config/copy';
import type { Locale } from '../lib/preferences';

interface FeatureGridProps {
  locale: Locale;
}

const icons = [KeyRound, Braces, SlidersHorizontal] as const;

export function FeatureGrid({ locale }: FeatureGridProps) {
  const copy = pageCopy[locale];

  return (
    <section className="section-block feature-section" aria-labelledby="features-title">
      <div className="page-shell">
        <h2 id="features-title" className="section-heading">
          {copy.featuresTitle}
        </h2>
        <div className="feature-grid">
          {copy.features.map(([title, description], index) => {
            const Icon = icons[index];
            return (
              <article className="feature-card" key={title}>
                <span className="feature-card__icon" aria-hidden="true">
                  <Icon />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
