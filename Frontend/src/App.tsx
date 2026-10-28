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
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { TermsPage } from './pages/TermsPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { CompanyPage } from './pages/CompanyPage';
import { SupportPage } from './pages/SupportPage';
import { PartnerWithUsPage } from './pages/PartnerWithUsPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { GiftClaimPage } from './pages/GiftClaimPage';
import { ServicesCatalogPage } from './pages/ServicesCatalogPage';
import { ServiceDetailPage } from './pages/ServiceDetailPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AuthProvider, useAuth, UserRole } from './context/AuthContext';

/* ── View type ────────────────────────────────────────────── */
export type View =
  | 'home'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'merchant/dashboard'
  | 'provider/dashboard'
  | 'admin/dashboard'
  | 'unauthorized'
  | 'terms'
  | 'forgot-password'
  | 'reset-password'
  | 'verify-email'
  | 'company'
  | 'support'
  | 'partner-with-us'
  | 'payment/success'
  | 'gift/claim'
  | 'services'
  | 'service-detail'
  | 'notifications';

const DASHBOARD_VIEWS: View[] = [
  'dashboard',
  'merchant/dashboard',
  'provider/dashboard',
  'admin/dashboard',
];

const ROLE_TO_DASHBOARD: Record<UserRole, View> = {
  customer:    'dashboard',
  merchant:    'merchant/dashboard',
  provider:    'provider/dashboard',
  admin:       'admin/dashboard',
  super_admin: 'admin/dashboard',
};

