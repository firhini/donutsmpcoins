import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { Icon } from '../../components/ui/Icons';
import { ContentPage, Callout } from '../../components/shop/ContentPage';
import { Accordion } from '../../components/shop/Accordion';
import '../../styles/shop.css';

const TOC = [
  { id: 'what', label: 'What IRL trading is' },
  { id: 'going-first', label: 'The "going first" problem' },
  { id: 'store', label: 'How a stocked store fixes it' },
  { id: 'scams', label: 'How to spot a scam' },
  { id: 'rules', label: 'Server rules & your risk' },
  { id: 'payments', label: 'Payment methods' },
  { id: 'faq', label: 'FAQ' },
];

export default function IrlTradeLanding() {
  const { config } = useStore();
  const server = config.serverName;
  const store = config.storeName;
  const methods = config.paymentMethods;

  const faqItems = [
          {
            id: 'irl-faq-middleman',
            q: 'Do you use a middleman?',
            a: <p>No – and you do not need one. The order record, the refund policy and our public review history are the guarantee. Middlemen add a fee and a second stranger to trust.</p>,
          },
          {
            id: 'irl-faq-first',
            q: 'Will you ever deliver first?',
            a: <p>No. Chargebacks make it impossible for a store to deliver before payment. We keep the first step small instead: order a few million, see it land, then scale up.</p>,
          },
          {
            id: 'irl-faq-ban',
            q: 'What happens if I get banned?',
            a: <p>A ban is between you and the server; we cannot refund a delivered order because of a later punishment. That is why we are upfront about the rules here and on every order.</p>,
          },
        ];

  return (
    <ContentPage
      faq={faqItems}
      eyebrow="Guide"
      title={`${server} IRL trading: how it works and how not to get scammed`}
      seoTitle={`${server} IRL Trading Guide – Safe Real-Money Trades · ${store}`}
      description={`What IRL trading on ${server} is, why "going first" gets people scammed, how a stocked store removes that risk, red flags to watch for, and what the server rules say.`}
      lead={`Real-money trading on ${server} is everywhere – in Discord DMs, on marketplaces, in chat. Most of it works. Some of it is a scam. Here is how to tell the difference, written by people who sell for a living.`}
      crumbs={[{ label: 'IRL trading guide' }]}
      toc={TOC}
    >
      <h2 id="what">What IRL trading is</h2>
      <p>
        “IRL trading” (also called RMT, real-money trading) means swapping in-game things – money, spawners, items, bases – for real currency: PayPal, crypto, gift cards. On {server}{' '}
        it grew out of the player economy: some players run giant farms and have more money than they can spend, others have jobs and no time to grind. Put the two together and you
        get a market.
      </p>
      <p>
        There are three places it happens. Player-to-player deals in Discord servers and DMs; middleman services where a third party holds the goods; and stores like {store} that
        keep stock and sell at a listed price. The first is the cheapest and the riskiest. The last is the one this page is about.
      </p>

      <h2 id="going-first">The “going first” problem</h2>
      <p>
        Every person-to-person trade has the same awkward moment: somebody has to go first. If the buyer pays first, the seller can vanish. If the seller delivers first, the buyer can
        refuse to pay or charge back. Reputation is supposed to solve this – vouches, screenshots, “trusted seller” roles – but all of it can be faked in an afternoon, and the
        people who scam are precisely the ones who invest in looking trustworthy.
      </p>
      <p>
        Middlemen help, until the middleman is in on it or simply disappears with both sides' goods. Splitting the trade into small chunks helps, until the last chunk. There is no
        clever trick that makes a one-off trade between strangers safe; there is only trust, and trust between strangers is thin.
      </p>

      <h2 id="store">How a stocked store removes the risk</h2>
      <p>A store changes the math in a few concrete ways:</p>
      <ul>
        <li>
          <strong>The goods already exist.</strong> We hold stock. Stock levels on this site are live – when a spawner shows “12 left”, there are twelve in a shulker waiting. We are
          not promising to go farm it after you pay.
        </li>
        <li>
          <strong>Every order has a record.</strong> You get an order ID, a timeline, the payment reference you submitted and the delivery confirmation. Disputes are not “he said, she
          said”; they are a page you can show anyone.
        </li>
        <li>
          <strong>Reputation is tied to this domain, not a Discord tag.</strong> Reviews here can only be written by people whose order was delivered. A scammer can change their
          Discord name in a second; a store cannot change its history.
        </li>
        <li>
          <strong>Incentives line up.</strong> A seller who makes a living from repeat customers loses far more from one scam than they gain. A random trader with 40 members in
          their server loses nothing.
        </li>
        <li>
          <strong>There is a refund policy.</strong> If we fail to deliver, you get your money back – it is written down at <Link to="/refund-policy">/refund-policy</Link>, not
          promised in a DM.
        </li>
      </ul>
      <p>
        You still go first in the sense that you pay before delivery. The difference is who you are paying first to, and what you can do if it goes wrong. If you are nervous, make a
        small first order – a few million, a couple of spawners – and judge us on it.
      </p>

      <h2 id="scams">How to spot a scam</h2>
      <p>These are the patterns we see over and over. One of them is a yellow flag; two or three together mean walk away.</p>
      <div className="prose-grid">
        <div className="card">
          <h3>
            <Icon name="warning" size={16} /> Too cheap
          </h3>
          <p>Money at a fraction of market rate exists only in screenshots. A seller who undercuts everyone by 60% is not selling – they are collecting payments.</p>
        </div>
        <div className="card">
          <h3>
            <Icon name="warning" size={16} /> “Send to this new address”
          </h3>
          <p>A legitimate seller's PayPal or wallet does not change mid-trade. Someone who switches payment details after you agreed is often an impersonator who hijacked a conversation.</p>
        </div>
        <div className="card">
          <h3>
            <Icon name="warning" size={16} /> Pressure
          </h3>
          <p>“Price goes up in 10 minutes”, “last one”, “my friend wants it” – urgency is a sales tactic for honest people and a weapon for scammers. Real stock will still be there tomorrow.</p>
        </div>
        <div className="card">
          <h3>
            <Icon name="warning" size={16} /> Vouch spam
          </h3>
          <p>Dozens of identical “legit!!” messages from day-old accounts are not vouches. Look for detailed reviews over time, tied to actual orders.</p>
        </div>
        <div className="card">
          <h3>
            <Icon name="warning" size={16} /> Asking for your account
          </h3>
          <p>Nobody needs your password, your session, your e-mail or a login link to deliver anything. Delivery is /pay and a teleport. Anyone asking for more is after the account, not the trade.</p>
        </div>
        <div className="card">
          <h3>
            <Icon name="warning" size={16} /> No way to track
          </h3>
          <p>If the only proof of your purchase is a DM, you have no purchase. Insist on a written order with an ID, a price and a delivery promise – and keep it.</p>
        </div>
      </div>
      <p>
        One more: if someone claiming to be {store} contacts you first, it is not us. We do not DM people, we do not advertise in-game and we never ask you to pay anywhere except
        the methods listed on your order page.
      </p>

      <h2 id="rules">Server rules and your risk</h2>
      <Callout tone="warn" title="Read this before you buy anywhere">
        {server}'s rules prohibit trading in-game items or money for real-world value. Enforcement – warnings, balance resets, bans – is entirely the server's decision and can change
        without notice. Buying from {store} or anyone else is at your own risk and your own responsibility. We are not affiliated with {server}, Mojang or Microsoft.
      </Callout>
      <p>
        What we do to keep the risk low: we deliver with ordinary player actions (/pay, teleports, item drops), we spread deliveries across accounts and times, we never mention
        money or this site in game chat, and we ask you not to either. What we cannot do is promise a server will never act – nobody can, and anyone who does is lying.
      </p>

      <h2 id="payments">Payment methods</h2>
      <p>
        We accept the methods below (the exact list at checkout depends on what is switched on right now). Each has a trade-off between speed, fees and reversibility, which is why
        we handle them differently:
      </p>
      <ul>
        {methods.length ? (
          methods.map((m) => (
            <li key={m.id}>
              <strong>{m.name}</strong>
              {m.description ? ` – ${m.description}` : ''}
              {m.feePercent ? ` (+${m.feePercent}% fee)` : ''}
            </li>
          ))
        ) : (
          <>
            <li>
              <strong>PayPal (Friends &amp; Family)</strong> – fast, no fees, confirmed manually within minutes.
            </li>
            <li>
              <strong>Crypto (Litecoin and others)</strong> – lowest fees, confirmed after one network confirmation.
            </li>
            <li>
              <strong>Card / Apple Pay / Google Pay</strong> – through Stripe, when enabled; confirmed automatically.
            </li>
            <li>
              <strong>Gift cards</strong> – on request via Discord, with a small surcharge.
            </li>
          </>
        )}
      </ul>
      <p>
        Whatever you pick, pay <em>only</em> the details shown on your order page, put the order ID in the note where the method allows it, and submit the reference afterwards. That is
        the whole process – no DMs required.
      </p>

      <h2 id="faq">Quick answers</h2>
      <Accordion
        items={faqItems}
      />
      <div className="prose-cta">
        <Link to="/shop" className="btn btn-primary btn-lg">
          <Icon name="cart" size={18} /> Browse the store
        </Link>
        <Link to="/faq" className="btn btn-secondary btn-lg">
          Full FAQ
        </Link>
      </div>
    </ContentPage>
  );
}
