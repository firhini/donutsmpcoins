import { isValidElement, type ReactNode } from 'react';

/** Flatten a ReactNode (strings, numbers, elements with children) into plain text – used for FAQ structured data. */
export function nodeText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join('');
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode };
    return nodeText(props.children);
  }
  return '';
}

export function cleanText(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}
