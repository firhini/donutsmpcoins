import { useMemo, useState } from 'react';
import { Seo } from '../../components/ui/Seo';
import { Icon } from '../../components/ui/Icons';
import { getUsers, type AdminUserRow } from '../../lib/adminApi';
import { useAdminQuery } from '../../components/admin/hooks';
import { PageHead, Panel } from '../../components/admin/Bits';
import { DataTable, type Column } from '../../components/admin/DataTable';
import { relativeTime, usd } from '../../components/admin/adminUtils';

export default function Users() {
  const q = useAdminQuery(getUsers, []);
  const [search, setSearch] = useState('');
  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    const list = q.data?.users ?? [];
    return s ? list.filter((u) => [u.displayName, u.username, u.mcUsername ?? '', u.id].some((v) => v.toLowerCase().includes(s))) : list;
  }, [q.data, search]);

  const cols: Column<AdminUserRow>[] = [
    {
      key: 'user',
      header: 'Account',
      render: (u) => (
        <span className="adm-user">
          <img src={u.avatarUrl} alt="" width={28} height={28} style={{ borderRadius: '50%' }} referrerPolicy="no-referrer" />
          <span className="stack" style={{ gap: 0 }}>
            <strong>{u.displayName}</strong>
            <span className="muted xs">
              {u.provider === 'google' ? 'Google' : `Discord @${u.username}`} {u.provider === 'discord' && u.inGuild ? '· in server' : ''}
            </span>
          </span>
        </span>
      ),
    },
    { key: 'mc', header: 'Minecraft', render: (u) => (u.mcUsername ? <span className="mono">{u.mcUsername}</span> : <span className="muted">—</span>) },
    { key: 'joined', header: 'Joined', render: (u) => <span className="muted">{relativeTime(u.createdAt)}</span> },
    { key: 'last', header: 'Last login', render: (u) => <span className="muted">{relativeTime(u.lastLoginAt)}</span> },
    { key: 'logins', header: 'Logins', className: 'num', render: (u) => u.logins },
    { key: 'orders', header: 'Orders', className: 'num', render: (u) => u.orders },
    { key: 'prizes', header: 'Prizes', className: 'num', render: (u) => u.prizes },
    { key: 'credit', header: 'Credit', className: 'num', render: (u) => (u.creditCents ? usd(u.creditCents) : '—') },
  ];

  return (
    <div className="adm-page">
      <Seo robots="noindex,nofollow" title="Users · Admin · DonutCoins" />
      <PageHead title="Users" sub={q.data ? `${q.data.total} players logged in with Discord or Google.` : 'Everyone who logged in on the store.'}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => void q.reload(true)}>
          <Icon name="refresh" size={14} /> Refresh
        </button>
      </PageHead>
      <Panel tight>
        <div style={{ padding: 12 }}>
          <input className="input" placeholder="Search name, Minecraft name or id…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <DataTable columns={cols} rows={rows} rowKey={(u) => u.id} loading={q.loading} error={q.error} onRetry={() => void q.reload()} empty="Nobody has logged in yet." emptyIcon="👤" />
      </Panel>
    </div>
  );
}
