import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ContentPage, Callout } from '../components/shop/ContentPage';
import { ProductCard } from '../components/shop/ProductCard';
import { Accordion } from '../components/shop/Accordion';
import { renderRich } from '../components/shop/richText';
import { Icon } from '../components/ui/Icons';
import { findLanding, type LandingCopy } from '../data/landingCopy';
import { sectionId } from '../data/guides';
import NotFound from './NotFound';
import '../styles/guides.css';

/** Extra SEO landing pages driven by src/data/landingCopy.ts (e.g. /donutsmp-elytra). */
export default function LandingPage() {
  const { pathname } = useLocation();
  const slug = pathname.replace(/^\/+|\/+$/g, '');
  const landing = slug ? findLanding(slug) : undefined;
  if (!landing) return <NotFound />;
  return <Landing key={landing.slug} landing={landing} />;
}

function Landing({ landing }: { landing: LandingCopy }) {
  const { config, productById } = useStore();
  const vars = { store: config.storeName, server: config.serverName, eta: config.delivery.etaText };
  const products = landing.productIds.map((id) => productById(id)).filter((p): p is NonNullable<typeof p> => !!p);
  const toc = [...landing.sections.map((s) => ({ id: sectionId(s.heading), label: s.heading })), ...(landing.faq.length ? [{ id: 'faq', label: 'FAQ' }] : [])];
  return (
    <ContentPage
      title={landing.title}
      seoTitle={landing.seoTitle}
      description={landing.metaDescription}
      eyebrow={`${config.serverName} guide`}
      lead={renderRich(landing.intro, vars)}
      crumbs={[{ label: landing.title }]}
      toc={toc}
      faq={landing.faq.map((f) => ({ q: f.q, a: renderRich(f.a, vars) }))}
      aside={
        products.length ? (
          <div className="stack" style={{ gap: 8 }}>
            <strong className="small">Related products</strong>
            {products.slice(0, 4).map((p) => (
              <Link key={p.id} to={`/product/${p.slug}`} className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start' }}>
                {p.name}
              </Link>
            ))}
          </div>
        ) : undefined
      }
    >
      {landing.sections.map((s) => (
        <section key={s.heading} id={sectionId(s.heading)}>
          <h2>{s.heading}</h2>
          {s.paragraphs.map((p, i) => (
            <p key={i}>{renderRich(p, vars)}</p>
          ))}
        </section>
      ))}
      {products.length > 0 && (
        <section className="landing-products">
          <h2>Buy it here</h2>
          <div className="grid grid-3">
            {products.slice(0, 6).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
      {landing.faq.length > 0 && (
        <section id="faq">
          <h2>FAQ</h2>
          <Accordion items={landing.faq.map((f, i) => ({ id: `${landing.slug}-faq-${i}`, q: f.q, a: renderRich(f.a, vars) }))} />
        </section>
      )}
      <Callout>
        <Icon name="shield" size={18} /> Not affiliated with {config.serverName}, Mojang or Microsoft. {config.serverName}&apos;s rules prohibit real-money trading – buying is your own decision. <Link to="/donutsmp-irl-trade">Read how we keep it safe.</Link>
      </Callout>
    </ContentPage>
  );
}
