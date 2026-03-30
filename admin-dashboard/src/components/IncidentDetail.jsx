import React from 'react';
import { X, ShieldAlert, ArrowRight, ShieldCheck } from 'lucide-react';

export default function IncidentDetail({ incident, onClose }) {
  if (!incident) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-brand-border flex justify-between items-center bg-slate-900">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white tracking-tight">Incident Details</h2>
              <span className="px-2.5 py-0.5 bg-brand-dark rounded border border-white/10 text-xs font-mono text-slate-400">{incident.id}</span>
            </div>
            <p className="text-sm text-slate-400 mt-1">Detailed forensics and tokenization architecture review.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-900/50">
          
          {/* Metadata Bar */}
          <div className="grid grid-cols-4 gap-4">
            <MetaBox label="Timestamp" value={new Date(incident.timestamp).toLocaleString()} />
            <MetaBox label="User" value={incident.user_id} sub={incident.department} />
            <MetaBox label="Platform" value={incident.platform} />
            <div className="bg-brand-dark/50 border border-brand-border rounded-xl p-4 flex flex-col justify-center items-center relative overflow-hidden">
               <div className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold z-10">Risk Score</div>
               <div className={`text-3xl font-black z-10 ${incident.risk_score > 80 ? 'text-red-500' : incident.risk_score > 50 ? 'text-amber-500' : 'text-emerald-500'}`}>
                 {incident.risk_score}
               </div>
               {/* Background glow based on risk */}
               <div className={`absolute inset-0 opacity-10 ${incident.risk_score > 80 ? 'bg-red-500' : incident.risk_score > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
            </div>
          </div>

          {/* Architecture Proof Section */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShieldCheck className="text-brand-glow" size={16} /> Tokenization Architecture
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
              {/* Left Side: What user typed */}
              <div className="bg-brand-dark border border-brand-border rounded-xl p-5">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. Browser Extension Intercepts</div>
                  <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-mono">RAW INPUT</span>
                </div>
                <div className="text-slate-300 font-mono text-sm leading-relaxed p-4 bg-black/40 rounded-lg border border-white/5 break-words">
                  {/* Reconstruct a "fake" raw prompt by stripping the brackets from the snippet for demo purposes */}
                  {incident.prompt_snippet.replace(/\[REDACTED_FINANCIAL_DATA\]/g, '£12.5M').replace(/\[REDACTED_CREDIT_CARD_NUMBER\]/g, '4242 4242 4242 4242').replace(/\[REDACTED_INTERNAL_API\]/g, 'v1/user/sync_auth')}
                </div>
              </div>

              {/* Center Arrow */}
              <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-brand-blue rounded-full items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)] z-10 border-4 border-slate-900 border-solid">
                <ArrowRight size={20} className="text-white" />
              </div>

              {/* Right Side: What API sent */}
              <div className="bg-brand-dark border border-brand-border rounded-xl p-5">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">2. Tokenized Payload to LLM</div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">SAFE</span>
                </div>
                <div className="text-slate-300 font-mono text-sm leading-relaxed p-4 bg-black/40 rounded-lg border border-white/5 break-words">
                   {incident.prompt_snippet}
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3 text-center">
              *The raw PII never hit our server. Numbers were replaced with Category Tokens via regex locally inside the Chrome Extension before network transit.
            </p>
          </div>

          {/* Reasoning */}
          <div className="bg-brand-dark/30 border border-brand-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest mb-3">Detection Reasoning</h3>
            <div className="flex flex-wrap gap-2 mb-4">
               {incident.categories.map((cat, i) => (
                   <span key={i} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs font-mono border border-slate-700">
                     {cat}
                   </span>
                ))}
            </div>
            <p className="text-slate-400 text-sm italic border-l-2 border-brand-border pl-4 py-1">
              "{incident.reasoning}"
            </p>
          </div>

        </div>
        
        <div className="p-4 border-t border-brand-border bg-slate-900 flex justify-end gap-3">
          <button className="px-4 py-2 border border-brand-border text-slate-300 hover:text-white rounded-lg transition-colors text-sm font-medium">Flag as False Positive</button>
          <button className="px-4 py-2 bg-brand-blue hover:bg-blue-500 text-white rounded-lg shadow-[0_0_10px_rgba(59,130,246,0.4)] transition-colors text-sm font-medium" onClick={onClose}>Acknowledge & Close</button>
        </div>
      </div>
    </div>
  );
}

function MetaBox({ label, value, sub }) {
  return (
    <div className="bg-brand-dark/50 border border-brand-border rounded-xl p-4 flex flex-col justify-center">
      <div className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">{label}</div>
      <div className="text-sm font-medium text-slate-200 truncate">{value}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  )
}
