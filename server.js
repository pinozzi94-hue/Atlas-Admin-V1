'use strict';

require('dotenv').config();
const express = require('express');
const path = require('path');
const fsp = require('fs/promises');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');

const app = express();
const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '127.0.0.1';
const IS_PROD = process.env.NODE_ENV === 'production';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 10);
const SESSION_SECRET = process.env.SESSION_SECRET || 'local-demo-secret-change-before-production-please-123456789';
const DATA_FILE = path.resolve(process.cwd(), process.env.DATA_FILE || './data/database.json');
const DATA_DIR = path.dirname(DATA_FILE);
const PUBLIC_DIR = path.join(__dirname, 'public');

if (IS_PROD) {
  const weakSecret = SESSION_SECRET.length < 32 || SESSION_SECRET.includes('change-before-production') || SESSION_SECRET.startsWith('local-demo');
  if (weakSecret) {
    console.error('ERRORE: in produzione imposta SESSION_SECRET con almeno 32 caratteri casuali.');
    process.exit(1);
  }
  if (ADMIN_PASSWORD === 'Admin123!' || ADMIN_PASSWORD.length < 12) {
    console.error('ERRORE: in produzione imposta ADMIN_PASSWORD con almeno 12 caratteri.');
    process.exit(1);
  }
  if (!process.env.ADMIN_USERNAME) {
    console.error('ERRORE: in produzione imposta ADMIN_USERNAME.');
    process.exit(1);
  }
}

const SCHEMAS = {
  users: {
    label: 'Utenti',
    fields: {
      name: { type: 'string', label: 'Nome completo', required: true, max: 100 },
      email: { type: 'email', label: 'Email', required: true, max: 180 },
      role: { type: 'enum', label: 'Ruolo', options: ['Admin', 'Editor', 'Customer'], default: 'Customer' },
      status: { type: 'enum', label: 'Stato', options: ['Active', 'Invited', 'Blocked'], default: 'Active' },
      joinedAt: { type: 'date', label: 'Data iscrizione', defaultNow: true }
    },
    search: ['name', 'email', 'role', 'status']
  },
  products: {
    label: 'Prodotti',
    fields: {
      name: { type: 'string', label: 'Nome prodotto', required: true, max: 140 },
      sku: { type: 'string', label: 'SKU', required: true, max: 60 },
      category: { type: 'string', label: 'Categoria', required: true, max: 80 },
      price: { type: 'number', label: 'Prezzo (€)', required: true, min: 0, max: 1000000 },
      stock: { type: 'number', label: 'Scorte', required: true, min: 0, max: 10000000, integer: true },
      status: { type: 'enum', label: 'Stato', options: ['Active', 'Draft', 'Archived'], default: 'Active' }
    },
    search: ['name', 'sku', 'category', 'status']
  },
  orders: {
    label: 'Ordini',
    fields: {
      number: { type: 'string', label: 'Numero ordine', required: true, max: 50 },
      customer: { type: 'string', label: 'Cliente', required: true, max: 100 },
      email: { type: 'email', label: 'Email cliente', required: true, max: 180 },
      total: { type: 'number', label: 'Totale (€)', required: true, min: 0, max: 10000000 },
      status: { type: 'enum', label: 'Stato', options: ['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'], default: 'Pending' },
      date: { type: 'date', label: 'Data ordine', defaultNow: true }
    },
    search: ['number', 'customer', 'email', 'status']
  },
  posts: {
    label: 'Contenuti',
    fields: {
      title: { type: 'string', label: 'Titolo', required: true, max: 180 },
      slug: { type: 'string', label: 'Slug URL', required: true, max: 180 },
      author: { type: 'string', label: 'Autore', required: true, max: 100 },
      status: { type: 'enum', label: 'Stato', options: ['Published', 'Draft', 'Review'], default: 'Draft' },
      updatedAt: { type: 'date', label: 'Ultimo aggiornamento', defaultNow: true }
    },
    search: ['title', 'slug', 'author', 'status']
  },
  tickets: {
    label: 'Assistenza',
    fields: {
      subject: { type: 'string', label: 'Oggetto', required: true, max: 180 },
      customer: { type: 'string', label: 'Cliente', required: true, max: 100 },
      email: { type: 'email', label: 'Email', required: true, max: 180 },
      priority: { type: 'enum', label: 'Priorità', options: ['Low', 'Normal', 'High', 'Urgent'], default: 'Normal' },
      status: { type: 'enum', label: 'Stato', options: ['Open', 'In progress', 'Resolved'], default: 'Open' },
      createdAt: { type: 'date', label: 'Creato il', defaultNow: true }
    },
    search: ['subject', 'customer', 'email', 'priority', 'status']
  }
};
const EDITABLE_COLLECTIONS = Object.keys(SCHEMAS);

