const { default: makeWASocket, fetchLatestBaileysVersion, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const qrcode = require("qrcode-terminal")
const fs = require("fs")

// ====================
// FICHIERS DE CONFIG
// ====================
const GROUPS_FILE = "./auth/groups.json"
const CONFIG_FILE = "./auth/config.json"
const WARNS_FILE = "./auth/warns.json"

// ====================
// STRUCTURES DE DONNÉES
// ====================
const activeGames = new Map() // Jeux en cours
const userScores = new Map() // Scores des utilisateurs
let warns = {} // Stockage des avertissements
let config = {} // Configuration des groupes

// Charger les configurations
function loadConfig() {
    try {
        config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"))
    } catch {
        config = {}
    }
}

function saveConfig() {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
}

function loadWarns() {
    try {
        warns = JSON.parse(fs.readFileSync(WARNS_FILE, "utf-8"))
    } catch {
        warns = {}
    }
}

function saveWarns() {
    fs.writeFileSync(WARNS_FILE, JSON.stringify(warns, null, 2))
}

function loadGroups() {
    try {
        return JSON.parse(fs.readFileSync(GROUPS_FILE, "utf-8"))
    } catch {
        return []
    }
}

function saveGroups(list) {
    fs.writeFileSync(GROUPS_FILE, JSON.stringify([...new Set(list)]))
}

// ====================
// BASE DE DONNÉES DES JEUX
// ====================
const countries = [
    { name: "France", capitale: "Paris", indice: "🇫🇷 Pays du fromage et de la baguette" },
    { name: "Italie", capitale: "Rome", indice: "🇮🇹 La pizza et les pâtes" },
    { name: "Espagne", capitale: "Madrid", indice: "🇪🇸 La paella et le flamenco" },
    { name: "Japon", capitale: "Tokyo", indice: "🇯🇵 Pays du soleil levant" },
    { name: "Brésil", capitale: "Brasilia", indice: "🇧🇷 Le pays du football et du carnaval" },
    { name: "Canada", capitale: "Ottawa", indice: "🍁 La feuille d'érable" },
    { name: "Maroc", capitale: "Rabat", indice: "🇲🇦 Le pays du couscous" },
    { name: "Egypte", capitale: "Le Caire", indice: "🇪🇬 Terre des pyramides" },
    { name: "Australie", capitale: "Canberra", indice: "🇦🇺 Les kangourous et koalas" },
    { name: "Mexique", capitale: "Mexico", indice: "🇲🇽 Les tacos et mariachis" }
]

const ballResponses = [
    "🎱 Oui, absolument !",
    "🎱 Non, jamais !",
    "🎱 Peut-être...",
    "🎱 C'est certain !",
    "🎱 Pas question !",
    "🎱 Les signes disent oui !",
    "🎱 Demande plus tard...",
    "🎱 Mieux vaut ne pas savoir",
    "🎱 Compte là-dessus !",
    "🎱 Très douteux..."
]

const bannedLinks = [
    'bit.ly', 'tinyurl.com', 't.me', 'chat.whatsapp.com',
    'youtu.be', 'instagram.com', 'facebook.com', 'tiktok.com'
]

// ====================
// FONCTIONS UTILITAIRES
// ====================
function getRandomCountry() {
    return countries[Math.floor(Math.random() * countries.length)]
}

function generateLetterHint(country) {
    const letters = country.name.split('')
    const hint = letters.map((l, i) => i === 0 ? l : '_').join(' ')
    return `Première lettre : ${hint} (${letters.length} lettres)`
}

async function isAdmin(sock, jid, userId) {
    try {
        const metadata = await sock.groupMetadata(jid)
        const participant = metadata.participants.find(p => p.id === userId)
        return participant?.admin === 'admin' || participant?.admin === 'superadmin'
    } catch {
        return false
    }
}

function addWarn(userId, groupId, reason) {
    const key = `${userId}_${groupId}`
    if (!warns[key]) warns[key] = []
    warns[key].push({ reason, date: new Date().toISOString() })
    saveWarns()
    return warns[key].length
}

function getWarnCount(userId, groupId) {
    const key = `${userId}_${groupId}`
    return warns[key]?.length || 0
}

// ====================
// FONCTIONS LOVE (existantes)
// ====================
function getCompatibilityMessage(compatibility) {
    const messages = {
        95: "Le destin vous a réunis ! C'est écrit dans les étoiles ❤️",
        85: "Une étincelle magique flotte entre vous ✨",
        75: "Les planètes s'alignent pour votre amour 🌟",
        65: "Une belle histoire d'amour possible 💕",
        55: "Avec un peu d'effort, ça pourrait marcher 💪",
        45: "L'amour est mystérieux, qui sait ? 🤔",
        35: "Peut-être que l'amitié est plus adaptée 👫",
        25: "Les chemins de l'amour sont compliqués 🌪️",
        15: "L'univers dit... peut-être pas 🌍",
        5: "Même pas dans une autre dimension 🌌"
    }

    const keys = Object.keys(messages).map(Number).sort((a, b) => b - a)
    for (const key of keys) {
        if (compatibility >= key) return messages[key]
    }
    return messages[5]
}

function getLoveLevel(potential) {
    const levels = {
        90: { emoji: "🌟", message: "Amour divin !", description: "Tu es un être d'amour pur !" },
        80: { emoji: "💫", message: "Cœur d'or !", description: "Ton potentiel d'amour est immense !" },
        70: { emoji: "💝", message: "Romantique !", description: "L'amour est ta seconde nature !" },
        60: { emoji: "💖", message: "Passionné !", description: "Tu as beaucoup d'amour à donner !" },
        50: { emoji: "💗", message: "Équilibré !", description: "Tu trouves le bon équilibre en amour !" },
        40: { emoji: "💓", message: "Gentil !", description: "Tu as un beau cœur !" },
        30: { emoji: "💔", message: "Timide !", description: "L'amour te rend parfois timide !" },
        20: { emoji: "🛡️", message: "Prudent !", description: "Tu protèges ton cœur avec soin !" },
        10: { emoji: "😨", message: "Méfiant !", description: "L'amour te fait peur, mais ça va changer !" }
    }

    const keys = Object.keys(levels).map(Number).sort((a, b) => b - a)
    for (const key of keys) {
        if (potential >= key) return levels[key]
    }
    return levels[10]
}

// ====================
// FONCTIONS DE TÉLÉCHARGEMENT (simulées)
// ====================
async function downloadMedia(url) {
    // Simulation - à remplacer par de vraies APIs
    return { 
        status: "success", 
        type: "video",
        url: "https://example.com/video.mp4" 
    }
}

// ====================
// START BOT
// ====================
async function startBot() {
    // Charger les configurations
    loadConfig()
    loadWarns()

    const { state, saveCreds } = await useMultiFileAuthState("./auth")
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false
    })

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", (update) => {
        const { connection, qr, lastDisconnect } = update

        if (qr) {
            console.clear()
            console.log("📲 Scanne ce QR code avec WhatsApp :\n")
            qrcode.generate(qr, { small: true })
        }

        if (connection === "open") {
            console.log("✅ Bot connecté avec succès !")
        }

        if (connection === "close") {
            const code = lastDisconnect?.error?.output?.statusCode
            console.log("❌ Connexion fermée. Code :", code)

            if (code !== 401) {
                startBot()
            }
        }
    })

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message) return

        const jid = msg.key.remoteJid
        if (!jid) return

        // Sauvegarder les groupes
        if (jid.endsWith("@g.us")) {
            const groups = loadGroups()
            if (!groups.includes(jid)) {
                groups.push(jid)
                saveGroups(groups)
            }
        }

        const message = msg.message
        let text = message.conversation ||
            message.extendedTextMessage?.text ||
            message.imageMessage?.caption ||
            message.videoMessage?.caption ||
            ""

        text = text.trim()
        if (!text) return

        // ====================
        // ANTI-LINK SYSTEM
        // ====================
        if (jid.endsWith("@g.us") && config[jid]?.antilink && !msg.key.fromMe) {
            const hasLink = bannedLinks.some(link => text.toLowerCase().includes(link)) ||
                /(https?:\/\/[^\s]+)/g.test(text)

            if (hasLink) {
                await sock.sendMessage(jid, { delete: msg.key })
                await sock.sendMessage(jid, {
                    text: `🚫 @${msg.key.participant.split('@')[0]} pas de liens ici !`,
                    mentions: [msg.key.participant]
                })
                return
            }
        }

        // ====================
        // COMMANDES PRINCIPALES
        // ====================

        // TAG ALL
        if (text === "!tagall") {
            if (!jid.endsWith("@g.us")) return

            try {
                const metadata = await sock.groupMetadata(jid)
                const participants = metadata.participants
                const mentions = participants.map(p => p.id)

                let textMessage = "╭─────〔 📢 TAG ALL 〕─────⬣\n"
                mentions.forEach(id => {
                    textMessage += `│◦❒ 👤 @${id.split("@")[0]}\n`
                })
                textMessage += "╰══════════════════════⬣"

                await sock.sendMessage(jid, {
                    text: textMessage,
                    mentions: mentions
                }, { quoted: msg })

            } catch (err) {
                console.log(err)
            }
        }

        // SHIP
        if (text.startsWith("!ship ")) {
            const mentionedJids = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || []

            if (mentionedJids.length < 2) {
                await sock.sendMessage(jid, {
                    text: "❌ Usage: !ship @user1 @user2\nTagguez deux personnes pour calculer leur compatibilité !"
                }, { quoted: msg })
                return
            }

            const user1 = mentionedJids[0].split("@")[0]
            const user2 = mentionedJids[1].split("@")[0]

            const seed = user1.length + user2.length + new Date().getDay()
            const compatibility = Math.floor((Math.sin(seed) + 1) * 50)

            let emoji = ""
            let description = ""

            if (compatibility >= 90) {
                emoji = "🔥"
                description = "ÂMES SŒURS ! Un amour éternel !"
            } else if (compatibility >= 75) {
                emoji = "💕"
                description = "Très grande compatibilité !"
            } else if (compatibility >= 60) {
                emoji = "💑"
                description = "Bonne compatibilité !"
            } else if (compatibility >= 40) {
                emoji = "🤝"
                description = "Compatibilité moyenne..."
            } else if (compatibility >= 25) {
                emoji = "😕"
                description = "Faible compatibilité..."
            } else {
                emoji = "💔"
                description = "Très faible compatibilité !"
            }

            const shipMessage = `╭───〔  💘 CALCUL D'AMOUR 〕───⬣
│◦❒ @${user1}  @${user2}
│◦❒ Compatibilité: ${compatibility}%
│◦❒ ${emoji} ${description}
│◦❒ 
│◦❒ ${getCompatibilityMessage(compatibility)}
╰════════════════════════⬣`

            await sock.sendMessage(jid, {
                text: shipMessage,
                mentions: mentionedJids
            }, { quoted: msg })
        }

        // LOVE
        if (text.startsWith("!love ")) {
            const mentionedJids = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || []

            if (mentionedJids.length < 1) {
                await sock.sendMessage(jid, {
                    text: "❌ Usage: !love @user\nTagguez une personne pour calculer son potentiel d'amour !"
                }, { quoted: msg })
                return
            }

            const user = mentionedJids[0].split("@")[0]

            const factors = [
                user.length * 3,
                user.charCodeAt(0) || 0,
                new Date().getHours(),
                Math.floor(Math.random() * 20)
            ]

            const lovePotential = Math.min(99, Math.floor(factors.reduce((a, b) => a + b, 0) % 100))

            const loveLevel = getLoveLevel(lovePotential)

            const loveMessage = `╭───〔  💝 POTENTIEL D'AMOUR 〕───⬣
│◦❒ @${user}
│◦❒ Potentiel d'amour: ${lovePotential}%
│◦❒ ${loveLevel.emoji} ${loveLevel.message}
│◦❒ 
│◦❒ ${loveLevel.description}
╰════════════════════════⬣`

            await sock.sendMessage(jid, {
                text: loveMessage,
                mentions: mentionedJids
            }, { quoted: msg })
        }

        // ====================
        // COMMANDES DE JEUX
        // ====================

        // GAME COUNTRY
        if (text === "!game country") {
            if (!jid.endsWith("@g.us")) {
                await sock.sendMessage(jid, { text: "❌ Cette commande est disponible uniquement dans les groupes !" })
                return
            }

            if (activeGames.has(jid)) {
                await sock.sendMessage(jid, { text: "🎮 Un jeu est déjà en cours dans ce groupe !" }, { quoted: msg })
                return
            }

            const country = getRandomCountry()
            const hint = generateLetterHint(country.name)

            activeGames.set(jid, {
                type: 'country',
                answer: country.name.toLowerCase(),
                data: country,
                startTime: Date.now(),
                timeout: setTimeout(() => {
                    activeGames.delete(jid)
                    sock.sendMessage(jid, { 
                        text: `⏰ Temps écoulé ! Le pays était : ${country.name} (${country.capitale})` 
                    })
                }, 60000)
            })

            const gameMsg = `╭───〔  🎮 DEVINE LE PAYS 〕───⬣
│◦❒ ${country.indice}
│◦❒ 
│◦❒ ${hint}
│◦❒ 
│◦❒ ⏱️ Tu as 60 secondes !
│◦❒ Premier à répondre gagne 10 points !
╰════════════════════════⬣`

            await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
        }

        // Vérifier les réponses du jeu
        if (activeGames.has(jid) && !text.startsWith('!')) {
            const game = activeGames.get(jid)
            const sender = msg.key.participant || msg.key.remoteJid

            if (game.type === 'country' && text.toLowerCase() === game.answer) {
                clearTimeout(game.timeout)
                activeGames.delete(jid)

                const score = userScores.get(sender) || 0
                userScores.set(sender, score + 10)

                const winMsg = `╭───〔  🏆 GAGNANT 〕───⬣
│◦❒ 👑 @${sender.split('@')[0]}
│◦❒ 
│◦❒ Bravo ! Tu as trouvé : ${game.data.name}
│◦❒ Capitale : ${game.data.capitale}
│◦❒ 
│◦❒ +10 points 🎉
╰════════════════════════⬣`

                await sock.sendMessage(jid, {
                    text: winMsg,
                    mentions: [sender]
                }, { quoted: msg })
            }
        }

        // ROLL
        if (text === "!roll") {
            const roll = Math.floor(Math.random() * 100) + 1
            await sock.sendMessage(jid, {
                text: `╭───〔  🎲 JET DE DÉ 〕───⬣
│◦❒ Résultat : **${roll}**
╰════════════════════════⬣`
            }, { quoted: msg })
        }

        // 8BALL
        if (text.startsWith("!8ball ")) {
            const question = text.slice(6).trim()
            if (!question) {
                await sock.sendMessage(jid, {
                    text: "❌ Usage: !8ball [ta question]"
                }, { quoted: msg })
                return
            }

            const response = ballResponses[Math.floor(Math.random() * ballResponses.length)]
            const ballMsg = `╭───〔  🎱 MAGIC 8 BALL 〕───⬣
│◦❒ Question : ${question}
│◦❒ 
│◦❒ ${response}
╰════════════════════════⬣`

            await sock.sendMessage(jid, { text: ballMsg }, { quoted: msg })
        }

        // SCORES
        if (text === "!scores") {
            let scoreMsg = "╭───〔  📊 CLASSEMENT 〕───⬣\n"
            const sortedScores = [...userScores.entries()]
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)

            if (sortedScores.length === 0) {
                scoreMsg += "│◦❒ Aucun score pour le moment\n"
            } else {
                sortedScores.forEach(([user, score], index) => {
                    const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🎯"
                    scoreMsg += `│◦❒ ${medal} @${user.split('@')[0]} : ${score} pts\n`
                })
            }
            scoreMsg += "╰════════════════════════⬣"

            await sock.sendMessage(jid, {
                text: scoreMsg,
                mentions: sortedScores.map(s => s[0])
            }, { quoted: msg })
        }

        // ====================
        // COMMANDES DE MODÉRATION
        // ====================

        // ANTI-LINK
        if (text === "!antilink on") {
            if (!jid.endsWith("@g.us")) return
            if (!await isAdmin(sock, jid, msg.key.participant)) {
                await sock.sendMessage(jid, { text: "❌ Seuls les admins peuvent activer l'antilink !" }, { quoted: msg })
                return
            }

            if (!config[jid]) config[jid] = {}
            config[jid].antilink = true
            saveConfig()

            await sock.sendMessage(jid, {
                text: "✅ **ANTI-LINK ACTIVÉ**\nLes liens seront supprimés automatiquement !"
            }, { quoted: msg })
        }

        if (text === "!antilink off") {
            if (!jid.endsWith("@g.us")) return
            if (!await isAdmin(sock, jid, msg.key.participant)) return

            if (config[jid]) config[jid].antilink = false
            saveConfig()

            await sock.sendMessage(jid, { text: "✅ Antilink désactivé !" }, { quoted: msg })
        }

        // WARN
        if (text.startsWith("!warn ")) {
            if (!jid.endsWith("@g.us")) return
            if (!await isAdmin(sock, jid, msg.key.participant)) {
                await sock.sendMessage(jid, { text: "❌ Seuls les admins peuvent warn !" }, { quoted: msg })
                return
            }

            const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
            const reason = text.slice(6).replace(/@\S+/g, '').trim() || "Non spécifiée"

            if (!mentioned) {
                await sock.sendMessage(jid, { text: "❌ Usage: !warn @user [raison]" }, { quoted: msg })
                return
            }

            const warnCount = addWarn(mentioned, jid, reason)

            const warnMsg = `╭───〔  ⚠️ AVERTISSEMENT 〕───⬣
│◦❒ @${mentioned.split('@')[0]}
│◦❒ Raison : ${reason}
│◦❒ Total warns : ${warnCount}/3
│◦❒ 
│◦❒ ${warnCount >= 3 ? "🚫 Banni automatiquement !" : "Fais attention !"}
╰════════════════════════⬣`

            await sock.sendMessage(jid, {
                text: warnMsg,
                mentions: [mentioned]
            }, { quoted: msg })

            if (warnCount >= 3) {
                await sock.groupParticipantsUpdate(jid, [mentioned], "remove")
                const key = `${mentioned}_${jid}`
                delete warns[key]
                saveWarns()
            }
        }

        // KICK
        if (text.startsWith("!kick ")) {
            if (!jid.endsWith("@g.us")) return
            if (!await isAdmin(sock, jid, msg.key.participant)) {
                await sock.sendMessage(jid, { text: "❌ Seuls les admins peuvent kick !" }, { quoted: msg })
                return
            }

            const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid

            if (!mentioned || mentioned.length === 0) {
                await sock.sendMessage(jid, { text: "❌ Usage: !kick @user" }, { quoted: msg })
                return
            }

            await sock.groupParticipantsUpdate(jid, mentioned, "remove")

            await sock.sendMessage(jid, {
                text: `👋 @${mentioned[0].split('@')[0]} a été expulsé !`,
                mentions: mentioned
            }, { quoted: msg })
        }

        // ADMINS
        if (text === "!admins") {
            if (!jid.endsWith("@g.us")) return

            const metadata = await sock.groupMetadata(jid)
            const admins = metadata.participants
                .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
                .map(p => p.id)

            let adminMsg = "╭───〔  👑 ADMINISTRATEURS 〕───⬣\n"
            admins.forEach((admin, i) => {
                adminMsg += `│◦❒ 👤 @${admin.split('@')[0]}\n`
            })
            adminMsg += "╰════════════════════════⬣"

            await sock.sendMessage(jid, {
                text: adminMsg,
                mentions: admins
            }, { quoted: msg })
        }

        // ====================
        // COMMANDES DE CONFIGURATION
        // ====================

        // WELCOME
        if (text === "!welcome on") {
            if (!jid.endsWith("@g.us")) return
            if (!await isAdmin(sock, jid, msg.key.participant)) return

            if (!config[jid]) config[jid] = {}
            config[jid].welcome = true
            saveConfig()

            await sock.sendMessage(jid, { text: "✅ Messages de bienvenue activés !" }, { quoted: msg })
        }

        if (text === "!welcome off") {
            if (!jid.endsWith("@g.us")) return
            if (!await isAdmin(sock, jid, msg.key.participant)) return

            if (config[jid]) config[jid].welcome = false
            saveConfig()

            await sock.sendMessage(jid, { text: "✅ Messages de bienvenue désactivés !" }, { quoted: msg })
        }

        // ====================
        // COMMANDES DE TÉLÉCHARGEMENT
        // ====================

        if (text.startsWith("!download ")) {
            const url = text.slice(9).trim()

            if (!url) {
                await sock.sendMessage(jid, {
                    text: "❌ Usage: !download [URL YouTube/TikTok/Instagram]"
                }, { quoted: msg })
                return
            }

            await sock.sendMessage(jid, { text: "⏬ Téléchargement en cours..." }, { quoted: msg })

            try {
                const result = await downloadMedia(url)
                if (result?.status === 'success') {
                    await sock.sendMessage(jid, {
                        video: { url: result.url },
                        caption: "✅ Téléchargé avec succès !"
                    })
                } else {
                    await sock.sendMessage(jid, { text: "❌ Échec du téléchargement" })
                }
            } catch (error) {
                await sock.sendMessage(jid, {
                    text: "❌ Erreur lors du téléchargement"
                }, { quoted: msg })
            }
        }

        // ====================
        // HELP
        // ====================
        if (text === "!help") {
            const helpMessage = `╭───〔  📚 COMMANDES 〕───⬣
│
│  🎮 **JEUX**
│  !game country - Devine le pays
│  !roll - Lance un dé (1-100)
│  !8ball [question] - Magic 8 ball
│  !scores - Voir le classement
│
│  💘 **LOVE**
│  !ship @u1 @u2 - Compatibilité
│  !love @user - Potentiel d'amour
│
│  🛡️ **MODÉRATION** (admins)
│  !antilink on/off - Anti-liens
│  !warn @user [raison] - Avertir
│  !kick @user - Expulser
│  !admins - Liste des admins
│
│  ⚙️ **CONFIG** (admins)
│  !welcome on/off - Msg de bienvenue
│
│  📥 **TÉLÉCHARGEMENT**
│  !download [url] - DL vidéo
│
│  ℹ️ **AUTRES**
│  !tagall - Mentionner tout le monde
│  !help - Afficher ce menu
│
╰════════════════════════⬣`

            await sock.sendMessage(jid, { text: helpMessage }, { quoted: msg })
        }
    })

    // ====================
    // GROUPE PARTICIPANTS UPDATE (welcome)
    // ====================
    sock.ev.on("group-participants.update", async ({ id, participants, action }) => {
        if (action === 'add' && config[id]?.welcome) {
            for (const participant of participants) {
                const name = participant.split('@')[0]
                const welcomeMsg = `╭───〔  👋 BIENVENUE 〕───⬣
│◦❒ @${name}
│◦❒ 
│◦❒ Sois le/la bienvenu(e) dans le groupe !
│◦❒ Lis les règles et amuse-toi bien 🎉
│◦❒ 
│◦❒ Tape !help pour voir les commandes
╰════════════════════════⬣`

                await sock.sendMessage(id, {
                    text: welcomeMsg,
                    mentions: [participant]
                })
            }
        }
    })
}

// Démarrer le bot
startBot()