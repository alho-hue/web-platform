const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname);
const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const RUNTIME_DIR = path.join(__dirname, 'runtime');
const USERS_DIR = path.join(__dirname, 'users');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');
const NEWS_FILE = path.join(DATA_DIR, 'news.json');
const BROADCASTS_FILE = path.join(DATA_DIR, 'broadcasts.json');
const BOT_ENTRY = path.join(ROOT, 'index.js');
const INACTIVITY_DAYS = Number(process.env.INACTIVITY_DAYS || 7);
const ADMIN_KEY = process.env.ADMIN_KEY || crypto.randomBytes(32).toString('hex');

const sessions = new Map();
const logBuffers = new Map();
const logClients = new Map();
const rateLimiter = new Map();

let cachedCommands = null;
let lastBotFileModTime = 0;

function ensureBase() {
  for (const dir of [PUBLIC_DIR, DATA_DIR, USERS_DIR, RUNTIME_DIR]) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) writeJson(USERS_FILE, {});
  if (!fs.existsSync(STATS_FILE)) writeJson(STATS_FILE, defaultStats());
  if (!fs.existsSync(BROADCASTS_FILE)) writeJson(BROADCASTS_FILE, []);
  const users = getUsers();
  for (const user of Object.values(users)) user.isActive = false;
  saveUsers(users);
  const news = readJson(NEWS_FILE, null);
  if (!news || !Array.isArray(news.current) || news.current.length === 0) {
    writeJson(NEWS_FILE, {
      current: [
        {
          title: 'Plateforme web',
          date: new Date().toISOString(),
          body: 'Lancement du dashboard avec QR live, sessions separees, start/stop et alertes.'
        }
      ],
      history: []
    });
  }
}

function defaultStats() {
  return { totalUsers: 0, activeUsers: 0, totalCommands: 0, lastUpdate: new Date().toISOString() };
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

function ensureDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    return true;
  } catch (error) {
    if (error.code === 'EEXIST') return true;
    throw error;
  }
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(payload));
}

function requireAdmin(body, url) {
  const key = body.adminKey || url.searchParams.get('adminKey') || '';
  return key === ADMIN_KEY;
}

function checkRateLimit(identifier, limit = 60, windowMs = 60000) {
  const now = Date.now();
  const record = rateLimiter.get(identifier) || { count: 0, resetTime: now + windowMs };
  
  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + windowMs;
  }
  
  record.count++;
  rateLimiter.set(identifier, record);
  
  return record.count <= limit;
}

function userDir(userId) {
  return path.join(USERS_DIR, userId);
}

function normalizeUserId(userId) {
  return String(userId || '').replace(/[^a-zA-Z0-9_-]/g, '');
}

function normalizePhone(phoneNumber) {
  return String(phoneNumber || '').replace(/\D/g, '');
}

function getUsers() {
  return readJson(USERS_FILE, {});
}

function saveUsers(users) {
  writeJson(USERS_FILE, users);
  updateStats(users);
}

function updateStats(users = getUsers()) {
  const values = Object.values(users);
  writeJson(STATS_FILE, {
    totalUsers: values.length,
    activeUsers: values.filter((user) => user.isActive).length,
    totalCommands: values.reduce((sum, user) => sum + Number(user.commandCount || 0), 0),
    lastUpdate: new Date().toISOString()
  });
}

function ensureUser(input = {}) {
  const users = getUsers();
  const requestedId = normalizeUserId(input.userId);
  const userId = requestedId || crypto.randomUUID();
  const now = new Date().toISOString();
  const phoneNumber = String(input.phoneNumber || users[userId]?.phoneNumber || '').trim();
  const normalizedPhone = normalizePhone(phoneNumber);
  const duplicate = normalizedPhone
    ? Object.values(users).find((user) => user.userId !== userId && normalizePhone(user.phoneNumber) === normalizedPhone)
    : null;

  if (duplicate) {
    const error = new Error('Ce numero WhatsApp est deja utilise par une autre session.');
    error.statusCode = 409;
    throw error;
  }

  users[userId] = {
    userId,
    phoneNumber,
    nickname: input.nickname || users[userId]?.nickname || 'Utilisateur',
    createdAt: users[userId]?.createdAt || now,
    lastActive: now,
    isActive: Boolean(sessions.get(userId)?.process),
    botEnabled: users[userId]?.botEnabled !== false,
    pairingRequested: Boolean(input.pairingRequested || users[userId]?.pairingRequested),
    commandCount: users[userId]?.commandCount || 0,
    warnings: users[userId]?.warnings || 0,
    lastNoticeAt: users[userId]?.lastNoticeAt || null
  };

  ensureDir(path.join(userDir(userId), 'auth'));
  saveUsers(users);
  return users[userId];
}

