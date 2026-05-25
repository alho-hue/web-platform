const ADMIN_KEY = 'PipChi-admin';
const ADMIN_USER_ID = 'admin-owner';
let adminEvents;
let currentAdminUserId = ADMIN_USER_ID;

const adminTerminal = document.querySelector('#adminTerminal');
const adminName = document.querySelector('#adminName');
const adminPhone = document.querySelector('#adminPhone');

function appendAdmin(line) {
  adminTerminal.textContent += line.endsWith('\n') ? line : `${line}\n`;
  adminTerminal.scrollTop = adminTerminal.scrollHeight;
}

async function api(path, payload = null) {
  const options = payload
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    : {};
  const res = await fetch(path, options);
  const data = await res.json().catch(() => ({ ok: false, message: 'Reponse serveur invalide.' }));
  if (!res.ok && !data.message) data.message = `Erreur serveur ${res.status}.`;
  return data;
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function stateLabel(state, running) {
  const labels = { offline: 'Hors ligne', starting: 'Demarrage', connecting: 'Connexion', qr: 'QR pret', connected: 'Connecte', error: 'Erreur' };
  return labels[state] || (running ? 'Actif' : 'Hors ligne');
}

async function saveAdmin(extra = {}) {
  const data = await api('/api/register', {
    userId: ADMIN_USER_ID,
    nickname: adminName.value.trim() || 'Admin',
    phoneNumber: adminPhone.value.trim(),
    ...extra
  });
  if (!data.ok) appendAdmin(data.message || 'Erreur profil admin.');
  return data.ok;
}

async function adminCommand(path) {
  const data = await api(path, { userId: ADMIN_USER_ID });
  appendAdmin(data.message || (data.ok ? 'Commande envoyee.' : 'Erreur.'));
  await refreshAdminBot();
}

function connectAdminLogs() {
  if (adminEvents) adminEvents.close();
  adminEvents = new EventSource(`/api/logs?userId=${currentAdminUserId}`);
  adminEvents.onmessage = (event) => appendAdmin(JSON.parse(event.data));
  document.querySelector('#adminUserIdLabel').textContent = currentAdminUserId;
}

async function refreshAdminBot() {
  const data = await api(`/api/status?userId=${ADMIN_USER_ID}`);
  if (!data.ok) return;
  adminName.value = data.user.nickname || 'Admin';
  adminPhone.value = data.user.phoneNumber || '';
  document.querySelector('#adminBotState').textContent = stateLabel(data.state, data.running);
  document.querySelector('#adminUserIdLabel').textContent = ADMIN_USER_ID;
}

async function loadAdmin() {
  const data = await api(`/api/admin?adminKey=${ADMIN_KEY}`);
  if (!data.ok) {
    document.querySelector('#adminSummary').textContent = data.message || 'Admin indisponible.';
    return;
  }
  document.querySelector('#adminSummary').textContent = `${data.users.length} utilisateur(s), ${data.stats.activeUsers || 0} actif(s).`;
  document.querySelector('#adminUsers').innerHTML = data.users.map((user) => `
    <article class="table-row">
      <div>
        <strong>${escapeHtml(user.nickname || 'Utilisateur')}</strong>
        <p>${escapeHtml(user.phoneNumber || 'Numero non renseigne')}</p>
        <code>${escapeHtml(user.userId)}</code>
      </div>
      <div>
        <span class="mini-state">${escapeHtml(stateLabel(user.state, user.running))}</span>
        <p class="muted">Derniere activite: ${new Date(user.lastActive || user.createdAt).toLocaleString()}</p>
      </div>
      <div class="row-actions">
        <button data-admin-action="start" data-user="${user.userId}">Start</button>
        <button data-admin-action="stop" data-user="${user.userId}">Stop</button>
        <button data-admin-action="restart" data-user="${user.userId}">Restart</button>
        <button class="danger" data-admin-action="reset" data-user="${user.userId}">Reset</button>
        <button class="danger" data-admin-action="delete" data-user="${user.userId}">Supprimer</button>
      </div>
    </article>
  `).join('');
  document.querySelector('#adminNewsList').innerHTML = (data.news.current || []).map((item) => `
    <article class="table-row news-item">
      <div class="news-content">
        <strong>${escapeHtml(item.title || 'Nouveaute')}</strong>
        <p>${escapeHtml(item.body || '')}</p>
        <p class="muted">ID: ${escapeHtml(item.id || '')}</p>
      </div>
      <div class="news-meta">
        <p class="muted">${item.date ? new Date(item.date).toLocaleString() : ''}</p>
      </div>
      <div class="row-actions">
        <button class="danger delete-news-btn" data-news-id="${escapeHtml(item.id || '')}" data-news-title="${escapeHtml(item.title || 'cette nouveauté')}">
          Supprimer
        </button>
      </div>
    </article>
  `).join('') || '<p class="muted">Aucune nouveaute publiee.</p>';
  
  // Remplir le sélecteur d'utilisateur
  const userSelect = document.querySelector('#adminUserSelect');
  userSelect.innerHTML = '<option value="admin-owner">Admin</option>' + 
    data.users.map((user) => `<option value="${user.userId}">${escapeHtml(user.nickname || user.userId)}</option>`).join('');
}

async function adminAction(userId, action) {
  const data = await api('/api/admin/user-action', { adminKey: ADMIN_KEY, userId, action });
  appendAdmin(data.message || (data.ok ? 'Action admin executee.' : 'Action admin echouee.'));
  await loadAdmin();
}

async function addNews() {
  const title = document.querySelector('#adminNewsTitle').value.trim();
  const body = document.querySelector('#adminNewsBody').value.trim();
  const data = await api('/api/news', { adminKey: ADMIN_KEY, title, body });
  appendAdmin(data.ok ? 'Nouveaute publiee.' : data.message);
  if (data.ok) {
    document.querySelector('#adminNewsTitle').value = '';
    document.querySelector('#adminNewsBody').value = '';
    await loadAdmin();
  }
}

async function sendBroadcast() {
  const title = document.querySelector('#broadcastTitle').value.trim();
  const message = document.querySelector('#broadcastMessage').value.trim();
  const data = await api('/api/broadcast', { adminKey: ADMIN_KEY, title, message });
  appendAdmin(data.ok ? 'Annonce enregistree, les bots connectes vont l envoyer.' : data.message);
  if (data.ok) {
    document.querySelector('#broadcastTitle').value = '';
    document.querySelector('#broadcastMessage').value = '';
  }
}

async function deleteNews(id, title) {
  if (!confirm(`Supprimer la nouveauté "${title}" ? Cette action est irréversible.`)) return;
  const data = await api('/api/news/delete', { adminKey: ADMIN_KEY, id });
  appendAdmin(data.ok ? `Nouveauté "${title}" supprimée avec succès.` : data.message);
  if (data.ok) await loadAdmin();
}

document.querySelector('#adminSave').addEventListener('click', () => saveAdmin());
document.querySelector('#adminStart').addEventListener('click', async () => { if (await saveAdmin()) await adminCommand('/api/start'); });
document.querySelector('#adminPairing').addEventListener('click', async () => { if (await saveAdmin({ pairingRequested: true })) await adminCommand('/api/start-pairing'); });
document.querySelector('#adminStop').addEventListener('click', () => adminCommand('/api/stop'));
document.querySelector('#refreshAdmin').addEventListener('click', loadAdmin);
document.querySelector('#addNews').addEventListener('click', addNews);
document.querySelector('#sendBroadcast').addEventListener('click', sendBroadcast);
document.querySelector('#adminUserSelect').addEventListener('change', (event) => {
  currentAdminUserId = event.target.value;
  adminTerminal.textContent = '';
  connectAdminLogs();
});
document.querySelector('#adminUsers').addEventListener('click', (event) => {
  const action = event.target.dataset.adminAction;
  const user = event.target.dataset.user;
  if (action && user) adminAction(user, action);
});
document.querySelector('#adminNewsList').addEventListener('click', (event) => {
  const btn = event.target.closest('.delete-news-btn');
  if (btn) {
    deleteNews(btn.dataset.newsId, btn.dataset.newsTitle);
  }
});

connectAdminLogs();
saveAdmin().then(() => refreshAdminBot());
loadAdmin();
setInterval(loadAdmin, 5000);
