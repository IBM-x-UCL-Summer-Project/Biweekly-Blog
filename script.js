const PASS = CONFIG.ADMIN_PASS;
const db = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

let authed = false;
let editingId = null;
const MS_ORDER = { done: 0, progress: 1, todo: 2 };

async function loadPosts() {
  const { data, error } = await db.from('Posts').select('*').order('date', { ascending: false });
  if (error) { console.error('Failed to load posts:', error.message); return []; }
  return data || [];
}

function statusLabel(s) {
  return { done: 'Complete', progress: 'In progress', todo: 'Planned' }[s] || s;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function renderPosts(posts) {
  const c = document.getElementById('postsContainer');
  if (!posts.length) { c.innerHTML = '<div class="empty-state">No updates yet. Be the first to post.</div>'; return; }
  c.innerHTML = posts.map((p, i) => `
    <div class="ibm-post">
      <div class="ibm-post-header">
        <div>
          <div class="ibm-post-title">${escapeHtml(p.title)}</div>
          <div class="ibm-post-date">${formatDate(p.date)} &nbsp;·&nbsp; <span class="update-num">Update #${posts.length - i}</span></div>
        </div>
        <div class="ibm-badge">Biweekly update</div>
      </div>
      <p class="ibm-post-body">${escapeHtml(p.body)}</p>
      ${p.milestones && p.milestones.length ? `
      <div class="ibm-milestones">
        <div class="ibm-milestones-label">Progress</div>
        ${[...p.milestones].sort((a,b) => MS_ORDER[a.status] - MS_ORDER[b.status]).map(m => `
          <div class="ibm-milestone-row">
            <div class="ibm-m-dot ${m.status}"></div>
            <span class="ibm-m-text ${m.status === 'done' ? 'done' : ''}">${escapeHtml(m.text)}</span>
            <span class="ibm-m-status">${statusLabel(m.status)}</span>
          </div>`).join('')}
      </div>` : ''}
      ${authed ? `<div class="ibm-post-actions"><button class="ibm-edit-btn" onclick="editPost(${p.id})">Edit</button></div>` : ''}
    </div>`).join('');
}

function formatDate(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function toggleAdmin() {
  const p = document.getElementById('adminPanel');
  const open = p.classList.toggle('open');
  document.getElementById('adminToggleLabel').textContent = open ? 'Close panel' : 'Post an update';
  if (open && !authed) document.getElementById('pwInput').focus();
}

async function checkPw() {
  if (document.getElementById('pwInput').value === PASS) {
    authed = true;
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('formSection').style.display = 'block';
    addMsRow();
    renderPosts(await loadPosts());
  } else {
    document.getElementById('authErr').style.display = 'block';
  }
}

function addMsRow(text = '', status = 'progress') {
  const b = document.getElementById('msBuilder');
  const row = document.createElement('div');
  row.className = 'ms-row';
  const opt = (val, label) => `<option value="${val}"${status === val ? ' selected' : ''}>${label}</option>`;
  row.innerHTML = `<input type="text" placeholder="Milestone description" value="${escapeHtml(text)}" /><select>${opt('done','Complete')}${opt('progress','In progress')}${opt('todo','Planned')}</select><button onclick="this.parentElement.remove()">×</button>`;
  b.appendChild(row);
}

async function editPost(id) {
  if (!authed) return;
  const posts = await loadPosts();
  const post = posts.find(p => p.id === id);
  if (!post) return;
  editingId = id;
  document.getElementById('fTitle').value = post.title;
  document.getElementById('fBody').value = post.body;
  document.getElementById('msBuilder').innerHTML = '';
  (post.milestones || []).forEach(m => addMsRow(m.text, m.status));
  document.getElementById('submitBtn').textContent = 'Save changes';
  document.getElementById('adminPanel').classList.add('open');
  document.getElementById('adminToggleLabel').textContent = 'Close panel';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function submitPost() {
  const title = document.getElementById('fTitle').value.trim();
  const date = new Date().toISOString().split('T')[0];
  const body = document.getElementById('fBody').value.trim();
  if (!title || !body) { alert('Please fill in title and summary.'); return; }
  const rows = document.querySelectorAll('#msBuilder .ms-row');
  const milestones = [];
  rows.forEach(r => {
    const t = r.querySelector('input').value.trim();
    const s = r.querySelector('select').value;
    if (t) milestones.push({ text: t, status: s });
  });

  document.getElementById('submitBtn').disabled = true;
  document.getElementById('submitBtn').textContent = 'Saving…';

  let error;
  if (editingId !== null) {
    ({ error } = await db.from('Posts').update({ title, date, body, milestones }).eq('id', editingId));
  } else {
    ({ error } = await db.from('Posts').insert({ title, date, body, milestones }));
  }

  document.getElementById('submitBtn').disabled = false;

  if (error) {
    alert('Failed to save: ' + error.message);
    document.getElementById('submitBtn').textContent = editingId ? 'Save changes' : 'Publish update';
    return;
  }

  renderPosts(await loadPosts());
  clearForm();
  document.getElementById('adminPanel').classList.remove('open');
  document.getElementById('adminToggleLabel').textContent = 'Post an update';
}

function clearForm() {
  editingId = null;
  ['fTitle','fBody'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('msBuilder').innerHTML = '';
  document.getElementById('submitBtn').textContent = 'Publish update';
  document.getElementById('submitBtn').disabled = false;
}

(async () => { renderPosts(await loadPosts()); })();
