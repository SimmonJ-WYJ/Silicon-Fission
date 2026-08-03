import { pageCopy } from '../config/copy';
import type { Locale } from '../lib/preferences';

interface IntegrationStepsProps {
  locale: Locale;
}

export function IntegrationSteps({ locale }: IntegrationStepsProps) {
  const copy = pageCopy[locale];

  return (
    <section className="section-block steps-section" aria-labelledby="steps-title">
      <div className="page-shell">
        <h2 id="steps-title" className="section-heading">
          {copy.stepsTitle}
        </h2>
        <ol className="steps-list">
          {copy.steps.map((step, index) => (
            <li key={step}>
              <span className="steps-list__number" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
