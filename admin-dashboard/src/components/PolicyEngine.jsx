import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle2, AlertTriangle, ShieldAlert, RefreshCw } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, onSnapshot } from 'firebase/firestore';

const DEFAULT_POLICIES = [
  { id: "ma-financial",     department: "M&A Strategy",    category: "FINANCIAL_DATA",   action: "BLOCK" },
  { id: "eng-source",       department: "Engineering",      category: "SOURCE_CODE",       action: "WARN"  },
  { id: "legal-docs",       department: "Legal",            category: "LEGAL_DOCUMENT",    action: "BLOCK" },
  { id: "hr-person",        department: "Human Resources",  category: "PERSON_NAME",       action: "REDACT"},
  { id: "sales-creds",      department: "Sales",            category: "CREDENTIALS",       action: "BLOCK" },
  { id: "default-cc",       department: "ALL (Default)",    category: "CREDIT_CARD_NUMBER",action: "BLOCK" },
];

export default function PolicyEngine() {
  const [policies, setPolicies] = useState(DEFAULT_POLICIES);
  const [toast, setToast] = useState(null);
  const [syncing, setSyncing] = useState(false);

  // Bootstrap Firestore with defaults & subscribe to live updates
  useEffect(() => {
    const policiesRef = collection(db, 'policies');

    // First, ensure each default policy exists in Firestore (idempotent)
    DEFAULT_POLICIES.forEach(async (p) => {
      const ref = doc(db, 'policies', p.id);
      try {
        await setDoc(ref, { department: p.department, category: p.category, action: p.action }, { merge: true });
      } catch (err) {
        console.warn('Firestore bootstrap skipped (offline?):', err.message);
      }
    });

    // Subscribe to real-time changes
    const unsub = onSnapshot(policiesRef, (snapshot) => {
      if (snapshot.empty) return;
      const live = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setPolicies(live);
    }, (err) => {
      console.warn('Firestore snapshot error (using local state):', err.message);
    });

    return () => unsub();
  }, []);

  const handleActionChange = async (id, newAction) => {
    // Optimistic update
    setPolicies(prev => prev.map(p => p.id === id ? { ...p, action: newAction } : p));
    setSyncing(true);
    try {
      await setDoc(doc(db, 'policies', id), { action: newAction }, { merge: true });
      setToast('Policy updated! Rules synced to all Chrome Extensions.');
    } catch (err) {
      setToast('Firestore write failed — check Firebase config.');
      console.error(err);
    } finally {
      setSyncing(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'BLOCK':  return <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 w-fit"><ShieldAlert size={12}/> BLOCK</span>;
      case 'WARN':   return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 w-fit"><AlertTriangle size={12}/> WARN</span>;
      case 'REDACT': return <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 w-fit"><Shield size={12}/> REDACT</span>;
      default:       return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle2 size={12}/> ALLOW</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-8 bg-emerald-500/20 border border-emerald-500 backdrop-blur-md text-emerald-300 px-4 py-3 rounded-lg flex items-center gap-3 shadow-[0_0_15px_rgba(16,185,129,0.3)] z-50 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={20} />
          <span className="text-sm font-semibold">{toast}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
            <Shield className="text-brand-glow" /> Dynamic Policy Engine
          </h2>
          <p className="text-slate-400 mt-2">
            Changes write to Firestore instantly and are picked up by all active Chrome Extensions.
          </p>
        </div>
        {syncing && (
          <div className="flex items-center gap-2 text-xs text-brand-glow animate-pulse">
            <RefreshCw size={14} className="animate-spin" /> Syncing to Firestore…
          </div>
        )}
      </div>

      <div className="bg-brand-surface/80 backdrop-blur-md border border-brand-border rounded-xl shadow-xl shadow-black/40 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/80 border-b border-brand-border text-xs text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-semibold">Department Scope</th>
              <th className="px-6 py-4 font-semibold">Data Category</th>
              <th className="px-6 py-4 font-semibold">Enforcement Action</th>
              <th className="px-6 py-4 font-semibold text-right">Modify</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/50">
            {policies.map(p => (
              <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-5 font-medium text-slate-200">{p.department}</td>
                <td className="px-6 py-5">
                  <span className="font-mono text-xs text-brand-glow bg-brand-glow/5 border border-brand-glow/10 rounded px-2 py-1">{p.category}</span>
                </td>
                <td className="px-6 py-5">{getActionBadge(p.action)}</td>
                <td className="px-6 py-5 text-right">
                  <select
                    value={p.action}
                    onChange={(e) => handleActionChange(p.id, e.target.value)}
                    className="bg-brand-dark border border-brand-border text-slate-300 text-xs rounded p-2 outline-none focus:border-brand-glow font-bold cursor-pointer"
                  >
                    <option value="BLOCK">Force BLOCK</option>
                    <option value="WARN">Soft WARN</option>
                    <option value="REDACT">Auto REDACT</option>
                    <option value="ALLOW">Pass ALLOW</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

