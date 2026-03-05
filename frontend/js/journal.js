// journal.js — handles all journal CRUD operations

async function loadJournal() {
  try {
    const result = await api('GET', '/journals');
    return Array.isArray(result) ? result : [];
  } catch (e) {
    console.error('loadJournal error:', e.message);
    return [];
  }
}

async function openJournalModal() {
  const trips = await api('GET', '/trips');
  const tripOptions = trips.map(t => '<option value="' + t.id + '">' + t.name + '</option>').join('');
  const today = new Date().toISOString().split('T')[0];

  const modalHTML = '<div class="modal-overlay open" id="journal-modal">' +
    '<div class="modal">' +
    '<div class="modal-title">New Journal Entry</div>' +
    '<div class="form-group"><label>Title</label><input type="text" id="jour-title" placeholder="A beautiful day in Paris..."/></div>' +
    '<div class="form-group"><label>Date</label><input type="date" id="jour-date" value="' + today + '"/></div>' +
    '<div class="form-group"><label>Trip</label><select id="jour-trip">' + tripOptions + '</select></div>' +
    '<div class="form-group"><label>Your Story</label><textarea id="jour-body" placeholder="Write about your day..." style="min-height:140px"></textarea></div>' +
    '<div class="modal-actions">' +
    '<button class="btn btn-secondary" onclick="closeModal(\'journal-modal\')">Cancel</button>' +
    '<button class="btn btn-primary" onclick="saveJournal()">Save Entry</button>' +
    '</div></div></div>';

  document.getElementById('modals-container').innerHTML = modalHTML;
  document.getElementById('journal-modal').addEventListener('click', function(e) {
    if (e.target === this) closeModal('journal-modal');
  });
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
    showPage('journal');
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteJournal(id) {
  if (!confirm('Delete this journal entry?')) return;
  try {
    await api('DELETE', '/journals/' + id);
    showToast('Entry deleted.', 'success');
    showPage('journal');
  } catch (e) { showToast(e.message, 'error'); }
}
