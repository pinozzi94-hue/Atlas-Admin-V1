'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const numberFormat = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 });
let activeCurrency = 'EUR';
let activeTimezone = 'Europe/Rome';
function formatMoney(value) {
  try { return new Intl.NumberFormat('it-IT', { style: 'currency', currency: activeCurrency, maximumFractionDigits: 2 }).format(Number(value || 0)); }
  catch (_) { return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(Number(value || 0)); }
}

const COLLECTIONS = {
  users: {
    label: 'Utenti', singular: 'utente', icon: '♙', subtitle: 'Gestisci accessi, ruoli e stato degli utenti.',
    fields: [
      { key: 'name', label: 'Nome completo', type: 'text', required: true, placeholder: 'Es. Giulia Bianchi' },
      { key: 'email', label: 'Email', type: 'email', required: true, placeholder: 'nome@example.com' },
      { key: 'role', label: 'Ruolo', type: 'select', options: ['Admin', 'Editor', 'Customer'], default: 'Customer' },
      { key: 'status', label: 'Stato', type: 'select', options: ['Active', 'Invited', 'Blocked'], default: 'Active' },
      { key: 'joinedAt', label: 'Data iscrizione', type: 'date' }
    ],
    columns: ['name', 'role', 'status', 'joinedAt'], search: ['name', 'email', 'role', 'status'],
    filterOptions: ['Active', 'Invited', 'Blocked']
  },
  products: {
    label: 'Prodotti', singular: 'prodotto', icon: '▦', subtitle: 'Organizza catalogo, prezzi, disponibilità e stato.',
    fields: [
      { key: 'name', label: 'Nome prodotto', type: 'text', required: true, placeholder: 'Nome del prodotto' },
      { key: 'sku', label: 'SKU', type: 'text', required: true, placeholder: 'Es. PRD-001' },
      { key: 'category', label: 'Categoria', type: 'text', required: true, placeholder: 'Es. Arredamento' },
      { key: 'price', label: 'Prezzo', type: 'number', required: true, min: 0, step: '.01' },
      { key: 'stock', label: 'Scorte disponibili', type: 'number', required: true, min: 0, step: '1' },
      { key: 'status', label: 'Stato', type: 'select', options: ['Active', 'Draft', 'Archived'], default: 'Active' }
    ],
    columns: ['name', 'category', 'price', 'stock', 'status'], search: ['name', 'sku', 'category', 'status'],
    filterOptions: ['Active', 'Draft', 'Archived']
  },
  orders: {
    label: 'Ordini', singular: 'ordine', icon: '▤', subtitle: 'Monitora pagamenti, lavorazione e consegne.',
    fields: [
      { key: 'number', label: 'Numero ordine', type: 'text', required: true, placeholder: 'Es. #AT-1049' },
      { key: 'customer', label: 'Cliente', type: 'text', required: true },
      { key: 'email', label: 'Email cliente', type: 'email', required: true },
      { key: 'total', label: 'Totale', type: 'number', required: true, min: 0, step: '.01' },
      { key: 'status', label: 'Stato', type: 'select', options: ['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'], default: 'Pending' },
      { key: 'date', label: 'Data ordine', type: 'date' }
    ],
    columns: ['number', 'customer', 'total', 'status', 'date'], search: ['number', 'customer', 'email', 'status'],
    filterOptions: ['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled']
  },
  posts: {
    label: 'Contenuti', singular: 'contenuto', icon: '▧', subtitle: 'Gestisci bozze, pubblicazioni e autori.',
    fields: [
      { key: 'title', label: 'Titolo', type: 'text', required: true },
      { key: 'slug', label: 'Slug URL', type: 'text', required: true, placeholder: 'titolo-del-contenuto' },
      { key: 'author', label: 'Autore', type: 'text', required: true },
      { key: 'status', label: 'Stato', type: 'select', options: ['Published', 'Draft', 'Review'], default: 'Draft' },
      { key: 'updatedAt', label: 'Ultimo aggiornamento', type: 'date' }
    ],
    columns: ['title', 'author', 'status', 'updatedAt'], search: ['title', 'slug', 'author', 'status'],
    filterOptions: ['Published', 'Draft', 'Review']
  },
  tickets: {
    label: 'Assistenza', singular: 'ticket', icon: '◌', subtitle: 'Tieni sotto controllo le richieste e le priorità.',
    fields: [
      { key: 'subject', label: 'Oggetto', type: 'text', required: true },
      { key: 'customer', label: 'Cliente', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'priority', label: 'Priorità', type: 'select', options: ['Low', 'Normal', 'High', 'Urgent'], default: 'Normal' },
      { key: 'status', label: 'Stato', type: 'select', options: ['Open', 'In progress', 'Resolved'], default: 'Open' },
      { key: 'createdAt', label: 'Creato il', type: 'date' }
    ],
    columns: ['subject', 'customer', 'priority', 'status', 'createdAt'], search: ['subject', 'customer', 'email', 'priority', 'status'],
    filterOptions: ['Open', 'In progress', 'Resolved']
  }
};
const PAGE_INFO = {
  overview: { label: 'Panoramica', title: 'La tua attività, a colpo d’occhio.', subtitle: 'Ecco cosa sta succedendo oggi nel tuo workspace.' },
  users: { label: 'Utenti', title: 'Persone e permessi.', subtitle: 'Gestisci gli utenti che fanno parte della tua piattaforma.' },
  products: { label: 'Prodotti', title: 'Il tuo catalogo, sotto controllo.', subtitle: 'Organizza articoli, prezzi e scorte in un unico posto.' },
  orders: { label: 'Ordini', title: 'Tutti gli ordini, in ordine.', subtitle: 'Segui ogni acquisto dall’apertura alla consegna.' },
  posts: { label: 'Contenuti', title: 'Le idee prendono forma.', subtitle: 'Tieni organizzati contenuti, autori e pubblicazioni.' },
  tickets: { label: 'Assistenza', title: 'Un buon supporto fa la differenza.', subtitle: 'Gestisci le richieste e dai priorità a ciò che conta.' },
  analytics: { label: 'Report & analisi', title: 'I numeri raccontano la storia.', subtitle: 'Un riepilogo operativo dei dati presenti nel workspace.' },
  logs: { label: 'Registro attività', title: 'Ogni azione, tracciata.', subtitle: 'Consulta le modifiche registrate nel pannello amministrativo.' },
  settings: { label: 'Impostazioni', title: 'Il tuo spazio, le tue regole.', subtitle: 'Configura le preferenze generali di Atlas Studio.' }
};