function appendLog(userId, line, options = {}) {
  const text = String(line).replace(/\r/g, '');
  const entry = options.raw ? text : `[${new Date().toLocaleTimeString()}] ${text}\n`;
  const buffer = logBuffers.get(userId) || [];
  buffer.push(entry);
  while (buffer.length > 500) buffer.shift();
  logBuffers.set(userId, buffer);

  for (const res of logClients.get(userId) || []) {
    res.write(`data: ${JSON.stringify(entry)}\n\n`);
  }
}

function setActive(userId, isActive) {
  const users = getUsers();
  if (users[userId]) {
    users[userId].isActive = isActive;
    users[userId].lastActive = new Date().toISOString();
    saveUsers(users);
  }
}

function startBot(userId) {
  const user = ensureUser({ userId });
  if (user.botEnabled === false) {
    return { ok: false, message: 'Le bot est desactive pour cet utilisateur.' };
  }
  if (sessions.get(userId)?.process) {
    return { ok: true, message: 'Bot deja lance.' };
  }

  const cwd = userDir(userId);
  const downloadDir = path.join(RUNTIME_DIR, 'downloads', userId);
  ensureDir(downloadDir);
  let child;
  try {
    child = spawn(process.execPath, [BOT_ENTRY], {
      cwd,
      env: {
        ...process.env,
        PipChi_USER_ID: userId,
        PipChi_DOWNLOAD_DIR: downloadDir,
        PipChi_PAIRING_PHONE: user.pairingRequested ? normalizePhone(user.phoneNumber) : '',
        PipChi_OWNER_PHONE: normalizePhone(user.phoneNumber),
        PipChi_BROADCASTS_FILE: BROADCASTS_FILE
      },
      windowsHide: true
    });
  } catch (error) {
    const message = error.code === 'EPERM'
      ? 'Windows/Node bloque le lancement du bot depuis ce serveur. Ferme ce serveur puis lance START-WEB.bat directement depuis le dossier du projet.'
      : `Impossible de lancer le bot: ${error.message}`;
    appendLog(userId, message);
    return { ok: false, message };
  }

  sessions.set(userId, { process: child, startedAt: new Date().toISOString() });
  appendLog(userId, `Demarrage du bot pour ${user.nickname || userId}`);

  child.stdout.on('data', (chunk) => appendLog(userId, chunk.toString(), { raw: true }));
  child.stderr.on('data', (chunk) => appendLog(userId, chunk.toString(), { raw: true }));
  child.on('error', (error) => {
    appendLog(userId, `Erreur lancement bot: ${error.message}`);
    sessions.delete(userId);
    setActive(userId, false);
  });
  child.on('exit', (code, signal) => {
    appendLog(userId, `Processus arrete (code ${code ?? 'n/a'}, signal ${signal ?? 'n/a'}).`);
    sessions.delete(userId);
    setActive(userId, false);
  });

  setActive(userId, true);
  return { ok: true, message: 'Bot lance. Le QR va apparaitre dans le terminal.' };
}

function startBotWithPairing(userId) {
  const users = getUsers();
  const user = ensureUser({ userId, pairingRequested: true });
  users[user.userId] = { ...user, pairingRequested: true };
  saveUsers(users);
  return startBot(user.userId);
}

function stopBot(userId, reason = 'Arret demande depuis le dashboard.') {
  const session = sessions.get(userId);
  if (!session?.process) {
    setActive(userId, false);
    return { ok: true, message: 'Bot deja arrete.' };
  }
  appendLog(userId, reason);
  session.process.kill();
  sessions.delete(userId);
  setActive(userId, false);
  return { ok: true, message: 'Bot arrete.' };
}

function statusFor(userId) {
  const users = getUsers();
  const user = users[userId] || ensureUser({ userId });
  const session = sessions.get(userId);
  return {
    user,
    running: Boolean(session?.process),
    startedAt: session?.startedAt || null,
    logs: logBuffers.get(userId) || [],
    stats: readJson(STATS_FILE, defaultStats()),
    news: readJson(NEWS_FILE, { current: [], history: [] }),
    broadcasts: readJson(BROADCASTS_FILE, []),
    inactivityDays: INACTIVITY_DAYS
  };
}

