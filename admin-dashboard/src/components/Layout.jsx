import React from 'react';
import { LayoutDashboard, AlertCircle, Settings, Users, LogOut, ShieldCheck, FileText } from 'lucide-react';

export default function Layout({ children, onLogout, user, activeView, setActiveView }) {
  return (
    <div className="flex h-screen bg-transparent overflow-hidden font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/40 backdrop-blur-xl border-r border-white/5 text-slate-300 flex flex-col items-center">
        <div className="h-16 flex items-center w-full px-6 border-b border-white/5 shadow-sm">
          <ShieldCheck className="text-brand-glow mr-2" size={24} />
          <span className="text-white font-bold tracking-tight text-lg mt-0.5">PromptGuard AI</span>
        </div>
        
        <nav className="flex-1 w-full px-3 py-6 space-y-1">
          <NavItem icon={<LayoutDashboard size={18} />} label="Overview" active={activeView === 'overview'} onClick={() => setActiveView('overview')} />
          <NavItem icon={<AlertCircle size={18} />} label="Incidents" badge="5" active={activeView === 'incidents'} onClick={() => setActiveView('incidents')} />
          <NavItem icon={<Settings size={18} />} label="Policies" active={activeView === 'policies'} onClick={() => setActiveView('policies')} />
          <NavItem icon={<FileText size={18} />} label="Compliance & Audit" active={activeView === 'compliance'} onClick={() => setActiveView('compliance')} />
        </nav>

        <div className="p-4 w-full border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs uppercase">
              {user?.displayName ? user.displayName.charAt(0) : 'A'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white max-w-[120px] truncate">{user?.displayName || "Admin User"}</span>
              <span className="text-[10px] text-slate-500">Super Admin</span>
            </div>
          </div>
          <button onClick={onLogout} className="text-slate-500 hover:text-white transition-colors p-1" title="Sign Out">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-brand-dark/50 backdrop-blur-md border-b border-white/5 px-8 flex items-center justify-between z-10 w-full relative">
          <h1 className="text-lg font-semibold text-slate-200">Security Operations Center</h1>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
            </span>
            <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">System Healthy</span>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8 pt-6 pb-20 scrollbar-hide">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>

    </div>
  );
}

function NavItem({ icon, label, active, badge, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-brand-blue/90 shadow-lg text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      {badge && <span className="bg-brand-dark/50 text-brand-glow py-0.5 px-2 rounded-full text-[10px] font-bold border border-brand-glow/10">{badge}</span>}
    </button>
  );
}