const state = {
  authenticated: false, user: null, csrfToken: '', page: 'overview', rows: [], allRows: {}, query: '', filter: 'all', pageNumber: 1, pageSize: 10, dashboard: null, settings: null, settingsTab: 'general', saving: false
};

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function initials(value) {
  return String(value || 'AD').trim().split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase() || 'AD';
}
function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? escapeHtml(value) : new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', year: 'numeric', timeZone: activeTimezone }).format(date);
}
function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? escapeHtml(value) : new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: activeTimezone }).format(date);
}
function humanTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const diff = Math.max(0, Date.now() - date.getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'adesso';
  if (mins < 60) return `${mins} min fa`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h fa`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? 'giorno' : 'giorni'} fa`;
  return formatDate(value);
}
function slugify(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function statusClass(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function statusLabel(value) {
  const labels = { Active: 'Attivo', Invited: 'Invitato', Blocked: 'Bloccato', Admin: 'Admin', Editor: 'Editor', Customer: 'Cliente', Pending: 'In attesa', Processing: 'In lavorazione', Shipped: 'Spedito', Completed: 'Completato', Cancelled: 'Annullato', Published: 'Pubblicato', Draft: 'Bozza', Review: 'In revisione', Open: 'Aperto', 'In progress': 'In corso', Resolved: 'Risolto', Low: 'Bassa', Normal: 'Normale', High: 'Alta', Urgent: 'Urgente', 'Super Admin': 'Super amministratore' };
  return labels[value] || value || '—';
}
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  $('#toast-region').append(toast);
  window.setTimeout(() => toast.remove(), 3800);
}
function setLoading(element, text = 'Salvataggio…') {
  if (!element) return () => {};
  const previous = element.innerHTML;
  element.disabled = true;
  element.innerHTML = `<span class="spinner" style="width:13px;height:13px;border-width:2px;border-color:#ffffff66;border-top-color:#fff"></span> ${escapeHtml(text)}`;
  return () => { element.disabled = false; element.innerHTML = previous; };
}

async function api(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = { ...(options.headers || {}) };
  if (options.body && typeof options.body !== 'string') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && state.csrfToken) headers['X-CSRF-Token'] = state.csrfToken;
  const response = await fetch(url, { ...options, method, headers, credentials: 'same-origin' });
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    if (response.status === 401 && !url.startsWith('/api/auth/')) showLogin();
    const message = data && typeof data === 'object' && data.error ? data.error : `Richiesta non riuscita (${response.status}).`;
    throw new Error(message);
  }
  return data;
}

function showLogin() {
  state.authenticated = false;
  state.user = null;
  state.csrfToken = '';
  $('#app-shell').classList.add('hidden');
  $('#login-screen').classList.remove('hidden');
  $('#login-password').value = '';
  $('#login-error').textContent = '';
  setTimeout(() => $('#login-username').focus(), 30);
}
function showApp(user, csrfToken) {
  state.authenticated = true;
  state.user = user;
  state.csrfToken = csrfToken;
  $('#login-screen').classList.add('hidden');
  $('#app-shell').classList.remove('hidden');
  $('#current-user-name').textContent = user.username;
  $('#user-avatar').textContent = initials(user.username);
  $('#topbar-profile').textContent = initials(user.username);
  $('#footer-year').textContent = new Date().getFullYear();
  setWelcomeDate();
  navigate('overview');
}
function setWelcomeDate() {
  const now = new Date();
  $('#welcome-date').textContent = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: activeTimezone }).format(now).toUpperCase();
}

async function startApp() {
  try {
    const session = await api('/api/auth/session');
    if (session.authenticated) showApp(session.user, session.csrfToken);
    else showLogin();
  } catch (error) {
    showLogin();
    showToast('Non riesco a collegarmi al server. Aggiorna la pagina.', 'error');
  }
}

$('#login-form').addEventListener('submit', async event => {
  event.preventDefault();
  const submit = $('#login-submit');
  const restore = setLoading(submit, 'Accesso…');
  $('#login-error').textContent = '';
  try {
    const result = await api('/api/auth/login', { method: 'POST', body: { username: $('#login-username').value.trim(), password: $('#login-password').value } });
    showApp(result.user, result.csrfToken);
    showToast(`Bentornato, ${result.user.username}.`, 'success');
  } catch (error) {
    $('#login-error').textContent = error.message || 'Accesso non riuscito.';
  } finally { restore(); }
});
$('#toggle-password').addEventListener('click', () => {
  const input = $('#login-password');
  const visible = input.type === 'password';
  input.type = visible ? 'text' : 'password';
  $('#toggle-password').textContent = visible ? 'Nascondi' : 'Mostra';
});

