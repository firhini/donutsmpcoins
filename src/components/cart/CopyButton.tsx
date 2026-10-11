import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useToast } from '../../context/ToastContext';
import { Icon } from '../ui/Icons';
import { copyText } from './cartUtils';

/** Copies `text` to the clipboard, swaps the icon to a check and toasts. */
export function CopyButton({
  text,
  label = 'Copy',
  toastMessage = 'Copied to clipboard',
  className = 'btn btn-ghost btn-sm',
  children,
  iconOnly = false,
  iconAfter = false,
  iconSize = 15,
}: {
  text: string;
  label?: string;
  toastMessage?: string;
  className?: string;
  children?: ReactNode;
  iconOnly?: boolean;
  iconAfter?: boolean;
  iconSize?: number;
}) {
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
    toast(ok ? toastMessage : 'Could not copy – please select and copy manually.', ok ? 'success' : 'error');
    if (!ok) return;
    setDone(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setDone(false), 1600);
  };
  const icon = <Icon name={done ? 'check' : 'copy'} size={iconSize} />;
  const content = iconOnly ? null : (children ?? (done ? 'Copied' : label));
  return (
    <button type="button" className={`${className} copy-btn ${done ? 'is-done' : ''}`} onClick={() => void onClick()} aria-label={iconOnly ? label : undefined} title={label}>
      {!iconAfter && icon}
      {content}
      {iconAfter && icon}
    </button>
  );
}
