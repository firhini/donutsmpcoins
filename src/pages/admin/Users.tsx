import { useMemo, useState } from 'react';
import { Seo } from '../../components/ui/Seo';
import { Icon } from '../../components/ui/Icons';
import { getUsers, type AdminUserRow } from '../../lib/adminApi';
import { useAdminQuery } from '../../components/admin/hooks';
import { PageHead, Panel } from '../../components/admin/Bits';
import { DataTable, type Column } from '../../components/admin/DataTable';
import { relativeTime, usd } from '../../components/admin/adminUtils';

type Filter = 'all' | 'accounts' | 'guests' | 'buyers';

const FILTERS: { id: Filter; label: string; test: (u: AdminUserRow) => boolean }[] = [
  { id: 'all', label: 'Everyone', test: () => true },
  { id: 'accounts', label: 'Accounts', test: (u) => u.provider !== 'guest' },
  { id: 'guests', label: 'Guest buyers', test: (u) => u.provider === 'guest' },
  { id: 'buyers', label: 'Paid at least once', test: (u) => (u.paidOrders ?? 0) > 0 },
];

function providerLabel(u: AdminUserRow): string {
  if (u.provider === 'guest') return 'No account · ordered as guest';
  if (u.provider === 'google') return 'Google';
  return `Discord @${u.username}${u.inGuild ? ' · in server' : ''}`;
}

export default function Users() {
  const q = useAdminQuery(getUsers, []);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const list = useMemo(() => q.data?.users ?? [], [q.data]);
  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.id, list.filter(f.test).length])) as Record<Filter, number>, [list]);
  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    const test = FILTERS.find((f) => f.id === filter)!.test;
    return list.filter(test).filter((u) => !s || [u.displayName, u.username, u.mcUsername ?? '', u.id].some((v) => v.toLowerCase().includes(s)));
  }, [list, search, filter]);

  const cols: Column<AdminUserRow>[] = [
    {
      key: 'user',
      header: 'Player',
      render: (u) => (
        <span className="adm-user">
          <img src={u.avatarUrl} alt="" width={28} height={28} style={{ borderRadius: u.provider === 'guest' ? 4 : '50%' }} referrerPolicy="no-referrer" loading="lazy" />
          <span className="stack" style={{ gap: 0 }}>
            <strong>{u.displayName}</strong>
            <span className="muted xs">{providerLabel(u)}</span>
          </span>
        </span>
      ),
    },
    { key: 'mc', header: 'Minecraft', render: (u) => (u.mcUsername ? <span className="mono">{u.mcUsername}</span> : <span className="muted">—</span>) },
    { key: 'joined', header: 'First seen', render: (u) => <span className="muted">{u.createdAt ? relativeTime(u.createdAt) : '—'}</span> },
    { key: 'last', header: 'Last active', render: (u) => <span className="muted">{relativeTime((u.lastOrderAt ?? '') > (u.lastLoginAt ?? '') ? u.lastOrderAt! : u.lastLoginAt)}</span> },
    { key: 'orders', header: 'Orders', className: 'num', render: (u) => (u.orders ? <span title={`${u.paidOrders ?? 0} paid`}>{u.paidOrders ?? 0}/{u.orders}</span> : <span className="muted">0</span>) },
    { key: 'spent', header: 'Spent', className: 'num', render: (u) => (u.spentCents ? <strong>{usd(u.spentCents)}</strong> : <span className="muted">—</span>) },
    { key: 'free', header: 'Prizes', className: 'num', render: (u) => Math.max(u.prizes, u.freeOrders ?? 0) || <span className="muted">0</span> },
    { key: 'credit', header: 'Credit', className: 'num', render: (u) => (u.creditCents ? usd(u.creditCents) : '—') },
  ];

  const sub = q.data
    ? `${q.data.total} players – ${q.data.accounts ?? counts.accounts} with a Discord/Google account, ${q.data.guests ?? counts.guests} who only ordered as guest. Orders = paid / placed (free prizes not counted).`
    : 'Everyone who logged in or ordered on the store.';

  return (
    <div className="adm-page">
      <Seo robots="noindex,nofollow" title="Users · Admin · DonutCoins" />
      <PageHead title="Users" sub={sub}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => void q.reload(true)}>
          <Icon name="refresh" size={14} /> Refresh
        </button>
      </PageHead>
      <div className="adm-tabs" role="tablist">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} className={`adm-tab ${filter === f.id ? 'active' : ''}`} onClick={() => setFilter(f.id)}>
            {f.label} <span className="muted xs">{counts[f.id]}</span>
          </button>
        ))}
      </div>
      <Panel tight>
        <div style={{ padding: 12 }}>
          <input className="input" placeholder="Search name, Minecraft name or id…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <DataTable columns={cols} rows={rows} rowKey={(u) => u.id} loading={q.loading} error={q.error} onRetry={() => void q.reload()} empty="Nobody here yet." emptyIcon="👤" />
      </Panel>
    </div>
  );
}
