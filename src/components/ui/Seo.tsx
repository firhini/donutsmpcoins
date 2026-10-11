import { useEffect } from 'react';

/** Sets document title / meta description per page (no extra deps). */
export function Seo({ title, description }: { title: string; description?: string }) {
  useEffect(() => {
    const prev = document.title;
    document.title = title;
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    const prevDesc = meta?.content;
    if (description) {
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'description';
        document.head.appendChild(meta);
      }
      meta.content = description;
    }
    return () => {
      document.title = prev;
      if (meta && prevDesc !== undefined) meta.content = prevDesc;
    };
  }, [title, description]);
  return null;
}
