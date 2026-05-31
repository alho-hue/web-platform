const terminal = document.querySelector('#terminal');
const statusPill = document.querySelector('#statusPill');
const sessionText = document.querySelector('#sessionText');
const userIdLabel = document.querySelector('#userIdLabel');
const nickname = document.querySelector('#nickname');
const phoneNumber = document.querySelector('#phoneNumber');
const enabledToggle = document.querySelector('#enabledToggle');
const totalUsers = document.querySelector('#totalUsers');
const activeUsers = document.querySelector('#activeUsers');
const stateText = document.querySelector('#stateText');
const newsList = document.querySelector('#newsList');
const newsPageList = document.querySelector('#newsPageList');
const broadcastList = document.querySelector('#broadcastList');
const autoText = document.querySelector('#autoText');

let userId = localStorage.getItem('PipChi_user_id') || '';
if (!userId) {
  userId = crypto.randomUUID();
  localStorage.setItem('PipChi_user_id', userId);
}
let events;

function appendTerminal(line) {
  terminal.textContent += line.endsWith('\n') ? line : `${line}\n`;
  terminal.scrollTop = terminal.scrollHeight;
  saveLogs();
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
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function register(extra = {}) {
  const data = await api('/api/register', {
    userId,
    nickname: nickname.value.trim(),
    phoneNumber: phoneNumber.value.trim(),
    ...extra
  });
  if (!data.ok || !data.user) {
    appendTerminal(data.message || 'Impossible de creer la session utilisateur.');
    return false;
  }
  userId = data.user.userId;
  localStorage.setItem('PipChi_user_id', userId);
  nickname.value = data.user.nickname || '';
  phoneNumber.value = data.user.phoneNumber || '';
  userIdLabel.textContent = userId;
  connectLogs();
  await refresh();
  return true;
}

function renderNews(target, news) {
  const items = news?.current?.length ? news.current : [{ title: 'Aucune nouveaute', body: 'Les annonces apparaitront ici.' }];
  target.innerHTML = items.map((item) => `
    <article>
      <div class="news-row">
        <h3>${escapeHtml(item.title || 'Nouveaute')}</h3>
        ${item.date ? `<time>${new Date(item.date).toLocaleDateString()}</time>` : ''}
      </div>
      <p>${escapeHtml(item.body || '')}</p>
    </article>
  `).join('');
}

function renderBroadcasts(items = []) {
  const broadcasts = items.length ? items : [{ title: 'Aucune annonce', message: 'Les annonces globales apparaitront ici.' }];
  broadcastList.innerHTML = broadcasts.map((item) => `
    <article>
      <div class="news-row">
        <h3>${escapeHtml(item.title || 'Annonce')}</h3>
        ${item.createdAt ? `<time>${new Date(item.createdAt).toLocaleString()}</time>` : ''}
      </div>
      <p>${escapeHtml(item.message || '')}</p>
      ${item.note ? `<p class="muted">${escapeHtml(item.note)}</p>` : ''}
    </article>
  `).join('');
}

function stateLabel(state, running) {
  const labels = { offline: 'Hors ligne', starting: 'Demarrage', connecting: 'Connexion', qr: 'QR pret', connected: 'Connecte', error: 'Erreur' };
  return labels[state] || (running ? 'Actif' : 'Hors ligne');
}

async function refresh() {
  if (!userId) return;
  const data = await api(`/api/status?userId=${encodeURIComponent(userId)}`);
  if (!data.ok) return;

  const { user, running, startedAt, stats, news, broadcasts, inactivityDays, state } = data;
  statusPill.textContent = stateLabel(state, running);
  statusPill.classList.toggle('online', running);
  statusPill.classList.toggle('error', state === 'error');
  sessionText.textContent = running && startedAt ? `Demarre depuis ${new Date(startedAt).toLocaleString()}` : 'Session non demarree';
  enabledToggle.checked = user.botEnabled !== false;
  totalUsers.textContent = stats.totalUsers || 0;
  activeUsers.textContent = stats.activeUsers || 0;
  stateText.textContent = stateLabel(state, running);
  autoText.textContent = `Desactivation automatique apres ${inactivityDays} jour(s) sans activite dashboard.`;
  renderNews(newsList, news);
  renderNews(newsPageList, news);
  renderBroadcasts(broadcasts);
  
  // Sauvegarder l'état dans localStorage
  localStorage.setItem('PipChi_bot_state', JSON.stringify({
    running,
    state,
    startedAt,
    botEnabled: user.botEnabled !== false,
    nickname: user.nickname || '',
    phoneNumber: user.phoneNumber || ''
  }));
}

function connectLogs() {
  if (!userId) return;
  if (events) events.close();
  events = new EventSource(`/api/logs?userId=${encodeURIComponent(userId)}`);
  events.onmessage = (event) => appendTerminal(JSON.parse(event.data));
  
  // Restaurer les logs sauvegardés
  const savedLogs = localStorage.getItem('PipChi_terminal_logs');
  if (savedLogs) {
    terminal.textContent = savedLogs;
  }
}

function saveLogs() {
  localStorage.setItem('PipChi_terminal_logs', terminal.textContent);
}

function restoreState() {
  const savedState = localStorage.getItem('PipChi_bot_state');
  if (savedState) {
    try {
      const state = JSON.parse(savedState);
      if (state.nickname) nickname.value = state.nickname;
      if (state.phoneNumber) phoneNumber.value = state.phoneNumber;
      if (state.botEnabled !== undefined) enabledToggle.checked = state.botEnabled;
    } catch (e) {
      console.error('Erreur restauration état:', e);
    }
  }
}

async function command(path) {
  const data = await api(path, { userId });
  appendTerminal(data.message || (data.ok ? 'Commande envoyee.' : 'Erreur.'));
  if (data.ok) await refresh();
}

async function startPairing() {
  if (!phoneNumber.value.trim()) {
    appendTerminal('Ajoute ton numero WhatsApp avant la connexion telephone.');
    return;
  }
  const ok = await register({ pairingRequested: true });
  if (ok) await command('/api/start-pairing');
}

async function deleteSession() {
  if (!confirm('Supprimer la session WhatsApp ? Il faudra reconnecter le numero.')) return;
  await command('/api/delete-session');
}

async function renderCommands(filter = '') {
  const data = await api('/api/commands');
  const commands = data.commands || [];
  const needle = filter.trim().toLowerCase();
  const visible = commands.filter((item) => (
    item.category.toLowerCase().includes(needle) ||
    item.command.toLowerCase().includes(needle) ||
    item.text.toLowerCase().includes(needle)
  ));
  
  // Grouper par catégorie
  const grouped = {};
  visible.forEach((item) => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });
  
  const categories = Object.keys(grouped).sort();
  
  if (categories.length === 0) {
    document.querySelector('#commandList').innerHTML = '<p class="muted">Aucune commande trouvee.</p>';
    return;
  }
  
  document.querySelector('#commandList').innerHTML = categories.map((category) => `
    <div class="command-category">
      <h3 class="category-title">${escapeHtml(category)}</h3>
      <div class="command-items">
        ${grouped[category].map((item) => `
          <article class="command-card">
            <code class="command-code">${escapeHtml(item.command)}</code>
            <p class="command-desc">${escapeHtml(item.text)}</p>
          </article>
        `).join('')}
      </div>
    </div>
  `).join('');
}

