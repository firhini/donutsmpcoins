import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Product } from '../shared/types';
import { useStore } from '../context/StoreContext';
import { Icon } from '../components/ui/Icons';
import { ContentPage, Callout } from '../components/shop/ContentPage';
import { ProductCard } from '../components/shop/ProductCard';
import { ProductImage } from '../components/shop/ProductImage';
import { Accordion } from '../components/shop/Accordion';
import { renderRich } from '../components/shop/richText';
import { formatGuideDate, guideBySlug, guidePlainText, guides, sectionId, type Guide } from '../data/guides';
import NotFound from './NotFound';
import '../styles/guides.css';

/**
 * /guides/:slug – renders one guide from src/data/guides.ts with the shared
 * ContentPage layout (breadcrumbs, TOC, FAQ + Article + Breadcrumb JSON-LD).
 */
export default function GuidePage() {
  const { slug } = useParams<{ slug: string }>();
  const guide = guideBySlug(slug);
  if (!guide) return <NotFound />;
  return <GuideArticle key={guide.slug} guide={guide} />;
}

function GuideArticle({ guide }: { guide: Guide }) {
  const { config, productById, fmt } = useStore();
  const vars = useMemo(
    () => ({ store: config.storeName, server: config.serverName, eta: config.delivery.etaText }),
    [config.storeName, config.serverName, config.delivery.etaText],
  );

  const related = useMemo(() => guide.relatedProductIds.map((id) => productById(id)).filter((p): p is Product => !!p && !p.hidden), [guide, productById]);
  const relatedGuides = useMemo(() => guide.relatedGuides.map((s) => guides.find((g) => g.slug === s)).filter((g): g is Guide => !!g && g.slug !== guide.slug), [guide]);
  const hero = related[0];

  const faqItems = guide.faq.map((f, i) => ({
    id: `${guide.slug}-faq-${i + 1}`,
    q: guidePlainText(f.q, vars),
    a: <p>{renderRich(f.a, vars)}</p>,
  }));

  const toc = [
    ...guide.sections.map((s) => ({ id: sectionId(s.heading), label: guidePlainText(s.heading, vars) })),
    { id: 'faq', label: 'FAQ' },
    ...(related.length ? [{ id: 'related-products', label: 'Related products' }] : []),
    ...(relatedGuides.length ? [{ id: 'more-guides', label: 'More guides' }] : []),
  ];

  return (
    <ContentPage
      eyebrow={`${config.serverName} guide`}
      title={guidePlainText(guide.title, vars)}
      seoTitle={guidePlainText(guide.seoTitle, vars)}
      description={guidePlainText(guide.metaDescription, vars)}
      lead={renderRich(guide.intro, vars)}
      crumbs={[{ to: '/guides', label: 'Guides' }, { label: guidePlainText(guide.title, vars) }]}
      toc={toc}
      datePublished={guide.updatedAt}
      faq={faqItems.map((f) => ({ q: f.q, a: f.a }))}
      aside={
        hero && (
          <div className="card pad">
            <div className="guide-aside-product">
              <ProductImage product={hero} size="sm" />
              <div>
                <strong>{hero.name}</strong>
                <div className="small muted">
                  {hero.kind === 'money' && hero.unitLabel ? `${fmt(hero.priceCents)} ${hero.unitLabel}` : fmt(hero.priceCents)}
                  {hero.compareAtCents && hero.compareAtCents > hero.priceCents ? ` · was ${fmt(hero.compareAtCents)}` : ''}
                </div>
              </div>
            </div>
            <Link to={`/product/${hero.slug}`} className="btn btn-primary btn-block" style={{ marginTop: 14 }}>
              <Icon name="cart" size={16} /> View {hero.name}
            </Link>
            <Link to="/shop" className="btn btn-ghost btn-sm btn-block" style={{ marginTop: 8 }}>
              Browse the whole shop
            </Link>
          </div>
        )
      }
    >
      <p className="guide-meta">
        <span>
          <Icon name="clock" size={13} /> {guide.readingMinutes} min read
        </span>
        <span>
          <Icon name="refresh" size={13} /> Updated <time dateTime={guide.updatedAt}>{formatGuideDate(guide.updatedAt)}</time>
        </span>
        <span>
          <Icon name="check" size={13} /> Prices from our live catalog
        </span>
      </p>

      {guide.sections.map((s) => (
        <section key={s.heading}>
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
          <h2 id="related-products">Related products</h2>
          <p>Everything mentioned above, at the prices quoted. Handed over in-game by our staff after payment.</p>
          <div className="guide-related">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} compact />
            ))}
          </div>
        </>
      )}

      {relatedGuides.length > 0 && (
        <>
          <h2 id="more-guides">More guides</h2>
          <div className="guide-rel-grid">
            {relatedGuides.map((g) => (
              <Link key={g.slug} to={`/guides/${g.slug}`} className="card hover guide-rel">
                <strong>{guidePlainText(g.title, vars)}</strong>
                <span>
                  <Icon name="clock" size={12} /> {g.readingMinutes} min read
                </span>
              </Link>
            ))}
          </div>
          <p>
            <Link to="/guides">All {config.serverName} guides →</Link>
          </p>
        </>
      )}

      <Callout tone="info" title="Before you buy anywhere">
        {config.serverName}’s rules prohibit trading in-game money or items for real currency; enforcement is the server’s decision and buying is your own responsibility.{' '}
        {config.storeName} is an independent player-run store with no affiliation to {config.serverName}, Mojang or Microsoft. Deliveries are made by our staff by hand – there is no
        bot. {config.delivery.etaText}
      </Callout>

      <div className="prose-cta">
        <Link to="/shop" className="btn btn-primary btn-lg">
          <Icon name="cart" size={18} /> Open the shop
        </Link>
        <a href={config.discordInvite} target="_blank" rel="noreferrer" className="btn btn-discord btn-lg">
          <Icon name="discord" size={18} /> Ask on Discord
        </a>
      </div>
    </ContentPage>
  );
}
