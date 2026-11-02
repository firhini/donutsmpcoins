import type { OrderItem, Product } from '../shared/types';

const MONEY_LINE = /^\d+(\.\d+)?[MB] Money/i;

/** True when everything in the order is plain money (paid with /pay, no hand-over needed). */
export function isMoneyOnly(items: Pick<OrderItem, 'kind' | 'productId' | 'rolled'>[], productById: (id: string) => Product | undefined): boolean {
  return items.every((i) => {
    if (i.kind === 'money') return true;
    if (i.kind !== 'box') return false;
    // money crates: rolled lines (once visible) or the box pool itself are all money
    const names = i.rolled?.length ? i.rolled.flat().map((d) => d.name) : (productById(i.productId)?.contents ?? []).map((c) => c.name);
    return names.length > 0 && names.every((n) => MONEY_LINE.test(n));
  });
}
