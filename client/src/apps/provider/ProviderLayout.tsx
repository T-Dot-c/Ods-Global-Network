import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  LayoutGrid,
  Store,
  LayoutDashboard,
  User,
  ChevronDown,
  Menu,
  X,
  Building2,
} from 'lucide-react';
import ODSLogo from '../../components/common/ODSLogo';

export default function ProviderLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Provider Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-[#091838] text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto shrink-0 border-r border-[#162a56] ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="px-6 pt-7 pb-6 flex items-center justify-between border-b border-white/5">
          <Link to="/" className="flex items-center gap-3">
            <ODSLogo size="md" roleSubtitle="PROVIDER HUB" />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav Area */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
          {/* Reference Home Button */}
          <NavLink
            to="/"
            end
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${
                isActive
                  ? 'border-[#EDC45B]/60 bg-[#162a56]/90 text-[#EDC45B] shadow-inner font-bold'
                  : 'border-[#223d77] bg-white/[0.03] text-white/90 hover:bg-white/[0.07] hover:border-white/30'
              }`
            }
          >
            <LayoutGrid className="w-4 h-4 text-[#EDC45B]" />
            <span>Home</span>
          </NavLink>

          {/* Collapsible Section */}
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-200/60 hover:text-white transition-colors"
            >
              <span>MERCHANT OPERATIONS</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  expanded ? 'rotate-0' : '-rotate-90'
                }`}
              />
            </button>

            {expanded && (
              <div className="space-y-1 pt-0.5">
                <NavLink
                  to="/dashboard"
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-[#EDC45B] to-[#be9b49] text-[#091838] font-bold shadow-md'
                        : 'text-white/80 hover:text-white hover:bg-white/[0.06]'
                    }`
                  }
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0 opacity-90" />
                  <span>Operations Dashboard</span>
                </NavLink>

                <NavLink
                  to="/register"
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-[#EDC45B] to-[#be9b49] text-[#091838] font-bold shadow-md'
                        : 'text-white/80 hover:text-white hover:bg-white/[0.06]'
                    }`
                  }
                >
                  <Store className="w-4 h-4 shrink-0 opacity-90" />
                  <span>Onboarding & Registration</span>
                </NavLink>

                <NavLink
                  to="/profile"
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-[#EDC45B] to-[#be9b49] text-[#091838] font-bold shadow-md'
                        : 'text-white/80 hover:text-white hover:bg-white/[0.06]'
                    }`
                  }
                >
                  <User className="w-4 h-4 shrink-0 opacity-90" />
                  <span>Branch & Profile Manager</span>
                </NavLink>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-white/5 text-[11px] text-white/50 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#EDC45B]" />
            Port 3001 — Provider
          </span>
          <span className="w-2 h-2 rounded-full bg-[#EDC45B] animate-pulse" />
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
        <header className="lg:hidden h-16 bg-[#091838] text-white flex items-center justify-between px-4 shrink-0 border-b border-white/10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-white/80 hover:bg-white/10"
          >
            <Menu className="w-5 h-5" />
          </button>
          <ODSLogo size="sm" roleSubtitle="PROVIDER HUB" />
          <div className="w-5" />
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
