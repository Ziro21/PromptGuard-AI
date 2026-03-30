import React, { useState } from 'react';
import { ShieldAlert, Activity, Users, AlertTriangle } from 'lucide-react';

export default function Overview({ incidents }) {
  const blocks = incidents.filter(i => i.action === 'BLOCK').length;
  const warns = incidents.filter(i => i.action === 'WARN').length;
  const redacts = incidents.filter(i => i.action === 'REDACT').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-100">Security Overview</h2>
        <p className="text-slate-400">Real-time PromptGuard AI monitoring across your enterprise.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Total Scans (24h)" value="15,482" icon={<Activity className="text-blue-400" size={20} />} trend="+12%" />
        <MetricCard title="Threats Blocked" value={blocks.toString()} icon={<ShieldAlert className="text-red-400" size={20} />} trend="Critical" alert />
        <MetricCard title="Warnings Issued" value={warns.toString()} icon={<AlertTriangle className="text-amber-400" size={20} />} trend="Moderate" />
        <MetricCard title="API Costs Saved" value="£1,420" icon={<Users className="text-emerald-400" size={20} />} trend="This Month" />
      </div>

      <div className="bg-brand-surface/80 backdrop-blur-md border border-brand-border rounded-xl shadow-lg shadow-black/20 p-6 mt-6">
        <h3 className="font-semibold text-slate-200 mb-4">Risk Distribution</h3>
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden flex ring-1 ring-inset ring-white/10">
          <div className="bg-emerald-500 h-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: '85%' }}></div>
          <div className="bg-brand-cyan h-full shadow-[0_0_10px_rgba(6,182,212,0.5)]" style={{ width: '10%' }}></div>
          <div className="bg-amber-500 h-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" style={{ width: '3%' }}></div>
          <div className="bg-red-500 h-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" style={{ width: '2%' }}></div>
        </div>
        <div className="flex justify-between mt-3 text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_currentColor]"></div> Safe (85%)</span>
          <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-brand-cyan shadow-[0_0_8px_currentColor]"></div> Redacted (10%)</span>
          <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_currentColor]"></div> Warned (3%)</span>
          <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_currentColor]"></div> Blocked (2%)</span>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, trend, alert }) {
  return (
    <div className="bg-brand-surface/80 backdrop-blur-md border border-brand-border rounded-xl shadow-lg shadow-black/20 p-5 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        <div className="p-2 bg-slate-800/50 rounded-lg ring-1 ring-white/5">{icon}</div>
      </div>
      <div>
        <div className="text-3xl font-bold text-slate-100 font-mono tracking-tight">{value}</div>
        <div className={`text-xs font-semibold mt-1.5 uppercase letter-spacing-wider ${alert ? 'text-red-400' : 'text-slate-400'}`}>
          {trend}
        </div>
      </div>
    </div>
  );
}
