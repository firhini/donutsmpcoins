import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../lib/api';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { Seo } from '../components/ui/Seo';
import { Icon } from '../components/ui/Icons';
import { UsernameInput } from '../components/free/UsernameInput';
import { CopyButton, useCopy } from '../components/free/CopyButton';
import { isValidUsername, useRememberedUsername } from '../components/free/username';
import '../styles/free.css';

interface ReferralInfo {
  code: string;
  referrals: number;
  earnedCents: number;
}

export default function Page() {
  const { config, fmt } = useStore();
  const { toast } = useToast();
  const [username, setUsername] = useRememberedUsername();
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [credit, setCredit] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [copiedLink, copyLink] = useCopy();
  const ref = config.referral;
  const valid = isValidUsername(username);
  const name = username.trim();

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const link = valid ? `${origin}/?ref=${encodeURIComponent(name)}` : '';
  const shareText = useMemo(() => `Get ${ref.friendPercent}% off ${config.serverName} money, spawners & mystery boxes at ${config.storeName}: ${link}`, [ref.friendPercent, config.serverName, config.storeName, link]);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  // fetch stats when the username is valid (debounced)
  useEffect(() => {
    if (!valid) {
      setInfo(null);
      setCredit(null);
      return;
    }
    let alive = true;
    setLoading(true);
    const t = window.setTimeout(async () => {
      const [r, c] = await Promise.all([
        apiGet<ReferralInfo>(`/referral?username=${encodeURIComponent(name)}`).catch(() => null),
        apiGet<{ balanceCents: number }>(`/credit?username=${encodeURIComponent(name)}`).catch(() => null),
      ]);
      if (!alive) return;
      setInfo(r);
      setCredit(c ? c.balanceCents : null);
      setUnavailable(!r && !c);
      setLoading(false);
    }, 450);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [valid, name]);

  const share = async () => {
    try {
      await navigator.share({ title: config.storeName, text: shareText, url: link });
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="container page">
      <Seo title={`Refer a friend – earn store credit | ${config.storeName}`} description={`Share your ${config.storeName} referral link: your friend gets ${ref.friendPercent}% off, you earn ${ref.referrerPercent}% of their order as store credit.`} />

      <header className="free-hero free-hero-compact">
        <span className="eyebrow">
          <Icon name="users" size={14} /> Referral program
        </span>
        <h1>
          Friends pay less. <span className="grad-text">You earn credit.</span>
        </h1>
        <p className="lead">
          Every friend who orders with your link gets {ref.friendPercent}% off – and you get {ref.referrerPercent}% of their order as store credit. No limits.
        </p>
      </header>

      {!ref.enabled && (
        <div className="alert alert-warn" style={{ marginBottom: 24 }}>
          <Icon name="info" size={18} />
          <span>The referral program is paused at the moment. Existing store credit can still be used at checkout.</span>
        </div>
      )}

      <div className="free-split">
        <div className="stack" style={{ gap: 16 }}>
          <div className="card pad stack" style={{ gap: 16 }}>
            <div>
              <h3>Your referral link</h3>
              <p className="small text-2">Your Minecraft username is your referral code. Enter it to generate the link.</p>
            </div>
            <UsernameInput value={username} onChange={setUsername} size="lg" hint="Store credit is paid to this account." />
            {valid && (
              <div className="ref-link fade-up">
                <span className="code-box gold">
                  <span style={{ overflowWrap: 'anywhere' }}>{link}</span>
                </span>
                <div className="row wrap">
                  <button
                    type="button"
                    className={`btn btn-primary fcopy-btn ${copiedLink ? 'copied' : ''}`}
                    onClick={async () => {
                      if (await copyLink(link)) toast('Link copied – send it to your friends!', 'success');
                    }}
                  >
                    <Icon name={copiedLink ? 'check' : 'copy'} size={16} /> {copiedLink ? 'Copied!' : 'Copy link'}
                  </button>
                  {canShare && (
                    <button type="button" className="btn btn-secondary" onClick={share}>
                      <Icon name="share" size={16} /> Share
                    </button>
                  )}
                  <CopyButton text={name} label="Copy code" className="btn btn-outline" />
                </div>
                <p className="xs muted">
                  Friends can also just type <strong className="mono">{name}</strong> into the referral field at checkout.
                </p>
              </div>
            )}
          </div>

          <div className="card pad stack" style={{ gap: 14 }}>
              <div className="row between wrap">
                <h3>Your earnings</h3>
                {loading && <span className="spinner" aria-label="Loading" />}
              </div>
              <div className="ref-stats">
                <div className="stat-tile gold">
                  <span className="v">{credit === null ? '–' : fmt(credit)}</span>
                  <span className="k">Store credit</span>
                </div>
                <div className="stat-tile">
                  <span className="v">{info ? info.referrals : '–'}</span>
                  <span className="k">Referrals</span>
                </div>
                <div className="stat-tile mint">
                  <span className="v">{info ? fmt(info.earnedCents) : '–'}</span>
                  <span className="k">Earned total</span>
                </div>
              </div>
              {!valid ? (
                <p className="xs muted">Enter your Minecraft username above to see your referrals and store credit.</p>
              ) : unavailable && !loading ? (
                <p className="xs muted">Stats are temporarily unavailable – your link still works and credit is tracked on our side.</p>
              ) : info && info.referrals === 0 && !loading ? (
                <p className="xs muted">No referrals yet. Share your link in your clan chat, your Discord or your TikTok bio – credit shows up here as soon as a friend&apos;s order is delivered.</p>
              ) : (
                <p className="xs muted">Credit is granted when your friend&apos;s order is marked delivered. Use it at checkout by ordering with the username above.</p>
              )}
            </div>
        </div>

        <aside className="stack" style={{ gap: 16 }}>
          <div className="card pad stack" style={{ gap: 14 }}>
            <h3>How it works</h3>
            <div className="ref-flow">
              <div className="ref-flow-box">
                <span className="who">Your friend</span>
                <span className="pct gold-text">-{ref.friendPercent}%</span>
                <span className="small text-2">off their order</span>
              </div>
              <span className="ref-flow-arrow">
                <Icon name="arrowRight" size={22} />
              </span>
              <div className="ref-flow-box">
                <span className="who">You</span>
                <span className="pct success-text">+{ref.referrerPercent}%</span>
                <span className="small text-2">of their order as credit</span>
              </div>
            </div>
            <ol className="free-steps">
              <li>
                <span>
                  <strong>Share your link</strong>
                  Or tell your friend your username – they enter it as the referral code at checkout.
                </span>
              </li>
              <li>
                <span>
                  <strong>Friend orders &amp; gets delivered</strong>
                  Their {ref.friendPercent}% discount applies instantly (cannot be combined with a coupon).
                </span>
              </li>
              <li>
                <span>
                  <strong>You get credit</strong>
                  {ref.referrerPercent}% of their order lands in your store credit – applied automatically on your next order.
                </span>
              </li>
            </ol>
          </div>
          <div className="card pad">
            <h3 style={{ marginBottom: 10 }}>Fair play</h3>
            <p className="small text-2">
              Self-referrals (same account, device or payment) are not rewarded and credit from refunded orders is removed. Credit never expires and can only be spent in this shop. Questions? Ask in{' '}
              <a href={config.discordInvite} target="_blank" rel="noreferrer" className="gold-text">
                Discord
              </a>
              .
            </p>
          </div>
          <Link to="/free" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>
            <Icon name="gift" size={14} /> All free stuff
          </Link>
        </aside>
      </div>
    </div>
  );
}
