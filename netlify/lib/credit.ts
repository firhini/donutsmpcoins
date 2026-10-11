import type { CreditAccount } from '../../src/shared/types';
import { kvGet, kvSet } from './store';
import { nowIso } from './http';

export function creditKey(username: string): string {
  return username.trim().toLowerCase();
}

export async function getCredit(username: string): Promise<CreditAccount> {
  const key = creditKey(username);
  return (await kvGet<CreditAccount>('credit', key)) ?? { username: key, balanceCents: 0, history: [] };
}

export async function addCredit(username: string, deltaCents: number, reason: string, orderId?: string): Promise<CreditAccount> {
  const acc = await getCredit(username);
  acc.balanceCents = Math.max(0, acc.balanceCents + deltaCents);
  acc.history.unshift({ at: nowIso(), deltaCents, reason, orderId });
  acc.history = acc.history.slice(0, 100);
  await kvSet('credit', acc.username, acc);
  return acc;
}
