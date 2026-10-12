import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { Icon } from '../../components/ui/Icons';
import { ContentPage, Callout } from '../../components/shop/ContentPage';

const TOC = [
  { id: 'summary', label: 'In short' },
  { id: 'refundable', label: 'What we refund' },
  { id: 'not-refundable', label: 'What we do not refund' },
  { id: 'credit', label: 'Store credit' },
  { id: 'how', label: 'How to request a refund' },
  { id: 'timing', label: 'Timing' },
];

export default function RefundPolicy() {
  const { config } = useStore();
  const store = config.storeName;
  const server = config.serverName;
  return (
    <ContentPage
      eyebrow="Legal"
      title="Refund Policy"
      description={`When ${store} refunds an order: non-delivery, duplicate charges and wrong items. Final after delivery, 7-day window, store credit for shortfalls.`}
      lead="We would rather fix a problem than argue about it. Here is exactly what we refund, what we do not, and how to ask."
      crumbs={[{ label: 'Refund Policy' }]}
      toc={TOC}
      updated="October 2026"
    >
      <h2 id="summary">In short</h2>
      <div className="legal-summary">
        <div className="card">
          <Icon name="check" size={18} />
          <div>
            <strong>Not delivered within 48 h?</strong>
            Full refund or cancel – your choice.
          </div>
        </div>
        <div className="card">
          <Icon name="check" size={18} />
          <div>
            <strong>Charged twice or got the wrong item?</strong>
            Refunded or corrected, always.
          </div>
        </div>
        <div className="card">
          <Icon name="close" size={18} />
          <div>
            <strong>Delivered as ordered?</strong>
            Final – digital goods cannot be returned.
          </div>
        </div>
      </div>

      <h2 id="refundable">What we refund</h2>
      <ul>
        <li>
          <strong>Non-delivery.</strong> If a paid order has not been delivered within <strong>48 hours</strong> of us confirming the payment, you can cancel it for a full refund – no
          questions asked. (Most orders are delivered within minutes; this is the safety net.)
        </li>
        <li>
          <strong>Duplicate charges.</strong> Paid twice for the same order, or paid for an order that was cancelled? We refund the extra payment in full, including any fee we can
          recover.
        </li>
        <li>
          <strong>Wrong item or wrong amount.</strong> If what you received differs from your order (wrong spawner type, fewer items, less money), we deliver the difference. If we cannot,
          we refund the affected part.
        </li>
        <li>
          <strong>Delivery impossible on our side.</strong> If we cannot deliver at all – for example because our delivery accounts are blocked – we refund the undelivered part in full.
        </li>
      </ul>

      <h2 id="not-refundable">What we do not refund</h2>
      <ul>
        <li>
          <strong>Delivered orders.</strong> Once the goods are on your account, the order is final. Virtual items cannot be “returned”, and we cannot verify what happened to them
          afterwards.
        </li>
        <li>
          <strong>Wrong username.</strong> Goods delivered to the username you entered are considered delivered to you. Double-check the spelling at checkout – we validate names
          against Mojang, but we cannot know which of two valid names you meant.
        </li>
        <li>
          <strong>Server actions.</strong> Bans, balance resets, item wipes, rollbacks and rule changes on {server} are outside our control. Buying is against the server's rules and at
          your own risk, as stated on every product and in our <Link to="/terms">terms</Link>.
        </li>
        <li>
          <strong>Change of mind after delivery.</strong> You may cancel any order while it is still awaiting payment, at no cost. After delivery, not – at checkout you expressly asked
          us to start delivering this digital content right away and acknowledged that the statutory 14-day right of withdrawal ends once delivery has begun (see the{' '}
          <Link to="/terms#digital-goods">terms</Link>).
        </li>
        <li>
          <strong>Mystery box results.</strong> Boxes are random with published odds; getting a common drop is not a defect.
        </li>
        <li>
          <strong>Free orders.</strong> Spin prizes, giveaway wins and redeemed gift codes have no cash value and cannot be refunded or exchanged.
        </li>
      </ul>

      <h2 id="credit">Store credit</h2>
      <p>
        Where it makes sense we offer store credit instead of a refund – for example when a payment came in slightly short, when you overpaid, or when an item is sold out and you would
        rather wait. Credit is tied to your Minecraft username and is applied automatically at checkout. It never expires on its own but can be voided for abuse (see the terms).
      </p>
      <p>
        If you prefer a cash refund in a case where we refund, say so – we will not force credit on you. Refunds go back to the original payment method where technically possible;
        crypto refunds are sent to an address you provide, minus network fees.
      </p>

      <h2 id="how">How to request a refund</h2>
      <ol>
        <li>
          Open your order at <Link to="/track">/track</Link> and check the timeline – many questions (“is it on the way?”) are answered there.
        </li>
        <li>
          Open a ticket on our{' '}
          <a href={config.discordInvite} target="_blank" rel="noreferrer">
            Discord
          </a>{' '}
          with your order ID and what went wrong. Screenshots of chat help for delivery problems.
        </li>
        <li>We reply within 24 hours and resolve most cases on the spot.</li>
      </ol>
      <Callout tone="warn" title="Please do not open a chargeback first">
        A PayPal dispute or card chargeback on a delivered order is treated as fraud and blocks you from the store. Talk to us first – a genuine problem is fixed faster by a ticket than
        by a dispute, and we refund without arguing when the policy says we should.
      </Callout>

      <h2 id="timing">Timing</h2>
      <p>
        Refund requests must be made within <strong>7 days</strong> of the order date. Approved refunds are issued within 3 business days; depending on the payment provider it can take
        a few more days to show on your side. Store credit is instant.
      </p>
      <p className="small muted">
        See also: <Link to="/terms">Terms of Service</Link> · <Link to="/privacy">Privacy Policy</Link> · <Link to="/faq">FAQ</Link>
      </p>
    </ContentPage>
  );
}
