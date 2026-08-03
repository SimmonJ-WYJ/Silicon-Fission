import { PlusIcon } from 'lucide-react';
import { pageCopy } from '../config/copy';
import type { Locale } from '../lib/preferences';

interface LogoCloudProps {
  applications: string[];
  locale: Locale;
}

interface LogoDefinition {
  name: string;
  src: string;
  preserveColor?: boolean;
}

const protocolLogos: LogoDefinition[] = [
  { name: 'OpenAI', src: '/compatibility-logos/openai.a595df6b4239.svg' },
  { name: 'Claude', src: '/compatibility-logos/claude.365a70a7eb39.svg' },
  { name: 'Gemini', src: '/compatibility-logos/gemini.87d5b3c4be75.svg' },
  { name: 'DeepSeek', src: '/compatibility-logos/deepseek.8f9443e351b6.svg' },
];

const applicationLogos: Record<string, LogoDefinition> = {
  'Cherry Studio': {
    name: 'Cherry Studio',
    src: '/compatibility-logos/cherry-studio.3797e06882aa.svg',
  },
  'CC Switch': {
    name: 'CC Switch',
    src: '/compatibility-logos/cc-switch.04225b1b9c54.png',
    preserveColor: true,
  },
};

export function LogoCloud({ applications, locale }: LogoCloudProps) {
  const configuredLogos = applications.flatMap((application) =>
    applicationLogos[application] ? [applicationLogos[application]] : [],
  );
  const logos = [...protocolLogos, ...configuredLogos];

  return (
    <section className="logo-cloud" aria-labelledby="logo-cloud-title">
      <div className="page-shell">
        <h2 id="logo-cloud-title" className="logo-cloud__title">
          {pageCopy[locale].logoCloudTitle}
        </h2>
        <div className="logo-cloud__grid">
          {logos.map((logo) => (
            <div className="logo-cloud__cell" key={logo.name}>
              <PlusIcon className="logo-cloud__plus logo-cloud__plus--start" aria-hidden="true" />
              <PlusIcon
                className="logo-cloud__plus logo-cloud__plus--end logo-cloud__plus--end-mobile"
                aria-hidden="true"
              />
              <PlusIcon
                className="logo-cloud__plus logo-cloud__plus--end logo-cloud__plus--end-desktop"
                aria-hidden="true"
              />
              <img
                className={logo.preserveColor ? 'logo-cloud__logo' : 'logo-cloud__logo logo-cloud__logo--mono'}
                src={logo.src}
                alt={`${logo.name} logo`}
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
