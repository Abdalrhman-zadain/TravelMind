// app.js — main app init, navigation, utils

// ── INIT ──
function initApp() {
  const user = JSON.parse(localStorage.getItem('tm_user') || 'null');
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  const name = user ? user.name : 'Traveler';
  document.getElementById('user-name-display').textContent = name;
  document.getElementById('user-avatar').textContent = name[0].toUpperCase();
  showPage('dashboard');
}

// ── NAVIGATION ──
async function showPage(page) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navItem = document.querySelector('.nav-item[onclick="showPage(\'' + page + '\')"]');
  if (navItem) navItem.classList.add('active');

  const container = document.getElementById('main-content');

  if (page === 'dashboard') {
    // ✅ .catch(() => []) ensures we always get an array even if API fails
    const trips    = await loadTrips().catch(() => []);
    const expenses = await loadExpenses().catch(() => []);
    const journals = await loadJournal().catch(() => []);

    const total = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
    const dests = new Set(trips.map(t => t.destination ? t.destination.split(',')[0].trim() : ''));
    const recent = trips.slice(-3).reverse();

    container.innerHTML =
      '<div class="page active" id="page-dashboard">' +
      '<div class="page-header"><div>' +
      '<div class="page-title">Welcome back 👋</div>' +
      '<div class="page-subtitle">Here\'s your travel overview</div>' +
      '</div></div>' +
      '<div class="stats-grid">' +
      '<div class="stat-card" data-icon="✈️"><div class="stat-value">' + trips.length + '</div><div class="stat-label">Total Trips</div></div>' +
      '<div class="stat-card" data-icon="💰"><div class="stat-value">$' + total.toLocaleString() + '</div><div class="stat-label">Total Spent</div></div>' +
      '<div class="stat-card" data-icon="📔"><div class="stat-value">' + journals.length + '</div><div class="stat-label">Journal Entries</div></div>' +
      '<div class="stat-card" data-icon="🌍"><div class="stat-value">' + dests.size + '</div><div class="stat-label">Destinations</div></div>' +
      '</div>' +
      '<div class="page-header" style="margin-bottom:16px"><div class="page-title" style="font-size:1.2rem">Recent Trips</div></div>' +
      '<div class="cards-grid">' + (recent.length ? recent.map(t => tripCardHTML(t)).join('') : emptyState('✈️', 'No trips yet!')) + '</div>' +
      '</div>';
  }

  else if (page === 'trips') {
    const trips = await loadTrips().catch(() => []);
    container.innerHTML =
      '<div class="page active" id="page-trips">' +
      '<div class="page-header"><div>' +
      '<div class="page-title">My Trips</div>' +
      '<div class="page-subtitle">Plan, track, and relive your adventures</div>' +
      '</div>' +
      '<button class="btn btn-primary btn-sm" onclick="openTripModal()">+ New Trip</button>' +
      '</div>' +
      '<div class="cards-grid">' + (trips.length ? trips.map(t => tripCardHTML(t)).join('') : emptyState('🗺️', 'No trips yet. Click "+ New Trip" to start!')) + '</div>' +
      '</div>';
  }

  else if (page === 'expenses') {
    const expenses = await loadExpenses().catch(() => []);
    const items = expenses.length
      ? expenses.map(e =>
          '<div class="expense-item">' +
          '<div class="expense-icon">' + (catIcons[e.category] || '📦') + '</div>' +
          '<div class="expense-info"><div class="expense-desc">' + e.description + '</div>' +
          '<div class="expense-cat">' + e.category + ' · ' + (e.date ? new Date(e.date).toLocaleDateString() : '') + '</div></div>' +
          '<div class="expense-amount">$' + parseFloat(e.amount).toFixed(2) + '</div>' +
          '<button class="btn btn-danger" onclick="deleteExpense(' + e.id + ')">🗑️</button></div>'
        ).join('')
      : emptyState('💰', 'No expenses yet. Add your first one!');

    container.innerHTML =
      '<div class="page active" id="page-expenses">' +
      '<div class="page-header"><div>' +
      '<div class="page-title">Expenses</div>' +
      '<div class="page-subtitle">Track your travel spending</div>' +
      '</div>' +
      '<button class="btn btn-primary btn-sm" onclick="openExpenseModal()">+ Add Expense</button>' +
      '</div>' +
      '<div class="expense-list">' + items + '</div>' +
      '</div>';
  }

  else if (page === 'journal') {
    const journals = await loadJournal().catch(() => []);
    const items = journals.length
      ? journals.map(j =>
          '<div class="journal-card">' +
          '<div class="journal-date">📅 ' + (j.date ? new Date(j.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '') + '</div>' +
          '<div class="journal-title">' + j.title + '</div>' +
          '<div class="journal-body">' + j.content + '</div>' +
          '<div style="margin-top:16px"><button class="btn btn-danger" onclick="deleteJournal(' + j.id + ')">🗑️ Delete</button></div>' +
          '</div>'
        ).join('')
      : emptyState('📔', 'Your journal is empty. Write your first memory!');

    container.innerHTML =
      '<div class="page active" id="page-journal">' +
      '<div class="page-header"><div>' +
      '<div class="page-title">Travel Journal</div>' +
      '<div class="page-subtitle">Capture your memories</div>' +
      '</div>' +
      '<button class="btn btn-primary btn-sm" onclick="openJournalModal()">+ New Entry</button>' +
      '</div>' +
      '<div class="journal-list">' + items + '</div>' +
      '</div>';
  }
}

// ── UTILS ──
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function showToast(msg, type) {
  type = type || 'success';
  const t = document.getElementById('toast');
  t.textContent = (type === 'success' ? '✅ ' : '❌ ') + msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 3000);
}

function emptyState(icon, text) {
  return '<div class="empty-state" style="grid-column:1/-1">' +
    '<div class="empty-state-icon">' + icon + '</div>' +
    '<div class="empty-state-text">' + text + '</div></div>';
}

// ── BOOT ──
window.onload = function() {
  const token = localStorage.getItem('tm_token');
  const user = localStorage.getItem('tm_user');
  if (token && user) {
    initApp();
  }
};