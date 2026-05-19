// Tiny REST client used by App.tsx to keep server in sync with localStorage.
import { Customer, SavedInvoice } from './types';

const base = (typeof window !== 'undefined' && window.location.origin) || '';

async function jfetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(base + url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) throw new Error(`API ${url} -> ${res.status}`);
  return res.json();
}

export const api = {
  async ping() {
    try { return await jfetch<{ ok: boolean }>('/api/health'); }
    catch { return { ok: false }; }
  },
  syncAll(payload: { invoices: SavedInvoice[]; customers: Customer[] }) {
    return jfetch('/api/sync', { method: 'POST', body: JSON.stringify(payload) });
  },
  saveInvoice(inv: SavedInvoice) {
    return jfetch(`/api/invoices/${encodeURIComponent(inv.id)}`, { method: 'PUT', body: JSON.stringify(inv) });
  },
  setStatus(id: string, status: 'pending' | 'paid' | 'void') {
    return jfetch(`/api/invoices/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  },
  deleteInvoice(id: string) {
    return jfetch(`/api/invoices/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
  saveCustomer(c: Customer) {
    return jfetch(`/api/customers/${encodeURIComponent(c.id)}`, { method: 'PUT', body: JSON.stringify(c) });
  },
  deleteCustomer(id: string) {
    return jfetch(`/api/customers/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
  fetchInvoices() {
    return jfetch<SavedInvoice[]>('/api/invoices');
  },
  fetchCustomers() {
    return jfetch<Customer[]>('/api/customers');
  },
  fetchStats() {
    return jfetch<any>('/api/stats');
  },
  fetchBackups() {
    return jfetch<{ name: string; size: number; modified: string }[]>('/api/backups');
  },
  runBackup() {
    return jfetch('/api/backups/run', { method: 'POST' });
  },
};
