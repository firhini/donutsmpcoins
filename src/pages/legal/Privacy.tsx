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

// set at build time from GA_MEASUREMENT_ID – identical on server and client, so safe to render
const GA_ENABLED = Boolean(import.meta.env.VITE_GA_ID);

export default function Privacy() {
  const { config } = useStore();
  const store = config.storeName;
  return (
    <ContentPage
      eyebrow="Legal"
      title="Privacy Policy"
      description={`What ${store} stores about you (username, order, optional e-mail, hashed IP, device id, Discord login), why, who else sees it, and how to get it deleted.`}
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
            <tr>
              <td>Discord account: id, username, avatar, and – if we check it – whether you are a member of our Discord server</td>
              <td>Only if you log in with Discord (optional)</td>
              <td>To recognise you, apply the daily-spin rules to your account and show you your own orders. We never see your Discord password or e-mail.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        We do not store payment card numbers, PayPal passwords, wallet keys or your Minecraft password – we never ask for them.{' '}
        {GA_ENABLED
          ? 'The only analytics tool is Google Analytics, and it loads only after you accept the cookie notice (details below). No advertising pixels.'
          : 'We do not run analytics trackers or advertising pixels on this site.'}
      </p>

      <h2 id="why">Why we store it</h2>
      <p>
        To fulfil your order and keep a record of it (contract), to prevent fraud and abuse of free promotions (legitimate interest), to show reviews you chose to publish (consent), to
        keep you logged in when you chose to log in with Discord (contract){GA_ENABLED ? ', and to see which pages help players when you accept analytics (consent)' : ''}. That is the
        complete list of purposes. We do not build profiles, we do not sell or rent data, and we do not send marketing e-mails. The controller is the operator named in the{' '}
        <Link to="/imprint">legal notice</Link>.
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
          <strong>Discord (login).</strong> If you use “Login with Discord”, Discord asks you to approve sharing your account id, username and avatar (and your server list if we
          check membership). The login happens on Discord's site under Discord's privacy policy; you can revoke it any time in Discord → Settings → Authorized Apps.
        </li>
        {GA_ENABLED && (
          <li>
            <strong>Google Analytics 4.</strong> Only after you click “Accept” in the cookie notice. It records page views and interactions with IP anonymisation; Google processes this
            under its own terms, partly on servers outside the EU. Clicking “No thanks” keeps it off, and you can change your mind by clearing the site's storage.
          </li>
        )}
        <li>
          <strong>Google Fonts.</strong> Fonts are loaded from Google's servers, which see your IP address when the page loads.
        </li>
      </ul>

      <h2 id="cookies">Cookies and local storage</h2>
      <p>
        We set no tracking cookies. Two technical cookies exist only if you log in with Discord: <code className="kbd">dc_session</code> (your signed login, HttpOnly, 30 days or until you
        log out) and <code className="kbd">dc_oauth_state</code> (10 minutes, protects the login against forgery). The site keeps a few things in your browser's local storage so it works
        smoothly: your cart, your chosen currency, a referral or discount code you entered, the random device id mentioned above, your cookie-notice choice
        {GA_ENABLED ? ' (dc_consent)' : ''}, and – only if you are staff – an admin session token.{' '}
        {GA_ENABLED ? 'Google Analytics sets its own cookies (_ga, _ga_*) only after you accept. ' : ''}
        You can clear all of it through your browser settings at any time; the only effect is an empty cart, a new device id and being logged out.
      </p>

      <h2 id="retention">Retention</h2>
      <p>
        Orders are kept for as long as we need them to handle disputes and chargebacks, typically 12 months after delivery, then reduced to anonymous totals. Spin and giveaway records
        are kept for the duration of the cooldown or giveaway plus a short buffer. Reviews stay published until you ask us to remove them.
      </p>

      <h2 id="rights">Your rights</h2>
      <p>
        You can ask us what we store about a username or Discord account, ask for it to be corrected or deleted, withdraw consent for a published review, and have your Discord login
        data removed (log out, revoke the app in Discord and tell us). We will do it unless we are legally required to keep a record (for example an order under an open payment dispute
        or a tax record). Depending on where you live you may also have the right to complain to a data-protection authority – in the EU that is the authority of your country of
        residence.
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
