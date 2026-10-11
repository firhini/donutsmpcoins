/** Tiny presentational bits used across admin pages: avatar, copy button, panel, loading/error blocks. */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useToast } from '../../context/ToastContext';
import { Icon } from '../ui/Icons';
import { avatarUrl, copyText } from './adminUtils';

export function Avatar({ name, size = 24, className = '' }: { name: string; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed || !name) {
    return (
      <span className={`adm-avatar ${className}`} style={{ width: size, height: size, display: 'inline-grid', placeItems: 'center', color: 'var(--text-3)' }} aria-hidden="true">
        <Icon name="user" size={Math.round(size * 0.6)} />
      </span>
    );
  }
  return <img className={`adm-avatar ${className}`} src={avatarUrl(name, size <= 32 ? 32 : 64)} width={size} height={size} alt="" loading="lazy" onError={() => setFailed(true)} />;
}

export function CopyButton({ text, label = 'Copy', className = 'btn btn-ghost btn-sm', iconOnly = false, children }: { text: string; label?: string; className?: string; iconOnly?: boolean; children?: ReactNode }) {
  const { toast } = useToast();
  const [done, setDone] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );
  const onClick = async () => {
    const ok = await copyText(text);
    if (!ok) {
      toast('Could not copy – select and copy manually.', 'error');
      return;
    }
    setDone(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setDone(false), 1500);
  };
  return (
    <button type="button" className={className} onClick={() => void onClick()} aria-label={iconOnly ? label : undefined} title={label} style={done ? { color: 'var(--mint-400)' } : undefined}>
      <Icon name={done ? 'check' : 'copy'} size={14} />
      {!iconOnly && (children ?? (done ? 'Copied' : label))}
    </button>
  );
}

export function Panel({ title, sub, actions, children, tight, className = '', id, icon }: { title?: ReactNode; sub?: ReactNode; actions?: ReactNode; children: ReactNode; tight?: boolean; className?: string; id?: string; icon?: string }) {
  return (
    <section className={`adm-panel ${className}`} id={id}>
      {(title || actions) && (
        <div className="adm-panel-head">
          <div>
            <h3>
              {icon && <Icon name={icon} size={16} />}
              {title}
            </h3>
            {sub && <div className="sub">{sub}</div>}
          </div>
          {actions && <div className="row" style={{ gap: 6 }}>{actions}</div>}
        </div>
      )}
      <div className={`adm-panel-body ${tight ? 'tight' : ''}`}>{children}</div>
    </section>
  );
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="adm-loading" role="status">
      <span className="spinner" /> {label}
    </div>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="alert alert-danger adm-inline-error" role="alert">
      <Icon name="warning" size={16} />
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
          <Icon name="refresh" size={14} /> Retry
        </button>
      )}
    </div>
  );
}

export function PageHead({ title, sub, children }: { title: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="adm-page-head">
      <div>
        <h2>{title}</h2>
        {sub && <div className="sub">{sub}</div>}
      </div>
      {children && <div className="adm-page-actions">{children}</div>}
    </div>
  );
}

export function Stars({ rating }: { rating: number }) {
  return (
    <span className="adm-stars" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width="14" height="14" viewBox="0 0 24 24" className={n <= rating ? '' : 'off'} aria-hidden="true">
          <path fill="currentColor" d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2Z" />
        </svg>
      ))}
    </span>
  );
}

export function ProductThumb({ src, alt = '', sm }: { src?: string; alt?: string; sm?: boolean }) {
  const [s, setS] = useState(src || '/img/products/_fallback.svg');
  useEffect(() => setS(src || '/img/products/_fallback.svg'), [src]);
  return (
    <span className={`adm-thumb ${sm ? 'adm-thumb-sm' : ''}`}>
      <img src={s} alt={alt} loading="lazy" onError={() => setS('/img/products/_fallback.svg')} />
    </span>
  );
}