async function navigate(page) {
  if (!PAGE_INFO[page]) page = 'overview';
  state.page = page;
  state.query = '';
  state.filter = 'all';
  state.pageNumber = 1;
  $('#global-search').value = '';
  $$('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.page === page));
  $('#breadcrumb-current').textContent = PAGE_INFO[page].label;
  $('#welcome-title').textContent = PAGE_INFO[page].title;
  $('#welcome-subtitle').textContent = PAGE_INFO[page].subtitle;
  $('#welcome-date').classList.toggle('hidden', page !== 'overview');
  $('#welcome-date').textContent = page === 'overview' ? $('#welcome-date').textContent : PAGE_INFO[page].label.toUpperCase();
  $('#export-current').classList.toggle('hidden', page === 'settings');
  $('#primary-action').classList.toggle('hidden', page === 'settings' || page === 'analytics' || page === 'logs');
  closeSidebar();
  const target = $('#page-content');
  target.innerHTML = '<div class="loading-block"><span class="spinner"></span> Caricamento…</div>';
  try {
    if (page === 'overview') {
      state.settings = await api('/api/settings');
      activeCurrency = state.settings.currency || 'EUR';
      activeTimezone = state.settings.timezone || 'Europe/Rome';
      state.pageSize = Number(state.settings.itemsPerPage) || 10;
      $('#workspace-name').textContent = state.settings.siteName || 'Atlas Studio';
      setWelcomeDate();
      state.dashboard = await api('/api/overview');
      renderOverview();
      await refreshNavCounts();
    } else if (COLLECTIONS[page]) {
      state.rows = await api(`/api/data/${page}`);
      state.allRows[page] = state.rows;
      renderCollection();
      await refreshNavCounts();
    } else if (page === 'analytics') {
      const [overview, orders, users, products, tickets] = await Promise.all([
        api('/api/overview'), api('/api/data/orders'), api('/api/data/users'), api('/api/data/products'), api('/api/data/tickets')
      ]);
      state.dashboard = overview;
      state.allRows = { ...state.allRows, orders, users, products, tickets };
      renderAnalytics();
    } else if (page === 'logs') {
      state.rows = await api('/api/data/logs');
      renderLogs();
    } else if (page === 'settings') {
      state.settings = await api('/api/settings');
      activeCurrency = state.settings.currency || 'EUR';
      activeTimezone = state.settings.timezone || 'Europe/Rome';
      state.pageSize = Number(state.settings.itemsPerPage) || 10;
      renderSettings();
      $('#workspace-name').textContent = state.settings.siteName || 'Atlas Studio';
    }
  } catch (error) {
    target.innerHTML = `<div class="error-block">${escapeHtml(error.message)} <button id="retry-page">Riprova</button></div>`;
    $('#retry-page')?.addEventListener('click', () => navigate(page));
  }
}

async function refreshNavCounts() {
  const setCount = (id, count) => { const el = $(id); if (el) el.textContent = String(count); };
  try {
    const [users, orders] = await Promise.all([api('/api/data/users'), api('/api/data/orders')]);
    setCount('#nav-users-count', users.length);
    setCount('#nav-orders-count', orders.filter(order => ['Pending', 'Processing'].includes(order.status)).length);
  } catch (_) {}
}

function renderOverview() {
  const data = state.dashboard;
  const m = data.metrics;
  const metrics = [
    { title: 'Ricavi registrati', value: formatMoney(m.revenue), foot: 'Totale ordini esclusi gli annullati', icon: '↗', tone: 'purple', badge: 'Dati attuali' },
    { title: 'Ordini totali', value: numberFormat.format(m.orders), foot: `${m.pendingOrders} da lavorare`, icon: '▤', tone: 'green', badge: 'Ordini' },
    { title: 'Utenti registrati', value: numberFormat.format(m.users), foot: 'Profili nel workspace', icon: '♙', tone: 'orange', badge: 'Community' },
    { title: 'Prodotti attivi', value: numberFormat.format(m.products), foot: `${data.inventoryAlerts.length} con scorte basse`, icon: '▦', tone: 'blue', badge: 'Catalogo' }
  ];
  $('#page-content').innerHTML = `
    <div class="metric-grid">${metrics.map(metric => `<article class="metric-card"><div class="metric-top"><span>${metric.title}</span><span class="metric-icon ${metric.tone}">${metric.icon}</span></div><div class="metric-value">${metric.value}</div><div class="metric-foot"><span class="trend-neutral">${metric.badge}</span><span>${metric.foot}</span></div></article>`).join('')}</div>
    <div class="dashboard-grid">
      <section class="panel"><div class="panel-head"><div><div class="panel-title">Andamento dei ricavi</div><div class="panel-subtitle">Valore degli ordini registrati negli ultimi 7 giorni</div></div><span class="chart-key"><i></i> Ricavi</span></div><div class="chart-wrap">${renderLineChart(data.revenueSeries)}</div><div class="mini-stat"><span class="legend-dot purple"></span>Totale periodo <strong>${formatMoney(data.revenueSeries.reduce((sum, day) => sum + day.value, 0))}</strong><span>· 7 giorni</span></div></section>
      <section class="panel list-panel"><div class="panel-head"><div><div class="panel-title">Attività recente</div><div class="panel-subtitle">Ultime azioni nel pannello</div></div><button class="text-button" data-goto="logs">Vedi tutto <span>↗</span></button></div><div class="activity-list">${renderActivity(data.recentActivity)}</div></section>
    </div>
    <div class="dashboard-grid equal">
      <section class="panel"><div class="panel-head"><div><div class="panel-title">Ordini recenti</div><div class="panel-subtitle">Ultimi acquisti registrati</div></div><button class="text-button" data-goto="orders">Tutti gli ordini <span>↗</span></button></div>${renderRecentOrders(data.recentOrders)}</section>
      <section class="panel"><div class="panel-head"><div><div class="panel-title">Scorte da controllare</div><div class="panel-subtitle">Prodotti con 10 o meno unità</div></div><button class="text-button" data-goto="products">Apri catalogo <span>↗</span></button></div>${renderInventory(data.inventoryAlerts)}</section>
    </div>
    <div class="analytics-grid">
      <article class="panel analytics-stat"><span>Richieste aperte</span><strong>${m.openTickets}</strong><small>Ticket non ancora risolti</small></article>
      <article class="panel analytics-stat"><span>Ordini da gestire</span><strong>${m.pendingOrders}</strong><small>In attesa o in lavorazione</small></article>
      <article class="panel analytics-stat"><span>Record attività</span><strong>${numberFormat.format(data.logCount || data.recentActivity.length)}</strong><small>Eventi conservati nel registro</small></article>
    </div>`;
  bindNavigationLinks();
  bindOverviewQuickActions();
}

function renderLineChart(series) {
  const width = 620, height = 190, left = 32, right = 10, top = 14, bottom = 24;
  const plotW = width - left - right, plotH = height - top - bottom;
  const vals = series.map(d => Number(d.value || 0));
  const max = Math.max(100, ...vals) * 1.15;
  const points = series.map((d, i) => ({ x: left + (series.length === 1 ? plotW / 2 : i * plotW / (series.length - 1)), y: top + plotH - ((Number(d.value || 0) / max) * plotH), ...d }));
  const path = points.map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
  const areaPath = `${path} L ${points[points.length - 1]?.x || left} ${top + plotH} L ${points[0]?.x || left} ${top + plotH} Z`;
  const grids = [0, 1, 2, 3].map(i => {
    const y = top + (plotH * i / 3);
    const tick = max * (1 - i / 3);
    return `<line class="chart-grid-line" x1="${left}" y1="${y}" x2="${width - right}" y2="${y}"/><text class="chart-label" x="${left - 7}" y="${y + 3}" text-anchor="end">${tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : Math.round(tick)}</text>`;
  }).join('');
  const labels = points.map(point => `<text class="chart-label" x="${point.x}" y="${height - 5}" text-anchor="middle">${escapeHtml(point.label)}</text>`).join('');
  const circles = points.map(point => `<circle class="chart-point" cx="${point.x}" cy="${point.y}" r="3.1"><title>${escapeHtml(point.label)}: ${formatMoney(point.value)}</title></circle>`).join('');
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Grafico dei ricavi per giorno"><defs><linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8279f1" stop-opacity=".2"/><stop offset="100%" stop-color="#8279f1" stop-opacity="0"/></linearGradient></defs>${grids}<path class="chart-area" d="${areaPath}"/><path class="chart-line" d="${path}"/>${circles}${labels}</svg>`;
}

function renderActivity(items) {
  if (!items || !items.length) return '<div class="empty-state"><div class="empty-icon">☷</div><strong>Nessuna attività recente</strong><span>Le azioni registrate appariranno qui.</span></div>';
  const tones = ['purple', 'green', 'blue', 'orange'];
  const icons = { 'Creato': '＋', 'Modificato': '✎', 'Eliminato': '−', 'Accesso effettuato': '↗', 'Accesso negato': '!', 'Disconnessione': '↙', 'Impostazioni aggiornate': '⚙', 'Sistema inizializzato': '✳' };
  return items.slice(0, 6).map((item, index) => `<div class="activity-row"><div class="activity-icon ${tones[index % tones.length]}">${icons[item.action] || '•'}</div><div class="activity-copy"><strong>${escapeHtml(item.action)} · ${escapeHtml(item.resource === 'system' ? 'Sistema' : (COLLECTIONS[item.resource]?.label || (item.resource === 'auth' ? 'Accesso' : item.resource)))}</strong><span>${escapeHtml(item.details || '')} · ${escapeHtml(item.actor || 'sistema')}</span></div><div class="activity-time">${escapeHtml(humanTime(item.createdAt))}</div></div>`).join('');
}
function renderRecentOrders(items) {
  if (!items.length) return '<div class="empty-state"><div class="empty-icon">▤</div><strong>Nessun ordine registrato</strong><span>Gli ordini saranno visibili qui.</span></div>';
  return `<div class="table-scroll"><table><thead><tr><th>ORDINE</th><th>CLIENTE</th><th>TOTALE</th><th>STATO</th></tr></thead><tbody>${items.map(order => `<tr><td><span class="cell-strong">${escapeHtml(order.number)}</span><div class="muted" style="font-size:9px;margin-top:3px">${escapeHtml(formatDate(order.date))}</div></td><td>${escapeHtml(order.customer)}</td><td class="cell-strong">${formatMoney(Number(order.total || 0))}</td><td>${badge(order.status)}</td></tr>`).join('')}</tbody></table></div>`;
}
function renderInventory(items) {
  if (!items.length) return '<div class="empty-state"><div class="empty-icon">✓</div><strong>Scorte in buona forma</strong><span>Nessun prodotto sotto la soglia di attenzione.</span></div>';
  return `<div class="inventory-list">${items.map(product => `<div class="inventory-row"><div class="cell-avatar orange">▦</div><div class="inventory-product"><strong>${escapeHtml(product.name)}</strong><span>${escapeHtml(product.sku)}</span></div><div class="stock-meter"><span data-stock="${Math.max(0, Math.min(100, Number(product.stock) * 10))}"></span></div><div class="stock-number">${numberFormat.format(product.stock)}</div></div>`).join('')}</div>`;
}
function badge(value) { return `<span class="status-badge ${statusClass(value)}">${escapeHtml(statusLabel(value))}</span>`; }

function renderCollection() {
  const config = COLLECTIONS[state.page];
  if (!config) return;
  const hasFilter = config.filterOptions?.length;
  const filtered = state.rows.filter(row => {
    const matchesQuery = !state.query || config.search.some(key => String(row[key] ?? '').toLowerCase().includes(state.query.toLowerCase()));
    const matchesFilter = state.filter === 'all' || String(row.status || '') === state.filter;
    return matchesQuery && matchesFilter;
  });
  const pages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
  if (state.pageNumber > pages) state.pageNumber = pages;
  const start = (state.pageNumber - 1) * state.pageSize;
  const displayRows = filtered.slice(start, start + state.pageSize);
  $('#page-content').innerHTML = `
    <div class="section-header"><div><h2>${config.label} <span class="muted">(${state.rows.length})</span></h2><p>${config.subtitle}</p></div><button class="button button-primary" id="section-create"><span>＋</span> Nuovo ${config.singular}</button></div>
    <section class="panel table-panel"><div class="table-toolbar"><div class="toolbar-left"><label class="table-search"><span>⌕</span><input id="table-search-input" value="${escapeHtml(state.query)}" placeholder="Cerca ${config.label.toLowerCase()}…" aria-label="Cerca ${config.label}"></label>${hasFilter ? `<select id="table-status-filter" class="filter-select" aria-label="Filtra per stato"><option value="all">Tutti gli stati</option>${config.filterOptions.map(option => `<option value="${escapeHtml(option)}" ${state.filter === option ? 'selected' : ''}>${escapeHtml(statusLabel(option))}</option>`).join('')}</select>` : ''}</div><div class="toolbar-right"><span class="table-count">${filtered.length} risultati</span><button class="button button-secondary button-small" id="table-export">↓ Esporta CSV</button></div></div>
      ${displayRows.length ? `<div class="table-scroll"><table><thead><tr>${config.columns.map(key => `<th>${escapeHtml(config.fields.find(f => f.key === key)?.label || key).toUpperCase()}</th>`).join('')}<th>AZIONI</th></tr></thead><tbody>${displayRows.map(row => `<tr>${config.columns.map(key => `<td>${renderCell(state.page, key, row)}</td>`).join('')}<td><div class="row-actions"><button class="row-action" data-row-action="view" data-id="${escapeHtml(row.id)}" title="Dettagli" aria-label="Dettagli">◉</button><button class="row-action" data-row-action="edit" data-id="${escapeHtml(row.id)}" title="Modifica" aria-label="Modifica">✎</button><button class="row-action delete" data-row-action="delete" data-id="${escapeHtml(row.id)}" title="Elimina" aria-label="Elimina">⌫</button></div></td></tr>`).join('')}</tbody></table></div>` : `<div class="empty-state"><div class="empty-icon">${config.icon}</div><strong>${state.rows.length ? 'Nessun risultato trovato' : `Nessun ${config.singular} ancora`}</strong><span>${state.rows.length ? 'Prova a modificare la ricerca o il filtro.' : `Crea il primo ${config.singular} per iniziare.`}</span>${state.rows.length ? '' : `<button class="button button-primary button-small" id="empty-create" style="margin-top:13px">＋ Crea ${config.singular}</button>`}</div>`}
      <div class="table-footer"><span>Mostrati ${filtered.length ? start + 1 : 0}–${Math.min(start + state.pageSize, filtered.length)} di ${filtered.length} elementi</span><div class="pagination"><button class="page-btn" id="page-prev" ${state.pageNumber <= 1 ? 'disabled' : ''} aria-label="Pagina precedente">‹</button>${renderPageButtons(pages)}<button class="page-btn" id="page-next" ${state.pageNumber >= pages ? 'disabled' : ''} aria-label="Pagina successiva">›</button></div></div>
    </section>`;
  $('#section-create')?.addEventListener('click', () => openEditor(state.page));
  $('#empty-create')?.addEventListener('click', () => openEditor(state.page));
  $('#table-search-input')?.addEventListener('input', event => { state.query = event.target.value; state.pageNumber = 1; const cursor = event.target.selectionStart; renderCollection(); const input = $('#table-search-input'); input.focus(); input.setSelectionRange(cursor, cursor); });
  $('#table-status-filter')?.addEventListener('change', event => { state.filter = event.target.value; state.pageNumber = 1; renderCollection(); });
  $('#table-export')?.addEventListener('click', () => exportCollection(state.page));
  $('#page-prev')?.addEventListener('click', () => { state.pageNumber--; renderCollection(); });
  $('#page-next')?.addEventListener('click', () => { state.pageNumber++; renderCollection(); });
  $$('.page-btn[data-page-number]').forEach(button => button.addEventListener('click', () => { state.pageNumber = Number(button.dataset.pageNumber); renderCollection(); }));
  $$('[data-row-action]').forEach(button => button.addEventListener('click', () => handleRowAction(button.dataset.rowAction, button.dataset.id)));
}
function renderPageButtons(pages) {
  if (pages <= 5) return Array.from({ length: pages }, (_, i) => i + 1).map(page => `<button class="page-btn ${state.pageNumber === page ? 'active' : ''}" data-page-number="${page}" aria-label="Pagina ${page}">${page}</button>`).join('');
  const set = [...new Set([1, state.pageNumber - 1, state.pageNumber, state.pageNumber + 1, pages].filter(page => page >= 1 && page <= pages))].sort((a, b) => a - b);
  let html = '';
  set.forEach((page, index) => {
    if (index && page - set[index - 1] > 1) html += '<span class="muted">…</span>';
    html += `<button class="page-btn ${state.pageNumber === page ? 'active' : ''}" data-page-number="${page}">${page}</button>`;
  });
  return html;
}
function renderCell(collection, key, row) {
  const value = row[key];
  if (key === 'status' || key === 'role' || key === 'priority') return badge(value);
  if (['joinedAt', 'date', 'updatedAt', 'createdAt'].includes(key)) return `<span>${escapeHtml(formatDate(value))}</span>`;
  if (['total', 'price'].includes(key)) return `<span class="cell-strong">${formatMoney(Number(value || 0))}</span>`;
  if (key === 'stock') {
    const low = Number(value) <= 10;
    return `<span class="${low ? 'cell-strong' : ''}" style="${low ? 'color:#bf832f' : ''}">${numberFormat.format(Number(value || 0))} unità</span>`;
  }
  if (key === 'name' && collection === 'users') {
    const tone = ['','green','blue','orange','rose'][Math.abs([...String(row.id)].reduce((s,c)=>s+c.charCodeAt(0),0)) % 5];
    return `<div class="cell-main"><div class="cell-avatar ${tone}">${escapeHtml(initials(value))}</div><div class="cell-stack"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(row.email)}</span></div></div>`;
  }
  if (key === 'name' && collection === 'products') return `<div class="cell-main"><div class="cell-avatar purple">▦</div><div class="cell-stack"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(row.sku)}</span></div></div>`;
  if (key === 'number') return `<span class="cell-strong">${escapeHtml(value)}</span>`;
  if (key === 'title') return `<div class="cell-stack"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(row.slug || '')}</span></div>`;
  if (key === 'subject') return `<span class="cell-strong">${escapeHtml(value)}</span>`;
  if (key === 'customer') return `<div class="cell-stack"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(row.email || '')}</span></div>`;
  return `<span>${escapeHtml(value || '—')}</span>`;
}

function openEditor(collection, id = null) {
  const config = COLLECTIONS[collection];
  if (!config) return;
  const row = id ? state.rows.find(item => item.id === id) : null;
  const body = config.fields.map(field => {
    let value = row ? row[field.key] : (field.default ?? '');
    if (field.type === 'date' && value) value = String(value).slice(0, 10);
    const required = field.required ? 'required' : '';
    let input;
    if (field.type === 'select') input = `<select name="${field.key}" ${required}>${field.options.map(option => `<option value="${escapeHtml(option)}" ${String(value || field.default || '') === option ? 'selected' : ''}>${escapeHtml(statusLabel(option))}</option>`).join('')}</select>`;
    else input = `<input name="${field.key}" type="${field.type}" ${required} ${field.min !== undefined ? `min="${field.min}"` : ''} ${field.step ? `step="${field.step}"` : ''} ${field.type === 'number' ? 'inputmode="decimal"' : ''} ${field.placeholder ? `placeholder="${escapeHtml(field.placeholder)}"` : ''} value="${escapeHtml(value ?? '')}" maxlength="180">`;
    return `<div class="modal-field"><label for="field-${field.key}">${escapeHtml(field.label)}${field.required ? ' *' : ''}</label>${input}</div>`;
  }).join('');
  $('#modal-root').innerHTML = `<div class="modal-backdrop" data-close-modal="true"><section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><div><h2 id="modal-title">${row ? `Modifica ${config.singular}` : `Crea ${config.singular}`}</h2><p>${row ? 'Aggiorna i campi e salva le modifiche.' : `Inserisci i dati per aggiungere un nuovo ${config.singular}.`}</p></div><button class="icon-button modal-close" data-modal-close aria-label="Chiudi">×</button></div><form id="editor-form"><div class="modal-body"><div class="modal-form">${body}</div><div id="editor-error" class="form-error" role="alert"></div></div><div class="modal-foot"><button type="button" class="button button-secondary" data-modal-close>Annulla</button><button type="submit" class="button button-primary" id="editor-submit">${row ? 'Salva modifiche' : `Crea ${config.singular}`}</button></div></form></section></div>`;
  $$('[data-modal-close]').forEach(button => button.addEventListener('click', closeModal));
  $('.modal-backdrop', $('#modal-root')).addEventListener('click', event => { if (event.target.dataset.closeModal) closeModal(); });
  $('#editor-form').addEventListener('submit', async event => {
    event.preventDefault();
    const submit = $('#editor-submit');
    const restore = setLoading(submit, 'Salvataggio…');
    $('#editor-error').textContent = '';
    const formData = new FormData(event.currentTarget);
    const payload = {};
    config.fields.forEach(field => {
      let value = formData.get(field.key);
      if (field.type === 'number') value = value === '' ? '' : Number(value);
      if (field.type === 'text' || field.type === 'email' || field.type === 'date') value = String(value || '').trim();
      payload[field.key] = value;
    });
    try {
      await api(id ? `/api/data/${collection}/${encodeURIComponent(id)}` : `/api/data/${collection}`, { method: id ? 'PUT' : 'POST', body: payload });
      closeModal();
      showToast(`${config.singular[0].toUpperCase()}${config.singular.slice(1)} ${id ? 'aggiornato' : 'creato'} correttamente.`);
      await navigate(collection);
    } catch (error) {
      $('#editor-error').textContent = error.message;
    } finally { restore(); }
  });
  $('.modal-card input, .modal-card select')?.focus();
}
function closeModal() { $('#modal-root').innerHTML = ''; }
function openConfirm(title, message, onConfirm, dangerLabel = 'Elimina') {
  $('#confirm-root').innerHTML = `<div class="modal-backdrop" data-confirm-dismiss><section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><div class="modal-head"><div><h2 id="confirm-title">${escapeHtml(title)}</h2><p>Questa azione richiede conferma.</p></div><button class="icon-button modal-close" data-confirm-cancel aria-label="Chiudi">×</button></div><div class="modal-body"><p class="confirm-message">${escapeHtml(message)}</p><div id="confirm-error" class="form-error"></div></div><div class="modal-foot"><button class="button button-secondary" data-confirm-cancel>Annulla</button><button class="button button-danger" id="confirm-action">${escapeHtml(dangerLabel)}</button></div></section></div>`;
  $$('[data-confirm-cancel]').forEach(button => button.addEventListener('click', () => { $('#confirm-root').innerHTML = ''; }));
  $('.modal-backdrop', $('#confirm-root')).addEventListener('click', event => { if (event.target.hasAttribute('data-confirm-dismiss')) $('#confirm-root').innerHTML = ''; });
  $('#confirm-action').addEventListener('click', async () => {
    const button = $('#confirm-action');
    const restore = setLoading(button, 'Attendi…');
    try { await onConfirm(); $('#confirm-root').innerHTML = ''; }
    catch (error) { $('#confirm-error').textContent = error.message; restore(); }
  });
}
function handleRowAction(action, id) {
  const collection = state.page;
  const row = state.rows.find(item => item.id === id);
  if (!row) return;
  if (action === 'edit') return openEditor(collection, id);
  if (action === 'view') return openDetails(collection, row);
  if (action === 'delete') {
    const config = COLLECTIONS[collection];
    const label = row.name || row.number || row.title || row.subject || 'questo elemento';
    return openConfirm(`Eliminare ${config.singular}?`, `Stai per eliminare “${label}”. L’operazione non può essere annullata.`, async () => {
      await api(`/api/data/${collection}/${encodeURIComponent(id)}`, { method: 'DELETE' });
      showToast(`${config.singular[0].toUpperCase()}${config.singular.slice(1)} eliminato.`);
      await navigate(collection);
    });
  }
}
function openDetails(collection, row) {
  const config = COLLECTIONS[collection];
  const fields = config.fields.map(field => {
    const value = row[field.key];
    const formatted = ['price','total'].includes(field.key) ? formatMoney(Number(value || 0)) : ['joinedAt','date','updatedAt','createdAt'].includes(field.key) ? formatDate(value) : field.key === 'status' || field.key === 'role' || field.key === 'priority' ? statusLabel(value) : value;
    return `<div class="detail-item"><span>${escapeHtml(field.label)}</span><strong>${escapeHtml(formatted || '—')}</strong></div>`;
  }).join('');
  $('#modal-root').innerHTML = `<div class="modal-backdrop" data-close-modal><section class="modal-card modal-wide" role="dialog" aria-modal="true"><div class="modal-head"><div><h2>Dettaglio ${escapeHtml(config.singular)}</h2><p>Informazioni registrate nel workspace.</p></div><button class="icon-button modal-close" data-modal-close aria-label="Chiudi">×</button></div><div class="modal-body"><div class="detail-grid">${fields}</div></div><div class="modal-foot"><button class="button button-secondary" data-modal-close>Chiudi</button><button class="button button-primary" id="details-edit">✎ Modifica</button></div></section></div>`;
  $$('[data-modal-close]').forEach(button => button.addEventListener('click', closeModal));
  $('.modal-backdrop', $('#modal-root')).addEventListener('click', event => { if (event.target.hasAttribute('data-close-modal')) closeModal(); });
  $('#details-edit').addEventListener('click', () => { closeModal(); openEditor(collection, row.id); });
}

function bindNavigationLinks() {
  $$('[data-goto]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.goto)));
}
function bindOverviewQuickActions() {
  $$('.stock-meter span[data-stock]').forEach(span => { span.style.width = `${span.dataset.stock}%`; });
}

function renderAnalytics() {
  const dashboard = state.dashboard;
  const orders = state.allRows.orders || [];
  const users = state.allRows.users || [];
  const products = state.allRows.products || [];
  const tickets = state.allRows.tickets || [];
  const totalRevenue = orders.filter(order => order.status !== 'Cancelled').reduce((sum, order) => sum + Number(order.total || 0), 0);
  const completedOrders = orders.filter(order => order.status === 'Completed').length;
  const activeUsers = users.filter(user => user.status === 'Active').length;
  const outOfStock = products.filter(product => Number(product.stock) === 0).length;
  const statusOrders = dashboard.statusCounts.orders;
  const maxCount = Math.max(1, ...statusOrders.map(item => item.count));
  const orderBars = statusOrders.map(item => `<div class="bar-row"><label>${escapeHtml(statusLabel(item.status))}</label><div class="bar-track"><div class="bar-fill" data-bar="${Math.round(item.count / maxCount * 100)}"></div></div><strong>${item.count}</strong></div>`).join('');
  const ticketStats = dashboard.statusCounts.tickets.map(item => `<div class="bar-row"><label>${escapeHtml(statusLabel(item.status))}</label><div class="bar-track"><div class="bar-fill" data-bar="${Math.round(item.count / Math.max(1, ...dashboard.statusCounts.tickets.map(t => t.count)) * 100)}"></div></div><strong>${item.count}</strong></div>`).join('');
  $('#page-content').innerHTML = `
    <div class="analytics-grid"><article class="panel analytics-stat"><span>Valore ordini non annullati</span><strong>${formatMoney(totalRevenue)}</strong><small>Basato sugli ordini registrati</small></article><article class="panel analytics-stat"><span>Ordini completati</span><strong>${completedOrders}</strong><small>Su ${orders.length} ordini in totale</small></article><article class="panel analytics-stat"><span>Utenti attivi</span><strong>${activeUsers}</strong><small>Su ${users.length} profili registrati</small></article><article class="panel analytics-stat"><span>Catalogo attivo</span><strong>${products.filter(p => p.status === 'Active').length}</strong><small>${outOfStock} prodotti senza scorte</small></article><article class="panel analytics-stat"><span>Ticket da gestire</span><strong>${tickets.filter(t => t.status !== 'Resolved').length}</strong><small>Richieste non risolte</small></article><article class="panel analytics-stat"><span>Ricavi ultimi 7 giorni</span><strong>${formatMoney(dashboard.revenueSeries.reduce((sum, day) => sum + day.value, 0))}</strong><small>Valori registrati per data ordine</small></article></div>
    <div class="dashboard-grid equal"><section class="panel"><div class="panel-head"><div><div class="panel-title">Distribuzione ordini</div><div class="panel-subtitle">Suddivisione per stato corrente</div></div></div><div class="bar-list">${orderBars}</div></section><section class="panel"><div class="panel-head"><div><div class="panel-title">Stato assistenza</div><div class="panel-subtitle">Ticket per stato</div></div></div><div class="bar-list">${ticketStats}</div></section></div>
    <div class="notice"><span>ⓘ</span><div><strong>Come leggere questi dati</strong><p>I valori sono calcolati in tempo reale dai record dimostrativi o dai dati che hai inserito. Non rappresentano previsioni, dati di pagamento verificati o collegamenti a servizi esterni.</p></div></div>
    <section class="panel"><div class="panel-head"><div><div class="panel-title">Ricavi per giorno</div><div class="panel-subtitle">Ultimi 7 giorni · dati basati sulla data dell’ordine</div></div></div><div class="chart-wrap">${renderLineChart(dashboard.revenueSeries)}</div></section>`;
  $$('.bar-fill[data-bar]').forEach(span => { span.style.width = `${span.dataset.bar}%`; });
}

function renderLogs() {
  const logs = state.rows || [];
  $('#page-content').innerHTML = `<section class="panel table-panel"><div class="table-toolbar"><div class="toolbar-left"><label class="table-search"><span>⌕</span><input id="logs-search" placeholder="Cerca nelle attività…" value="${escapeHtml(state.query)}"></label><span class="table-count">${logs.length} eventi</span></div><div class="toolbar-right"><button class="button button-secondary button-small" id="logs-export">↓ Esporta CSV</button></div></div><div id="logs-table"></div></section><div class="notice"><span>ⓘ</span><div><strong>Registro di audit</strong><p>Il registro è consultabile in sola lettura. Le nuove operazioni di creazione, modifica, eliminazione e accesso vengono aggiunte automaticamente; sono conservate fino a 300 voci.</p></div></div>`;
  const draw = () => {
    const filtered = logs.filter(row => [row.action, row.resource, row.details, row.actor].some(value => String(value || '').toLowerCase().includes(state.query.toLowerCase())));
    $('#logs-table').innerHTML = filtered.length ? `<div class="table-scroll"><table><thead><tr><th>AZIONE</th><th>SEZIONE</th><th>DETTAGLI</th><th>UTENTE</th><th>DATA</th></tr></thead><tbody>${filtered.map(row => `<tr><td>${badge(row.action)}</td><td>${escapeHtml(COLLECTIONS[row.resource]?.label || (row.resource === 'auth' ? 'Accesso' : row.resource === 'settings' ? 'Impostazioni' : row.resource))}</td><td><span>${escapeHtml(row.details)}</span></td><td>${escapeHtml(row.actor || 'sistema')}</td><td>${escapeHtml(formatDateTime(row.createdAt))}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state"><div class="empty-icon">☷</div><strong>Nessun evento trovato</strong><span>Prova con un’altra parola chiave.</span></div>';
  };
  $('#logs-search').addEventListener('input', event => { state.query = event.target.value; draw(); });
  $('#logs-export').addEventListener('click', () => exportCollection('logs'));
  draw();
}

function renderSettings() {
  const s = state.settings || {};
  const tab = state.settingsTab;
  const tabs = [{ key: 'general', label: '◎ Generali' }, { key: 'notifications', label: '♧ Notifiche' }, { key: 'system', label: '⚙ Sistema' }];
  let body = '';
  if (tab === 'general') body = `<h3>Informazioni del workspace</h3><p>Questi dati identificano il sito nelle schermate amministrative.</p><form id="settings-form"><div class="form-grid"><div class="form-field"><label for="settings-siteName">Nome del sito</label><input id="settings-siteName" name="siteName" required maxlength="100" value="${escapeHtml(s.siteName || '')}"><small>Il nome mostrato nel workspace.</small></div><div class="form-field"><label for="settings-siteUrl">URL del sito</label><input id="settings-siteUrl" name="siteUrl" type="url" value="${escapeHtml(s.siteUrl || '')}" placeholder="https://example.com" required><small>Indirizzo pubblico del sito.</small></div><div class="form-field"><label for="settings-supportEmail">Email assistenza</label><input id="settings-supportEmail" name="supportEmail" type="email" value="${escapeHtml(s.supportEmail || '')}" required></div><div class="form-field"><label for="settings-timezone">Fuso orario</label><select id="settings-timezone" name="timezone"><option value="Europe/Rome" ${s.timezone === 'Europe/Rome' ? 'selected' : ''}>Europe/Rome (Italia)</option><option value="UTC" ${s.timezone === 'UTC' ? 'selected' : ''}>UTC</option><option value="Europe/London" ${s.timezone === 'Europe/London' ? 'selected' : ''}>Europe/London</option><option value="America/New_York" ${s.timezone === 'America/New_York' ? 'selected' : ''}>America/New_York</option></select></div><div class="form-field"><label for="settings-currency">Valuta</label><select id="settings-currency" name="currency"><option value="EUR" ${s.currency === 'EUR' ? 'selected' : ''}>EUR — Euro</option><option value="USD" ${s.currency === 'USD' ? 'selected' : ''}>USD — Dollaro statunitense</option><option value="GBP" ${s.currency === 'GBP' ? 'selected' : ''}>GBP — Sterlina</option></select></div><div class="form-field"><label for="settings-itemsPerPage">Elementi per pagina</label><select id="settings-itemsPerPage" name="itemsPerPage">${['10','25','50','100'].map(n => `<option value="${n}" ${String(s.itemsPerPage) === n ? 'selected' : ''}>${n} elementi</option>`).join('')}</select></div></div><div class="form-actions"><button type="button" class="button button-secondary" id="settings-reset">Ripristina valori</button><button type="submit" class="button button-primary" id="settings-save">Salva impostazioni</button></div><div id="settings-error" class="form-error"></div></form>`;
  if (tab === 'notifications') body = `<h3>Preferenze di notifica</h3><p>Imposta le preferenze applicative. L’invio reale di email richiede un provider SMTP o un servizio email esterno.</p><form id="settings-form"><div class="toggle-row"><div class="toggle-copy"><strong>Notifiche email</strong><span>Preferenza per notifiche e promemoria (non invia email in questa versione).</span></div><label class="switch"><input name="emailNotifications" type="checkbox" ${s.emailNotifications ? 'checked' : ''}><span></span></label></div><div class="form-actions"><button type="submit" class="button button-primary" id="settings-save">Salva preferenze</button></div><div id="settings-error" class="form-error"></div></form>`;
  if (tab === 'system') body = `<h3>Stato e modalità del sistema</h3><p>Impostazioni operative per il workspace dimostrativo.</p><form id="settings-form"><div class="toggle-row"><div class="toggle-copy"><strong>Modalità manutenzione</strong><span>Segna il sito come in manutenzione nelle impostazioni. Non blocca automaticamente il frontend pubblico.</span></div><label class="switch"><input name="maintenanceMode" type="checkbox" ${s.maintenanceMode ? 'checked' : ''}><span></span></label></div><div class="detail-grid" style="margin-top:18px"><div class="detail-item"><span>Versione pannello</span><strong>1.0.0</strong></div><div class="detail-item"><span>Archivio dati</span><strong>JSON locale</strong></div><div class="detail-item"><span>Autenticazione</span><strong>Cookie firmato + CSRF</strong></div><div class="detail-item"><span>Ambiente</span><strong>${location.protocol === 'https:' ? 'HTTPS' : 'HTTP / locale'}</strong></div></div><div class="form-actions"><button type="submit" class="button button-primary" id="settings-save">Salva preferenze</button></div><div id="settings-error" class="form-error"></div></form>`;
  $('#page-content').innerHTML = `<div class="settings-layout"><section class="panel settings-nav">${tabs.map(item => `<button data-settings-tab="${item.key}" class="${item.key === tab ? 'active' : ''}">${item.label}</button>`).join('')}</section><section class="panel settings-content">${body}</section></div><div class="notice" style="margin-top:16px"><span>ⓘ</span><div><strong>Prima di pubblicare</strong><p>Le impostazioni sono persistite in un file JSON locale. Su un hosting con filesystem effimero o più istanze, usa un database gestito e un backup dedicato.</p></div></div>`;
  $$('[data-settings-tab]').forEach(button => button.addEventListener('click', () => { state.settingsTab = button.dataset.settingsTab; renderSettings(); }));
  $('#settings-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = $('#settings-save');
    const restore = setLoading(submit, 'Salvataggio…');
    $('#settings-error').textContent = '';
    const formData = new FormData(form);
    const payload = {};
    for (const [key, value] of formData.entries()) payload[key] = value;
    if (tab === 'general') {
      for (const key of ['siteName', 'siteUrl', 'supportEmail', 'timezone', 'currency', 'itemsPerPage']) payload[key] = String(formData.get(key) || '').trim();
    }
    if (tab === 'notifications') payload.emailNotifications = form.elements.emailNotifications.checked;
    if (tab === 'system') payload.maintenanceMode = form.elements.maintenanceMode.checked;
    try {
      state.settings = await api('/api/settings', { method: 'PATCH', body: payload });
      activeCurrency = state.settings.currency || 'EUR';
      activeTimezone = state.settings.timezone || 'Europe/Rome';
      state.pageSize = Number(state.settings.itemsPerPage) || 10;
      $('#workspace-name').textContent = state.settings.siteName || 'Atlas Studio';
      showToast('Impostazioni salvate correttamente.');
      renderSettings();
    } catch (error) { $('#settings-error').textContent = error.message; }
    finally { restore(); }
  });
  $('#settings-reset')?.addEventListener('click', () => openConfirm('Ripristinare i valori?', 'Ricaricherò i valori attualmente salvati sul server senza modificare i dati.', async () => { state.settings = await api('/api/settings'); activeCurrency = state.settings.currency || 'EUR'; activeTimezone = state.settings.timezone || 'Europe/Rome'; state.pageSize = Number(state.settings.itemsPerPage) || 10; renderSettings(); showToast('Valori ricaricati.', 'info'); }, 'Ricarica'));
}

async function exportCollection(collection) {
  if (!collection || collection === 'overview') collection = 'orders';
  try {
    const response = await fetch(`/api/export/${encodeURIComponent(collection)}`, { credentials: 'same-origin' });
    if (response.status === 401) { showLogin(); throw new Error('Sessione scaduta. Accedi di nuovo.'); }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Esportazione non riuscita.');
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `atlas-${collection}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    showToast('Esportazione CSV pronta.');
  } catch (error) { showToast(error.message, 'error'); }
}

