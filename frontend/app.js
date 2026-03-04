// ── CONFIG ──────────────────────────────────────────────────────────────
const API_BASE = 'https://localhost:7263/api'; // ← Your ASP.NET API URL
let token = localStorage.getItem('tm_token') || null;
let currentUser = JSON.parse(localStorage.getItem('tm_user') || 'null');
let editingTripId = null;

// ── API HELPER ───────────────────────────────────────────────────────────
async function api(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.title || 'Request failed');
  return data;
}

// ── AUTH ─────────────────────────────────────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach((b, i) =>
    b.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'register'))
  );
  document.getElementById('login-form').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('register-form').style.display = tab === 'register' ? 'block' : 'none';
}

async function login() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  document.getElementById('login-error').textContent = '';
  if (!email || !password) return document.getElementById('login-error').textContent = 'Please fill all fields.';
  try {
    const data = await api('POST', '/auth/login', { email, password });
    setSession(data);
  } catch (e) {
    document.getElementById('login-error').textContent = e.message;
  }
}

async function register() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  document.getElementById('reg-error').textContent = '';
  if (!name || !email || !password) return document.getElementById('reg-error').textContent = 'Please fill all fields.';
  if (password.length < 6) return document.getElementById('reg-error').textContent = 'Password must be at least 6 characters.';
  try {
    const data = await api('POST', '/auth/register', { name, email, password });
    setSession(data);
  } catch (e) {
    document.getElementById('reg-error').textContent = e.message;
  }
}

function setSession(data) {
  token = data.token;
  currentUser = data.user;
  localStorage.setItem('tm_token', token);
  localStorage.setItem('tm_user', JSON.stringify(currentUser));
  initApp();
}

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem('tm_token');
  localStorage.removeItem('tm_user');
  document.getElementById('app').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'flex';
}

// ── INIT ──────────────────────────────────────────────────────────────────
async function initApp() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  const name = currentUser?.name || 'Traveler';
  document.getElementById('user-name-display').textContent = name;
  document.getElementById('user-avatar').textContent = name[0].toUpperCase();
  showPage('dashboard');
}

// ── NAVIGATION ────────────────────────────────────────────────────────────
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelector('.nav-item[onclick="showPage(\'' + page + '\')"]').classList.add('active');
  loadPage(page);
}

async function loadPage(page) {
  if (page === 'dashboard') await loadDashboard();
  if (page === 'trips') await loadTrips();
  if (page === 'expenses') await loadExpenses();
  if (page === 'journal') await loadJournal();
}

// ── DASHBOARD ────────────────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const [trips, expenses, journals] = await Promise.all([
      api('GET', '/trips'),
      api('GET', '/expenses'),
      api('GET', '/journals'),
    ]);
    document.getElementById('stat-trips').textContent = trips.length;
    const total = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
    document.getElementById('stat-expenses').textContent = '$' + total.toLocaleString();
    document.getElementById('stat-journals').textContent = journals.length;
    const dests = new Set(trips.map(t => t.destination?.split(',')[1]?.trim() || t.destination));
    document.getElementById('stat-countries').textContent = dests.size;
    const container = document.getElementById('dashboard-trips');
    const recent = trips.slice(-3).reverse();
    container.innerHTML = recent.length ? recent.map(t => tripCardHTML(t)).join('') : emptyState('✈️', 'No trips yet. Start planning!');
  } catch (e) {
    showToast('Failed to load dashboard.', 'error');
  }
}

// ── TRIPS ────────────────────────────────────────────────────────────────
async function loadTrips() {
  try {
    const trips = await api('GET', '/trips');
    const grid = document.getElementById('trips-grid');
    grid.innerHTML = trips.length ? trips.map(t => tripCardHTML(t)).join('') : emptyState('🗺️', 'No trips yet. Click "+ New Trip" to start!');
  } catch (e) {
    showToast('Failed to load trips.', 'error');
  }
}

function tripStatus(t) {
  const now = new Date();
  const s = new Date(t.startDate);
  const e = new Date(t.endDate);
  if (now < s) return ['upcoming', 'Upcoming'];
  if (now > e) return ['past', 'Past'];
  return ['ongoing', 'Ongoing'];
}