document.querySelectorAll('.tab').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((tab) => tab.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.remove('active'));
    button.classList.add('active');
    document.querySelector(`#${button.dataset.tab}`).classList.add('active');
  });
});

document.querySelector('#saveProfile').addEventListener('click', () => register());
document.querySelector('#startBtn').addEventListener('click', () => command('/api/start'));
document.querySelector('#pairingBtn').addEventListener('click', startPairing);
document.querySelector('#stopBtn').addEventListener('click', () => command('/api/stop'));
document.querySelector('#restartBtn').addEventListener('click', () => command('/api/restart'));
document.querySelector('#deleteSessionBtn').addEventListener('click', deleteSession);
document.querySelector('#clearLogs').addEventListener('click', () => {
  terminal.textContent = '';
});
document.querySelector('#commandSearch').addEventListener('input', (event) => renderCommands(event.target.value));

enabledToggle.addEventListener('change', async () => {
  const data = await api('/api/toggle', { userId, enabled: enabledToggle.checked });
  if (!data.ok || !data.user) {
    appendTerminal(data.message || 'Impossible de changer le statut du bot.');
    enabledToggle.checked = !enabledToggle.checked;
    return;
  }
  appendTerminal(data.user.botEnabled ? 'Bot active.' : 'Bot desactive.');
  await refresh();
});

renderCommands();
restoreState();
register();
setInterval(refresh, 5000);
