import React, { useState } from 'react';
import { Shield, ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';
import IncidentDetail from './IncidentDetail';

export default function IncidentTable({ incidents }) {
  const [selectedIncident, setSelectedIncident] = useState(null);
  const getActionStyles = (action) => {
    switch (action) {
      case 'BLOCK': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'WARN': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'REDACT': return 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20';
      default: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  const getActionIcon = (action) => {
    switch(action) {
      case 'BLOCK': return <ShieldAlert size={14} className="mr-1 inline" />;
      case 'WARN': return <AlertTriangle size={14} className="mr-1 inline" />;
      case 'REDACT': return <Shield size={14} className="mr-1 inline" />;
      default: return <CheckCircle2 size={14} className="mr-1 inline" />;
    }
  }

  return (
    <div className="bg-brand-surface/80 backdrop-blur-md border border-brand-border rounded-xl shadow-xl shadow-black/40 overflow-hidden mt-6 animate-in slide-in-from-bottom-4 duration-700">
      <div className="p-5 border-b border-brand-border flex justify-between items-center bg-slate-900/50">
        <div>
          <h3 className="font-semibold text-slate-200">Recent Incidents</h3>
          <p className="text-xs text-slate-400 mt-1">Real-time prompt interventions across all LLM platforms.</p>
        </div>
        <div className="text-sm font-medium text-brand-glow hover:text-white transition-colors cursor-pointer flex items-center gap-1">
          View All Logs <span className="text-lg opacity-70">&rarr;</span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300 table-fixed">
          <thead className="text-[11px] text-slate-400 uppercase bg-slate-900/80 border-b border-brand-border">
            <tr>
              <th className="px-5 py-4 font-semibold tracking-wider w-[12%]">Timestamp</th>
              <th className="px-5 py-4 font-semibold tracking-wider w-[15%]">User</th>
              <th className="px-5 py-4 font-semibold tracking-wider w-[10%]">Platform</th>
              <th className="px-5 py-4 font-semibold tracking-wider w-[13%]">Action / Risk</th>
              <th className="px-5 py-4 font-semibold tracking-wider w-[40%]">Prompt Content</th>
              <th className="px-5 py-4 font-semibold tracking-wider w-[10%] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/50">
            {incidents.map((incident) => (
              <tr key={incident.id} className="hover:bg-slate-800/50 transition-colors group">
                <td className="px-5 py-5 text-[11px] font-mono whitespace-nowrap text-slate-400">
                  {new Date(incident.timestamp).toLocaleString(undefined, {
                    month: 'short', day: '2-digit', hour: '2-digit', minute:'2-digit'
                  })}
                </td>
                <td className="px-5 py-5">
                  <div className="font-medium text-slate-200 truncate">{incident.user_id.split('@')[0]}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5 truncate">{incident.department}</div>
                </td>
                <td className="px-5 py-5 font-medium text-slate-300">
                  <span className="px-2 py-1 bg-slate-800 rounded text-xs border border-white/5">{incident.platform}</span>
                </td>
                <td className="px-5 py-5">
                  <div className="flex flex-col gap-1.5 items-start">
                    <span className={`px-2 py-1 flex items-center rounded text-[10px] uppercase tracking-wide font-bold border ${getActionStyles(incident.action)} shadow-[0_0_10px_currentColor] opacity-90`}>
                      {getActionIcon(incident.action)} {incident.action}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Score: {incident.risk_score}/99</span>
                  </div>
                </td>
                <td className="px-5 py-5">
                  <div className="max-w-full">
                    <div className="text-xs font-medium text-slate-300 break-words mb-2 leading-relaxed bg-brand-dark/50 p-2.5 rounded border border-white/5 font-mono">
                      {incident.prompt_snippet}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {incident.categories.map((cat, i) => (
                         <span key={i} className="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded text-[9px] font-mono border border-slate-700 uppercase tracking-wider">
                           {cat}
                         </span>
                      ))}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-5 text-right w-full align-middle">
                   <button 
                     onClick={() => setSelectedIncident(incident)}
                     className="text-[11px] font-semibold text-brand-glow border border-brand-glow/30 bg-brand-glow/10 hover:bg-brand-glow hover:text-white transition-all px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 uppercase tracking-wide">
                     Review
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Detail Modal */}
      {selectedIncident && (
        <IncidentDetail incident={selectedIncident} onClose={() => setSelectedIncident(null)} />
      )}
    </div>
  );
}
