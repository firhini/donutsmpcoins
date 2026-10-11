import type { ReactNode } from 'react';
import { Icon } from '../ui/Icons';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  className?: string;
  width?: number | string;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[] | null | undefined;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  empty?: ReactNode;
  emptyIcon?: string;
  minWidth?: number;
}

/** Simple, dense data table with loading / error / empty states built in. */
export function DataTable<T>({ columns, rows, rowKey, onRowClick, rowClassName, loading, error, onRetry, empty = 'Nothing here yet.', emptyIcon = '📭', minWidth }: Props<T>) {
  const hasRows = !!rows && rows.length > 0;
  return (
    <div className="adm-table-wrap">
      <table className="adm-table" style={minWidth ? { minWidth } : undefined}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.className} style={c.width ? { width: c.width } : undefined}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hasRows &&
            rows!.map((r) => (
              <tr
                key={rowKey(r)}
                className={`${onRowClick ? 'clickable' : ''} ${rowClassName ? rowClassName(r) : ''}`}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === 'Enter' && e.target === e.currentTarget) onRowClick(r);
                      }
                    : undefined
                }
              >
                {columns.map((c) => (
                  <td key={c.key} className={c.className}>
                    {c.render(r)}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
      {loading && !hasRows && (
        <div className="adm-skel-rows" aria-busy="true" aria-label="Loading">
          <div className="skeleton" style={{ width: '70%' }} />
          <div className="skeleton" style={{ width: '85%' }} />
          <div className="skeleton" style={{ width: '60%' }} />
        </div>
      )}
      {!loading && error && !hasRows && (
        <div className="adm-table-empty">
          <div className="alert alert-danger adm-inline-error" style={{ textAlign: 'left' }}>
            <Icon name="warning" size={16} />
            <span>{error}</span>
            {onRetry && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
                <Icon name="refresh" size={14} /> Retry
              </button>
            )}
          </div>
        </div>
      )}
      {!loading && !error && !hasRows && (
        <div className="adm-table-empty">
          <div className="big" aria-hidden="true">
            {emptyIcon}
          </div>
          {empty}
        </div>
      )}
    </div>
  );
}