// Normalize any route aliases (e.g. 'dashboard/customer' -> 'dashboard')
function normalizeRoute(path: string): View {
  const clean = path.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!clean || clean === 'home') return 'home';
  if (clean === 'login') return 'login';
  if (clean === 'register') return 'register';
  if (clean === 'unauthorized') return 'unauthorized';
  if (clean === 'terms') return 'terms';
  if (clean === 'forgot-password') return 'forgot-password';
  if (clean === 'reset-password') return 'reset-password';
  if (clean === 'verify-email') return 'verify-email';
  if (clean === 'company') return 'company';
  if (clean === 'support') return 'support';
  if (clean === 'partner-with-us') return 'partner-with-us';
  if (clean === 'payment/success' || clean === 'payment-success' || clean === 'payment/verify') return 'payment/success';
  if (clean === 'gift/claim' || clean === 'gift-claim' || clean === 'gift/redeem' || clean === 'claim') return 'gift/claim';
  if (clean === 'services' || clean === 'service-catalog' || clean === 'catalog') return 'services';
  if (clean.startsWith('services/') || clean.startsWith('service/')) return 'service-detail';

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
  // In-memory recovery email state (never stored in URL query parameters)
  const [recoveryEmail, setRecoveryEmail] = useState<string | null>(null);
  const [selectedServiceSlugOrId, setSelectedServiceSlugOrId] = useState<string | null>(() => {
    const clean = window.location.pathname.replace(/^\/+|\/+$/g, '');
    if (clean.startsWith('services/')) return clean.replace(/^services\//, '');
    if (clean.startsWith('service/')) return clean.replace(/^service\//, '');
    return null;
  });

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const clean = window.location.pathname.replace(/^\/+|\/+$/g, '');
      if (clean.startsWith('services/')) {
        setSelectedServiceSlugOrId(clean.replace(/^services\//, ''));
      }
      setCurrentView(normalizeRoute(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Route protection & session redirect guard
  useEffect(() => {
    if (loading) return;

    if (DASHBOARD_VIEWS.includes(currentView)) {
      if (!user) {
        setCurrentView('login');
        window.history.replaceState(null, '', '/login');
        return;
      }
      const allowedDashboard = ROLE_TO_DASHBOARD[user.role];
      if (currentView !== allowedDashboard) {
        setCurrentView('unauthorized');
        window.history.replaceState(null, '', '/unauthorized');
        return;
      }
    } else if (user) {
      if (
        currentView === 'login' ||
        currentView === 'register' ||
        currentView === 'forgot-password' ||
        currentView === 'reset-password'
      ) {
        const dest = ROLE_TO_DASHBOARD[user.role];
        setCurrentView(dest);
        window.history.replaceState(null, '', `/${dest}`);
      }
    }
  }, [loading, user, currentView]);

  const handleNavigate = (rawView: string) => {
    const targetView = normalizeRoute(rawView);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (rawView.startsWith('services/')) {
      const slug = rawView.replace(/^services\//, '');
      setSelectedServiceSlugOrId(slug);
    } else if (targetView !== 'service-detail') {
      setSelectedServiceSlugOrId(null);
    }

    // ── RBAC protection ────────────────────────────────────
    if (DASHBOARD_VIEWS.includes(targetView)) {
      if (!user) {
        // Unauthenticated → send to login
        setCurrentView('login');
        window.history.pushState(null, '', '/login');
        return;
      }
      // Role mismatch → redirect to dedicated /unauthorized error view
      const allowedDashboard = ROLE_TO_DASHBOARD[user.role];
      if (targetView !== allowedDashboard) {
        setCurrentView('unauthorized');
        window.history.pushState(null, '', '/unauthorized');
        return;
      }
    }

    // Clear recovery email if leaving recovery flow
    if (targetView !== 'reset-password' && targetView !== 'forgot-password') {
      setRecoveryEmail(null);
    }

    setCurrentView(targetView);
    const newPath =
      targetView === 'home'
        ? '/'
        : rawView.startsWith('services/')
        ? `/${rawView}`
        : `/${targetView}`;
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
  const showHeader = isHome || currentView === 'services' || currentView === 'service-detail';
  const showFooter = isHome || currentView === 'services' || currentView === 'service-detail';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header — on Home and Public Catalog pages */}
      {showHeader && <Header currentView={currentView} onNavigate={handleNavigate} />}

      {/* Main content */}
      <main style={{ flex: 1 }}>
        {currentView === 'home'            && <HomePage     onNavigate={handleNavigate} />}
        {currentView === 'login'           && <LoginPage    onNavigate={handleNavigate} />}
        {currentView === 'register'        && <RegisterPage onNavigate={handleNavigate} />}
        {currentView === 'unauthorized'    && <UnauthorizedPage onNavigate={handleNavigate} />}
        {currentView === 'terms'           && <TermsPage onNavigate={handleNavigate} />}
        {currentView === 'company'         && <CompanyPage onNavigate={handleNavigate} />}
        {currentView === 'support'         && <SupportPage onNavigate={handleNavigate} />}
        {currentView === 'partner-with-us' && <PartnerWithUsPage onNavigate={handleNavigate} />}
        {currentView === 'forgot-password' && (
          <ForgotPasswordPage
            onNavigate={handleNavigate}
            onCodeSent={(email) => {
              setRecoveryEmail(email);
              handleNavigate('reset-password');
            }}
          />
        )}
        {currentView === 'reset-password'  && (
          <ResetPasswordPage
            email={recoveryEmail}
            onNavigate={handleNavigate}
            onResetSuccess={() => {
              setRecoveryEmail(null);
            }}
            onStartAgain={() => {
              setRecoveryEmail(null);
              handleNavigate('forgot-password');
            }}
          />
        )}
        {currentView === 'verify-email' && (
          <VerifyEmailPage onNavigate={handleNavigate} />
        )}
        {currentView === 'payment/success' && (
          <PaymentSuccessPage onNavigate={handleNavigate} />
        )}
        {currentView === 'gift/claim' && (
          <GiftClaimPage onNavigate={handleNavigate} />
        )}
        {currentView === 'services' && (
          <ServicesCatalogPage
            onNavigate={handleNavigate}
            onSelectService={(slugOrId) => {
              setSelectedServiceSlugOrId(slugOrId);
              handleNavigate(`services/${slugOrId}`);
            }}
          />
        )}
        {currentView === 'service-detail' && (
          <ServiceDetailPage
            serviceIdOrSlug={selectedServiceSlugOrId || window.location.pathname.replace(/^\/services\//, '')}
            onNavigate={handleNavigate}
          />
        )}
        {currentView === 'notifications' && (
          <NotificationsPage onNavigate={handleNavigate} />
        )}

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
        {currentView === 'admin/dashboard' && (user?.role === 'admin' || user?.role === 'super_admin') && (
          <AdminDashboard onNavigate={handleNavigate} />
        )}
      </main>

      {/* Footer — on Home and Public Catalog pages */}
      {showFooter && <Footer onNavigate={handleNavigate} />}
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
