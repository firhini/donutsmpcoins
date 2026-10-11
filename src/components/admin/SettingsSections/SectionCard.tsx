import { useState, type ReactNode } from 'react';
import type { SiteSettings } from '../../../shared/types';
import { Icon } from '../../ui/Icons';
import { useDraft } from '../hooks';

export type SaveFn = (patch: Partial<SiteSettings>) => Promise<boolean>;

interface Props<T> {
  id: string;
  title: string;
  icon?: string;
  sub?: ReactNode;
  /** the server value of this section */
  value: T;
  /** turn the edited draft into a deep-partial PUT body */
  toPatch: (draft: T) => Partial<SiteSettings>;
  /** optional validation – return a message to block saving */
  validate?: (draft: T) => string | null;
  onSave: SaveFn;
  children: (draft: T, set: (u: T | ((d: T) => T)) => void) => ReactNode;
}

/**
 * One settings section = one panel with its own local draft and Save / Reset footer.
 * Only this section's keys are sent (deep partial PUT), so sections never clobber each other.
 */
export function SectionCard<T>({ id, title, icon, sub, value, toPatch, validate, onSave, children }: Props<T>) {
  const { draft, setDraft, dirty, reset } = useDraft(value);
  const [saving, setSaving] = useState(false);
  const problem = validate ? validate(draft) : null;

  const save = async () => {
    if (!dirty || problem) return;
    setSaving(true);
    try {
      await onSave(toPatch(draft));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="adm-panel" id={id}>
      <div className="adm-panel-head">
        <div>
          <h3>
            {icon && <Icon name={icon} size={16} />}
            {title}
          </h3>
          {sub && <div className="sub">{sub}</div>}
        </div>
        {dirty && <span className="badge badge-gold">unsaved</span>}
      </div>
      <div className="adm-panel-body">{children(draft, setDraft)}</div>
      <div className="adm-panel-foot">
        <span className={`status ${dirty ? 'dirty' : ''}`}>{problem ? <span className="danger-text">{problem}</span> : dirty ? 'You have unsaved changes.' : 'Saved.'}</span>
        <button type="button" className="btn btn-ghost btn-sm" disabled={!dirty || saving} onClick={reset}>
          Reset
        </button>
        <button type="button" className="btn btn-primary btn-sm" disabled={!dirty || saving || !!problem} onClick={() => void save()}>
          {saving ? <span className="spinner" /> : <Icon name="check" size={14} />} Save {title.toLowerCase()}
        </button>
      </div>
    </section>
  );
}
