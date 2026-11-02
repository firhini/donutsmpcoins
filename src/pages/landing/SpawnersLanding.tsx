import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { Icon } from '../../components/ui/Icons';
import { ContentPage, Callout } from '../../components/shop/ContentPage';
import { ProductImage } from '../../components/shop/ProductImage';
import { ProductGrid } from '../../components/shop/ProductGrid';
import { Accordion } from '../../components/shop/Accordion';
import { lowestBulkTier, stockState } from '../../components/shop/productUtils';
import '../../styles/shop.css';

const TOC = [
  { id: 'prices', label: 'Prices & stock' },
  { id: 'skellies', label: 'Skeletons vs the rest' },
  { id: 'how-many', label: 'How many do you need?' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'faq', label: 'FAQ' },
];

export default function SpawnersLanding() {
  const { config, products, fmt } = useStore();
  const server = config.serverName;
  const spawners = useMemo(() => products.filter((p) => p.categoryId === 'spawners' && /spawner/i.test(p.name)).sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99)), [products]);
  const crates = useMemo(() => products.filter((p) => p.kind === 'box' && (p.contents ?? []).some((c) => /spawner/i.test(c.name))), [products]);
  const bundles = useMemo(() => products.filter((p) => p.kind === 'bundle' && (p.bundleItems ?? []).some((b) => /spawner/i.test(b.productId))), [products]);
  const skelly = spawners.find((p) => p.id === 'skeleton-spawner');
  const cheapest = spawners.length ? Math.min(...spawners.map((p) => lowestBulkTier(p)?.priceCents ?? p.priceCents)) : 0;

  const faqItems = [
          {
            id: 'sp-faq-silk',
            q: 'Can I move spawners after delivery?',
            a: <p>We cannot promise it. How – and whether – placed spawners can be picked back up on {server} is not clearly documented, and reports differ on whether a pickaxe enchantment is needed or stored drops are lost when one is broken. Pick the spot before you place them, and ask on Discord if you need the current details.</p>,
          },
          {
            id: 'sp-faq-stock',
            q: 'What if a spawner is sold out?',
            a: <p>We restock weekly. Click the product to see the current count, or ask on Discord – we can often source a specific type within a day.</p>,
          },
          {
            id: 'sp-faq-bulk',
            q: 'Do the bulk tiers combine across types?',
            a: <p>Tiers apply per product line. Sixteen skeleton spawners and sixteen zombie spawners are two lines – but the total still counts toward the spending-tier discount on the whole cart.</p>,
          },
          {
            id: 'sp-faq-safe',
            q: 'Is buying spawners allowed?',
            a: (
              <p>
                Trading for real money is against {server}'s rules and is your own responsibility; we deliver through normal gameplay actions and keep it discreet. More in the{' '}
                <Link to="/donutsmp-irl-trade">IRL trading guide</Link>.
              </p>
            ),
          },
        ];

  return (
    <ContentPage
      faq={faqItems}
      eyebrow={`${server} spawners`}
      title={`${server} spawners – skeletons, golems, blazes and more`}
      seoTitle={`${server} Spawner Buying Guide – Types & Prices | ${config.storeName}`}
      description={`Skeleton, iron golem, zombie, creeper and blaze spawners for ${server} with stock status and bulk prices. Handed over in-game by our staff.`}
      lead={`Live prices and stock for every spawner we sell, from ${fmt(cheapest)} each in bulk. Handed over in-game by our staff, usually within minutes.`}
      crumbs={[{ label: `${server} spawners` }]}
      toc={TOC}
      aside={
        skelly && (
          <div className="card pad">
            <div className="row" style={{ gap: 12 }}>
              <ProductImage product={skelly} size="sm" />
              <div>
                <strong>{skelly.name}</strong>
                <div className="small muted">
                  {fmt(skelly.priceCents)} each · from {fmt(lowestBulkTier(skelly)?.priceCents ?? skelly.priceCents)} in bulk
                </div>
              </div>
            </div>
            <Link to={`/product/${skelly.slug}`} className="btn btn-primary btn-block" style={{ marginTop: 14 }}>
              <Icon name="cart" size={16} /> Buy skellies
            </Link>
          </div>
        )
      }
    >
      <p>
        Spawners are the engine of a {server} base. They work differently from vanilla: a {server} spawner never spawns mobs – it fills its own storage with drops, which you open
        like a chest, and Shift + right-click stacks more spawners of the same type into one block. Skeleton spawners give bones and arrows, iron golems iron ingots, blazes blaze
        powder for your brewing stand. Since the June 2026 update the server no longer sells spawners at all, so every one changes hands between players – and finding a seller with
        enough stock when you need it is exactly why we keep them in stock.
      </p>

      <h2 id="prices">Prices &amp; stock</h2>
      <p>This table is live. “In stock” means we have them in a shulker ready to hand over; a number means we are down to the last few.</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Spawner</th>
              <th>Best for</th>
              <th className="num">Price</th>
              <th className="num">Bulk</th>
              <th>Stock</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {spawners.map((p) => {
              const bulk = lowestBulkTier(p);
              const st = stockState(p);
              return (
                <tr key={p.id} className={p.id === 'skeleton-spawner' ? 'hl' : ''}>
                  <td>
                    <span className="row-product">
                      <ProductImage product={p} size="xs" glow={false} />
                      <Link to={`/product/${p.slug}`}>{p.name}</Link>
                    </span>
                  </td>
                  <td>{useCase(p.id)}</td>
                  <td className="num">{fmt(p.priceCents)}</td>
                  <td className="num">{bulk && bulk.priceCents < p.priceCents ? `${fmt(bulk.priceCents)} at ${bulk.minQty}+` : '—'}</td>
                  <td>
                    <span className={st.className}>
                      <i aria-hidden="true" /> {st.label}
                    </span>
                  </td>
                  <td className="num">
                    <Link to={`/product/${p.slug}`} className={`btn btn-sm ${st.soldOut ? 'btn-secondary' : 'btn-primary'}`}>
                      {st.soldOut ? 'Notify' : 'Buy'}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 id="skellies">Skeletons vs the rest</h2>
      <p>
        Most people buy skeleton spawners, and for good reason: there is nothing to build around them – no dark room, no water stream, no kill chamber. Bones and arrows collect
        inside the spawner, bones are in steady demand on buy orders and become bone meal for your crop farms, and arrows sell. They come with the deepest bulk tiers in our shop
        because we move so many.
      </p>
      <div className="prose-grid">
        <div className="card">
          <h3>
            <Icon name="flame" size={16} /> Iron golem
          </h3>
          <p>Iron is the universal currency for tools, anvils, hoppers and rails. The spawner fills up with iron ingots on its own – no golems to kill – but each one costs more than a skelly.</p>
        </div>
        <div className="card">
          <h3>
            <Icon name="flame" size={16} /> Blaze
          </h3>
          <p>Blaze powder – not rods – for brewing potions. No blazes spawn, so there is no fire-proof kill room to build; just open the spawner and collect.</p>
        </div>
        <div className="card">
          <h3>
            <Icon name="flame" size={16} /> Zombie
          </h3>
          <p>The budget option: rotten flesh for cleric villager trades at the lowest price per spawner in our shop. Fine for a first spawner, but it earns less than a skelly.</p>
        </div>
        <div className="card">
          <h3>
            <Icon name="flame" size={16} /> Creeper
          </h3>
          <p>Gunpowder for firework rockets – essential once you own an Elytra. Nothing explodes: the gunpowder simply collects inside the spawner.</p>
        </div>
      </div>

      <h2 id="how-many">How many do you need?</h2>
      <p>
        A single spawner is a nice start; a farm begins at around a dozen. Output per spawner shrinks as one stack grows, so several separate stacks in different blocks produce more
        than one giant stack – spread big orders out. There are no land claims on {server}, so hide the room well. If you are planning a serious farm, check the bundles – they
        combine spawners with money for building and gear:
      </p>
      {bundles.length > 0 && <ProductGrid products={bundles} columns={2} compact />}
      {crates.length > 0 && (
        <>
          <p style={{ marginTop: 24 }}>
            Prefer a gamble? Some mystery boxes roll spawners with a chance at rare types for far less than the fixed price. Every box shows its exact odds before you buy:
          </p>
          <ProductGrid products={crates} columns={2} compact />
        </>
      )}

      <h2 id="delivery">Delivery</h2>
      <p>{config.delivery.itemText}</p>
      <ol>
        <li>Check out with your exact username and pay. Report the payment reference on your order page – that pings our staff on Discord.</li>
        <li>Be online on {server}, in a safe place with inventory space. Large orders are handed over in shulker boxes so one slot is enough.</li>
        <li>Accept the teleport request from our delivery account, pick up the drop, and confirm in chat. The order page updates to “delivered”.</li>
      </ol>
      <p>{config.delivery.etaText}</p>
      <Callout tone="warn" title="Keep the drop safe">
        Do not accept deliveries in a crowded area – other players can steal dropped items. Your base or a quiet chunk is best. We can also place items directly into a chest at your coordinates if you prefer.
      </Callout>

      <h2 id="faq">Spawner FAQ</h2>
      <Accordion
        items={faqItems}
      />
      <div className="prose-cta">
        <Link to="/shop/spawners" className="btn btn-primary btn-lg">
          <Icon name="cart" size={18} /> Shop spawners &amp; items
        </Link>
        <Link to="/shop/bundles" className="btn btn-secondary btn-lg">
          See bundles
        </Link>
      </div>
    </ContentPage>
  );
}

function useCase(id: string): string {
  switch (id) {
    case 'skeleton-spawner':
      return 'Bones & arrows – the all-rounder';
    case 'iron-golem-spawner':
      return 'Iron for everything';
    case 'cow-spawner':
      return 'Raw beef – high value';
    case 'zombie-spawner':
      return 'Rotten flesh, budget pick';
    case 'creeper-spawner':
      return 'Gunpowder for rockets';
    case 'blaze-spawner':
      return 'Blaze powder for brewing';
    default:
      return 'Farms';
  }
}
