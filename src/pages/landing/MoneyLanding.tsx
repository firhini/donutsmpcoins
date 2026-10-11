import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { formatMillions } from '../../shared/pricing';
import { useStore } from '../../context/StoreContext';
import { Icon } from '../../components/ui/Icons';
import { ContentPage, Callout } from '../../components/shop/ContentPage';
import { ProductImage } from '../../components/shop/ProductImage';
import { MoneyCalculator } from '../../components/shop/MoneyCalculator';
import { Accordion } from '../../components/shop/Accordion';
import { bulkTable } from '../../components/shop/productUtils';
import '../../styles/shop.css';

const TOC = [
  { id: 'prices', label: 'Live prices' },
  { id: 'bulk', label: 'Bulk tiers' },
  { id: 'calculator', label: 'Calculator' },
  { id: 'delivery', label: 'How delivery works' },
  { id: 'why-prices-move', label: 'Why prices move' },
  { id: 'faq', label: 'FAQ' },
];

export default function MoneyLanding() {
  const { config, products, fmt } = useStore();
  const server = config.serverName;
  const money = useMemo(() => products.filter((p) => p.kind === 'money').sort((a, b) => (a.moneyMillions ?? 0) - (b.moneyMillions ?? 0)), [products]);
  const unit = money.find((p) => p.id === 'money-1m') ?? money.find((p) => p.moneyMillions === 1);
  const packs = money.filter((p) => p !== unit);
  const tiers = unit ? bulkTable(unit) : [];
  const bestRate = tiers.length ? Math.min(...tiers.map((t) => t.priceCents)) : unit?.priceCents ?? 0;
  const enabledMethods = config.paymentMethods.map((m) => m.name);

  const faqItems = [
          {
            id: 'money-faq-min',
            q: 'Is there a minimum amount?',
            a: <p>One million. There is no practical maximum – the store caps a single line at {unit ? formatMillions(unit.maxQty ?? 5000) : '5B'}, but you can order several lines or message us for a custom quote.</p>,
          },
          {
            id: 'money-faq-offline',
            q: 'Do I have to be online?',
            a: <p>Not necessarily – on most setups a /pay goes through to an offline balance. We still recommend being online so you can watch the chat confirmation and leave a review right away.</p>,
          },
          {
            id: 'money-faq-split',
            q: 'Can I split a big order over several days?',
            a: <p>Yes. Mention it in the order note or on Discord and we will deliver in portions on a schedule you choose. The price is locked at checkout.</p>,
          },
          {
            id: 'money-faq-alt',
            q: 'Can you pay an alt instead of my main?',
            a: <p>Only the username on the order receives the money. Put the alt's name on the order if that is where you want it; we cannot redirect after delivery.</p>,
          },
        ];

  return (
    <ContentPage
      faq={faqItems}
      eyebrow={`${server} money`}
      title={`Buy ${server} money – paid straight to your balance`}
      seoTitle={`Buy ${server} Money – Live Prices from ${fmt(bestRate)} per 1M · ${config.storeName}`}
      description={`${server} money from ${fmt(bestRate)} per million with bulk discounts. Delivered to your in-game balance with /pay by real staff, usually within minutes.`}
      lead={`In-game cash for ${server}, from ${fmt(bestRate)} per million at the top bulk tier. Pick any amount, pay the way you like, and our staff send it to your balance with /pay.`}
      crumbs={[{ label: `${server} money` }]}
      toc={TOC}
      aside={
        unit && (
          <div className="card pad">
            <div className="row" style={{ gap: 12 }}>
              <ProductImage product={unit} size="sm" />
              <div>
                <strong>Any amount</strong>
                <div className="small muted">
                  from {fmt(bestRate)} per 1M
                </div>
              </div>
            </div>
            <Link to={`/product/${unit.slug}`} className="btn btn-primary btn-block" style={{ marginTop: 14 }}>
              <Icon name="coin" size={16} /> Buy money
            </Link>
          </div>
        )
      }
    >
      <p>
        Money is the thing that gets you going on {server}: spawners, claims, shop slots, repairs, the occasional ransom. Grinding it takes days; buying it takes minutes. This page shows
        the exact rates we charge right now, how the bulk tiers work and what happens after you pay – no marketing fog, just the numbers.
      </p>

      <h2 id="prices">Live prices</h2>
      <p>
        Everything below is read from our live catalog, so what you see here is what you pay at checkout (before any coupon, spin reward or spending-tier discount – those come on top).
        Prices are in USD; the currency switcher in the header shows an estimate in your currency.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Pack</th>
              <th className="num">Amount</th>
              <th className="num">Price</th>
              <th className="num">Per 1M</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {unit && (
              <tr className="hl">
                <td>
                  <span className="row-product">
                    <ProductImage product={unit} size="xs" glow={false} />
                    <Link to={`/product/${unit.slug}`}>{unit.name}</Link>
                  </span>
                </td>
                <td className="num">any, 1M – {formatMillions(unit.maxQty ?? 5000)}</td>
                <td className="num">
                  {fmt(bestRate)} – {fmt(unit.priceCents)}
                </td>
                <td className="num">from {fmt(bestRate)}</td>
                <td className="num">
                  <Link to={`/product/${unit.slug}`} className="btn btn-primary btn-sm">
                    Choose
                  </Link>
                </td>
              </tr>
            )}
            {packs.map((p) => {
              const per = p.moneyMillions ? Math.round(p.priceCents / p.moneyMillions) : p.priceCents;
              return (
                <tr key={p.id}>
                  <td>
                    <span className="row-product">
                      <ProductImage product={p} size="xs" glow={false} />
                      <Link to={`/product/${p.slug}`}>{p.name}</Link>
                    </span>
                  </td>
                  <td className="num">{formatMillions(p.moneyMillions ?? 0)}</td>
                  <td className="num">
                    {fmt(p.priceCents)}
                    {p.compareAtCents && p.compareAtCents > p.priceCents ? <span className="was">was {fmt(p.compareAtCents)}</span> : null}
                  </td>
                  <td className="num">{fmt(per)}</td>
                  <td className="num">
                    <Link to={`/product/${p.slug}`} className="btn btn-secondary btn-sm">
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p>
        Fixed packs are convenient when you know what you want; the <strong>pick-your-amount</strong> option is the better deal for odd amounts because the bulk tiers apply to every single
        million above the threshold, not just to round packs.
      </p>

      <h2 id="bulk">Bulk tiers</h2>
      <p>
        The rate per million drops automatically as the quantity grows. There is no code to enter and no need to ask – the price in your cart already reflects the tier you reached.
      </p>
      {unit && tiers.length > 1 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order size</th>
                <th className="num">Per 1M</th>
                <th className="num">Example</th>
                <th className="num">You save</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((t) => (
                <tr key={t.minQty}>
                  <td>{formatMillions(t.minQty)}+</td>
                  <td className="num">{fmt(t.priceCents)}</td>
                  <td className="num">
                    {formatMillions(t.minQty)} = {fmt(t.priceCents * t.minQty)}
                  </td>
                  <td className="num">{t.savePercent > 0 ? `${t.savePercent}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p>
        On top of the bulk tiers, every cart above the spending thresholds gets an extra percentage off at checkout (
        {[...config.spendingTiers]
          .sort((a, b) => a.minCents - b.minCents)
          .map((t) => `${t.percent}% from ${fmt(t.minCents)}`)
          .join(', ')}
        ). Coupons from the <Link to="/spin">daily spin</Link>, referral credit and the welcome code stack with that – only one coupon per order.
      </p>

      <h2 id="calculator">Calculator</h2>
      <p>Drag the slider or type an amount to see the exact total, the rate you are getting and how far you are from the next tier.</p>
      <div style={{ margin: '0 0 32px' }}>
        <MoneyCalculator initial={100} title="Price calculator" />
      </div>

      <h2 id="delivery">How delivery works</h2>
      <p>{config.delivery.moneyText}</p>
      <ol>
        <li>Add money to the cart and check out with your exact Minecraft username. We validate it against Mojang so typos are caught before you pay.</li>
        <li>Pay with {enabledMethods.length ? enabledMethods.slice(0, 4).join(', ') : 'PayPal, crypto or card'} and report the payment reference on your order page.</li>
        <li>
          A member of our staff logs in and runs <code className="kbd">/pay</code> to your username. You see the server's own confirmation in chat and the order page switches to
          “delivered”.
        </li>
      </ol>
      <p>
        {config.delivery.etaText} Very large amounts may be split into several payments to keep things discreet; the order page lists every step. Money orders do not need you to meet
        anyone or accept a teleport.
      </p>
      <Callout tone="info" title="Honest note on risk">
        {server}'s rules prohibit buying in-game money for real currency. We deliver with normal player actions and keep it low-key, but enforcement is the server's decision and buying is
        your own responsibility. Read our <Link to="/donutsmp-irl-trade">guide to IRL trading</Link> before your first order.
      </Callout>

      <h2 id="why-prices-move">Why prices move</h2>
      <p>
        {server} money is not minted by us – it is earned, traded and stockpiled by players, and its real-world price follows the in-game economy. A few things push it around:
      </p>
      <ul>
        <li>
          <strong>Supply from farms.</strong> When spawner farms get cheaper or the server buffs sell prices, money floods in and the real-world rate drops. Nerfs do the opposite.
        </li>
        <li>
          <strong>Resets and new seasons.</strong> Right after a reset everyone wants a head start and nobody has cash, so rates spike for a few days.
        </li>
        <li>
          <strong>Our own stock.</strong> We keep a reserve so orders ship immediately. If a big order drains it, the price can tick up until the reserve is rebuilt.
        </li>
        <li>
          <strong>Competition.</strong> We watch what other sellers charge and aim to stay below them while still paying our staff. If you find a cheaper trustworthy rate, tell us on
          Discord.
        </li>
      </ul>
      <p>
        The price you lock in at checkout is final – later moves do not affect a paid order. Store credit and coupons keep their value in dollars, so a 5% coupon is worth exactly as much
        whatever the rate does.
      </p>

      <h2 id="faq">Money FAQ</h2>
      <Accordion
        items={faqItems}
      />
      <div className="prose-cta">
        {unit && (
          <Link to={`/product/${unit.slug}`} className="btn btn-primary btn-lg">
            <Icon name="coin" size={18} /> Buy {server} money
          </Link>
        )}
        <Link to="/shop/money" className="btn btn-secondary btn-lg">
          All money packs
        </Link>
      </div>
    </ContentPage>
  );
}