function openQuickCreate() {
  $('#modal-root').innerHTML = `<div class="modal-backdrop" data-close-modal><section class="modal-card" role="dialog" aria-modal="true"><div class="modal-head"><div><h2>Cosa vuoi creare?</h2><p>Scegli una sezione per aggiungere un nuovo elemento.</p></div><button class="icon-button modal-close" data-modal-close aria-label="Chiudi">×</button></div><div class="modal-body"><div class="detail-grid">${Object.entries(COLLECTIONS).map(([key, value]) => `<button class="quick-create-choice" data-create-collection="${key}"><span>${value.icon}</span><strong>${value.label}</strong><small>Aggiungi ${value.singular}</small></button>`).join('')}</div></div></section></div>`;
  $$('.quick-create-choice').forEach(button => button.addEventListener('click', () => { closeModal(); navigate(button.dataset.createCollection).then(() => openEditor(button.dataset.createCollection)); }));
  $$('[data-modal-close]').forEach(button => button.addEventListener('click', closeModal));
  $('.modal-backdrop', $('#modal-root')).addEventListener('click', event => { if (event.target.hasAttribute('data-close-modal')) closeModal(); });
}

function openHelp() {
  $('#modal-root').innerHTML = `<div class="modal-backdrop" data-close-modal><section class="modal-card modal-wide" role="dialog" aria-modal="true"><div class="modal-head"><div><h2>Guida rapida ad Atlas Admin</h2><p>Le funzioni principali del workspace.</p></div><button class="icon-button modal-close" data-modal-close aria-label="Chiudi">×</button></div><div class="modal-body"><div class="timeline"><div class="timeline-row"><div class="timeline-mark">1</div><div class="timeline-copy"><strong>Gestisci i dati</strong><p>Da Utenti, Prodotti, Ordini, Contenuti e Assistenza puoi creare, cercare, filtrare, modificare ed eliminare record.</p></div></div><div class="timeline-row"><div class="timeline-mark">2</div><div class="timeline-copy"><strong>Esporta in CSV</strong><p>Usa “Esporta CSV” dentro una sezione per scaricare una copia apribile con Excel o altri fogli di calcolo.</p></div></div><div class="timeline-row"><div class="timeline-mark">3</div><div class="timeline-copy"><strong>Controlla le attività</strong><p>Il Registro attività conserva gli ultimi eventi amministrativi per aiutarti a capire cosa è cambiato.</p></div></div><div class="timeline-row"><div class="timeline-mark">4</div><div class="timeline-copy"><strong>Configura prima di pubblicare</strong><p>Modifica il file .env, imposta credenziali robuste, abilita HTTPS e usa un database adatto alla produzione prima di esporre il pannello su Internet.</p></div></div></div></div><div class="modal-foot"><button class="button button-primary" data-modal-close>Ho capito</button></div></section></div>`;
  $$('[data-modal-close]').forEach(button => button.addEventListener('click', closeModal));
  $('.modal-backdrop', $('#modal-root')).addEventListener('click', event => { if (event.target.hasAttribute('data-close-modal')) closeModal(); });
}

