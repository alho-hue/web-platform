const { default: makeWASocket, fetchLatestBaileysVersion, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const qrcode = require("qrcode-terminal")
const fs = require("fs")

const GROUPS_FILE = "./auth/groups.json"

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

// Fonctions utilitaires pour les calculs de compatibilité
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

async function startBot() {

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

        if (jid.endsWith("@g.us")) {
            const groups = loadGroups()
            if (!groups.includes(jid)) {
                groups.push(jid)
                saveGroups(groups)
            }
        }

        const message = msg.message

        let text =
            message.conversation ||
            message.extendedTextMessage?.text ||
            message.imageMessage?.caption ||
            message.videoMessage?.caption ||
            ""

        text = text.trim()

        if (!text) return

        // ====================
        // COMMANDES
        // ====================

        if (text === "!tagall") {
            if (!jid.endsWith("@g.us")) return

            try {
                const metadata = await sock.groupMetadata(jid)
                const participants = metadata.participants
                const mentions = participants.map(p => p.id)

                let textMessage = "╭─────〔 TAG ALL 〕─────⬣\n"
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

            const message = `╭───〔  💘 CALCUL D'AMOUR 〕───⬣
│◦❒ @${user1}  @${user2}
│◦❒ Compatibilité: ${compatibility}%
│◦❒ ${emoji} ${description}
│◦❒ 
│◦❒ ${getCompatibilityMessage(compatibility)}
╰════════════════════════⬣`

            await sock.sendMessage(jid, {
                text: message,
                mentions: mentionedJids
            }, { quoted: msg })
        }

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

            const message = `╭───〔  💝 POTENTIEL D'AMOUR 〕───⬣
│◦❒ @${user}
│◦❒ Potentiel d'amour: ${lovePotential}%
│◦❒ ${loveLevel.emoji} ${loveLevel.message}
│◦❒ 
│◦❒ ${loveLevel.description}
╰════════════════════════⬣`

            await sock.sendMessage(jid, {
                text: message,
                mentions: mentionedJids
            }, { quoted: msg })
        }

        if (text === "!help") {
            const helpMessage = `╭───〔  📚 COMMANDES DU BOT 〕───⬣
│◦❒ !tagall - Tag tous les membres du groupe
│◦❒ !ship @user1 @user2 - Calcule la compatibilité amoureuse
│◦❒ !love @user - Calcule le potentiel d'amour
│◦❒ !help - Affiche ce menu
╰════════════════════════⬣`

            await sock.sendMessage(jid, { text: helpMessage }, { quoted: msg })
        }

    })
}

startBot()