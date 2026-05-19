import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts';
import { DollarSign, FileText, Clock, AlertTriangle, CheckCircle2, Users, Database, Download, RefreshCw, ArrowLeft } from 'lucide-react';
import { api } from '../api-client';

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const fmtCents = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const STATUS_COLORS: Record<string, string> = {
  paid: '#10b981',
  pending: '#f59e0b',
  void: '#94a3b8',
  overdue: '#ef4444',
};

interface DashboardProps {
  onBack: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onBack }) => {
  const [stats, setStats] = useState<any>(null);
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverUp, setServerUp] = useState<boolean | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [s, b] = await Promise.all([api.fetchStats(), api.fetchBackups().catch(() => [])]);
      setStats(s);
      setBackups(b);
      setServerUp(true);
    } catch (err) {
      console.error(err);
      setServerUp(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading dashboard…</div>
      </div>
    );
  }

  if (serverUp === false) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-blue-900 font-bold mb-6"><ArrowLeft size={18} /> Back to Invoice</button>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-amber-900 mb-2">Server not reachable</h2>
          <p className="text-amber-800 text-sm">The dashboard needs the backend running. Your invoice data is still safe in this browser's storage. Re-deploy or check the server logs.</p>
        </div>
      </div>
    );
  }

  const t = stats?.totals || {};
  const statusData = [
    { name: 'Paid', value: t.paid?.total || 0, color: STATUS_COLORS.paid },
    { name: 'Pending', value: t.open?.total || 0, color: STATUS_COLORS.pending },
    { name: 'Void', value: t.void?.total || 0, color: STATUS_COLORS.void },
  ].filter(d => d.value > 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-bold">
              <ArrowLeft size={16} /> Invoice
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Practice Dashboard</h1>
              <div className="text-blue-200 text-xs">Arpi Moradi, RN — Home Health</div>
            </div>
          </div>
          <button onClick={load} className="flex items-center gap-2 text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg font-bold">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* KPI tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiTile icon={<DollarSign />} label="Lifetime Revenue" value={fmt(t.lifetimeRevenue || 0)} accent="emerald" />
          <KpiTile icon={<DollarSign />} label="Revenue YTD" value={fmt(t.ytdRevenue || 0)} accent="blue" />
          <KpiTile icon={<Clock />} label="Open Invoices" value={fmt(t.open?.total || 0)} sub={`${t.open?.count || 0} pending`} accent="amber" />
          <KpiTile icon={<AlertTriangle />} label="Overdue" value={fmt(t.overdue?.total || 0)} sub={`${t.overdue?.count || 0} past due`} accent="rose" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiTile icon={<FileText />} label="Total Invoices" value={String(t.invoices || 0)} accent="slate" />
          <KpiTile icon={<CheckCircle2 />} label="Paid" value={`${t.paid?.count || 0}`} sub={fmt(t.paid?.total || 0)} accent="emerald" />
          <KpiTile icon={<Clock />} label="Pending" value={`${t.open?.count || 0}`} sub={fmt(t.open?.total || 0)} accent="amber" />
          <KpiTile icon={<Database />} label="Backups" value={String(backups.length)} sub="auto-saved" accent="indigo" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 lg:col-span-2">
            <h3 className="font-bold text-slate-800 mb-1">Revenue by Month</h3>
            <p className="text-xs text-slate-500 mb-4">Paid (green) vs outstanding (amber), last 12 months</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats?.months || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmtCents(v)} />
                <Legend />
                <Bar dataKey="paid" name="Paid" fill={STATUS_COLORS.paid} stackId="a" />
                <Bar dataKey="pending" name="Pending" fill={STATUS_COLORS.pending} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-800 mb-1">Status Breakdown</h3>
            <p className="text-xs text-slate-500 mb-4">By invoice $ value</p>
            {statusData.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-slate-400 text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(d) => fmt(d.value)}>
                    {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmtCents(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top clients + recent */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Users size={16} /> Top Clients</h3>
            <div className="space-y-2">
              {(stats?.topClients || []).map((c: any) => (
                <div key={c.name} className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm">
                  <div>
                    <div className="font-bold text-slate-800">{c.name}</div>
                    <div className="text-xs text-slate-500">{c.count} invoice{c.count === 1 ? '' : 's'} · {fmt(c.pending)} pending</div>
                  </div>
                  <div className="text-emerald-700 font-bold">{fmt(c.paid)}</div>
                </div>
              ))}
              {(stats?.topClients || []).length === 0 && <div className="text-sm text-slate-400">No clients yet.</div>}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-800 mb-3">Recent Activity</h3>
            <div className="space-y-2">
              {(stats?.recent || []).map((r: any) => (
                <div key={r.id} className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm">
                  <div>
                    <div className="font-bold text-slate-800">#{r.invoiceNumber} · {r.billToName || '—'}</div>
                    <div className="text-xs text-slate-500">{r.date} · due {r.dueDate}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                      r.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                      r.status === 'void' ? 'bg-slate-100 text-slate-500' :
                      'bg-amber-100 text-amber-700'}`}>{r.status}</span>
                    <div className="font-bold text-slate-800 w-20 text-right">{fmtCents(r.totalAmount || 0)}</div>
                  </div>
                </div>
              ))}
              {(stats?.recent || []).length === 0 && <div className="text-sm text-slate-400">No invoices saved yet.</div>}
            </div>
          </div>
        </div>

        {/* Backups */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Database size={16} /> Backups</h3>
            <div className="flex items-center gap-2">
              <button onClick={async () => { await api.runBackup(); load(); }} className="text-xs font-bold bg-blue-900 text-white px-3 py-1.5 rounded-lg flex items-center gap-1"><RefreshCw size={12} /> Run Now</button>
              <a href="/api/backups/download/latest.db" className="text-xs font-bold bg-emerald-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1"><Download size={12} /> Latest .db</a>
              <a href="/api/export.json" className="text-xs font-bold bg-slate-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1"><Download size={12} /> Export JSON</a>
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-3">Auto-snapshots run after every save; rolling retention keeps the latest 30.</p>
          <div className="max-h-48 overflow-y-auto text-xs">
            {backups.slice(0, 10).map(b => (
              <div key={b.name} className="flex items-center justify-between border-b border-slate-100 py-1.5">
                <span className="font-mono text-slate-600">{b.name}</span>
                <span className="text-slate-400">{(b.size / 1024).toFixed(1)} KB</span>
              </div>
            ))}
            {backups.length === 0 && <div className="text-slate-400">No backups yet — save an invoice to trigger the first snapshot.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

const ACCENT: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  rose: 'bg-rose-50 text-rose-700 border-rose-100',
  slate: 'bg-slate-50 text-slate-700 border-slate-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
};

const KpiTile: React.FC<{ icon: React.ReactNode; label: string; value: string; sub?: string; accent?: keyof typeof ACCENT }> = ({ icon, label, value, sub, accent = 'slate' }) => (
  <div className={`rounded-xl border p-4 ${ACCENT[accent]}`}>
    <div className="flex items-center gap-2 mb-1 opacity-80">
      <div className="w-5 h-5">{icon}</div>
      <div className="text-[10px] font-black uppercase tracking-widest">{label}</div>
    </div>
    <div className="text-2xl font-black">{value}</div>
    {sub && <div className="text-[11px] opacity-70 mt-0.5">{sub}</div>}
  </div>
);