const isoDaysAgo = (days, hour = 12) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

function freshDatabase() {
  return {
    users: [
      { id: 'usr_1001', name: 'Sofia Conti', email: 'sofia.conti@example.com', role: 'Admin', status: 'Active', joinedAt: isoDaysAgo(2) },
      { id: 'usr_1002', name: 'Luca Moretti', email: 'luca.moretti@example.com', role: 'Editor', status: 'Active', joinedAt: isoDaysAgo(8) },
      { id: 'usr_1003', name: 'Giulia Romano', email: 'giulia.romano@example.com', role: 'Customer', status: 'Active', joinedAt: isoDaysAgo(12) },
      { id: 'usr_1004', name: 'Marco Ricci', email: 'marco.ricci@example.com', role: 'Customer', status: 'Invited', joinedAt: isoDaysAgo(15) },
      { id: 'usr_1005', name: 'Emma Gallo', email: 'emma.gallo@example.com', role: 'Customer', status: 'Blocked', joinedAt: isoDaysAgo(19) },
      { id: 'usr_1006', name: 'Alessandro Greco', email: 'alessandro.greco@example.com', role: 'Editor', status: 'Active', joinedAt: isoDaysAgo(25) }
    ],
    products: [
      { id: 'prd_2001', name: 'Aurora Desk Lamp', sku: 'LMP-AUR-01', category: 'Illuminazione', price: 89.9, stock: 42, status: 'Active' },
      { id: 'prd_2002', name: 'Forma Chair', sku: 'CHR-FRM-02', category: 'Arredamento', price: 249, stock: 18, status: 'Active' },
      { id: 'prd_2003', name: 'Studio Notebook', sku: 'PPR-STU-03', category: 'Cartoleria', price: 14.5, stock: 126, status: 'Active' },
      { id: 'prd_2004', name: 'Terra Planter', sku: 'PLT-TER-04', category: 'Casa', price: 39, stock: 7, status: 'Active' },
      { id: 'prd_2005', name: 'Arc Shelf', sku: 'SHF-ARC-05', category: 'Arredamento', price: 179, stock: 0, status: 'Draft' },
      { id: 'prd_2006', name: 'Cloud Throw', sku: 'TXT-CLD-06', category: 'Tessili', price: 64, stock: 31, status: 'Active' }
    ],
    orders: [
      { id: 'ord_3001', number: '#AT-1048', customer: 'Sofia Conti', email: 'sofia.conti@example.com', total: 338.9, status: 'Completed', date: isoDaysAgo(1) },
      { id: 'ord_3002', number: '#AT-1047', customer: 'Matteo Neri', email: 'matteo.neri@example.com', total: 89.9, status: 'Processing', date: isoDaysAgo(2) },
      { id: 'ord_3003', number: '#AT-1046', customer: 'Elena Costa', email: 'elena.costa@example.com', total: 253.5, status: 'Pending', date: isoDaysAgo(2) },
      { id: 'ord_3004', number: '#AT-1045', customer: 'Andrea Villa', email: 'andrea.villa@example.com', total: 64, status: 'Shipped', date: isoDaysAgo(4) },
      { id: 'ord_3005', number: '#AT-1044', customer: 'Giulia Romano', email: 'giulia.romano@example.com', total: 179, status: 'Cancelled', date: isoDaysAgo(6) },
      { id: 'ord_3006', number: '#AT-1043', customer: 'Paolo Ferri', email: 'paolo.ferri@example.com', total: 128.4, status: 'Completed', date: isoDaysAgo(8) }
    ],
    posts: [
      { id: 'pst_4001', title: 'Come progettare uno spazio che ispira', slug: 'spazio-che-ispira', author: 'Luca Moretti', status: 'Published', updatedAt: isoDaysAgo(1) },
      { id: 'pst_4002', title: 'Materiali e forme: la guida essenziale', slug: 'materiali-e-forme', author: 'Sofia Conti', status: 'Published', updatedAt: isoDaysAgo(3) },
      { id: 'pst_4003', title: 'Dietro le quinte della nuova collezione', slug: 'dietro-le-quinte', author: 'Alessandro Greco', status: 'Review', updatedAt: isoDaysAgo(5) },
      { id: 'pst_4004', title: 'Palette naturali per ogni stagione', slug: 'palette-naturali', author: 'Luca Moretti', status: 'Draft', updatedAt: isoDaysAgo(7) }
    ],
    tickets: [
      { id: 'tkt_5001', subject: 'Aggiornamento indirizzo di spedizione', customer: 'Matteo Neri', email: 'matteo.neri@example.com', priority: 'High', status: 'Open', createdAt: isoDaysAgo(0, 9) },
      { id: 'tkt_5002', subject: 'Richiesta informazioni sul prodotto', customer: 'Elena Costa', email: 'elena.costa@example.com', priority: 'Normal', status: 'In progress', createdAt: isoDaysAgo(1, 14) },
      { id: 'tkt_5003', subject: 'Ricevuta ordine non ricevuta', customer: 'Andrea Villa', email: 'andrea.villa@example.com', priority: 'Low', status: 'Resolved', createdAt: isoDaysAgo(3, 10) },
      { id: 'tkt_5004', subject: 'Articolo arrivato danneggiato', customer: 'Paolo Ferri', email: 'paolo.ferri@example.com', priority: 'Urgent', status: 'Open', createdAt: isoDaysAgo(4, 16) }
    ],
    settings: {
      siteName: 'Atlas Studio',
      siteUrl: 'https://example.com',
      supportEmail: 'support@example.com',
      timezone: 'Europe/Rome',
      currency: 'EUR',
      itemsPerPage: '10',
      maintenanceMode: false,
      emailNotifications: true
    },
    logs: [
      { id: 'log_6001', action: 'Sistema inizializzato', resource: 'system', details: 'Dati demo creati', actor: 'system', createdAt: new Date().toISOString() }
    ]
  };
}