async function openGlobalSearch(query) {
  const q = query.trim().toLowerCase();
  if (!q) return;
  const results = [];
  try {
    const collections = Object.keys(COLLECTIONS);
    const loaded = await Promise.all(collections.map(async key => [key, await api(`/api/data/${key}`)]));
    for (const [key, rows] of loaded) {
      const config = COLLECTIONS[key];
      for (const row of rows) {
        if (config.search.some(field => String(row[field] || '').toLowerCase().includes(q))) results.push({ collection: key, row });
      }
    }
    const view = results.slice(0, 18).map(({ collection, row }) => {
      const title = row.name || row.number || row.title || row.subject || 'Elemento';
      const secondary = row.email || row.sku || row.slug || row.customer || row.status || '';
      return `<button class="global-result" data-result-collection="${collection}" data-result-id="${escapeHtml(row.id)}"><span class="result-icon">${COLLECTIONS[collection].icon}</span><span class="result-text"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(COLLECTIONS[collection].label)} · ${escapeHtml(secondary)}</small></span><span class="result-arrow">↗</span></button>`;
    }).join('');
    $('#modal-root').innerHTML = `<div class="modal-backdrop" data-close-modal><section class="modal-card modal-wide" role="dialog" aria-modal="true"><div class="modal-head"><div><h2>Risultati per “${escapeHtml(query)}”</h2><p>${results.length} corrispondenze in tutte le sezioni</p></div><button class="icon-button modal-close" data-modal-close aria-label="Chiudi">×</button></div><div class="global-results">${view || '<div class="empty-state"><div class="empty-icon">⌕</div><strong>Nessun risultato</strong><span>Prova con un altro termine.</span></div>'}</div></section></div>`;
    $$('[data-modal-close]').forEach(button => button.addEventListener('click', closeModal));
    $('.modal-backdrop', $('#modal-root')).addEventListener('click', event => { if (event.target.hasAttribute('data-close-modal')) closeModal(); });
    $$('.global-result').forEach(button => button.addEventListener('click', async () => {
      const collection = button.dataset.resultCollection;
      const id = button.dataset.resultId;
      closeModal();
      await navigate(collection);
      const row = state.rows.find(item => item.id === id);
      if (row) openDetails(collection, row);
    }));
  } catch (error) { showToast(error.message, 'error'); }
}

