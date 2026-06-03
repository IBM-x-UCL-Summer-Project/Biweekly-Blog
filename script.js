const PASS = 'ibm2026';
const STORE_KEY = 'ibm_granite_blog_v2';
let authed = false;

function loadPosts() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : getSamplePosts();
  } catch { return getSamplePosts(); }
}

function savePosts(posts) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(posts)); } catch {}
}

function getSamplePosts() {
  return [{
    id: Date.now() - 200000,
    title: 'Week 1 — Project kickoff & IBM onboarding',
    date: '2025-06-02',
    body: 'Team formed and introductions made. Reviewed the project brief from IBM and began IBM onboarding courses. Awaiting kickoff meeting and first contact with the IBM client via Dean Mohammedally. Academic supervisor meeting with Sobhan Tehrani to be arranged for next week.',
    milestones: [
      { text: 'Team assembled', status: 'done' },
      { text: 'Project brief reviewed', status: 'done' },
      { text: 'IBM onboarding courses', status: 'progress' },
      { text: 'Kickoff meeting with IBM client', status: 'todo' },
      { text: 'Supervisor meeting arranged', status: 'todo' }
    ]
  }];
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
  const sorted = [...posts].sort((a,b) => new Date(b.date) - new Date(a.date));
  c.innerHTML = sorted.map((p, i) => `
    <div class="ibm-post">
      <div class="ibm-post-header">
        <div>
          <div class="ibm-post-title">${escapeHtml(p.title)}</div>
          <div class="ibm-post-date">${formatDate(p.date)} &nbsp;·&nbsp; <span class="update-num">Update #${sorted.length - i}</span></div>
        </div>
        <div class="ibm-badge">Biweekly update</div>
      </div>
      <p class="ibm-post-body">${escapeHtml(p.body)}</p>
      ${p.milestones && p.milestones.length ? `
      <div class="ibm-milestones">
        <div class="ibm-milestones-label">Progress</div>
        ${p.milestones.map(m => `
          <div class="ibm-milestone-row">
            <div class="ibm-m-dot ${m.status}"></div>
            <span class="ibm-m-text ${m.status === 'done' ? 'done' : ''}">${escapeHtml(m.text)}</span>
            <span class="ibm-m-status">${statusLabel(m.status)}</span>
          </div>`).join('')}
      </div>` : ''}
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

function checkPw() {
  if (document.getElementById('pwInput').value === PASS) {
    authed = true;
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('formSection').style.display = 'block';
    addMsRow();
    document.getElementById('fDate').valueAsDate = new Date();
  } else {
    document.getElementById('authErr').style.display = 'block';
  }
}

function addMsRow() {
  const b = document.getElementById('msBuilder');
  const row = document.createElement('div');
  row.className = 'ms-row';
  row.innerHTML = `<input type="text" placeholder="Milestone description" /><select><option value="done">Complete</option><option value="progress" selected>In progress</option><option value="todo">Planned</option></select><button onclick="this.parentElement.remove()">×</button>`;
  b.appendChild(row);
}

function submitPost() {
  const title = document.getElementById('fTitle').value.trim();
  const date = document.getElementById('fDate').value;
  const body = document.getElementById('fBody').value.trim();
  if (!title || !date || !body) { alert('Please fill in title, date, and summary.'); return; }
  const rows = document.querySelectorAll('#msBuilder .ms-row');
  const milestones = [];
  rows.forEach(r => {
    const t = r.querySelector('input').value.trim();
    const s = r.querySelector('select').value;
    if (t) milestones.push({ text: t, status: s });
  });
  const posts = loadPosts();
  posts.push({ id: Date.now(), title, date, body, milestones });
  savePosts(posts);
  renderPosts(posts);
  clearForm();
  document.getElementById('adminPanel').classList.remove('open');
  document.getElementById('adminToggleLabel').textContent = 'Post an update';
}

function clearForm() {
  ['fTitle','fBody'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('fDate').valueAsDate = new Date();
  document.getElementById('msBuilder').innerHTML = '';
}

renderPosts(loadPosts());
