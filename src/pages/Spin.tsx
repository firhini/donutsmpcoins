import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { SpinResult, SpinStatus } from '../shared/types';
import { apiGet, apiPost, ApiClientError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { getDeviceId, storageGet, storageSet } from '../lib/device';
import { defaultSettings } from '../data/settings';
import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { Seo } from '../components/ui/Seo';
import { breadcrumbSchema, webPageSchema } from '../seo/schema';
import { Modal } from '../components/ui/Modal';
import { Icon } from '../components/ui/Icons';
import { Wheel, prizeColor, prizeGlyph, targetRotation, type PrizeGlyph, type WheelPrize } from '../components/free/Wheel';
import { PrizeIcon } from '../components/free/PrizeIcon';
import { Confetti } from '../components/free/Confetti';
import { Countdown, msUntil } from '../components/free/Countdown';
import { UsernameInput } from '../components/free/UsernameInput';
import { CopyButton } from '../components/free/CopyButton';
import { rememberUsername, useRememberedUsername, usernameProblem } from '../components/free/username';
import { playMiss, playTick, playWin, setSoundEnabled, soundEnabled } from '../components/free/sound';
import '../styles/free.css';

const LAST_KEY = 'dc_spin_last';

interface LastSpin {
  at: string;
  prizeId: string;
  label: string;
  type: WheelPrize['type'];
  glyph?: PrizeGlyph;
  color: string;
  message: string;
  nextSpinAt?: string;
  code?: string;
  orderId?: string;
  creditCents?: number;
  username?: string;
}

type Phase = 'idle' | 'windup' | 'spinning' | 'done';

const fallbackPrizes: WheelPrize[] = defaultSettings.spin.prizes.map(({ weight: _w, ...p }) => p);
const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H2v6h4l5 4V5Z" />
      {on ? <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" /> : <path d="m16 9 6 6m0-6-6 6" />}
    </svg>
  );
}

