// api.js

const API_BASE = 'https://localhost:7263/api';

async function api(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  
  // ✅ Read token fresh every single request
  const token = localStorage.getItem('tm_token');
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(API_BASE + path, {
    method: method,
    headers: headers,
    body: body ? JSON.stringify(body) : null
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.title || 'Request failed');
  return data;
}

function showToast(msg, type) {
  type = type || 'success';
  const t = document.getElementById('toast');
  t.textContent = (type === 'success' ? '✅ ' : '❌ ') + msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(function() { t.classList.remove('show'); }, 3000);
}

function emptyState(icon, text) {
  return '<div class="empty-state" style="grid-column:1/-1">' +
    '<div class="empty-state-icon">' + icon + '</div>' +
    '<div class="empty-state-text">' + text + '</div></div>';
}