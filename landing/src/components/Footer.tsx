import { Fragment, type ReactNode } from 'react';
import type { Locale } from '../lib/preferences';
import type { SiteConfig } from '../types/site';

interface FooterProps {
  config: SiteConfig;
  locale: Locale;
}

function safeHref(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.startsWith('/')) return trimmed;

  try {
    const parsed = new URL(trimmed);
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

function parseFooterContent(source: string): ReactNode[] {
  if (!source || typeof DOMParser === 'undefined') return [];

  const document = new DOMParser().parseFromString(source, 'text/html');
  let key = 0;

  function renderNode(node: Node): ReactNode {
    const nodeKey = key++;
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent ? <Fragment key={nodeKey}>{node.textContent}</Fragment> : null;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    const element = node as Element;
    const tagName = element.tagName.toLowerCase();
    if (tagName === 'script' || tagName === 'style') return null;

    const children = Array.from(element.childNodes).map(renderNode);
    if (tagName === 'br') return <br key={nodeKey} />;
    if (tagName === 'a') {
      const href = safeHref(element.getAttribute('href') ?? '');
      return href ? (
        <a key={nodeKey} href={href} rel="noreferrer">
          {children}
        </a>
      ) : (
        <Fragment key={nodeKey}>{children}</Fragment>
      );
    }

    if (tagName === 'p') return <p key={nodeKey}>{children}</p>;
    if (tagName === 'strong') return <strong key={nodeKey}>{children}</strong>;
    if (tagName === 'em') return <em key={nodeKey}>{children}</em>;
    return <Fragment key={nodeKey}>{children}</Fragment>;
  }

  return Array.from(document.body.childNodes).map(renderNode);
}

export function Footer({ config, locale }: FooterProps) {
  const copyright =
    locale === 'zh-CN'
      ? `© ${new Date().getFullYear()} ${config.systemName}。保留所有权利。`
      : `© ${new Date().getFullYear()} ${config.systemName}. All rights reserved.`;
  const configuredContent = parseFooterContent(config.footerHtml);

  return (
    <footer className="site-footer">
      <div className="page-shell site-footer__inner">
        <p>{copyright}</p>
        {configuredContent.length > 0 && <div className="site-footer__configured">{configuredContent}</div>}
      </div>
    </footer>
  );
}
