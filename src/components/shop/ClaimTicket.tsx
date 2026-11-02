import { useStore } from '../../context/StoreContext';
import { Icon } from '../ui/Icons';
import { CopyButton } from '../cart/CopyButton';

/**
 * How to claim an order: items need a Discord ticket (required), money is paid with /pay but a ticket makes it faster.
 */
export function ClaimTicket({ orderId, username, required }: { orderId?: string; username?: string; required: boolean }) {
  const { config } = useStore();
  const ticketUrl = config.discordTicketUrl;

  return (
    <section className={`card claim ${required ? 'is-required' : ''}`} aria-labelledby="claim-title">
      <div className="claim-head">
        <span className="claim-icon">
          <Icon name="discord" size={24} />
        </span>
        <div>
          <span className="claim-tag">{required ? 'Required to receive your order' : 'Faster delivery'}</span>
          <h2 id="claim-title">{required ? 'Open a ticket in Discord to claim' : 'Want it faster? Open a Discord ticket'}</h2>
          <p className="text-2 small">
            {required
              ? 'We hand out items only through a Discord ticket – without a ticket we cannot deliver.'
              : 'Your money is sent with /pay and you can simply wait – but with a ticket we see you right away.'}
          </p>
        </div>
      </div>
      <ol className="claim-steps">
        <li>
          <span>1</span>
          <div>
            <strong>Join our Discord</strong>
            <a href={config.discordInvite} target="_blank" rel="noreferrer" className="btn btn-discord btn-sm" data-track="claim join discord">
              <Icon name="discord" size={15} /> Join Discord
            </a>
          </div>
        </li>
        <li>
          <span>2</span>
          <div>
            <strong>Open a ticket</strong>
            <span className="small text-2">In the #ticket channel click “Open ticket”.</span>
            {ticketUrl && (
              <a href={ticketUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" data-track="claim open ticket">
                <Icon name="external" size={14} /> Go to #ticket
              </a>
            )}
          </div>
        </li>
        <li>
          <span>3</span>
          <div>
            <strong>Post your order ID{username ? ' and Minecraft name' : ''}</strong>
            {orderId && (
              <span className="row wrap" style={{ gap: 8 }}>
                <code className="claim-code">{orderId}</code>
                <CopyButton text={orderId} className="btn btn-ghost btn-sm" label="Copy" toastMessage="Order ID copied" />
                {username && <code className="claim-code">{username}</code>}
              </span>
            )}
          </div>
        </li>
      </ol>
    </section>
  );
}
