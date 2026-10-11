import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Seo } from '../components/ui/Seo';
import { Icon } from '../components/ui/Icons';
import { absUrl } from '../seo/head';
import { breadcrumbSchema } from '../seo/schema';
import { formatGuideDate, guideExcerpt, guidePlainText, guides } from '../data/guides';
import '../styles/content.css';
import '../styles/guides.css';

/**
 * /guides – index of all SEO guides. Each card links to /guides/:slug (GuidePage).
 */
export default function Guides() {
  const { config } = useStore();
  const store = config.storeName;
  const server = config.serverName;
  const vars = { store, server, eta: config.delivery.etaText };

  const title = `${server} Guides – Money, Spawners, Mystery Boxes & Safe Buying · ${store}`;
  const description = `${server} guides from the ${store} team: how to get money fast, spawner payback math, mystery box odds, Elytra routes, base hunting and how to buy ${server} money without getting scammed.`;

  const jsonLd = [
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Guides', path: '/guides' },
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${server} guides`,
      url: absUrl('/guides'),
      description,
      isPartOf: { '@id': absUrl('/#website') },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: guides.length,
        itemListElement: guides.map((g, i) => ({ '@type': 'ListItem', position: i + 1, url: absUrl(`/guides/${g.slug}`), name: guidePlainText(g.title, vars) })),
      },
    },
  ];

  return (
    <div className="container page content-page guides-page">
      <Seo title={title} description={description} canonical="/guides" jsonLd={jsonLd} />
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span className="row" style={{ gap: 6 }}>
          <span aria-hidden="true">/</span>
          <span>Guides</span>
        </span>
      </nav>

      <header className="content-head">
        <div className="eyebrow">
          <Icon name="list" size={14} /> {server} guides
        </div>
        <h1>{server} guides: money, spawners, boxes and staying safe</h1>
        <p className="lead">
          Everything we know about the {server} economy, written down. Real prices from our catalog, real drop odds, honest notes on risk – and no filler. Start with whichever
          question brought you here.
        </p>
        <div className="guides-head-meta">
          <Link to="/donutsmp-money" className="btn btn-secondary btn-sm">
            <Icon name="coin" size={14} /> Money prices
          </Link>
          <Link to="/donutsmp-spawners" className="btn btn-secondary btn-sm">
            <Icon name="box" size={14} /> Spawner prices
          </Link>
          <Link to="/donutsmp-irl-trade" className="btn btn-secondary btn-sm">
            <Icon name="shield" size={14} /> IRL trading
          </Link>
          <Link to="/faq" className="btn btn-ghost btn-sm">
            FAQ
          </Link>
        </div>
      </header>

      <div className="guide-grid">
        {guides.map((g, i) => (
          <Link key={g.slug} to={`/guides/${g.slug}`} className="card hover guide-card" aria-label={`${guidePlainText(g.title, vars)} – read the guide`}>
            <div className="guide-card-top">
              <span className="guide-card-num" aria-hidden="true">
                #{String(i + 1).padStart(2, '0')}
              </span>
              <span className="guide-card-time">
                <Icon name="clock" size={12} /> {g.readingMinutes} min read
              </span>
            </div>
            <h2>{guidePlainText(g.title, vars)}</h2>
            <p>{guideExcerpt(g, 170, vars)}</p>
            <div className="guide-card-foot">
              <span>
                Updated <time dateTime={g.updatedAt}>{formatGuideDate(g.updatedAt)}</time>
              </span>
              <span className="guide-card-read">
                Read guide <Icon name="arrowRight" size={14} />
              </span>
            </div>
          </Link>
        ))}
      </div>

      <section className="card guides-cta" aria-label="Shop">
        <div>
          <h2>Rather skip the grind?</h2>
          <p>
            Everything the guides talk about – money, spawners, elytras, boxes – is in the store and handed over in-game by our staff. {config.delivery.etaText}
          </p>
        </div>
        <div className="guides-cta-actions">
          <Link to="/shop" className="btn btn-primary">
            <Icon name="cart" size={16} /> Open the shop
          </Link>
          <Link to="/spin" className="btn btn-pink">
            <Icon name="spin" size={16} /> Free daily spin
          </Link>
        </div>
      </section>
    </div>
  );
}