function closeSidebar() {
  $('#sidebar').classList.remove('open');
  $('#sidebar-scrim').classList.remove('open');
}
$('#sidebar-scrim').addEventListener('click', closeSidebar);
$('#mobile-menu').addEventListener('click', () => { $('#sidebar').classList.add('open'); $('#sidebar-scrim').classList.add('open'); });
$('#sidebar-close').addEventListener('click', closeSidebar);
$$('.nav-item').forEach(button => button.addEventListener('click', () => navigate(button.dataset.page)));
$('#primary-action').addEventListener('click', () => COLLECTIONS[state.page] ? openEditor(state.page) : openQuickCreate());
$('#export-current').addEventListener('click', () => exportCollection(COLLECTIONS[state.page] ? state.page : 'orders'));
$('#help-button').addEventListener('click', openHelp);
$('#topbar-help').addEventListener('click', openHelp);
$('#user-menu-button').addEventListener('click', () => $('#user-menu').classList.toggle('hidden'));
$('#topbar-profile').addEventListener('click', () => $('#user-menu').classList.toggle('hidden'));
$('#logout-button').addEventListener('click', async () => {
  try { await api('/api/auth/logout', { method: 'POST', body: {} }); } catch (_) {}
  $('#user-menu').classList.add('hidden');
  closeModal(); $('#confirm-root').innerHTML = '';
  showLogin();
  showToast('Hai effettuato la disconnessione.', 'info');
});
$('#global-search').addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    const value = event.currentTarget.value;
    if (COLLECTIONS[state.page]) { state.query = value; state.pageNumber = 1; renderCollection(); }
    else openGlobalSearch(value);
  }
});
$('#global-search').addEventListener('input', event => {
  if (COLLECTIONS[state.page]) {
    state.query = event.target.value;
    state.pageNumber = 1;
    const input = event.target;
    renderCollection();
    const local = $('#table-search-input');
    if (local) { local.value = input.value; local.focus(); local.setSelectionRange(local.value.length, local.value.length); }
  }
});
document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); $('#global-search').focus(); $('#global-search').select(); }
  if (event.key === 'Escape') { closeModal(); $('#confirm-root').innerHTML = ''; $('#user-menu').classList.add('hidden'); closeSidebar(); }
});
document.addEventListener('click', event => {
  if (!event.target.closest('#user-menu') && !event.target.closest('#user-menu-button') && !event.target.closest('#topbar-profile')) $('#user-menu').classList.add('hidden');
});

