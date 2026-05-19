// Arpi Moradi Invoice — backend API
// Express + better-sqlite3, serves built Vite frontend from dist/
// Auto-backs up data.db on every write (rolling 30 keeps).

import express from 'express';
import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const DB_PATH = path.join(ROOT, 'data.db');
const BACKUP_DIR = path.join(ROOT, 'backups');
const DIST_DIR = path.join(ROOT, 'dist');

if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT,
  saved_at TEXT,
  status TEXT,
  total_amount REAL,
  bill_to_name TEXT,
  bill_to_email TEXT,
  date TEXT,
  due_date TEXT,
  data_json TEXT,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
`);

let backupTimer = null;
function scheduleBackup() {
  if (backupTimer) clearTimeout(backupTimer);
  backupTimer = setTimeout(runBackup, 5000);
}
function runBackup() {
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dest = path.join(BACKUP_DIR, `data-${stamp}.db`);
    db.backup(dest).then(() => {
      // rolling retention: keep latest 30
      const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('data-') && f.endsWith('.db'))
        .sort();
      while (files.length > 30) {
        const old = files.shift();
        try { fs.unlinkSync(path.join(BACKUP_DIR, old)); } catch {}
      }
    }).catch(err => console.error('Backup failed:', err));
  } catch (err) {
    console.error('Backup schedule failed:', err);
  }
}

// Daily backup tick (in case server runs continuously)
setInterval(runBackup, 24 * 60 * 60 * 1000);

const app = express();
app.use(express.json({ limit: '20mb' }));

// --- Health
app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// --- Invoices
app.get('/api/invoices', (_req, res) => {
  const rows = db.prepare('SELECT data_json, status FROM invoices ORDER BY saved_at DESC').all();
  const out = rows.map(r => ({ ...JSON.parse(r.data_json), status: r.status }));
  res.json(out);
});

app.put('/api/invoices/:id', (req, res) => {
  const inv = req.body;
  if (!inv || !inv.id) return res.status(400).json({ error: 'missing id' });
  const stmt = db.prepare(`
    INSERT INTO invoices (id, invoice_number, saved_at, status, total_amount, bill_to_name, bill_to_email, date, due_date, data_json, updated_at)
    VALUES (@id, @invoiceNumber, @savedAt, @status, @totalAmount, @billToName, @billToEmail, @date, @dueDate, @data_json, @updated_at)
    ON CONFLICT(id) DO UPDATE SET
      invoice_number=excluded.invoice_number,
      saved_at=excluded.saved_at,
      status=excluded.status,
      total_amount=excluded.total_amount,
      bill_to_name=excluded.bill_to_name,
      bill_to_email=excluded.bill_to_email,
      date=excluded.date,
      due_date=excluded.due_date,
      data_json=excluded.data_json,
      updated_at=excluded.updated_at
  `);
  stmt.run({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber || '',
    savedAt: inv.savedAt || new Date().toISOString(),
    status: inv.status || 'pending',
    totalAmount: Number(inv.totalAmount || 0),
    billToName: inv.billToName || '',
    billToEmail: inv.billToEmail || '',
    date: inv.date || '',
    dueDate: inv.dueDate || '',
    data_json: JSON.stringify(inv),
    updated_at: new Date().toISOString(),
  });
  scheduleBackup();
  res.json({ ok: true });
});

app.patch('/api/invoices/:id/status', (req, res) => {
  const { status } = req.body || {};
  if (!['pending', 'paid', 'void'].includes(status)) return res.status(400).json({ error: 'bad status' });
  db.prepare('UPDATE invoices SET status=?, updated_at=? WHERE id=?').run(status, new Date().toISOString(), req.params.id);
  scheduleBackup();
  res.json({ ok: true });
});

app.delete('/api/invoices/:id', (req, res) => {
  db.prepare('DELETE FROM invoices WHERE id=?').run(req.params.id);
  scheduleBackup();
  res.json({ ok: true });
});

// --- Customers
app.get('/api/customers', (_req, res) => {
  const rows = db.prepare('SELECT id, name, address, phone, email FROM customers ORDER BY name').all();
  res.json(rows);
});

app.put('/api/customers/:id', (req, res) => {
  const c = req.body;
  if (!c || !c.id) return res.status(400).json({ error: 'missing id' });
  db.prepare(`
    INSERT INTO customers (id, name, address, phone, email, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name, address=excluded.address, phone=excluded.phone, email=excluded.email, updated_at=excluded.updated_at
  `).run(c.id, c.name || '', c.address || '', c.phone || '', c.email || '', new Date().toISOString());
  scheduleBackup();
  res.json({ ok: true });
});

app.delete('/api/customers/:id', (req, res) => {
  db.prepare('DELETE FROM customers WHERE id=?').run(req.params.id);
  scheduleBackup();
  res.json({ ok: true });
});

// --- Bulk sync (used by the frontend on load to push localStorage state up)
app.post('/api/sync', (req, res) => {
  const { invoices = [], customers = [] } = req.body || {};
  const tx = db.transaction(() => {
    const upsertInv = db.prepare(`
      INSERT INTO invoices (id, invoice_number, saved_at, status, total_amount, bill_to_name, bill_to_email, date, due_date, data_json, updated_at)
      VALUES (@id, @invoiceNumber, @savedAt, @status, @totalAmount, @billToName, @billToEmail, @date, @dueDate, @data_json, @updated_at)
      ON CONFLICT(id) DO UPDATE SET
        invoice_number=excluded.invoice_number, saved_at=excluded.saved_at, status=excluded.status,
        total_amount=excluded.total_amount, bill_to_name=excluded.bill_to_name, bill_to_email=excluded.bill_to_email,
        date=excluded.date, due_date=excluded.due_date, data_json=excluded.data_json, updated_at=excluded.updated_at
    `);
    const upsertCust = db.prepare(`
      INSERT INTO customers (id, name, address, phone, email, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET name=excluded.name, address=excluded.address, phone=excluded.phone, email=excluded.email, updated_at=excluded.updated_at
    `);
    for (const inv of invoices) {
      if (!inv || !inv.id) continue;
      upsertInv.run({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber || '',
        savedAt: inv.savedAt || new Date().toISOString(),
        status: inv.status || 'pending',
        totalAmount: Number(inv.totalAmount || 0),
        billToName: inv.billToName || '',
        billToEmail: inv.billToEmail || '',
        date: inv.date || '',
        dueDate: inv.dueDate || '',
        data_json: JSON.stringify(inv),
        updated_at: new Date().toISOString(),
      });
    }
    for (const c of customers) {
      if (!c || !c.id) continue;
      upsertCust.run(c.id, c.name || '', c.address || '', c.phone || '', c.email || '', new Date().toISOString());
    }
  });
  tx();
  scheduleBackup();
  res.json({ ok: true, count: { invoices: invoices.length, customers: customers.length } });
});

// --- Stats for dashboard
app.get('/api/stats', (_req, res) => {
  const rows = db.prepare(`
    SELECT id, invoice_number, saved_at, status, total_amount, bill_to_name, date, due_date
    FROM invoices
  `).all();

  const now = new Date();
  const ytdStart = new Date(now.getFullYear(), 0, 1);

  let open = { count: 0, total: 0 };
  let paid = { count: 0, total: 0 };
  let voidT = { count: 0, total: 0 };
  let overdue = { count: 0, total: 0 };
  let ytdRevenue = 0;
  const byMonth = {}; // YYYY-MM -> { paid, pending }
  const byClient = {}; // name -> { paid, pending, total }
  const recent = [];

  for (const r of rows) {
    const amt = Number(r.total_amount || 0);
    const status = r.status || 'pending';
    if (status === 'paid') { paid.count++; paid.total += amt; }
    else if (status === 'void') { voidT.count++; voidT.total += amt; }
    else { open.count++; open.total += amt; }

    if (status === 'pending' && r.due_date) {
      const d = new Date(r.due_date);
      if (d < now) { overdue.count++; overdue.total += amt; }
    }

    const refDate = r.date || (r.saved_at ? r.saved_at.slice(0, 10) : '');
    if (status === 'paid' && refDate) {
      const refD = new Date(refDate);
      if (refD >= ytdStart) ytdRevenue += amt;
    }

    if (refDate) {
      const ym = refDate.slice(0, 7);
      if (!byMonth[ym]) byMonth[ym] = { month: ym, paid: 0, pending: 0 };
      if (status === 'paid') byMonth[ym].paid += amt;
      else if (status === 'pending') byMonth[ym].pending += amt;
    }

    const cname = r.bill_to_name || 'Unspecified';
    if (!byClient[cname]) byClient[cname] = { name: cname, paid: 0, pending: 0, total: 0, count: 0 };
    byClient[cname].count++;
    byClient[cname].total += amt;
    if (status === 'paid') byClient[cname].paid += amt;
    if (status === 'pending') byClient[cname].pending += amt;

    recent.push({
      id: r.id,
      invoiceNumber: r.invoice_number,
      savedAt: r.saved_at,
      status,
      totalAmount: amt,
      billToName: r.bill_to_name,
      date: r.date,
      dueDate: r.due_date,
    });
  }

  recent.sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''));

  const months = Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);
  const topClients = Object.values(byClient).sort((a, b) => b.total - a.total).slice(0, 8);

  res.json({
    totals: {
      invoices: rows.length,
      open, paid, void: voidT, overdue,
      ytdRevenue,
      lifetimeRevenue: paid.total,
    },
    months,
    topClients,
    recent: recent.slice(0, 12),
  });
});

// --- Backup management
app.get('/api/backups', (_req, res) => {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('data-') && f.endsWith('.db'))
    .sort()
    .reverse()
    .map(f => {
      const st = fs.statSync(path.join(BACKUP_DIR, f));
      return { name: f, size: st.size, modified: st.mtime };
    });
  res.json(files);
});

app.post('/api/backups/run', (_req, res) => {
  runBackup();
  res.json({ ok: true });
});

app.get('/api/backups/download/latest.db', (_req, res) => {
  const files = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('data-') && f.endsWith('.db')).sort().reverse();
  if (files.length === 0) return res.status(404).send('no backups');
  res.download(path.join(BACKUP_DIR, files[0]));
});

app.get('/api/export.json', (_req, res) => {
  const invoices = db.prepare('SELECT data_json, status FROM invoices').all().map(r => ({ ...JSON.parse(r.data_json), status: r.status }));
  const customers = db.prepare('SELECT id, name, address, phone, email FROM customers').all();
  res.setHeader('Content-Disposition', `attachment; filename="arpi-export-${new Date().toISOString().slice(0,10)}.json"`);
  res.json({ exportedAt: new Date().toISOString(), invoices, customers });
});

// --- Static frontend
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Arpi Invoice server running on :${PORT}`);
  runBackup();
});
