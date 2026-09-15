import { Routes, Route, Navigate, Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { MerchantApprovalWorkflow } from '../../components/MerchantManagement';
import { Shield, ClipboardCheck, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';

function AdminHome() {
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Reference Hero Banner for Admin */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d2350] via-[#0f285b] to-[#0a1b3d] text-white p-8 md:p-12 shadow-xl border border-blue-900/40">
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-[#EDC45B]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-[#EDC45B]" />
            <span className="text-xs font-black uppercase tracking-widest text-[#EDC45B]">
              ODS GLOBAL NETWORK • ADMIN CONSOLE
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            System Administration &
            <br />
            <span className="text-[#EDC45B]">Merchant Governance</span>
          </h1>

          <p className="text-blue-100/90 text-sm md:text-base mt-5 leading-relaxed max-w-2xl font-normal">
            Centralized governance portal for healthcare merchant verification, facility document audits,
            KYC compliance authorization, and network provider onboarding.
          </p>

          <div className="mt-8 pt-4 border-t border-white/10 flex flex-wrap gap-4">
            <Link
              to="/approvals"
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#EDC45B] to-[#be9b49] text-[#091838] font-black text-xs rounded-xl shadow-lg hover:brightness-105 transition-all"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Open Merchant Approval Queue</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending KYC Audits</span>
            <span className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </span>
          </div>
          <p className="text-3xl font-black text-[#0F285B] mt-2">12</p>
          <p className="text-xs text-gray-500 mt-1">Providers awaiting compliance review</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Approved Facilities</span>
            <span className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </span>
          </div>
          <p className="text-3xl font-black text-[#0F285B] mt-2">148</p>
          <p className="text-xs text-gray-500 mt-1">Hospitals, clinics & wellness centers</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Environment</span>
            <span className="p-2.5 bg-blue-50 rounded-xl text-[#0F285B]">
              <Shield className="w-5 h-5" />
            </span>
          </div>
          <p className="text-3xl font-black text-[#0F285B] mt-2">Port 3000</p>
          <p className="text-xs text-gray-500 mt-1">Isolated Admin Dev Server</p>
        </div>
      </div>

      {/* Merchant Approval Workflow Section */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 md:p-8">
        <div className="mb-6 pb-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#0F285B]">Merchant Approval Workflow</h2>
            <p className="text-xs text-gray-500 mt-0.5">Task 1: Compliance verification & license evaluation queue</p>
          </div>
        </div>
        <MerchantApprovalWorkflow />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/" element={<AdminHome />} />
        <Route path="/approvals" element={<MerchantApprovalWorkflow />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
