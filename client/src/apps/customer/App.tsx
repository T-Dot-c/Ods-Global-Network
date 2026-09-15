import { Routes, Route, Navigate, Link } from 'react-router-dom';
import CustomerLayout from './CustomerLayout';
import {
  CustomerProfileManagement,
  CustomerRegistration,
  CustomerAuthRecovery,
} from '../../components/CustomerManagement';
import { Shield, Users, UserPlus, LogIn, ArrowRight, Heart, Globe, Gift } from 'lucide-react';

function CustomerHome() {
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Reference Hero Banner for Customer */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d2350] via-[#0f285b] to-[#0a1b3d] text-white p-8 md:p-12 shadow-xl border border-blue-900/40">
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-[#EDC45B]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-[#EDC45B]" />
            <span className="text-xs font-black uppercase tracking-widest text-[#EDC45B]">
              ODS GLOBAL NETWORK • CUSTOMER & DIASPORA
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Personal Health Hub &
            <br />
            <span className="text-[#EDC45B]">Family Care Services</span>
          </h1>

          <p className="text-blue-100/90 text-sm md:text-base mt-5 leading-relaxed max-w-2xl font-normal">
            Access verified healthcare facilities, schedule wellness appointments, and send digital
            healthcare vouchers to family in Ethiopia from anywhere around the globe.
          </p>

          <div className="mt-8 pt-4 border-t border-white/10 flex flex-wrap gap-4">
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#EDC45B] to-[#be9b49] text-[#091838] font-black text-xs rounded-xl shadow-lg hover:brightness-105 transition-all"
            >
              <Users className="w-4 h-4" />
              <span>Open Health Profile Hub</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs rounded-xl transition-all"
            >
              <UserPlus className="w-4 h-4 text-[#EDC45B]" />
              <span>Create Account</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Customer Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/profile"
          className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0F285B] flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#0F285B]">Family Profile Hub</h3>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              Manage family dependents, medical emergency contacts, and active memberships.
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#0F285B] group-hover:text-blue-600 transition-colors">
            View Profile <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>

        <Link
          to="/register"
          className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <UserPlus className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#0F285B]">Diaspora & Local Sign Up</h3>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              Instant registration with Ethiopian mobile numbers or international phone + email.
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#0F285B] group-hover:text-amber-600 transition-colors">
            Register Now <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>

        <Link
          to="/login"
          className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <LogIn className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#0F285B]">Secure Sign In & OTP</h3>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              Two-factor biometric or OTP authentication, password reset, and session management.
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#0F285B] group-hover:text-emerald-600 transition-colors">
            Sign In <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>
      </div>

      {/* Embedded Customer Profile Hub */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 md:p-8">
        <CustomerProfileManagement />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<CustomerHome />} />
        <Route path="/profile" element={<CustomerProfileManagement />} />
        <Route path="/register" element={<CustomerRegistration />} />
        <Route path="/login" element={<CustomerAuthRecovery />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
