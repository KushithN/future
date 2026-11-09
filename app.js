const $ = (id) => document.getElementById(id);
let token = localStorage.getItem('crm_token');
let allLeads = [];
let currentStatus = '';

const STATUS_LABELS = {
  new: 'New',
  contacted: 'Contacted',
  interested: 'Interested',
  'not-interested': 'Not interested',
  converted: 'Converted',
};

// [status value, label, dot colour]
const PIPELINE = [
  ['', 'All leads', null],
  ['new', 'New', '#0284c7'],
  ['contacted', 'Contacted', '#d97706'],
  ['interested', 'Interested', '#7c3aed'],
  ['converted', 'Converted', '#059669'],
  ['not-interested', 'Not interested', '#dc2626'],
];

const titleCase = (s) => (s || '').replace(/(^|[-\s])(\w)/g, (m, p, c) => p + c.toUpperCase());
const initials = (name) =>
  (name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

/* ---------- API helper ---------- */
async function api(path, method = 'GET', body) {
  const res = await fetch('/api' + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token) logout();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

/* ---------- Auth ---------- */
function showView() {
  $('loginView').classList.toggle('hidden', !!token);
  $('dashView').classList.toggle('hidden', !token);
  if (token) loadLeads();
}

function logout() {
  token = null;
  localStorage.removeItem('crm_token');
  showView();
}

$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('loginError').textContent = '';
  try {
    const data = await api('/auth/login', 'POST', {
      email: $('loginEmail').value,
      password: $('loginPassword').value,
    });
    token = data.token;
    localStorage.setItem('crm_token', token);
    showView();
  } catch (err) {
    $('loginError').textContent = err.message;
  }
});
$('logoutBtn').addEventListener('click', logout);

/* ---------- Load + filter ---------- */
async function loadLeads() {
  try {
    allLeads = await api('/leads');
    renderPipeline();
    applyFilters();
  } catch (err) {
    $('emptyMsg').textContent = err.message;
    $('emptyMsg').classList.remove('hidden');
  }
}

function applyFilters() {
  const q = $('search').value.trim().toLowerCase();
  const filtered = allLeads.filter(
    (l) =>
      (!currentStatus || l.status === currentStatus) &&
      (!q || l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q))
  );
  $('count').textContent = `Showing ${filtered.length} of ${allLeads.length} leads`;
  renderRows(filtered);
}

function renderPipeline() {
  const nav = $('pipeline');
  nav.innerHTML = '';
  PIPELINE.forEach(([value, label, color]) => {
    const n = value ? allLeads.filter((l) => l.status === value).length : allLeads.length;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = currentStatus === value ? 'active' : '';
    btn.setAttribute('aria-pressed', currentStatus === value ? 'true' : 'false');

    const num = document.createElement('b');
    num.textContent = n;
    const lab = document.createElement('span');
    if (color) {
      const dot = document.createElement('i');
      dot.className = 'dot';
      dot.style.background = color;
      lab.appendChild(dot);
    }
    lab.appendChild(document.createTextNode(label));

    btn.append(num, lab);
    btn.addEventListener('click', () => {
      currentStatus = value;
      renderPipeline();
      applyFilters();
    });
    nav.appendChild(btn);
  });
}

