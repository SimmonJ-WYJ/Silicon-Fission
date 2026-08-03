import { ArrowRight } from 'lucide-react';
import { pageCopy } from '../config/copy';
import type { Locale } from '../lib/preferences';

interface FinalCtaProps {
  locale: Locale;
}

const CREATE_KEY_URL = 'https://console.siliconfission.com/console/token';

export function FinalCta({ locale }: FinalCtaProps) {
  const copy = pageCopy[locale];

  return (
    <section className="final-cta" aria-labelledby="final-cta-title">
      <div className="page-shell final-cta__inner">
        <div>
          <h2 id="final-cta-title">{copy.finalTitle}</h2>
          <p>{copy.finalBody}</p>
        </div>
        <a className="button button--primary" href={CREATE_KEY_URL}>
          {copy.primaryCta}
          <ArrowRight aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