function getConnectionState(userId) {
  const logs = (logBuffers.get(userId) || []).join('').toLowerCase();
  const running = Boolean(sessions.get(userId)?.process);
  if (!running) return 'offline';
  if (logs.includes('bot connect') || logs.includes('bot connect')) return 'connected';
  if (logs.includes('scanne ce qr') || logs.includes('qr code') || logs.includes('qr: true')) return 'qr';
  if (logs.includes('connexion en cours') || logs.includes('connecting')) return 'connecting';
  if (logs.includes('erreur') || logs.includes('error')) return 'error';
  return 'starting';
}

function listUsersForAdmin() {
  const users = getUsers();
  return Object.values(users).map((user) => ({
    ...user,
    running: Boolean(sessions.get(user.userId)?.process),
    startedAt: sessions.get(user.userId)?.startedAt || null,
    state: getConnectionState(user.userId),
    authExists: fs.existsSync(path.join(userDir(user.userId), 'auth'))
  }));
}

function resetSession(userId) {
  stopBot(userId, 'Session supprimee depuis le dashboard.');
  const authDir = path.join(userDir(userId), 'auth');
  try {
    if (fs.existsSync(authDir)) fs.rmSync(authDir, { recursive: true, force: true });
    ensureDir(authDir);
  } catch (error) {
    return { ok: false, message: `Impossible de supprimer la session auth: ${error.message}` };
  }
  appendLog(userId, 'Session WhatsApp supprimee. Redemarre le bot pour generer un nouveau QR.');
  return { ok: true, message: 'Session supprimee. Tu peux reconnecter un numero.' };
}

function saveNewsItem(item) {
  const news = readJson(NEWS_FILE, { current: [], history: [] });
  const entry = {
    id: crypto.randomUUID(),
    title: String(item.title || 'Nouvelle annonce').trim(),
    body: String(item.body || '').trim(),
    date: new Date().toISOString()
  };
  news.current = [entry, ...(news.current || [])].slice(0, 8);
  news.history = news.history || [];
  writeJson(NEWS_FILE, news);
  return entry;
}

function deleteNewsItem(id) {
  const news = readJson(NEWS_FILE, { current: [], history: [] });
  const before = news.current.length;
  news.current = news.current.filter((item) => item.id !== id);
  writeJson(NEWS_FILE, news);
  return before !== news.current.length;
}

function deleteBroadcastItem(id) {
  const broadcasts = readJson(BROADCASTS_FILE, []);
  const before = broadcasts.length;
  const filtered = broadcasts.filter((item) => item.id !== id);
  writeJson(BROADCASTS_FILE, filtered);
  return before !== filtered.length;
}

function queueBroadcast(body) {
  const broadcasts = readJson(BROADCASTS_FILE, []);
  const entry = {
    id: crypto.randomUUID(),
    title: String(body.title || 'Annonce PipChi').trim(),
    message: String(body.message || '').trim(),
    createdAt: new Date().toISOString(),
    status: 'queued',
    deliveredTo: {},
    note: 'Chaque bot connecte enverra cette annonce a son proprietaire WhatsApp.'
  };
  broadcasts.unshift(entry);
  writeJson(BROADCASTS_FILE, broadcasts.slice(0, 50));
  for (const user of Object.values(getUsers())) {
    appendLog(user.userId, `Annonce recue: ${entry.title}\n${entry.message}`);
  }
  return entry;
}

function extractCommandsFromBot() {
  const currentModTime = fs.statSync(BOT_ENTRY).mtimeMs;
  
  // Si le fichier n'a pas changé, retourner le cache
  if (cachedCommands && lastBotFileModTime === currentModTime) {
    return cachedCommands;
  }
  
  // Extraire les commandes depuis le fichier
  const source = fs.readFileSync(BOT_ENTRY, 'utf8');
  const commands = new Map();
  const patterns = [
    /cleanText\s*===\s*["'](![^"']+)["']/g,
    /cleanText\.startsWith\(\s*["'](![^"']+)["']\s*\)/g,
    /text\.toLowerCase\(\)\.startsWith\(\s*["'](![^"']+)["']\s*\)/g
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(source))) {
      const command = match[1].trim();
      if (!command || command.includes('${')) continue;
      commands.set(command, {
        command,
        category: guessCommandCategory(command),
        text: describeCommand(command)
      });
    }
  }
  
  // Mettre à jour le cache
  cachedCommands = Array.from(commands.values()).sort((a, b) => a.command.localeCompare(b.command));
  lastBotFileModTime = currentModTime;
  
  return cachedCommands;
}

