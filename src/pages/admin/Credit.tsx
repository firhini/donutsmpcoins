import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { CreditAccount } from '../../shared/types';
import { Seo } from '../../components/ui/Seo';
import { Icon } from '../../components/ui/Icons';
import { useToast } from '../../context/ToastContext';
import { adjustCredit, errorMessage, getCreditAccount } from '../../lib/adminApi';
import { useAction } from '../../components/admin/hooks';
import { Avatar, ErrorBlock, PageHead, Panel } from '../../components/admin/Bits';
import { Field, MoneyInput, SelectInput, TextInput } from '../../components/admin/Field';
import { formatDate, usd } from '../../components/admin/adminUtils';

const MC_RE = /^[A-Za-z0-9_]{3,16}$/;

export default function Credit() {
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [username, setUsername] = useState(params.get('u') ?? '');
  const [account, setAccount] = useState<CreditAccount | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [looking, setLooking] = useState(false);
  const { run, isBusy } = useAction();
  const [form, setForm] = useState({ direction: 'add' as 'add' | 'remove', amountCents: null as number | null, reason: '' });

  const lookup = async (name = username) => {
    const n = name.trim();
    if (!MC_RE.test(n)) {
      setLookupError('Enter a valid Minecraft username (3–16 letters, numbers, underscores).');
      return;
    }
    setLooking(true);
    setLookupError(null);
    try {
      setAccount(await getCreditAccount(n));
      const next = new URLSearchParams(params);
      next.set('u', n);
      setParams(next, { replace: true });
    } catch (err) {
      setAccount(null);
      setLookupError(errorMessage(err));
    } finally {
      setLooking(false);
    }
  };

  const submitLookup = (e: FormEvent) => {
    e.preventDefault();
    void lookup();
  };

  const submitAdjust = async (e: FormEvent) => {
    e.preventDefault();
    if (!account) return;
    if (!form.amountCents || form.amountCents <= 0) {
      toast('Enter an amount.', 'error');
      return;
    }
    if (!form.reason.trim()) {
      toast('Add a short reason – it is shown in the history.', 'error');
      return;
    }
    const delta = form.direction === 'add' ? form.amountCents : -form.amountCents;
    const updated = await run('adjust', () => adjustCredit({ username: account.username, deltaCents: delta, reason: form.reason.trim() }), `${form.direction === 'add' ? 'Added' : 'Removed'} ${usd(form.amountCents)}`);
    if (!updated) return;
    setAccount(updated);
    setForm({ direction: 'add', amountCents: null, reason: '' });
  };

  return (
    <div className="adm-page">
      <Seo robots="noindex,nofollow" title="Store credit · Admin · DonutCoins" description="DonutCoins back office" />
      <PageHead title="Store credit" sub="Credit is applied automatically at checkout. Referral rewards land here too." />

      <Panel title="Look up a player" icon="search">
        <form className="row wrap" style={{ gap: 10 }} onSubmit={submitLookup}>
          <div style={{ flex: '1 1 220px', maxWidth: 360 }}>
            <TextInput value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Minecraft username" aria-label="Minecraft username" autoFocus />
          </div>
          <button type="submit" className="btn btn-primary" disabled={looking || !username.trim()}>
            {looking ? <span className="spinner" /> : <Icon name="search" size={15} />} Look up
          </button>
        </form>
        {lookupError && (
          <div style={{ marginTop: 12 }}>
            <ErrorBlock message={lookupError} onRetry={() => void lookup()} />
          </div>
        )}
      </Panel>

      {account && (
        <div className="adm-cols adm-cols-main">
          <div className="adm-stack">
            <Panel
              title={
                <span className="row" style={{ gap: 8 }}>
                  <Avatar name={account.username} size={28} /> {account.username}
                </span>
              }
              actions={
                <Link to={`/admin/orders?q=${encodeURIComponent(account.username)}`} className="btn btn-ghost btn-sm">
                  Orders <Icon name="arrowRight" size={14} />
                </Link>
              }
            >
              <div className="muted xs" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                Balance
              </div>
              <div className="adm-balance">{usd(account.balanceCents)}</div>
            </Panel>

            <Panel title="History" icon="clock" sub="Newest first (last 100 entries).">
              {account.history.length === 0 ? (
                <div className="muted small">No credit movements yet.</div>
              ) : (
                <div className="adm-history">
                  {account.history.map((h, i) => (
                    <div key={i}>
                      <div>
                        <div className="small">{h.reason}</div>
                        <div className="muted xs">
                          {formatDate(h.at)}
                          {h.orderId && (
                            <>
                              {' · '}
                              <Link to={`/admin/orders/${h.orderId}`} className="adm-id">
                                {h.orderId}
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                      <span className={`delta ${h.deltaCents < 0 ? 'neg' : 'pos'}`}>
                        {h.deltaCents < 0 ? '−' : '+'}
                        {usd(Math.abs(h.deltaCents))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <Panel title="Adjust balance" icon="coin" sub="Goodwill, refunds as credit, prizes…">
            <form className="stack" style={{ gap: 12 }} onSubmit={submitAdjust}>
              <div className="adm-form-grid cols-2">
                <Field label="Action" htmlFor="cr-dir">
                  <SelectInput id="cr-dir" value={form.direction} onChange={(e) => setForm((f) => ({ ...f, direction: e.target.value as 'add' | 'remove' }))}>
                    <option value="add">Add credit</option>
                    <option value="remove">Remove credit</option>
                  </SelectInput>
                </Field>
                <Field label="Amount (USD)" htmlFor="cr-amt">
                  <MoneyInput id="cr-amt" valueCents={form.amountCents} onChange={(c) => setForm((f) => ({ ...f, amountCents: c }))} />
                </Field>
              </div>
              <Field label="Reason" htmlFor="cr-reason">
                <TextInput id="cr-reason" value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} placeholder="e.g. Sorry for the delay" maxLength={120} />
              </Field>
              <div className="row wrap" style={{ gap: 6 }}>
                {[100, 250, 500, 1000].map((c) => (
                  <button key={c} type="button" className="adm-chip" onClick={() => setForm((f) => ({ ...f, amountCents: c }))}>
                    {usd(c)}
                  </button>
                ))}
              </div>
              <button type="submit" className={`btn ${form.direction === 'add' ? 'btn-primary' : 'btn-danger'}`} disabled={isBusy('adjust')}>
                {isBusy('adjust') ? <span className="spinner" /> : <Icon name={form.direction === 'add' ? 'plus' : 'minus'} size={15} />}
                {form.direction === 'add' ? 'Add credit' : 'Remove credit'}
              </button>
              <p className="adm-help">Balances never go below $0.00. The player sees their balance on the referral page and at checkout.</p>
            </form>
          </Panel>
        </div>
      )}
    </div>
  );
}
