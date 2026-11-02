import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Seo } from '../components/ui/Seo';
import { Icon } from '../components/ui/Icons';
import { absUrl } from '../seo/head';
import { breadcrumbSchema } from '../seo/schema';
import { wikiArticles, type WikiArticle } from '../data/wiki';
import '../styles/content.css';
import '../styles/guides.css';

const ORDER: WikiArticle['category'][] = ['Getting started', 'Economy', 'Farms & spawners', 'Items & gear', 'PvP & combat', 'Server & rules'];

/** /wiki – DonutSMP wiki index, grouped by category. */
export default function Wiki() {
  const { config } = useStore();
  const server = config.serverName;
  const title = `${server} Wiki – Commands, Economy & Farms | ${config.storeName}`;
  const description = `The ${server} wiki: ${wikiArticles.length} guides on joining, commands, money, shards, spawner values, farms, enchantments, PvP and the server rules.`;
  const jsonLd = [
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Wiki', path: '/wiki' },
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${server} wiki`,
      url: absUrl('/wiki'),
      description,
      isPartOf: { '@id': absUrl('/#website') },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: wikiArticles.length,
        itemListElement: wikiArticles.map((a, i) => ({ '@type': 'ListItem', position: i + 1, url: absUrl(`/wiki/${a.slug}`), name: a.title })),
      },
    },
  ];

  return (
    <div className="container page content-page guides-page">
      <Seo title={title} description={description} canonical="/wiki" jsonLd={jsonLd} />
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span className="row" style={{ gap: 6 }}>
          <span aria-hidden="true">/</span>
          <span>Wiki</span>
        </span>
      </nav>

      <header className="content-head">
        <div className="eyebrow">
          <Icon name="list" size={14} /> {server} wiki
        </div>
        <h1>{server} wiki</h1>
        <p className="lead">
          Everything a new or returning {server} player needs: joining, commands, the economy, farms and gear – short, checked and kept up to date. Looking for prices and strategy
          instead? See our <Link to="/guides">guides</Link>.
        </p>
      </header>

      {ORDER.map((cat) => {
        const list = wikiArticles.filter((a) => a.category === cat);
        if (!list.length) return null;
        return (
          <section key={cat} className="wiki-cat">
            <h2>{cat}</h2>
            <div className="guide-grid">
              {list.map((a) => (
                <Link key={a.slug} to={`/wiki/${a.slug}`} className="card hover guide-card">
                  <h3>{a.title}</h3>
                  <p>{a.summary}</p>
                  <div className="guide-card-foot">
                    <span>{a.category}</span>
                    <span className="guide-card-read">
                      Read <Icon name="arrowRight" size={14} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      <section className="card guides-cta" aria-label="Shop">
        <div>
          <h2>Rather skip the grind?</h2>
          <p>Money, spawners, elytras and mystery boxes – handed over in-game by our staff. {config.delivery.etaText}</p>
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