/* ---------- Table ---------- */
function renderRows(leads) {
  const tbody = $('leadRows');
  tbody.innerHTML = '';

  const empty = $('emptyMsg');
  if (!leads.length) {
    empty.textContent = allLeads.length
      ? 'No leads match your search or filter.'
      : 'No leads yet. Add your first lead above, or share the contact form.';
    empty.classList.remove('hidden');
  } else {
    empty.classList.add('hidden');
  }

  const today = new Date().toLocaleDateString('en-CA'); // yyyy-mm-dd (local)

  leads.forEach((lead) => {
    const tr = document.createElement('tr');

    // Name with initials avatar
    const tdName = document.createElement('td');
    const nameBox = document.createElement('div');
    nameBox.className = 'name-cell';
    const avatar = document.createElement('span');
    avatar.className = 'avatar';
    avatar.textContent = initials(lead.name);
    let hue = 0;
    for (const ch of lead.name) hue = (hue + ch.charCodeAt(0)) % 360;
    avatar.style.background = `hsl(${hue} 70% 92%)`;
    avatar.style.color = `hsl(${hue} 55% 30%)`;
    const nm = document.createElement('span');
    nm.textContent = lead.name;
    nameBox.append(avatar, nm);
    tdName.appendChild(nameBox);
    tr.appendChild(tdName);

    // Email
    const tdEmail = document.createElement('td');
    tdEmail.className = 'email';
    tdEmail.textContent = lead.email;
    tr.appendChild(tdEmail);

    // Source chip
    const tdSource = document.createElement('td');
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = titleCase(lead.source);
    tdSource.appendChild(chip);
    tr.appendChild(tdSource);

    // Status pill (editable)
    const tdStatus = document.createElement('td');
    const sel = document.createElement('select');
    sel.className = 'status';
    sel.setAttribute('aria-label', 'Status for ' + lead.name);
    sel.dataset.status = lead.status;
    Object.entries(STATUS_LABELS).forEach(([value, label]) => {
      const o = document.createElement('option');
      o.value = value;
      o.textContent = label;
      if (lead.status === value) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener('change', async () => {
      try {
        await api(`/leads/${lead._id}/status`, 'PATCH', { status: sel.value });
        loadLeads();
      } catch (err) {
        alert(err.message);
      }
    });
    tdStatus.appendChild(sel);
    tr.appendChild(tdStatus);

    // Notes
    const tdNotes = document.createElement('td');
    const notesBox = document.createElement('div');
    notesBox.className = 'notes-cell';
    if (!lead.notes.length) {
      const none = document.createElement('div');
      none.className = 'note-line none';
      none.textContent = 'No notes yet';
      notesBox.appendChild(none);
    }
    lead.notes.forEach((n) => {
      const line = document.createElement('div');
      line.className = 'note-line';
      line.textContent = '• ' + n.text;
      notesBox.appendChild(line);
    });
    const addNote = document.createElement('button');
    addNote.type = 'button';
    addNote.className = 'link-btn';
    addNote.textContent = 'Add note';
    addNote.addEventListener('click', async () => {
      const text = prompt('Add a note for ' + lead.name);
      if (!text || !text.trim()) return;
      try {
        await api(`/leads/${lead._id}/notes`, 'POST', { text });
        loadLeads();
      } catch (err) {
        alert(err.message);
      }
    });
    notesBox.appendChild(addNote);
    tdNotes.appendChild(notesBox);
    tr.appendChild(tdNotes);

    // Follow-up date (red when overdue)
    const tdFu = document.createElement('td');
    const fu = document.createElement('input');
    fu.type = 'date';
    fu.setAttribute('aria-label', 'Follow-up date for ' + lead.name);
    if (lead.followUps.length) {
      const last = lead.followUps[lead.followUps.length - 1];
      fu.value = new Date(last.date).toISOString().slice(0, 10);
      const closed = ['converted', 'not-interested'].includes(lead.status);
      if (fu.value < today && !closed) {
        fu.classList.add('overdue');
        fu.title = 'Follow-up is overdue';
      }
    }
    fu.addEventListener('change', async () => {
      if (!fu.value) return;
      try {
        await api(`/leads/${lead._id}/followups`, 'POST', { date: fu.value });
        loadLeads();
      } catch (err) {
        alert(err.message);
      }
    });
    tdFu.appendChild(fu);
    tr.appendChild(tdFu);

    // Delete
    const tdAct = document.createElement('td');
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'btn-delete';
    del.textContent = 'Delete';
    del.addEventListener('click', async () => {
      if (!confirm('Delete ' + lead.name + '? This cannot be undone.')) return;
      try {
        await api('/leads/' + lead._id, 'DELETE');
        loadLeads();
      } catch (err) {
        alert(err.message);
      }
    });
    tdAct.appendChild(del);
    tr.appendChild(tdAct);

    tbody.appendChild(tr);
  });
}

$('search').addEventListener('input', applyFilters);

/* ---------- Add lead ---------- */
$('addForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('addError').textContent = '';
  try {
    await api('/leads', 'POST', {
      name: $('addName').value,
      email: $('addEmail').value,
      source: $('addSource').value,
      status: $('addStatus').value,
      notes: $('addNotes').value,
    });
    $('addForm').reset();
    loadLeads();
  } catch (err) {
    $('addError').textContent = err.message;
  }
});

showView();
