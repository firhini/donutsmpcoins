/**
 * /admin/* – the owner's back office. Renders OUTSIDE the public Layout (own shell).
 * Auth: bearer token from lib/api.ts (session or local storage). On 401 the API layer
 * clears the token and fires ADMIN_UNAUTHORIZED_EVENT → login screen.
 */
import { useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Seo } from '../../components/ui/Seo';
import { getAdminToken } from '../../lib/api';
import { ADMIN_UNAUTHORIZED_EVENT, adminLogout, adminMe, errorMessage, isUnauthorized } from '../../lib/adminApi';
import { Shell } from '../../components/admin/Shell';
import { Login } from '../../components/admin/Login';
import Dashboard from './Dashboard';
import Orders from './Orders';
import OrderDetail from './OrderDetail';
import Products from './Products';
import Coupons from './Coupons';
import Reviews from './Reviews';
import Giveaways from './Giveaways';
import Settings from './Settings';
import Credit from './Credit';
import '../../styles/admin.css';

type AuthState = 'checking' | 'anonymous' | 'authed';

export default function Admin() {
  const [auth, setAuth] = useState<AuthState>(() => (getAdminToken() ? 'checking' : 'anonymous'));
  const [apiProblem, setApiProblem] = useState<string | null>(null);

  // verify an existing token once; only a 401 logs out – any other failure keeps the shell usable
  useEffect(() => {
    if (auth !== 'checking') return;
    let alive = true;
    (async () => {
      try {
        await adminMe();
        if (alive) {
          setApiProblem(null);
          setAuth('authed');
        }
      } catch (err) {
        if (!alive) return;
        if (isUnauthorized(err)) setAuth('anonymous');
        else {
          setApiProblem(errorMessage(err));
          setAuth('authed');
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [auth]);

  useEffect(() => {
    const onUnauthorized = () => setAuth('anonymous');
    window.addEventListener(ADMIN_UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(ADMIN_UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const logout = useCallback(() => {
    adminLogout();
    setAuth('anonymous');
  }, []);

  if (auth === 'checking') {
    return (
      <div className="adm-fullbleed-splash">
        <Seo robots="noindex,nofollow" title="Admin · DonutCoins" description="DonutCoins back office" />
        <div className="row">
          <span className="spinner" /> Checking session…
        </div>
      </div>
    );
  }

  if (auth === 'anonymous') {
    return (
      <>
        <Seo robots="noindex,nofollow" title="Sign in · Admin · DonutCoins" description="DonutCoins back office" />
        <Login
          onSuccess={() => {
            setApiProblem(null);
            setAuth('authed');
          }}
        />
      </>
    );
  }

  return (
    <Routes>
      <Route element={<Shell onLogout={logout} apiProblem={apiProblem} />}>
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="products" element={<Products />} />
        <Route path="coupons" element={<Coupons />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="giveaways" element={<Giveaways />} />
        <Route path="settings" element={<Settings />} />
        <Route path="credit" element={<Credit />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}