// Add component styles for quick-create and cross-module search.
const dynamicStyle = document.createElement('style');
dynamicStyle.textContent = `.quick-create-choice{min-width:0;text-align:left;border:1px solid #ececf3;background:#fff;border-radius:10px;padding:14px;display:flex;flex-direction:column;align-items:flex-start;gap:7px}.quick-create-choice:hover{border-color:#c9c4ff;background:#fbfaff}.quick-create-choice>span{width:30px;height:30px;display:grid;place-items:center;border-radius:9px;background:#f0efff;color:#6258df;font-size:17px}.quick-create-choice strong{font-size:11px;color:#343542}.quick-create-choice small{font-size:9px;color:#9294a3}.global-results{padding:8px 14px 14px;max-height:min(60vh,540px);overflow:auto}.global-result{width:100%;display:flex;align-items:center;gap:12px;border:0;border-radius:9px;background:#fff;text-align:left;padding:11px 9px}.global-result:hover{background:#f8f7ff}.result-icon{width:32px;height:32px;display:grid;place-items:center;flex-shrink:0;border-radius:9px;background:#f0efff;color:#6258df;font-size:16px}.result-text{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}.result-text strong{font-size:11px;color:#3c3d4a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.result-text small{font-size:10px;color:#9799a7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.result-arrow{color:#a2a3b0;font-size:15px}`;
document.head.append(dynamicStyle);

startApp();
