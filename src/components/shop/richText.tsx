import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * Tiny inline markup renderer for content strings (FAQ answers, legal copy):
 *   **bold**, [label](/internal-or-https-link), `code`, and {{placeholders}}.
 * No HTML is ever injected.
 */
export function renderRich(text: string, vars: Record<string, string | number | undefined> = {}): ReactNode {
  const withVars = text.replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(vars[k] ?? ''));
  const parts: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))|(`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(withVars))) {
    if (m.index > last) parts.push(<Fragment key={key++}>{withVars.slice(last, m.index)}</Fragment>);
    const tok = m[0];
    if (tok.startsWith('**')) {
      parts.push(<strong key={key++}>{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith('`')) {
      parts.push(
        <code key={key++} className="kbd">
          {tok.slice(1, -1)}
        </code>,
      );
    } else {
      const lm = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(tok);
      if (lm) {
        const [, label, href] = lm;
        if (/^https?:\/\//.test(href)) {
          parts.push(
            <a key={key++} href={href} target="_blank" rel="noreferrer">
              {label}
            </a>,
          );
        } else {
          parts.push(
            <Link key={key++} to={href}>
              {label}
            </Link>,
          );
        }
      } else {
        parts.push(<Fragment key={key++}>{tok}</Fragment>);
      }
    }
    last = m.index + tok.length;
  }
  if (last < withVars.length) parts.push(<Fragment key={key++}>{withVars.slice(last)}</Fragment>);
  return <>{parts}</>;
}

/** Render a multi-paragraph string (blank-line separated) as <p>s. */
export function renderParagraphs(text: string, vars?: Record<string, string | number | undefined>): ReactNode {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p, i) => <p key={i}>{renderRich(p, vars)}</p>);
}
