import { randomBytes, randomInt } from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I

export function randomCode(length = 6): string {
  let out = '';
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(0, ALPHABET.length)];
  return out;
}

export function orderId(): string {
  return `DC-${randomCode(6)}`;
}

export function couponCode(prefix = 'SPIN'): string {
  return `${prefix}-${randomCode(4)}${randomCode(4)}`;
}

export function uuid(): string {
  return randomBytes(16).toString('hex');
}

/** Secure random integer in [0, max) */
export function secureInt(max: number): number {
  return randomInt(0, Math.max(1, max));
}

/** Weighted random pick; returns index */
export function weightedIndex(weights: number[]): number {
  const total = weights.reduce((a, b) => a + Math.max(0, b), 0);
  if (total <= 0) return 0;
  // use 1e6 resolution
  let r = (randomInt(0, 1_000_000) / 1_000_000) * total;
  for (let i = 0; i < weights.length; i++) {
    r -= Math.max(0, weights[i]);
    if (r < 0) return i;
  }
  return weights.length - 1;
}