function tripCardHTML(t) {
  const [cls, label] = tripStatus(t);
  const s = t.startDate ? new Date(t.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const e = t.endDate   ? new Date(t.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  return '<div class="trip-card">' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">' +
    '<div class="trip-card-title">' + t.name + '</div>' +
    '<span class="badge badge-' + cls + '">' + label + '</span></div>' +
    '<div class="trip-card-dest">📍 ' + t.destination + '</div>' +
    '<div class="trip-card-dates">📅 ' + s + ' → ' + e + '</div>' +
    (t.notes ? '<div style="color:rgba(255,255,255,0.4);font-size:0.82rem;margin-bottom:16px;line-height:1.5">' + t.notes.substring(0, 100) + (t.notes.length > 100 ? '…' : '') + '</div>' : '') +
    '<div class="trip-card-actions">' +
    '<button class="btn btn-secondary btn-sm" onclick="openTripModal(' + t.id + ')">✏️ Edit</button>' +
    '<button class="btn btn-danger" onclick="deleteTrip(' + t.id + ')">🗑️</button></div></div>';
}

function openTripModal(id) {
  id = id || null;
  editingTripId = id;
  document.getElementById('trip-modal-title').textContent = id ? 'Edit Trip' : 'New Trip';
  if (id) {
    api('GET', '/trips/' + id).then(trip => {
      document.getElementById('trip-name').value = trip.name;
      document.getElementById('trip-dest').value = trip.destination;
      document.getElementById('trip-start').value = trip.startDate ? trip.startDate.split('T')[0] : '';
      document.getElementById('trip-end').value = trip.endDate ? trip.endDate.split('T')[0] : '';
      document.getElementById('trip-notes').value = trip.notes || '';
    });
  } else {
    document.getElementById('trip-name').value = '';
    document.getElementById('trip-dest').value = '';
    document.getElementById('trip-start').value = '';
    document.getElementById('trip-end').value = '';
    document.getElementById('trip-notes').value = '';
  }
  openModal('trip-modal');
}

async function saveTrip() {
  const body = {
    name: document.getElementById('trip-name').value.trim(),
    destination: document.getElementById('trip-dest').value.trim(),
    startDate: document.getElementById('trip-start').value || null,
    endDate: document.getElementById('trip-end').value || null,
    notes: document.getElementById('trip-notes').value.trim(),
  };
  if (!body.name || !body.destination) return showToast('Please fill required fields.', 'error');
  try {
    if (editingTripId) {
      await api('PUT', '/trips/' + editingTripId, body);
      showToast('Trip updated! ✈️', 'success');
    } else {
      await api('POST', '/trips', body);
      showToast('Trip created! 🌍', 'success');
    }
    closeModal('trip-modal');
    loadTrips();
    loadDashboard();
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteTrip(id) {
  if (!confirm('Delete this trip?')) return;
  try {
    await api('DELETE', '/trips/' + id);
    showToast('Trip deleted.', 'success');
    loadTrips();
    loadDashboard();
  } catch (e) { showToast(e.message, 'error'); }
}

// ── EXPENSES ─────────────────────────────────────────────────────────────
const catIcons = { Transport: '🚗', Accommodation: '🏨', Food: '🍽️', Activities: '🎭', Shopping: '🛍️', Other: '📦' };

async function loadExpenses() {
  try {
    const expenses = await api('GET', '/expenses');
    const list = document.getElementById('expense-list');
    list.innerHTML = expenses.length
      ? expenses.map(e =>
          '<div class="expense-item">' +
          '<div class="expense-icon">' + (catIcons[e.category] || '📦') + '</div>' +
          '<div class="expense-info"><div class="expense-desc">' + e.description + '</div>' +
          '<div class="expense-cat">' + e.category + ' · ' + (e.date ? new Date(e.date).toLocaleDateString() : '') + '</div></div>' +
          '<div class="expense-amount">$' + parseFloat(e.amount).toFixed(2) + '</div>' +
          '<button class="btn btn-danger" onclick="deleteExpense(' + e.id + ')">🗑️</button></div>'
        ).join('')
      : emptyState('💰', 'No expenses yet. Add your first one!');
  } catch (e) { showToast('Failed to load expenses.', 'error'); }
}

async function openExpenseModal() {
  try {
    const trips = await api('GET', '/trips');
    document.getElementById('exp-trip').innerHTML = trips.map(t => '<option value="' + t.id + '">' + t.name + '</option>').join('');
    document.getElementById('exp-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('exp-desc').value = '';
    document.getElementById('exp-amount').value = '';
    openModal('expense-modal');
  } catch (e) { showToast('Failed to load trips.', 'error'); }
}

async function saveExpense() {
  const body = {
    description: document.getElementById('exp-desc').value.trim(),
    amount: parseFloat(document.getElementById('exp-amount').value),
    category: document.getElementById('exp-cat').value,
    tripId: parseInt(document.getElementById('exp-trip').value),
    date: document.getElementById('exp-date').value || null,
  };
  if (!body.description || isNaN(body.amount)) return showToast('Please fill required fields.', 'error');
  try {
    await api('POST', '/expenses', body);
    showToast('Expense added! 💰', 'success');
    closeModal('expense-modal');
    loadExpenses();
    loadDashboard();
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteExpense(id) {
  if (!confirm('Delete this expense?')) return;
  try {
    await api('DELETE', '/expenses/' + id);
    showToast('Expense deleted.', 'success');
    loadExpenses();
    loadDashboard();
  } catch (e) { showToast(e.message, 'error'); }
}

// ── JOURNAL ───────────────────────────────────────────────────────────────
async function loadJournal() {
  try {
    const journals = await api('GET', '/journals');
    const list = document.getElementById('journal-list');
    list.innerHTML = journals.length
      ? journals.map(j =>
          '<div class="journal-card">' +
          '<div class="journal-date">📅 ' + (j.date ? new Date(j.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '') + '</div>' +
          '<div class="journal-title">' + j.title + '</div>' +
          '<div class="journal-body">' + j.content + '</div>' +
          '<div style="margin-top:16px"><button class="btn btn-danger" onclick="deleteJournal(' + j.id + ')">🗑️ Delete</button></div></div>'
        ).join('')
      : emptyState('📔', 'Your journal is empty. Write your first memory!');
  } catch (e) { showToast('Failed to load journal.', 'error'); }
}

async function openJournalModal() {
  try {
    const trips = await api('GET', '/trips');
    document.getElementById('jour-trip').innerHTML = trips.map(t => '<option value="' + t.id + '">' + t.name + '</option>').join('');
    document.getElementById('jour-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('jour-title').value = '';
    document.getElementById('jour-body').value = '';
    openModal('journal-modal');
  } catch (e) { showToast('Failed to load trips.', 'error'); }
}

async function saveJournal() {
  const body = {
    title: document.getElementById('jour-title').value.trim(),
    date: document.getElementById('jour-date').value || null,
    tripId: parseInt(document.getElementById('jour-trip').value),
    content: document.getElementById('jour-body').value.trim(),
  };
  if (!body.title || !body.content) return showToast('Please fill required fields.', 'error');
  try {
    await api('POST', '/journals', body);
    showToast('Journal entry saved! 📔', 'success');
    closeModal('journal-modal');
    loadJournal();
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteJournal(id) {
  if (!confirm('Delete this journal entry?')) return;
  try {
    await api('DELETE', '/journals/' + id);
    showToast('Entry deleted.', 'success');
    loadJournal();
  } catch (e) { showToast(e.message, 'error'); }
}

// ── UTILS ─────────────────────────────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.modal-overlay').forEach(m =>
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); })
);

function showToast(msg, type) {
  type = type || 'success';
  const t = document.getElementById('toast');
  t.textContent = (type === 'success' ? '✅ ' : '❌ ') + msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 3000);
}

function emptyState(icon, text) {
  return '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">' + icon + '</div><div class="empty-state-text">' + text + '</div></div>';
}

// ── BOOT ──────────────────────────────────────────────────────────────────
if (token && currentUser) {
  initApp();
}
