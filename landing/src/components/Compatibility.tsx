import { ArrowUpRight, Workflow } from 'lucide-react';
import { pageCopy } from '../config/copy';
import type { Locale } from '../lib/preferences';

interface CompatibilityProps {
  applications: string[];
  locale: Locale;
}

const CREATE_KEY_URL = 'https://console.siliconfission.com/console/token';

export function Compatibility({ applications, locale }: CompatibilityProps) {
  const copy = pageCopy[locale];

  return (
    <section className="section-block compatibility-section" aria-labelledby="compatibility-title">
      <div className="page-shell compatibility-section__layout">
        <div>
          <span className="compatibility-section__mark" aria-hidden="true">
            <Workflow />
          </span>
          <h2 id="compatibility-title" className="section-heading section-heading--left">
            {copy.compatibilityTitle}
          </h2>
        </div>
        <div className="compatibility-section__content">
          {applications.length > 0 && (
            <ul className="application-list">
              {applications.map((application) => (
                <li key={application}>{application}</li>
              ))}
            </ul>
          )}
          <a className="text-link" href={CREATE_KEY_URL}>
            {copy.primaryCta}
            <ArrowUpRight aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
