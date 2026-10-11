import type { ReactNode } from 'react';
import { Modal } from '../ui/Modal';

export interface ConfirmState {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({ state, onClose, busy }: { state: ConfirmState | null; onClose: () => void; busy?: boolean }) {
  return (
    <Modal open={!!state} onClose={onClose} title={state?.title} size="sm">
      {state && (
        <div className="stack">
          {state.message && <div className="text-2 small">{state.message}</div>}
          <div className="row" style={{ justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
              Keep it
            </button>
            <button
              type="button"
              className={`btn ${state.danger ? 'btn-danger' : 'btn-primary'}`}
              disabled={busy}
              onClick={() => {
                void Promise.resolve(state.onConfirm()).then(onClose);
              }}
            >
              {busy && <span className="spinner" />}
              {state.confirmLabel ?? 'Confirm'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
