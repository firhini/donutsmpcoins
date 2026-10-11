import { useState, type FormEvent } from 'react';
import type { Giveaway, GiveawayEntry } from '../../shared/types';
import { Seo } from '../../components/ui/Seo';
import { Icon } from '../../components/ui/Icons';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import { createGiveaway, drawGiveaway, listAdminGiveaways, listGiveawayEntries, patchGiveaway } from '../../lib/adminApi';
import { useAction, useAdminQuery } from '../../components/admin/hooks';
import { Avatar, PageHead } from '../../components/admin/Bits';
import { DataTable, type Column } from '../../components/admin/DataTable';
import { ConfirmDialog, type ConfirmState } from '../../components/admin/ConfirmDialog';
import { GiveawayBadge } from '../../components/admin/StatusBadge';
import { Field, NumberInput, TextArea, TextInput } from '../../components/admin/Field';
import { formatDate, isoToLocalInput, localInputToIso, relativeTime } from '../../components/admin/adminUtils';

function defaultEnd(): string {
  const d = new Date(Date.now() + 7 * 86400_000);
  d.setMinutes(0, 0, 0);
  return isoToLocalInput(d.toISOString());
}

export default function Giveaways() {
  const { toast } = useToast();
  const list = useAdminQuery(listAdminGiveaways, []);
  const { run, isBusy } = useAction();
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [creating, setCreating] = useState(false);
  const [entriesFor, setEntriesFor] = useState<Giveaway | null>(null);
  const [entries, setEntries] = useState<GiveawayEntry[] | null>(null);
  const [entriesError, setEntriesError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', prize: '', endsAt: defaultEnd(), maxWinners: 1 as number | undefined, image: '' });

  const openEntries = async (g: Giveaway) => {
    setEntriesFor(g);
    setEntries(null);
    setEntriesError(null);
    try {
      setEntries(await listGiveawayEntries(g.id));
    } catch (err) {
      setEntriesError((err as Error).message);
    }
  };

  const draw = (g: Giveaway) =>
    setConfirm({
      title: `Draw ${g.maxWinners} winner${g.maxWinners === 1 ? '' : 's'} for "${g.title}"?`,
      message: `${g.entriesCount} entr${g.entriesCount === 1 ? 'y' : 'ies'}. Winners are picked with secure randomness and the giveaway is closed.`,
      confirmLabel: 'Draw winners',
      onConfirm: async () => {
        const r = await run(`draw:${g.id}`, () => drawGiveaway(g.id));
        if (!r) return;
        toast(r.winners.length ? `Winner${r.winners.length > 1 ? 's' : ''}: ${r.winners.join(', ')}` : 'Drawn – no entries', 'gold');
        void list.reload(true);
      },
    });

  const endEarly = (g: Giveaway) =>
    setConfirm({
      title: `End "${g.title}" now?`,
      message: 'No more entries are accepted. You can draw the winners afterwards.',
      confirmLabel: 'End giveaway',
      danger: true,
      onConfirm: async () => {
        const r = await run(`end:${g.id}`, () => patchGiveaway(g.id, { status: 'ended' }), 'Giveaway ended');
        if (r !== undefined) void list.reload(true);
      },
    });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const endsAt = localInputToIso(form.endsAt);
    if (!form.title.trim() || !form.prize.trim() || !endsAt) {
      toast('Title, prize and end date are required.', 'error');
      return;
    }
    if (new Date(endsAt).getTime() < Date.now()) {
      toast('The end date must be in the future.', 'error');
      return;
    }
    const created = await run('create', () =>
      createGiveaway({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        prize: form.prize.trim(),
        endsAt,
        maxWinners: Math.max(1, Math.round(form.maxWinners ?? 1)),
        image: form.image.trim() || undefined,
      }),
    );
    if (!created) return;
    toast('Giveaway created', 'success');
    setCreating(false);
    setForm({ title: '', description: '', prize: '', endsAt: defaultEnd(), maxWinners: 1, image: '' });
    void list.reload(true);
  };

  const cols: Column<Giveaway>[] = [
    {
      key: 'title',
      header: 'Giveaway',
      className: 'wrap',
      render: (g) => (
        <div>
          <strong>{g.title}</strong>
          <div className="muted xs">🎁 {g.prize}</div>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (g) => <GiveawayBadge status={g.status} /> },
    { key: 'entries', header: 'Entries', className: 'num', render: (g) => <strong>{g.entriesCount}</strong> },
    {
      key: 'ends',
      header: 'Ends',
      render: (g) => (
        <span title={formatDate(g.endsAt)}>
          {formatDate(g.endsAt, false)} <span className="muted xs">· {relativeTime(g.endsAt)}</span>
        </span>
      ),
    },
    {
      key: 'winners',
      header: 'Winners',
      className: 'wrap',
      render: (g) =>
        g.winners && g.winners.length ? (
          <div className="adm-winners">
            {g.winners.map((w) => (
              <span key={w} className="badge badge-gold">
                <Avatar name={w} size={14} /> {w}
              </span>
            ))}
          </div>
        ) : (
          <span className="muted">{g.maxWinners} to draw</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      render: (g) => (
        <div className="cell-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void openEntries(g)}>
            <Icon name="users" size={14} /> Entries
          </button>
          {g.status === 'active' && (
            <button type="button" className="btn btn-ghost btn-sm" disabled={isBusy(`end:${g.id}`)} onClick={() => endEarly(g)}>
              <Icon name="clock" size={14} /> End
            </button>
          )}
          {g.status !== 'drawn' && (
            <button type="button" className="btn btn-primary btn-sm" disabled={isBusy(`draw:${g.id}`)} onClick={() => draw(g)}>
              {isBusy(`draw:${g.id}`) ? <span className="spinner" /> : <Icon name="trophy" size={14} />} Draw
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="adm-page">
      <Seo robots="noindex,nofollow" title="Giveaways · Admin · DonutCoins" description="DonutCoins back office" />
      <PageHead title="Giveaways" sub="Players enter with their Minecraft name; you draw the winners and hand out the prize.">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => void list.reload(true)}>
          <Icon name="refresh" size={14} /> Refresh
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>
          <Icon name="plus" size={14} /> New giveaway
        </button>
      </PageHead>

      <div className="adm-panel">
        <DataTable columns={cols} rows={list.data} rowKey={(g) => g.id} loading={list.loading} error={list.error} onRetry={() => void list.reload()} empty="No giveaways yet – create one to grow your Discord." emptyIcon="🏆" minWidth={880} />
      </div>
      <p className="adm-help">Tip: after drawing, create a gift code for each winner under Coupons → Gift codes, or deliver the prize manually in-game.</p>

      <ConfirmDialog state={confirm} onClose={() => setConfirm(null)} />

      <Modal open={creating} onClose={() => setCreating(false)} title="New giveaway" size="md">
        <form className="stack" style={{ gap: 14 }} onSubmit={submit}>
          <Field label="Title" htmlFor="gw-title">
            <TextInput id="gw-title" autoFocus value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Weekend Elytra giveaway" />
          </Field>
          <Field label="Prize" htmlFor="gw-prize">
            <TextInput id="gw-prize" value={form.prize} onChange={(e) => setForm((f) => ({ ...f, prize: e.target.value }))} placeholder="1× Elytra + 10M" />
          </Field>
          <Field label="Description" optional htmlFor="gw-desc">
            <TextArea id="gw-desc" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="How to enter, rules, when winners are announced…" />
          </Field>
          <div className="adm-form-grid cols-2">
            <Field label="Ends at" htmlFor="gw-end">
              <TextInput id="gw-end" type="datetime-local" value={form.endsAt} onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))} />
            </Field>
            <Field label="Winners" htmlFor="gw-winners">
              <NumberInput id="gw-winners" value={form.maxWinners} onChange={(v) => setForm((f) => ({ ...f, maxWinners: v }))} min={1} max={100} step={1} allowEmpty={false} />
            </Field>
          </div>
          <Field label="Image path" optional hint="e.g. /img/products/elytra.svg" htmlFor="gw-img">
            <TextInput id="gw-img" className="mono" value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} placeholder="/img/products/elytra.svg" />
          </Field>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setCreating(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isBusy('create')}>
              {isBusy('create') ? <span className="spinner" /> : <Icon name="trophy" size={15} />} Create giveaway
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!entriesFor} onClose={() => setEntriesFor(null)} title={entriesFor ? `Entries · ${entriesFor.title}` : 'Entries'} size="md">
        {entriesError ? (
          <div className="alert alert-danger">{entriesError}</div>
        ) : entries === null ? (
          <div className="adm-loading">
            <span className="spinner" /> Loading entries…
          </div>
        ) : entries.length === 0 ? (
          <div className="adm-table-empty">No entries yet.</div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table" style={{ minWidth: 0 }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Entered</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr key={`${e.username}-${i}`}>
                    <td className="muted">{i + 1}</td>
                    <td>
                      <span className="adm-user">
                        <Avatar name={e.username} /> {e.username}
                        {entriesFor?.winners?.includes(e.username) && <span className="badge badge-gold">winner</span>}
                      </span>
                    </td>
                    <td className="muted">{formatDate(e.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}
