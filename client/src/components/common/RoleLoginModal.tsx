import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROLE_PRESETS, RolePreset, useAuth } from '../../context/AuthContext';
import {
  Shield,
  X,
  Mail,
  Lock,
  ArrowRight,
  Check,
  Sparkles,
  UserCheck,
  Eye,
  EyeOff
} from 'lucide-react';

interface RoleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: string;
}

export default function RoleLoginModal({ isOpen, onClose, defaultRole }: RoleLoginModalProps) {
  const navigate = useNavigate();
  const { login, setRoleSession } = useAuth();

  const [selectedRole, setSelectedRole] = useState<RolePreset>(() => {
    if (defaultRole) {
      const found = ROLE_PRESETS.find((p) => p.role === defaultRole);
      if (found) return found;
    }
    return ROLE_PRESETS[0]; // Super Admin default
  });

  const [email, setEmail] = useState(selectedRole.email);
  const [password, setPassword] = useState(selectedRole.password);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSelectRole = (preset: RolePreset) => {
    setSelectedRole(preset);
    setEmail(preset.email);
    setPassword(preset.password);
    setError('');
  };

  const handleQuickLogin = (preset: RolePreset) => {
    const dest = setRoleSession(preset);
    onClose();
    navigate(dest);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await login(email, password);
      if (res.success) {
        onClose();
        navigate(res.redirectPath);
      } else {
        setError(res.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during sign-in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header with ODS branding */}
        <div className="bg-gradient-to-r from-[#0F285B] via-[#163777] to-[#0A1B3D] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute right-5 top-5 p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-[#EDC45B]/20 text-[#EDC45B]">
              <Shield className="w-5 h-5" />
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-[#EDC45B]">
              ODS GLOBAL NETWORK • UNIFIED AUTH
            </span>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white">
            Role-Based Portal Access
          </h2>
          <p className="text-blue-200/80 text-xs mt-1">
            Choose your role or enter credentials to open the designated dashboard on this single host.
          </p>
        </div>

        <div className="p-6 md:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Quick Role Selector Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-black uppercase tracking-wider text-gray-500">
                1. Select Role Preset (1-Click Test Access)
              </label>
              <span className="text-[11px] text-[#0F285B] font-semibold">
                8 Integrated Roles
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ROLE_PRESETS.map((preset) => {
                const isSelected = selectedRole.role === preset.role;
                return (
                  <button
                    key={preset.role}
                    type="button"
                    onClick={() => handleSelectRole(preset)}
                    className={`p-2.5 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'border-[#0F285B] bg-blue-50/60 shadow-sm ring-2 ring-[#EDC45B]/50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide text-gray-400">
                        {preset.badge.split(' ')[0]}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#0F285B]" />
                      )}
                    </div>
                    <p className="text-xs font-bold text-[#0F285B] mt-1 truncate">
                      {preset.title}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate">
                      {preset.dashboardPath}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Login Banner for Selected Role */}
          <div className="bg-gradient-to-r from-blue-50 via-amber-50/40 to-slate-50 border border-blue-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#EDC45B]" />
                <h4 className="text-xs font-black text-[#0F285B] uppercase">
                  Fast Test: {selectedRole.title}
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-[#0F285B] font-bold">
                  {selectedRole.badge}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Direct route: <code className="bg-white px-1.5 py-0.5 rounded border text-[11px] font-mono text-[#0F285B]">{selectedRole.dashboardPath}</code>
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleQuickLogin(selectedRole)}
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0F285B] to-[#1a3875] text-[#EDC45B] hover:brightness-110 font-bold text-xs shadow transition"
            >
              <UserCheck className="w-4 h-4" />
              <span>1-Click Test Login</span>
            </button>
          </div>

          {/* Form Credentials */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-gray-500">
                2. Or Sign In With Email & Password
              </label>
              {error && (
                <span className="text-xs text-red-600 font-semibold">{error}</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-[#EDC45B] focus:outline-none"
                    placeholder="name@ods.global"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-[#EDC45B] focus:outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#EDC45B] to-[#be9b49] text-[#091838] font-black text-xs rounded-xl shadow-md hover:brightness-105 transition flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating Role...' : `Sign In as ${selectedRole.title}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
