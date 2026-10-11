/** Small inline SVG icon set (stroke icons, 24px grid). Usage: <Icon name="cart" /> */
import type { SVGProps } from 'react';

const paths: Record<string, string> = {
  cart: 'M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 7H6M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'M6 6l12 12M18 6L6 18',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.3-4.3',
  check: 'M20 6 9 17l-5-5',
  chevron: 'm6 9 6 6 6-6',
  chevronRight: 'm9 6 6 6-6 6',
  arrowRight: 'M5 12h14m-6-6 6 6-6 6',
  star: 'm12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2Z',
  bolt: 'M13 2 3 14h9l-1 8 10-12h-9l1-8Z',
  gift: 'M20 12v10H4V12M22 7H2v5h20V7ZM12 22V7m0 0H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7Zm0 0h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7Z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-14v4l3 3',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm14 10v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  discord: 'M19.5 5.5A16 16 0 0 0 15.6 4l-.5 1a14 14 0 0 0-6.2 0l-.5-1a16 16 0 0 0-3.9 1.5C2 9.2 1.4 12.8 1.7 16.3a16 16 0 0 0 4.8 2.4l1-1.6a10 10 0 0 1-1.6-.8l.4-.3a11.5 11.5 0 0 0 11.4 0l.4.3-1.6.8 1 1.6a16 16 0 0 0 4.8-2.4c.4-4-.7-7.6-2.8-10.8ZM8.7 14.1c-.9 0-1.7-.9-1.7-1.9s.7-1.9 1.7-1.9 1.7.9 1.7 1.9-.8 1.9-1.7 1.9Zm6.6 0c-.9 0-1.7-.9-1.7-1.9s.7-1.9 1.7-1.9 1.7.9 1.7 1.9-.8 1.9-1.7 1.9Z',
  coin: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-16v8m-3-6h4.5a2 2 0 0 1 0 4H9m0 0h4.5a2 2 0 0 1 0 4H9m3 0v2',
  box: 'm21 8-9-5-9 5v8l9 5 9-5V8Zm-9 5 9-5m-9 5L3 8m9 5v8',
  copy: 'M8 8h12v12H8V8Zm-4 8V4h12',
  external: 'M14 4h6v6m0-6L10 14M20 14v6H4V4h6',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-6v-4m0-4h.01',
  warning: 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0ZM12 9v4m0 4h.01',
  trash: 'M3 6h18M8 6V4h8v2m-7 5v6m4-6v6M5 6l1 14h12l1-14',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  spin: 'M21 12a9 9 0 1 1-3-6.7M21 3v6h-6',
  trophy: 'M8 21h8m-4-4v4m-6-17h12v5a6 6 0 0 1-12 0V4Zm-4 2h4v3a4 4 0 0 1-4-4V6Zm20 0h-4v3a4 4 0 0 0 4-4V6Z',
  ticket: 'M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Zm10-4v14',
  share: 'M4 12v8h16v-8M16 6l-4-4-4 4m4-4v13',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m8-9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  lock: 'M5 11h14v10H5V11Zm3 0V7a4 4 0 0 1 8 0v4',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-1.7-1L14.8 3H9.2l-.4 2.5a7.4 7.4 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.4 7.4 0 0 0 1.7 1l.4 2.5h5.6l.4-2.5a7.4 7.4 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6c.1-.3.1-.7.1-1Z',
  truck: 'M1 3h15v13H1V3Zm15 5h4l3 4v4h-7V8ZM5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm13 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  card: 'M2 5h20v14H2V5Zm0 4h20M6 15h4',
  sparkles: 'm12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Zm7 11 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14ZM5 15l.7 1.6L7.3 17l-1.6.7L5 19.3l-.7-1.6L2.7 17l1.6-.4L5 15Z',
  refresh: 'M3 12a9 9 0 0 1 15.5-6.3L21 8M21 3v5h-5m5 4a9 9 0 0 1-15.5 6.3L3 16m0 5v-5h5',
  home: 'M3 11 12 3l9 8v10h-6v-6H9v6H3V11Z',
  tag: 'M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8ZM7 7h.01',
  eye: 'M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Zm11 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9',
  mail: 'M3 5h18v14H3V5Zm0 0 9 7 9-7',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z',
  play: 'M6 4v16l14-8L6 4Z',
  server: 'M3 4h18v6H3V4Zm0 10h18v6H3v-6Zm4-7h.01M7 17h.01',
  pickaxe: 'M14 10 4 20m10-10 4-4m-4 4L10 6M21 7c-2.5-2.5-6-3.5-9.5-3L20 12.5c.5-3.5-.5-7-3-9.5l4 4Z',
  flame: 'M12 22c4.4 0 8-3.4 8-7.5 0-3.2-2-5.5-3.5-7.5-.4 2-1.5 3-2.5 3.5C14.5 7 13 4 10 2c.5 3-1 5.5-3 7.5C5 11.5 4 13 4 14.5 4 18.6 7.6 22 12 22Z',
  image: 'M3 5h18v14H3V5Zm4 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm14 7-5-5-7 7m-4 0 3-3 2 2',
  download: 'M12 3v12m0 0 4-4m-4 4-4-4M4 17v3h16v-3',
  dollar: 'M12 2v20m5-16H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  percent: 'M19 5 5 19M7.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm9 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  package: 'M16.5 9.4 7.5 4.2M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7Zm-17.7-7.3L12 12l8.7-5M12 22V12',
};

export type IconName = keyof typeof paths;

export function Icon({ name, size = 18, strokeWidth = 2, ...rest }: { name: IconName | string; size?: number; strokeWidth?: number } & SVGProps<SVGSVGElement>) {
  const d = paths[name] ?? paths.info;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      <path d={d} />
    </svg>
  );
}
