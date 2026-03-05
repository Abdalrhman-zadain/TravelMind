// ── TRIPS MODULE ─────────────────────────────────────────────────────────
// Handles all trip CRUD operations

let editingTripId = null;

// async function loadTrips() {
//   try {
//     const trips = await api('GET', '/trips');
//     const grid = document.getElementById('trips-grid');
//     grid.innerHTML = trips.length
//       ? trips.map(function(t) { return tripCardHTML(t); }).join('')
//       : emptyState('🗺️', 'No trips yet. Click "+ New Trip" to start!');
//   } catch (e) {
//     showToast('Failed to load trips.', 'error');
//   }
// }

async function loadTrips() {
  try {
    const result = await api('GET', '/trips');
    return Array.isArray(result) ? result : [];
  } catch (e) {
    console.error('loadTrips error:', e.message);
    return [];
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
  const status = tripStatus(t);
  const cls = status[0];
  const label = status[1];
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

  // Inject modal HTML
  const existing = document.getElementById('trip-modal');
  if (!existing) {
    const div = document.createElement('div');
    div.innerHTML = tripModalHTML();
    document.body.appendChild(div.firstChild);
  }

  document.getElementById('trip-modal-title').textContent = id ? 'Edit Trip' : 'New Trip';

  if (id) {
    api('GET', '/trips/' + id).then(function(trip) {
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

function tripModalHTML() {
  return '<div class="modal-overlay" id="trip-modal" onclick="if(event.target===this)closeModal(\'trip-modal\')">' +
    '<div class="modal">' +
    '<div class="modal-title" id="trip-modal-title">New Trip</div>' +
    '<div class="form-group"><label>Trip Name</label><input type="text" id="trip-name" placeholder="Summer in Italy"/></div>' +
    '<div class="form-group"><label>Destination</label><input type="text" id="trip-dest" placeholder="Rome, Italy"/></div>' +
    '<div class="form-group"><label>Start Date</label><input type="date" id="trip-start"/></div>' +
    '<div class="form-group"><label>End Date</label><input type="date" id="trip-end"/></div>' +
    '<div class="form-group"><label>Notes</label><textarea id="trip-notes" placeholder="Itinerary, things to do..."></textarea></div>' +
    '<div class="modal-actions">' +
    '<button class="btn btn-secondary" onclick="closeModal(\'trip-modal\')">Cancel</button>' +
    '<button class="btn btn-primary" onclick="saveTrip()">Save Trip</button></div></div></div>';
}

async function saveTrip() {
  const body = {
    name: document.getElementById('trip-name').value.trim(),
    destination: document.getElementById('trip-dest').value.trim(),
    startDate: document.getElementById('trip-start').value || null,
    endDate: document.getElementById('trip-end').value || null,
    notes: document.getElementById('trip-notes').value.trim()
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
