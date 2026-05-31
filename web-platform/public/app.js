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

// Amélioration: Ajouter une animation de chargement
function showLoading(element, show = true) {
  if (show) {
    element.disabled = true;
    element.dataset.originalText = element.textContent;
    element.textContent = 'Chargement...';
  } else {
    element.disabled = false;
    element.textContent = element.dataset.originalText || element.textContent;
  }
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
  return data.ok;
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
          <button class="command-card" data-command="${escapeHtml(item.command)}" data-desc="${escapeHtml(item.text)}">
            <code class="command-code">${escapeHtml(item.command)}</code>
            <p class="command-desc">${escapeHtml(item.text)}</p>
            <span class="command-hint">Clique pour voir les details</span>
          </button>
        `).join('')}
      </div>
    </div>
  `).join('');
  
  // Ajouter les event listeners pour les popups
  document.querySelectorAll('.command-card').forEach((card) => {
    card.addEventListener('click', () => showCommandPopup(card.dataset.command, card.dataset.desc));
  });
}

// Mapping des commandes avec leurs vraies descriptions
const commandDescriptions = {
  '!admins': 'Affiche la liste des administrateurs du groupe',
  '!ferme': 'Ferme le groupe (seuls les admins peuvent envoyer des messages)',
  '!ouvre': 'Ouvre le groupe (tout le monde peut envoyer des messages)',
  '!warn': 'Avertir un utilisateur du groupe',
  '!unwarn': 'Retirer les avertissements d\'un utilisateur',
  '!kick': 'Expulser un utilisateur du groupe',
  '!promote': 'Promouvoir un utilisateur en admin',
  '!demote': 'Rétrograder un admin en membre',
  '!add': 'Ajouter un membre au groupe',
  '!link': 'Obtenir le lien d\'invitation du groupe',
  '!desc': 'Changer la description du groupe',
  '!subject': 'Changer le nom du groupe',
  '!setup': 'Configurer le bot comme admin du groupe',
  '!tagall': 'Mentionner tous les membres du groupe',
  '!resetscore': 'Réinitialiser les scores du groupe',
  '!welcome on': 'Activer le message de bienvenue',
  '!welcome off': 'Désactiver le message de bienvenue',
  '!antilink on': 'Activer l\'anti-lien (supprime les liens)',
  '!antilink off': 'Désactiver l\'anti-lien',
  '!jeu': 'Lancer un jeu aléatoire',
  '!culture': 'Quiz de culture générale (12 points)',
  '!country': 'Quiz des pays (8 points avec indices)',
  '!capitale': 'Quiz des capitales (8 points avec indices)',
  '!vraioufaux': 'Quiz vrai/faux avec explications',
  '!devine': 'Devine le mot (8 points avec indices)',
  '!monument': 'Quiz des monuments (9 points avec indices)',
  '!drapeau': 'Quiz des drapeaux (9 points avec indices)',
  '!science': 'Quiz de science (avec indices)',
  '!sport': 'Quiz de sport (avec indices)',
  '!cinema': 'Quiz de cinéma (avec indices)',
  '!histoire': 'Quiz d\'histoire (avec indices)',
  '!math': 'Quiz de mathématiques (5 points)',
  '!logique': 'Quiz de logique (avec indices)',
  '!indice': 'Demander un indice pour le quiz en cours',
  '!otaku': 'Jeu otaku aléatoire',
  '!anime': 'Quiz anime (8 points)',
  '!manga': 'Quiz manga (8 points)',
  '!personnage': 'Quiz personnages (7 points)',
  '!opening': 'Quiz openings (6 points)',
  '!seiyuu': 'Quiz seiyuu (9 points)',
  '!battle': 'Battle 1v1 OTAKU contre un joueur',
  '!organisation': 'Créer ou rejoindre une organisation',
  '!mon organisation': 'Voir votre organisation',
  '!debug org': 'Déboguer les organisations',
  '!couple': 'Former un couple aléatoire',
  '!crush': 'Révéler votre crush',
  '!mariage': 'Simuler un mariage',
  '!ship': 'Ship deux personnes',
  '!love': 'Calculer votre compatibilité amoureuse',
  '!roll': 'Lancer un dé',
  '!8ball': 'Boule magique (répond à vos questions)',
  '!aouv': 'Action ou Vérité (200+ questions)',
  '!debat': 'Lancer un débat',
  '!lastcry': 'Jeu du dernier survivant',
  '!loup create': 'Créer une partie Loup-Garou (4-20 joueurs)',
  '!loup join': 'Rejoindre une partie Loup-Garou',
  '!loup start': 'Démarrer une partie Loup-Garou',
  '!loup status': 'Voir l\'état de la partie Loup-Garou',
  '!vote': 'Voter pour éliminer un joueur (Loup-Garou)',
  '!play': 'Télécharger et envoyer de la musique',
  '!qr': 'Générer un QR code',
  '!profil': 'Obtenir la photo de profil d\'un utilisateur',
  '!foot': 'Obtenir les résultats de football',
  '!ghost': 'Extraire un média fantôme',
  '!v': 'Télécharger le contenu d\'un message',
  '!sticker': 'Convertir une image en sticker',
  '!stickers': 'Voir vos packs de stickers créés',
  '!msgcount': 'Compter les messages du groupe',
  '!top': 'Voir le classement des membres',
  '!groupstats': 'Voir les statistiques du groupe',
  '!restore': 'Restaurer les données du groupe',
  '!scores': 'Voir le classement des joueurs',
  '!info': 'Informations sur le bot',
  '!help': 'Afficher la liste des commandes',
  '!myid': 'Afficher votre ID WhatsApp'
};

