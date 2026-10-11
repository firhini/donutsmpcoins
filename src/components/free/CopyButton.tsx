import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '../ui/Icons';

/** Copies text to the clipboard (with a fallback for older browsers). Returns [copied, copy]. */
export function useCopy(resetMs = 1800): [boolean, (text: string) => Promise<boolean>] {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = useCallback(
    async (text: string) => {
      let ok = false;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          ok = true;
        }
      } catch {
        ok = false;
      }
      if (!ok) {
        try {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.setAttribute('readonly', '');
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          ok = document.execCommand('copy');
          document.body.removeChild(ta);
        } catch {
          ok = false;
        }
      }
      if (ok) {
        setCopied(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(false), resetMs);
      }
      return ok;
    },
    [resetMs],
  );
  return [copied, copy];
}

export function CopyButton({ text, label = 'Copy', copiedLabel = 'Copied', className = 'btn btn-secondary btn-sm', iconOnly, onCopied }: { text: string; label?: string; copiedLabel?: string; className?: string; iconOnly?: boolean; onCopied?: () => void }) {
  const [copied, copy] = useCopy();
  return (
    <button
      type="button"
      className={`${className} fcopy-btn ${copied ? 'copied' : ''}`}
      onClick={async () => {
        if (await copy(text)) onCopied?.();
      }}
      aria-label={iconOnly ? (copied ? copiedLabel : `${label} ${text}`) : undefined}
      title={iconOnly ? label : undefined}
    >
      <Icon name={copied ? 'check' : 'copy'} size={16} />
      {!iconOnly && (copied ? copiedLabel : label)}
    </button>
  );
}
