import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { PublicOrder } from '../shared/types';
import { apiPost, ApiClientError } from '../lib/api';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { Seo } from '../components/ui/Seo';
import { Icon } from '../components/ui/Icons';
import { UsernameInput } from '../components/free/UsernameInput';
import { rememberUsername, useRememberedUsername, usernameProblem } from '../components/free/username';
import '../styles/free.css';

const CODE_RE = /^[A-Z0-9][A-Z0-9-]{2,39}$/;

export default function Page() {
  const { config } = useStore();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const [code, setCode] = useState(() => (params.get('code') || '').toUpperCase());
  const [username, setUsername] = useRememberedUsername();
  const [codeErr, setCodeErr] = useState<string | null>(null);
  const [userErr, setUserErr] = useState<string | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState<PublicOrder | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    const u = username.trim();
    let bad = false;
    if (!CODE_RE.test(c)) {
      setCodeErr('Enter the code exactly as you received it (letters, numbers, dashes).');
      bad = true;
    } else setCodeErr(null);
    const up = usernameProblem(u);
    if (up) {
      setUserErr(up);
      bad = true;
    } else setUserErr(null);
    if (bad) return;
    setFormErr(null);
    setBusy(true);
    try {
      const res = await apiPost<{ order: PublicOrder }>('/redeem', { code: c, username: u });
      rememberUsername(u);
      setOrder(res.order);
      toast('Code redeemed – your free order is on its way!', 'gold');
    } catch (err) {
      const e = err as ApiClientError;
      if (e instanceof ApiClientError) {
        if (e.status === 404) setCodeErr('We do not know this code. Check for typos – codes are not case sensitive.');
        else if (e.status === 410 || /expired|used|limit/i.test(e.message)) setCodeErr(e.message || 'This code has expired or was already used.');
        else if (e.status === 429) setFormErr('Too many attempts – take a short break and try again.');
        else if (/username/i.test(e.message)) setUserErr(e.message);
        else setFormErr(e.message || 'Could not redeem this code right now.');
      } else {
        setFormErr('Could not reach the server. Please try again in a moment.');
      }
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setOrder(null);
    setCode('');
    setFormErr(null);
  };

  return (
    <div className="container page">
      <Seo title={`Redeem a gift code | ${config.storeName}`} description={`Redeem a ${config.storeName} gift code for free ${config.serverName} items – delivered in-game to your Minecraft account.`} />

      <header className="free-hero free-hero-compact">
        <span className="eyebrow">
          <Icon name="gift" size={14} /> Gift codes
        </span>
        <h1>Redeem a code</h1>
        <p className="lead">Enter your gift code and Minecraft username – we create a free order and deliver the item in-game.</p>
      </header>

      <div className="free-split">
        <div className="card pad">
          {order ? (
            <div className="redeem-success" role="status">
              <span className="redeem-success-icon">
                <Icon name="check" size={34} />
              </span>
              <h2 style={{ fontSize: 'var(--fs-2xl)' }}>Code redeemed!</h2>
              <p className="text-2">
                A free order <span className="mono gold-text">{order.id}</span> was created for <strong>{order.username}</strong>. We deliver it in-game as soon as we are online – usually within minutes.
              </p>
              <div className="redeem-items">
                {order.items.map((it, i) => (
                  <div key={`${it.productId}-${i}`} className="redeem-item">
                    <img src={it.image} alt="" onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/img/products/_fallback.svg')} />
                    <span>{it.name}</span>
                    <span className="qty-chip">×{it.qty}</span>
                  </div>
                ))}
              </div>
              <div className="row wrap" style={{ justifyContent: 'center' }}>
                <Link to={`/order/${order.id}`} className="btn btn-primary">
                  <Icon name="truck" size={16} /> Track delivery
                </Link>
                <button type="button" className="btn btn-secondary" onClick={reset}>
                  Redeem another code
                </button>
              </div>
              <p className="xs muted">
                Tip: join {config.serverName} with <strong>{order.username}</strong> and keep an eye on chat for the teleport request.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="stack" style={{ gap: 16 }}>
              <div className="field">
                <label className="label" htmlFor="redeem-code">
                  Gift code
                </label>
                <input
                  id="redeem-code"
                  className={`input code-input ${codeErr ? 'error' : ''}`}
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''));
                    if (codeErr) setCodeErr(null);
                  }}
                  placeholder="GIFT-XXXX-XXXX"
                  maxLength={40}
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={codeErr ? 'true' : undefined}
                  aria-describedby={codeErr ? 'redeem-code-err' : undefined}
                  autoFocus={!code}
                />
                {codeErr && (
                  <div className="err" id="redeem-code-err" role="alert">
                    {codeErr}
                  </div>
                )}
              </div>
              <UsernameInput
                value={username}
                onChange={(v) => {
                  setUsername(v);
                  if (userErr) setUserErr(null);
                }}
                error={userErr}
                hint="The free order is created for this account – double-check the spelling."
              />
              {formErr && (
                <div className="alert alert-danger" role="alert">
                  <Icon name="warning" size={18} />
                  <span>{formErr}</span>
                </div>
              )}
              <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
                {busy ? (
                  <>
                    <span className="spinner" /> Checking code…
                  </>
                ) : (
                  <>
                    <Icon name="gift" size={18} /> Redeem code
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <aside className="stack" style={{ gap: 16 }}>
          <div className="card pad">
            <h3 style={{ marginBottom: 12 }}>Where do codes come from?</h3>
            <ol className="free-steps">
              <li>
                <span>
                  <strong>Discord events</strong>
                  Drops, trivia and movie nights in our <a href={config.discordInvite} target="_blank" rel="noreferrer" className="gold-text">Discord</a> hand out gift codes.
                </span>
              </li>
              <li>
                <span>
                  <strong>Giveaways</strong>
                  Winners of our <Link to="/giveaways" className="gold-text">giveaways</Link> receive their prize as a code or a direct free order.
                </span>
              </li>
              <li>
                <span>
                  <strong>Support</strong>
                  If something went wrong with an order, support may send you a make-good code.
                </span>
              </li>
            </ol>
          </div>
          <div className="card pad">
            <h3 style={{ marginBottom: 10 }}>Good to know</h3>
            <ul className="stack small text-2" style={{ margin: 0, paddingLeft: 18, gap: 6 }}>
              <li>Codes are single use unless the event says otherwise, and some expire.</li>
              <li>Gift codes create a free order – track it like any other order.</li>
              <li>
                Looking for a <em>discount</em> coupon? Those go in the discount field at <Link to="/cart" className="gold-text">checkout</Link>, not here.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
