import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function Login({ onLogin }) {
  // Simple mock login for presentation purposes if firebase isn't set up yet
  const handleFakeLogin = (e) => {
    e.preventDefault();
    onLogin({ 
      uid: "mock-admin-123", 
      displayName: "Security Admin", 
      email: "admin@natwest.com" 
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <ShieldCheck size={36} className="text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          PromptGuard AI
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Enterprise GenAI Security Operations Center
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 py-8 px-4 shadow-xl border border-slate-700 rounded-2xl sm:px-10">
          <div className="space-y-6">
            <div>
              <button
                onClick={handleFakeLogin}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-slate-900 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 mr-3" />
                Sign in with Google Workspace
              </button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-800 text-slate-400">Restricted Access</span>
              </div>
            </div>

            <p className="text-xs text-center text-slate-500">
              Only authorized NatWest cyber security personnel may access this dashboard. All login attempts are logged and monitored.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
