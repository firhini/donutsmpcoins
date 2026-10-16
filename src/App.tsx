import { Routes, Route, matchPath } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { StoreProvider, type InitialState } from './context/StoreContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { landingCopy } from './data/landingCopy';
import { lazyPage, type PreloadablePage } from './lib/lazyPage';

// Storefront
const Home = lazyPage(() => import('./pages/Home'));
const Shop = lazyPage(() => import('./pages/Shop'));
const ProductPage = lazyPage(() => import('./pages/ProductPage'));
const MoneyLanding = lazyPage(() => import('./pages/landing/MoneyLanding'));
const SpawnersLanding = lazyPage(() => import('./pages/landing/SpawnersLanding'));
const IrlTradeLanding = lazyPage(() => import('./pages/landing/IrlTradeLanding'));
const Faq = lazyPage(() => import('./pages/Faq'));
const Terms = lazyPage(() => import('./pages/legal/Terms'));
const RefundPolicy = lazyPage(() => import('./pages/legal/RefundPolicy'));
const Privacy = lazyPage(() => import('./pages/legal/Privacy'));
const Imprint = lazyPage(() => import('./pages/legal/Imprint'));
const NotFound = lazyPage(() => import('./pages/NotFound'));
// Cart / checkout / orders
const Cart = lazyPage(() => import('./pages/Cart'));
const Checkout = lazyPage(() => import('./pages/Checkout'));
const OrderPage = lazyPage(() => import('./pages/OrderPage'));
const Track = lazyPage(() => import('./pages/Track'));
// Free stuff & community
const Spin = lazyPage(() => import('./pages/Spin'));
const Free = lazyPage(() => import('./pages/Free'));
const Redeem = lazyPage(() => import('./pages/Redeem'));
const Referral = lazyPage(() => import('./pages/Referral'));
const Giveaways = lazyPage(() => import('./pages/Giveaways'));
const Reviews = lazyPage(() => import('./pages/Reviews'));
const Account = lazyPage(() => import('./pages/Account'));
const Guides = lazyPage(() => import('./pages/Guides'));
const GuidePage = lazyPage(() => import('./pages/GuidePage'));
const LandingPage = lazyPage(() => import('./pages/LandingPage'));
// Admin (own layout)
const Admin = lazyPage(() => import('./pages/admin/Admin'));

/** Route table for everything inside the storefront <Layout>. Order matters: first match wins. */
const PAGES: [path: string, page: PreloadablePage][] = [
  ['/', Home],
  ['/shop', Shop],
  ['/shop/:category', Shop],
  ['/product/:slug', ProductPage],
  ['/donutsmp-money', MoneyLanding],
  ['/donutsmp-spawners', SpawnersLanding],
  ['/donutsmp-irl-trade', IrlTradeLanding],
  ['/guides', Guides],
  ['/guides/:slug', GuidePage],
  ...landingCopy.map((l): [string, PreloadablePage] => [`/${l.slug}`, LandingPage]),
  ['/faq', Faq],
  ['/terms', Terms],
  ['/refund-policy', RefundPolicy],
  ['/privacy', Privacy],
  ['/imprint', Imprint],
  ['/cart', Cart],
  ['/checkout', Checkout],
  ['/order/:id', OrderPage],
  ['/track', Track],
  ['/spin', Spin],
  ['/free', Free],
  ['/redeem', Redeem],
  ['/referral', Referral],
  ['/giveaways', Giveaways],
  ['/reviews', Reviews],
  ['/account', Account],
  ['*', NotFound],
];

/** Load the page module for a pathname before hydrating (see main.tsx). */
export function preloadRoute(pathname: string): Promise<void> {
  if (matchPath('/admin/*', pathname)) return Admin.preload();
  const hit = PAGES.find(([path]) => matchPath(path, pathname));
  return (hit ? hit[1] : NotFound).preload();
}

export default function App({ initial }: { initial?: InitialState } = {}) {
  return (
    <ToastProvider>
      <StoreProvider initial={initial}>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path="/admin/*" element={<Admin />} />
              <Route element={<Layout />}>
                {PAGES.map(([path, Page]) => (
                  <Route key={path} path={path} element={<Page />} />
                ))}
              </Route>
            </Routes>
          </CartProvider>
        </AuthProvider>
      </StoreProvider>
    </ToastProvider>
  );
}
