import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { ContentPage, Callout } from '../../components/shop/ContentPage';
import { renderParagraphs } from '../../components/shop/richText';

const TOC = [
  { id: 'operator', label: 'Operator' },
  { id: 'contact', label: 'Contact' },
  { id: 'disputes', label: 'Dispute resolution' },
  { id: 'liability', label: 'Content, links & trademarks' },
];

/**
 * Legal notice (Impressum). The operator fills name, address and contact in
 * Admin → Settings → Legal; until then the page says so instead of inventing data.
 */
export default function Imprint() {
  const { config } = useStore();
  const l = config.legal;
  const filled = Boolean(l.operatorName.trim() || l.address.trim() || l.email.trim());
  return (
    <ContentPage
      eyebrow="Legal"
      title="Legal Notice (Impressum)"
      seoTitle={`Legal Notice (Impressum) · ${config.storeName}`}
      description={`Who operates ${config.storeName}: operator name, address and contact details, plus the notes on dispute resolution and liability.`}
      lead="Who runs this store and how to reach us – the legal notice required for a store operated from the EU."
      crumbs={[{ label: 'Legal notice' }]}
      toc={TOC}
      type="website"
    >
      <h2 id="operator">Operator of this website</h2>
      {filled ? (
        <address className="imprint-address">
          {l.operatorName.trim() && <strong>{l.operatorName.trim()}</strong>}
          {l.address
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line, i) => (
              <span key={i}>{line}</span>
            ))}
        </address>
      ) : (
        <Callout tone="warn" title="Legal notice not filled in yet">
          The operator has not entered the legal notice yet. Until then please reach us on{' '}
          <a href={config.discordInvite} target="_blank" rel="noreferrer">
            Discord
          </a>
          {config.supportEmail ? (
            <>
              {' '}
              or at <a href={`mailto:${config.supportEmail}`}>{config.supportEmail}</a>
            </>
          ) : null}
          . (Store owner: Admin → Settings → Legal.)
        </Callout>
      )}
      {l.vatId.trim() && <p className="small">{l.vatId.trim()}</p>}

      <h2 id="contact">Contact</h2>
      <p>
        {l.email.trim() ? (
          <>
            E-mail: <a href={`mailto:${l.email.trim()}`}>{l.email.trim()}</a>
            {l.phone.trim() ? <> · Phone: {l.phone.trim()}</> : null}
            <br />
          </>
        ) : null}
        Fastest answers: our{' '}
        <a href={config.discordInvite} target="_blank" rel="noreferrer">
          Discord server
        </a>
        {config.supportEmail && config.supportEmail !== l.email.trim() ? (
          <>
            {' '}
            or <a href={`mailto:${config.supportEmail}`}>{config.supportEmail}</a>
          </>
        ) : null}
        .
      </p>
      {l.extra.trim() ? renderParagraphs(l.extra.trim()) : null}

      <h2 id="disputes">Dispute resolution</h2>
      <p>
        We are neither obliged nor willing to take part in dispute resolution proceedings before a consumer arbitration board. If something went wrong with an order, contact us first – we
        fix genuine problems quickly, see the <Link to="/refund-policy">refund policy</Link>.
      </p>

      <h2 id="liability">Content, links &amp; trademarks</h2>
      <p>
        We prepare the content of this site with care but cannot guarantee that every price, odds table or delivery estimate is up to date at every moment; the order page is
        authoritative. Links to external sites (Discord, payment providers, the game server) lead to content we do not control.
      </p>
      <p>
        “Minecraft” is a trademark of Mojang AB. {config.storeName} is an independent, player-run store and is not affiliated with, endorsed by or connected to {config.serverName}, Mojang
        AB or Microsoft.
      </p>
      <p className="small muted">
        See also: <Link to="/terms">Terms of Service</Link> · <Link to="/refund-policy">Refund Policy</Link> · <Link to="/privacy">Privacy Policy</Link>
      </p>
    </ContentPage>
  );
}
