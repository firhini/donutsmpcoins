import { Fragment, type ReactNode } from 'react';
import { CopyButton } from './CopyButton';

/** Bold tokens that look like a handle / address / link get a copy chip. */
function isCopyable(v: string): boolean {
  if (/\s/.test(v) || v.length < 6) return false;
  if (/^[$€£]?\d+([.,]\d+)?\s*[A-Z]{0,4}$/.test(v)) return false; // amounts
  if (/^DC-[A-Z0-9]{6,10}$/i.test(v)) return false; // order id (shown separately)
  return true;
}

function renderLine(line: string, keyBase: number): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = keyBase;
  while ((m = re.exec(line))) {
    if (m.index > last) out.push(<Fragment key={k++}>{line.slice(last, m.index)}</Fragment>);
    const v = m[1].trim();
    if (isCopyable(v)) {
      out.push(<CopyButton key={k++} text={v} className="code-chip" label={`Copy ${v}`} iconAfter iconSize={13}>
        {v}
      </CopyButton>);
    } else {
      out.push(<strong key={k++}>{v}</strong>);
    }
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push(<Fragment key={k++}>{line.slice(last)}</Fragment>);
  return out;
}

/** Markdown-lite renderer for payment instructions: **bold**, line breaks, copyable handles. */
export function InstructionText({ text, className = '' }: { text: string; className?: string }) {
  const lines = text.replace(/\\n/g, '\n').split(/\r?\n/);
  return (
    <div className={`instr ${className}`}>
      {lines.map((ln, i) => (ln.trim() ? <p key={i}>{renderLine(ln, i * 100)}</p> : <br key={i} />))}
    </div>
  );
}
