import { createElement, lazy, type ComponentType, type FC } from 'react';

export type PreloadablePage = FC & {
  /** load the page module (cached) – resolves once the component can render synchronously */
  preload: () => Promise<void>;
};

/**
 * `React.lazy` with a `preload()` hook. Once preloaded, the page renders
 * synchronously instead of suspending.
 *
 * Why: pre-rendered pages are hydrated. If the page component suspends during
 * hydration and a context above it changes right after mount (store config,
 * cart, auth), React gives up on the server HTML, shows the Suspense fallback
 * and re-renders the page client-side – a visible spinner and a large layout
 * shift on every page load. Preloading the current route's module before
 * `hydrateRoot` (see main.tsx) means nothing suspends and the HTML is reused.
 */
export function lazyPage(loader: () => Promise<{ default: ComponentType }>): PreloadablePage {
  let loaded: ComponentType | null = null;
  let pending: Promise<{ default: ComponentType }> | null = null;
  const load = () => {
    if (!pending) {
      pending = loader().then((m) => {
        loaded = m.default;
        return m;
      });
    }
    return pending;
  };
  const Lazy = lazy(load);
  const Page: FC = () => (loaded ? createElement(loaded) : createElement(Lazy));
  return Object.assign(Page, { preload: () => load().then(() => undefined) });
}
