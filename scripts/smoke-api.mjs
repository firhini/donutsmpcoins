/**
 * API smoke test against a running dev server (vite + local API plugin or netlify dev).
 * Usage: BASE=http://localhost:5173 ADMIN_PASSWORD=... node scripts/smoke-api.mjs
 */
const BASE = process.env.BASE || 'http://localhost:5173';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-pass';
let failures = 0;
const ok = (cond, msg) => { if (cond) console.log('  ✓', msg); else { failures++; console.log('  ✗', msg); } };
async function call(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(BASE + '/api' + path, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let data = null; try { data = await res.json(); } catch {}
  return { status: res.status, data };
}
const deviceId = 'smoke-' + Math.random().toString(36).slice(2);
console.log('Catalog / config / stats');
{
  const c = await call('/catalog'); ok(c.status === 200 && c.data.products?.length > 40, `GET /catalog → ${c.status}, ${c.data?.products?.length} products`);
  const cfg = await call('/config'); ok(cfg.status === 200 && Array.isArray(cfg.data.paymentMethods), `GET /config → ${cfg.status}, ${cfg.data?.paymentMethods?.length} payment methods`);
  const st = await call('/stats'); ok(st.status === 200, `GET /stats → ${st.status} ${JSON.stringify(st.data)}`);
  const odds = await call('/products/mystery-box/odds'); ok(odds.status === 200 && odds.data.odds?.length > 5, `GET /products/mystery-box/odds → ${odds.status}`);
}
console.log('Quote');
{
  const q = await call('/quote', { method: 'POST', body: { items: [{ productId: 'money-1m', qty: 100 }, { productId: 'mystery-box', qty: 1 }] } });
  ok(q.status === 200 && q.data.subtotalCents === 100 * 16 + 569, `POST /quote subtotal=${q.data?.subtotalCents} (expected ${100 * 16 + 569})`);
  ok(q.data?.tierPercent === 5, `tier 5% applied at $${(q.data?.subtotalCents / 100).toFixed(2)} → ${q.data?.tierPercent}%`);
  const q2 = await call('/quote', { method: 'POST', body: { items: [{ productId: 'money-1m', qty: 10 }], discountCode: 'WELCOME5' } });
  console.log('    welcome coupon:', q2.data?.couponCode, q2.data?.warnings);
}
console.log('Order flow (manual payment)');
let orderId;
{
  const cfg = await call('/config');
  const manual = cfg.data.paymentMethods.find((m) => m.type === 'manual');
  const o = await call('/orders', { method: 'POST', body: { username: 'Notch', items: [{ productId: 'money-1m', qty: 50 }, { productId: 'mystery-box', qty: 2 }], paymentMethodId: manual?.id, tosAccepted: true, deviceId } });
  ok(o.status === 200 && o.data.order?.id?.startsWith('DC-'), `POST /orders → ${o.status} ${o.data?.order?.id || JSON.stringify(o.data)}`);
  orderId = o.data?.order?.id;
  ok(o.data?.order?.status === 'awaiting_payment', `status awaiting_payment`);
  ok(!!o.data?.order?.payment?.instructions, `instructions rendered: ${String(o.data?.order?.payment?.instructions).slice(0, 60)}…`);
  const box = o.data?.order?.items?.find((i) => i.kind === 'box');
  ok(box?.rolled?.length === 2 && box.rolled[0].length >= 3, `mystery box rolled ${box?.rolled?.length} boxes × ${box?.rolled?.[0]?.length} drops`);
  ok(o.data?.order?.ipHash === undefined && o.data?.order?.email === undefined, 'public order hides ipHash/email');
  const bad = await call('/orders', { method: 'POST', body: { username: 'x', items: [{ productId: 'money-1m', qty: 1 }], paymentMethodId: manual?.id, tosAccepted: true } });
  ok(bad.status === 400, `invalid username → ${bad.status}`);
  const noTos = await call('/orders', { method: 'POST', body: { username: 'Notch', items: [{ productId: 'money-1m', qty: 1 }], paymentMethodId: manual?.id, tosAccepted: false } });
  ok(noTos.status === 400, `tos not accepted → ${noTos.status}`);
  const g = await call(`/orders/${orderId}`); ok(g.status === 200 && g.data.order.id === orderId, `GET /orders/:id → ${g.status}`);
  const ref = await call(`/orders/${orderId}/reference`, { method: 'POST', body: { reference: 'TX-123456' } });
  ok(ref.status === 200 && ref.data.order?.payment?.status === 'pending_review', `reference → payment.status=${ref.data?.order?.payment?.status}`);
  const nf = await call('/orders/DC-ZZZZZZ'); ok(nf.status === 404, `unknown order → ${nf.status}`);
}
console.log('MC validate');
{
  const v = await call('/mc/validate', { method: 'POST', body: { username: 'Notch' } });
  ok(v.status === 200 && typeof v.data.valid === 'boolean', `POST /mc/validate → ${v.status} ${JSON.stringify(v.data)}`);
  const bad = await call('/mc/validate', { method: 'POST', body: { username: '!!' } });
  ok(bad.status === 200 ? bad.data.valid === false : bad.status === 400, `invalid syntax handled → ${bad.status}`);
}
console.log('Promo: coupons / spin / credit / referral');
{
  const c = await call('/coupons/validate', { method: 'POST', body: { code: 'NOPE-123' } });
  ok(c.status === 200 && c.data.valid === false, `unknown coupon → valid=false`);
  const s = await call(`/spin/status?deviceId=${deviceId}`); ok(s.status === 200 && s.data.prizes?.length > 3 && s.data.prizes[0].weight === undefined, `GET /spin/status → ${s.status}, ${s.data?.prizes?.length} prizes, weights hidden`);
  const sp = await call('/spin', { method: 'POST', body: { deviceId, username: 'Notch' } });
  ok(sp.status === 200 && sp.data.prize && typeof sp.data.index === 'number', `POST /spin → ${sp.status} prize=${sp.data?.prize?.label} code=${sp.data?.code || '-'} order=${sp.data?.orderId || '-'}`);
  const sp2 = await call('/spin', { method: 'POST', body: { deviceId, username: 'Notch' } });
  ok(sp2.status === 429, `second spin → ${sp2.status} (cooldown)`);
  const cr = await call('/credit?username=Notch'); ok(cr.status === 200 && typeof cr.data.balanceCents === 'number', `GET /credit → ${cr.status} ${cr.data?.balanceCents}`);
  const rf = await call('/referral?username=Notch'); ok(rf.status === 200 && rf.data.code, `GET /referral → ${rf.status} ${JSON.stringify(rf.data)}`);
  const rd = await call('/redeem', { method: 'POST', body: { code: 'GIFT-NOPE', username: 'Notch' } }); ok(rd.status === 400 || rd.status === 404, `redeem unknown → ${rd.status}`);
}
console.log('Social');
{
  const r = await call('/reviews?limit=5'); ok(r.status === 200 && Array.isArray(r.data.reviews) && r.data.stats, `GET /reviews → ${r.status}`);
  const g = await call('/giveaways'); ok(g.status === 200 && Array.isArray(g.data.giveaways), `GET /giveaways → ${g.status}`);
  const pr = await call('/reviews', { method: 'POST', body: { orderId, rating: 5, comment: 'great stuff' } }); ok(pr.status === 400, `review on undelivered order → ${pr.status}`);
}
console.log('Admin');
{
  const un = await call('/admin/orders'); ok(un.status === 401, `no token → ${un.status}`);
  const wrong = await call('/admin/login', { method: 'POST', body: { password: 'wrong' } }); ok(wrong.status === 401 || wrong.status === 403, `wrong password → ${wrong.status}`);
  const login = await call('/admin/login', { method: 'POST', body: { password: ADMIN_PASSWORD } });
  ok(login.status === 200 && login.data.token, `login → ${login.status}`);
  const token = login.data?.token;
  const me = await call('/admin/me', { token }); ok(me.status === 200, `GET /admin/me → ${me.status}`);
  const dash = await call('/admin/dashboard', { token }); ok(dash.status === 200 && dash.data.counts, `dashboard → ${dash.status} ${JSON.stringify(dash.data?.counts)}`);
  const list = await call('/admin/orders?status=awaiting_payment', { token }); ok(list.status === 200 && list.data.orders?.some((o) => o.id === orderId), `orders list contains ${orderId}`);
  const paid = await call(`/admin/orders/${orderId}`, { method: 'PATCH', token, body: { status: 'paid' } }); ok(paid.status === 200 && paid.data.order?.status === 'paid', `mark paid → ${paid.data?.order?.status}`);
  const del = await call(`/admin/orders/${orderId}`, { method: 'PATCH', token, body: { status: 'delivered' } }); ok(del.data?.order?.status === 'delivered', `mark delivered → ${del.data?.order?.status}`);
  const pr = await call('/reviews', { method: 'POST', body: { orderId, rating: 5, comment: 'Fast delivery, thanks!' } }); ok(pr.status === 200 && pr.data.review?.status === 'pending', `review submitted → ${pr.status}`);
  const pending = await call('/admin/reviews?status=pending', { token }); ok(pending.status === 200 && pending.data.reviews?.length >= 1, `pending reviews: ${pending.data?.reviews?.length}`);
  const rid = pending.data?.reviews?.[0]?.id;
  const appr = await call(`/admin/reviews/${rid}`, { method: 'PATCH', token, body: { status: 'approved' } }); ok(appr.status === 200 && appr.data.review?.rewardCode, `approve → reward ${appr.data?.review?.rewardCode}`);
  const pub = await call('/reviews?limit=5'); ok(pub.data?.reviews?.length >= 1 && pub.data.stats.count >= 1, `public reviews now ${pub.data?.reviews?.length}, avg ${pub.data?.stats?.averageRating}`);
  const st = await call('/stats'); ok(st.data?.ordersDelivered >= 1, `stats.ordersDelivered=${st.data?.ordersDelivered}`);
  const coupon = await call('/admin/coupons', { method: 'POST', token, body: { code: 'SMOKE10', type: 'percent', value: 10, maxUses: 5 } }); ok(coupon.status === 200 || coupon.status === 201, `create coupon → ${coupon.status}`);
  const cv = await call('/coupons/validate', { method: 'POST', body: { code: 'smoke10', subtotalCents: 1000 } }); ok(cv.data?.valid === true, `validate SMOKE10 → ${cv.data?.valid}`);
  const q = await call('/quote', { method: 'POST', body: { items: [{ productId: 'money-1m', qty: 10 }], discountCode: 'SMOKE10' } }); ok(q.data?.couponDiscountCents === Math.round(169 * 0.1) || q.data?.couponDiscountCents === 17 || q.data?.couponDiscountCents === 18, `coupon discount ${q.data?.couponDiscountCents} on ${q.data?.subtotalCents}`);
  const gift = await call('/admin/gifts', { method: 'POST', token, body: { productId: 'skeleton-spawner', qty: 2, maxUses: 1 } }); ok(gift.status === 200 || gift.status === 201, `create gift → ${gift.status} ${gift.data?.gift?.code || gift.data?.code || ''}`);
  const gcode = gift.data?.gift?.code || gift.data?.code;
  if (gcode) { const rd = await call('/redeem', { method: 'POST', body: { code: gcode, username: 'Notch' } }); ok(rd.status === 200 && rd.data.order?.status === 'paid' && rd.data.order?.payment?.type === 'free', `redeem gift → free order ${rd.data?.order?.id}`); }
  const gw = await call('/admin/giveaways', { method: 'POST', token, body: { title: 'Smoke giveaway', prize: '10M Money', endsAt: new Date(Date.now() + 86400000).toISOString(), maxWinners: 1 } }); ok(gw.status === 200 || gw.status === 201, `create giveaway → ${gw.status}`);
  const gid = gw.data?.giveaway?.id || gw.data?.id;
  if (gid) {
    const en = await call(`/giveaways/${gid}/enter`, { method: 'POST', body: { username: 'Notch', deviceId } }); ok(en.status === 200 && en.data.entered, `enter giveaway → ${en.status}`);
    const en2 = await call(`/giveaways/${gid}/enter`, { method: 'POST', body: { username: 'Notch', deviceId } }); ok(en2.status === 400 || en2.status === 409 || (en2.status === 200 && en2.data.entered === false) || en2.data?.alreadyEntered, `double entry blocked → ${en2.status} ${JSON.stringify(en2.data)}`);
    const draw = await call(`/admin/giveaways/${gid}/draw`, { method: 'POST', token }); ok(draw.status === 200 && (draw.data.giveaway?.winners?.length === 1 || draw.data.winners?.length === 1), `draw → ${draw.status} ${JSON.stringify(draw.data?.giveaway?.winners || draw.data?.winners)}`);
  }
  const settings = await call('/admin/settings', { token }); ok(settings.status === 200 && settings.data.paymentMethods, `GET settings → ${settings.status}`);
  const put = await call('/admin/settings', { method: 'PUT', token, body: { announcement: { enabled: true, text: 'Smoke announcement' } } }); ok(put.status === 200 && put.data.announcement?.text === 'Smoke announcement', `PUT settings merge → ${put.data?.announcement?.text}`);
  const cfg = await call('/config'); ok(cfg.data?.announcement?.text === 'Smoke announcement', `public config reflects settings`);
  const prod = await call('/admin/products/skeleton-spawner', { method: 'PUT', token, body: { priceCents: 44, stock: 5 } }); ok(prod.status === 200, `PUT product → ${prod.status}`);
  const cat = await call('/catalog'); const sk = cat.data.products.find((p) => p.id === 'skeleton-spawner'); ok(sk?.priceCents === 44 && sk?.stock === 5, `catalog reflects override price=${sk?.priceCents} stock=${sk?.stock}`);
  const csv = await fetch(BASE + '/api/admin/export/orders.csv', { headers: { authorization: `Bearer ${token}` } }); ok(csv.status === 200 && (csv.headers.get('content-type') || '').includes('csv'), `CSV export → ${csv.status}`);
}
console.log(failures ? `\n${failures} FAILURES` : '\nALL PASSED');
process.exit(failures ? 1 : 0);
