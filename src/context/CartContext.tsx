import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CartLineInput, Product, Quote } from '../shared/types';
import { clampQty, computeQuote } from '../shared/pricing';
import { storageGet, storageSet } from '../lib/device';
import { useStore } from './StoreContext';
import { useToast } from './ToastContext';

export interface CartLine extends CartLineInput {
  product: Product;
}

interface CartApi {
  items: CartLineInput[];
  lines: CartLine[];
  /** number of distinct lines (badge) */
  count: number;
  /** sum of quantities */
  totalQty: number;
  add: (productId: string, qty?: number, opts?: { silent?: boolean; open?: boolean }) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  /** local preview quote (sale + spending tiers only; coupons are applied server-side at checkout) */
  quote: Quote;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  /** coupon / referral codes the customer typed – persisted for checkout */
  discountCode: string;
  setDiscountCode: (c: string) => void;
  referralCode: string;
  setReferralCode: (c: string) => void;
}

const Ctx = createContext<CartApi | null>(null);
const KEY = 'dc_cart_v1';

export function CartProvider({ children }: { children: ReactNode }) {
  const { products, config, productById } = useStore();
  const { toast } = useToast();
  const [items, setItems] = useState<CartLineInput[]>(() => storageGet<CartLineInput[]>(KEY, []));
  const [isOpen, setOpen] = useState(false);
  const [discountCode, setDiscountCodeState] = useState<string>(() => storageGet<string>('dc_discount', ''));
  const [referralCode, setReferralCodeState] = useState<string>(() => storageGet<string>('dc_referral', ''));

  useEffect(() => storageSet(KEY, items), [items]);

  // capture ?ref=CODE from the URL once
  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      const ref = u.searchParams.get('ref');
      if (ref && /^[A-Za-z0-9_]{3,16}$/.test(ref)) {
        setReferralCodeState(ref);
        storageSet('dc_referral', ref);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setDiscountCode = useCallback((c: string) => {
    setDiscountCodeState(c);
    storageSet('dc_discount', c);
  }, []);
  const setReferralCode = useCallback((c: string) => {
    setReferralCodeState(c);
    storageSet('dc_referral', c);
  }, []);

  const add = useCallback(
    (productId: string, qty = 1, opts?: { silent?: boolean; open?: boolean }) => {
      const p = productById(productId);
      if (!p) return;
      if (p.stock !== null && p.stock <= 0) {
        toast(`${p.name} is sold out.`, 'error');
        return;
      }
      setItems((cur) => {
        const existing = cur.find((l) => l.productId === productId);
        const nextQty = clampQty(p, (existing?.qty ?? 0) + qty);
        if (existing) return cur.map((l) => (l.productId === productId ? { ...l, qty: nextQty } : l));
        return [...cur, { productId, qty: nextQty }];
      });
      if (!opts?.silent) toast(`${qty > 1 ? `${qty}× ` : ''}${p.name} added to cart`, 'gold');
      if (opts?.open !== false) setOpen(true);
    },
    [productById, toast],
  );

  const setQty = useCallback(
    (productId: string, qty: number) => {
      const p = productById(productId);
      setItems((cur) => {
        if (qty <= 0) return cur.filter((l) => l.productId !== productId);
        return cur.map((l) => (l.productId === productId ? { ...l, qty: p ? clampQty(p, qty) : qty } : l));
      });
    },
    [productById],
  );

  const remove = useCallback((productId: string) => setItems((cur) => cur.filter((l) => l.productId !== productId)), []);
  const clear = useCallback(() => setItems([]), []);

  const lines = useMemo<CartLine[]>(
    () => items.map((l) => ({ ...l, product: productById(l.productId)! })).filter((l) => !!l.product),
    [items, productById],
  );

  const quote = useMemo(
    () =>
      computeQuote(products, items, {
        salePercent: config.sale.enabled ? config.sale.percent : 0,
        tiers: config.spendingTiers,
      }),
    [products, items, config.sale, config.spendingTiers],
  );

  const value = useMemo<CartApi>(
    () => ({
      items,
      lines,
      count: lines.length,
      totalQty: lines.reduce((s, l) => s + l.qty, 0),
      add,
      setQty,
      remove,
      clear,
      quote,
      isOpen,
      open: () => setOpen(true),
      close: () => setOpen(false),
      toggle: () => setOpen((o) => !o),
      discountCode,
      setDiscountCode,
      referralCode,
      setReferralCode,
    }),
    [items, lines, add, setQty, remove, clear, quote, isOpen, discountCode, setDiscountCode, referralCode, setReferralCode],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCart outside CartProvider');
  return v;
}
