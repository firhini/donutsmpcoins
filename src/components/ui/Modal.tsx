import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icons';

export function Modal({ open, onClose, title, children, size = 'md', hideClose }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl'; hideClose?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal modal-${size} fade-up`} role="dialog" aria-modal="true">
        {(title || !hideClose) && (
          <div className="modal-head">
            <div className="modal-title">{title}</div>
            {!hideClose && (
              <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
                <Icon name="close" />
              </button>
            )}
          </div>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