let database;
let writeQueue = Promise.resolve();

async function initialiseDatabase() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fsp.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    const defaults = freshDatabase();
    database = { ...defaults, ...parsed };
    for (const key of [...EDITABLE_COLLECTIONS, 'logs']) {
      if (!Array.isArray(database[key])) database[key] = defaults[key] || [];
    }
    if (!database.settings || typeof database.settings !== 'object') database.settings = defaults.settings;
    await persistDatabase();
    console.log(`Dati caricati da ${DATA_FILE}`);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Database JSON non leggibile. Il file verra salvato come database.corrupt.json e verranno creati dati demo.');
      try { await fsp.copyFile(DATA_FILE, `${DATA_FILE}.corrupt.json`); } catch (_) {}
    }
    database = freshDatabase();
    await persistDatabase();
    console.log(`Creato archivio dati iniziale: ${DATA_FILE}`);
  }
}

function persistDatabase() {
  writeQueue = writeQueue.catch(() => {}).then(async () => {
    const tempPath = `${DATA_FILE}.tmp`;
    await fsp.writeFile(tempPath, JSON.stringify(database, null, 2), { encoding: 'utf8', mode: 0o600 });
    await fsp.rename(tempPath, DATA_FILE);
  });
  return writeQueue;
}

function audit(action, resource, details, actor = 'admin') {
  database.logs.unshift({
    id: `log_${crypto.randomBytes(5).toString('hex')}`,
    action,
    resource,
    details: String(details || '').slice(0, 240),
    actor,
    createdAt: new Date().toISOString()
  });
  database.logs = database.logs.slice(0, 300);
}

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

app.disable('x-powered-by');
app.set('trust proxy', IS_PROD ? 1 : false);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      imgSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(cookieSession({
  name: 'atlas_admin_session',
  keys: [SESSION_SECRET],
  maxAge: 8 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: 'strict',
  secure: IS_PROD,
  path: '/'
}));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Troppi tentativi. Riprova tra qualche minuto.' }
});

