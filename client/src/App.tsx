import { Routes, Route, Link } from 'react-router-dom';
import Layout from './components/Layout';

// Merchant Management (Task 1)
import {
  MerchantRegistrationWorkflow,
  MerchantDashboardView,
  MerchantProfileManagement,
  MerchantApprovalWorkflow,
} from './components/MerchantManagement';

// Customer Management (Task 2)
import {
  CustomerRegistration,
  CustomerAuthRecovery,
  CustomerProfileManagement,
} from './components/CustomerManagement';

import {
  Store,
  Users,
  Globe,
  Heart,
  Gift,
  ArrowRight,
  Shield,
  LayoutDashboard,
  User,
  ClipboardCheck,
  UserPlus,
  LogIn,
} from 'lucide-react';

/* ──────────────────────────────────────────────
   Reference Home Page (Pixel-Matched to Screenshot)
   ────────────────────────────────────────────── */
function HomePage() {
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Reference Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d2350] via-[#0f285b] to-[#0a1b3d] text-white p-8 md:p-12 shadow-xl border border-blue-900/40">
        {/* Subtle background glow */}
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-[#EDC45B]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          {/* Tag badge */}
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-[#EDC45B]" />
            <span className="text-xs font-black uppercase tracking-widest text-[#EDC45B]">
              ODS GLOBAL NETWORK
            </span>
          </div>

          {/* Dual-Tone Main Headline */}
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Healthcare & Wellness
            <br />
            <span className="text-[#EDC45B]">Management Platform</span>
          </h1>

          {/* Description */}
          <p className="text-blue-100/90 text-sm md:text-base mt-5 leading-relaxed max-w-2xl font-normal">
            The premier digital network connecting healthcare providers, wellness merchants,
            and customers across Ethiopia and the diaspora. Manage registrations, approvals,
            service bookings, and digital gift cards — all in one platform.
          </p>

          {/* Feature Pills Row */}
          <div className="flex flex-wrap items-center gap-6 mt-8 pt-4 border-t border-white/10 text-xs font-medium text-blue-100">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#EDC45B]" />
              <span>Ethiopia & Diaspora</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-[#EDC45B]" />
              <span>8 Healthcare Categories</span>
            </div>
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-[#EDC45B]" />
              <span>Digital Gifting Platform</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Feature Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Merchant Management Card */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-[#0F285B] mb-5">
              <Store className="w-6 h-6" />
            </div>

            <h2 className="text-2xl font-black text-[#0F285B] tracking-tight">
              Merchant Management
            </h2>

            <p className="text-gray-500 text-sm mt-3 leading-relaxed">
              Onboard healthcare and wellness providers. Multi-step registration, document verification,
              compliance approval, and operations dashboard.
            </p>
          </div>

          <div className="mt-8 space-y-2.5 pt-6 border-t border-gray-100">
            <Link
              to="/merchant/register"
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 hover:bg-amber-50/50 hover:border-amber-200 border border-gray-100 text-xs font-semibold text-gray-800 transition-all group"
            >
              <span className="flex items-center gap-2.5">
                <Store className="w-4 h-4 text-[#0F285B]" />
                Merchant Registration
              </span>
              <ArrowRight className="w-4 h-4 text-[#EDC45B] group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/merchant/dashboard"
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 hover:bg-amber-50/50 hover:border-amber-200 border border-gray-100 text-xs font-semibold text-gray-800 transition-all group"
            >
              <span className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-[#0F285B]" />
                Merchant Dashboard
              </span>
              <ArrowRight className="w-4 h-4 text-[#EDC45B] group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/merchant/profile"
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 hover:bg-amber-50/50 hover:border-amber-200 border border-gray-100 text-xs font-semibold text-gray-800 transition-all group"
            >
              <span className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-[#0F285B]" />
                Merchant Profile & Branches
              </span>
              <ArrowRight className="w-4 h-4 text-[#EDC45B] group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/merchant/approval"
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 hover:bg-amber-50/50 hover:border-amber-200 border border-gray-100 text-xs font-semibold text-gray-800 transition-all group"
            >
              <span className="flex items-center gap-2.5">
                <ClipboardCheck className="w-4 h-4 text-[#0F285B]" />
                Approval Queue
              </span>
              <ArrowRight className="w-4 h-4 text-[#EDC45B] group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Customer Management Card */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-[#0F285B] mb-5">
              <Users className="w-6 h-6" />
            </div>

            <h2 className="text-2xl font-black text-[#0F285B] tracking-tight">
              Customer Management
            </h2>

            <p className="text-gray-500 text-sm mt-3 leading-relaxed">
              Customer registration for local and diaspora members. Login portal, password recovery,
              membership cards, and 360° profile hub.
            </p>
          </div>

          <div className="mt-8 space-y-2.5 pt-6 border-t border-gray-100">
            <Link
              to="/customer/register"
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 hover:bg-blue-50/50 hover:border-blue-200 border border-gray-100 text-xs font-semibold text-gray-800 transition-all group"
            >
              <span className="flex items-center gap-2.5">
                <UserPlus className="w-4 h-4 text-[#0F285B]" />
                Customer Registration
              </span>
              <ArrowRight className="w-4 h-4 text-[#EDC45B] group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/customer/login"
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 hover:bg-blue-50/50 hover:border-blue-200 border border-gray-100 text-xs font-semibold text-gray-800 transition-all group"
            >
              <span className="flex items-center gap-2.5">
                <LogIn className="w-4 h-4 text-[#0F285B]" />
                Login & Auth Recovery
              </span>
              <ArrowRight className="w-4 h-4 text-[#EDC45B] group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/customer/profile"
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 hover:bg-blue-50/50 hover:border-blue-200 border border-gray-100 text-xs font-semibold text-gray-800 transition-all group"
            >
              <span className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-[#0F285B]" />
                Customer Profile Hub
              </span>
              <ArrowRight className="w-4 h-4 text-[#EDC45B] group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   App Root Route Definitions
   ────────────────────────────────────────────── */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Reference Home */}
        <Route path="/" element={<HomePage />} />

        {/* Merchant Management Routes */}
        <Route path="/merchant/register" element={<MerchantRegistrationWorkflow />} />
        <Route path="/merchant/dashboard" element={<MerchantDashboardView />} />
        <Route path="/merchant/profile" element={<MerchantProfileManagement />} />
        <Route path="/merchant/approval" element={<MerchantApprovalWorkflow />} />

        {/* Customer Management Routes */}
        <Route path="/customer/register" element={<CustomerRegistration />} />
        <Route path="/customer/login" element={<CustomerAuthRecovery />} />
        <Route path="/customer/profile" element={<CustomerProfileManagement />} />
      </Route>
    </Routes>
  );
}
