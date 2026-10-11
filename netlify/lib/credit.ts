import type { CreditAccount } from '../../src/shared/types';
import { kvGet, kvUpdate } from './store';
import { HttpError, nowIso } from './http';

export function creditKey(username: string): string {
  return username.trim().toLowerCase();
}

export async function getCredit(username: string): Promise<CreditAccount> {
  const key = creditKey(username);
  return (await kvGet<CreditAccount>('credit', key)) ?? { username: key, balanceCents: 0, history: [] };
}

function fresh(key: string): CreditAccount {
  return { username: key, balanceCents: 0, history: [] };
}

/** Add (or, with a negative delta, remove – clamped at 0) store credit atomically. */
export async function addCredit(username: string, deltaCents: number, reason: string, orderId?: string): Promise<CreditAccount> {
  const key = creditKey(username);
  return kvUpdate<CreditAccount>('credit', key, (cur) => {
    const acc = cur ?? fresh(key);
    acc.balanceCents = Math.max(0, acc.balanceCents + deltaCents);
    acc.history.unshift({ at: nowIso(), deltaCents, reason, orderId });
    acc.history = acc.history.slice(0, 100);
    return acc;
  });
}

/**
 * Debit store credit atomically. Fails (409) when the balance is insufficient
 * at the moment of the write – so concurrent checkouts cannot spend the same
 * credit twice.
 */
export async function debitCredit(username: string, amountCents: number, reason: string, orderId?: string): Promise<CreditAccount> {
  const key = creditKey(username);
  if (amountCents <= 0) return getCredit(username);
  return kvUpdate<CreditAccount>('credit', key, (cur) => {
    const acc = cur ?? fresh(key);
    if (acc.balanceCents < amountCents) {
      throw new HttpError(409, `Not enough store credit – your balance is $${(acc.balanceCents / 100).toFixed(2)}. Please refresh the checkout.`, 'insufficient_credit');
    }
    acc.balanceCents -= amountCents;
    acc.history.unshift({ at: nowIso(), deltaCents: -amountCents, reason, orderId });
    acc.history = acc.history.slice(0, 100);
    return acc;
  });
}
