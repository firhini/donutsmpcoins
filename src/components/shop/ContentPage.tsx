import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Seo } from '../ui/Seo';
import { Icon } from '../ui/Icons';
import { useStore } from '../../context/StoreContext';
import '../../styles/content.css';

export interface TocEntry {
  id: string;
  label: string;
}

/**
 * Shared layout for landing + legal pages: breadcrumbs, head, prose column
 * with an optional sticky table of contents and CTA card.
 */
export function ContentPage({
  title,
  seoTitle,
  description,
  eyebrow,
  lead,
  crumbs = [],
  toc,
  updated,
  aside,
  children,
  wide = false,
}: {
  title: string;
  seoTitle?: string;
  description: string;
  eyebrow?: string;
  lead?: ReactNode;
  crumbs?: { to?: string; label: string }[];
  toc?: TocEntry[];
  updated?: string;
  /** extra aside content under the TOC */
  aside?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  const { config } = useStore();
  return (
    <div className={`container page content-page ${wide ? 'content-wide' : ''}`}>
      <Seo title={seoTitle ?? `${title} · ${config.storeName}`} description={description} />
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        {crumbs.map((c, i) => (
          <span key={i} className="row" style={{ gap: 6 }}>
            <span aria-hidden="true">/</span>
            {c.to ? <Link to={c.to}>{c.label}</Link> : <span>{c.label}</span>}
          </span>
        ))}
      </nav>
      <header className="content-head">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {lead && <p className="lead">{lead}</p>}
        {updated && <p className="muted small content-updated">Last updated: {updated}</p>}
      </header>
      <div className={`content-layout ${toc || aside ? 'has-aside' : ''}`}>
        <article className="prose">{children}</article>
        {(toc || aside) && (
          <aside className="content-aside">
            {toc && toc.length > 0 && (
              <nav className="toc card" aria-label="On this page">
                <div className="toc-title">On this page</div>
                <ol>
                  {toc.map((t) => (
                    <li key={t.id}>
                      <a href={`#${t.id}`}>{t.label}</a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}
            {aside}
            <div className="card pad content-help">
              <div className="row" style={{ gap: 10 }}>
                <span className="content-help-icon">
                  <Icon name="discord" size={18} />
                </span>
                <strong>Questions?</strong>
              </div>
              <p className="small muted">Our staff answer on Discord – usually within minutes while we are online.</p>
              <a href={config.discordInvite} target="_blank" rel="noreferrer" className="btn btn-discord btn-sm btn-block">
                <Icon name="discord" size={16} /> Open Discord
              </a>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

/** Highlighted callout for prose pages. */
export function Callout({ tone = 'info', title, children }: { tone?: 'info' | 'warn' | 'success' | 'danger'; title?: string; children: ReactNode }) {
  const icon = tone === 'warn' || tone === 'danger' ? 'warning' : tone === 'success' ? 'check' : 'info';
  return (
    <div className={`alert alert-${tone} prose-callout`} role="note">
      <span className="prose-callout-icon">
        <Icon name={icon} size={18} />
      </span>
      <div>
        {title && <strong className="prose-callout-title">{title}</strong>}
        <div>{children}</div>
      </div>
    </div>
  );
}
