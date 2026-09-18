import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CustomerDashboard } from './pages/dashboards/CustomerDashboard';
import { MerchantDashboard } from './pages/dashboards/MerchantDashboard';
import { ProviderDashboard } from './pages/dashboards/ProviderDashboard';
import { AdminDashboard } from './pages/dashboards/AdminDashboard';
import { AuthProvider, useAuth, UserRole } from './context/AuthContext';

/* ── View type ────────────────────────────────────────────── */
export type View =
  | 'home'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'merchant/dashboard'
  | 'provider/dashboard'
  | 'admin/dashboard';

const DASHBOARD_VIEWS: View[] = [
  'dashboard',
  'merchant/dashboard',
  'provider/dashboard',
  'admin/dashboard',
];

const ROLE_TO_DASHBOARD: Record<UserRole, View> = {
  customer: 'dashboard',
  merchant: 'merchant/dashboard',
  provider: 'provider/dashboard',
  admin:    'admin/dashboard',
};

// Normalize any route aliases (e.g. 'dashboard/customer' -> 'dashboard')
function normalizeRoute(path: string): View {
  const clean = path.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!clean || clean === 'home') return 'home';
  if (clean === 'login') return 'login';
  if (clean === 'register') return 'register';

  if (clean === 'dashboard' || clean === 'dashboard/customer') return 'dashboard';
  if (clean === 'merchant/dashboard' || clean === 'dashboard/merchant') return 'merchant/dashboard';
  if (clean === 'provider/dashboard' || clean === 'dashboard/provider') return 'provider/dashboard';
  if (clean === 'admin/dashboard' || clean === 'dashboard/admin') return 'admin/dashboard';

  return 'home';
}

/* ── Inner app (needs AuthContext) ────────────────────────── */
const AppInner: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<View>(() => normalizeRoute(window.location.pathname));

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(normalizeRoute(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // On session restore: if already authenticated and on public auth pages, redirect to role dashboard
  useEffect(() => {
    if (!loading && user && !DASHBOARD_VIEWS.includes(currentView)) {
      if (currentView === 'login' || currentView === 'register') {
        const dest = ROLE_TO_DASHBOARD[user.role];
        setCurrentView(dest);
        window.history.replaceState(null, '', `/${dest}`);
      }
    }
  }, [loading, user]);

  const handleNavigate = (rawView: string) => {
    const targetView = normalizeRoute(rawView);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // ── RBAC protection ────────────────────────────────────
    if (DASHBOARD_VIEWS.includes(targetView)) {
      if (!user) {
        // Unauthenticated → send to login
        setCurrentView('login');
        window.history.pushState(null, '', '/login');
        return;
      }
      // Role mismatch → redirect to their own dashboard
      const allowedDashboard = ROLE_TO_DASHBOARD[user.role];
      if (targetView !== allowedDashboard) {
        setCurrentView(allowedDashboard);
        window.history.pushState(null, '', `/${allowedDashboard}`);
        return;
      }
    }

    setCurrentView(targetView);
    const newPath = targetView === 'home' ? '/' : `/${targetView}`;
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, '', newPath);
    }
  };

  if (loading) {
    // Brief loading state while session is being restored from cookie
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#071228',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <img
            src="/assets/brand/vector/ods-logo-gold-primary.svg"
            alt="ODS Global Network"
            style={{ height: '48px', opacity: 0.8 }}
          />
          <div style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '16px', fontWeight: 500 }}>
            Restoring secure session…
          </div>
        </div>
      </div>
    );
  }

  const isHome = currentView === 'home';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header — only on Home */}
      {isHome && <Header currentView={currentView} onNavigate={handleNavigate} />}

      {/* Main content */}
      <main style={{ flex: 1 }}>
        {currentView === 'home'     && <HomePage     onNavigate={handleNavigate} />}
        {currentView === 'login'    && <LoginPage    onNavigate={handleNavigate} />}
        {currentView === 'register' && <RegisterPage onNavigate={handleNavigate} />}

        {/* ── Role-protected dashboards ─────────────────── */}
        {currentView === 'dashboard' && user?.role === 'customer' && (
          <CustomerDashboard onNavigate={handleNavigate} />
        )}
        {currentView === 'merchant/dashboard' && user?.role === 'merchant' && (
          <MerchantDashboard onNavigate={handleNavigate} />
        )}
        {currentView === 'provider/dashboard' && user?.role === 'provider' && (
          <ProviderDashboard onNavigate={handleNavigate} />
        )}
        {currentView === 'admin/dashboard' && user?.role === 'admin' && (
          <AdminDashboard onNavigate={handleNavigate} />
        )}
      </main>

      {/* Footer — only on Home */}
      {isHome && <Footer />}
    </div>
  );
};

/* ── Root export — wraps everything in AuthProvider ─────── */
export const App: React.FC = () => (
  <AuthProvider>
    <AppInner />
  </AuthProvider>
);

export default App;
