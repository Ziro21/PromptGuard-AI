import React, { useState } from 'react';
import { FileText, Download, CheckCircle2, ShieldCheck, Database } from 'lucide-react';

export default function Compliance() {
  const [downloading, setDownloading] = useState(false);
  const [complete, setComplete] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setComplete(true);
      // In a real app we'd construct a Blob here, but for the demo we'll just show the success state.
      setTimeout(() => setComplete(false), 5000);
    }, 2500);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
           <FileText className="text-brand-glow" /> Compliance & Audit
        </h2>
        <p className="text-slate-400 mt-2">Generate GDPR Article 30 Records of Processing Activities and manage Data Retention.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* GDPR Export Card */}
        <div className="bg-brand-surface/80 backdrop-blur-md border border-brand-border rounded-xl shadow-xl shadow-black/40 p-8 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-brand-blue/20 rounded-full flex items-center justify-center mb-6 ring-4 ring-brand-blue/10">
            <Download size={32} className="text-brand-glow" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">GDPR Article 30 Report</h3>
          <p className="text-sm text-slate-400 mb-8 max-w-sm">
            Export a comprehensive cryptographically signed PDF detailing all AI prompt interceptions, user actions, and policy enforcement events for the current month.
          </p>
          
          <button 
            onClick={handleDownload}
            disabled={downloading}
            className={`w-full max-w-xs py-3 rounded-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
              complete ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 
              downloading ? 'bg-slate-800 text-slate-400 cursor-not-allowed' : 
              'bg-brand-blue hover:bg-blue-500 text-white shadow-brand-blue/20'
            }`}
          >
            {complete ? (
              <><CheckCircle2 size={18} /> Report Generated</>
            ) : downloading ? (
              <><svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Compiling Data...</>
            ) : (
              'Generate PDF Report'
            )}
          </button>
        </div>

        {/* Data Architecture Card */}
        <div className="space-y-6">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 relative overflow-hidden">
            <div className="flex items-start gap-4 z-10 relative">
              <ShieldCheck className="text-emerald-400 mt-1" size={24} />
              <div>
                <h4 className="text-emerald-300 font-bold mb-1">Zero-Storage Architecture</h4>
                <p className="text-xs text-emerald-400/80 leading-relaxed">
                  PromptGuard AI does not retain the raw text of prompts processed by its engines. Only pseudonymized metadata and hashed token locations are stored in BigQuery for exactly 90 days.
                </p>
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
               <ShieldCheck size={120} />
            </div>
          </div>

          <div className="bg-brand-surface/80 backdrop-blur-md border border-brand-border rounded-xl p-6">
            <h4 className="text-slate-300 font-semibold mb-4 flex items-center gap-2"><Database size={16}/> Data Retention Policy</h4>
            <div className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-sm text-slate-400">Incident Metadata</span>
              <span className="text-sm font-bold text-white bg-slate-800 px-3 py-1 rounded">90 Days</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-sm text-slate-400">Policy Audit Logs</span>
              <span className="text-sm font-bold text-white bg-slate-800 px-3 py-1 rounded">365 Days</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-sm text-slate-400">Raw Prompt Content</span>
              <span className="text-sm font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded">Never Stored</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
