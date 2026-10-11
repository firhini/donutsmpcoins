import { useEffect, useState } from 'react';
import type { Coupon, Quote } from '../../shared/types';
import { apiPost, ApiClientError } from '../../lib/api';
import { MC_USERNAME_RE } from '../../lib/mc';
import { useCart } from '../../context/CartContext';
import { useStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { Icon } from '../ui/Icons';

interface CouponValidateResponse {
  valid: boolean;
  coupon?: Pick<Coupon, 'code' | 'type' | 'value' | 'minOrderCents' | 'expiresAt'>;
  message?: string;
}

type Msg = { type: 'ok' | 'err' | 'info'; text: string } | null;

/** The promo route is not deployed yet (router 404), as opposed to "code not found". */
function isRouteMissing(err: unknown): boolean {
  return err instanceof ApiClientError && err.status === 404 && /no route/i.test(err.message);
}

/**
 * Discount code + referral code inputs. Validates against POST /coupons/validate
 * for instant feedback and persists through the cart context so checkout
 * (and the server quote) pick the codes up.
 */
export function PromoCodes({
  subtotalCents,
  username,
  quote,
  live,
  onApplied,
  compact = false,
}: {
  subtotalCents: number;
  username?: string;
  /** live server quote (if any) – used to show the real discount */
  quote?: Quote;
  live?: boolean;
  onApplied?: () => void;
  compact?: boolean;
}) {
  const { discountCode, setDiscountCode, referralCode, setReferralCode } = useCart();
  const { config, fmt } = useStore();
  const { toast } = useToast();
  const [code, setCode] = useState(discountCode);
  const [ref, setRef] = useState(referralCode);
  const [codeMsg, setCodeMsg] = useState<Msg>(null);
  const [refMsg, setRefMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => setCode(discountCode), [discountCode]);
  useEffect(() => setRef(referralCode), [referralCode]);

  const describe = (c?: CouponValidateResponse['coupon']) => {
    if (!c) return 'Code applied.';
    const what = c.type === 'percent' ? `${c.value}% off` : `${fmt(c.value)} off`;
    const min = c.minOrderCents ? ` · min. order ${fmt(c.minOrderCents)}` : '';
    return `${what}${min}`;
  };

  const applyCode = async (raw?: string) => {
    const c = (raw ?? code).trim().toUpperCase();
    if (!c) {
      setDiscountCode('');
      setCodeMsg(null);
      return;
    }
    if (!/^[A-Z0-9_-]{3,32}$/.test(c)) {
      setCodeMsg({ type: 'err', text: 'That does not look like a valid code.' });
      return;
    }
    setBusy(true);
    try {
      const r = await apiPost<CouponValidateResponse>('/coupons/validate', { code: c, username: username || undefined, subtotalCents });
      if (r.valid) {
        setDiscountCode(c);
        setCode(c);
        setCodeMsg({ type: 'ok', text: r.message || describe(r.coupon) });
        toast(`Code ${c} applied`, 'gold');
        onApplied?.();
      } else {
        setDiscountCode('');
        setCodeMsg({ type: 'err', text: r.message || 'This code is not valid.' });
      }
    } catch (err) {
      if (isRouteMissing(err)) {
        setDiscountCode(c);
        setCode(c);
        setCodeMsg({ type: 'info', text: 'Saved – we will verify this code when you place the order.' });
        onApplied?.();
      } else {
        setDiscountCode('');
        setCodeMsg({ type: 'err', text: (err as Error).message || 'Could not check this code.' });
      }
    } finally {
      setBusy(false);
    }
  };

  const clearCode = () => {
    setDiscountCode('');
    setCode('');
    setCodeMsg(null);
    onApplied?.();
  };

  const applyRef = () => {
    const r = ref.trim();
    if (!r) {
      setReferralCode('');
      setRefMsg(null);
      onApplied?.();
      return;
    }
    if (!MC_USERNAME_RE.test(r)) {
      setRefMsg({ type: 'err', text: 'Enter the Minecraft username of the friend who referred you.' });
      return;
    }
    if (username && r.toLowerCase() === username.trim().toLowerCase()) {
      setRefMsg({ type: 'err', text: "You can't refer yourself – nice try though." });
      return;
    }
    setReferralCode(r);
    setRefMsg({ type: 'ok', text: `Referred by ${r} – ${config.referral.friendPercent}% off this order.` });
    toast(`Referral from ${r} saved`, 'gold');
    onApplied?.();
  };

  const clearRef = () => {
    setReferralCode('');
    setRef('');
    setRefMsg(null);
    onApplied?.();
  };

  // What the live quote says about the applied code
  let codeStatus: Msg = codeMsg;
  if (discountCode && live && quote) {
    if (quote.couponCode && quote.couponCode.toUpperCase() === discountCode.toUpperCase()) {
      codeStatus = { type: 'ok', text: `${discountCode} applied – saves ${fmt(quote.couponDiscountCents)}` };
    } else {
      const w = quote.warnings.find((x) => /code|coupon/i.test(x));
      codeStatus = { type: 'err', text: w || 'This code could not be applied.' };
    }
  }
  let refStatus: Msg = refMsg;
  if (referralCode && live && quote) {
    if (quote.referralCode) refStatus = { type: 'ok', text: `Referred by ${quote.referralCode} – saves ${fmt(quote.referralDiscountCents)}` };
    else {
      const w = quote.warnings.find((x) => /refer/i.test(x));
      if (w) refStatus = { type: 'err', text: w };
    }
  }

  const welcome = config.welcomeCoupon;
  const showWelcome = welcome?.enabled && welcome.code && !discountCode;

  return (
    <div className={`promo ${compact ? 'promo-compact' : ''}`}>
      <div className="promo-field">
        <label className="label" htmlFor="promo-code">
          Discount code
        </label>
        {discountCode ? (
          <div className="promo-applied">
            <span className="promo-chip">
              <Icon name="tag" size={14} /> {discountCode}
              <button type="button" onClick={clearCode} aria-label="Remove discount code" className="promo-chip-x">
                <Icon name="close" size={12} />
              </button>
            </span>
            {codeStatus && <span className={`promo-msg promo-${codeStatus.type}`}>{codeStatus.text}</span>}
          </div>
        ) : (
          <>
            <div className="promo-row">
              <input
                id="promo-code"
                className={`input ${codeStatus?.type === 'err' ? 'error' : ''}`}
                placeholder="e.g. SPIN-ABCD1234"
                value={code}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  if (codeMsg) setCodeMsg(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void applyCode();
                  }
                }}
              />
              <button type="button" className="btn btn-secondary" onClick={() => void applyCode()} disabled={busy || !code.trim()}>
                {busy ? <span className="spinner" /> : 'Apply'}
              </button>
            </div>
            {codeStatus && <span className={`promo-msg promo-${codeStatus.type}`}>{codeStatus.text}</span>}
            {showWelcome && (
              <button type="button" className="promo-hint" onClick={() => void applyCode(welcome.code)} disabled={busy}>
                <Icon name="sparkles" size={13} /> First order? Use <b>{welcome.code}</b> for {welcome.percent}% off
              </button>
            )}
          </>
        )}
      </div>

      {config.referral?.enabled && (
        <div className="promo-field">
          <label className="label" htmlFor="promo-ref">
            Referral <span className="muted">(friend&apos;s Minecraft name)</span>
          </label>
          {referralCode ? (
            <div className="promo-applied">
              <span className="promo-chip promo-chip-pink">
                <Icon name="users" size={14} /> {referralCode}
                <button type="button" onClick={clearRef} aria-label="Remove referral" className="promo-chip-x">
                  <Icon name="close" size={12} />
                </button>
              </span>
              {refStatus && <span className={`promo-msg promo-${refStatus.type}`}>{refStatus.text}</span>}
            </div>
          ) : (
            <>
              <div className="promo-row">
                <input
                  id="promo-ref"
                  className={`input ${refStatus?.type === 'err' ? 'error' : ''}`}
                  placeholder="Friend's username"
                  value={ref}
                  maxLength={16}
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(e) => {
                    setRef(e.target.value);
                    if (refMsg) setRefMsg(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      applyRef();
                    }
                  }}
                />
                <button type="button" className="btn btn-secondary" onClick={applyRef} disabled={!ref.trim()}>
                  Apply
                </button>
              </div>
              {refStatus ? (
                <span className={`promo-msg promo-${refStatus.type}`}>{refStatus.text}</span>
              ) : (
                <span className="promo-msg promo-muted">
                  {config.referral.friendPercent}% off for you, store credit for them. Not combinable with a discount code.
                </span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