function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) return res.status(401).json({ error: 'Sessione scaduta. Accedi di nuovo.' });
  next();
}
function requireCsrf(req, res, next) {
  const provided = req.get('x-csrf-token');
  const expected = req.session && req.session.csrfToken;
  if (!provided || !expected || provided !== expected) return res.status(403).json({ error: 'Token di sicurezza non valido. Aggiorna la pagina.' });
  next();
}
function validatePayload(collection, payload, isUpdate = false) {
  const schema = SCHEMAS[collection];
  if (!schema) return { error: 'Sezione non modificabile.' };
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return { error: 'Dati non validi.' };
  const clean = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!Object.prototype.hasOwnProperty.call(schema.fields, key)) return { error: `Campo non consentito: ${key}` };
    const field = schema.fields[key];
    if (value === '' || value === null || typeof value === 'undefined') {
      if (field.required) return { error: `Il campo "${field.label}" è obbligatorio.` };
      if (!isUpdate) clean[key] = field.defaultNow ? new Date().toISOString() : (field.default ?? '');
      continue;
    }
    if (field.type === 'string' || field.type === 'email' || field.type === 'date') {
      if (typeof value !== 'string' && typeof value !== 'number') return { error: `Valore non valido per "${field.label}".` };
      const str = String(value).trim();
      if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) return { error: `Inserisci un'email valida per "${field.label}".` };
      if (field.type === 'date' && Number.isNaN(Date.parse(str))) return { error: `Data non valida per "${field.label}".` };
      if (field.max && str.length > field.max) return { error: `Il campo "${field.label}" è troppo lungo.` };
      clean[key] = field.type === 'date' ? new Date(str).toISOString() : str;
    } else if (field.type === 'number') {
      const number = Number(value);
      if (!Number.isFinite(number) || number < field.min || number > field.max || (field.integer && !Number.isInteger(number))) {
        return { error: `Valore numerico non valido per "${field.label}".` };
      }
      clean[key] = number;
    } else if (field.type === 'enum') {
      if (!field.options.includes(value)) return { error: `Valore non consentito per "${field.label}".` };
      clean[key] = value;
    }
  }
  if (!isUpdate) {
    for (const [key, field] of Object.entries(schema.fields)) {
      if (!(key in clean)) {
        if (field.required) return { error: `Il campo "${field.label}" è obbligatorio.` };
        if (field.defaultNow) clean[key] = new Date().toISOString();
        else if (field.default !== undefined) clean[key] = field.default;
      }
    }
  }
  return { clean };
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/api/auth/session', (req, res) => {
  if (!req.session || !req.session.user) return res.json({ authenticated: false });
  return res.json({ authenticated: true, user: req.session.user, csrfToken: req.session.csrfToken });
});
app.post('/api/auth/login', loginLimiter, asyncRoute(async (req, res) => {
  const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const userMatches = username.length <= 100 && username === ADMIN_USERNAME;
  const passwordMatches = password.length <= 1000 && await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  if (!userMatches || !passwordMatches) {
    audit('Accesso negato', 'auth', `Tentativo fallito per ${username.slice(0, 80) || 'utente sconosciuto'}`, 'sistema');
    await persistDatabase();
    return res.status(401).json({ error: 'Credenziali non corrette.' });
  }
  req.session = { user: { username: ADMIN_USERNAME, role: 'Super Admin' }, csrfToken: crypto.randomBytes(32).toString('hex') };
  audit('Accesso effettuato', 'auth', 'Login amministratore', ADMIN_USERNAME);
  await persistDatabase();
  return res.json({ authenticated: true, user: req.session.user, csrfToken: req.session.csrfToken });
}));
app.post('/api/auth/logout', requireAuth, requireCsrf, asyncRoute(async (req, res) => {
  audit('Disconnessione', 'auth', 'Logout amministratore', req.session.user.username);
  await persistDatabase();
  req.session = null;
  res.json({ ok: true });
}));

app.get('/api/overview', requireAuth, (req, res) => {
  const successfulOrders = database.orders.filter(o => o.status !== 'Cancelled');
  const revenue = successfulOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const pendingOrders = database.orders.filter(o => ['Pending', 'Processing'].includes(o.status)).length;
  const openTickets = database.tickets.filter(t => t.status !== 'Resolved').length;
  const activeProducts = database.products.filter(p => p.status === 'Active').length;
  const daily = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(); day.setDate(day.getDate() - i); day.setHours(0, 0, 0, 0);
    const next = new Date(day); next.setDate(next.getDate() + 1);
    const amount = database.orders.filter(o => o.status !== 'Cancelled' && new Date(o.date) >= day && new Date(o.date) < next).reduce((sum, o) => sum + Number(o.total || 0), 0);
    daily.push({ label: day.toLocaleDateString('it-IT', { weekday: 'short' }), date: day.toISOString(), value: Number(amount.toFixed(2)) });
  }
  res.json({
    metrics: { revenue, orders: database.orders.length, users: database.users.length, products: activeProducts, pendingOrders, openTickets },
    revenueSeries: daily,
    recentOrders: [...database.orders].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
    recentActivity: database.logs.slice(0, 6),
    logCount: database.logs.length,
    inventoryAlerts: database.products.filter(p => Number(p.stock) <= 10).sort((a, b) => a.stock - b.stock).slice(0, 5),
    statusCounts: {
      orders: ['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'].map(status => ({ status, count: database.orders.filter(o => o.status === status).length })),
      tickets: ['Open', 'In progress', 'Resolved'].map(status => ({ status, count: database.tickets.filter(t => t.status === status).length }))
    }
  });
});