function guessCommandCategory(command) {
  if (/loup|kill|see|witch|life|death|vote/.test(command)) return 'Loup-Garou';
  if (/game|jeu|culture|devine|anime|manga|opening|seiyuu|battle|otaku|aouv|lastcry|debat/.test(command)) return 'Jeux';
  if (/warn|kick|ban|setup|welcome|antilink|ferme|ouvre|admins|tagall|reset/.test(command)) return 'Admin groupe';
  if (/sticker|play|qr|download|v\b/.test(command)) return 'Media';
  if (/msgcount|top|scores|profil|myid|groupstats/.test(command)) return 'Stats';
  return 'Utilitaires';
}

function describeCommand(command) {
  const descriptions = {
    '!play ': 'Recherche YouTube et envoie un audio.',
    '!sticker': 'Cree un sticker depuis un media.',
    '!help': 'Affiche l aide du bot.',
    '!tagall': 'Mentionne tous les membres.',
    '!setup': 'Configure le bot dans le groupe.',
    '!aouv': 'Action ou verite.',
    '!loup create': 'Cree une partie Loup-Garou.',
    '!loup join': 'Rejoint une partie Loup-Garou.',
    '!loup start': 'Demarre une partie Loup-Garou.'
  };
  return descriptions[command] || 'Commande detectee dans index.js.';
}

function touchUser(userId) {
  const users = getUsers();
  if (users[userId]) {
    users[userId].lastActive = new Date().toISOString();
    saveUsers(users);
  }
}

function runInactivitySweep() {
  const users = getUsers();
  const now = Date.now();
  const maxAge = INACTIVITY_DAYS * 24 * 60 * 60 * 1000;

  for (const user of Object.values(users)) {
    const lastActive = new Date(user.lastActive || user.createdAt || 0).getTime();
    if (Number.isFinite(lastActive) && now - lastActive > maxAge && user.botEnabled !== false) {
      user.botEnabled = false;
      user.isActive = false;
      user.lastNoticeAt = new Date().toISOString();
      stopBot(user.userId, 'Desactivation automatique apres inactivite.');
      appendLog(user.userId, 'Compte desactive pour inactivite. Notification WhatsApp a brancher quand le bot est connecte.');
    }
  }
  saveUsers(users);
}

function serveStatic(req, res) {
  const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
  const target = pathname === '/' ? 'index.html' : pathname.slice(1);
  const filePath = path.resolve(PUBLIC_DIR, target);

  if (!filePath.startsWith(PUBLIC_DIR) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8'
  };
  res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });
}

