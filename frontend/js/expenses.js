// expenses.js — handles all expense CRUD operations

const catIcons = { Transport: '🚗', Accommodation: '🏨', Food: '🍽️', Activities: '🎭', Shopping: '🛍️', Other: '📦' };

async function loadExpenses() {
  try {
    const result = await api('GET', '/expenses');
    return Array.isArray(result) ? result : [];
  } catch (e) {
    console.error('loadExpenses error:', e.message);
    return [];
  }
}

async function openExpenseModal() {
  const trips = await api('GET', '/trips');
  const tripOptions = trips.map(t => '<option value="' + t.id + '">' + t.name + '</option>').join('');
  const today = new Date().toISOString().split('T')[0];

  const modalHTML = '<div class="modal-overlay open" id="expense-modal">' +
    '<div class="modal">' +
    '<div class="modal-title">Add Expense</div>' +
    '<div class="form-group"><label>Description</label><input type="text" id="exp-desc" placeholder="Flight ticket"/></div>' +
    '<div class="form-group"><label>Amount (USD)</label><input type="number" id="exp-amount" placeholder="0.00" min="0" step="0.01"/></div>' +
    '<div class="form-group"><label>Category</label><select id="exp-cat">' +
    '<option value="Transport">🚗 Transport</option>' +
    '<option value="Accommodation">🏨 Accommodation</option>' +
    '<option value="Food">🍽️ Food & Drink</option>' +
    '<option value="Activities">🎭 Activities</option>' +
    '<option value="Shopping">🛍️ Shopping</option>' +
    '<option value="Other">📦 Other</option>' +
    '</select></div>' +
    '<div class="form-group"><label>Trip</label><select id="exp-trip">' + tripOptions + '</select></div>' +
    '<div class="form-group"><label>Date</label><input type="date" id="exp-date" value="' + today + '"/></div>' +
    '<div class="modal-actions">' +
    '<button class="btn btn-secondary" onclick="closeModal(\'expense-modal\')">Cancel</button>' +
    '<button class="btn btn-primary" onclick="saveExpense()">Add Expense</button>' +
    '</div></div></div>';

  document.getElementById('modals-container').innerHTML = modalHTML;
  document.getElementById('expense-modal').addEventListener('click', function(e) {
    if (e.target === this) closeModal('expense-modal');
  });
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
    showPage('expenses');
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteExpense(id) {
  if (!confirm('Delete this expense?')) return;
  try {
    await api('DELETE', '/expenses/' + id);
    showToast('Expense deleted.', 'success');
    showPage('expenses');
  } catch (e) { showToast(e.message, 'error'); }
}
