import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { StoreProvider } from './context/StoreContext';
import { CartProvider } from './context/CartContext';
import { Layout } from './components/layout/Layout';

// Storefront
const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const MoneyLanding = lazy(() => import('./pages/landing/MoneyLanding'));
const SpawnersLanding = lazy(() => import('./pages/landing/SpawnersLanding'));
const IrlTradeLanding = lazy(() => import('./pages/landing/IrlTradeLanding'));
const Faq = lazy(() => import('./pages/Faq'));
const Terms = lazy(() => import('./pages/legal/Terms'));
const RefundPolicy = lazy(() => import('./pages/legal/RefundPolicy'));
const Privacy = lazy(() => import('./pages/legal/Privacy'));
const NotFound = lazy(() => import('./pages/NotFound'));
// Cart / checkout / orders
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderPage = lazy(() => import('./pages/OrderPage'));
const Track = lazy(() => import('./pages/Track'));
// Free stuff & community
const Spin = lazy(() => import('./pages/Spin'));
const Free = lazy(() => import('./pages/Free'));
const Redeem = lazy(() => import('./pages/Redeem'));
const Referral = lazy(() => import('./pages/Referral'));
const Giveaways = lazy(() => import('./pages/Giveaways'));
const Reviews = lazy(() => import('./pages/Reviews'));
// Admin
const Admin = lazy(() => import('./pages/admin/Admin'));

export default function App() {
  return (
    <ToastProvider>
      <StoreProvider>
        <CartProvider>
          <Routes>
            <Route path="/admin/*" element={<Admin />} />
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/shop/:category" element={<Shop />} />
              <Route path="/product/:slug" element={<ProductPage />} />
              <Route path="/donutsmp-money" element={<MoneyLanding />} />
              <Route path="/donutsmp-spawners" element={<SpawnersLanding />} />
              <Route path="/donutsmp-irl-trade" element={<IrlTradeLanding />} />
              <Route path="/faq" element={<Faq />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order/:id" element={<OrderPage />} />
              <Route path="/track" element={<Track />} />
              <Route path="/spin" element={<Spin />} />
              <Route path="/free" element={<Free />} />
              <Route path="/redeem" element={<Redeem />} />
              <Route path="/referral" element={<Referral />} />
              <Route path="/giveaways" element={<Giveaways />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </CartProvider>
      </StoreProvider>
    </ToastProvider>
  );
}
