// ── AUTH FUNCTIONS ───────────────────────────────────────────────────────
// Handles login, register, logout, and session management

let currentUser = JSON.parse(localStorage.getItem('tm_user') || 'null');

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(function(b, i) {
    b.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'register'));
  });
  document.getElementById('login-form').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('register-form').style.display = tab === 'register' ? 'block' : 'none';
}

async function login() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  document.getElementById('login-error').textContent = '';
  if (!email || !password) return document.getElementById('login-error').textContent = 'Please fill all fields.';
  try {
    const data = await api('POST', '/auth/login', { email: email, password: password });
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
    const data = await api('POST', '/auth/register', { name: name, email: email, password: password });
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
