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

  return (
    <ContentPage
      eyebrow={`${server} spawners`}
      title={`${server} spawners – skeletons, golems, blazes and more`}
      seoTitle={`Buy ${server} Spawners – Skeleton Spawners from ${fmt(cheapest)} · ${config.storeName}`}
      description={`Skeleton, iron golem, zombie, creeper and blaze spawners for ${server} with live stock and bulk prices. Handed over in-game by our staff.`}
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
        Spawners are the engine of a {server} base. A room full of skeleton spawners prints bones, arrows and XP while you are away; iron golems turn into iron blocks; blazes feed your
        brewing stand and your sell chest. Mining them yourself with silk touch is slow and risky, and the in-game auction house is expensive and empty when you need it – which is
        exactly why we stock them.
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
        Most people buy skeleton spawners, and for good reason: a skeleton farm needs nothing but a dark room, a water stream and a kill chamber. Bones become bone meal for your crop
        farms, arrows sell, and the XP is enough to keep a mending set alive forever. They are the cheapest spawner we sell and they come with the deepest bulk tiers because we move so
        many.
      </p>
      <div className="prose-grid">
        <div className="card">
          <h3>
            <Icon name="flame" size={16} /> Iron golem
          </h3>
          <p>Iron is the universal currency for tools, anvils, hoppers and rails. A golem room pays for itself quickly, but each spawner costs more and needs a proper kill setup (lava blade or trapdoor crusher).</p>
        </div>
        <div className="card">
          <h3>
            <Icon name="flame" size={16} /> Blaze
          </h3>
          <p>Top-tier XP and blaze rods for potions and fuel. Place them in a nether-proof room with a decent sword – blazes hit back and set things on fire.</p>
        </div>
        <div className="card">
          <h3>
            <Icon name="flame" size={16} /> Zombie
          </h3>
          <p>The budget option: rotten flesh for cleric trades, iron and carrot drops, and XP comparable to skeletons. Great for a first farm.</p>
        </div>
        <div className="card">
          <h3>
            <Icon name="flame" size={16} /> Creeper
          </h3>
          <p>Gunpowder for firework rockets – essential once you own an Elytra. Needs a cat-free, trapdoor-roofed room so creepers spawn and skeletons do not.</p>
        </div>
      </div>

      <h2 id="how-many">How many do you need?</h2>
      <p>
        A single spawner is a nice start; a farm begins at around a dozen. Spawner caps and mob caps vary, but on most setups 16–32 skeleton spawners in one room saturate the kill
        chamber. Beyond 64 you get more from building a second room elsewhere than from stacking. If you are planning a serious farm, check the bundles – they combine spawners with
        the money you need to claim and build the room:
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
        Do not accept deliveries at spawn or in a crowded area – other players can steal dropped items. Your base or a quiet chunk is best. We can also place items directly into a chest at your coordinates if you prefer.
      </Callout>

      <h2 id="faq">Spawner FAQ</h2>
      <Accordion
        items={[
          {
            id: 'sp-faq-silk',
            q: 'Can I move spawners after delivery?',
            a: <p>Yes – they are normal spawner items. Place them, and pick them up again with a silk-touch pickaxe if the server allows it (it does on {server}).</p>,
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
        ]}
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
      return 'XP, bones, arrows – the all-rounder';
    case 'iron-golem-spawner':
      return 'Iron for everything';
    case 'zombie-spawner':
      return 'Cheap XP, villager trades';
    case 'creeper-spawner':
      return 'Gunpowder for rockets';
    case 'blaze-spawner':
      return 'Best XP, blaze rods';
    default:
      return 'Farms';
  }
}