app.get('/api/data/:collection', requireAuth, (req, res) => {
  const { collection } = req.params;
  if (collection === 'logs') return res.json(database.logs);
  if (!EDITABLE_COLLECTIONS.includes(collection)) return res.status(404).json({ error: 'Sezione non trovata.' });
  res.json(database[collection]);
});

app.post('/api/data/:collection', requireAuth, requireCsrf, asyncRoute(async (req, res) => {
  const { collection } = req.params;
  if (!EDITABLE_COLLECTIONS.includes(collection)) return res.status(404).json({ error: 'Sezione non trovata o non modificabile.' });
  const result = validatePayload(collection, req.body);
  if (result.error) return res.status(400).json({ error: result.error });
  const item = { id: `${collection.slice(0, 3)}_${crypto.randomBytes(5).toString('hex')}`, ...result.clean };
  if (collection === 'users' && database.users.some(u => u.email.toLowerCase() === item.email.toLowerCase())) return res.status(409).json({ error: 'Esiste già un utente con questa email.' });
  if (collection === 'products' && database.products.some(p => p.sku.toLowerCase() === item.sku.toLowerCase())) return res.status(409).json({ error: 'Questo SKU è già utilizzato.' });
  if (collection === 'orders' && database.orders.some(o => o.number.toLowerCase() === item.number.toLowerCase())) return res.status(409).json({ error: 'Questo numero ordine esiste già.' });
  if (collection === 'posts' && database.posts.some(p => p.slug.toLowerCase() === item.slug.toLowerCase())) return res.status(409).json({ error: 'Questo slug esiste già.' });
  database[collection].unshift(item);
  audit('Creato', collection, `${SCHEMAS[collection].label}: ${primaryLabel(collection, item)}`, req.session.user.username);
  await persistDatabase();
  res.status(201).json(item);
}));

app.put('/api/data/:collection/:id', requireAuth, requireCsrf, asyncRoute(async (req, res) => {
  const { collection, id } = req.params;
  if (!EDITABLE_COLLECTIONS.includes(collection)) return res.status(404).json({ error: 'Sezione non trovata o non modificabile.' });
  const index = database[collection].findIndex(row => row.id === id);
  if (index < 0) return res.status(404).json({ error: 'Elemento non trovato.' });
  const result = validatePayload(collection, req.body, true);
  if (result.error) return res.status(400).json({ error: result.error });
  const merged = { ...database[collection][index], ...result.clean, id };
  if (collection === 'users' && database.users.some(u => u.id !== id && u.email.toLowerCase() === String(merged.email).toLowerCase())) return res.status(409).json({ error: 'Esiste già un utente con questa email.' });
  if (collection === 'products' && database.products.some(p => p.id !== id && p.sku.toLowerCase() === String(merged.sku).toLowerCase())) return res.status(409).json({ error: 'Questo SKU è già utilizzato.' });
  if (collection === 'orders' && database.orders.some(o => o.id !== id && o.number.toLowerCase() === String(merged.number).toLowerCase())) return res.status(409).json({ error: 'Questo numero ordine esiste già.' });
  if (collection === 'posts' && database.posts.some(p => p.id !== id && p.slug.toLowerCase() === String(merged.slug).toLowerCase())) return res.status(409).json({ error: 'Questo slug esiste già.' });
  database[collection][index] = merged;
  audit('Modificato', collection, `${SCHEMAS[collection].label}: ${primaryLabel(collection, merged)}`, req.session.user.username);
  await persistDatabase();
  res.json(merged);
}));

app.delete('/api/data/:collection/:id', requireAuth, requireCsrf, asyncRoute(async (req, res) => {
  const { collection, id } = req.params;
  if (!EDITABLE_COLLECTIONS.includes(collection)) return res.status(404).json({ error: 'Sezione non trovata o non modificabile.' });
  const index = database[collection].findIndex(row => row.id === id);
  if (index < 0) return res.status(404).json({ error: 'Elemento non trovato.' });
  const [removed] = database[collection].splice(index, 1);
  audit('Eliminato', collection, `${SCHEMAS[collection].label}: ${primaryLabel(collection, removed)}`, req.session.user.username);
  await persistDatabase();
  res.json({ ok: true });
}));

