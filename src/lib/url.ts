/** Only http(s) URLs and site-relative paths may be rendered as links (blocks javascript: etc.). */
export function safeHref(u: string | undefined | null): string | null {
  if (!u) return null;
  const v = u.trim();
  if (/^https?:\/\/[^\s]+$/i.test(v)) return v;
  if (/^\/(?!\/)[^\s]*$/.test(v)) return v;
  if (/^mailto:[^\s]+$/i.test(v)) return v;
  return null;
}

export function isExternal(u: string): boolean {
  return /^https?:\/\//i.test(u) || /^mailto:/i.test(u);
}
