import { Routes, Route, Navigate, Link } from 'react-router-dom';
import ProviderLayout from './ProviderLayout';
import {
  MerchantDashboardView,
  MerchantRegistrationWorkflow,
  MerchantProfileManagement,
} from '../../components/MerchantManagement';
import { Shield, Store, LayoutDashboard, User, ArrowRight, Activity, CalendarCheck, Gift } from 'lucide-react';

function ProviderHome() {
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Reference Hero Banner for Provider */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d2350] via-[#0f285b] to-[#0a1b3d] text-white p-8 md:p-12 shadow-xl border border-blue-900/40">
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-[#EDC45B]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-[#EDC45B]" />
            <span className="text-xs font-black uppercase tracking-widest text-[#EDC45B]">
              ODS GLOBAL NETWORK • PROVIDER HUB
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Healthcare Provider &
            <br />
            <span className="text-[#EDC45B]">Operations Center</span>
          </h1>

          <p className="text-blue-100/90 text-sm md:text-base mt-5 leading-relaxed max-w-2xl font-normal">
            Comprehensive merchant dashboard for managing healthcare appointments, branch services,
            staff doctor schedules, and digital wellness vouchers across Ethiopia and the diaspora.
          </p>

          <div className="mt-8 pt-4 border-t border-white/10 flex flex-wrap gap-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#EDC45B] to-[#be9b49] text-[#091838] font-black text-xs rounded-xl shadow-lg hover:brightness-105 transition-all"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Open Operations Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs rounded-xl transition-all"
            >
              <Store className="w-4 h-4 text-[#EDC45B]" />
              <span>Onboarding Workflow</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Provider Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/dashboard"
          className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#0F285B]">Live Dashboard</h3>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              Real-time bookings, patient throughput, revenue analytics, and service queue.
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#0F285B] group-hover:text-amber-600 transition-colors">
            Access Dashboard <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>

        <Link
          to="/register"
          className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0F285B] flex items-center justify-center mb-4">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#0F285B]">Onboarding & KYC</h3>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              Register new clinics, submit medical licenses, tax IDs, and facility certificates.
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#0F285B] group-hover:text-amber-600 transition-colors">
            Start Registration <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>

        <Link
          to="/profile"
          className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <User className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#0F285B]">Branch & Profile</h3>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              Manage multi-location branches, operating hours, and doctor roster.
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#0F285B] group-hover:text-amber-600 transition-colors">
            Manage Branches <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>
      </div>

      {/* Embedded Operational View */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 md:p-8">
        <MerchantDashboardView />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<ProviderLayout />}>
        <Route path="/" element={<ProviderHome />} />
        <Route path="/dashboard" element={<MerchantDashboardView />} />
        <Route path="/register" element={<MerchantRegistrationWorkflow />} />
        <Route path="/profile" element={<MerchantProfileManagement />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
