import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Icon } from '../components/ui/Icons';
import { ContentPage, Callout } from '../components/shop/ContentPage';
import { Accordion } from '../components/shop/Accordion';
import { renderRich } from '../components/shop/richText';
import { formatGuideDate, guidePlainText, sectionId } from '../data/guides';
import { wikiArticles, wikiBySlug, type WikiArticle } from '../data/wiki';
import NotFound from './NotFound';
import '../styles/guides.css';

/** /wiki/:slug – one informational wiki article (Article + FAQ + Breadcrumb JSON-LD via ContentPage). */
export default function WikiPage() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? wikiBySlug(slug) : undefined;
  if (!article) return <NotFound />;
  return <WikiArticleView key={article.slug} a={article} />;
}

function WikiArticleView({ a }: { a: WikiArticle }) {
  const { config } = useStore();
  const vars = useMemo(() => ({ store: config.storeName, server: config.serverName, eta: config.delivery.etaText }), [config.storeName, config.serverName, config.delivery.etaText]);
  const related = a.related.map((s) => wikiArticles.find((w) => w.slug === s)).filter((w): w is WikiArticle => !!w && w.slug !== a.slug);
  const faqItems = a.faq.map((f, i) => ({ id: `${a.slug}-faq-${i + 1}`, q: guidePlainText(f.q, vars), a: <p>{renderRich(f.a, vars)}</p> }));
  const toc = [
    ...a.sections.map((s) => ({ id: sectionId(s.heading), label: guidePlainText(s.heading, vars) })),
    { id: 'faq', label: 'FAQ' },
    ...(related.length ? [{ id: 'related', label: 'Related articles' }] : []),
  ];

  return (
    <ContentPage
      eyebrow={`${config.serverName} wiki · ${a.category}`}
      title={a.title}
      seoTitle={`${a.seoTitle} | ${config.storeName}`}
      description={a.metaDescription}
      lead={renderRich(a.intro, vars)}
      crumbs={[{ to: '/wiki', label: 'Wiki' }, { label: a.title }]}
      toc={toc}
      datePublished={a.updatedAt}
      faq={faqItems.map((f) => ({ q: f.q, a: f.a }))}
      aside={
        a.shopLinks.length > 0 && (
          <div className="card pad">
            <strong>Skip the grind</strong>
            <p className="small muted" style={{ margin: '6px 0 12px' }}>
              Delivered in-game by our staff.
            </p>
            <div className="stack" style={{ gap: 8 }}>
              {a.shopLinks.map((l, i) => (
                <Link key={l.to} to={l.to} className={`btn btn-block ${i === 0 ? 'btn-primary' : 'btn-secondary'}`}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        )
      }
    >
      <p className="guide-meta">
        <span>
          <Icon name="list" size={13} /> {a.category}
        </span>
        <span>
          <Icon name="refresh" size={13} /> Updated <time dateTime={a.updatedAt}>{formatGuideDate(a.updatedAt)}</time>
        </span>
      </p>

      {a.sections.map((s, si) => (
        <section key={s.heading}>
          {si === 2 && a.shopLinks.length > 0 && <WikiShopBox links={a.shopLinks} />}
          <h2 id={sectionId(s.heading)}>{renderRich(s.heading, vars)}</h2>
          {s.paragraphs.map((p, i) => (
            <p key={i}>{renderRich(p, vars)}</p>
          ))}
          {s.list && s.list.length > 0 && (
            <ul>
              {s.list.map((li, i) => (
                <li key={i}>{renderRich(li, vars)}</li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <h2 id="faq">Frequently asked questions</h2>
      <Accordion items={faqItems} />

      {related.length > 0 && (
        <>
          <h2 id="related">Related articles</h2>
          <div className="guide-rel-grid">
            {related.map((w) => (
              <Link key={w.slug} to={`/wiki/${w.slug}`} className="card hover guide-rel">
                <strong>{w.title}</strong>
                <span>{w.summary}</span>
              </Link>
            ))}
          </div>
          <p>
            <Link to="/wiki">All {config.serverName} wiki articles →</Link>
          </p>
        </>
      )}

      <Callout tone="info" title="Community wiki">
        {config.storeName} is an independent player-run store with no affiliation to {config.serverName}, Mojang or Microsoft. {config.serverName} changes often – if something here is
        out of date, tell us on Discord.
      </Callout>
    </ContentPage>
  );
}

/** In-article call to action: the article's shop links plus the store's perks. */
function WikiShopBox({ links }: { links: WikiArticle['shopLinks'] }) {
  const { config } = useStore();
  const perks = [
    config.welcomeCoupon.enabled && config.welcomeCoupon.code ? `${config.welcomeCoupon.percent}% off your first order with ${config.welcomeCoupon.code}` : null,
    config.cashback?.enabled && config.cashback.percent > 0 ? `${config.cashback.percent}% cashback on every order` : null,
    'delivered in-game by real staff',
  ].filter(Boolean);
  return (
    <aside className="wiki-shopbox" aria-label="Shop">
      <div>
        <strong>Rather skip the grind?</strong>
        <span>{perks.join(' · ')}</span>
      </div>
      <div className="wiki-shopbox-links">
        {links.map((l, i) => (
          <Link key={l.to} to={l.to} className={`btn btn-sm ${i === 0 ? 'btn-primary' : 'btn-secondary'}`} data-track={`wiki cta ${l.label}`}>
            {l.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