function primaryLabel(collection, item) {
  const key = ({ users: 'name', products: 'name', orders: 'number', posts: 'title', tickets: 'subject' })[collection] || 'id';
  return String(item[key] || item.id || 'elemento').slice(0, 120);
}

app.get('/api/settings', requireAuth, (req, res) => res.json(database.settings));
app.patch('/api/settings', requireAuth, requireCsrf, asyncRoute(async (req, res) => {
  const allowed = ['siteName', 'siteUrl', 'supportEmail', 'timezone', 'currency', 'itemsPerPage', 'maintenanceMode', 'emailNotifications'];
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return res.status(400).json({ error: 'Impostazioni non valide.' });
  const clean = {};
  for (const [key, value] of Object.entries(req.body)) {
    if (!allowed.includes(key)) return res.status(400).json({ error: `Impostazione non consentita: ${key}` });
    if (['maintenanceMode', 'emailNotifications'].includes(key)) {
      if (typeof value !== 'boolean') return res.status(400).json({ error: `Valore non valido per ${key}.` });
      clean[key] = value;
    } else {
      if (typeof value !== 'string' || value.trim().length > 180) return res.status(400).json({ error: `Valore non valido per ${key}.` });
      clean[key] = value.trim();
    }
  }
  if (clean.siteName !== undefined && !clean.siteName) return res.status(400).json({ error: 'Il nome del sito è obbligatorio.' });
  if (clean.siteUrl && !/^https?:\/\//i.test(clean.siteUrl)) return res.status(400).json({ error: 'L’URL del sito deve iniziare con http:// o https://.' });
  if (clean.currency && !['EUR', 'USD', 'GBP'].includes(clean.currency)) return res.status(400).json({ error: 'Valuta non supportata.' });
  if (clean.timezone && !['Europe/Rome', 'UTC', 'Europe/London', 'America/New_York'].includes(clean.timezone)) return res.status(400).json({ error: 'Fuso orario non supportato.' });
  if (clean.supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.supportEmail)) return res.status(400).json({ error: 'Inserisci un indirizzo email valido.' });
  if (clean.itemsPerPage && !['10', '25', '50', '100'].includes(clean.itemsPerPage)) return res.status(400).json({ error: 'Elementi per pagina non validi.' });
  database.settings = { ...database.settings, ...clean };
  audit('Impostazioni aggiornate', 'settings', 'Configurazione generale modificata', req.session.user.username);
  await persistDatabase();
  res.json(database.settings);
}));

app.get('/api/export/:collection', requireAuth, (req, res) => {
  const { collection } = req.params;
  if (![...EDITABLE_COLLECTIONS, 'logs'].includes(collection)) return res.status(404).json({ error: 'Sezione non trovata.' });
  const rows = database[collection];
  const keys = rows.length ? [...new Set(rows.flatMap(row => Object.keys(row)))] : ['id'];
  const csvCell = (value) => {
    let cell = String(value ?? '');
    if (/^[=+@\-\t\r]/.test(cell)) cell = `'${cell}`;
    return `"${cell.replace(/"/g, '""')}"`;
  };
  const csv = [keys.map(csvCell).join(','), ...rows.map(row => keys.map(key => csvCell(row[key])).join(','))].join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="atlas-${collection}.csv"`);
  res.send(`\uFEFF${csv}`);
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint API non trovato.' }));
app.use(express.static(PUBLIC_DIR, { index: 'index.html', maxAge: IS_PROD ? '1h' : 0 }));
app.get('/{*path}', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});
app.use((err, req, res, _next) => {
  console.error(`[${new Date().toISOString()}]`, err && err.stack ? err.stack : err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Si è verificato un errore interno. Riprova.' });
});

async function start() {
  await initialiseDatabase();
  const server = app.listen(PORT, HOST, () => {
    console.log('');
    console.log('  Atlas Admin è pronto!');
    console.log(`  Indirizzo: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
    console.log(`  Ambiente: ${process.env.NODE_ENV || 'development'}`);
    if (!IS_PROD) console.log(`  Accesso demo: ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}`);
    console.log('  Premi CTRL+C per fermare il server.');
    console.log('');
  });
  const shutdown = () => server.close(async () => { try { await writeQueue; } catch (_) {} process.exit(0); });
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch(error => {
  console.error('Impossibile avviare Atlas Admin:', error);
  process.exit(1);
});