async function handleApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const body = req.method === 'POST' ? await readBody(req) : {};
  const userId = normalizeUserId(body.userId || url.searchParams.get('userId'));
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  // Rate limiting pour les routes sensibles
  if (url.pathname === '/api/register' || url.pathname === '/api/start' || url.pathname === '/api/start-pairing') {
    if (!checkRateLimit(clientIp, 10, 60000)) {
      return sendJson(res, 429, { ok: false, message: 'Trop de requêtes. Réessaie dans 1 minute.' });
    }
  }

  if (url.pathname === '/api/admin' || url.pathname === '/api/news' || url.pathname === '/api/news/delete' || url.pathname === '/api/broadcast' || url.pathname === '/api/broadcast/delete') {
    if (!checkRateLimit(`admin_${clientIp}`, 30, 60000)) {
      return sendJson(res, 429, { ok: false, message: 'Trop de requêtes admin. Réessaie dans 1 minute.' });
    }
  }

  if (url.pathname === '/api/register' && req.method === 'POST') {
    return sendJson(res, 200, { ok: true, user: ensureUser(body) });
  }
  if (url.pathname === '/api/commands' && req.method === 'GET') {
    return sendJson(res, 200, { ok: true, commands: extractCommandsFromBot() });
  }
  if (url.pathname === '/api/admin' && req.method === 'GET') {
    if (!requireAdmin(body, url)) return sendJson(res, 403, { ok: false, message: 'Cle admin invalide.' });
    return sendJson(res, 200, {
      ok: true,
      users: listUsersForAdmin(),
      stats: readJson(STATS_FILE, defaultStats()),
      news: readJson(NEWS_FILE, { current: [], history: [] }),
      broadcasts: readJson(BROADCASTS_FILE, []),
      adminKeyHint: ADMIN_KEY === 'PipChi-admin' ? 'Cle par defaut: PipChi-admin' : 'Cle definie par ADMIN_KEY'
    });
  }
  if (url.pathname === '/api/news' && req.method === 'POST') {
    if (!requireAdmin(body, url)) return sendJson(res, 403, { ok: false, message: 'Cle admin invalide.' });
    return sendJson(res, 200, { ok: true, item: saveNewsItem(body) });
  }
  if (url.pathname === '/api/news/delete' && req.method === 'POST') {
    if (!requireAdmin(body, url)) return sendJson(res, 403, { ok: false, message: 'Cle admin invalide.' });
    return sendJson(res, 200, { ok: true, deleted: deleteNewsItem(body.id) });
  }
  if (url.pathname === '/api/broadcast' && req.method === 'POST') {
    if (!requireAdmin(body, url)) return sendJson(res, 403, { ok: false, message: 'Cle admin invalide.' });
    return sendJson(res, 200, { ok: true, broadcast: queueBroadcast(body) });
  }
  if (url.pathname === '/api/broadcast/delete' && req.method === 'POST') {
    if (!requireAdmin(body, url)) return sendJson(res, 403, { ok: false, message: 'Cle admin invalide.' });
    return sendJson(res, 200, { ok: true, deleted: deleteBroadcastItem(body.id) });
  }
  if (!userId) return sendJson(res, 400, { ok: false, message: 'userId manquant.' });

  if (url.pathname === '/api/status') {
    touchUser(userId);
    return sendJson(res, 200, { ok: true, state: getConnectionState(userId), ...statusFor(userId) });
  }
  if (url.pathname === '/api/start' && req.method === 'POST') {
    return sendJson(res, 200, startBot(userId));
  }
  if (url.pathname === '/api/start-pairing' && req.method === 'POST') {
    return sendJson(res, 200, startBotWithPairing(userId));
  }
  if (url.pathname === '/api/stop' && req.method === 'POST') {
    return sendJson(res, 200, stopBot(userId));
  }
  if (url.pathname === '/api/restart' && req.method === 'POST') {
    stopBot(userId, 'Redemarrage demande depuis le dashboard.');
    return sendJson(res, 200, startBot(userId));
  }
  if (url.pathname === '/api/toggle' && req.method === 'POST') {
    const users = getUsers();
    const user = ensureUser({ userId });
    users[userId] = { ...user, botEnabled: Boolean(body.enabled), lastActive: new Date().toISOString() };
    if (!body.enabled) stopBot(userId, 'Bot desactive par utilisateur.');
    saveUsers(users);
    return sendJson(res, 200, { ok: true, user: users[userId] });
  }
  if (url.pathname === '/api/delete-session' && req.method === 'POST') {
    return sendJson(res, 200, resetSession(userId));
  }
  if (url.pathname === '/api/admin/user-action' && req.method === 'POST') {
    if (!requireAdmin(body, url)) return sendJson(res, 403, { ok: false, message: 'Cle admin invalide.' });
    if (body.action === 'start') return sendJson(res, 200, startBot(userId));
    if (body.action === 'stop') return sendJson(res, 200, stopBot(userId, 'Arret demande depuis admin.'));
    if (body.action === 'restart') {
      stopBot(userId, 'Redemarrage demande depuis admin.');
      return sendJson(res, 200, startBot(userId));
    }
    if (body.action === 'reset') return sendJson(res, 200, resetSession(userId));
    if (body.action === 'delete') {
      stopBot(userId, 'Suppression utilisateur demandee par admin.');
      const users = getUsers();
      delete users[userId];
      saveUsers(users);
      
      // Supprimer le dossier utilisateur
      const userDirPath = userDir(userId);
      try {
        if (fs.existsSync(userDirPath)) {
          fs.rmSync(userDirPath, { recursive: true, force: true });
        }
      } catch (error) {
        console.error('Erreur suppression dossier utilisateur:', error.message);
      }
      
      return sendJson(res, 200, { ok: true, message: 'Utilisateur supprime definitivement.' });
    }
    return sendJson(res, 400, { ok: false, message: 'Action admin inconnue.' });
  }
  if (url.pathname === '/api/logs') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });
    res.write('\n');
    const clients = logClients.get(userId) || new Set();
    clients.add(res);
    logClients.set(userId, clients);
    for (const line of logBuffers.get(userId) || []) res.write(`data: ${JSON.stringify(line)}\n\n`);
    req.on('close', () => clients.delete(res));
    return;
  }

  return sendJson(res, 404, { ok: false, message: 'Route inconnue.' });
}

ensureBase();
setInterval(runInactivitySweep, 60 * 60 * 1000).unref();
runInactivitySweep();

http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) {
    handleApi(req, res).catch((error) => sendJson(res, error.statusCode || 500, { ok: false, message: error.message }));
  } else {
    serveStatic(req, res);
  }
}).listen(PORT, () => {
  console.log(`Dashboard PipChi pret: http://localhost:${PORT}`);
  console.log(`ADMIN_KEY: ${ADMIN_KEY}`);
  console.log('NOTE: Sauvegarde cette clé pour accéder à la page admin.');
});
