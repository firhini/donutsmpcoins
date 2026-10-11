import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { ContentPage } from '../../components/shop/ContentPage';

const TOC = [
  { id: 'what', label: 'What we store' },
  { id: 'why', label: 'Why we store it' },
  { id: 'third-parties', label: 'Third parties' },
  { id: 'cookies', label: 'Cookies & local storage' },
  { id: 'retention', label: 'Retention' },
  { id: 'rights', label: 'Your rights' },
  { id: 'contact', label: 'Contact' },
];

export default function Privacy() {
  const { config } = useStore();
  const store = config.storeName;
  return (
    <ContentPage
      eyebrow="Legal"
      title="Privacy Policy"
      description={`What ${store} stores about you (username, order, optional e-mail, hashed IP, device id), why, who else sees it, and how to get it deleted.`}
      lead="We store as little as a store can get away with. This page lists all of it."
      crumbs={[{ label: 'Privacy Policy' }]}
      toc={TOC}
      updated="October 2026"
    >
      <h2 id="what">What we store</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>When</th>
              <th>Why</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Minecraft username (and the public UUID Mojang returns for it)</td>
              <td>Orders, spins, giveaway entries, reviews, referrals</td>
              <td>To deliver to the right account and to tie coupons, credit and rewards to you</td>
            </tr>
            <tr>
              <td>Order details: items, prices, status, timeline, payment method, the payment reference you submit (transaction id or PayPal e-mail), your optional order note</td>
              <td>Every order</td>
              <td>To fulfil the order, confirm payment and handle disputes</td>
            </tr>
            <tr>
              <td>E-mail address</td>
              <td>Only if you enter one at checkout</td>
              <td>To contact you about that order. Shown masked on the public order page</td>
            </tr>
            <tr>
              <td>Hashed IP address (one-way hash with a secret salt – we cannot reverse it)</td>
              <td>Orders, spins, giveaway entries, rate-limited requests</td>
              <td>Spin cooldowns, one-entry-per-person giveaways, and stopping abuse of the API</td>
            </tr>
            <tr>
              <td>Random device id (a random string stored in your browser)</td>
              <td>Spins and giveaway entries</td>
              <td>Spin cooldowns per browser; it identifies the browser, not you</td>
            </tr>
            <tr>
              <td>Review text and rating</td>
              <td>If you leave a review</td>
              <td>Shown publicly with your username after approval</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        We do not store payment card numbers, PayPal passwords, wallet keys or your Minecraft password – we never ask for them. We do not run analytics trackers or advertising pixels on
        this site.
      </p>

      <h2 id="why">Why we store it</h2>
      <p>
        To fulfil your order and keep a record of it (contract), to prevent fraud and abuse of free promotions (legitimate interest), and to show reviews you chose to publish (consent).
        That is the complete list of purposes. We do not build profiles, we do not sell or rent data, and we do not send marketing e-mails.
      </p>

      <h2 id="third-parties">Third parties that see some of it</h2>
      <ul>
        <li>
          <strong>Netlify</strong> hosts the site, the API and the database (Netlify Blobs). Their servers process requests, including your IP address, under their own privacy policy.
        </li>
        <li>
          <strong>Discord.</strong> New orders, payment reports and spin wins trigger a notification to our private staff channel via a webhook. It contains the order id, username,
          items and total – not your e-mail or IP.
        </li>
        <li>
          <strong>Payment providers.</strong> PayPal, Stripe, NOWPayments or the crypto network you use see the payment itself under their own policies. Where a provider is integrated
          we pass them the order id and amount; we receive back a payment status and reference.
        </li>
        <li>
          <strong>Mojang API.</strong> We look up usernames to validate them; the request contains only the name.
        </li>
        <li>
          <strong>mc-heads.net.</strong> Review cards and some pages load avatar images for usernames from this service; your browser requests the image directly.
        </li>
        <li>
          <strong>Google Fonts.</strong> Fonts are loaded from Google's servers, which see your IP address when the page loads.
        </li>
      </ul>

      <h2 id="cookies">Cookies and local storage</h2>
      <p>
        We do not set tracking cookies. The site keeps a few things in your browser's local storage so it works smoothly: your cart, your chosen currency, a referral or discount code you
        entered, the random device id mentioned above, and – only if you are staff – an admin session token. You can clear all of it through your browser settings at any time; the only
        effect is an empty cart and a new device id.
      </p>

      <h2 id="retention">Retention</h2>
      <p>
        Orders are kept for as long as we need them to handle disputes and chargebacks, typically 12 months after delivery, then reduced to anonymous totals. Spin and giveaway records
        are kept for the duration of the cooldown or giveaway plus a short buffer. Reviews stay published until you ask us to remove them.
      </p>

      <h2 id="rights">Your rights</h2>
      <p>
        You can ask us what we store about a username, ask for it to be corrected or deleted, and withdraw consent for a published review. We will do it unless we are legally required to
        keep a record (for example an order under an open payment dispute). Depending on where you live you may also have the right to complain to a data-protection authority.
      </p>

      <h2 id="contact">Contact</h2>
      <p>
        Privacy requests go to our{' '}
        <a href={config.discordInvite} target="_blank" rel="noreferrer">
          Discord
        </a>
        {config.supportEmail ? (
          <>
            {' '}
            or <a href={`mailto:${config.supportEmail}`}>{config.supportEmail}</a>
          </>
        ) : null}
        . Please include the username or order id the request is about.
      </p>
      <p className="small muted">
        See also: <Link to="/terms">Terms of Service</Link> · <Link to="/refund-policy">Refund Policy</Link>
      </p>
    </ContentPage>
  );
}