export default function Page() {
  const { config, fmt } = useStore();
  const auth = useAuth();
  const [guildBusy, setGuildBusy] = useState(false);
  const { setDiscountCode } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [status, setStatus] = useState<SpinStatus | null>(null);
  const [offline, setOffline] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [prizes, setPrizes] = useState<WheelPrize[]>(fallbackPrizes);
  const [username, setUsername] = useRememberedUsername();
  // a logged-in player's saved Minecraft name fills the field when it is empty
  useEffect(() => {
    if (auth.user?.mcUsername && !username.trim()) setUsername(auth.user.mcUsername);
  }, [auth.user?.mcUsername]); // eslint-disable-line react-hooks/exhaustive-deps
  const [usernameErr, setUsernameErr] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const rotRef = useRef(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const pending = useRef<SpinResult | null>(null);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [last, setLast] = useState<LastSpin | null>(null);
  const [sound, setSound] = useState<boolean>(true);
  useEffect(() => {
    setLast(storageGet<LastSpin | null>(LAST_KEY, null));
    setSound(soundEnabled());
  }, []);

  const needsUsername = useMemo(() => config.spinRequireUsername || prizes.some((p) => p.type === 'free_item'), [config.spinRequireUsername, prizes]);

  const loadStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const s = await apiGet<SpinStatus>(`/spin/status?deviceId=${encodeURIComponent(getDeviceId())}`);
      setStatus(s);
      if (Array.isArray(s.prizes) && s.prizes.length >= 2) setPrizes(s.prizes);
      setOffline(false);
    } catch {
      // backend not reachable – still render the wheel with the bundled prize list
      const stored = storageGet<LastSpin | null>(LAST_KEY, null);
      const cooling = !!stored?.nextSpinAt && msUntil(stored.nextSpinAt) > 0;
      setStatus({ enabled: config.spinEnabled, canSpin: !cooling, nextSpinAt: cooling ? stored?.nextSpinAt : undefined, prizes: fallbackPrizes, cooldownHours: defaultSettings.spin.cooldownHours });
      setOffline(true);
    } finally {
      setLoadingStatus(false);
    }
  }, [config.spinEnabled]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (!auth.loading) void loadStatus();
  }, [auth.user?.id, auth.loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const loginRequired = !!status?.loginRequired && !auth.user;
  const guildRequired = !!status?.guildRequired && !!auth.user && !auth.user.inGuild;
  const enabled = status?.enabled ?? config.spinEnabled;
  const canSpin = !!status?.canSpin && enabled && phase === 'idle' && !loginRequired && !guildRequired;
  const coolingDown = !!status && !status.canSpin && !!status.nextSpinAt && msUntil(status.nextSpinAt) > 0;

  const setRot = (deg: number) => {
    rotRef.current = deg;
    setRotation(deg);
  };

  const spin = async () => {
    if (!canSpin) return;
    if (needsUsername) {
      const problem = usernameProblem(username);
      if (problem) {
        setUsernameErr(problem);
        toast('Enter your Minecraft username first – free items are delivered to it.', 'error');
        return;
      }
    } else if (username.trim() && usernameProblem(username)) {
      setUsernameErr(usernameProblem(username));
      return;
    }
    setUsernameErr(null);
    if (username.trim()) rememberUsername(username);

    const base = rotRef.current;
    setPhase('windup');
    setRot(base - 14);
    const started = Date.now();
    try {
      const res = await apiPost<SpinResult>('/spin', { deviceId: getDeviceId(), username: username.trim() || undefined });
      await sleep(Math.max(0, 480 - (Date.now() - started)));
      // which segment to land on
      let idx = Number.isInteger(res.index) ? res.index : -1;
      if (idx < 0 || idx >= prizes.length) idx = prizes.findIndex((p) => p.id === res.prize.id);
      if (idx < 0) idx = 0;
      // keep the wheel honest if the server's prize list differs from what we rendered
      if (prizes[idx]?.id !== res.prize.id) {
        const { weight: _w, ...pub } = res.prize;
        setPrizes((cur) => cur.map((p, i) => (i === idx ? pub : p)));
      }
      pending.current = res;
      setPhase('spinning');
      setRot(targetRotation(rotRef.current, idx, prizes.length));
    } catch (err) {
      setPhase('idle');
      setRot(base);
      const e = err as ApiClientError;
      const msg = e instanceof ApiClientError ? e.message : 'Could not reach the spin service.';
      if (e instanceof ApiClientError && e.status === 429) {
        toast(msg || 'You already spun today – come back tomorrow!', 'error');
        void loadStatus();
      } else if (e instanceof ApiClientError && e.code === 'login_required') {
        auth.login('/spin');
      } else if (e instanceof ApiClientError && e.code === 'join_discord') {
        toast(msg, 'error');
        void loadStatus();
      } else if (e instanceof ApiClientError && e.status === 400 && /username/i.test(msg)) {
        setUsernameErr(msg);
      } else {
        toast(offline ? 'The spin service is unavailable right now – please try again in a bit.' : msg, 'error');
      }
    }
  };

  const onSpinEnd = useCallback(() => {
    const res = pending.current;
    pending.current = null;
    setPhase('done');
    if (!res) {
      setPhase('idle');
      return;
    }
    setResult(res);
    setModalOpen(true);
    const win = res.prize.type !== 'nothing';
    if (win) {
      setConfetti(true);
      window.setTimeout(() => setConfetti(false), 300);
      playWin();
      toast(`You won ${res.prize.label}!`, 'gold');
    } else {
      playMiss();
    }
    const entry: LastSpin = {
      at: new Date().toISOString(),
      prizeId: res.prize.id,
      label: res.prize.label,
      type: res.prize.type,
      glyph: prizeGlyph(res.prize),
      color: res.prize.color || '#475569',
      message: res.message,
      nextSpinAt: res.nextSpinAt,
      code: res.code,
      orderId: res.orderId,
      creditCents: res.creditCents,
      username: username.trim() || undefined,
    };
    storageSet(LAST_KEY, entry);
    setLast(entry);
    setStatus((s) => (s ? { ...s, canSpin: false, nextSpinAt: res.nextSpinAt } : s));
    // allow the wheel to be interactive again (it stays locked by canSpin)
    window.setTimeout(() => setPhase('idle'), 50);
  }, [toast, username]);

  const onCooldownDone = useCallback(() => {
    setStatus((s) => (s ? { ...s, canSpin: true, nextSpinAt: undefined } : s));
    void loadStatus();
  }, [loadStatus]);

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    setSoundEnabled(next);
  };

  const shopWithCode = (code?: string) => {
    if (code) setDiscountCode(code);
    setModalOpen(false);
    navigate('/shop');
  };

  const prizeMeta = (p: WheelPrize): string => {
    if (p.type === 'coupon') {
      const bits = [`${p.percent ?? 0}% off`, `valid ${p.validDays ?? 7} days`];
      if (p.minOrderCents) bits.push(`min. ${fmt(p.minOrderCents)}`);
      return bits.join(' · ');
    }
    if (p.type === 'credit') return `${fmt(p.creditCents ?? 0)} store credit`;
    if (p.type === 'free_item') return 'Free item · delivered in-game';
    return 'No prize this time';
  };

  const lastGlyph: PrizeGlyph = last ? (last.glyph ?? prizeGlyph({ type: last.type, label: last.label })) : 'nothing';

  return (
    <div className="container page spin-page">
      <Seo title={`Daily Free Spin – win coins & coupons | ${config.storeName}`} description={`Spin the ${config.storeName} wheel once every ${status?.cooldownHours ?? 24} hours for free ${config.serverName} coins, discount coupons and store credit.`} canonical="/spin" jsonLd={[breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Daily Free Spin', path: '/spin' }]), webPageSchema('Daily Free Spin', '/spin')]} />
      <Confetti active={confetti} />

      <div className="spin-layout">
        {/* ───────── stage ───────── */}
        <section className="spin-stage">
          <div className="spin-stage-head">
            <span className="eyebrow">
              <Icon name="sparkles" size={14} /> Daily free spin
            </span>
            <h1>
              Spin. <span className="grad-text">Win.</span> Flex.
            </h1>
            <p>One free spin every {status?.cooldownHours ?? 24} hours. Coupons, store credit and free {config.serverName} loot – no purchase needed.</p>
          </div>

          <Wheel prizes={prizes} rotation={rotation} spinning={phase === 'spinning'} windup={phase === 'windup'} disabled={!canSpin} onSpin={spin} onSpinEnd={onSpinEnd} onTick={playTick} />

          <div className="spin-controls">
            {enabled && (
              <UsernameInput
                value={username}
                onChange={(v) => {
                  setUsername(v);
                  if (usernameErr) setUsernameErr(null);
                }}
                error={usernameErr}
                label={needsUsername ? 'Minecraft username (required for free items)' : 'Minecraft username (optional)'}
                hint="Free items are delivered to this account. Coupons get bound to it so nobody else can use your code."
                disabled={phase !== 'idle'}
                size="lg"
              />
            )}

            {!enabled ? (
              <div className="alert alert-warn">
                <Icon name="info" size={18} />
                <span>The wheel is taking a short break. New rounds are announced in our Discord.</span>
              </div>
            ) : loginRequired ? (
              <div className="spin-gate card pad">
                <Icon name="discord" size={26} />
                <div className="stack" style={{ gap: 4 }}>
                  <strong>Log in with Discord to spin</strong>
                  <span className="small muted">One free spin per account every {status?.cooldownHours ?? 24}h. Your prizes are saved to your account.</span>
                </div>
                <button type="button" className="btn btn-discord btn-lg" onClick={() => auth.login('/spin')} disabled={auth.loading}>
                  <Icon name="discord" size={18} /> Login with Discord
                </button>
              </div>
            ) : guildRequired ? (
              <div className="spin-gate card pad">
                <Icon name="users" size={26} />
                <div className="stack" style={{ gap: 4 }}>
                  <strong>Join our Discord server to unlock the wheel</strong>
                  <span className="small muted">Members spin for free every day. Join, then click “I joined”.</span>
                </div>
                <div className="row wrap">
                  <a href={config.discordInvite} target="_blank" rel="noreferrer" className="btn btn-discord">
                    <Icon name="discord" size={16} /> Join the server
                  </a>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={guildBusy}
                    onClick={async () => {
                      setGuildBusy(true);
                      try {
                        const ok = await auth.refreshGuild();
                        if (ok) {
                          toast('Welcome aboard – the wheel is unlocked!', 'success');
                          void loadStatus();
                        } else toast('We still cannot see you in the server – join via the invite and try again.', 'info');
                      } catch (e2) {
                        const ae = e2 as ApiClientError;
                        if (ae.code === 'relogin') auth.login('/spin');
                        else toast(ae.message || 'Could not check membership', 'error');
                      } finally {
                        setGuildBusy(false);
                      }
                    }}
                  >
                    {guildBusy ? <span className="spinner" /> : 'I joined – check again'}
                  </button>
                </div>
              </div>
            ) : coolingDown ? (
              <div className="spin-cooldown" role="status">
                <Icon name="clock" size={18} />
                <span>Next spin in</span>
                <Countdown to={status?.nextSpinAt} onDone={onCooldownDone} />
              </div>
            ) : (
              <button type="button" className="btn btn-primary btn-lg btn-block spin-cta" onClick={spin} disabled={!canSpin || loadingStatus}>
                {phase === 'windup' || phase === 'spinning' ? (
                  <>
                    <span className="spinner" /> Spinning…
                  </>
                ) : loadingStatus ? (
                  <>
                    <span className="spinner" /> Loading wheel…
                  </>
                ) : (
                  <>
                    <Icon name="spin" size={18} /> Spin the wheel – it&apos;s free
                  </>
                )}
              </button>
            )}

            <div className="row between wrap" style={{ gap: 8 }}>
              <span className="xs muted">
                <Icon name="shield" size={12} className="ico-inline" /> Fair draw on our server · one spin per player & device
              </span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={toggleSound} aria-pressed={sound} title={sound ? 'Mute wheel sounds' : 'Unmute wheel sounds'}>
                <SoundIcon on={sound} /> {sound ? 'Sound on' : 'Muted'}
              </button>
            </div>
            {offline && !loadingStatus && <p className="xs muted spin-offline">Live wheel data is unavailable – showing the standard prize wheel.</p>}
          </div>
        </section>

        {/* ───────── sidebar ───────── */}
        <aside className="spin-side">
          {last && (
            <div className="card pad spin-last">
              <div className="spin-last-swatch" style={{ background: last.color }}>
                <PrizeIcon kind={lastGlyph} size={20} />
              </div>
              <div className="spin-last-body">
                <span className="xs muted">Your last prize</span>
                <strong>{last.label}</strong>
                {last.code && (
                  <div className="code-row">
                    <span className="code-box">{last.code}</span>
                    <CopyButton text={last.code} iconOnly className="btn btn-ghost btn-icon" />
                  </div>
                )}
                {last.orderId && (
                  <Link to={`/order/${last.orderId}`} className="small gold-text" style={{ display: 'inline-block', marginTop: 4 }}>
                    View free order <Icon name="arrowRight" size={12} className="ico-inline" />
                  </Link>
                )}
              </div>
            </div>
          )}

          <div className="card pad spin-rules">
            <h3>How it works</h3>
            <ul>
              <li>
                <Icon name="clock" size={16} />
                <span>
                  <strong>1 spin per {status?.cooldownHours ?? 24}h</strong> – the timer starts when you spin, not at midnight.
                </span>
              </li>
              <li>
                <Icon name="user" size={16} />
                <span>
                  <strong>Free items need a Minecraft username.</strong> We create a free order and deliver it in-game. Max 1 free-item prize per username per week.
                </span>
              </li>
              <li>
                <Icon name="ticket" size={16} />
                <span>
                  <strong>Coupons expire</strong> (3–7 days) and are bound to your username. Use them at checkout – see the <Link to="/faq" className="gold-text">FAQ</Link>.
                </span>
              </li>
              <li>
                <Icon name="coin" size={16} />
                <span>
                  <strong>Store credit</strong> is applied automatically at checkout when you order with the same username.
                </span>
              </li>
            </ul>
            <Link to="/free" className="btn btn-outline btn-sm" style={{ alignSelf: 'flex-start' }}>
              More ways to get free stuff <Icon name="arrowRight" size={14} />
            </Link>
          </div>

          <div className="card pad spin-prizes">
            <h3>
              <Icon name="gift" size={16} className="ico-inline" /> What you can win
            </h3>
            <div className="prize-list">
              {prizes.map((p, i) => (
                <div key={`${p.id}-${i}`} className={`prize-item ${result && result.prize.id === p.id ? 'highlight' : ''}`}>
                  <span className="prize-swatch" style={{ background: prizeColor(p, i) } as CSSProperties}>
                    <PrizeIcon kind={prizeGlyph(p)} size={18} />
                  </span>
                  <span className="prize-text">
                    <strong>{p.label}</strong>
                    <span>{prizeMeta(p)}</span>
                  </span>
                </div>
              ))}
            </div>
            <p className="xs muted spin-prizes-note">Every segment is a real prize. The result is drawn on our server – what you see is what you get.</p>
          </div>
        </aside>
      </div>

      {/* ───────── result modal ───────── */}
      <Modal open={modalOpen && !!result} onClose={() => setModalOpen(false)} size="sm" title={result?.prize.type === 'nothing' ? 'Not this time' : 'Winner!'}>
        {result && (
          <div className="spin-result">
            <div className="spin-result-badge" style={{ background: result.prize.color || '#475569' }}>
              <PrizeIcon kind={prizeGlyph(result.prize)} size={38} />
            </div>
            <h3>{result.prize.type === 'nothing' ? 'Try again tomorrow' : result.prize.label}</h3>
            <p className="lead">{result.message}</p>

            {result.code && (
              <div className="stack" style={{ alignItems: 'center', width: '100%' }}>
                <span className="code-box gold big">{result.code}</span>
                <CopyButton text={result.code} label="Copy code" copiedLabel="Copied!" />
                <span className="spin-result-meta">
                  {result.prize.type === 'coupon' ? `${result.prize.percent}% off` : 'Coupon'} · valid {result.prize.validDays ?? 7} days
                  {result.prize.minOrderCents ? ` · min. order ${fmt(result.prize.minOrderCents)}` : ''}
                  {username.trim() ? ` · bound to ${username.trim()}` : ''}
                </span>
              </div>
            )}

            {result.orderId && (
              <div className="alert alert-success" style={{ width: '100%' }}>
                <Icon name="check" size={18} />
                <span>
                  Free item order created for <strong>{username.trim()}</strong> – we deliver it in-game as soon as we are online.
                </span>
              </div>
            )}

            {result.prize.type === 'credit' && (
              <div className="alert alert-success" style={{ width: '100%' }}>
                <Icon name="coin" size={18} />
                <span>
                  <strong>{fmt(result.creditCents ?? result.prize.creditCents ?? 0)}</strong> store credit added – it is applied automatically at checkout.
                </span>
              </div>
            )}

            <div className="spin-result-actions">
              {result.orderId ? (
                <Link to={`/order/${result.orderId}`} className="btn btn-primary" onClick={() => setModalOpen(false)}>
                  View order <Icon name="arrowRight" size={16} />
                </Link>
              ) : result.prize.type !== 'nothing' ? (
                <button type="button" className="btn btn-primary" onClick={() => shopWithCode(result.code)}>
                  <Icon name="cart" size={16} /> Shop now
                </button>
              ) : (
                <Link to="/free" className="btn btn-primary" onClick={() => setModalOpen(false)}>
                  <Icon name="gift" size={16} /> Other free stuff
                </Link>
              )}
              <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                Close
              </button>
            </div>
            <span className="spin-result-meta">
              Next spin in <Countdown to={result.nextSpinAt} />
            </span>
          </div>
        )}
      </Modal>
    </div>
  );
}
