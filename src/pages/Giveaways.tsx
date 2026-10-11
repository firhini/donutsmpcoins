import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Giveaway } from '../shared/types';
import { apiGet, apiPost, ApiClientError } from '../lib/api';
import { getDeviceId, storageGet, storageSet } from '../lib/device';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { Seo } from '../components/ui/Seo';
import { Icon } from '../components/ui/Icons';
import { Countdown, msUntil } from '../components/free/Countdown';
import { UsernameInput } from '../components/free/UsernameInput';
import { Confetti } from '../components/free/Confetti';
import { avatarUrl, rememberUsername, useRememberedUsername, usernameProblem } from '../components/free/username';
import '../styles/free.css';

const ENTRIES_KEY = 'dc_giveaway_entries';
type Entries = Record<string, string>; // giveawayId → username

function WinnerChip({ name }: { name: string }) {
  const [ok, setOk] = useState(true);
  return (
    <span className="ga-winner">
      {ok ? <img src={avatarUrl(name, 32)} alt="" width={26} height={26} onError={() => setOk(false)} /> : <span className="ga-winner-fallback">{name.slice(0, 1).toUpperCase()}</span>}
      {name}
    </span>
  );
}

function GiveawayImage({ g }: { g: Giveaway }) {
  const [ok, setOk] = useState(true);
  if (g.image && ok) return <img src={g.image} alt="" onError={() => setOk(false)} />;
  return (
    <span className="ga-media-fallback" aria-hidden="true">
      <Icon name="trophy" size={48} />
    </span>
  );
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function GiveawayCard({ g, entries, username, setUsername, onEntered, onEnded }: { g: Giveaway; entries: Entries; username: string; setUsername: (v: string) => void; onEntered: (id: string, name: string, count?: number) => void; onEnded: () => void }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [count, setCount] = useState(g.entriesCount);
  const live = g.status === 'active' && msUntil(g.endsAt) > 0;
  const entered = entries[g.id];
  const drawn = g.status === 'drawn';

  useEffect(() => setCount(g.entriesCount), [g.entriesCount]);

  const enter = async (e: FormEvent) => {
    e.preventDefault();
    const name = username.trim();
    const problem = usernameProblem(name);
    if (problem) {
      setErr(problem);
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      const res = await apiPost<{ entered: boolean; entriesCount?: number }>(`/giveaways/${encodeURIComponent(g.id)}/enter`, { username: name, deviceId: getDeviceId() });
      rememberUsername(name);
      if (typeof res.entriesCount === 'number') setCount(res.entriesCount);
      onEntered(g.id, name, res.entriesCount);
      toast(`You're in! Good luck, ${name}.`, 'gold');
    } catch (error) {
      const ex = error as ApiClientError;
      if (ex instanceof ApiClientError && ex.code === 'already_entered') {
        onEntered(g.id, name);
        toast('You are already entered in this giveaway.', 'info');
      } else if (ex instanceof ApiClientError && ex.code === 'ended') {
        setErr('Entries are closed – this giveaway has ended.');
        onEnded();
      } else if (ex instanceof ApiClientError && (ex.status === 404 || ex.status === 410)) {
        setErr('This giveaway is no longer open.');
      } else {
        setErr(ex instanceof ApiClientError ? ex.message : 'Could not enter right now – please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className={`card ga-card ${drawn ? 'drawn' : live ? 'hover glow-gold' : ''}`}>
      <div className="ga-media">
        <span className="ga-status">{drawn ? <span className="badge badge-violet">Winners drawn</span> : live ? <span className="badge badge-green">Live</span> : <span className="badge">Drawing soon</span>}</span>
        {live && (
          <span className="ga-timer">
            <Icon name="clock" size={12} /> <Countdown to={g.endsAt} format="compact" onDone={onEnded} doneText="ending…" />
          </span>
        )}
        <GiveawayImage g={g} />
      </div>
      <div className="ga-body">
        <div>
          <h3 style={{ fontSize: 'var(--fs-lg)' }}>{g.title}</h3>
          <div className="ga-prize">{g.prize}</div>
        </div>
        {g.description && <p className="ga-desc">{g.description}</p>}
        <div className="ga-meta">
          <span>
            <Icon name="users" size={12} /> {count} {count === 1 ? 'entry' : 'entries'}
          </span>
          <span>
            <Icon name="trophy" size={12} /> {g.maxWinners} {g.maxWinners === 1 ? 'winner' : 'winners'}
          </span>
          <span>
            <Icon name="clock" size={12} /> {drawn ? `Drawn ${fmtDate(g.endsAt)}` : `Ends ${fmtDate(g.endsAt)}`}
          </span>
        </div>

        {drawn ? (
          <div className="stack" style={{ gap: 8, marginTop: 'auto' }}>
            <span className="xs muted">{g.winners?.length ? 'Congratulations to' : 'Winners are announced in Discord'}</span>
            {g.winners && g.winners.length > 0 && (
              <div className="ga-winners">
                {g.winners.map((w) => (
                  <WinnerChip key={w} name={w} />
                ))}
              </div>
            )}
            {entered && g.winners?.some((w) => w.toLowerCase() === entered.toLowerCase()) && (
              <div className="alert alert-success">
                <Icon name="sparkles" size={18} />
                <span>
                  That&apos;s you, <strong>{entered}</strong>! Check your Discord DMs or the order page for your prize.
                </span>
              </div>
            )}
          </div>
        ) : entered ? (
          <div className="ga-entered" role="status">
            <Icon name="check" size={18} />
            <span>
              Entered as {entered} – good luck! {live ? 'Winners are drawn when the timer ends.' : 'The draw is coming up.'}
            </span>
          </div>
        ) : live ? (
          <form className="ga-form" onSubmit={enter} noValidate>
            <UsernameInput
              value={username}
              onChange={(v) => {
                setUsername(v);
                if (err) setErr(null);
              }}
              error={err}
              label="Enter with your Minecraft username"
              placeholder="Your username"
              disabled={busy}
            />
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? (
                <>
                  <span className="spinner" /> Entering…
                </>
              ) : (
                <>
                  <Icon name="trophy" size={16} /> Enter giveaway
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="alert alert-info" style={{ marginTop: 'auto' }}>
            <Icon name="clock" size={18} />
            <span>Entries are closed – the winners are being drawn.</span>
          </div>
        )}
      </div>
    </article>
  );
}

export default function Page() {
  const { config } = useStore();
  const [giveaways, setGiveaways] = useState<Giveaway[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [username, setUsername] = useRememberedUsername();
  const [entries, setEntries] = useState<Entries>(() => storageGet<Entries>(ENTRIES_KEY, {}));
  const [confetti, setConfetti] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await apiGet<{ giveaways: Giveaway[] }>('/giveaways');
      setGiveaways(Array.isArray(r.giveaways) ? r.giveaways : []);
      setFailed(false);
    } catch {
      setGiveaways([]);
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onEntered = (id: string, name: string) => {
    setEntries((cur) => {
      const next = { ...cur, [id]: name };
      storageSet(ENTRIES_KEY, next);
      return next;
    });
    setConfetti(true);
    window.setTimeout(() => setConfetti(false), 300);
  };

  const list = giveaways ?? [];
  const active = list.filter((g) => g.status === 'active');
  const pendingDraw = list.filter((g) => g.status === 'ended');
  const drawn = list.filter((g) => g.status === 'drawn').sort((a, b) => b.endsAt.localeCompare(a.endsAt));

  return (
    <div className="container page">
      <Seo title={`Giveaways – win free ${config.serverName} loot | ${config.storeName}`} description={`Enter the current ${config.storeName} giveaways with your Minecraft username and win ${config.serverName} money, mystery boxes and spawners for free.`} />
      <Confetti active={confetti} count={90} />

      <header className="free-hero free-hero-compact">
        <span className="eyebrow">
          <Icon name="trophy" size={14} /> Giveaways
        </span>
        <h1>
          Win it. <span className="grad-text">Don&apos;t buy it.</span>
        </h1>
        <p className="lead">Free money packs, mystery boxes and spawners. Enter with your username, winners are drawn at random and delivered in-game.</p>
        <div className="free-hero-actions">
          <a href={config.discordInvite} target="_blank" rel="noreferrer" className="btn btn-discord">
            <Icon name="discord" size={16} /> Get notified in Discord
          </a>
        </div>
      </header>

      {giveaways === null ? (
        <div className="ga-grid" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card ga-card">
              <div className="skeleton" style={{ height: 150, borderRadius: 0 }} />
              <div className="ga-body">
                <div className="skeleton" style={{ height: 22, width: '60%' }} />
                <div className="skeleton" style={{ height: 16, width: '40%' }} />
                <div className="skeleton" style={{ height: 46 }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {failed ? (
            <div className="card ga-empty">
              <span className="ga-empty-icon">
                <Icon name="warning" size={34} />
              </span>
              <h3>Giveaways could not be loaded</h3>
              <p className="text-2" style={{ maxWidth: 440 }}>
                Our server did not answer in time. Try again in a moment – current giveaways are also pinned in our Discord.
              </p>
              <div className="row wrap" style={{ justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setGiveaways(null);
                    void load();
                  }}
                >
                  <Icon name="refresh" size={16} /> Try again
                </button>
                <a href={config.discordInvite} target="_blank" rel="noreferrer" className="btn btn-discord">
                  <Icon name="discord" size={16} /> Discord
                </a>
              </div>
            </div>
          ) : active.length === 0 && pendingDraw.length === 0 ? (
            <div className="card ga-empty">
              <span className="ga-empty-icon">
                <Icon name="trophy" size={34} />
              </span>
              <h3>No giveaway running right now</h3>
              <p className="text-2" style={{ maxWidth: 440 }}>
                New giveaways are announced in our Discord first – join to get pinged the moment one goes live. In the meantime, the daily spin is always free.
              </p>
              <div className="row wrap" style={{ justifyContent: 'center' }}>
                <a href={config.discordInvite} target="_blank" rel="noreferrer" className="btn btn-discord">
                  <Icon name="discord" size={16} /> Join Discord
                </a>
                <Link to="/spin" className="btn btn-secondary">
                  <Icon name="spin" size={16} /> Daily spin
                </Link>
              </div>
            </div>
          ) : (
            <section className="ga-section">
              <div className="section-head">
                <h2>Open now</h2>
                <p className="lead">One entry per player. The timer shows when entries close.</p>
              </div>
              <div className="ga-grid">
                {[...active, ...pendingDraw].map((g) => (
                  <GiveawayCard key={g.id} g={g} entries={entries} username={username} setUsername={setUsername} onEntered={onEntered} onEnded={load} />
                ))}
              </div>
            </section>
          )}

          {drawn.length > 0 && (
            <section className="ga-section">
              <div className="section-head">
                <h2>Recent winners</h2>
                <p className="lead">Drawn with a secure random pick – every entry has the same chance.</p>
              </div>
              <div className="ga-grid">
                {drawn.map((g) => (
                  <GiveawayCard key={g.id} g={g} entries={entries} username={username} setUsername={setUsername} onEntered={onEntered} onEnded={load} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <section className="section" style={{ paddingBottom: 0 }}>
        <div className="card pad free-split" style={{ gap: 24 }}>
          <div>
            <h3 style={{ marginBottom: 10 }}>Rules</h3>
            <ul className="stack small text-2" style={{ margin: 0, paddingLeft: 18, gap: 6 }}>
              <li>One entry per Minecraft username and per device. Alt accounts are removed.</li>
              <li>Winners are picked at random when the timer ends and listed here plus in Discord.</li>
              <li>Prizes are delivered in-game to the winning username – make sure it is spelled correctly.</li>
              <li>Unclaimed prizes (no response within 7 days) are re-drawn.</li>
            </ul>
          </div>
          <div>
            <h3 style={{ marginBottom: 10 }}>Want better odds?</h3>
            <p className="small text-2">
              Giveaways are luck – the <Link to="/spin" className="gold-text">daily spin</Link> is guaranteed free every day, and <Link to="/referral" className="gold-text">referrals</Link> earn store credit with every friend. Check the <Link to="/free" className="gold-text">free stuff hub</Link> for everything.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