function getCommandDescription(command) {
  return commandDescriptions[command] || 'Commande detectee dans index.js.';
}

function showCommandPopup(command, description) {
  const realDescription = getCommandDescription(command);
  // Créer la popup
  const popup = document.createElement('div');
  popup.className = 'command-popup-overlay';
  popup.innerHTML = `
    <div class="command-popup">
      <div class="popup-header">
        <h3>${escapeHtml(command)}</h3>
        <button class="popup-close">&times;</button>
      </div>
      <div class="popup-content">
        <p><strong>Description:</strong></p>
        <p>${escapeHtml(realDescription)}</p>
        <p class="popup-hint">Utilise cette commande dans WhatsApp en envoyant: <code>${escapeHtml(command)}</code></p>
      </div>
    </div>
  `;
  
  document.body.appendChild(popup);
  
  // Fermer la popup
  const closeBtn = popup.querySelector('.popup-close');
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(popup);
  });
  
  popup.addEventListener('click', (e) => {
    if (e.target === popup) {
      document.body.removeChild(popup);
    }
  });
}

document.querySelectorAll('.tab').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((tab) => tab.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.remove('active'));
    button.classList.add('active');
    document.querySelector(`#${button.dataset.tab}`).classList.add('active');
  });
});

document.querySelector('#saveProfile').addEventListener('click', async () => {
  showLoading(document.querySelector('#saveProfile'));
  await register();
  showLoading(document.querySelector('#saveProfile'), false);
});
document.querySelector('#startBtn').addEventListener('click', async () => {
  showLoading(document.querySelector('#startBtn'));
  await command('/api/start');
  showLoading(document.querySelector('#startBtn'), false);
});
document.querySelector('#pairingBtn').addEventListener('click', async () => {
  showLoading(document.querySelector('#pairingBtn'));
  await startPairing();
  showLoading(document.querySelector('#pairingBtn'), false);
});
document.querySelector('#stopBtn').addEventListener('click', async () => {
  showLoading(document.querySelector('#stopBtn'));
  await command('/api/stop');
  showLoading(document.querySelector('#stopBtn'), false);
});
document.querySelector('#restartBtn').addEventListener('click', async () => {
  showLoading(document.querySelector('#restartBtn'));
  await command('/api/restart');
  showLoading(document.querySelector('#restartBtn'), false);
});
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
