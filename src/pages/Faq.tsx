import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Seo } from '../components/ui/Seo';
import { Icon } from '../components/ui/Icons';
import { Accordion } from '../components/shop/Accordion';
import { renderRich } from '../components/shop/richText';
import { faqGroups } from '../data/faq';
import { breadcrumbSchema, faqSchema } from '../seo/schema';
import { cleanText, nodeText } from '../seo/text';
import '../styles/shop.css';
import '../styles/content.css';

export default function Faq() {
  const { config } = useStore();
  const [q, setQ] = useState('');
  const vars = {
    store: config.storeName,
    server: config.serverName,
    eta: config.delivery.etaText,
    referralFriend: config.referral.friendPercent,
    referralReferrer: config.referral.referrerPercent,
    reviewReward: config.reviewRewardPercent,
    welcomeCode: config.welcomeCoupon.code,
    welcomePercent: config.welcomeCoupon.percent,
    spinCooldown: 24,
  };

  const groups = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return faqGroups;
    return faqGroups
      .map((g) => ({ ...g, items: g.items.filter((i) => (i.q + ' ' + i.a).toLowerCase().includes(s)) }))
      .filter((g) => g.items.length > 0);
  }, [q]);
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="container page content-page">
      <Seo
        title={`FAQ – DonutSMP money, delivery, payments & safety · ${config.storeName}`}
        description={`Answers about ordering ${config.serverName} money and items, delivery times, payment methods, free spins, referrals and account safety at ${config.storeName}.`}
        canonical="/faq"
        jsonLd={[breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'FAQ', path: '/faq' }]), faqSchema(faqGroups.flatMap((g) => g.items.map((i) => ({ q: i.q, a: cleanText(nodeText(i.a as never)) }))))!]}
      />
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span>FAQ</span>
      </nav>
      <header className="content-head">
        <span className="eyebrow">Help center</span>
        <h1>Frequently asked questions</h1>
        <p className="lead">Everything about ordering, paying and getting your stuff on {config.serverName}. Still stuck? Ask on Discord.</p>
      </header>

      <div className="faq-search">
        <Icon name="search" size={18} />
        <input className="input" type="search" placeholder="Search the FAQ…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the FAQ" />
      </div>

      {!q && (
        <nav className="faq-nav" aria-label="FAQ sections">
          {faqGroups.map((g) => (
            <a key={g.id} href={`#faq-${g.id}`} className="chip">
              {g.title}
            </a>
          ))}
        </nav>
      )}

      {total === 0 ? (
        <div className="empty card">
          <h3>No answers match “{q}”</h3>
          <p className="muted">Try different words – or ask us directly on Discord.</p>
          <a href={config.discordInvite} target="_blank" rel="noreferrer" className="btn btn-discord btn-sm" style={{ marginTop: 12 }}>
            <Icon name="discord" size={16} /> Open Discord
          </a>
        </div>
      ) : (
        <div className="faq-groups">
          {groups.map((g) => (
            <section key={g.id} id={`faq-${g.id}`} className="faq-group">
              <h2>
                <span className="pixel">{String(faqGroups.findIndex((x) => x.id === g.id) + 1).padStart(2, '0')}</span> {g.title}
              </h2>
              {g.blurb && <p className="blurb">{g.blurb}</p>}
              <Accordion items={g.items.map((i) => ({ id: i.id, q: i.q, a: <p>{renderRich(i.a, vars)}</p> }))} />
            </section>
          ))}
        </div>
      )}

      <div className="discord-cta" style={{ marginTop: 56 }}>
        <div className="discord-cta-copy">
          <span className="discord-cta-icon">
            <Icon name="discord" size={30} />
          </span>
          <div>
            <h2>Didn't find it?</h2>
            <p>Open a ticket on Discord with your order ID – a human answers.</p>
          </div>
        </div>
        <div className="discord-cta-actions">
          <a href={config.discordInvite} target="_blank" rel="noreferrer" className="btn btn-discord btn-lg">
            <Icon name="discord" size={18} /> Join Discord
          </a>
          <Link to="/track" className="btn btn-secondary btn-lg">
            Track an order
          </Link>
        </div>
      </div>
    </div>
  );
}
