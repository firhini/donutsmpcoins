/** Discord bot: status, invite link, slash-command registration and one-click server setup. */
import { useEffect, useState } from 'react';
import { Icon } from '../../ui/Icons';
import { useToast } from '../../../context/ToastContext';
import { errorMessage, getDiscordBot, registerDiscordCommands, runDiscordSetup, type DiscordBotStatus } from '../../../lib/adminApi';
import { CopyButton } from '../Bits';

export function DiscordBotSection() {
  const { toast } = useToast();
  const [s, setS] = useState<DiscordBotStatus | null>(null);
  const [busy, setBusy] = useState<'register' | 'setup' | null>(null);
  const load = () => void getDiscordBot().then(setS, (e) => toast(errorMessage(e), 'error'));
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (kind: 'register' | 'setup') => {
    setBusy(kind);
    try {
      if (kind === 'register') {
        const r = await registerDiscordCommands();
        toast(`Registered: /${r.registered.join(', /')}`, 'success');
      } else {
        let created = 0;
        let r = await runDiscordSetup();
        created += r.created.length;
        for (let i = 0; !r.done && i < 30; i++) {
          r = await runDiscordSetup(); // continues where the last slice stopped
          created += r.created.length;
        }
        if (!r.done) throw new Error('Setup did not finish – press the button again to continue.');
        toast(`Server set up – ${r.channels} channels${created ? ` (${created} new items)` : ''}`, 'success');
      }
      load();
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="adm-panel" id="discord">
      <div className="adm-panel-head">
        <div>
          <h3>
            <Icon name="discord" size={16} />
            Discord bot
          </h3>
          <div className="sub">Creates channels, roles and panels in your server (/setup), self-roles, tickets, balance checks, restock pings and the Customer role.</div>
        </div>
      </div>
      <div className="adm-panel-body">
      {!s ? (
        <p className="muted small">Loading…</p>
      ) : (
        <div className="stack" style={{ gap: 12 }}>
          {s.missing.length > 0 && (
            <div className="alert alert-warn">
              Missing in Netlify: <strong>{s.missing.join(', ')}</strong> – add them and redeploy.
            </div>
          )}
          <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="small">Interactions Endpoint URL:</span>
            <code className="kbd">{s.interactionsUrl}</code>
            <CopyButton text={s.interactionsUrl} />
          </div>
          {s.inviteUrl && (
            <a className="btn btn-secondary btn-sm" href={s.inviteUrl} target="_blank" rel="noreferrer" style={{ alignSelf: 'flex-start' }}>
              <Icon name="discord" size={14} /> Invite / re-invite bot (Administrator)
            </a>
          )}
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary" disabled={!s.configured || !!busy} onClick={() => void act('register')}>
              {busy === 'register' ? 'Registering…' : '1. Register /setup command'}
            </button>
            <button type="button" className="btn btn-primary" disabled={!s.configured || !!busy} onClick={() => void act('setup')}>
              {busy === 'setup' ? 'Building server… (up to a minute)' : '2. Run setup now'}
            </button>
          </div>
          <p className="xs muted">
            {s.setupAt ? `Last setup ${new Date(s.setupAt).toLocaleString()} · ${s.channels} channels · ${s.roles} roles. Running it again refreshes everything without duplicates.` : 'Not set up yet.'}
          </p>
        </div>
      )}
      </div>
    </section>
  );
}
