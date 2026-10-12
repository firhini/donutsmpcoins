import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { CartDrawer } from '../cart/CartDrawer';
import { useStore } from '../../context/StoreContext';
import { Analytics } from '../ui/Analytics';
import { ErrorBoundary } from '../ui/ErrorBoundary';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

export function PageFallback() {
  return (
    <div className="container" style={{ padding: '80px 0', display: 'flex', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  );
}

export function Layout() {
  const { config } = useStore();
  const { pathname } = useLocation();
  return (
    <>
      <ScrollToTop />
      <Header />
      {config.maintenance?.enabled && (
        <div className="container" style={{ paddingTop: 16 }}>
          <div className="alert alert-warn">⚠️ {config.maintenance.message}</div>
        </div>
      )}
      <main>
        <ErrorBoundary resetKey={pathname}>
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      <CartDrawer />
      <Analytics />
    </>
  );
}
