const { default: makeWASocket, fetchLatestBaileysVersion, useMultiFileAuthState, DisconnectReason, downloadContentFromMessage } = require("baileys");
const qrcode = require("qrcode-terminal");
const QRCode = require('qrcode');
const fs = require('fs')
const path = require('path')
const os = require('os')
const ffmpeg = require('ffmpeg-static')
const { spawn } = require('child_process')
const ytSearch = require('yt-search')
const sharp = require("sharp");
const play = require('play-dl');
// ====================
// SYSTÈME DE BATTLE OTAKU 1v1
// ====================
const OTAKU_ORGANISATIONS_FILE = "./auth/otaku_organisations.json"
const OTAKU_BATTLES_FILE = "./auth/otaku_battles.json"
let otakuOrganisations = {}
let otakuBattles = {}
let activeBattles = new Map()
// Organisations prédéfinies
const DEFAULT_ORGANISATIONS = [
    { name: "Les Gardiens de l'Anime", emoji: "🛡️", color: "#FF6B6B", description: "Protecteurs des mondes animés" },
    { name: "Les Protecteurs du Manga", emoji: "📚", color: "#4ECDC4", description: "Gardiens des bandes dessinées" },
    { name: "Les Maîtres des Personnages", emoji: "🎭", color: "#45B7D1", description: "Experts des héros et méchants" },
    { name: "Les Seigneurs des Openings", emoji: "🎵", color: "#96CEB4", description: "Maîtres des musiques d'anime" },
    { name: "Les Légendes des Seiyuu", emoji: "🎤", color: "#FFEAA7", description: "Connaisseurs des voix japonaises" }
]
// Questions OTAKU expertes
const otakuExpertQuestions = [
    // Niveau EXPERT - Anime
    {
        question: "Quel anime a été créé par un studio qui n'existe plus aujourd'hui et a révolutionné l'animation 3D ?",
        answer: "sword art online",
        alternatives: ["sword art online", "sao", "sword art online alicization"]
    },
    {
        question: "Dans quel anime le personnage principal change de genre 7 fois au cours de l'histoire ?",
        answer: "ranma 1/2",
        alternatives: ["ranma 1/2", "ranma"]
    },
    {
        question: "Quel anime contient plus de 1000 références à d'autres œuvres dans une seule saison ?",
        answer: "gintama",
        alternatives: ["gintama"]
    },
    {
        question: "Quel anime a été interdit dans 3 pays pour son contenu philosophique trop complexe ?",
        answer: "serial experiments lain",
        alternatives: ["serial experiments lain", "lain"]
    },
    {
        question: "Quel studio d'animation a failli faire faillite 3 fois avant de créer un phénomène mondial ?",
        answer: "studio ghibli",
        alternatives: ["studio ghibli", "ghibli"]
    },
    // Niveau EXPERT - Manga
    {
        question: "Quel manga a la plus longue publication continue avec plus de 50 ans d'existence ?",
        answer: "kochi kame",
        alternatives: ["kochi kame"]
    },
    {
        question: "Quel mangaka dessine avec sa bouche car il a perdu l'usage de ses mains ?",
        answer: "osamu tezuka",
        alternatives: ["osamu tezuka", "tezuka"]
    },
    {
        question: "Quel manga contient plus de 20000 planches détaillées dans un seul volume ?",
        answer: "berserk",
        alternatives: ["berserk"]
    },
    {
        question: "Quel manga a été créé par un ancien chirurgien devenu mangaka ?",
        answer: "black jack",
        alternatives: ["black jack"]
    },
    {
        question: "Quel manga se déroule sur plus de 1000 ans en temps réel dans l'histoire ?",
        answer: "vinland saga",
        alternatives: ["vinland saga"]
    },
    // Niveau EXPERT - Personnages
    {
        question: "Quel personnage a changé de seiyuu 4 fois dans la même série ?",
        answer: "son goku",
        alternatives: ["goku", "son goku", "songoku"]
    },
    {
        question: "Quel personnage d'anime a un IQ de 200 et est capable de calculer 1000 scénarios en 1 seconde ?",
        answer: "shikamaru nara",
        alternatives: ["shikamaru", "shikamaru nara"]
    },
    {
        question: "Quel personnage a le plus grand nombre de morts et résurrections (plus de 10 fois) ?",
        answer: "guts",
        alternatives: ["guts"]
    },
    {
        question: "Quel personnage parle 7 langues différentes dans son anime ?",
        answer: "c2",
        alternatives: ["c2", "code geass c2"]
    },
    {
        question: "Quel personnage a le plus grand nombre de transformations (plus de 15 formes) ?",
        answer: "son goku",
        alternatives: ["goku", "son goku", "songoku"]
    },
    // Niveau EXPERT - Seiyuu
    {
        question: "Quel seiyuu a doublé plus de 500 personnages différents dans sa carrière ?",
        answer: "kappei yamaguchi",
        alternatives: ["kappei yamaguchi", "yamaguchi"]
    },
    {
        question: "Quel seiyuu est également un chanteur d'opéra professionnel ?",
        answer: "mamoru miyano",
        alternatives: ["mamoru miyano", "miyano"]
    },
    {
        question: "Quel seiyuu a commencé sa carrière à seulement 8 ans ?",
        answer: "romi park",
        alternatives: ["romi park", "park"]
    },
    {
        question: "Quel seiyuu parle couramment 5 langues dont l'anglais, le japonais et le français ?",
        answer: "yuki kaji",
        alternatives: ["yuki kaji", "kaji"]
    },
    {
        question: "Quel seiyuu a refusé un rôle hollywoodien majeur pour rester dans le doublage japonais ?",
        answer: "mayumi tanaka",
        alternatives: ["mayumi tanaka", "tanaka"]
    },
    // Niveau EXPERT - Openings
    {
        question: "Quel opening a été classé #1 au Billboard Japon pendant 6 semaines consécutives ?",
        answer: "gurenge",
        alternatives: ["gurenge", "demon slayer opening", "liSA"]
    },
    {
        question: "Quel opening contient des paroles en 5 langues différentes ?",
        answer: "colors",
        alternatives: ["colors", "code geass opening"]
    },
    {
        question: "Quel opening a été composé par un lauréat du Grammy Award ?",
        answer: "unravel",
        alternatives: ["unravel", "tokyo ghoul opening", "tk"]
    },
    {
        question: "Quel opening contient un message secret en morse code ?",
        answer: "hikari e",
        alternatives: ["hikari e", "hunter x hunter opening"]
    },
    {
        question: "Quel opening a été chanté par un groupe qui n'existe plus depuis 10 ans ?",
        answer: "again",
        alternatives: ["again", "fullmetal alchemist opening", "yui"]
    }
]
// Fonction pour normaliser les accents (pour les jeux Otaku)
function normalizeAccents(str) {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9\-']/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}
// ====================
// SYSTÈME DE PACKS DE STICKERS
// ====================
const STICKER_PACKS_FILE = "./auth/sticker_packs.json"
let stickerPacks = {}
let stickerCounter = 0
// Noms de packs stylés
const stylishPackNames = [
    "✨ 𝔽𝕒𝕟𝕥𝕠𝕞 𝕊𝕥𝕚𝕔𝕜𝕖𝕣𝕤",
    "🎭 𝔸𝕖𝕤𝕥𝕙𝕖𝕥𝕚𝕔 𝕍𝕚𝕓𝕖𝕤",
    "🌟 𝕄𝕚𝕝𝕝𝕖𝕟𝕟𝕚𝕒𝕝 ℂ𝕣𝕒𝕗𝕥",
    "💎 𝔻𝕚𝕒𝕞𝕠𝕟𝕕 ℂ𝕠𝕝𝕝𝕖𝕔𝕥𝕚𝕠𝕟",
    "🔥 𝔽𝕚𝕣𝕖 𝔸𝕖𝕤𝕥𝕙𝕖𝕥𝕚𝕔𝕤",
    "🌙 𝕂𝕒𝕨𝕒𝕚𝕚 ℂ𝕙𝕚𝕓𝕚 𝔾𝕒𝕣𝕕𝕖𝕟",
    "⚡ 𝔼𝕝𝕖𝕔𝕥𝕣𝕚𝕔 𝔻𝕣𝕖𝕒𝕞𝕤",
    "🎨 ℙ𝕚𝕩𝕖𝕝 ℙ𝕖𝕣𝕗𝕖𝕔𝕥",
    "🌸 𝕊𝕒𝕜𝕦𝕣𝕒 𝔹𝕝𝕠𝕠𝕞",
    "🚀 ℂ𝕪𝕓𝕖𝕣 𝔽𝕦𝕥𝕦𝕣𝕖",
    "💫 𝕄𝕒𝕘𝕚𝕔 𝕄𝕠𝕞𝕖𝕟𝕥𝕤",
    "🎪 ℂ𝕚𝕣𝕔𝕦𝕤 𝔽𝕦𝕟",
    "🌈 ℝ𝕒𝕚𝕟𝕓𝕠𝕨 𝕍𝕚𝕓𝕖𝕤",
    "🍭 ℂ𝕒𝕟𝕕𝕪 𝕂𝕚𝕟𝕘𝕕𝕠𝕞",
    "🦄 𝕌𝕟𝕚𝕔𝕠𝕣𝕟 𝕎𝕠𝕣𝕝𝕕",
    "🎯 ℙ𝕣𝕖𝕔𝕚𝕤𝕚𝕠𝕟 ℙ𝕝𝕒𝕪",
    "🌊 𝕆𝕔𝕖𝕒𝕟 𝔸𝕖𝕤𝕥𝕙𝕖𝕥𝕚𝕔",
    "🔮 𝕄𝕪𝕤𝕥𝕚𝕔 𝔸𝕣𝕥",
    "🎵 𝕍𝕚𝕓𝕖 𝕄𝕖𝕝𝕠𝕕𝕪",
    "🌺 𝕋𝕣𝕠𝕡𝕚𝕔𝕒𝕝 ℙ𝕒𝕣𝕒𝕕𝕚𝕤𝕖"
]
// Charger les packs de stickers
function loadStickerPacks() {
    try {
        if (fs.existsSync(STICKER_PACKS_FILE)) {
            stickerPacks = JSON.parse(fs.readFileSync(STICKER_PACKS_FILE, 'utf8'))
        }
    } catch (err) {
        console.log("Erreur chargement packs stickers:", err)
        stickerPacks = {}
    }
}
// Sauvegarder les packs de stickers
function saveStickerPacks() {
    try {
        fs.writeFileSync(STICKER_PACKS_FILE, JSON.stringify(stickerPacks, null, 2))
    } catch (err) {
        console.log("Erreur sauvegarde packs stickers:", err)
    }
}
// Générer un nom de pack stylé unique
function generateStylishPackName() {
    const baseNames = stylishPackNames
    const randomName = baseNames[Math.floor(Math.random() * baseNames.length)]
    const suffix = Math.floor(Math.random() * 9999) + 1
    return `${randomName} #${suffix}`
}
// ====================
// FICHIERS DE CONFIG
// ====================
const GROUPS_FILE = "./auth/groups.json";
const CONFIG_FILE = "./auth/config.json";
const WARNS_FILE = "./auth/warns.json";
const MESSAGES_FILE = "./auth/messages.json";
const PROFILES_FILE = "./auth/profiles.json";
const SCORES_FILE = "./auth/scores.json"; // NOUVEAU : fichier pour les scores
// ====================
// STRUCTURES DE DONNÉES
// ====================
const activeGames = new Map(); // Jeux en cours
const scores = new Map(); // Scores des joueurs par groupe: { group_jid: { user_jid: { total: number, games: number } } }
let messageCounts = {}; // { group_jid: { user_jid: number } }
let userProfiles = {}; // { user_jid: { messages: number, level: number, xp: number, warns: number } }
const gameTimers = new Map(); // Chronomètres pour les jeux
const usedQuestions = new Map(); // Questions déjà utilisées: { group_jid: { country: [], vraioufaux: [], capitale: [], devine: [], anime: [], manga: [], personnage: [], opening: [], seiyuu: [] } }
let cachedGroups = []; // Cache des groupes pour optimiser les performances
// Jeu Loup-Garou
const loupGames = new Map(); // Parties de Loup-Garou en cours
// Jeu Last Cry
const lastCryGames = new Map(); // Parties de Last Cry en cours
const lastCryRegistrations = new Map(); // Inscriptions en cours par groupe
// Messages de mort aléatoires pour Last Cry
const deathMessages = [
 "🔥 ECHOUEEEEEEEEE !!!",
 "💀 Tu es tombé...",
 "😈 Le jeu t'a brisé...",
 "⚰️ Fin de parcours...",
 "😂 C'était trop pour toi...",
 "💨 Disparu dans l'ombre...",
 "👻 Tu n'existes plus...",
 "💣 BOOM ! éliminé !",
 "🥀 Ton aventure s'arrête ici...",
 "🪦 Repose en paix...",
 "😵 KO direct !",
 "🚫 Refusé par le jeu...",
 "😬 Mauvais timing...",
 "💀 Le dernier… comme prévu.",
 "😈 Le bot t'a jugé...",
 "⚡ Trop lent...",
 "🥶 Frozen… OUT !",
 "🤡 Fallait être plus rapide...",
 "🫠 Tu as fondu sous pression...",
 "💥 ÉCRASÉ par la pression !",
 "📉 Niveau insuffisant...",
 "😶 Silence… puis chute...",
 "🕳️ Tombé dans le vide...",
 "😎 Les autres étaient meilleurs...",
 "👎 Mauvaise perf...",
 "🔥 Le feu t'a consumé...",
 "🧨 Explosion fatale...",
 "💔 Le jeu ne t'aime pas...",
 "😏 On t'avait prévenu...",
 "🚪 Sortie directe !"
];
// ====================
// Fonctions multimédia
async function searchYouTube(query) {
    try {
        console.log("🔍 Recherche pour:", query)
        const results = await ytSearch(query)
        if (!results || !results.videos || results.videos.length === 0) {
            console.log("❌ Aucune vidéo trouvée")
            return []
        }
        const formatted = results.videos.slice(0, 5).map(video => ({
            title: video.title,
            url: video.url,
            duration: video.duration?.timestamp || video.duration?.seconds || 0,
            thumbnail: video.thumbnail,
            author: video.author?.name || 'Inconnu'
        }))
        console.log("✅ Vidéos formatées:", formatted)
        return formatted
    } catch (error) {
        console.error('Erreur recherche YouTube:', error)
        return []
    }
}
// Fonction pour formater la durée
function formatDuration(duration) {
    if (!duration) return 'Inconnue'
    // Si c'est un timestamp comme "4:32"
    if (typeof duration === 'string') {
        return duration
    }
    // Si c'est en secondes
    if (typeof duration === 'number') {
        const hours = Math.floor(duration / 3600)
        const minutes = Math.floor((duration % 3600) / 60)
        const seconds = Math.floor(duration % 60)
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
    return 'Inconnue'
}
// Questions variées pour Last Cry (culture, conjugaison, maths, etc.)
const lastCryQuestions = [
    // CULTURE GÉNÉRALE
    {
        question: "Quelle est la capitale de la France ?",
        answer: "paris",
        alternatives: ["paris"]
    },
    {
        question: "Combien y a-t-il de continents ?",
        answer: "7",
        alternatives: ["sept", "7"]
    },
    {
        question: "De quelle couleur est le ciel ?",
        answer: "bleu",
        alternatives: ["bleu"]
    },
    {
        question: "Quel est le plus grand pays du monde ?",
        answer: "russie",
        alternatives: ["russie"]
    },
    // MATHS
    {
        question: "Combien font 2 + 2 ?",
        answer: "4",
        alternatives: ["4", "quatre"]
    },
    {
        question: "Combien font 5 × 3 ?",
        answer: "15",
        alternatives: ["15", "quinze"]
    },
    {
        question: "Combien font 10 ÷ 2 ?",
        answer: "5",
        alternatives: ["5", "cinq"]
    },
    {
        question: "Quel est le carré de 3 ?",
        answer: "9",
        alternatives: ["9", "neuf"]
    },
    // CONJUGAISON
    {
        question: "Conjuge au présent : 'Je (aller)'",
        answer: "vais",
        alternatives: ["vais"]
    },
    {
        question: "Conjuge au présent : 'Tu (être)'",
        answer: "es",
        alternatives: ["es"]
    },
    {
        question: "Conjuge au présent : 'Il (avoir)'",
        answer: "a",
        alternatives: ["a"]
    },
    {
        question: "Conjuge au passé composé : 'Nous (faire)'",
        answer: "avons fait",
        alternatives: ["avons fait", "fait"]
    },
    {
        question: "Conjuge au futur : 'Vous (venir)'",
        answer: "viendrez",
        alternatives: ["viendrez"]
    },
    // SCIENCES
    {
        question: "Quelle planète est surnommée la Planète Rouge ?",
        answer: "mars",
        alternatives: ["mars"]
    },
    {
        question: "Combien de jours y a-t-il dans une année ?",
        answer: "365",
        alternatives: ["365", "trois cent soixante cinq"]
    },
    {
        question: "Quel est le symbole chimique de l'eau ?",
        answer: "h2o",
        alternatives: ["h2o", "H2O"]
    },
    {
        question: "Quel gaz respirons-nous ?",
        answer: "oxygène",
        alternatives: ["oxygène", "o2"]
    },
    // GÉOGRAPHIE
    {
        question: "Dans quel pays se trouve la Tour Eiffel ?",
        answer: "france",
        alternatives: ["france"]
    },
    {
        question: "Quel océan borde la France ?",
        answer: "atlantique",
        alternatives: ["atlantique", "océan atlantique"]
    },
    // SPORTS
    {
        question: "Combien de joueurs dans une équipe de football ?",
        answer: "11",
        alternatives: ["11", "onze"]
    },
    {
        question: "Dans quel sport marque-t-on un essai ?",
        answer: "rugby",
        alternatives: ["rugby"]
    },
    {
        question: "Quelle est la distance d'un marathon ?",
        answer: "42.195",
        alternatives: ["42.195", "42", "42.195 km"]
    },
    // FUN/RAPIDE
    {
        question: "Quel animal dit 'Miaou' ?",
        answer: "chat",
        alternatives: ["chat"]
    },
    {
        question: "Quel animal dit 'Ouaf' ?",
        answer: "chien",
        alternatives: ["chien"]
    },
    {
        question: "Quel est le contraire de 'chaud' ?",
        answer: "froid",
        alternatives: ["froid"]
    },
    {
        question: "Combien y a-t-il de jours dans la semaine ?",
        answer: "7",
        alternatives: ["7", "sept"]
    },
    {
        question: "Quelle est la saison après l'été ?",
        answer: "automne",
        alternatives: ["automne"]
    },
    {
        question: "Quel est le contraire de 'grand' ?",
        answer: "petit",
        alternatives: ["petit"]
    },
    {
        question: "Quel fruit est rouge ?",
        answer: "pomme",
        alternatives: ["pomme", "fraise", "cerise"]
    },
    {
        question: "Combien y a-t-il de mois dans l'année ?",
        answer: "12",
        alternatives: ["12", "douze"]
    },
    {
        question: "Quelle couleur est le soleil ?",
        answer: "jaune",
        alternatives: ["jaune"]
    },
    {
        question: "Quel est le contraire de 'jour' ?",
        answer: "nuit",
        alternatives: ["nuit"]
    },
    // HISTOIRE
    {
        question: "En quelle année a débuté la Révolution française ?",
        answer: "1789",
        alternatives: ["1789"]
    },
    {
        question: "Qui a construit la Tour Eiffel ?",
        answer: "eiffel",
        alternatives: ["eiffel", "gustave eiffel"]
    },
    {
        question: "Quel roi était le 'Roi Soleil' ?",
        answer: "louis xiv",
        alternatives: ["louis xiv", "louis 14"]
    },
    {
        question: "En quelle année Columbus a découvert l'Amérique ?",
        answer: "1492",
        alternatives: ["1492"]
    },
    {
        question: "Qui a peint la Joconde ?",
        answer: "léonard de vinci",
        alternatives: ["léonard de vinci", "da vinci"]
    },
    {
        question: "Quelle est la capitale de l'Empire romain ?",
        answer: "rome",
        alternatives: ["rome"]
    },
    {
        question: "En quelle année a eu lieu la Révolution russe ?",
        answer: "1917",
        alternatives: ["1917"]
    },
    {
        question: "Qui a écrit 'Les Misérables' ?",
        answer: "victor hugo",
        alternatives: ["victor hugo"]
    },
    {
        question: "Quelle est la plus grande pyramide d'Égypte ?",
        answer: "khéops",
        alternatives: ["khéops"]
    },
    {
        question: "En quelle année a commencé la Première Guerre mondiale ?",
        answer: "1914",
        alternatives: ["1914"]
    },
    // LITTÉRATURE
    {
        question: "Qui a écrit 'Harry Potter' ?",
        answer: "jk rowling",
        alternatives: ["jk rowling", "rowling"]
    },
    {
        question: "Quel est le héros de 'Le Seigneur des Anneaux' ?",
        answer: "frodon",
        alternatives: ["frodon", "frodon sacquet"]
    },
    {
        question: "Qui a écrit '1984' ?",
        answer: "george orwell",
        alternatives: ["george orwell", "orwell"]
    },
    {
        question: "Quel est le titre du premier livre de la Bible ?",
        answer: "genèse",
        alternatives: ["genèse"]
    },
    {
        question: "Qui a écrit 'Le Petit Prince' ?",
        answer: "saint-exupéry",
        alternatives: ["saint-exupéry"]
    },
    {
        question: "Dans quel livre trouve-t-on 'Moby Dick' ?",
        answer: "moby dick",
        alternatives: ["moby dick"]
    },
    {
        question: "Qui a écrit 'Les Trois Mousquetaires' ?",
        answer: "alexandre dumas",
        alternatives: ["alexandre dumas", "dumas"]
    },
    {
        question: "Quel est le nom du détective créé par Conan Doyle ?",
        answer: "sherlock holmes",
        alternatives: ["sherlock holmes", "holmes"]
    },
    {
        question: "Qui a écrit 'Orgueil et Préjugés' ?",
        answer: "jane austen",
        alternatives: ["jane austen", "austen"]
    },
    {
        question: "Quel personnage est surnommé 'Le sorcier' dans 'Le Seigneur des Anneaux' ?",
        answer: "gandalf",
        alternatives: ["gandalf"]
    },
    // CINÉMA
    {
        question: "Qui a réalisé 'Titanic' ?",
        answer: "james cameron",
        alternatives: ["james cameron", "cameron"]
    },
    {
        question: "Quel est le nom du héros de 'Star Wars' ?",
        answer: "luke",
        alternatives: ["luke", "luke skywalker"]
    },
    {
        question: "Dans quel pays se déroule 'Le Seigneur des Anneaux' ?",
        answer: "nouvelle-zélande",
        alternatives: ["nouvelle-zélande"]
    },
    {
        question: "Qui a joué dans 'Forrest Gump' ?",
        answer: "tom hanks",
        alternatives: ["tom hanks", "hanks"]
    },
    {
        question: "Quel est le nom du robot dans 'Star Wars' ?",
        answer: "r2d2",
        alternatives: ["r2d2", "r2-d2"]
    },
    {
        question: "Qui a réalisé 'Avatar' ?",
        answer: "james cameron",
        alternatives: ["james cameron", "cameron"]
    },
    {
        question: "Quel est le nom du sorcier dans 'Harry Potter' ?",
        answer: "harry",
        alternatives: ["harry", "harry potter"]
    },
    {
        question: "Dans quel film trouve-t-on 'I'll be back' ?",
        answer: "terminator",
        alternatives: ["terminator"]
    },
    {
        question: "Qui a joué le rôle de 'Jack' dans 'Titanic' ?",
        answer: "leonardo dicaprio",
        alternatives: ["leonardo dicaprio", "dicaprio"]
    },
    {
        question: "Quel est le nom du vaisseau spatial dans 'Star Wars' ?",
        answer: "millennium falcon",
        alternatives: ["millennium falcon", "faucon millénaire"]
    },
    // TECHNOLOGIE
    {
        question: "Qui a fondé Apple ?",
        answer: "steve jobs",
        alternatives: ["steve jobs", "jobs"]
    },
    {
        question: "Quel est le système d'exploitation de Google ?",
        answer: "android",
        alternatives: ["android"]
    },
    {
        question: "Qui a inventé le téléphone ?",
        answer: "alexander graham bell",
        alternatives: ["alexander graham bell", "bell"]
    },
    {
        question: "Quel est le nom du fondateur de Facebook ?",
        answer: "mark zuckerberg",
        alternatives: ["mark zuckerberg", "zuckerberg"]
    },
    {
        question: "Quel est le système d'exploitation de Microsoft ?",
        answer: "windows",
        alternatives: ["windows"]
    },
    {
        question: "Qui a fondé Tesla ?",
        answer: "elon musk",
        alternatives: ["elon musk", "musk"]
    },
    {
        question: "Quel est le nom du moteur de recherche de Microsoft ?",
        answer: "bing",
        alternatives: ["bing"]
    },
    {
        question: "Qui a inventé l'électricité ?",
        answer: "edison",
        alternatives: ["edison", "thomas edison"]
    },
    {
        question: "Quel est le nom du système d'exploitation d'Apple ?",
        answer: "ios",
        alternatives: ["ios"]
    },
    {
        question: "Qui a fondé Amazon ?",
        answer: "jeff bezos",
        alternatives: ["jeff bezos", "bezos"]
    },
    // MUSIQUE
    {
        question: "Qui a chanté 'Shape of You' ?",
        answer: "ed sheeran",
        alternatives: ["ed sheeran", "sheeran"]
    },
    {
        question: "Quel groupe a chanté 'Bohemian Rhapsody' ?",
        answer: "queen",
        alternatives: ["queen"]
    },
    {
        question: "Qui a chanté 'Billie Jean' ?",
        answer: "michael jackson",
        alternatives: ["michael jackson", "jackson"]
    },
    {
        question: "Quel est le vrai nom de 'Stromae' ?",
        answer: "paul van haver",
        alternatives: ["paul van haver"]
    },
    {
        question: "Qui a chanté 'Imagine' ?",
        answer: "john lennon",
        alternatives: ["john lennon", "lennon"]
    },
    {
        question: "Quel groupe a chanté 'Hotel California' ?",
        answer: "eagles",
        alternatives: ["eagles"]
    },
    {
        question: "Qui a chanté 'Bad Romance' ?",
        answer: "lady gaga",
        alternatives: ["lady gaga", "gaga"]
    },
    {
        question: "Quel artiste a chanté 'Uptown Funk' ?",
        answer: "bruno mars",
        alternatives: ["bruno mars", "mars"]
    },
    {
        question: "Qui a chanté 'Like a Rolling Stone' ?",
        answer: "bob dylan",
        alternatives: ["bob dylan", "dylan"]
    },
    {
        question: "Quel groupe a chanté 'Stairway to Heaven' ?",
        answer: "led zeppelin",
        alternatives: ["led zeppelin"]
    },
    // NATURE
    {
        question: "Quel est l'animal le plus rapide du monde ?",
        answer: "guépard",
        alternatives: ["guépard"]
    },
    {
        question: "Quel est le plus grand animal du monde ?",
        answer: "baleine bleue",
        alternatives: ["baleine bleue", "baleine"]
    },
    {
        question: "Quel est le plus grand oiseau ?",
        answer: "autruche",
        alternatives: ["autruche"]
    },
    {
        question: "Quel est le seul mammifère qui vole ?",
        answer: "chauve-souris",
        alternatives: ["chauve-souris"]
    },
    {
        question: "Quel est le plus grand arbre du monde ?",
        answer: "séquoia",
        alternatives: ["séquoia"]
    },
    {
        question: "Quel est le plus petit oiseau ?",
        answer: "colibri",
        alternatives: ["colibri"]
    },
    {
        question: "Quel est le plus grand reptile ?",
        answer: "crocodile",
        alternatives: ["crocodile"]
    },
    {
        question: "Quel est le plus grand poisson ?",
        answer: "requin baleine",
        alternatives: ["requin baleine"]
    },
    {
        question: "Quel est le plus grand insecte ?",
        answer: "scarabée géant",
        alternatives: ["scarabée géant"]
    },
    {
        question: "Quel est le plus grand mammifère terrestre ?",
        answer: "éléphant",
        alternatives: ["éléphant"]
    },
    // ALIMENTAIRE
    {
        question: "Quel est le fruit le plus consommé au monde ?",
        answer: "banane",
        alternatives: ["banane"]
    },
    {
        question: "Quel pays est le plus grand producteur de café ?",
        answer: "brésil",
        alternatives: ["brésil"]
    },
    {
        question: "Quel est le fromage le plus connu de France ?",
        answer: "camembert",
        alternatives: ["camembert"]
    },
    {
        question: "Quel est le plat national du Japon ?",
        answer: "sushi",
        alternatives: ["sushi"]
    },
    {
        question: "Quel est le fruit le plus cher du monde ?",
        answer: "durian",
        alternatives: ["durian"]
    },
    {
        question: "Quel pays est le plus grand producteur de vin ?",
        answer: "italie",
        alternatives: ["italie"]
    },
    {
        question: "Quel est le plat national de l'Italie ?",
        answer: "pizza",
        alternatives: ["pizza"]
    },
    {
        question: "Quel est le fruit le plus sucré ?",
        answer: "mangue",
        alternatives: ["mangue"]
    },
    {
        question: "Quel est le légume le plus cultivé ?",
        answer: "pomme de terre",
        alternatives: ["pomme de terre"]
    },
    {
        question: "Quel est le fromage le plus cher ?",
        answer: "pule",
        alternatives: ["pule"]
    }
];
// Rate limiting désactivé
// const userCooldowns = new Map()
// const COMMAND_COOLDOWNS = {
//     // Commandes de jeu - cooldown plus long
//     'game': 5000,      // 5 secondes
//     'culture': 5000,
//     'science': 5000,
//     'sport': 5000,
//     'cinema': 5000,
//     'histoire': 5000,
//     'math': 5000,
//     'logique': 5000,
//     'country': 5000,
//     'capitale': 5000,
//     'devine': 5000,
//     'drapeau': 5000,
//     'monument': 5000,
//     'vraioufaux': 5000,
//     'culturepop': 5000,
//     'loup': 8000,      // 8 secondes pour Loup-Garou
//     'lastcry': 8000,    // 8 secondes pour Last Cry
//     'aouv': 6000,       // 6 secondes pour AOUV
    // Commandes fun - cooldown moyen
//     'tagall': 10000,    // 10 secondes
//     'couple': 3000,
//     'crush': 3000,
//     'mariage': 5000,
//     'love': 3000,
//     'ship': 3000,
//     '8ball': 2000,
//     'roll': 2000,
//     'sticker': 3000,    // 3 secondes pour sticker
    // Commandes admin - cooldown court
//     'kick': 2000,
//     'warn': 2000,
//     'unwarn': 2000,
//     'promote': 2000,
//     'demote': 2000,
//     'setup': 5000,
//     'ferme': 3000,
//     'ouvre': 3000,
//     'antilink': 3000,
//     'welcome': 3000,
    // Commandes stats - cooldown court
//     'default': 2000    // 2 secondes par défaut
// }
// Fonction cooldown désactivée
// function getCommandCooldown(commandText) {
//     return 0; // Pas de cooldown
// }
// Base de données des pays pour le jeu
const countries = [
    { name: "France", capitale: "Paris", indice: "Pays de la Tour Eiffel et du croissant", continent: "Europe" },
    { name: "Japon", capitale: "Tokyo", indice: "Pays du soleil levant et des sushis", continent: "Asie" },
    { name: "Brésil", capitale: "Brasília", indice: "Pays du football et du carnaval", continent: "Amérique du Sud" },
    { name: "Égypte", capitale: "Le Caire", indice: "Pays des pyramides et des pharaons", continent: "Afrique" },
    { name: "Australie", capitale: "Canberra", indice: "Pays des kangourous et de l'Opéra de Sydney", continent: "Océanie" },
    { name: "Canada", capitale: "Ottawa", indice: "Pays du sirop d'érable et du hockey", continent: "Amérique du Nord" },
    { name: "Inde", capitale: "New Delhi", indice: "Pays du Taj Mahal et des éléphants", continent: "Asie" },
    { name: "Mexique", capitale: "Mexico", indice: "Pays des tacos et des mariachis", continent: "Amérique du Nord" },
    { name: "Russie", capitale: "Moscou", indice: "Pays le plus grand du monde", continent: "Europe/Asie" },
    { name: "Afrique du Sud", capitale: "Le Cap", indice: "Pays des safaris et du Mandela", continent: "Afrique" },
    { name: "Italie", capitale: "Rome", indice: "Pays de la pizza et du Colisée", continent: "Europe" },
    { name: "Chine", capitale: "Pékin", indice: "Pays de la Grande Muraille", continent: "Asie" },
    { name: "Espagne", capitale: "Madrid", indice: "Pays du flamenco et des tapas", continent: "Europe" },
    { name: "Argentine", capitale: "Buenos Aires", indice: "Pays du tango et du Messi", continent: "Amérique du Sud" },
    { name: "Maroc", capitale: "Rabat", indice: "Pays du thé à la menthe et du désert", continent: "Afrique" },
    { name: "Allemagne", capitale: "Berlin", indice: "Pays de la bière et de la fête de la bière", continent: "Europe" },
    { name: "États-Unis", capitale: "Washington", indice: "Pays de la Statue de la Liberté et d'Hollywood", continent: "Amérique du Nord" },
    { name: "Royaume-Uni", capitale: "Londres", indice: "Pays de la reine et du Big Ben", continent: "Europe" },
    { name: "Corée du Sud", capitale: "Séoul", indice: "Pays du K-pop et des dramas", continent: "Asie" },
    { name: "Indonésie", capitale: "Jakarta", indice: "Pays des îles et des volcans", continent: "Asie" },
    { name: "Turquie", capitale: "Ankara", indice: "Pays des mosquées et du café turc", continent: "Europe/Asie" },
    { name: "Arabie Saoudite", capitale: "Riyad", indice: "Pays du pétrole et des déserts", continent: "Asie" },
    { name: "Suisse", capitale: "Berne", indice: "Pays du chocolat et des montagnes", continent: "Europe" },
    { name: "Suède", capitale: "Stockholm", indice: "Pays des Vikings et d'IKEA", continent: "Europe" },
    { name: "Pologne", capitale: "Varsovie", indice: "Pays des pierogis et du sel", continent: "Europe" },
    { name: "Norvège", capitale: "Oslo", indice: "Pays des fjords et des aurores boréales", continent: "Europe" },
    { name: "Nouvelle-Zélande", capitale: "Wellington", indice: "Pays des kiwis et du Seigneur des Anneaux", continent: "Océanie" },
    { name: "Islande", capitale: "Reykjavik", indice: "Pays des volcans et des aurores", continent: "Europe" },
    { name: "Finlande", capitale: "Helsinki", indice: "Pays du Père Noël et des saunas", continent: "Europe" },
    { name: "Danemark", capitale: "Copenhague", indice: "Pays des Vikings et des Lego", continent: "Europe" },
    { name: "Grèce", capitale: "Athènes", indice: "Pays des dieux et des îles", continent: "Europe" },
    { name: "Portugal", capitale: "Lisbonne", indice: "Pays des explorateurs et du pastel de nata", continent: "Europe" },
    { name: "Thaïlande", capitale: "Bangkok", indice: "Pays des temples et des massages", continent: "Asie" },
    { name: "Viêt Nam", capitale: "Hanoï", indice: "Pays du phở et des rizières", continent: "Asie" },
    { name: "Nigéria", capitale: "Abuja", indice: "Pays le plus peuplé d'Afrique", continent: "Afrique" },
    { name: "Kenya", capitale: "Nairobi", indice: "Pays des safaris et des marathons", continent: "Afrique" },
    { name: "Pérou", capitale: "Lima", indice: "Pays des Incas et du Machu Picchu", continent: "Amérique du Sud" },
    { name: "Chili", capitale: "Santiago", indice: "Pays le plus long du monde", continent: "Amérique du Sud" },
    { name: "Colombie", capitale: "Bogota", indice: "Pays du café et des émeraudes", continent: "Amérique du Sud" },
    { name: "Venezuela", capitale: "Caracas", indice: "Pays du pétrole et des plages", continent: "Amérique du Sud" },
    { name: "Uruguay", capitale: "Montevideo", indice: "Pays du football et du maté", continent: "Amérique du Sud" },
    { name: "Cuba", capitale: "La Havane", indice: "Pays des cigares et des voitures anciennes", continent: "Amérique du Nord" },
    { name: "Jamaïque", capitale: "Kingston", indice: "Pays du reggae et d'Usain Bolt", continent: "Amérique du Nord" },
    { name: "Costa Rica", capitale: "San José", indice: "Pays des pura vida et des volcans", continent: "Amérique du Nord" },
    { name: "Panama", capitale: "Panama", indice: "Pays du canal et des chapeaux", continent: "Amérique du Nord" },
    { name: "Guatemala", capitale: "Guatemala", indice: "Pays des Mayas et des volcans", continent: "Amérique du Nord" },
    { name: "Équateur", capitale: "Quito", indice: "Pays des Galapagos et de l'équateur", continent: "Amérique du Sud" },
    { name: "Bolivie", capitale: "La Paz", indice: "Pays le plus haut du monde", continent: "Amérique du Sud" },
    { name: "Paraguay", capitale: "Asunción", indice: "Pays du fleuve Paraguay", continent: "Amérique du Sud" },
    { name: "Éthiopie", capitale: "Addis-Abeba", indice: "Pays du café et de Lucy", continent: "Afrique" },
    { name: "Tanzanie", capitale: "Dodoma", indice: "Pays du Kilimandjaro et du safari", continent: "Afrique" },
    { name: "Ghana", capitale: "Accra", indice: "Pays de l'or et du cacao", continent: "Afrique" },
    { name: "Sénégal", capitale: "Dakar", indice: "Pays du Paris-Dakar et du teranga", continent: "Afrique" },
    { name: "Tunisie", capitale: "Tunis", indice: "Pays des mosaïques et du jasmin", continent: "Afrique" },
    { name: "Algérie", capitale: "Alger", indice: "Pays du désert et du gaz", continent: "Afrique" },
    { name: "Liban", capitale: "Beyrouth", indice: "Pays du cèdre et du taboulé", continent: "Asie" },
    { name: "Israël", capitale: "Jérusalem", indice: "Pays de la mer Morte et des technologies", continent: "Asie" },
    { name: "Iran", capitale: "Téhéran", indice: "Pays des tapis et des poésies", continent: "Asie" },
    { name: "Irak", capitale: "Bagdad", indice: "Pays des fleuves et de l'histoire ancienne", continent: "Asie" },
    { name: "Afghanistan", capitale: "Kaboul", indice: "Pays des montagnes et des rubis", continent: "Asie" },
    { name: "Népal", capitale: "Katmandou", indice: "Pays de l'Himalaya et des Sherpas", continent: "Asie" },
    { name: "Mongolie", capitale: "Oulan-Bator", indice: "Pays de Gengis Khan et des steppes", continent: "Asie" },
    { name: "Bangladesh", capitale: "Dacca", indice: "Pays du delta et des cyclones", continent: "Asie" },
    { name: "Sri Lanka", capitale: "Colombo", indice: "Pays du thé et des plages", continent: "Asie" },
    { name: "Myanmar", capitale: "Naypyidaw", indice: "Pays des pagodes et des rubis", continent: "Asie" },
    { name: "Cambodge", capitale: "Phnom Penh", indice: "Pays d'Angkor et des temples", continent: "Asie" },
    { name: "Laos", capitale: "Vientiane", indice: "Pays du Mékong et des montagnes", continent: "Asie" },
    { name: "Malaisie", capitale: "Kuala Lumpur", indice: "Pays des tours jumelles et du pétrole", continent: "Asie" },
    { name: "Singapour", capitale: "Singapour", indice: "Pays de la prospérité et du lion", continent: "Asie" },
    { name: "Philippines", capitale: "Manille", indice: "Pays des 7000 îles et des typhons", continent: "Asie" }
];
// Mots à deviner pour le jeu devine
const devineWords = [
    { answer: "chocolat", hint: "Douceur brune fondante" },
    { answer: "ordinateur", hint: "Machine pour calculer et surfer" },
    { answer: "montagne", hint: "Sommet élevé avec neige" },
    { answer: "bibliothèque", hint: "Lieu avec beaucoup de livres" },
    { answer: "éléphant", hint: "Plus grand animal terrestre avec trompe" },
    { answer: "arc-en-ciel", hint: "Phénomène coloré après la pluie" },
    { answer: "astronaute", hint: "Voyageur de l'espace" },
    { answer: "dinosaure", hint: "Géant préhistorique éteint" },
    { answer: "baleine", hint: "Plus grand animal marin" },
    { answer: "pyramide", hint: "Monument égyptien triangulaire" },
    { answer: "volcan", hint: "Montagne qui crache du feu" },
    { answer: "guitare", hint: "Instrument à 6 cordes" },
    { answer: "papillon", hint: "Insecte coloré qui vole" },
    { answer: "chateau", hint: "Résidence médiévale fortifiée" },
    { answer: "safari", hint: "Expédition pour voir les animaux" },
    { answer: "tornade", hint: "Tourbillon de vent destructeur" },
    { answer: "cacao", hint: "Plante qui donne le chocolat" },
    { answer: "pharaon", hint: "Roi égyptien antique" },
    { answer: "samouraï", hint: "Guerrier japonais avec katana" },
    { answer: "sorcière", hint: "Magicienne avec balai" },
    { answer: "dragon", hint: "Créature mythique cracheur de feu" },
    { answer: "pirate", hint: "Marin des mers avec trésor" },
    { answer: "ninja", hint: "Espion japonais furtif" },
    { answer: "vampire", hint: "Créature de la nuit suceur de sang" },
    { answer: "fantôme", hint: "Esprit invisible qui hante" },
    { answer: "robot", hint: "Machine humanoïde intelligente" },
    { answer: "alien", hint: "Extraterrestre d'une autre planète" },
    { answer: "superhero", hint: "Personnage avec pouvoirs" },
    { answer: "magicien", hint: "Faiseur de tours et d'illusions" },
    { answer: "detective", hint: "Enquêteur qui résout des mystères" }
];
// Questions pour vrai ou faux
const trueFalseQuestions = [
    { question: "Les abeilles peuvent reconnaître les visages humains", answer: true, explanation: "Les abeilles peuvent apprendre et distinguer différents visages humains !" },
    { question: "Le cœur d'une baleine bleue est assez gros pour qu'un humain puisse nager dedans", answer: true, explanation: "Le cœur d'une baleine bleue pèse environ 600kg et est très grand !" },
    { question: "Les pieuvres ont trois cœurs", answer: true, explanation: "Deux cœurs pour les branchies et un pour le corps !" },
    { question: "Les kangourous ne peuvent pas marcher en arrière", answer: true, explanation: "Leur anatomie ne leur permet que de sauter vers l'avant !" },
    { question: "Le miel ne périt jamais", answer: true, explanation: "Grâce à sa faible teneur en eau et à son acidité, le miel peut se conserver indéfiniment !" },
    { question: "Les papillons goûtent avec leurs pattes", answer: true, explanation: "Les papillons ont des récepteurs gustatifs sur leurs pattes !" },
    { question: "Les étoiles à neutrons sont si denses qu'une cuillère pèserait des milliards de tonnes", answer: true, explanation: "Une cuillère de matière d'étoile à neutrons pèserait environ 6 milliards de tonnes !" },
    { question: "Les dauphins dorment avec un œil ouvert", answer: true, explanation: "Ils dorment avec un hémisphère cérébral à la fois pour rester vigilants !" },
    { question: "Les flamants roses naissent gris", answer: true, explanation: "Ils deviennent roses grâce aux pigments de leur nourriture !" },
    { question: "Les champignons sont plus proches génétiquement des animaux que des plantes", answer: true, explanation: "Les champignons partagent un ancêtre commun plus récent avec les animaux !" },
    { question: "Les fourmis peuvent soulever 50 fois leur poids", answer: true, explanation: "Certaines fourmis peuvent soulever jusqu'à 50 fois leur poids corporel !" },
    { question: "Le son voyage plus vite dans l'eau que dans l'air", answer: true, explanation: "Environ 1500 m/s dans l'eau contre 343 m/s dans l'air !" },
    { question: "Les cactus peuvent vivre jusqu'à 200 ans", answer: true, explanation: "Certains cactus du désert peuvent vivre très longtemps !" },
    { question: "Les humains partagent 50% de leur ADN avec les bananes", answer: false, explanation: "Nous partageons environ 60% d'ADN avec les bananes, pas 50% !" },
    { question: "Le plus grand animal terrestre était plus grand qu'un éléphant", answer: true, explanation: "Les dinosaures sauropodes comme l'Argentinosaurus étaient bien plus grands !" },
    { question: "Les loups peuvent entendre jusqu'à 10km de distance", answer: true, explanation: "Les loups ont une ouïe extrêmement développée !" },
    { question: "Les tortues peuvent vivre plus de 150 ans", answer: true, explanation: "Certaines tortues géantes des Galápagos ont vécu plus de 150 ans !" },
    { question: "Les éclairs peuvent frapper le même endroit deux fois", answer: true, explanation: "L'Empire State Building est frappé environ 25 fois par an !" },
    { question: "Les vers de terre ont 5 cœurs", answer: false, explanation: "Ils n'ont pas de cœur mais 5 paires d'artères aortiques !" },
    { question: "Les pingouins vivent uniquement dans l'hémisphère sud", answer: true, explanation: "Toutes les espèces de pingouins vivent dans l'hémisphère sud !" },
    { question: "Les requins existent depuis avant les arbres", answer: true, explanation: "Les requins existent depuis 400 millions d'années !" },
    { question: "Les plus grands systèmes de montagnes d'Asie sont l'Himalaya", answer: true, explanation: "L'Himalaya est la plus grande chaîne d'Asie !" },
    { question: "Les plus anciennes formes de cuisine sont la chasse", answer: true, explanation: "La chasse a précédé l'agriculture dans l'alimentation !" },
    { question: "Les plus grandes vallées d'Asie sont la Vallée du Rift", answer: false, explanation: "La Vallée du Rift est principalement en Afrique !" },
    { question: "Les plus anciennes formes de sport sont la lutte", answer: true, explanation: "La lutte est l'un des plus anciens sports connus !" },
    { question: "Les plus grands systèmes de golfes d'Asie sont le Bengale", answer: true, explanation: "Le Golfe du Bengale est immense !" },
    { question: "Les plus anciennes formes de jeux sont les osselets", answer: true, explanation: "Les jeux d'osselets sont très anciens !" },
    { question: "Les plus hautes montagnes d'Asie sont l'Everest", answer: true, explanation: "L'Everest est le plus haut sommet d'Asie et du monde !" },
    { question: "Les plus anciennes formes de religion sont le chamanisme", answer: true, explanation: "Le chamanisme est une des plus anciennes formes de religion !" },
    { question: "Les plus grandes îles d'Asie sont Bornéo", answer: true, explanation: "Bornéo est la troisième plus grande île du monde !" },
    { question: "Les plus anciennes formes de gouvernement sont les chefferies", answer: true, explanation: "Les chefferies sont des formes anciennes de gouvernement !" },
    { question: "Les plus grands systèmes de montagnes d'Afrique sont les Atlas", answer: false, explanation: "Les montagnes du Rift est-africain sont plus étendues !" },
    { question: "Les plus anciennes formes d'éducation sont l'initiation", answer: true, explanation: "Les rituels d'initiation sont des formes d'éducation !" },
    { question: "Les plus grandes péninsules d'Afrique sont la Somalie", answer: true, explanation: "La corne de l'Afrique est une grande péninsule !" },
    { question: "Les plus anciennes formes de médecine sont les plantes", answer: true, explanation: "L'utilisation des plantes médicinales est très ancienne !" },
    { question: "Les plus hauts sommets d'Afrique sont le Kilimandjaro", answer: true, explanation: "Le Kilimandjaro est le plus haut sommet d'Afrique !" },
    { question: "Les plus anciennes formes de commerce sont les caravanes", answer: true, explanation: "Les caravanes commerciales existent depuis l'antiquité !" },
    { question: "Les plus grands systèmes de deltas d'Afrique sont le Niger", answer: true, explanation: "Le delta du Niger est immense !" },
    { question: "Les plus anciennes formes d'écriture sont les hiéroglyphes", answer: false, explanation: "L'écriture cunéiforme est plus ancienne !" },
    { question: "Les plus grandes plaines d'Afrique sont le Sahel", answer: false, explanation: "Les plaines est-africaines sont plus vastes que le Sahel !" },
    { question: "Les plus anciennes formes de philosophie sont les mythes", answer: true, explanation: "Les mythes expliquaient le monde avant la philosophie !" },
    { question: "Les plus grands lacs d'Afrique sont les Grands Lacs", answer: true, explanation: "Les Grands Lacs africains sont immenses !" },
    { question: "Les plus anciennes formes de droit sont les coutumes", answer: true, explanation: "Le droit coutumier est très ancien !" },
    { question: "Les plus grands archipels d'Afrique sont les Seychelles", answer: false, explanation: "Les Seychelles sont belles mais pas les plus grandes !" },
    { question: "Les plus anciennes formes de navigation sont les pirogues", answer: true, explanation: "Les pirogues africaines sont très anciennes !" },
    { question: "Les plus grands fleuves d'Afrique sont le Nil", answer: true, explanation: "Le Nil est le plus long fleuve d'Afrique !" },
    { question: "Les plus anciennes formes de métallurgie sont le fer", answer: false, explanation: "Le cuivre et le bronze sont antérieurs au fer !" },
    { question: "Les plus grandes baies d'Afrique sont la Table", answer: false, explanation: "La Baie de la Table est belle mais pas la plus grande !" },
    { question: "Les plus anciennes formes d'astronomie sont égyptiennes", answer: true, explanation: "Les Égyptiens avaient une astronomie avancée !" },
    { question: "Les plus grandes chaînes côtières d'Afrique sont l'Atlas", answer: true, explanation: "L'Atlas longe la côte atlantique !" },
    { question: "Les plus anciennes formes d'architecture sont les pyramides", answer: false, explanation: "Les mégalithes sont antérieurs aux pyramides !" },
    { question: "Les plus grandes réserves de pétrole d'Afrique sont en Libye", answer: true, explanation: "La Libye a d'immenses réserves de pétrole !" },
    { question: "Les plus anciennes formes de poésie sont les épopées", answer: true, explanation: "Les épopées orales sont très anciennes !" },
    { question: "Les plus grands systèmes de montagnes d'Amérique sont les Andes", answer: true, explanation: "Les Andes sont la plus grande chaîne d'Amérique !" },
    { question: "Les plus anciennes formes de mathématiques sont mayas", answer: false, explanation: "Les Babyloniens et Égyptiens étaient plus anciens !" },
    { question: "Les plus grands systèmes de golfes d'Amérique sont le Mexique", answer: true, explanation: "Le Golfe du Mexique est immense !" },
    { question: "Les plus anciennes formes de théâtre sont aztèques", answer: false, explanation: "Le théâtre grec est bien plus ancien !" },
    { question: "Les plus grandes chaînes volcaniques d'Amérique sont les Andes", answer: true, explanation: "Les Andes sont une immense chaîne volcanique !" },
    { question: "Les plus anciennes formes de sculpture sont olmèques", answer: true, explanation: "Les Olmèques faisaient des sculptures magnifiques !" },
    { question: "Les plus hauts sommets d'Amérique sont l'Aconcagua", answer: true, explanation: "L'Aconcagua est le plus haut sommet d'Amérique !" },
    { question: "Les plus anciennes formes de peinture sont rupestres", answer: true, explanation: "Les peintures rupestres américaines sont très anciennes !" },
    { question: "Les plus grands systèmes de fleuves d'Amérique sont l'Amazone", answer: true, explanation: "L'Amazone est le plus grand système fluvial au monde !" },
    { question: "Les plus anciennes formes de cuisine sont indigènes", answer: true, explanation: "Les cuisines indigènes sont très anciennes !" },
    { question: "Les plus grandes vallées d'Amérique sont le Grand Canyon", answer: true, explanation: "Le Grand Canyon est immense !" },
    { question: "Les plus anciennes formes de sport sont mésoaméricains", answer: true, explanation: "Les jeux de balle mésoaméricains sont très anciens !" },
    { question: "Les plus grands systèmes de golfes d'Amérique sont l'Hudson", answer: false, explanation: "Le Golfe du Mexique est plus grand que la Baie d'Hudson !" },
    { question: "Les plus anciennes formes de jeux sont indigènes", answer: true, explanation: "Les jeux indigènes américains sont très anciens !" },
    { question: "Les plus grandes îles d'Amérique sont le Groenland", answer: true, explanation: "Le Groenland est la plus grande île du monde !" },
    { question: "Les plus anciennes formes de gouvernement sont les cités-États", answer: true, explanation: "Les cités-États sont des formes anciennes de gouvernement !" },
    { question: "Les plus grands systèmes de montagnes d'Océanie sont les Alpes australiennes", answer: false, explanation: "Les Alpes néo-zélandaises sont plus hautes !" },
    { question: "Les plus anciennes formes d'éducation sont tribales", answer: true, explanation: "L'éducation tribale est très ancienne !" },
    { question: "Les plus grandes péninsules d'Océanie sont le Cape York", answer: true, explanation: "Le Cape York est une grande péninsule australienne !" },
    { question: "Les plus anciennes formes de médecine sont aborigènes", answer: true, explanation: "La médecine aborigène est très ancienne !" },
    { question: "Les plus hauts sommets d'Océanie sont le Cook", answer: false, explanation: "Le Mont Wilhelm en PNG est plus haut !" },
    { question: "Les plus anciennes formes de commerce sont le troc", answer: true, explanation: "Le troc était courant en Océanie !" },
    { question: "Les plus grands systèmes de deltas d'Océanie sont le Murray", answer: true, explanation: "Le delta du Murray-Darling est immense !" },
    { question: "Les plus anciennes formes d'écriture sont les runes", answer: false, explanation: "Les runes sont beaucoup plus récentes !" },
    { question: "Les plus grandes plaines d'Océanie sont le Nullarbor", answer: true, explanation: "La plaine de Nullarbor est immense !" },
    { question: "Les plus anciennes formes de philosophie sont le rêve", answer: true, explanation: "La philosophie du rêve aborigène est très ancienne !" },
    { question: "Les plus grands lacs d'Océanie sont le Eyre", answer: true, explanation: "Le lac Eyre est le plus grand lac d'Australie !" },
    { question: "Les plus anciennes formes de droit sont coutumiers", answer: true, explanation: "Le droit coutumier est très ancien en Océanie !" },
    { question: "Les plus grands archipels d'Océanie sont la Nouvelle-Zélande", answer: false, explanation: "L'archipel indonésien est plus grand !" },
    { question: "Les plus anciennes formes de navigation sont les pirogues", answer: true, explanation: "Les pirogues océaniennes sont très anciennes !" },
    { question: "Les plus grands fleuves d'Océanie sont le Murray", answer: true, explanation: "Le Murray-Darling est le plus grand système d'Australie !" },
    { question: "Les plus anciennes formes de métallurgie sont limitées", answer: true, explanation: "La métallurgie était limitée en Océanie précoloniale !" },
    { question: "Les plus grandes baies d'Océanie sont la Botanie", answer: true, explanation: "La Baie Botanique est immense !" },
    { question: "Les plus anciennes formes d'astronomie sont aborigènes", answer: true, explanation: "Les Aborigènes avaient une astronomie sophistiquée !" },
    { question: "Les plus grandes chaînes côtières d'Océanie sont la Grande Barrière", answer: false, explanation: "La Grande Barrière est un récif, pas une chaîne côtière !" },
    { question: "Les plus anciennes formes d'architecture sont les mégalithes", answer: true, explanation: "Les mégalithes océaniens sont très anciens !" },
    { question: "Les plus grandes réserves de minerais sont en Australie", answer: true, explanation: "L'Australie est riche en minerais !" },
    { question: "Les plus anciennes formes de poésie sont les chants", answer: true, explanation: "Les poèmes chantés sont très anciens en Océanie !" },
    { question: "Les plus grands systèmes de montagnes d'Antarctique sont les Transantarctiques", answer: true, explanation: "La chaîne Transantarctique traverse tout le continent !" },
    { question: "Les plus anciennes formes de mathématiques sont l'observation", answer: true, explanation: "L'observation des phénomènes naturels est ancienne !" },
    { question: "Les plus grands systèmes de golfes d'Antarctique sont le Ross", answer: true, explanation: "La mer de Ross est immense !" },
    { question: "Les plus anciennes formes de théâtre sont inexistantes", answer: true, explanation: "Il n'y avait pas de théâtre traditionnel en Antarctique !" },
    { question: "Les plus grandes chaînes volcaniques d'Antarctique sont les Erebus", answer: false, explanation: "Le mont Erebus est un volcan, pas une chaîne !" },
    { question: "Les plus anciennes formes de sculpture sont inexistantes", answer: true, explanation: "Il n'y avait pas de tradition sculpturale en Antarctique !" },
    { question: "Les plus hauts sommets d'Antarctique sont le Vinson", answer: true, explanation: "Le massif Vinson est le plus haut sommet d'Antarctique !" },
    { question: "Les plus anciennes formes de peinture sont inexistantes", answer: true, explanation: "Il n'y avait pas de tradition picturale en Antarctique !" },
    { question: "Les plus grands systèmes de fleuves d'Antarctique sont les glaciers", answer: true, explanation: "Les glaciers forment des systèmes fluviaux saisonniers !" },
    { question: "Les plus anciennes formes de cuisine sont inexistantes", answer: true, explanation: "Il n'y avait pas de cuisine traditionnelle en Antarctique !" },
    { question: "Les plus grandes vallées d'Antarctique sont les vallées sèches", answer: true, explanation: "Les vallées sèches de McMurdo sont uniques !" },
    { question: "Les plus anciennes formes de sport sont inexistantes", answer: true, explanation: "Il n'y avait pas de sport traditionnel en Antarctique !" }
]
// Fonctions utilitaires pour Last Cry
function getRandomLastCryQuestion(usedQuestions) {
    // Filtrer les questions non encore utilisées
    const availableQuestions = lastCryQuestions.filter((q, index) => !usedQuestions.includes(index));
    // Si toutes les questions ont été utilisées, réinitialiser
    if (availableQuestions.length === 0) {
        return []; // Retourner un nouveau tableau vide
    }
    // Choisir une question aléatoire parmi les disponibles
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const selectedQuestion = availableQuestions[randomIndex];
    // Ajouter l'index original aux questions utilisées
    const originalIndex = lastCryQuestions.indexOf(selectedQuestion);
    usedQuestions.push(originalIndex);
    return selectedQuestion;
}
function checkLastCryAnswer(answer, question) {
    // Normaliser les accents et la casse
    const normalizedAnswer = normalizeAccents(answer);
    const normalizedAlternatives = question.alternatives.map(alt => normalizeAccents(alt));
    return normalizedAlternatives.includes(normalizedAnswer);
}
function startLastCryGame(jid, sock, msg) {
    if (lastCryGames.has(jid)) {
        return false; // Jeu déjà en cours
    }
    if (lastCryRegistrations.has(jid)) {
        return false; // Inscription déjà en cours
    }
    // Initialiser la phase d'inscription
    const registration = {
        players: new Set(),
        timer: null,
        startTime: Date.now()
    };
    lastCryRegistrations.set(jid, registration);
    // Message d'inscription
    sock.sendMessage(jid, {
        text: `╭───〔 💀 LAST CRY - INSCRIPTION 〕───⬣
│
│ 🔥 DERNIER SURVIVANT - QUI OSE JOUER ? 🔥
│
│ 📌 Règles du jeu :
│ 📌 Bonne réponse = +1 point 💎
│ 📌 Mauvaise réponse = -1 point 💔
│ 📌 ⏱️ 50 secondes pour répondre ⚡
│ 📌 😈 Le dernier à répondre est ÉLIMINÉ !
│
│ 👥 Participants minimum : 3 joueurs
│ 🎯 Questions : Culture, Maths, Conjugaison...
│ 🏆 Dernier survivant = VAINQUEUR !
│
│ ⚡ Tapez "JE JOUE" pour participer !
│ ⏰ Temps d'inscription : 45 secondes
│
│ 💀 Qui ose affronter le Last Cry ?
│
╰════════════════════════⬣`
    }, { quoted: msg });
    // Timer d'inscription de 45 secondes
    registration.timer = setTimeout(() => {
        endLastCryRegistration(jid, sock);
    }, 45000);
    return true;
}
function endLastCryRegistration(jid, sock) {
    const registration = lastCryRegistrations.get(jid);
    if (!registration) return;
    // Annuler le timer
    if (registration.timer) {
        clearTimeout(registration.timer);
    }
    const players = Array.from(registration.players);
    if (players.length < 3) {
        // Pas assez de joueurs
        sock.sendMessage(jid, {
            text: `╭─〔 ❌ INSCRIPTION ANNULÉE 〕─⬣
│
│ 😱 Pas assez de joueurs !
│
│ 👥 Joueurs inscrits : ${players.length}
│ 📏 Minimum requis : 3 joueurs
│
│ 💀 Le Last Cry nécessite plus de courage !
│ 🔥 Relancez !lastcry quand vous êtes prêts !
│
╰════════════════════════⬣`
        });
        // Nettoyer
        lastCryRegistrations.delete(jid);
        return;
    }
    // Initialiser le jeu avec les joueurs inscrits
    const game = {
        alivePlayers: players,
        eliminatedPlayers: [],
        scores: {},
        answered: [],
        currentQuestion: null,
        isRunning: true,
        timer: null,
        usedQuestions: [], // Suivi des questions déjà posées
        feedbackBuffer: [] // Buffer pour les feedbacks groupés
    };
    // Initialiser les scores
    players.forEach(playerId => {
        game.scores[playerId] = 0;
    });
    lastCryGames.set(jid, game);
    lastCryRegistrations.delete(jid);
    // Message de démarrage
    sock.sendMessage(jid, {
        text: `╭───〔 💀 LAST CRY 〕───⬣
│
│ 🔥 ${players.length} JOUEURS PRÊTS À COMBATTRE ! 🔥
│
│ 📌 Règles du jeu :
│ 📌 Bonne réponse = +1 point 💎
│ 📌 Mauvaise réponse = -1 point 💔
│ 📌 ⏱️ 50 secondes pour répondre ⚡
│ 📌 😈 Le dernier à répondre est ÉLIMINÉ !
│
│ 👥 Participants :
│ ${players.map(p => `@${p.split('@')[0]}`).join(' ')}
│
│ ⚠️ Le jeu commence dans 5 secondes...
│ 💀 Préparez-vous à survivre !
│
╰════════════════════════⬣`,
        mentions: players
    });
    // Démarrer après 5 secondes
    setTimeout(() => {
        nextLastCryRound(jid, sock);
    }, 5000);
}
function handleLastCryRegistration(jid, sock, msg, text, sender) {
    const registration = lastCryRegistrations.get(jid);
    if (!registration) return;
    const normalizedText = text.toLowerCase().trim();
    if (normalizedText === "je joue") {
        if (registration.players.has(sender)) {
            // Joueur déjà inscrit
            sock.sendMessage(jid, {
                text: `⚠️ @${sender.split('@')[0]}, tu es déjà inscrit !`,
                mentions: [sender]
            });
            return;
        }
        // Ajouter le joueur
        registration.players.add(sender);
        const currentCount = registration.players.size;
        // Message de confirmation
        sock.sendMessage(jid, {
            text: `✅ @${sender.split('@')[0]} rejoint le Last Cry ! (${currentCount} joueur${currentCount > 1 ? 's' : ''})`,
            mentions: [sender]
        });
        // Si on a 10 joueurs, on peut démarrer plus tôt
        if (currentCount >= 10) {
            if (registration.timer) {
                clearTimeout(registration.timer);
            }
            endLastCryRegistration(jid, sock);
        }
    }
}
function nextLastCryRound(jid, sock) {
    const game = lastCryGames.get(jid);
    if (!game || !game.isRunning) return;
    // Vérifier si le jeu doit se terminer
    if (game.alivePlayers.length <= 1) {
        endLastCryGame(jid, sock);
        return;
    }
    // Réinitialiser les réponses
    game.answered = [];
    // Choisir une question aléatoire non utilisée
    game.currentQuestion = getRandomLastCryQuestion(game.usedQuestions);
    // Envoyer la question
    sock.sendMessage(jid, {
        text: `╭───〔 ❓ QUESTION ${game.alivePlayers.length}️⃣ 〕───⬣
│
│ 🔥 ${game.currentQuestion.question}
│
│ ⏱️ 50 secondes pour répondre !
│ ⚡ Le PLUS RAPIDE gagne des points
│ 💀 Le DERNIER à répondre est ÉLIMINÉ !
│
│ 🎯 Joueurs restants : ${game.alivePlayers.length}
│
╰════════════════════════⬣`
    });
    // Démarrer le timer de 50 secondes
    game.timer = setTimeout(() => {
        endLastCryRound(jid, sock);
    }, 50000);
}
function endLastCryRound(jid, sock) {
    const game = lastCryGames.get(jid);
    if (!game || !game.isRunning) return;
    // Afficher les feedbacks groupés
    if (game.feedbackBuffer && game.feedbackBuffer.length > 0) {
        let feedbackText = "╭───〔  💀 RÉPONSES 〕───⬣\n│\n";
        game.feedbackBuffer.forEach(feedback => {
            const playerName = feedback.playerId.split('@')[0];
            if (feedback.isCorrect && feedback.isFirstCorrect) {
                feedbackText += `│ ✅ ${playerName} : +1 point (premier !)\n`;
            } else if (feedback.isCorrect) {
                feedbackText += `│ ✅ ${playerName} : 0 point (trop lent !)\n`;
            } else {
                feedbackText += `│ ❌ ${playerName} : -1 point\n`;
            }
        });
        feedbackText += "│\n╰════════════════════════⬣";
        sock.sendMessage(jid, { text: feedbackText });
        // Vider le buffer après affichage
        game.feedbackBuffer = [];
    }
    let playerToEliminate = null;
    // LOGIQUE CORRIGÉ : Éliminer le DERNIER à répondre (peu importe si correct)
    if (game.answered.length > 0) {
        // Éliminer le dernier à avoir répondu
        playerToEliminate = game.answered[game.answered.length - 1];
    } else {
        // Si personne n'a répondu, éliminer un joueur aléatoire
        const nonResponders = game.alivePlayers.filter(player => !game.answered.includes(player));
        if (nonResponders.length > 0) {
            playerToEliminate = nonResponders[Math.floor(Math.random() * nonResponders.length)];
        }
    }
    if (playerToEliminate) {
        // Éliminer le joueur
        game.alivePlayers = game.alivePlayers.filter(p => p !== playerToEliminate);
        game.eliminatedPlayers.push(playerToEliminate);
        // Message d'élimination
        const deathMessage = deathMessages[Math.floor(Math.random() * deathMessages.length)];
        const remainingPlayers = game.alivePlayers.length;
        sock.sendMessage(jid, {
            text: `╭───〔 💀 ÉLIMINATION 💀 〕───⬣
│
│ ❌ @${playerToEliminate.split('@')[0]}
│
│ ${deathMessage}
│
│ 🔥 Restants : ${remainingPlayers} joueur${remainingPlayers > 1 ? 's' : ''}
│ 💀 Éliminés : ${game.eliminatedPlayers.length}
│
│ 😈 Le dernier à répondre est TOUJOURS éliminé !
│
╰════════════════════════⬣`,
            mentions: [playerToEliminate]
        });
    }
    // Envoyer le statut
    sendLastCryStatus(jid, sock);
    // Pause de 10 secondes avant la prochaine question
    setTimeout(() => {
        nextLastCryRound(jid, sock);
    }, 10000);
}
function sendLastCryStatus(jid, sock) {
    const game = lastCryGames.get(jid);
    if (!game) return;
    // Trier les scores
    const sortedScores = Object.entries(game.scores)
        .filter(([playerId]) => game.alivePlayers.includes(playerId))
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);
    let statusMsg = `╭───〔 📊 STATUS DU JEU 📊 〕───⬣
│
│ 🟢 SURVIVANTS (${game.alivePlayers.length}) :
│ ${game.alivePlayers.map(p => `@${p.split('@')[0]}`).join(' ')}
│
│ 💀 ÉLIMINÉS (${game.eliminatedPlayers.length}) :
│ ${game.eliminatedPlayers.map(p => `@${p.split('@')[0]}`).join(' ')}
│
│ 🏆 CLASSEMENT DES SCORES :
│
`;
    if (sortedScores.length > 0) {
        const medals = ['🥇', '🥈', '🥉'];
        sortedScores.forEach(([playerId, score], index) => {
            const playerName = playerId.split('@')[0];
            const scoreEmoji = score >= 5 ? '🔥' : score >= 3 ? '⚡' : score >= 1 ? '✨' : '💫';
            statusMsg += `│ ${medals[index]} ${scoreEmoji} @${playerName} : ${score} pt${score > 1 ? 's' : ''}\n`;
        });
    } else {
        statusMsg += "│ 📊 Aucun score encore...\n";
    }
    const roundNumber = game.eliminatedPlayers.length + 1;
    statusMsg += `│
│ 🎮 Manche n°${roundNumber}
│ ⚡ Prochaine question dans 5 secondes...
│
╰════════════════════════⬣`;
    sock.sendMessage(jid, {
        text: statusMsg,
        mentions: [...game.alivePlayers, ...game.eliminatedPlayers]
    });
}
function endLastCryGame(jid, sock) {
    const game = lastCryGames.get(jid);
    if (!game) return;
    // Arrêter proprement le jeu
    game.isRunning = false;
    // Nettoyer les timers
    if (game.timer) {
        clearTimeout(game.timer);
        game.timer = null;
    }
    if (game.alivePlayers.length === 1) {
        // Un gagnant
        const winner = game.alivePlayers[0];
        const winnerScore = game.scores[winner] || 0;
        const totalPlayers = game.eliminatedPlayers.length + 1;
        sock.sendMessage(jid, {
            text: `╭───〔 👑 VICTOIRE ÉPIQUE 👑 〕───⬣
│
│ 🏆 @${winner.split('@')[0]}
│
│ 🔥 DERNIER SURVIVANT ! 🔥
│ 😈 TU AS ÉCRASÉ TOUT LE MONDE !
│
│ 💯 Score final : ${winnerScore} point${winnerScore > 1 ? 's' : ''}
│ 🎮 Joueurs éliminés : ${game.eliminatedPlayers.length}
│ 👥 Total participants : ${totalPlayers}
│
│ 🌟 TU ES LE CHAMPION DU LAST CRY !
│ 🎊 FÉLICITATIONS ! 🎊
│
╰════════════════════════⬣`,
            mentions: [winner]
        });
    } else {
        // Aucun gagnant
        sock.sendMessage(jid, {
            text: `╭───〔 💀 CATASTROPHE FINALE 💀 〕───⬣
│
│ 😱 PERSONNE N'A SURVÉCU !
│
│ 🔥 Le jeu a détruit tout le monde...
│ 💀 Tous les joueurs ont été éliminés
│
│ 😈 Le Last Cry est impitoyable...
│ ⚡ Personne n'a résisté à la pression !
│
│ 🎮 Éliminés : ${game.eliminatedPlayers.length}
│ 🕯️ Aucun survivant cette fois...
│
╰════════════════════════⬣`
        });
    }
    // Nettoyer complètement le jeu
    lastCryGames.delete(jid);
}
function handleLastCryAnswer(jid, sock, msg, text) {
    const game = lastCryGames.get(jid);
    if (!game || !game.isRunning) return;
    const playerId = msg.key.participant;
    // Ignorer si le joueur n'est pas en vie
    if (!game.alivePlayers.includes(playerId)) return;
    // Ignorer si déjà répondu
    if (game.answered.includes(playerId)) return;
    // Vérifier si la réponse est valide (non vide et minimum 2 caractères)
    const cleanText = text.toLowerCase().trim();
    if (cleanText.length < 2) {
        // Réponse trop courte, ignorer silencieusement
        return;
    }
    // IGNORER si le joueur répète la question (anti-triche)
    const questionText = game.currentQuestion.question.toLowerCase().trim();
    if (cleanText === questionText || cleanText.includes(questionText.substring(0, 10))) {
        // Le joueur répète la question, ignorer
        return;
    }
    // Ajouter aux réponses
    game.answered.push(playerId);
    // Vérifier la réponse
    const isCorrect = checkLastCryAnswer(cleanText, game.currentQuestion);
    // LOGIQUE CORRIGÉ : Seulement le premier correct gagne +1 point
    if (isCorrect) {
        // Vérifier si c'est la première réponse correcte
        const correctAnswers = game.answered.filter(p => {
            // Simuler la vérification pour chaque joueur déjà répondu
            return true; // On simplifie ici
        });
        if (game.answered.length === 1 && isCorrect) {
            // Premier joueur ET réponse correcte = +1 point
            game.scores[playerId] = (game.scores[playerId] || 0) + 1;
        } else {
            // Réponse correcte mais pas premier = 0 point
            // Ne change pas le score
        }
    } else {
        // Mauvaise réponse = -1 point
        game.scores[playerId] = Math.max(0, (game.scores[playerId] || 0) - 1);
    }
    // Stocker le feedback pour l'afficher plus tard (réduit le flood)
    if (!game.feedbackBuffer) {
        game.feedbackBuffer = [];
    }
    game.feedbackBuffer.push({
        playerId: playerId,
        isCorrect: isCorrect,
        isFirstCorrect: game.answered.length === 1 && isCorrect
    });
}
// Fonctions utilitaires
// Questions de Culture Générale (QCM) - PLUS DE 100 QUESTIONS
const cultureQuestions = [
    // GÉOGRAPHIE (20 questions)
    {
        question: "Quel est le plus petit pays du monde ?",
        options: ["A) Monaco", "B) Vatican", "C) Saint-Marin", "D) Liechtenstein"],
        correct: "B",
        explanation: "Le Vatican mesure seulement 0,44 km² et compte moins de 1000 habitants."
    },
    {
        question: "Quel est le plus grand pays du monde ?",
        options: ["A) Chine", "B) États-Unis", "C) Russie", "D) Canada"],
        correct: "C",
        explanation: "La Russie est le plus grand pays avec 17,1 millions de km²."
    },
    {
        question: "Quelle est la capitale de l'Australie ?",
        options: ["A) Sydney", "B) Melbourne", "C) Canberra", "D) Brisbane"],
        correct: "C",
        explanation: "Canberra est la capitale de l'Australie depuis 1913."
    },
    {
        question: "Quel fleuve traverse Paris ?",
        options: ["A) Le Rhône", "B) La Seine", "C) La Loire", "D) Le Rhin"],
        correct: "B",
        explanation: "La Seine traverse Paris sur environ 13 km."
    },
    {
        question: "Quelle est la plus haute montagne du monde ?",
        options: ["A) K2", "B) Mont Everest", "C) Kangchenjunga", "D) Lhotse"],
        correct: "B",
        explanation: "L'Everest culmine à 8 848 mètres d'altitude."
    },
    {
        question: "Quel est le désert le plus chaud du monde ?",
        options: ["A) Sahara", "B) Gobi", "C) Kalahari", "D) Atacama"],
        correct: "A",
        explanation: "Le Sahara est le plus grand désert chaud avec 9,2 millions de km²."
    },
    {
        question: "Quelle est la capitale du Japon ?",
        options: ["A) Osaka", "B) Kyoto", "C) Tokyo", "D) Nagoya"],
        correct: "C",
        explanation: "Tokyo est la capitale du Japon depuis 1868."
    },
    {
        question: "Combien de continents y a-t-il ?",
        options: ["A) 5", "B) 6", "C) 7", "D) 8"],
        correct: "C",
        explanation: "Il y a 7 continents : Afrique, Antarctique, Asie, Europe, Amérique du Nord, Océanie, Amérique du Sud."
    },
    {
        question: "Quel est l'océan le plus profond ?",
        options: ["A) Atlantique", "B) Indien", "C) Pacifique", "D) Arctique"],
        correct: "C",
        explanation: "L'océan Pacifique atteint 11 034 m de profondeur dans la fosse des Mariannes."
    },
    {
        question: "Quelle est la capitale du Brésil ?",
        options: ["A) Rio de Janeiro", "B) São Paulo", "C) Brasília", "D) Salvador"],
        correct: "C",
        explanation: "Brasília est devenue la capitale en 1960."
    },
    {
        question: "Quel pays a la plus grande population ?",
        options: ["A) Inde", "B) Chine", "C) États-Unis", "D) Indonésie"],
        correct: "B",
        explanation: "La Chine compte environ 1,4 milliard d'habitants."
    },
    {
        question: "Quelle est la capitale de l'Italie ?",
        options: ["A) Milan", "B) Naples", "C) Rome", "D) Florence"],
        correct: "C",
        explanation: "Rome est la capitale de l'Italie depuis 1871."
    },
    {
        question: "Quel est le plus long fleuve du monde ?",
        options: ["A) Amazone", "B) Nil", "C) Mississippi", "D) Yangtsé"],
        correct: "B",
        explanation: "Le Nil mesure environ 6 650 km."
    },
    {
        question: "Quelle est la capitale de l'Espagne ?",
        options: ["A) Barcelone", "B) Madrid", "C) Valence", "D) Séville"],
        correct: "B",
        explanation: "Madrid est la capitale de l'Espagne depuis 1561."
    },
    {
        question: "Quel pays est à la fois en Europe et en Asie ?",
        options: ["A) Russie", "B) Ukraine", "C) Pologne", "D) Allemagne"],
        correct: "A",
        explanation: "La Russie s'étend sur deux continents : l'Europe et l'Asie."
    },
    {
        question: "Quelle est la capitale du Canada ?",
        options: ["A) Toronto", "B) Vancouver", "C) Montréal", "D) Ottawa"],
        correct: "D",
        explanation: "Ottawa est la capitale du Canada depuis 1857."
    },
    {
        question: "Quel est le plus petit État des États-Unis ?",
        options: ["A) Rhode Island", "B) Delaware", "C) Connecticut", "D) Hawaï"],
        correct: "A",
        explanation: "Rhode Island est le plus petit État avec 3 144 km²."
    },
    {
        question: "Quelle mer est la plus salée ?",
        options: ["A) Mer Rouge", "B) Mer Morte", "C) Méditerranée", "D) Mer Noire"],
        correct: "B",
        explanation: "La Mer Morte a une salinité de 34%, presque 10 fois plus que la mer."
    },
    {
        question: "Quelle est la capitale de l'Égypte ?",
        options: ["A) Alexandrie", "B) Louxor", "C) Le Caire", "D) Gizeh"],
        correct: "C",
        explanation: "Le Caire est la capitale de l'Égypte et la plus grande ville du monde arabe."
    },
    {
        question: "Quel détroit sépare l'Europe de l'Afrique ?",
        options: ["A) Détroit de Gibraltar", "B) Détroit du Bosphore", "C) Détroit de Messine", "D) Détroit d'Ormuz"],
        correct: "A",
        explanation: "Le détroit de Gibraltar sépare l'Espagne du Maroc."
    },
    {
        question: "En quelle année a débuté la Révolution française ?",
        options: ["A) 1787", "B) 1789", "C) 1791", "D) 1793"],
        correct: "B",
        explanation: "La Révolution française a débuté en 1789 avec la prise de la Bastille le 14 juillet."
    },
    {
        question: "Qui était le premier empereur romain ?",
        options: ["A) Jules César", "B) Auguste", "C) Néron", "D) Marc Aurèle"],
        correct: "B",
        explanation: "Auguste (Octave) est considéré comme le premier empereur romain de 27 av. J.-C. à 14 ap. J.-C."
    },
    {
        question: "En quelle année Christophe Colomb a-t-il découvert l'Amérique ?",
        options: ["A) 1490", "B) 1492", "C) 1494", "D) 1496"],
        correct: "B",
        explanation: "Christophe Colomb a atteint l'Amérique le 12 octobre 1492."
    },
    {
        question: "Combien de temps a duré la Première Guerre mondiale ?",
        options: ["A) 1912-1916", "B) 1914-1918", "C) 1916-1920", "D) 1918-1922"],
        correct: "B",
        explanation: "La Première Guerre mondiale a duré de 1914 à 1918."
    },
    {
        question: "Qui a peint la chapelle Sixtine ?",
        options: ["A) Raphaël", "B) Léonard de Vinci", "C) Michel-Ange", "D) Botticelli"],
        correct: "C",
        explanation: "Michel-Ange a peint le plafond de la chapelle Sixtine entre 1508 et 1512."
    },
    {
        question: "En quelle année est tombé le Mur de Berlin ?",
        options: ["A) 1987", "B) 1989", "C) 1991", "D) 1993"],
        correct: "B",
        explanation: "Le Mur de Berlin est tombé le 9 novembre 1989."
    },
    {
        question: "Qui a inventé l'imprimerie ?",
        options: ["A) Gutenberg", "B) Bell", "C) Edison", "D) Watt"],
        correct: "A",
        explanation: "Johannes Gutenberg a inventé l'imprimerie à caractères mobiles vers 1440."
    },
    {
        question: "Quelle dynastie a construit la Grande Muraille ?",
        options: ["A) Han", "B) Tang", "C) Ming", "D) Qing"],
        correct: "C",
        explanation: "La dynastie Ming a construit la plupart de la Grande Muraille actuelle."
    },
    {
        question: "En quelle année a eu lieu la Déclaration d'indépendance américaine ?",
        options: ["A) 1774", "B) 1776", "C) 1778", "D) 1780"],
        correct: "B",
        explanation: "La Déclaration d'indépendance a été signée le 4 juillet 1776."
    },
    {
        question: "Qui a écrit 'Les Misérables' ?",
        options: ["A) Balzac", "B) Zola", "C) Hugo", "D) Flaubert"],
        correct: "C",
        explanation: "Victor Hugo a écrit 'Les Misérables' publié en 1862."
    },
    {
        question: "Quel président américain a aboli l'esclavage ?",
        options: ["A) George Washington", "B) Thomas Jefferson", "C) Abraham Lincoln", "D) Andrew Johnson"],
        correct: "C",
        explanation: "Abraham Lincoln a aboli l'esclavage par le 13e amendement en 1865."
    },
    {
        question: "En quelle année l'homme a-t-il marché sur la Lune ?",
        options: ["A) 1965", "B) 1967", "C) 1969", "D) 1971"],
        correct: "C",
        explanation: "Neil Armstrong a marché sur la Lune le 21 juillet 1969."
    },
    {
        question: "Qui était le premier roi de France ?",
        options: ["A) Clovis", "B) Charlemagne", "C) Hugues Capet", "D) Louis XIV"],
        correct: "A",
        explanation: "Clovis est considéré comme le premier roi de France (481-511)."
    },
    {
        question: "Quelle civilisation a construit Machu Picchu ?",
        options: ["A) Aztèque", "B) Maya", "C) Inca", "D) Olmèque"],
        correct: "C",
        explanation: "Les Incas ont construit Machu Picchu au XVe siècle."
    },
    {
        question: "Qui a découvert la pénicilline ?",
        options: ["A) Pasteur", "B) Fleming", "C) Curie", "D) Koch"],
        correct: "B",
        explanation: "Alexander Fleming a découvert la pénicilline en 1928."
    },
    {
        question: "En quelle année Napoléon est-il mort ?",
        options: ["A) 1815", "B) 1821", "C) 1830", "D) 1840"],
        correct: "B",
        explanation: "Napoléon Bonaparte est mort le 5 mai 1821 à Sainte-Hélène."
    },
    {
        question: "Quel était le nom du premier satellite artificiel ?",
        options: ["A) Explorer 1", "B) Spoutnik 1", "C) Vanguard 1", "D) Telstar 1"],
        correct: "B",
        explanation: "Spoutnik 1 a été lancé par l'URSS le 4 octobre 1957."
    },
    {
        question: "Qui a peint la Joconde ?",
        options: ["A) Michel-Ange", "B) Raphaël", "C) Léonard de Vinci", "D) Botticelli"],
        correct: "C",
        explanation: "Léonard de Vinci a peint la Joconde entre 1503 et 1506."
    },
    {
        question: "En quelle année la Tour Eiffel a-t-elle été inaugurée ?",
        options: ["A) 1887", "B) 1889", "C) 1891", "D) 1900"],
        correct: "B",
        explanation: "La Tour Eiffel a été inaugurée le 31 mars 1889."
    },
    {
        question: "Qui a écrit 'Romeo et Juliette' ?",
        options: ["A) Molière", "B) Shakespeare", "C) Victor Hugo", "D) Goethe"],
        correct: "B",
        explanation: "William Shakespeare a écrit Romeo et Juliette vers 1597."
    },
    {
        question: "Quelle est la vitesse de la lumière dans le vide ?",
        options: ["A) 299 792 km/s", "B) 150 000 km/s", "C) 500 000 km/s", "D) 1 000 000 km/s"],
        correct: "A",
        explanation: "La lumière voyage à environ 299,792 km par seconde dans le vide."
    },
    {
        question: "Quel est l'élément chimique le plus abondant dans l'univers ?",
        options: ["A) Carbone", "B) Oxygène", "C) Hydrogène", "D) Azote"],
        correct: "C",
        explanation: "L'hydrogène constitue environ 75% de la masse de l'univers."
    },
    {
        question: "Combien y a-t-il d'os dans le corps humain adulte ?",
        options: ["A) 106", "B) 206", "C) 306", "D) 406"],
        correct: "B",
        explanation: "Le corps humain adulte contient 206 os."
    },
    {
        question: "Quelle planète est connue comme la 'Planète Rouge' ?",
        options: ["A) Vénus", "B) Mars", "C) Jupiter", "D) Saturne"],
        correct: "B",
        explanation: "Mars apparaît rouge à cause de l'oxyde de fer sur sa surface."
    },
    {
        question: "Quel est le plus grand organe du corps humain ?",
        options: ["A) Cerveau", "B) Foie", "C) Cœur", "D) Peau"],
        correct: "D",
        explanation: "La peau est le plus grand organe avec environ 2m² chez un adulte."
    },
    {
        question: "Quelle est la température d'ébullition de l'eau à niveau de la mer ?",
        options: ["A) 90°C", "B) 100°C", "C) 110°C", "D) 120°C"],
        correct: "B",
        explanation: "L'eau bout à 100°C (212°F) au niveau de la mer."
    },
    {
        question: "Combien de planètes dans notre système solaire ?",
        options: ["A) 7", "B) 8", "C) 9", "D) 10"],
        correct: "B",
        explanation: "Il y a 8 planètes après que Pluton ait été reclassée en 2006."
    },
    {
        question: "Quel gaz les plantes produisent-elles ?",
        options: ["A) Azote", "B) Oxygène", "C) Dioxyde de carbone", "D) Hydrogène"],
        correct: "B",
        explanation: "Les plantes produisent de l'oxygène par photosynthèse."
    },
    {
        question: "Quelle est l'unité SI de force ?",
        options: ["A) Joule", "B) Watt", "C) Newton", "D) Pascal"],
        correct: "C",
        explanation: "Le Newton est l'unité SI de force, nommé d'après Isaac Newton."
    },
    {
        question: "Quel est le symbole chimique de l'or ?",
        options: ["A) Au", "B) Ag", "C) Go", "D) Fe"],
        correct: "A",
        explanation: "Au vient du latin 'aurum' signifiant or."
    },
    {
        question: "Combien de chromosomes a un humain ?",
        options: ["A) 23", "B) 46", "C) 48", "D) 52"],
        correct: "B",
        explanation: "Les humains ont 46 chromosomes (23 paires)."
    },
    {
        question: "Quel est l'animal le plus rapide sur terre ?",
        options: ["A) Lion", "B) Guépard", "C) Antilope", "D) Cheval"],
        correct: "B",
        explanation: "Le guépard peut atteindre 110 km/h."
    },
    {
        question: "Quel est le plus grand animal du monde ?",
        options: ["A) Éléphant", "B) Baleine bleue", "C) Requin baleine", "D) Girafe"],
        correct: "B",
        explanation: "La baleine bleue peut atteindre 30 mètres et 200 tonnes."
    },
    {
        question: "Quel est le seul mammifère capable de voler ?",
        options: ["A) Écureuil volant", "B) Chauve-souris", "C) Oiseau", "D) Papillon"],
        correct: "B",
        explanation: "La chauve-souris est le seul mammifère capable de voler activement."
    },
    {
        question: "Combien de dents a un adulte ?",
        options: ["A) 28", "B) 30", "C) 32", "D) 34"],
        correct: "C",
        explanation: "Un adulte a normalement 32 dents (dont les dents de sagesse)."
    },
    {
        question: "Quel est le plus grand organe du corps humain ?",
        options: ["A) Cœur", "B) Foie", "C) Peau", "D) Poumons"],
        correct: "C",
        explanation: "La peau est le plus grand organe avec environ 2 m²."
    },
    {
        question: "Combien de temps met la Terre pour tourner autour du Soleil ?",
        options: ["A) 300 jours", "B) 365 jours", "C) 400 jours", "D) 450 jours"],
        correct: "B",
        explanation: "La Terre met environ 365,25 jours pour faire le tour du Soleil."
    },
    {
        question: "Quel est le métal le plus léger ?",
        options: ["A) Aluminium", "B) Lithium", "C) Magnésium", "D) Titane"],
        correct: "B",
        explanation: "Le lithium est le métal le plus léger avec une densité de 0,534."
    },
    {
        question: "Quel est le point le plus profond des océans ?",
        options: ["A) Fosse des Mariannes", "B) Fosse de Porto Rico", "C) Fosse du Japon", "D) Fosse des Kouriles"],
        correct: "A",
        explanation: "La fosse des Mariannes atteint 11 034 mètres de profondeur."
    },
    {
        question: "Combien d'os a un bébé ?",
        options: ["A) 206", "B) 250", "C) 270", "D) 300"],
        correct: "D",
        explanation: "Un bébé naît avec environ 300 os qui fusionnent en grandissant."
    },
    // 🎨 ARTS ET CULTURE (20 questions)
    {
        question: "Qui a composé la Symphonie n°5 ?",
        options: ["A) Mozart", "B) Beethoven", "C) Bach", "D) Tchaïkovski"],
        correct: "B",
        explanation: "Beethoven a composé sa célèbre Symphonie n°5 en 1808."
    },
    {
        question: "Quel est le livre le plus vendu au monde ?",
        options: ["A) Le Seigneur des Anneaux", "B) Harry Potter", "C) La Bible", "D) Le Petit Prince"],
        correct: "C",
        explanation: "La Bible est le livre le plus vendu avec environ 5 milliards d'exemplaires."
    },
    {
        question: "Qui a écrit '1984' ?",
        options: ["A) Aldous Huxley", "B) George Orwell", "C) Ray Bradbury", "D) H.G. Wells"],
        correct: "B",
        explanation: "George Orwell a écrit 1984 publié en 1949."
    },
    {
        question: "Dans quelle ville se trouve le Louvre ?",
        options: ["A) Londres", "B) Paris", "C) Rome", "D) Berlin"],
        correct: "B",
        explanation: "Le musée du Louvre se trouve à Paris."
    },
    {
        question: "Qui a écrit 'Hamlet' ?",
        options: ["A) Molière", "B) Shakespeare", "C) Victor Hugo", "D) Goethe"],
        correct: "B",
        explanation: "William Shakespeare a écrit Hamlet vers 1600."
    },
    {
        question: "Quel instrument jouait Mozart ?",
        options: ["A) Violon", "B) Piano", "C) Flûte", "D) Tous ces instruments"],
        correct: "D",
        explanation: "Mozart jouait du violon, du piano, de l'alto et du clavecin."
    },
    {
        question: "Qui a peint 'La Nuit étoilée' ?",
        options: ["A) Van Gogh", "B) Picasso", "C) Monet", "D) Renoir"],
        correct: "A",
        explanation: "Vincent Van Gogh a peint La Nuit étoilée en 1889."
    },
    {
        question: "Quel est le plus grand musée du monde ?",
        options: ["A) Louvre", "B) British Museum", "C) Hermitage", "D) Metropolitan Museum"],
        correct: "A",
        explanation: "Le Louvre est le plus grand musée d'art au monde."
    },
    {
        question: "Qui a écrit 'Les Trois Mousquetaires' ?",
        options: ["A) Victor Hugo", "B) Alexandre Dumas", "C) Jules Verne", "D) Émile Zola"],
        correct: "B",
        explanation: "Alexandre Dumas a écrit Les Trois Mousquetaires en 1844."
    },
    {
        question: "Quel est le nom de la célèbre statue de la Renaissance à Florence ?",
        options: ["A) Le Pensier", "B) David", "C) Moïse", "D) La Pietà"],
        correct: "B",
        explanation: "Le David de Michel-Ange se trouve à Florence."
    },
    {
        question: "Qui a composé 'Le Lac des Cygnes' ?",
        options: ["A) Tchaïkovski", "B) Stravinsky", "C) Prokofiev", "D) Rimski-Korsakov"],
        correct: "A",
        explanation: "Tchaïkovski a composé Le Lac des Cygnes en 1876."
    },
    {
        question: "Quel est le plus ancien monument de Paris ?",
        options: ["A) Tour Eiffel", "B) Notre-Dame", "C) Arènes de Lutèce", "D) Arc de Triomphe"],
        correct: "C",
        explanation: "Les Arènes de Lutèce datent du 1er siècle après J.-C."
    },
    {
        question: "Qui a écrit 'Le Petit Prince' ?",
        options: ["A) Saint-Exupéry", "B) Jules Verne", "C) André Gide", "D) Marcel Proust"],
        correct: "A",
        explanation: "Antoine de Saint-Exupéry a écrit Le Petit Prince en 1943."
    },
    {
        question: "Quel peintre est connu pour ses nymphéas ?",
        options: ["A) Renoir", "B) Monet", "C) Degas", "D) Cézanne"],
        correct: "B",
        explanation: "Claude Monet a peint les Nymphéas à Giverny."
    },
    {
        question: "Qui a construit la Pyramide du Louvre ?",
        options: ["A) I.M. Pei", "B) Le Corbusier", "C) Eiffel", "D) Haussmann"],
        correct: "A",
        explanation: "L'architecte I.M. Pei a conçu la pyramide du Louvre inaugurée en 1989."
    },
    {
        question: "Quel compositeur était sourd ?",
        options: ["A) Mozart", "B) Beethoven", "C) Bach", "D) Chopin"],
        correct: "B",
        explanation: "Beethoven a commencé à perdre l'ouïe à 26 ans et est devenu complètement sourd."
    },
    {
        question: "Qui a écrit 'Germinal' ?",
        options: ["A) Zola", "B) Balzac", "C) Flaubert", "D) Maupassant"],
        correct: "A",
        explanation: "Émile Zola a écrit Germinal en 1885."
    },
    {
        question: "Quel est le tableau le plus célèbre de Picasso ?",
        options: ["A) Les Demoiselles d'Avignon", "B) Guernica", "C) La Vie", "D) Le Rêve"],
        correct: "B",
        explanation: "Guernica (1937) est l'une des œuvres les plus célèbres de Picasso."
    },
    {
        question: "Où se trouve le cénotaphe de Léonard de Vinci ?",
        options: ["A) Florence", "B) Milan", "C) Amboise", "D) Rome"],
        correct: "C",
        explanation: "Léonard de Vinci est mort à Amboise et repose au château d'Amboise."
    },
    // RECORDS (20 questions)
    {
        question: "Quel est le pays le plus peuplé du monde ?",
        options: ["A) Inde", "B) Chine", "C) États-Unis", "D) Indonésie"],
        correct: "B",
        explanation: "La Chine est le pays le plus peuplé avec environ 1,4 milliard d'habitants."
    },
    {
        question: "Quel est le plus grand océan ?",
        options: ["A) Atlantique", "B) Indien", "C) Pacifique", "D) Arctique"],
        correct: "C",
        explanation: "L'océan Pacifique couvre 165 millions de km²."
    },
    {
        question: "Quel est le plus haut gratte-ciel du monde ?",
        options: ["A) Burj Khalifa", "B) Shanghai Tower", "C) Abraj Al Bait", "D) One World Trade Center"],
        correct: "A",
        explanation: "Le Burj Khalifa à Dubaï mesure 828 mètres."
    },
    {
        question: "Quelle est la plus grande île du monde ?",
        options: ["A) Australie", "B) Groenland", "C) Nouvelle-Guinée", "D) Bornéo"],
        correct: "B",
        explanation: "Le Groenland est la plus grande île avec 2,1 millions de km²."
    },
    {
        question: "Quel est le désert le plus grand ?",
        options: ["A) Sahara", "B) Antarctique", "C) Arctique", "D) Gobi"],
        correct: "B",
        explanation: "L'Antarctique est le plus grand désert avec 14 millions de km²."
    },
    {
        question: "Quelle est la plus haute chute d'eau ?",
        options: ["A) Niagara", "B) Angel Falls", "C) Victoria", "D) Iguazú"],
        correct: "B",
        explanation: "Le Salto Ángel au Venezuela mesure 979 mètres."
    },
    {
        question: "Quel est le plus long métro du monde ?",
        options: ["A) Moscou", "B) Londres", "C) New York", "D) Shanghai"],
        correct: "D",
        explanation: "Le métro de Shanghai est le plus long avec 802 km."
    },
    {
        question: "Quelle est la plus grande cathédrale du monde ?",
        options: ["A) Saint-Pierre de Rome", "B) Notre-Dame de Paris", "C) Saint-Paul de Londres", "D) Séville"],
        correct: "A",
        explanation: "La basilique Saint-Pierre est la plus grande église avec 23 000 m²."
    },
    {
        question: "Quel est le stade le plus grand du monde ?",
        options: ["A) Maracanã", "B) Wembley", "C) Rungrado", "D) Camp Nou"],
        correct: "C",
        explanation: "Le stade Rungrado en Corée du Nord peut accueillir 150 000 personnes."
    },
    {
        question: "Quelle est la plus grande bibliothèque du monde ?",
        options: ["A) British Library", "B) Library of Congress", "C) Bibliothèque nationale de France", "D) Bibliothèque nationale de Russie"],
        correct: "B",
        explanation: "La Library of Congress à Washington a plus de 170 millions de documents."
    },
    {
        question: "Quel est le plus grand aéroport du monde ?",
        options: ["A) Atlanta", "B) Pékin", "C) Dubaï", "D) Tokyo"],
        correct: "B",
        explanation: "L'aéroport de Pékin Daxing est le plus grand terminal au monde."
    },
    {
        question: "Quelle est la plus grande gare du monde ?",
        options: ["A) Grand Central Terminal", "B) Gare de Shinjuku", "C) Gare de Beijing", "D) Gare de Leipzig"],
        correct: "B",
        explanation: "La gare de Shinjuku à Tokyo voit passer 3,6 millions de passagers par jour."
    },
    {
        question: "Quel est le plus grand centre commercial du monde ?",
        options: ["A) Dubai Mall", "B) Mall of America", "C) West Edmonton Mall", "D) SM Mall of Asia"],
        correct: "A",
        explanation: "Le Dubai Mall a une superficie de 1,1 million de m²."
    },
    {
        question: "Quelle est la plus grande roue du monde ?",
        options: ["A) London Eye", "B) High Roller", "C) Ain Dubai", "D) Singapore Flyer"],
        correct: "C",
        explanation: "Ain Dubai mesure 250 mètres de haut."
    },
    {
        question: "Quel est le plus long pont du monde ?",
        options: ["A) Pont de Danyang-Kunshan", "B) Pont de Hangzhou", "C) Pont de Chesapeake", "D) Pont de Rio-Niterói"],
        correct: "A",
        explanation: "Le pont de Danyang-Kunshan en Chine mesure 164,8 km."
    },
    {
        question: "Quelle est la plus haute statue du monde ?",
        options: ["A) Statue de la Liberté", "B) Statue de l'Unité", "C) Christ Rédempteur", "D) Mère Patrie"],
        correct: "B",
        explanation: "La Statue de l'Unité en Inde mesure 182 mètres."
    },
    {
        question: "Quel est le plus grand hôtel du monde ?",
        options: ["A) MGM Grand", "B) First World Hotel", "C) Venetian", "D) The Palazzo"],
        correct: "B",
        explanation: "Le First World Hotel en Malaisie a 7 351 chambres."
    },
    {
        question: "Quelle est la plus grande piscine du monde ?",
        options: ["A) San Alfonso del Mar", "B) The Beach at Mandalay Bay", "C) Fleur de Mer", "D) Piscine d'Hammamet"],
        correct: "A",
        explanation: "La piscine de San Alfonso del Mar au Chili fait 1 km de long."
    },
    {
        question: "Quel est le plus grand aquarium du monde ?",
        options: ["A) Georgia Aquarium", "B) Chimelong Ocean Kingdom", "C) S.E.A. Aquarium", "D) Okinawa Churaumi"],
        correct: "B",
        explanation: "Le Chimelong Ocean Kingdom en Chine a 48,7 millions de litres d'eau."
    },
    {
        question: "Quelle est la plus grande forêt du monde ?",
        options: ["A) Amazonie", "B) Forêt du Congo", "C) Forêt de Taïga", "D) Forêt de Bornéo"],
        correct: "A",
        explanation: "La forêt amazonienne couvre 5,5 millions de km²."
    }
];
// Questions DRAPEAUX (corrigé: doublons supprimés)
const drapeauQuestions = [
    { name: "France", description: "Bleu, blanc, rouge vertical", colors: ["bleu", "blanc", "rouge"] },
    { name: "Allemagne", description: "Noir, rouge, jaune horizontal", colors: ["noir", "rouge", "jaune"] },
    { name: "Italie", description: "Vert, blanc, rouge vertical", colors: ["vert", "blanc", "rouge"] },
    { name: "Espagne", description: "Rouge et jaune horizontal avec écusson", colors: ["rouge", "jaune"] },
    { name: "Royaume-Uni", description: "Bleu, rouge, blanc avec croix", colors: ["bleu", "rouge", "blanc"] },
    { name: "Portugal", description: "Vert et rouge vertical avec écusson", colors: ["vert", "rouge"] },
    { name: "Pays-Bas", description: "Rouge, blanc, bleu horizontal", colors: ["rouge", "blanc", "bleu"] },
    { name: "Belgique", description: "Noir, jaune, rouge vertical", colors: ["noir", "jaune", "rouge"] },
    { name: "Suisse", description: "Rouge avec croix blanche", colors: ["rouge", "blanc"] },
    { name: "Autriche", description: "Rouge et blanc horizontal", colors: ["rouge", "blanc"] },
    { name: "Pologne", description: "Blanc et rouge horizontal", colors: ["blanc", "rouge"] },
    { name: "Suède", description: "Bleu avec croix jaune", colors: ["bleu", "jaune"] },
    { name: "Norvège", description: "Rouge avec croix bleue et blanche", colors: ["rouge", "bleu", "blanc"] },
    { name: "Danemark", description: "Rouge avec croix blanche", colors: ["rouge", "blanc"] },
    { name: "Finlande", description: "Blanc avec croix bleue", colors: ["blanc", "bleu"] },
    { name: "Grèce", description: "Bleu et blanc horizontal avec croix", colors: ["bleu", "blanc"] },
    { name: "Irlande", description: "Vert, blanc, orange vertical", colors: ["vert", "blanc", "orange"] },
    { name: "Hongrie", description: "Rouge, blanc, vert horizontal", colors: ["rouge", "blanc", "vert"] },
    { name: "République Tchèque", description: "Blanc et rouge horizontal avec triangle bleu", colors: ["blanc", "rouge", "bleu"] },
    { name: "Roumanie", description: "Bleu, jaune, rouge vertical", colors: ["bleu", "jaune", "rouge"] },
    { name: "Japon", description: "Blanc avec cercle rouge central", colors: ["blanc", "rouge"] },
    { name: "Chine", description: "Rouge avec étoiles jaunes", colors: ["rouge", "jaune"] },
    { name: "Inde", description: "Orange, blanc, vert horizontal avec roue", colors: ["orange", "blanc", "vert"] },
    { name: "Corée du Sud", description: "Blanc avec cercle rouge et bleu", colors: ["blanc", "rouge", "bleu"] },
    { name: "Indonésie", description: "Rouge et blanc horizontal", colors: ["rouge", "blanc"] },
    { name: "Thaïlande", description: "Rouge, blanc, bleu horizontal", colors: ["rouge", "blanc", "bleu"] },
    { name: "Malaisie", description: "Rouge et blanc avec croissant et étoiles", colors: ["rouge", "blanc", "jaune"] },
    { name: "Philippines", description: "Bleu, rouge, blanc avec soleil", colors: ["bleu", "rouge", "blanc", "jaune"] },
    { name: "Viêt Nam", description: "Rouge avec étoile jaune", colors: ["rouge", "jaune"] },
    { name: "Pakistan", description: "Vert et blanc avec croissant et étoile", colors: ["vert", "blanc"] },
    { name: "Bangladesh", description: "Vert avec cercle rouge", colors: ["vert", "rouge"] },
    { name: "Sri Lanka", description: "Orange, vert, et jaune avec lion", colors: ["orange", "vert", "jaune"] },
    { name: "Népal", description: "Deux triangles rouges avec symboles bleus", colors: ["rouge", "bleu"] },
    { name: "Cambodge", description: "Bleu et rouge avec temple blanc", colors: ["bleu", "rouge", "blanc"] },
    { name: "Myanmar", description: "Rouge, bleu, blanc avec étoile", colors: ["rouge", "bleu", "blanc"] },
    { name: "Afrique du Sud", description: "Rouge, bleu, vert avec triangles noir et jaune", colors: ["rouge", "bleu", "vert", "noir", "jaune"] },
    { name: "Nigeria", description: "Vert, blanc, vert vertical", colors: ["vert", "blanc"] },
    { name: "Kenya", description: "Noir, rouge, vert avec écusson", colors: ["noir", "rouge", "vert", "blanc"] },
    { name: "Ghana", description: "Rouge, jaune, vert horizontal avec étoile noire", colors: ["rouge", "jaune", "vert", "noir"] },
    { name: "Égypte", description: "Rouge, blanc, noir horizontal avec aigle", colors: ["rouge", "blanc", "noir"] },
    { name: "Maroc", description: "Rouge avec étoile verte", colors: ["rouge", "vert"] },
    { name: "Tunisie", description: "Rouge avec cercle blanc et étoile rouge", colors: ["rouge", "blanc"] },
    { name: "Algérie", description: "Vert et blanc avec croissant et étoile rouges", colors: ["vert", "blanc", "rouge"] },
    { name: "Éthiopie", description: "Vert, jaune, rouge horizontal avec étoile", colors: ["vert", "jaune", "rouge"] },
    { name: "Tanzanie", description: "Vert, jaune, noir, bleu diagonal", colors: ["vert", "jaune", "noir", "bleu"] },
    { name: "Brésil", description: "Vert avec diamant jaune et cercle bleu", colors: ["vert", "jaune", "bleu"] },
    { name: "Canada", description: "Rouge avec feuille d'érable rouge", colors: ["rouge", "blanc"] },
    { name: "Mexique", description: "Vert, blanc, rouge vertical avec aigle", colors: ["vert", "blanc", "rouge"] },
    { name: "Argentine", description: "Bleu et blanc avec soleil", colors: ["bleu", "blanc", "jaune"] },
    { name: "États-Unis", description: "Rouge et blanc avec étoiles bleues", colors: ["rouge", "blanc", "bleu"] },
    { name: "Chili", description: "Bleu, blanc, rouge horizontal avec étoile", colors: ["bleu", "blanc", "rouge"] },
    { name: "Pérou", description: "Rouge et blanc vertical avec écusson", colors: ["rouge", "blanc"] },
    { name: "Colombie", description: "Jaune, bleu, rouge horizontal", colors: ["jaune", "bleu", "rouge"] },
    { name: "Venezuela", description: "Jaune, bleu, rouge horizontal avec étoiles", colors: ["jaune", "bleu", "rouge"] },
    { name: "Australie", description: "Bleu avec étoiles et Union Jack", colors: ["bleu", "rouge", "blanc"] },
    { name: "Nouvelle-Zélande", description: "Bleu avec croix rouge et étoiles", colors: ["bleu", "rouge", "blanc"] },
    { name: "Fidji", description: "Bleu avec croix et écusson", colors: ["bleu", "rouge", "blanc", "jaune"] },
    { name: "Papouasie-Nouvelle-Guinée", description: "Noir et rouge avec oiseaux", colors: ["noir", "rouge", "jaune", "blanc"] },
    { name: "Arabie Saoudite", description: "Vert avec épée et texte blanc", colors: ["vert", "blanc"] },
    { name: "Iran", description: "Vert, blanc, rouge horizontal avec symboles", colors: ["vert", "blanc", "rouge"] },
    { name: "Turquie", description: "Rouge avec croissant et étoile blancs", colors: ["rouge", "blanc"] },
    { name: "Israël", description: "Blanc avec étoile de David bleue", colors: ["blanc", "bleu"] },
    { name: "Émirats Arabes Unis", description: "Rouge, vert, blanc, noir horizontal", colors: ["rouge", "vert", "blanc", "noir"] },
    { name: "Jamaïque", description: "Noir, jaune, vert en croix", colors: ["noir", "jaune", "vert"] },
    { name: "Haïti", description: "Bleu et rouge horizontal avec écusson", colors: ["bleu", "rouge", "blanc"] },
    { name: "Panama", description: "Blanc avec étoile bleue et rouge", colors: ["blanc", "bleu", "rouge"] },
    { name: "Costa Rica", description: "Bleu, blanc, rouge horizontal", colors: ["bleu", "blanc", "rouge"] },
    { name: "Guatemala", description: "Bleu et blanc avec écusson", colors: ["bleu", "blanc"] },
    { name: "Uruguay", description: "Blanc et bleu horizontal avec soleil", colors: ["blanc", "bleu", "jaune"] },
    { name: "Équateur", description: "Jaune, bleu, rouge horizontal avec écusson", colors: ["jaune", "bleu", "rouge"] },
    { name: "Bolivie", description: "Rouge, jaune, vert horizontal avec écusson", colors: ["rouge", "jaune", "vert"] }
];
const monumentQuestions = [
    { name: "Tour Eiffel", pays: "France", description: "Tour métallique de 324m à Paris, construite en 1889, symbole de la France", hauteur: "324m", indice: "Surnommée 'La Dame de Fer'", indice2: "Construite par Gustave Eiffel" },
    { name: "Taj Mahal", pays: "Inde", description: "Mausolée en marbre blanc de 73m, symbole d'amour éternel construit par un empereur", hauteur: "73m", indice: "Situé à Agra", indice2: "Construit par l'empereur Shah Jahan" },
    { name: "Colisée", pays: "Italie", description: "Amphithéâtre romain de 48m à Rome, lieu des combats de gladiateurs", hauteur: "48m", indice: "Construit en 80 ap. J.-C.", indice2: "Surnommé 'Amphithéâtre Flavien'" },
    { name: "Pyramides de Gizeh", pays: "Égypte", description: "Monuments funéraires de 146m, tombeaux des pharaons près du Caire", hauteur: "146m", indice: "Construites il y a 4,500 ans", indice2: "Seule merveille du monde encore existante" },
    { name: "Machu Picchu", pays: "Pérou", description: "Cité inca sur montagne à 2,430m, cité perdue des Incas", altitude: "2,430m", indice: "Découverte en 1911", indice2: "Surnommée 'La Cité perdue des Incas'" },
    { name: "Angkor Wat", pays: "Cambodge", description: "Complexe de temples khmers de 162ha, plus grand monument religieux du monde", superficie: "162ha", indice: "Construit au 12ème siècle", indice2: "Dédicacé au dieu Vishnou" },
    { name: "Sydney Opera House", pays: "Australie", description: "Opéra avec toits en voiles de 1973, forme de coquillages à Sydney", année: "1973", indice: "Conçu par Jørn Utzon", indice2: "Site du concert de 2000" },
    { name: "Golden Gate Bridge", pays: "États-Unis", description: "Pont suspendu rouge de 2,737m, emblème de San Francisco", longueur: "2,737m", indice: "Inauguré en 1937", indice2: "Traverse la baie de San Francisco" },
    { name: "Burj Khalifa", pays: "Émirats Arabes Unis", description: "Gratte-ciel le plus haut du monde à 828m, situé à Dubaï", hauteur: "828m", indice: "163 étages", indice2: "Ouvert en 2010" },
    { name: "Sagrada Familia", pays: "Espagne", description: "Basilique inachevée de Gaudi depuis 1882, œuvre de l'architecte Antoni Gaudí", construction: "1882", indice: "Située à Barcelone", indice2: "Prévue pour être terminée en 2026" },
    { name: "Stonehenge", pays: "Royaume-Uni", description: "Cercle de pierres préhistorique de 5,000 ans, mystérieux cercle de mégalithes", age: "5,000 ans", indice: "Situé dans le Wiltshire", indice2: "Aligné sur les solstices" },
    { name: "Statue de la Liberté", pays: "États-Unis", description: "Statue cuivrée de 93m offerte par la France, symbole de New York", hauteur: "93m", indice: "Tenue par la France", indice2: "Couronne avec 7 pointes" },
    { name: "Mont Rushmore", pays: "États-Unis", description: "Montagne sculptée avec 4 présidents américains dans le Dakota du Sud", hauteur: "18m", indice: "Visages de 18m de haut", indice2: "Construit de 1927 à 1941" },
    { name: "Chichen Itza", pays: "Mexique", description: "Pyramide maya avec 365 marches, site archéologique du Yucatán", hauteur: "30m", indice: "365 marches pour les jours", indice2: "Site du jeu de balle maya" },
    { name: "Teotihuacan", pays: "Mexique", description: "Cité précolombienne avec pyramides du Soleil et de la Lune", superficie: "20km²", indice: "Pyramide du Soleil de 65m", indice2: "Abeille sur les pyramides" },
    { name: "Christ Rédempteur", pays: "Brésil", description: "Statue de 38m bras ouverts sur Corcovado, surplombe Rio", hauteur: "38m", indice: "Bras ouverts de 28m", indice2: "Patrimoine UNESCO" },
    { name: "Moai", pays: "Chili", description: "Statues géantes de pierre sur l'île de Pâques, mystère polynésien", hauteur: "10m", indice: "Île de Pâques", indice2: "Plus de 900 statues" },
    { name: "Notre-Dame", pays: "France", description: "Cathédrale gothique de 850 ans, chef-d'œuvre de l'architecture gothique", hauteur: "69m", indice: "Flèches de 93m", indice2: "Incendie en 2019" },
    { name: "Arc de Triomphe", pays: "France", description: "Arc monumental de 50m sur Champs-Élysées, honore les soldats français", hauteur: "50m", indice: "Napoléon a ordonné sa construction", indice2: "Tombe du Soldat Inconnu" },
    { name: "Versailles", pays: "France", description: "Palais royal de 67,000m² avec jardins, résidence des rois", superficie: "67,000m²", indice: "Jardins de 800ha", indice2: "Galerie des Glaces de 73m" },
    { name: "Tour de Pise", pays: "Italie", description: "Campanile de 56m incliné de 4°, symbole de Pise", hauteur: "56m", indice: "Inclinaison de 4°", indice2: "Construction de 1173-1372" },
    { name: "Alhambra", pays: "Espagne", description: "Palais et forteresse mauresque de 13ha, joyau de l'art islamique", superficie: "13ha", indice: "Palais Nasrides", indice2: "Jardins du Generalife" },
    { name: "Acropole", pays: "Grèce", description: "Citadelle antique de 3ha avec Parthénon, surplombe Athènes", hauteur: "156m", indice: "Parthénon dédié à Athéna", indice2: "Construit au 5ème siècle av. J.-C." },
    { name: "Big Ben", pays: "Royaume-Uni", description: "Tour horloge de 96m au Palais de Westminster, symbole de Londres", hauteur: "96m", indice: "Cloche de 13 tonnes", indice2: "Sonne toutes les heures" },
    { name: "Westminster Abbey", pays: "Royaume-Uni", description: "Abbaye gothique de 700 ans, lieu des couronnements britanniques", age: "700 ans", indice: "Style gothique", indice2: "Tombe de monarques" },
    { name: "Château de Neuschwanstein", pays: "Allemagne", description: "Château de conte de fées de 1869, inspiré Disney", hauteur: "100m", indice: "Château de Louis II", indice2: "1.4 million de visiteurs/an" },
    { name: "Porte de Brandebourg", pays: "Allemagne", description: "Porte monumentale de 26m, symbole de Berlin et de l'unité", hauteur: "26m", indice: "Construite en 1791", indice2: "Style néoclassique" },
    { name: "Cité Interdite", pays: "Chine", description: "Palais impérial de 720,000m², résidence des empereurs", superficie: "720,000m²", indice: "9999 pièces", indice2: "Couleur jaune impériale" },
    { name: "Angkor Wat", pays: "Cambodge", description: "Temple khmer de 162ha, plus grand monument religieux", superficie: "162ha", indice: "Style architectural unique", indice2: "Représente le Mont Meru" },
    { name: "Pétra", pays: "Jordanie", description: "Cité taillée dans la roche rose il y a 2000 ans", age: "2000 ans", indice: "Surnommée Rose du Désert", indice2: "Capitale nabatéenne" },
    { name: "Ganges", pays: "Inde", description: "Fleuve sacré de 2,525km, lieu de pèlerinage hindou", longueur: "2,525km", indice: "Fleuve sacré", indice2: "7 villes saintes" },
    { name: "Temple d'Or", pays: "Inde", description: "Temple sikh doré avec marbre et pierres précieuses", hauteur: "15m", indice: "Amritsar", indice2: "Recouvert d'or pur" },
    { name: "Torii d'Itsukushima", pays: "Japon", description: "Porte torii flottante de 16m, site sacré shintoïste", hauteur: "16m", indice: "Île sacrée de Miyajima", indice2: "Marée haute/flottante" },
    { name: "Mont Fuji", pays: "Japon", description: "Volcan de 3,776m, montagne sacrée et symbole", hauteur: "3,776m", indice: "Volcan actif", indice2: "Sacré pour shintoïstes et bouddhistes" },
    { name: "Temple du Ciel", pays: "Chine", description: "Autel impérial de 273ha, lieu de sacrifices", superficie: "273ha", indice: "Architecture unique", indice2: "Symbole cosmologique" },
    { name: "Abou Simbel", pays: "Égypte", description: "Temples taillés dans la roche de Ramsès II, déplacés", hauteur: "20m", indice: "Statues de 20m", indice2: "Déplacés en 1960" },
    { name: "Karnak", pays: "Égypte", description: "Complexe de temples de 200ha, plus grand site antique", superficie: "200ha", indice: "134 colonnes", indice2: "Construit sur 1500 ans" },
    { name: "Mosquée Hassan II", pays: "Maroc", description: "Grande mosquée de 200m sur l'océan, minaret le plus haut", hauteur: "200m", indice: "Sur l'Atlantique", indice2: "25,000 fidèles" },
    { name: "Great Zimbabwe", pays: "Zimbabwe", description: "Ruines médiévales de pierres, ancienne capitale", superficie: "7.8ha", indice: "Murs de 11m", indice2: "XIe-XVe siècle" },
    { name: "Lalibela", pays: "Éthiopie", description: "Églises taillées dans la roche, Jérusalem noire", profondeur: "13m", indice: "11 églises", indice2: "XIIe siècle" },
    { name: "Dôme du Rocher", pays: "Israël", description: "Sanctuaire islamique de 20m avec dôme doré", hauteur: "20m", indice: "Mont du Temple", indice2: "Dôme doré" },
    { name: "Mur des Lamentations", pays: "Israël", description: "Mur de prière juif de 19m, vestige du Temple", longueur: "19m", indice: "Mur occidental", indice2: "Site saint juif" },
    { name: "Mausolée d'Alexandre", pays: "Égypte", description: "Tombeau supposé d'Alexandre le Grand", localisation: "Alexandrie", indice: "Perdu", indice2: "Merveille antique" },
    { name: "Uluru", pays: "Australie", description: "Monolithe sacré de 348m, site aborigène", hauteur: "348m", indice: "Rochure de 600 millions d'années", indice2: "Sacré aborigène" },
    { name: "Great Barrier Reef", pays: "Australie", description: "Récif corallien de 2,300km, plus grand au monde", longueur: "2,300km", indice: "Patrimoine UNESCO", indice2: "400 types de coraux" },
    { name: "Moai de Rapa Nui", pays: "Chili", description: "Statues de pierre de l'île de Pâques, mystère polynésien", hauteur: "10m", indice: "900 statues", indice2: "Transport mystérieux" },
    { name: "Tour Shanghai", pays: "Chine", description: "Gratte-ciel de 632m, plus haut de Chine", hauteur: "632m", indice: "128 étages", indice2: "Observatoire à 561m" },
    { name: "Abraj Al-Bait", pays: "Arabie", description: "Tour horloge de 601m à La Mecque", hauteur: "601m", indice: "Plus grande horloge", indice2: "Face à la Kaaba" },
    { name: "One World Trade", pays: "États-Unis", description: "Tour de 541m à NYC, plus haut de l'Ouest", hauteur: "541m", indice: "1776 pieds", indice2: "Mémorial du 11/9" },
    { name: "Taipei 101", pays: "Taïwan", description: "Tour de 508m avec 8 étages de pagode", hauteur: "508m", indice: "101 étages", indice2: "Style post-moderne" },
    { name: "Pompéi", pays: "Italie", description: "Cité romaine préservée par l'éruption du Vésuve", superficie: "66ha", indice: "Ensevelie en 79 ap. J.-C.", indice2: "2.5 millions de visiteurs/an" },
    { name: "Tikal", pays: "Guatemala", description: "Cité maya dans la jungle, pyramides impressives", hauteur: "47m", indice: "Temples I-VI", indice2: "Capitale maya" },
    { name: "Ephèse", pays: "Turquie", description: "Cité grecque avec Bibliothèque de Celsus", age: "3000 ans", indice: "Bibliothèque de 25,000 volumes", indice2: "Temple d'Artémis" },
    { name: "Mésopotamie", pays: "Irak", description: "Berceau des civilisations, entre Tigre et Euphrate", superficie: "350,000km²", indice: "Invention de l'écriture", indice2: "5000 ans d'histoire" },
    { name: "Saint-Pierre", pays: "Vatican", description: "Basilique de 136m, plus grande église chrétienne", hauteur: "136m", indice: "Place Saint-Pierre", indice2: "Dôme de Michel-Ange" },
    { name: "Sainte-Sophie", pays: "Turquie", description: "Basilique-byzantine de 56m, chef-d'œuvre architectural", hauteur: "56m", indice: "Dôme de 31m", indice2: "Convertie en mosquée" },
    { name: "Hagia Sophia", pays: "Turquie", description: "Ancienne cathédrale byzantine, mosquée, musée", age: "1500 ans", indice: "Architecture unique", indice2: "Dôme impressionnant" },
    { name: "Borobudur", pays: "Indonésie", description: "Stupa bouddhiste de 35m, plus grand au monde", hauteur: "35m", indice: "504 statues de Bouddha", indice2: "IXe siècle" },
    { name: "Varanasi", pays: "Inde", description: "Ville sainte sur le Ganges, centre spirituel hindou", age: "3000 ans", indice: "Ghats sur le Gange", indice2: "Plus vieille ville habitée" }
]
// Questions SCIENCES
const scienceQuestions = [
    {
        question: "Quelle est la vitesse de la lumière dans le vide ?",
        options: ["A) 299 792 km/s", "B) 150 000 km/s", "C) 500 000 km/s", "D) 1 000 000 km/s"],
        correct: "A",
        explanation: "La lumière voyage à environ 299,792 km par seconde dans le vide."
    },
    {
        question: "Quel est l'élément chimique le plus abondant dans l'univers ?",
        options: ["A) Carbone", "B) Oxygène", "C) Hydrogène", "D) Azote"],
        correct: "C",
        explanation: "L'hydrogène constitue environ 75% de la masse de l'univers."
    },
    {
        question: "Combien y a-t-il d'os dans le corps humain adulte ?",
        options: ["A) 106", "B) 206", "C) 306", "D) 406"],
        correct: "B",
        explanation: "Le corps humain adulte contient 206 os."
    },
    {
        question: "Quelle planète est connue comme la 'Planète Rouge' ?",
        options: ["A) Vénus", "B) Mars", "C) Jupiter", "D) Saturne"],
        correct: "B",
        explanation: "Mars apparaît rouge à cause de l'oxyde de fer sur sa surface."
    },
    {
        question: "Quel est le plus grand organe du corps humain ?",
        options: ["A) Cerveau", "B) Foie", "C) Cœur", "D) Peau"],
        correct: "D",
        explanation: "La peau est le plus grand organe avec environ 2m² chez un adulte."
    },
    {
        question: "Quelle est la température d'ébullition de l'eau à niveau de la mer ?",
        options: ["A) 90°C", "B) 100°C", "C) 110°C", "D) 120°C"],
        correct: "B",
        explanation: "L'eau bout à 100°C (212°F) au niveau de la mer."
    },
    {
        question: "Combien de planètes dans notre système solaire ?",
        options: ["A) 7", "B) 8", "C) 9", "D) 10"],
        correct: "B",
        explanation: "Il y a 8 planètes après que Pluton ait été reclassée en 2006."
    },
    {
        question: "Quel gaz les plantes produisent-elles ?",
        options: ["A) Azote", "B) Oxygène", "C) Dioxyde de carbone", "D) Hydrogène"],
        correct: "B",
        explanation: "Les plantes produisent de l'oxygène par photosynthèse."
    },
    {
        question: "Quelle est l'unité SI de force ?",
        options: ["A) Joule", "B) Watt", "C) Newton", "D) Pascal"],
        correct: "C",
        explanation: "Le Newton est l'unité SI de force, nommé d'après Isaac Newton."
    },
    {
        question: "Quel est le symbole chimique de l'or ?",
        options: ["A) Au", "B) Ag", "C) Go", "D) Fe"],
        correct: "A",
        explanation: "Au vient du latin 'aurum' signifiant or."
    },
    {
        question: "Combien de chromosomes a un humain ?",
        options: ["A) 23", "B) 46", "C) 48", "D) 52"],
        correct: "B",
        explanation: "Les humains ont 46 chromosomes (23 paires)."
    },
    {
        question: "Quel est l'animal le plus rapide sur terre ?",
        options: ["A) Lion", "B) Guépard", "C) Antilope", "D) Cheval"],
        correct: "B",
        explanation: "Le guépard peut atteindre 110 km/h."
    },
    {
        question: "Quel est le plus grand animal du monde ?",
        options: ["A) Éléphant", "B) Baleine bleue", "C) Requin baleine", "D) Girafe"],
        correct: "B",
        explanation: "La baleine bleue peut atteindre 30 mètres et 200 tonnes."
    },
    {
        question: "Quel est le seul mammifère capable de voler ?",
        options: ["A) Écureuil volant", "B) Chauve-souris", "C) Oiseau", "D) Papillon"],
        correct: "B",
        explanation: "La chauve-souris est le seul mammifère capable de voler activement."
    },
    {
        question: "Combien de dents a un adulte ?",
        options: ["A) 28", "B) 30", "C) 32", "D) 34"],
        correct: "C",
        explanation: "Un adulte a normalement 32 dents (dont les dents de sagesse)."
    },
    {
        question: "Combien de temps met la Terre pour tourner autour du Soleil ?",
        options: ["A) 300 jours", "B) 365 jours", "C) 400 jours", "D) 450 jours"],
        correct: "B",
        explanation: "La Terre met environ 365,25 jours pour faire le tour du Soleil."
    },
    {
        question: "Quel est le métal le plus léger ?",
        options: ["A) Aluminium", "B) Lithium", "C) Magnésium", "D) Titane"],
        correct: "B",
        explanation: "Le lithium est le métal le plus léger avec une densité de 0,534."
    },
    {
        question: "Quel est le point le plus profond des océans ?",
        options: ["A) Fosse des Mariannes", "B) Fosse de Porto Rico", "C) Fosse du Japon", "D) Fosse des Kouriles"],
        correct: "A",
        explanation: "La fosse des Mariannes atteint 11 034 mètres de profondeur."
    },
    {
        question: "Combien d'os a un bébé ?",
        options: ["A) 206", "B) 250", "C) 270", "D) 300"],
        correct: "D",
        explanation: "Un bébé naît avec environ 300 os qui fusionnent en grandissant."
    },
    {
        question: "Quel est l'oiseau le plus rapide ?",
        options: ["A) Aigle", "B) Faucon pèlerin", "C) Martinet", "D) Hirondelle"],
        correct: "B",
        explanation: "Le faucon pèlerin atteint 390 km/h en piqué."
    },
    {
        question: "Combien de cœurs a une pieuvre ?",
        options: ["A) 1", "B) 2", "C) 3", "D) 4"],
        correct: "C",
        explanation: "La pieuvre a 3 cœurs : deux pour les branchies et un pour le corps."
    },
    {
        question: "Quel est l'élément le plus abondant sur Terre ?",
        options: ["A) Oxygène", "B) Fer", "C) Silicium", "D) Aluminium"],
        correct: "A",
        explanation: "L'oxygène est l'élément le plus abondant sur Terre (46% de la croûte)."
    },
    {
        question: "Quelle est la vitesse du son dans l'air ?",
        options: ["A) 343 m/s", "B) 500 m/s", "C) 1000 m/s", "D) 1500 m/s"],
        correct: "A",
        explanation: "Le son se déplace à environ 343 m/s dans l'air à 20°C."
    },
    {
        question: "Quel est le plus grand os du corps humain ?",
        options: ["A) Fémur", "B) Tibia", "C) Humérus", "D) Bassin"],
        correct: "A",
        explanation: "Le fémur (os de la cuisse) est le plus long et le plus lourd os du corps."
    },
    {
        question: "Combien de muscles a le corps humain ?",
        options: ["A) Environ 200", "B) Environ 400", "C) Environ 600", "D) Environ 800"],
        correct: "C",
        explanation: "Le corps humain compte environ 600 muscles."
    },
    {
        question: "Quel est le plus petit os du corps humain ?",
        options: ["A) Malléus", "B) Incus", "C) Stapes", "D) Hyoïde"],
        correct: "C",
        explanation: "L'étrier (stapes) dans l'oreille mesure 2,5 à 3 mm."
    },
    {
        question: "Combien de litres de sang le corps humain contient-il ?",
        options: ["A) 2-3 L", "B) 4-6 L", "C) 7-8 L", "D) 9-10 L"],
        correct: "B",
        explanation: "Le corps humain contient environ 5 litres de sang."
    },
    {
        question: "Quelle est la température normale du corps ?",
        options: ["A) 35°C", "B) 36,5°C", "C) 37,5°C", "D) 38°C"],
        correct: "B",
        explanation: "La température normale du corps est d'environ 36,5°C."
    },
    {
        question: "Combien de fois le cœur bat-il par jour ?",
        options: ["A) 50 000 fois", "B) 100 000 fois", "C) 150 000 fois", "D) 200 000 fois"],
        correct: "B",
        explanation: "Le cœur bat environ 100 000 fois par jour."
    },
    {
        question: "Quel est le plus grand organe interne ?",
        options: ["A) Cœur", "B) Foie", "C) Poumons", "D) Reins"],
        correct: "B",
        explanation: "Le foie est le plus grand organe interne (environ 1,5 kg)."
    },
    {
        question: "Combien de paires de côtes a un humain ?",
        options: ["A) 10", "B) 12", "C) 14", "D) 16"],
        correct: "B",
        explanation: "Les humains ont 12 paires de côtes."
    },
    {
        question: "Quel pourcentage du corps est constitué d'eau ?",
        options: ["A) 40%", "B) 60%", "C) 80%", "D) 90%"],
        correct: "B",
        explanation: "Le corps humain est composé d'environ 60% d'eau."
    },
    {
        question: "Combien de neurones a le cerveau humain ?",
        options: ["A) 10 millions", "B) 100 millions", "C) 1 milliard", "D) 100 milliards"],
        correct: "D",
        explanation: "Le cerveau humain compte environ 100 milliards de neurones."
    },
    {
        question: "Quel est l'animal le plus intelligent ?",
        options: ["A) Dauphin", "B) Chimpanzé", "C) Éléphant", "D) Corbeau"],
        correct: "B",
        explanation: "Le chimpanzé est considéré comme l'animal le plus intelligent après l'homme."
    },
    {
        question: "Quel animal a le plus long cou ?",
        options: ["A) Girafe", "B) Autruche", "C) Lama", "D) Alpaga"],
        correct: "A",
        explanation: "La girafe a un cou qui peut mesurer jusqu'à 2,5 mètres."
    },
    {
        question: "Quel est le plus grand reptile ?",
        options: ["A) Crocodile marin", "B) Anaconda", "C) Python réticulé", "D) Dragon de Komodo"],
        correct: "A",
        explanation: "Le crocodile marin peut atteindre 7 mètres et plus d'une tonne."
    },
    {
        question: "Quel est le plus petit mammifère ?",
        options: ["A) Souris", "B) Musaraigne étrusque", "C) Campagnol", "D) Mulot"],
        correct: "B",
        explanation: "La musaraigne étrusque pèse environ 2 grammes."
    },
    {
        question: "Combien de temps une tortue peut-elle vivre ?",
        options: ["A) 50 ans", "B) 100 ans", "C) 150 ans", "D) Plus de 200 ans"],
        correct: "D",
        explanation: "Certaines tortues géantes peuvent vivre plus de 200 ans."
    },
    {
        question: "Quel oiseau ne vole pas ?",
        options: ["A) Autruche", "B) Pingouin", "C) Kiwi", "D) Tous ces oiseaux"],
        correct: "D",
        explanation: "L'autruche, le pingouin et le kiwi sont des oiseaux qui ne volent pas."
    },
    {
        question: "Quel est le poisson le plus rapide ?",
        options: ["A) Espadon", "B) Voilier", "C) Thon", "D) Marlin"],
        correct: "B",
        explanation: "Le voilier peut atteindre 110 km/h."
    },
    {
        question: "Combien de dents a un requin ?",
        options: ["A) 50", "B) 100", "C) 300", "D) 3000"],
        correct: "D",
        explanation: "Un requin peut avoir jusqu'à 3000 dents en plusieurs rangées."
    },
    {
        question: "Quel est l'insecte le plus rapide ?",
        options: ["A) Libellule", "B) Taon", "C) Abeille", "D) Guêpe"],
        correct: "A",
        explanation: "La libellule peut atteindre 50 km/h."
    },
    {
        question: "Combien de pattes a une araignée ?",
        options: ["A) 6", "B) 8", "C) 10", "D) 12"],
        correct: "B",
        explanation: "Les araignées ont 8 pattes."
    },
    {
        question: "Quel est le plus grand papillon du monde ?",
        options: ["A) Morpho", "B) Queen Alexandra", "C) Atlas", "D) Monarque"],
        correct: "B",
        explanation: "Le papillon Queen Alexandra peut avoir une envergure de 30 cm."
    },
    {
        question: "Combien de temps vit une abeille ouvrière ?",
        options: ["A) 1 mois", "B) 6 mois", "C) 1 an", "D) 2 ans"],
        correct: "A",
        explanation: "Une abeille ouvrière vit environ 4 à 6 semaines en été."
    },
    {
        question: "Quel est le plus grand primate ?",
        options: ["A) Gorille", "B) Orang-outan", "C) Chimpanzé", "D) Bonobo"],
        correct: "A",
        explanation: "Le gorille peut peser jusqu'à 200 kg."
    },
    {
        question: "Quel animal a le plus gros cerveau ?",
        options: ["A) Éléphant", "B) Baleine", "C) Dauphin", "D) Humain"],
        correct: "B",
        explanation: "La baleine a le plus gros cerveau, pesant jusqu'à 9 kg."
    },
    {
        question: "Combien de temps un éléphant peut-il vivre ?",
        options: ["A) 30 ans", "B) 50 ans", "C) 70 ans", "D) 90 ans"],
        correct: "C",
        explanation: "Les éléphants peuvent vivre jusqu'à 70 ans."
    },
    {
        question: "Quel est le plus grand ours ?",
        options: ["A) Grizzli", "B) Ours blanc", "C) Ours brun", "D) Ours noir"],
        correct: "B",
        explanation: "L'ours blanc peut peser jusqu'à 800 kg."
    }
]
// Questions SPORT
const sportQuestions = [
    {
        question: "Dans quel sport marque-t-on un 'essai' ?",
        options: ["A) Football", "B) Rugby", "C) Basketball", "D) Tennis"],
        correct: "B",
        explanation: "L'essai est la manière principale de marquer des points au rugby."
    },
    {
        question: "Combien de joueurs dans une équipe de football ?",
        options: ["A) 9", "B) 10", "C) 11", "D) 12"],
        correct: "C",
        explanation: "Une équipe de football compte 11 joueurs sur le terrain."
    },
    {
        question: "Quelle distance court un marathon ?",
        options: ["A) 38.5 km", "B) 40.2 km", "C) 42.195 km", "D) 45 km"],
        correct: "C",
        explanation: "Le marathon officiel mesure 42.195 kilomètres."
    },
    {
        question: "Dans quel sport utilise-t-on un 'shuttlecock' ?",
        options: ["A) Tennis", "B) Badminton", "C) Squash", "D) Ping-pong"],
        correct: "B",
        explanation: "Le shuttlecock ou volant est utilisé au badminton."
    },
    {
        question: "Quelle nationalité était Pelé ?",
        options: ["A) Argentin", "B) Brésilien", "C) Uruguayen", "D) Portugais"],
        correct: "B",
        explanation: "Pelé, considéré comme le plus grand joueur de tous les temps, était brésilien."
    },
    {
        question: "Combien de tours dans le Grand Prix de Monaco ?",
        options: ["A) 58", "B) 68", "C) 78", "D) 88"],
        correct: "C",
        explanation: "Le Grand Prix de Monaco compte 78 tours."
    },
    {
        question: "Quel sport pratique-t-on sur un 'diamond' ?",
        options: ["A) Baseball", "B) Cricket", "C) Golf", "D) Hockey"],
        correct: "A",
        explanation: "Le terrain de baseball est appelé 'diamond' (diamant)."
    },
    {
        question: "Quelle est la hauteur d'un panier de basketball ?",
        options: ["A) 3.00m", "B) 3.05m", "C) 3.10m", "D) 3.15m"],
        correct: "B",
        explanation: "Le panier de basketball est à 3.05 mètres (10 pieds) du sol."
    },
    {
        question: "Dans quel pays les Jeux Olympiques sont-ils nés ?",
        options: ["A) Italie", "B) Égypte", "C) Grèce", "D) France"],
        correct: "C",
        explanation: "Les Jeux Olympiques modernes sont inspirés des jeux de la Grèce antique."
    },
    {
        question: "Quel sport Michael Jordan a-t-il pratiqué ?",
        options: ["A) Baseball", "B) Basketball", "C) Football", "D) Tennis"],
        correct: "B",
        explanation: "Michael Jordan est une légende du basketball."
    },
    {
        question: "Combien de joueurs dans une équipe de football ?",
        options: ["A) 9", "B) 10", "C) 11", "D) 12"],
        correct: "C",
        explanation: "Une équipe de football compte 11 joueurs sur le terrain."
    },
    {
        question: "Quelle est la durée d'un match de basketball ?",
        options: ["A) 40 min", "B) 48 min", "C) 60 min", "D) 90 min"],
        correct: "B",
        explanation: "Un match de basketball NBA dure 48 minutes (4 quarts de 12 min)."
    },
    {
        question: "Combien de joueurs dans une équipe de volleyball ?",
        options: ["A) 4", "B) 6", "C) 8", "D) 10"],
        correct: "B",
        explanation: "Une équipe de volleyball compte 6 joueurs sur le terrain."
    },
    {
        question: "Quelle est la surface d'un terrain de tennis ?",
        options: ["A) 180m²", "B) 196m²", "C) 210m²", "D) 234m²"],
        correct: "B",
        explanation: "Un terrain de tennis simple mesure 23.77m x 8.23m = 196m²."
    },
    {
        question: "Combien de joueurs dans une équipe de handball ?",
        options: ["A) 5", "B) 6", "C) 7", "D) 8"],
        correct: "C",
        explanation: "Une équipe de handball compte 7 joueurs sur le terrain."
    },
    {
        question: "Quelle est la hauteur d'un panier de basketball ?",
        options: ["A) 3.00m", "B) 3.05m", "C) 3.10m", "D) 3.15m"],
        correct: "B",
        explanation: "Le panier de basketball est à 3.05 mètres (10 pieds) du sol."
    },
    {
        question: "Combien de sets dans un match de tennis professionnel ?",
        options: ["A) 3", "B) 4", "C) 5", "D) 6"],
        correct: "C",
        explanation: "Un match de tennis professionnel se joue en 3 sets gagnants."
    },
    {
        question: "Quelle est la longueur d'un terrain de football ?",
        options: ["A) 90m", "B) 100m", "C) 105m", "D) 110m"],
        correct: "C",
        explanation: "Un terrain de football mesure entre 90m et 120m, 105m en moyenne."
    },
    {
        question: "Quelle distance court un marathon ?",
        options: ["A) 38.5 km", "B) 40.2 km", "C) 42.195 km", "D) 45 km"],
        correct: "C",
        explanation: "Le marathon officiel mesure 42.195 kilomètres."
    },
    {
        question: "Combien de poids dans un haltérophilie olympique ?",
        options: ["A) 1", "B) 2", "C) 3", "D) 4"],
        correct: "B",
        explanation: "L'haltérophilie olympique comprend l'arraché et l'épaulé-jeté."
    },
    {
        question: "Quelle est la distance d'un 100 mètres en athlétisme ?",
        options: ["A) 100m", "B) 110m", "C) 120m", "D) 130m"],
        correct: "A",
        explanation: "Le 100 mètres mesure exactement 100 mètres."
    },
    {
        question: "Combien de disciplines en natation olympique ?",
        options: ["A) 4", "B) 5", "C) 6", "D) 7"],
        correct: "A",
        explanation: "La natation olympique comprend 4 styles : nage libre, brasse, dos, papillon."
    },
    {
        question: "Quelle est la hauteur d'une barre olympique en saut en hauteur ?",
        options: ["A) 2.33m", "B) 2.40m", "C) 2.45m", "D) 2.50m"],
        correct: "C",
        explanation: "Le record du monde en saut en hauteur est 2.45m."
    },
    {
        question: "Combien de flèches dans un tir à l'arc olympique ?",
        options: ["A) 60", "B) 72", "C) 84", "D) 96"],
        correct: "B",
        explanation: "Chaque archer tire 72 flèches en compétition olympique."
    },
    {
        question: "Quelle est la durée d'un round de boxe professionnelle ?",
        options: ["A) 2 min", "B) 3 min", "C) 4 min", "D) 5 min"],
        correct: "B",
        explanation: "Un round de boxe professionnelle dure 3 minutes."
    },
    {
        question: "Quel sport pratique-t-on sur un 'diamond' ?",
        options: ["A) Baseball", "B) Cricket", "C) Golf", "D) Hockey"],
        correct: "A",
        explanation: "Le terrain de baseball est appelé 'diamond' (diamant)."
    },
    {
        question: "Combien de tours dans le Grand Prix de Monaco ?",
        options: ["A) 58", "B) 68", "C) 78", "D) 88"],
        correct: "C",
        explanation: "Le Grand Prix de Monaco compte 78 tours."
    },
    {
        question: "Quelle est la vitesse maximale en Formule 1 ?",
        options: ["A) 320 km/h", "B) 350 km/h", "C) 380 km/h", "D) 400 km/h"],
        correct: "B",
        explanation: "Les voitures de F1 peuvent atteindre environ 350 km/h."
    },
    {
        question: "Combien de pilotes en MotoGP ?",
        options: ["A) 20", "B) 22", "C) 24", "D) 26"],
        correct: "B",
        explanation: "Le championnat MotoGP compte 22 pilotes titulaires."
    },
    {
        question: "Quelle est la longueur d'un circuit NASCAR ?",
        options: ["A) 2.5 km", "B) 3.5 km", "C) 4.5 km", "D) 5.5 km"],
        correct: "C",
        explanation: "Les circuits NASCAR mesurent en moyenne 4.5 km."
    },
    {
        question: "Dans quel sport marque-t-on un 'essai' ?",
        options: ["A) Football", "B) Rugby", "C) Basketball", "D) Tennis"],
        correct: "B",
        explanation: "L'essai est la manière principale de marquer au rugby."
    },
    {
        question: "Combien de poids dans une catégorie de boxe poids lourds ?",
        options: ["A) 81kg", "B) 91kg", "C) 101kg", "D) Illimité"],
        correct: "B",
        explanation: "La catégorie poids lourds commence à 91kg."
    },
    {
        question: "Quelle est la durée d'un combat d'UFC ?",
        options: ["A) 3x3 min", "B) 3x5 min", "C) 5x3 min", "D) 5x5 min"],
        correct: "D",
        explanation: "Un combat d'UFC dure 5 rounds de 5 minutes."
    },
    {
        question: "Quelle ceinture est la plus élevée en judo ?",
        options: ["A) Noire", "B) Rouge", "C) Blanche", "D) Verte"],
        correct: "A",
        explanation: "La ceinture noire est la plus élevée en judo."
    },
    {
        question: "Combien de combattants dans une équipe de water-polo ?",
        options: ["A) 6", "B) 7", "C) 8", "D) 9"],
        correct: "B",
        explanation: "Une équipe de water-polo compte 7 joueurs dans l'eau."
    },
    {
        question: "Quelle est la longueur d'une piste de ski alpin olympique ?",
        options: ["A) 2km", "B) 3km", "C) 4km", "D) 5km"],
        correct: "C",
        explanation: "Les pistes de ski alpin olympique mesurent environ 4km."
    },
    {
        question: "Combien de patineurs dans une équipe de hockey sur glace ?",
        options: ["A) 5", "B) 6", "C) 7", "D) 8"],
        correct: "B",
        explanation: "Une équipe de hockey compte 6 joueurs sur la glace."
    },
    {
        question: "Quelle est la hauteur du tremplin de saut à ski olympique ?",
        options: ["A) 90m", "B) 120m", "C) 140m", "D) 160m"],
        correct: "B",
        explanation: "Le grand tremplin olympique mesure 120m."
    },
    {
        question: "Combien de boules en curling olympique ?",
        options: ["A) 6", "B) 8", "C) 10", "D) 12"],
        correct: "B",
        explanation: "Chaque équipe lance 8 pierres par end."
    },
    {
        question: "Quelle est la vitesse maximale en luge olympique ?",
        options: ["A) 120 km/h", "B) 140 km/h", "C) 160 km/h", "D) 180 km/h"],
        correct: "B",
        explanation: "Les lugeurs peuvent atteindre 140 km/h."
    },
    {
        question: "Quelle est la hauteur d'un mur d'escalade compétition ?",
        options: ["A) 12m", "B) 15m", "C) 18m", "D) 21m"],
        correct: "B",
        explanation: "Les murs d'escalade compétition mesurent 15m de hauteur."
    },
    {
        question: "Combien de vagues dans une compétition de surf ?",
        options: ["A) 10", "B) 15", "C) 20", "D) 25"],
        correct: "C",
        explanation: "Chaque surfeur est jugé sur 20 vagues maximum."
    },
    {
        question: "Quelle est la distance en skateboard street ?",
        options: ["A) 200m", "B) 300m", "C) 400m", "D) 500m"],
        correct: "A",
        explanation: "Le parcours street en skateboard mesure environ 200m."
    },
    {
        question: "Combien de quilles dans une partie de bowling ?",
        options: ["A) 8", "B) 10", "C) 12", "D) 15"],
        correct: "B",
        explanation: "Le bowling utilise 10 quilles par frame."
    },
    {
        question: "Quelle est la taille d'une table de billard professionnel ?",
        options: ["A) 2.5m x 1.25m", "B) 3m x 1.5m", "C) 3.5m x 1.75m", "D) 4m x 2m"],
        correct: "C",
        explanation: "Une table de billard professionnel mesure 3.5m x 1.75m."
    },
    {
        question: "Quel sport a inventé James Naismith ?",
        options: ["A) Football", "B) Basketball", "C) Volleyball", "D) Tennis"],
        correct: "B",
        explanation: "James Naismith a inventé le basketball en 1891."
    },
    {
        question: "Quelle nationalité était Pelé ?",
        options: ["A) Argentin", "B) Brésilien", "C) Uruguayen", "D) Portugais"],
        correct: "B",
        explanation: "Pelé était brésilien, considéré comme le plus grand joueur."
    },
    {
        question: "Combien de coupes du monde a gagné le Brésil ?",
        options: ["A) 3", "B) 4", "C) 5", "D) 6"],
        correct: "C",
        explanation: "Le Brésil a gagné 5 coupes du monde, record absolu."
    },
    {
        question: "Quel joueur a marqué 100 points en un match NBA ?",
        options: ["A) Michael Jordan", "B) LeBron James", "C) Wilt Chamberlain", "D) Kobe Bryant"],
        correct: "C",
        explanation: "Wilt Chamberlain a marqué 100 points le 2 mars 1962."
    },
    {
        question: "Quel cycliste a le plus de victoires dans le Tour de France ?",
        options: ["A) Eddy Merckx", "B) Bernard Hinault", "C) Miguel Indurain", "D) Lance Armstrong"],
        correct: "A",
        explanation: "Eddy Merckx a gagné 5 fois le Tour de France."
    },
    {
        question: "Quelle est la vitesse du service le plus rapide au tennis ?",
        options: ["A) 220 km/h", "B) 246 km/h", "C) 263 km/h", "D) 280 km/h"],
        correct: "C",
        explanation: "Sam Groth a servi à 263.4 km/h, le record du monde."
    },
    {
        question: "Quel nageur a le plus de médailles olympiques ?",
        options: ["A) Mark Spitz", "B) Michael Phelps", "C) Ian Thorpe", "D) Ryan Lochte"],
        correct: "B",
        explanation: "Michael Phelps a remporté 28 médailles olympiques."
    },
    {
        question: "Dans quel sport utilise-t-on un 'shuttlecock' ?",
        options: ["A) Tennis", "B) Badminton", "C) Squash", "D) Ping-pong"],
        correct: "B",
        explanation: "Le shuttlecock ou volant est utilisé au badminton."
    },
    {
        question: "Combien de points pour gagner un set de tennis ?",
        options: ["A) 4", "B) 5", "C) 6", "D) 7"],
        correct: "C",
        explanation: "Il faut 6 jeux avec 2 points d'écart pour gagner un set."
    },
    {
        question: "Quelle est la circonférence d'un ballon de football ?",
        options: ["A) 58-61cm", "B) 62-65cm", "C) 68-70cm", "D) 72-75cm"],
        correct: "C",
        explanation: "Un ballon de football mesure 68-70cm de circonférence."
    },
    {
        question: "Quel est le poids d'un ballon de basketball ?",
        options: ["A) 450-650g", "B) 550-650g", "C) 600-650g", "D) 650-700g"],
        correct: "C",
        explanation: "Un ballon de basketball pèse entre 600 et 650 grammes."
    },
    {
        question: "Dans quel pays les Jeux Olympiques sont-ils nés ?",
        options: ["A) Italie", "B) Égypte", "C) Grèce", "D) France"],
        correct: "C",
        explanation: "Les Jeux Olympiques modernes sont inspirés de la Grèce antique."
    },
    {
        question: "Combien de pays participent aux Jeux Olympiques d'été ?",
        options: ["A) 150", "B) 200", "C) 206", "D) 250"],
        correct: "C",
        explanation: "206 pays participent aux Jeux Olympiques d'été."
    },
    {
        question: "Quel sport a été ajouté aux JO en 2020 ?",
        options: ["A) Skateboard", "B) Surf", "C) Escalade", "D) Baseball"],
        correct: "A",
        explanation: "Le skateboard, le surf et l'escalade ont été ajoutés en 2020."
    },
    {
        question: "Quelle ville a organisé les premiers JO d'hiver ?",
        options: ["A) Chamonix", "B) Lake Placid", "C) Innsbruck", "D) Grenoble"],
        correct: "A",
        explanation: "Chamonix a organisé les premiers JO d'hiver en 1924."
    },
    {
        question: "Combien d'éditions des Jeux Olympiques d'été ?",
        options: ["A) 29", "B) 31", "C) 33", "D) 35"],
        correct: "C",
        explanation: "Les JO d'été ont eu 33 éditions (jusqu'à Tokyo 2020)."
    }
]
// Questions CINÉMA
const cinemaQuestions = [
    {
        question: "Qui a réalisé 'Titanic' ?",
        options: ["A) Steven Spielberg", "B) James Cameron", "C) Martin Scorsese", "D) Quentin Tarantino"],
        correct: "B",
        explanation: "James Cameron a réalisé Titanic en 1997."
    },
    {
        question: "Quel réalisateur a fait 'Pulp Fiction' ?",
        options: ["A) Martin Scorsese", "B) Quentin Tarantino", "C) Francis Ford Coppola", "D) Steven Spielberg"],
        correct: "B",
        explanation: "Quentin Tarantino a réalisé Pulp Fiction en 1994."
    },
    {
        question: "Qui a réalisé 'Le Seigneur des Anneaux' ?",
        options: ["A) Peter Jackson", "B) Christopher Nolan", "C) David Fincher", "D) Ridley Scott"],
        correct: "A",
        explanation: "Peter Jackson a réalisé la trilogie Le Seigneur des Anneaux."
    },
    {
        question: "Quel réalisateur a fait 'Inception' ?",
        options: ["A) Christopher Nolan", "B) David Fincher", "C) Denis Villeneuve", "D) Jordan Peele"],
        correct: "A",
        explanation: "Christopher Nolan a réalisé Inception en 2010."
    },
    {
        question: "Qui a réalisé 'Les Évadés' ?",
        options: ["A) Frank Darabont", "B) Martin Scorsese", "C) Francis Ford Coppola", "D) Stanley Kubrick"],
        correct: "A",
        explanation: "Frank Darabont a réalisé Les Évadés en 1994."
    },
    {
        question: "Combien de films dans la saga Harry Potter ?",
        options: ["A) 6", "B) 7", "C) 8", "D) 9"],
        correct: "C",
        explanation: "Il y a 8 films dans la saga Harry Potter."
    },
    {
        question: "Quel est le premier film de l'univers Marvel (MCU) ?",
        options: ["A) Iron Man", "B) Captain America", "C) Thor", "D) Hulk"],
        correct: "A",
        explanation: "Iron Man (2008) est le premier film de l'univers Marvel."
    },
    {
        question: "Combien de films Star Wars existent ?",
        options: ["A) 9", "B) 11", "C) 12", "D) 15"],
        correct: "B",
        explanation: "Il y a 11 films Star Wars (9 épisodes principaux + 2 spin-offs)."
    },
    {
        question: "Quel est le film le plus rentable de tous les temps ?",
        options: ["A) Avatar", "B) Titanic", "C) Avengers: Endgame", "D) Star Wars: Le Réveil de la Force"],
        correct: "A",
        explanation: "Avatar est le film le plus rentable avec environ 2.9 milliards de dollars."
    },
    {
        question: "Combien de films Fast and Furious ?",
        options: ["A) 9", "B) 10", "C) 11", "D) 12"],
        correct: "B",
        explanation: "Il y a 10 films principaux dans la saga Fast and Furious."
    },
    {
        question: "Quel acteur joue James Bond dans 'Casino Royale' (2006) ?",
        options: ["A) Sean Connery", "B) Pierce Brosnan", "C) Daniel Craig", "D) Roger Moore"],
        correct: "C",
        explanation: "Daniel Craig a joué James Bond dans Casino Royale."
    },
    {
        question: "Combien d'acteurs ont joué James Bond ?",
        options: ["A) 5", "B) 6", "C) 7", "D) 8"],
        correct: "B",
        explanation: "6 acteurs ont officiellement joué James Bond au cinéma."
    },
    {
        question: "Quel acteur a joué dans le plus de films ?",
        options: ["A) Samuel L. Jackson", "B) Morgan Freeman", "C) Robert De Niro", "D) Tom Hanks"],
        correct: "A",
        explanation: "Samuel L. Jackson a joué dans plus de 200 films."
    },
    {
        question: "Quelle actrice a le plus d'Oscars ?",
        options: ["A) Meryl Streep", "B) Katharine Hepburn", "C) Bette Davis", "D) Ingrid Bergman"],
        correct: "B",
        explanation: "Katharine Hepburn a remporté 4 Oscars de la meilleure actrice."
    },
    {
        question: "Quel acteur a refusé le rôle de Forrest Gump ?",
        options: ["A) Tom Hanks", "B) Bill Murray", "C) John Travolta", "D) Robin Williams"],
        correct: "B",
        explanation: "Bill Murray a refusé le rôle avant que Tom Hanks ne l'accepte."
    },
    {
        question: "Combien d'Oscars le film 'Titanic' a-t-il remportés ?",
        options: ["A) 9", "B) 10", "C) 11", "D) 12"],
        correct: "C",
        explanation: "Titanic a remporté 11 Oscars, égalant le record."
    },
    {
        question: "Quel est le film le plus long jamais produit ?",
        options: ["A) Gone with the Wind", "B) Avatar", "C) The Cure for Insomnia", "D) Lawrence d'Arabie"],
        correct: "C",
        explanation: "The Cure for Insomnia dure 87 heures, le film le plus long."
    },
    {
        question: "Quel est le film le plus cher jamais produit ?",
        options: ["A) Avatar 2", "B) Avengers: Endgame", "C) Pirates des Caraïbes 3", "D) Justice League"],
        correct: "A",
        explanation: "Avatar 2 a coûté plus de 460 millions de dollars."
    },
    {
        question: "Quel est le premier film parlant ?",
        options: ["A) The Jazz Singer", "B) Lights of New York", "C) The Broadway Melody", "D) Show Boat"],
        correct: "A",
        explanation: "The Jazz Singer (1927) est considéré comme le premier film parlant."
    },
    {
        question: "Quel est le premier film en couleur ?",
        options: ["A) Le Magicien d'Oz", "B) Gone with the Wind", "C) Becky Sharp", "D) Le Fantôme de l'Opéra"],
        correct: "C",
        explanation: "Becky Sharp (1935) est le premier long métrage en couleur."
    },
    {
        question: "Qui a composé la musique de 'Star Wars' ?",
        options: ["A) John Williams", "B) Hans Zimmer", "C) Danny Elfman", "D) Howard Shore"],
        correct: "A",
        explanation: "John Williams a composé la musique emblématique de Star Wars."
    },
    {
        question: "Qui a composé la musique du 'Seigneur des Anneaux' ?",
        options: ["A) John Williams", "B) Howard Shore", "C) Hans Zimmer", "D) Danny Elfman"],
        correct: "B",
        explanation: "Howard Shore a composé la musique du Seigneur des Anneaux."
    },
    {
        question: "Quel compositeur a le plus de nominations aux Oscars ?",
        options: ["A) John Williams", "B) Hans Zimmer", "C) Ennio Morricone", "D) Danny Elfman"],
        correct: "A",
        explanation: "John Williams a 52 nominations aux Oscars."
    },
    {
        question: "Quel film a la meilleure bande sonore selon l'AFI ?",
        options: ["A) Star Wars", "B) Le Seigneur des Anneaux", "C) Les Évadés", "D) Psychose"],
        correct: "A",
        explanation: "Star Wars est classé n°1 des meilleures bandes sonores."
    },
    {
        question: "Qui a chanté 'My Heart Will Go On' pour Titanic ?",
        options: ["A) Céline Dion", "B) Whitney Houston", "C) Mariah Carey", "D) Madonna"],
        correct: "A",
        explanation: "Céline Dion a chanté 'My Heart Will Go On'."
    }
]
// Questions HISTOIRE - 50 QUESTIONS
const histoireQuestions = [
    {
        question: "En quelle année a débuté la Révolution française ?",
        options: ["A) 1787", "B) 1789", "C) 1791", "D) 1793"],
        correct: "B",
        explanation: "La Révolution française a débuté en 1789 avec la prise de la Bastille le 14 juillet."
    },
    {
        question: "Qui était le premier empereur romain ?",
        options: ["A) Jules César", "B) Auguste", "C) Néron", "D) Marc Aurèle"],
        correct: "B",
        explanation: "Auguste (Octave) est considéré comme le premier empereur romain de 27 av. J.-C. à 14 ap. J.-C."
    },
    {
        question: "En quelle année Christophe Colomb a-t-il découvert l'Amérique ?",
        options: ["A) 1490", "B) 1492", "C) 1494", "D) 1496"],
        correct: "B",
        explanation: "Christophe Colomb a atteint l'Amérique le 12 octobre 1492."
    },
    {
        question: "Combien de temps a duré la Première Guerre mondiale ?",
        options: ["A) 1912-1916", "B) 1914-1918", "C) 1916-1920", "D) 1918-1922"],
        correct: "B",
        explanation: "La Première Guerre mondiale a duré de 1914 à 1918."
    },
    {
        question: "Qui a peint la chapelle Sixtine ?",
        options: ["A) Raphaël", "B) Léonard de Vinci", "C) Michel-Ange", "D) Botticelli"],
        correct: "C",
        explanation: "Michel-Ange a peint le plafond de la chapelle Sixtine entre 1508 et 1512."
    },
    {
        question: "En quelle année est tombé le Mur de Berlin ?",
        options: ["A) 1987", "B) 1989", "C) 1991", "D) 1993"],
        correct: "B",
        explanation: "Le Mur de Berlin est tombé le 9 novembre 1989."
    },
    {
        question: "Qui a inventé l'imprimerie ?",
        options: ["A) Gutenberg", "B) Bell", "C) Edison", "D) Watt"],
        correct: "A",
        explanation: "Johannes Gutenberg a inventé l'imprimerie à caractères mobiles vers 1440."
    },
    {
        question: "Quelle dynastie a construit la Grande Muraille ?",
        options: ["A) Han", "B) Tang", "C) Ming", "D) Qing"],
        correct: "C",
        explanation: "La dynastie Ming a construit la plupart de la Grande Muraille actuelle."
    },
    {
        question: "En quelle année a eu lieu la Déclaration d'indépendance américaine ?",
        options: ["A) 1774", "B) 1776", "C) 1778", "D) 1780"],
        correct: "B",
        explanation: "La Déclaration d'indépendance a été signée le 4 juillet 1776."
    },
    {
        question: "Qui a écrit 'Les Misérables' ?",
        options: ["A) Balzac", "B) Zola", "C) Hugo", "D) Flaubert"],
        correct: "C",
        explanation: "Victor Hugo a écrit 'Les Misérables' publié en 1862."
    },
    {
        question: "Quel président américain a aboli l'esclavage ?",
        options: ["A) George Washington", "B) Thomas Jefferson", "C) Abraham Lincoln", "D) Andrew Johnson"],
        correct: "C",
        explanation: "Abraham Lincoln a aboli l'esclavage par le 13e amendement en 1865."
    },
    {
        question: "En quelle année l'homme a-t-il marché sur la Lune ?",
        options: ["A) 1965", "B) 1967", "C) 1969", "D) 1971"],
        correct: "C",
        explanation: "Neil Armstrong a marché sur la Lune le 21 juillet 1969."
    },
    {
        question: "Qui était le premier roi de France ?",
        options: ["A) Clovis", "B) Charlemagne", "C) Hugues Capet", "D) Louis XIV"],
        correct: "A",
        explanation: "Clovis est considéré comme le premier roi de France (481-511)."
    },
    {
        question: "Quelle civilisation a construit Machu Picchu ?",
        options: ["A) Aztèque", "B) Maya", "C) Inca", "D) Olmèque"],
        correct: "C",
        explanation: "Les Incas ont construit Machu Picchu au XVe siècle."
    },
    {
        question: "Qui a découvert la pénicilline ?",
        options: ["A) Pasteur", "B) Fleming", "C) Curie", "D) Koch"],
        correct: "B",
        explanation: "Alexander Fleming a découvert la pénicilline en 1928."
    },
    {
        question: "En quelle année Napoléon est-il mort ?",
        options: ["A) 1815", "B) 1821", "C) 1830", "D) 1840"],
        correct: "B",
        explanation: "Napoléon Bonaparte est mort le 5 mai 1821 à Sainte-Hélène."
    },
    {
        question: "Quel était le nom du premier satellite artificiel ?",
        options: ["A) Explorer 1", "B) Spoutnik 1", "C) Vanguard 1", "D) Telstar 1"],
        correct: "B",
        explanation: "Spoutnik 1 a été lancé par l'URSS le 4 octobre 1957."
    },
    {
        question: "Qui a peint la Joconde ?",
        options: ["A) Michel-Ange", "B) Raphaël", "C) Léonard de Vinci", "D) Botticelli"],
        correct: "C",
        explanation: "Léonard de Vinci a peint la Joconde entre 1503 et 1506."
    },
    {
        question: "En quelle année la Tour Eiffel a-t-elle été inaugurée ?",
        options: ["A) 1887", "B) 1889", "C) 1891", "D) 1900"],
        correct: "B",
        explanation: "La Tour Eiffel a été inaugurée le 31 mars 1889."
    },
    {
        question: "Qui a écrit 'Romeo et Juliette' ?",
        options: ["A) Molière", "B) Shakespeare", "C) Victor Hugo", "D) Charles Dickens"],
        correct: "B",
        explanation: "William Shakespeare a écrit Roméo et Juliette vers 1595."
    },
    {
        question: "Qui a été le premier président des États-Unis ?",
        options: ["A) Thomas Jefferson", "B) John Adams", "C) George Washington", "D) Benjamin Franklin"],
        correct: "C",
        explanation: "George Washington a été le premier président de 1789 à 1797."
    },
    {
        question: "En quelle année la Seconde Guerre mondiale a-t-elle commencé ?",
        options: ["A) 1937", "B) 1938", "C) 1939", "D) 1940"],
        correct: "C",
        explanation: "La Seconde Guerre mondiale a commencé le 1er septembre 1939."
    },
    {
        question: "Qui était le leader de l'URSS pendant la Seconde Guerre mondiale ?",
        options: ["A) Lénine", "B) Staline", "C) Trotski", "D) Khrouchtchev"],
        correct: "B",
        explanation: "Joseph Staline dirigeait l'URSS pendant la Seconde Guerre mondiale."
    },
    {
        question: "En quelle année le Titanic a-t-il coulé ?",
        options: ["A) 1910", "B) 1912", "C) 1914", "D) 1916"],
        correct: "B",
        explanation: "Le Titanic a coulé le 15 avril 1912."
    },
    {
        question: "Qui a écrit 'Le Capital' ?",
        options: ["A) Engels", "B) Marx", "C) Lénine", "D) Staline"],
        correct: "B",
        explanation: "Karl Marx a écrit 'Le Capital' publié en 1867."
    },
    {
        question: "Quelle reine a régné le plus longtemps en Angleterre ?",
        options: ["A) Victoria", "B) Élisabeth I", "C) Élisabeth II", "D) Marie Tudor"],
        correct: "C",
        explanation: "Élisabeth II a régné 70 ans, de 1952 à 2022."
    },
    {
        question: "En quelle année la peste noire a-t-elle frappé l'Europe ?",
        options: ["A) 1247", "B) 1347", "C) 1447", "D) 1547"],
        correct: "B",
        explanation: "La peste noire a frappé l'Europe à partir de 1347."
    },
    {
        question: "Qui a découvert le vaccin contre la rage ?",
        options: ["A) Pasteur", "B) Koch", "C) Ehrlich", "D) Metchnikoff"],
        correct: "A",
        explanation: "Louis Pasteur a découvert le vaccin contre la rage en 1885."
    },
    {
        question: "Quel pharaon a fait construire la plus grande pyramide ?",
        options: ["A) Khéops", "B) Khéphren", "C) Mykérinos", "D) Ramsès II"],
        correct: "A",
        explanation: "La pyramide de Khéops est la plus grande des pyramides de Gizeh."
    },
    {
        question: "En quelle année la Bastille a-t-elle été prise ?",
        options: ["A) 1788", "B) 1789", "C) 1790", "D) 1791"],
        correct: "B",
        explanation: "La Bastille a été prise le 14 juillet 1789."
    },
    {
        question: "Qui a été le premier empereur de Chine ?",
        options: ["A) Qin Shi Huang", "B) Han Wudi", "C) Tang Taizong", "D) Song Taizu"],
        correct: "A",
        explanation: "Qin Shi Huang a été le premier empereur de Chine en 221 av. J.-C."
    },
    {
        question: "Quelle guerre a opposé les Maisons de Lancastre et d'York ?",
        options: ["A) Guerre de Cent Ans", "B) Guerre des Deux-Roses", "C) Guerre civile anglaise", "D) Guerre de Succession"],
        correct: "B",
        explanation: "La guerre des Deux-Roses a eu lieu de 1455 à 1485."
    },
    {
        question: "Qui a écrit 'La Divine Comédie' ?",
        options: ["A) Boccace", "B) Pétrarque", "C) Dante", "D) Machiavel"],
        correct: "C",
        explanation: "Dante Alighieri a écrit La Divine Comédie au XIVe siècle."
    },
    {
        question: "En quelle année Christophe Colomb est-il né ?",
        options: ["A) 1436", "B) 1451", "C) 1466", "D) 1481"],
        correct: "B",
        explanation: "Christophe Colomb est né en 1451 à Gênes."
    },
    {
        question: "Qui a découvert le détroit de Magellan ?",
        options: ["A) Magellan", "B) Drake", "C) Cook", "D) Vespucci"],
        correct: "A",
        explanation: "Fernand de Magellan a découvert le détroit en 1520."
    },
    {
        question: "Quel empire a été fondé par Gengis Khan ?",
        options: ["A) Empire ottoman", "B) Empire mongol", "C) Empire perse", "D) Empire moghol"],
        correct: "B",
        explanation: "Gengis Khan a fondé l'empire mongol au XIIIe siècle."
    },
    {
        question: "En quelle année la guerre de Cent Ans a-t-elle commencé ?",
        options: ["A) 1327", "B) 1337", "C) 1347", "D) 1357"],
        correct: "B",
        explanation: "La guerre de Cent Ans a commencé en 1337 et a duré jusqu'en 1453."
    },
    {
        question: "Qui a été la première femme prix Nobel ?",
        options: ["A) Marie Curie", "B) Rosalind Franklin", "C) Lise Meitner", "D) Irène Joliot-Curie"],
        correct: "A",
        explanation: "Marie Curie a reçu le prix Nobel de physique en 1903."
    },
    {
        question: "Quel traité a mis fin à la Première Guerre mondiale ?",
        options: ["A) Traité de Versailles", "B) Traité de Paris", "C) Traité de Trianon", "D) Traité de Saint-Germain"],
        correct: "A",
        explanation: "Le traité de Versailles a été signé le 28 juin 1919."
    },
    {
        question: "Qui a écrit 'L'Écume des jours' ?",
        options: ["A) Sartre", "B) Camus", "C) Vian", "D) Queneau"],
        correct: "C",
        explanation: "Boris Vian a écrit L'Écume des jours en 1947."
    },
    {
        question: "Quel roi de France a été guillotiné ?",
        options: ["A) Louis XV", "B) Louis XVI", "C) Louis XVII", "D) Louis XVIII"],
        correct: "B",
        explanation: "Louis XVI a été guillotiné le 21 janvier 1793."
    },
    {
        question: "En quelle année la révolte des Boxers a-t-elle eu lieu en Chine ?",
        options: ["A) 1898", "B) 1900", "C) 1902", "D) 1904"],
        correct: "B",
        explanation: "La révolte des Boxers a eu lieu en 1900."
    },
    {
        question: "Qui a découvert le radium ?",
        options: ["A) Pierre et Marie Curie", "B) Becquerel", "C) Rutherford", "D) Bohr"],
        correct: "A",
        explanation: "Pierre et Marie Curie ont découvert le radium en 1898."
    },
    {
        question: "Quel empereur romain a construit le Colisée ?",
        options: ["A) Néron", "B) Vespasien", "C) Titus", "D) Trajan"],
        correct: "B",
        explanation: "Vespasien a commencé la construction du Colisée en 72 ap. J.-C."
    },
    {
        question: "En quelle année la guerre du Vietnam a-t-elle pris fin ?",
        options: ["A) 1973", "B) 1975", "C) 1977", "D) 1979"],
        correct: "B",
        explanation: "La guerre du Vietnam a pris fin le 30 avril 1975."
    },
    {
        question: "Qui a écrit 'Le nom de la rose' ?",
        options: ["A) Calvino", "B) Eco", "C) Pavese", "D) Sciascia"],
        correct: "B",
        explanation: "Umberto Eco a écrit Le nom de la rose en 1980."
    },
    {
        question: "Quel pharaon a épousé sa sœur Néfertari ?",
        options: ["A) Akhenaton", "B) Toutânkhamon", "C) Ramsès II", "D) Khéops"],
        correct: "C",
        explanation: "Ramsès II a épousé Néfertari, qui était peut-être sa sœur."
    },
    {
        question: "En quelle année la crise des missiles de Cuba a-t-elle eu lieu ?",
        options: ["A) 1960", "B) 1962", "C) 1964", "D) 1966"],
        correct: "B",
        explanation: "La crise des missiles de Cuba a eu lieu en octobre 1962."
    },
    {
        question: "Qui a été le premier homme dans l'espace ?",
        options: ["A) Gagarine", "B) Glenn", "C) Shepard", "D) Armstrong"],
        correct: "A",
        explanation: "Youri Gagarine a été le premier homme dans l'espace le 12 avril 1961."
    }
]
// Questions MATHÉMATIQUES - 50 QUESTIONS
const mathQuestions = [
    {
        question: "Combien font 24 × 9 ?",
        options: ["A) 200", "B) 210", "C) 216", "D) 220"],
        correct: "C",
        explanation: "24 × 9 = 216"
    },
    {
        question: "Quel est le PGCD de 48 et 60 ?",
        options: ["A) 6", "B) 8", "C) 12", "D) 18"],
        correct: "C",
        explanation: "Le PGCD de 48 et 60 est 12"
    },
    {
        question: "Combien font 2/3 de 90 ?",
        options: ["A) 55", "B) 57", "C) 60", "D) 63"],
        correct: "C",
        explanation: "2/3 de 90 = (2 × 90) ÷ 3 = 60"
    },
    {
        question: "Quel est le résultat de 15 + 27 ?",
        options: ["A) 40", "B) 41", "C) 42", "D) 43"],
        correct: "C",
        explanation: "15 + 27 = 42"
    },
    {
        question: "Combien font 144 ÷ 12 ?",
        options: ["A) 10", "B) 11", "C) 12", "D) 13"],
        correct: "C",
        explanation: "144 ÷ 12 = 12"
    },
    {
        question: "Quelle est la moitié de 150 ?",
        options: ["A) 65", "B) 70", "C) 75", "D) 80"],
        correct: "C",
        explanation: "150 ÷ 2 = 75"
    },
    {
        question: "Combien font 5³ (5 au cube) ?",
        options: ["A) 100", "B) 110", "C) 120", "D) 125"],
        correct: "D",
        explanation: "5³ = 5 × 5 × 5 = 125"
    },
    {
        question: "Quel est 20% de 450 ?",
        options: ["A) 80", "B) 90", "C) 100", "D) 110"],
        correct: "B",
        explanation: "20% de 450 = (20/100) × 450 = 90"
    },
    {
        question: "Combien font 13 × 11 ?",
        options: ["A) 140", "B) 141", "C) 142", "D) 143"],
        correct: "D",
        explanation: "13 × 11 = 143"
    },
    {
        question: "Quelle est la racine carrée de 625 ?",
        options: ["A) 20", "B) 22", "C) 24", "D) 25"],
        correct: "D",
        explanation: "25 × 25 = 625, donc √625 = 25"
    },
    {
        question: "Combien font 1000 ÷ 25 ?",
        options: ["A) 35", "B) 40", "C) 45", "D) 50"],
        correct: "B",
        explanation: "1000 ÷ 25 = 40"
    },
    {
        question: "Quel est le triple de 23 ?",
        options: ["A) 66", "B) 67", "C) 68", "D) 69"],
        correct: "D",
        explanation: "23 × 3 = 69"
    },
    {
        question: "Combien font 8² + 6² ?",
        options: ["A) 90", "B) 95", "C) 100", "D) 105"],
        correct: "C",
        explanation: "8² + 6² = 64 + 36 = 100"
    },
    {
        question: "Quel est 15% de 300 ?",
        options: ["A) 40", "B) 42", "C) 45", "D) 48"],
        correct: "C",
        explanation: "15% de 300 = (15/100) × 300 = 45"
    },
    {
        question: "Combien font 2³ × 3² ?",
        options: ["A) 64", "B) 72", "C) 81", "D) 96"],
        correct: "B",
        explanation: "2³ × 3² = 8 × 9 = 72"
    },
    {
        question: "Quelle est la différence entre 100 et 37 ?",
        options: ["A) 61", "B) 62", "C) 63", "D) 64"],
        correct: "C",
        explanation: "100 - 37 = 63"
    },
    {
        question: "Quel est le PPCM de 12 et 15 ?",
        options: ["A) 30", "B) 45", "C) 60", "D) 75"],
        correct: "C",
        explanation: "Le PPCM de 12 et 15 est 60"
    },
    {
        question: "Combien font 7² (7 au carré) ?",
        options: ["A) 45", "B) 47", "C) 49", "D) 51"],
        correct: "C",
        explanation: "7² = 7 × 7 = 49"
    },
    {
        question: "Quelle est la somme des angles d'un triangle ?",
        options: ["A) 90°", "B) 120°", "C) 180°", "D) 360°"],
        correct: "C",
        explanation: "La somme des angles d'un triangle est toujours 180°"
    },
    {
        question: "Combien font 3/4 de 80 ?",
        options: ["A) 55", "B) 60", "C) 65", "D) 70"],
        correct: "B",
        explanation: "3/4 de 80 = (3 × 80) ÷ 4 = 60"
    },
    {
        question: "Quel est le périmètre d'un carré de 6 cm de côté ?",
        options: ["A) 18 cm", "B) 24 cm", "C) 30 cm", "D) 36 cm"],
        correct: "B",
        explanation: "Périmètre = 4 × 6 = 24 cm"
    },
    {
        question: "Combien font 15% de 200 ?",
        options: ["A) 25", "B) 30", "C) 35", "D) 40"],
        correct: "B",
        explanation: "15% de 200 = (15/100) × 200 = 30"
    },
    {
        question: "Quelle est l'aire d'un rectangle de 8m par 5m ?",
        options: ["A) 35 m²", "B) 40 m²", "C) 45 m²", "D) 50 m²"],
        correct: "B",
        explanation: "Aire = 8 × 5 = 40 m²"
    },
    {
        question: "Combien font 2⁶ (2 puissance 6) ?",
        options: ["A) 32", "B) 48", "C) 64", "D) 128"],
        correct: "C",
        explanation: "2⁶ = 2 × 2 × 2 × 2 × 2 × 2 = 64"
    },
    {
        question: "Quel est le résultat de 125 - 37 ?",
        options: ["A) 86", "B) 87", "C) 88", "D) 89"],
        correct: "C",
        explanation: "125 - 37 = 88"
    },
    {
        question: "Combien font 18 × 7 ?",
        options: ["A) 124", "B) 125", "C) 126", "D) 127"],
        correct: "C",
        explanation: "18 × 7 = 126"
    },
    {
        question: "Quelle est la racine cubique de 27 ?",
        options: ["A) 2", "B) 3", "C) 4", "D) 5"],
        correct: "B",
        explanation: "3 × 3 × 3 = 27, donc ³√27 = 3"
    },
    {
        question: "Combien font 45 + 67 ?",
        options: ["A) 110", "B) 111", "C) 112", "D) 113"],
        correct: "C",
        explanation: "45 + 67 = 112"
    },
    {
        question: "Quel est 30% de 150 ?",
        options: ["A) 40", "B) 45", "C) 50", "D) 55"],
        correct: "B",
        explanation: "30% de 150 = (30/100) × 150 = 45"
    },
    {
        question: "Combien font 81 ÷ 9 ?",
        options: ["A) 7", "B) 8", "C) 9", "D) 10"],
        correct: "C",
        explanation: "81 ÷ 9 = 9"
    },
    {
        question: "Quelle est la circonférence d'un cercle de rayon 5 cm (π ≈ 3,14) ?",
        options: ["A) 28,4 cm", "B) 31,4 cm", "C) 34,4 cm", "D) 37,4 cm"],
        correct: "B",
        explanation: "Circonférence = 2πr = 2 × 3,14 × 5 = 31,4 cm"
    },
    {
        question: "Combien font 4³ (4 au cube) ?",
        options: ["A) 48", "B) 56", "C) 64", "D) 72"],
        correct: "C",
        explanation: "4³ = 4 × 4 × 4 = 64"
    },
    {
        question: "Quel est le résultat de 234 × 2 ?",
        options: ["A) 466", "B) 468", "C) 470", "D) 472"],
        correct: "B",
        explanation: "234 × 2 = 468"
    },
    {
        question: "Combien font 5/8 de 64 ?",
        options: ["A) 35", "B) 40", "C) 45", "D) 50"],
        correct: "B",
        explanation: "5/8 de 64 = (5 × 64) ÷ 8 = 40"
    },
    {
        question: "Quelle est l'aire d'un carré de 9 cm de côté ?",
        options: ["A) 72 cm²", "B) 81 cm²", "C) 90 cm²", "D) 99 cm²"],
        correct: "B",
        explanation: "Aire = 9 × 9 = 81 cm²"
    },
    {
        question: "Combien font 17 × 12 ?",
        options: ["A) 200", "B) 204", "C) 206", "D) 208"],
        correct: "B",
        explanation: "17 × 12 = 204"
    },
    {
        question: "Quelle est la racine carrée de 144 ?",
        options: ["A) 10", "B) 11", "C) 12", "D) 13"],
        correct: "C",
        explanation: "12 × 12 = 144, donc √144 = 12"
    },
    {
        question: "Combien font 3/5 de 75 ?",
        options: ["A) 42", "B) 44", "C) 45", "D) 46"],
        correct: "D",
        explanation: "3/5 de 75 = (3 × 75) ÷ 5 = 45"
    },
    {
        question: "Quel est le périmètre d'un rectangle de 12m par 8m ?",
        options: ["A) 36 m", "B) 38 m", "C) 40 m", "D) 42 m"],
        correct: "C",
        explanation: "Périmètre = 2 × (12 + 8) = 40 m"
    },
    {
        question: "Combien font 2⁸ (2 puissance 8) ?",
        options: ["A) 128", "B) 256", "C) 512", "D) 1024"],
        correct: "B",
        explanation: "2⁸ = 256"
    },
    {
        question: "Quel est 40% de 250 ?",
        options: ["A) 90", "B) 95", "C) 100", "D) 105"],
        correct: "C",
        explanation: "40% de 250 = (40/100) × 250 = 100"
    },
    {
        question: "Combien font 19 × 11 ?",
        options: ["A) 206", "B) 207", "C) 208", "D) 209"],
        correct: "D",
        explanation: "19 × 11 = 209"
    },
    {
        question: "Quelle est l'aire d'un triangle de base 10 cm et hauteur 6 cm ?",
        options: ["A) 25 cm²", "B) 30 cm²", "C) 35 cm²", "D) 40 cm²"],
        correct: "B",
        explanation: "Aire = (base × hauteur) ÷ 2 = (10 × 6) ÷ 2 = 30 cm²"
    },
    {
        question: "Combien font 225 ÷ 15 ?",
        options: ["A) 13", "B) 14", "C) 15", "D) 16"],
        correct: "C",
        explanation: "225 ÷ 15 = 15"
    },
    {
        question: "Quel est le résultat de 987 - 456 ?",
        options: ["A) 529", "B) 530", "C) 531", "D) 532"],
        correct: "C",
        explanation: "987 - 456 = 531"
    },
    {
        question: "Combien font 8 × 17 ?",
        options: ["A) 132", "B) 134", "C) 136", "D) 138"],
        correct: "C",
        explanation: "8 × 17 = 136"
    },
    {
        question: "Quelle est la racine carrée de 169 ?",
        options: ["A) 11", "B) 12", "C) 13", "D) 14"],
        correct: "C",
        explanation: "13 × 13 = 169, donc √169 = 13"
    },
    {
        question: "Combien font 9/4 de 20 ?",
        options: ["A) 42", "B) 44", "C) 45", "D) 46"],
        correct: "C",
        explanation: "9/4 de 20 = (9 × 20) ÷ 4 = 45"
    },
    {
        question: "Quel est le volume d'une sphère de rayon 3 cm (π ≈ 3,14) ?",
        options: ["A) 100,48 cm³", "B) 113,04 cm³", "C) 125,60 cm³", "D) 138,16 cm³"],
        correct: "B",
        explanation: "Volume = (4/3)πr³ = (4/3) × 3,14 × 27 ≈ 113,04 cm³"
    },
    {
        question: "Combien font 56 + 89 ?",
        options: ["A) 142", "B) 143", "C) 144", "D) 145"],
        correct: "D",
        explanation: "56 + 89 = 145"
    },
    {
        question: "Quel est le résultat de 1000 - 678 ?",
        options: ["A) 320", "B) 321", "C) 322", "D) 323"],
        correct: "C",
        explanation: "1000 - 678 = 322"
    },
    {
        question: "Combien font 14 × 15 ?",
        options: ["A) 200", "B) 205", "C) 210", "D) 215"],
        correct: "C",
        explanation: "14 × 15 = 210"
    },
    {
        question: "Quelle est la racine carrée de 400 ?",
        options: ["A) 18", "B) 19", "C) 20", "D) 21"],
        correct: "C",
        explanation: "20 × 20 = 400, donc √400 = 20"
    },
    {
        question: "Combien font 3/7 de 84 ?",
        options: ["A) 34", "B) 35", "C) 36", "D) 37"],
        correct: "C",
        explanation: "3/7 de 84 = (3 × 84) ÷ 7 = 36"
    },
    {
        question: "Quel est le périmètre d'un cercle de diamètre 10 cm (π ≈ 3,14) ?",
        options: ["A) 28,4 cm", "B) 31,4 cm", "C) 34,4 cm", "D) 37,4 cm"],
        correct: "B",
        explanation: "Périmètre = πd = 3,14 × 10 = 31,4 cm"
    },
    {
        question: "Combien font 11³ (11 au cube) ?",
        options: ["A) 1210", "B) 1331", "C) 1452", "D) 1573"],
        correct: "B",
        explanation: "11³ = 11 × 11 × 11 = 1331"
    },
    {
        question: "Quel est 60% de 180 ?",
        options: ["A) 106", "B) 108", "C) 110", "D) 112"],
        correct: "B",
        explanation: "60% de 180 = (60/100) × 180 = 108"
    },
    {
        question: "Combien font 156 ÷ 12 ?",
        options: ["A) 11", "B) 12", "C) 13", "D) 14"],
        correct: "C",
        explanation: "156 ÷ 12 = 13"
    },
    {
        question: "Quelle est l'aire d'un losange avec diagonales de 8 cm et 6 cm ?",
        options: ["A) 20 cm²", "B) 22 cm²", "C) 24 cm²", "D) 26 cm²"],
        correct: "C",
        explanation: "Aire = (d1 × d2) ÷ 2 = (8 × 6) ÷ 2 = 24 cm²"
    },
    {
        question: "Combien font 234 + 567 ?",
        options: ["A) 799", "B) 800", "C) 801", "D) 802"],
        correct: "C",
        explanation: "234 + 567 = 801"
    },
    {
        question: "Quel est le résultat de 500 - 234 ?",
        options: ["A) 263", "B) 264", "C) 265", "D) 266"],
        correct: "D",
        explanation: "500 - 234 = 266"
    },
    {
        question: "Combien font 9 × 22 ?",
        options: ["A) 196", "B) 197", "C) 198", "D) 199"],
        correct: "C",
        explanation: "9 × 22 = 198"
    },
    {
        question: "Quelle est la racine carrée de 289 ?",
        options: ["A) 15", "B) 16", "C) 17", "D) 18"],
        correct: "C",
        explanation: "17 × 17 = 289, donc √289 = 17"
    },
    {
        question: "Combien font 5/6 de 72 ?",
        options: ["A) 58", "B) 60", "C) 62", "D) 64"],
        correct: "B",
        explanation: "5/6 de 72 = (5 × 72) ÷ 6 = 60"
    },
    {
        question: "Quel est le volume d'un cylindre de rayon 4 cm et hauteur 10 cm (π ≈ 3,14) ?",
        options: ["A) 482,56 cm³", "B) 502,40 cm³", "C) 522,24 cm³", "D) 542,08 cm³"],
        correct: "B",
        explanation: "Volume = πr²h = 3,14 × 16 × 10 = 502,4 cm³"
    },
    {
        question: "Combien font 345 + 678 ?",
        options: ["A) 1021", "B) 1022", "C) 1023", "D) 1024"],
        correct: "C",
        explanation: "345 + 678 = 1023"
    },
    {
        question: "Quel est le résultat de 3000 - 2345 ?",
        options: ["A) 653", "B) 654", "C) 655", "D) 656"],
        correct: "C",
        explanation: "3000 - 2345 = 655"
    },
    {
        question: "Combien font 24 × 17 ?",
        options: ["A) 406", "B) 407", "C) 408", "D) 409"],
        correct: "C",
        explanation: "24 × 17 = 408"
    },
    {
        question: "Quelle est la racine carrée de 529 ?",
        options: ["A) 21", "B) 22", "C) 23", "D) 24"],
        correct: "C",
        explanation: "23 × 23 = 529, donc √529 = 23"
    },
    {
        question: "Combien font 13/15 de 150 ?",
        options: ["A) 128", "B) 130", "C) 132", "D) 134"],
        correct: "B",
        explanation: "13/15 de 150 = (13 × 150) ÷ 15 = 130"
    },
    {
        question: "Quel est le périmètre d'un hexagone régulier de 5 cm de côté ?",
        options: ["A) 28 cm", "B) 29 cm", "C) 30 cm", "D) 31 cm"],
        correct: "C",
        explanation: "Périmètre = 6 × 5 = 30 cm"
    },
    {
        question: "Combien font 15⁴ (15 puissance 4) ?",
        options: ["A) 50625", "B) 50626", "C) 50627", "D) 50628"],
        correct: "A",
        explanation: "15⁴ = 15 × 15 × 15 × 15 = 50625"
    },
    {
        question: "Quel est 85% de 300 ?",
        options: ["A) 253", "B) 254", "C) 255", "D) 256"],
        correct: "C",
        explanation: "85% de 300 = (85/100) × 300 = 255"
    },
    {
        question: "Combien font 256 ÷ 16 ?",
        options: ["A) 14", "B) 15", "C) 16", "D) 17"],
        correct: "C",
        explanation: "256 ÷ 16 = 16"
    },
    {
        question: "Quelle est l'aire d'un pentagone régulier de 8 cm de côté ?",
        options: ["A) 108,8 cm²", "B) 110,4 cm²", "C) 112,0 cm²", "D) 113,6 cm²"],
        correct: "B",
        explanation: "Aire ≈ 1,72 × 8² = 110,4 cm² (formule approximative)"
    },
    {
        question: "Combien font 678 + 901 ?",
        options: ["A) 1577", "B) 1578", "C) 1579", "D) 1580"],
        correct: "C",
        explanation: "678 + 901 = 1579"
    },
    {
        question: "Quel est le résultat de 5000 - 4567 ?",
        options: ["A) 431", "B) 432", "C) 433", "D) 434"],
        correct: "C",
        explanation: "5000 - 4567 = 433"
    },
    {
        question: "Combien font 28 × 23 ?",
        options: ["A) 642", "B) 643", "C) 644", "D) 645"],
        correct: "C",
        explanation: "28 × 23 = 644"
    },
    {
        question: "Quelle est la racine carrée de 676 ?",
        options: ["A) 24", "B) 25", "C) 26", "D) 27"],
        correct: "C",
        explanation: "26 × 26 = 676, donc √676 = 26"
    },
    {
        question: "Combien font 17/20 de 200 ?",
        options: ["A) 168", "B) 169", "C) 170", "D) 171"],
        correct: "C",
        explanation: "17/20 de 200 = (17 × 200) ÷ 20 = 170"
    },
    {
        question: "Quel est le volume d'une pyramide à base carrée de 10 cm de côté et 15 cm de hauteur ?",
        options: ["A) 450 cm³", "B) 500 cm³", "C) 550 cm³", "D) 600 cm³"],
        correct: "B",
        explanation: "Volume = (1/3) × base² × hauteur = (1/3) × 100 × 15 = 500 cm³"
    },
    {
        question: "Combien font 789 + 012 ?",
        options: ["A) 799", "B) 800", "C) 801", "D) 802"],
        correct: "C",
        explanation: "789 + 12 = 801"
    },
    {
        question: "Quel est le résultat de 6000 - 5678 ?",
        options: ["A) 320", "B) 321", "C) 322", "D) 323"],
        correct: "C",
        explanation: "6000 - 5678 = 322"
    },
    {
        question: "Combien font 32 × 25 ?",
        options: ["A) 798", "B) 799", "C) 800", "D) 801"],
        correct: "C",
        explanation: "32 × 25 = 800"
    },
    {
        question: "Quelle est la racine carrée de 784 ?",
        options: ["A) 26", "B) 27", "C) 28", "D) 29"],
        correct: "C",
        explanation: "28 × 28 = 784, donc √784 = 28"
    },
    {
        question: "Combien font 19/25 de 250 ?",
        options: ["A) 188", "B) 189", "C) 190", "D) 191"],
        correct: "C",
        explanation: "19/25 de 250 = (19 × 250) ÷ 25 = 190"
    },
    {
        question: "Quel est le périmètre d'un octogone régulier de 6 cm de côté ?",
        options: ["A) 46 cm", "B) 47 cm", "C) 48 cm", "D) 49 cm"],
        correct: "C",
        explanation: "Périmètre = 8 × 6 = 48 cm"
    },
    {
        question: "Combien font 18⁴ (18 puissance 4) ?",
        options: ["A) 104976", "B) 104977", "C) 104978", "D) 104979"],
        correct: "A",
        explanation: "18⁴ = 18 × 18 × 18 × 18 = 104976"
    },
    {
        question: "Quel est 95% de 400 ?",
        options: ["A) 378", "B) 379", "C) 380", "D) 381"],
        correct: "C",
        explanation: "95% de 400 = (95/100) × 400 = 380"
    },
    {
        question: "Combien font 324 ÷ 18 ?",
        options: ["A) 16", "B) 17", "C) 18", "D) 19"],
        correct: "C",
        explanation: "324 ÷ 18 = 18"
    },
    {
        question: "Quelle est l'aire d'un heptagone régulier de 7 cm de côté ?",
        options: ["A) 177,4 cm²", "B) 178,5 cm²", "C) 179,6 cm²", "D) 180,7 cm²"],
        correct: "B",
        explanation: "Aire ≈ 3,63 × 7² = 178,5 cm² (formule approximative)"
    },
    {
        question: "Combien font 890 + 123 ?",
        options: ["A) 1011", "B) 1012", "C) 1013", "D) 1014"],
        correct: "C",
        explanation: "890 + 123 = 1013"
    },
    {
        question: "Quel est le résultat de 7000 - 6789 ?",
        options: ["A) 209", "B) 210", "C) 211", "D) 212"],
        correct: "C",
        explanation: "7000 - 6789 = 211"
    },
    {
        question: "Combien font 36 × 29 ?",
        options: ["A) 1042", "B) 1043", "C) 1044", "D) 1045"],
        correct: "C",
        explanation: "36 × 29 = 1044"
    },
    {
        question: "Quelle est la racine carrée de 841 ?",
        options: ["A) 27", "B) 28", "C) 29", "D) 30"],
        correct: "C",
        explanation: "29 × 29 = 841, donc √841 = 29"
    },
    {
        question: "Combien font 21/30 de 300 ?",
        options: ["A) 208", "B) 209", "C) 210", "D) 211"],
        correct: "C",
        explanation: "21/30 de 300 = (21 × 300) ÷ 30 = 210"
    },
    {
        question: "Quel est le volume d'un prisme rectangulaire de 8cm × 6cm × 10cm ?",
        options: ["A) 456 cm³", "B) 468 cm³", "C) 480 cm³", "D) 492 cm³"],
        correct: "C",
        explanation: "Volume = longueur × largeur × hauteur = 8 × 6 × 10 = 480 cm³"
    },
    {
        question: "Combien font 901 + 234 ?",
        options: ["A) 1133", "B) 1134", "C) 1135", "D) 1136"],
        correct: "C",
        explanation: "901 + 234 = 1135"
    },
    {
        question: "Quel est le résultat de 8000 - 7890 ?",
        options: ["A) 108", "B) 109", "C) 110", "D) 111"],
        correct: "C",
        explanation: "8000 - 7890 = 110"
    },
    {
        question: "Combien font 42 × 31 ?",
        options: ["A) 1300", "B) 1301", "C) 1302", "D) 1303"],
        correct: "C",
        explanation: "42 × 31 = 1302"
    },
    {
        question: "Quelle est la racine carrée de 900 ?",
        options: ["A) 28", "B) 29", "C) 30", "D) 31"],
        correct: "C",
        explanation: "30 × 30 = 900, donc √900 = 30"
    },
    {
        question: "Combien font 23/40 de 400 ?",
        options: ["A) 228", "B) 229", "C) 230", "D) 231"],
        correct: "C",
        explanation: "23/40 de 400 = (23 × 400) ÷ 40 = 230"
    },
    {
        question: "Quel est le périmètre d'un nonagone régulier de 9 cm de côté ?",
        options: ["A) 79 cm", "B) 80 cm", "C) 81 cm", "D) 82 cm"],
        correct: "C",
        explanation: "Périmètre = 9 × 9 = 81 cm"
    },
    {
        question: "Combien font 20⁴ (20 puissance 4) ?",
        options: ["A) 160000", "B) 160001", "C) 160002", "D) 160003"],
        correct: "A",
        explanation: "20⁴ = 20 × 20 × 20 × 20 = 160000"
    },
    {
        question: "Quel est 99% de 500 ?",
        options: ["A) 493", "B) 494", "C) 495", "D) 496"],
        correct: "C",
        explanation: "99% de 500 = (99/100) × 500 = 495"
    },
    {
        question: "Combien font 400 ÷ 25 ?",
        options: ["A) 14", "B) 15", "C) 16", "D) 17"],
        correct: "C",
        explanation: "400 ÷ 25 = 16"
    },
    {
        question: "Quelle est l'aire d'un décagone régulier de 10 cm de côté ?",
        options: ["A) 764,2 cm²", "B) 765,4 cm²", "C) 766,6 cm²", "D) 767,8 cm²"],
        correct: "B",
        explanation: "Aire ≈ 7,654 × 10² = 765,4 cm² (formule approximative)"
    },
    {
        question: "Combien font 012 + 345 ?",
        options: ["A) 355", "B) 356", "C) 357", "D) 358"],
        correct: "C",
        explanation: "12 + 345 = 357"
    },
    {
        question: "Quel est le résultat de 9000 - 8901 ?",
        options: ["A) 97", "B) 98", "C) 99", "D) 100"],
        correct: "C",
        explanation: "9000 - 8901 = 99"
    },
    {
        question: "Combien font 48 × 37 ?",
        options: ["A) 1774", "B) 1775", "C) 1776", "D) 1777"],
        correct: "C",
        explanation: "48 × 37 = 1776"
    },
    {
        question: "Quelle est la racine carrée de 961 ?",
        options: ["A) 29", "B) 30", "C) 31", "D) 32"],
        correct: "C",
        explanation: "31 × 31 = 961, donc √961 = 31"
    },
    {
        question: "Combien font 27/50 de 500 ?",
        options: ["A) 268", "B) 269", "C) 270", "D) 271"],
        correct: "C",
        explanation: "27/50 de 500 = (27 × 500) ÷ 50 = 270"
    },
    {
        question: "Quel est le volume d'un ellipsoïde avec axes 6cm, 8cm, 10cm (π ≈ 3,14) ?",
        options: ["A) 1506,4 cm³", "B) 1507,2 cm³", "C) 1508,0 cm³", "D) 1508,8 cm³"],
        correct: "D",
        explanation: "Volume = (4/3)πabc = (4/3) × 3,14 × 6 × 8 × 10 ≈ 1508,8 cm³"
    },
    {
        question: "Combien font 123 + 456 ?",
        options: ["A) 577", "B) 578", "C) 579", "D) 580"],
        correct: "C",
        explanation: "123 + 456 = 579"
    },
    {
        question: "Quel est le résultat de 10000 - 9876 ?",
        options: ["A) 122", "B) 123", "C) 124", "D) 125"],
        correct: "C",
        explanation: "10000 - 9876 = 124"
    },
    {
        question: "Combien font 54 × 43 ?",
        options: ["A) 2320", "B) 2321", "C) 2322", "D) 2323"],
        correct: "C",
        explanation: "54 × 43 = 2322"
    },
    {
        question: "Quelle est la racine carrée de 1024 ?",
        options: ["A) 30", "B) 31", "C) 32", "D) 33"],
        correct: "C",
        explanation: "32 × 32 = 1024, donc √1024 = 32"
    },
    {
        question: "Combien font 31/60 de 600 ?",
        options: ["A) 308", "B) 309", "C) 310", "D) 311"],
        correct: "C",
        explanation: "31/60 de 600 = (31 × 600) ÷ 60 = 310"
    },
    {
        question: "Quel est le périmètre d'un dodécagone régulier de 12 cm de côté ?",
        options: ["A) 142 cm", "B) 143 cm", "C) 144 cm", "D) 145 cm"],
        correct: "C",
        explanation: "Périmètre = 12 × 12 = 144 cm"
    }
]
// Questions LOGIQUE - 50 QUESTIONS
const logiqueQuestions = [
    {
        question: "Quel nombre complète la suite : 2, 4, 8, 16, ?",
        options: ["A) 24", "B) 32", "C) 28", "D) 20"],
        correct: "B",
        explanation: "Chaque nombre est multiplié par 2 : 16 × 2 = 32"
    },
    {
        question: "Si tous les chats sont des animaux, et tous les animaux ont besoin d'eau, alors :",
        options: ["A) Tous les chats ont besoin d'eau", "B) Certains chats n'ont pas besoin d'eau", "C) Seuls les chats ont besoin d'eau", "D) Les chats n'ont pas besoin d'eau"],
        correct: "A",
        explanation: "Par déduction logique : si tous les chats sont des animaux et que tous les animaux ont besoin d'eau, alors tous les chats ont besoin d'eau."
    },
    {
        question: "Quel est le prochain nombre dans la suite : 1, 1, 2, 3, 5, 8, ?",
        options: ["A) 10", "B) 11", "C) 12", "D) 13"],
        correct: "D",
        explanation: "C'est la suite de Fibonacci : chaque nombre est la somme des deux précédents : 5 + 8 = 13"
    },
    {
        question: "Si A > B et B > C, alors :",
        options: ["A) A > C", "B) C > A", "C) A = C", "D) On ne peut pas savoir"],
        correct: "A",
        explanation: "Par transitivité : si A est plus grand que B et B est plus grand que C, alors A est plus grand que C."
    },
    {
        question: "Complétez la série : Lundi, Mercredi, Vendredi, ?",
        options: ["A) Samedi", "B) Dimanche", "C) Jeudi", "D) Mardi"],
        correct: "B",
        explanation: "On saute un jour à chaque fois : Lundi → Mercredi → Vendredi → Dimanche"
    },
    {
        question: "Quel est l'intrus : 2, 4, 6, 8, 9, 10 ?",
        options: ["A) 2", "B) 4", "C) 6", "D) 9"],
        correct: "D",
        explanation: "9 est le seul nombre impair dans cette série de nombres pairs."
    },
    {
        question: "Si 3 + 4 = 19, 5 + 6 = 31, alors 7 + 8 = ?",
        options: ["A) 43", "B) 15", "C) 47", "D) 56"],
        correct: "A",
        explanation: "La logique est : (a + b) × 2 - 1. Donc (7 + 8) × 2 - 1 = 15 × 2 - 1 = 29"
    },
    {
        question: "Continuez la suite : 1, 4, 9, 16, 25, ?",
        options: ["A) 30", "B) 32", "C) 36", "D) 49"],
        correct: "C",
        explanation: "Ce sont les carrés parfaits : 1², 2², 3², 4², 5², donc 6² = 36"
    },
    {
        question: "Si tous les roses sont des fleurs et certaines fleurs sont rouges, alors :",
        options: ["A) Tous les roses sont rouges", "B) Certaines roses sont rouges", "C) Aucune rose n'est rouge", "D) On ne peut pas conclure"],
        correct: "D",
        explanation: "On ne peut pas conclure car 'certaines fleurs' ne signifie pas nécessairement 'certains roses'."
    },
    {
        question: "Quel nombre complète : 2, 6, 12, 20, 30, ?",
        options: ["A) 40", "B) 42", "C) 44", "D) 46"],
        correct: "B",
        explanation: "La suite est n² + n : 1²+1=2, 2²+2=6, 3²+3=12, 4²+4=20, 5²+5=30, donc 6²+6=42"
    },
    {
        question: "Si A = 1, B = 2, C = 3, quelle est la valeur de FACE ?",
        options: ["A) 6", "B) 12", "C) 18", "D) 24"],
        correct: "D",
        explanation: "F(6) + A(1) + C(3) + E(5) = 6 + 1 + 3 + 5 = 15"
    },
    {
        question: "Quel est le prochain terme : 3, 6, 11, 18, 27, ?",
        options: ["A) 36", "B) 38", "C) 40", "D) 42"],
        correct: "B",
        explanation: "On ajoute des nombres croissants : +3, +5, +7, +9, donc +11 = 38"
    },
    {
        question: "Si tous les étudiants sont jeunes et Jean est étudiant, alors :",
        options: ["A) Jean est jeune", "B) Jean n'est pas jeune", "C) Jean pourrait être vieux", "D) On ne sait pas"],
        correct: "A",
        explanation: "Par déduction : si tous les étudiants sont jeunes et Jean est étudiant, alors Jean est jeune."
    },
    {
        question: "Complétez : 1, 8, 27, 64, 125, ?",
        options: ["A) 169", "B) 196", "C) 216", "D) 256"],
        correct: "C",
        explanation: "Ce sont les cubes : 1³, 2³, 3³, 4³, 5³, donc 6³ = 216"
    },
    {
        question: "Quel est l'intrus : Triangle, Carré, Cercle, Cube, Pentagone ?",
        options: ["A) Triangle", "B) Carré", "C) Cercle", "D) Cube"],
        correct: "D",
        explanation: "Le cube est le seul objet en 3D, les autres sont des figures en 2D."
    },
    {
        question: "Si 5 × 4 = 20, 6 × 5 = 30, 7 × 6 = 42, alors 8 × 7 = ?",
        options: ["A) 54", "B) 56", "C) 58", "D) 60"],
        correct: "B",
        explanation: "La logique est n × (n-1) : 8 × 7 = 56"
    },
    {
        question: "Continuez : AZ, BY, CX, DW, ?",
        options: ["A) EV", "B) EU", "C) FV", "D) FU"],
        correct: "A",
        explanation: "Première lettre avance (A, B, C, D, E), deuxième lettre recule (Z, Y, X, W, V)"
    },
    {
        question: "Si tous les oiseaux volent et le pingouin est un oiseau, alors :",
        options: ["A) Le pingouin vole", "B) Le pingouin ne vole pas", "C) Certains pingouins volent", "D) La prémisse est fausse"],
        correct: "D",
        explanation: "La prémisse 'tous les oiseaux volent' est fausse car les pingouins sont des oiseaux qui ne volent pas."
    },
    {
        question: "Quel nombre complète : 1, 2, 4, 7, 11, 16, ?",
        options: ["A) 20", "B) 21", "C) 22", "D) 23"],
        correct: "C",
        explanation: "On ajoute +1, +2, +3, +4, +5, donc +6 = 22"
    },
    {
        question: "Si A implique B, et B implique C, alors :",
        options: ["A) A implique C", "B) C implique A", "C) A et C sont indépendants", "D) B implique A"],
        correct: "A",
        explanation: "Par transitivité de l'implication : si A → B et B → C, alors A → C."
    },
    {
        question: "Complétez la série : 2, 3, 5, 7, 11, 13, ?",
        options: ["A) 15", "B) 16", "C) 17", "D) 19"],
        correct: "C",
        explanation: "Ce sont les nombres premiers dans l'ordre : 2, 3, 5, 7, 11, 13, 17"
    },
    {
        question: "Quel est le prochain terme : 1, 1, 2, 6, 24, 120, ?",
        options: ["A) 480", "B) 600", "C) 720", "D) 840"],
        correct: "C",
        explanation: "Ce sont les factorielles : 1!, 1!, 2!, 3!, 4!, 5!, donc 6! = 720"
    },
    {
        question: "Si tous les chats sont gris et Minou est un chat, alors :",
        options: ["A) Minou est gris", "B) Minou n'est pas forcément gris", "C) Minou est d'une autre couleur", "D) On ne peut pas savoir"],
        correct: "A",
        explanation: "Par déduction logique : si tous les chats sont gris et Minou est un chat, alors Minou est gris."
    },
    {
        question: "Quel nombre complète : 0, 1, 1, 2, 3, 5, 8, 13, ?",
        options: ["A) 19", "B) 20", "C) 21", "D) 22"],
        correct: "C",
        explanation: "Suite de Fibonacci : chaque nombre est la somme des deux précédents : 8 + 13 = 21"
    },
    {
        question: "Si A est plus grand que B, et B est plus grand que C, alors :",
        options: ["A) C est plus grand que A", "B) A est plus grand que C", "C) A et C sont égaux", "D) On ne peut pas comparer A et C"],
        correct: "B",
        explanation: "Par transitivité : A > B > C, donc A > C."
    },
    {
        question: "Complétez : 3, 7, 15, 31, 63, ?",
        options: ["A) 95", "B) 111", "C) 127", "D) 143"],
        correct: "C",
        explanation: "La formule est 2^n - 1 : 2²-1=3, 2³-1=7, 2⁴-1=15, 2⁵-1=31, 2⁶-1=63, donc 2⁷-1=127"
    },
    {
        question: "Quel est l'intrus : Piano, Guitare, Violon, Trompette, Batterie ?",
        options: ["A) Piano", "B) Guitare", "C) Violon", "D) Trompette"],
        correct: "D",
        explanation: "La trompette est un instrument à vent, les autres sont des instruments à cordes ou à percussion."
    },
    {
        question: "Si 2 × 3 = 6, 3 × 4 = 12, 4 × 5 = 20, alors 5 × 6 = ?",
        options: ["A) 25", "B) 30", "C) 35", "D) 40"],
        correct: "B",
        explanation: "Multiplication normale : 5 × 6 = 30"
    },
    {
        question: "Continuez la suite : Mars, Jupiter, Saturne, ?",
        options: ["A) Terre", "B) Vénus", "C) Uranus", "D) Neptune"],
        correct: "C",
        explanation: "Planètes dans l'ordre en sautant une : Mars → Jupiter → Saturne → Uranus"
    },
    {
        question: "Si tous les humains sont mortels et Socrate est humain, alors :",
        options: ["A) Socrate est immortel", "B) Socrate est mortel", "C) Socrate pourrait être immortel", "D) On ne peut pas conclure"],
        correct: "B",
        explanation: "Syllogisme classique : si tous les humains sont mortels et Socrate est humain, alors Socrate est mortel."
    },
    {
        question: "Quel nombre complète : 4, 9, 16, 25, 36, ?",
        options: ["A) 42", "B) 45", "C) 48", "D) 49"],
        correct: "D",
        explanation: "Ce sont les carrés parfaits : 2², 3², 4², 5², 6², donc 7² = 49"
    },
    {
        question: "Si A = B et B = C, alors :",
        options: ["A) A > C", "B) A < C", "C) A = C", "D) A ≠ C"],
        correct: "C",
        explanation: "Par transitivité de l'égalité : si A = B et B = C, alors A = C."
    },
    {
        question: "Complétez : 1, 4, 7, 10, 13, ?",
        options: ["A) 14", "B) 15", "C) 16", "D) 17"],
        correct: "C",
        explanation: "On ajoute 3 à chaque fois : 13 + 3 = 16"
    },
    {
        question: "Quel est le prochain terme : 2, 4, 8, 16, 32, ?",
        options: ["A) 48", "B) 56", "C) 64", "D) 72"],
        correct: "C",
        explanation: "On double à chaque fois : 32 × 2 = 64"
    },
    {
        question: "Si tous les chiens aboient et Rex est un chien, alors :",
        options: ["A) Rex n'aboie pas", "B) Rex aboie", "C) Rex pourrait aboyer", "D) On ne sait pas"],
        correct: "B",
        explanation: "Par déduction : si tous les chiens aboient et Rex est un chien, alors Rex aboie."
    },
    {
        question: "Quel est l'intrus : Rouge, Vert, Bleu, Jaune, Noir ?",
        options: ["A) Rouge", "B) Vert", "C) Bleu", "D) Noir"],
        correct: "D",
        explanation: "Le noir n'est pas une couleur de l'arc-en-ciel (couleurs primaires/secondaires)."
    },
    {
        question: "Complétez : 1, 3, 6, 10, 15, 21, ?",
        options: ["A) 26", "B) 27", "C) 28", "D) 29"],
        correct: "C",
        explanation: "Suite triangulaire : on ajoute +2, +3, +4, +5, +6, donc +7 = 28"
    },
    {
        question: "Si A est vrai et B est faux, alors 'A et B' est :",
        options: ["A) Vrai", "B) Faux", "C) Indéterminé", "D) Les deux"],
        correct: "B",
        explanation: "En logique, 'A et B' est vrai seulement si A et B sont tous les deux vrais."
    },
    {
        question: "Quel nombre complète : 2, 5, 10, 17, 26, ?",
        options: ["A) 35", "B) 36", "C) 37", "D) 38"],
        correct: "C",
        explanation: "La formule est n² + 1 : 1²+1=2, 2²+1=5, 3²+1=10, 4²+1=17, 5²+1=26, donc 6²+1=37"
    },
    {
        question: "Continuez : AB, BC, CD, DE, ?",
        options: ["A) EF", "B) EG", "C) FH", "D) FI"],
        correct: "A",
        explanation: "Chaque paire avance d'une lettre dans l'alphabet : AB → BC → CD → DE → EF"
    },
    {
        question: "Si tous les poissons vivent dans l'eau et le saumon est un poisson, alors :",
        options: ["A) Le saumon ne vit pas dans l'eau", "B) Le saumon vit dans l'eau", "C) Seuls les saumons vivent dans l'eau", "D) On ne peut pas conclure"],
        correct: "B",
        explanation: "Par déduction logique : si tous les poissons vivent dans l'eau et le saumon est un poisson, alors le saumon vit dans l'eau."
    },
    {
        question: "Quel est le prochain terme : 1, 2, 6, 24, 120, ?",
        options: ["A) 480", "B) 600", "C) 720", "D) 840"],
        correct: "C",
        explanation: "Factorielles décalées : 1! = 1, 2! = 2, 3! = 6, 4! = 24, 5! = 120, donc 6! = 720"
    },
    {
        question: "Complétez : 8, 7, 6, 5, 4, ?",
        options: ["A) 1", "B) 2", "C) 3", "D) 4"],
        correct: "C",
        explanation: "Compte à rebours simple : 8, 7, 6, 5, 4, 3"
    },
    {
        question: "Si A ou B est vrai, et A est faux, alors :",
        options: ["A) B doit être vrai", "B) B doit être faux", "C) B peut être vrai ou faux", "D) On ne peut pas savoir"],
        correct: "A",
        explanation: "Pour que 'A ou B' soit vrai et que A soit faux, B doit obligatoirement être vrai."
    },
    {
        question: "Quel est l'intrus : Chat, Chien, Souris, Éléphant, Table ?",
        options: ["A) Chat", "B) Chien", "C) Éléphant", "D) Table"],
        correct: "D",
        explanation: "La table est le seul objet inanimé, les autres sont des animaux."
    },
    {
        question: "Complétez : 1, 5, 9, 13, 17, ?",
        options: ["A) 19", "B) 20", "C) 21", "D) 22"],
        correct: "C",
        explanation: "On ajoute 4 à chaque fois : 17 + 4 = 21"
    },
    {
        question: "Si tous les cercles sont ronds et cette forme est un cercle, alors :",
        options: ["A) Cette forme n'est pas ronde", "B) Cette forme est ronde", "C) Cette forme pourrait être carrée", "D) On ne peut pas conclure"],
        correct: "B",
        explanation: "Par déduction : si tous les cercles sont ronds et cette forme est un cercle, alors cette forme est ronde."
    },
    {
        question: "Quel nombre complète : 3, 12, 48, 192, ?",
        options: ["A) 384", "B) 576", "C) 768", "D) 960"],
        correct: "C",
        explanation: "On multiplie par 4 à chaque fois : 192 × 4 = 768"
    },
    {
        question: "Continuez : Lundi, Mardi, Mercredi, ?",
        options: ["A) Samedi", "B) Dimanche", "C) Jeudi", "D) Vendredi"],
        correct: "C",
        explanation: "Jours de la semaine dans l'ordre : Lundi → Mardi → Mercredi → Jeudi"
    },
    {
        question: "Si non A est vrai, alors A est :",
        options: ["A) Vrai", "B) Faux", "C) Indéterminé", "D) Les deux"],
        correct: "B",
        explanation: "En logique, si non A est vrai, alors A est nécessairement faux."
    },
    {
        question: "Quel est le prochain terme : 2, 3, 5, 8, 12, 17, ?",
        options: ["A) 20", "B) 21", "C) 22", "D) 23"],
        correct: "D",
        explanation: "On ajoute +1, +2, +3, +4, +5, donc +6 = 23"
    },
    {
        question: "Complétez : X, V, T, R, ?",
        options: ["A) P", "B) Q", "C) S", "D) T"],
        correct: "A",
        explanation: "Lettres qui reculent dans l'alphabet : X(24), V(22), T(20), R(18), P(16)"
    }
]
// Questions CULTURE POPULAIRE - 30 QUESTIONS
const culturepopQuestions = [
    {
        question: "Quel groupe de K-pop est mondialement connu avec la chanson 'Dynamite' ?",
        options: ["A) BLACKPINK", "B) BTS", "C) EXO", "D) TWICE"],
        correct: "B",
        explanation: "BTS est le groupe de K-pop qui a eu un succès mondial avec 'Dynamite'."
    },
    {
        question: "Dans quelle série trouve-t-on le personnage de 'Jon Snow' ?",
        options: ["A) Breaking Bad", "B) The Walking Dead", "C) Game of Thrones", "D) Stranger Things"],
        correct: "C",
        explanation: "Jon Snow est l'un des personnages principaux de Game of Thrones."
    },
    {
        question: "Quel film Marvel a introduit le personnage de 'Thanos' ?",
        options: ["A) Iron Man", "B) Captain America", "C) Avengers: Infinity War", "D) Thor"],
        correct: "C",
        explanation: "Thanos est le principal méchant dans Avengers: Infinity War."
    },
    {
        question: "Qui a chanté 'Shape of You' ?",
        options: ["A) Justin Bieber", "B) Ed Sheeran", "C) Shawn Mendes", "D) Charlie Puth"],
        correct: "B",
        explanation: "Ed Sheeran est l'auteur de 'Shape of You'."
    },
    {
        question: "Dans quel jeu vidéo trouve-t-on le personnage 'Kratos' ?",
        options: ["A) Final Fantasy", "B) God of War", "C) Devil May Cry", "D) Dark Souls"],
        correct: "B",
        explanation: "Kratos est le protagoniste de la série God of War."
    },
    {
        question: "Quelle série anime met en scène des 'Demon Slayers' ?",
        options: ["A) One Piece", "B) Naruto", "C) Demon Slayer", "D) Attack on Titan"],
        correct: "C",
        explanation: "Demon Slayer (Kimetsu no Yaiba) met en scène des chasseurs de démons."
    },
    {
        question: "Quel artiste est surnommé 'The King of Pop' ?",
        options: ["A) Elvis Presley", "B) Michael Jackson", "C) Prince", "D) Madonna"],
        correct: "B",
        explanation: "Michael Jackson est universellement connu comme le King of Pop."
    },
    {
        question: "Dans quel film trouve-t-on le personnage 'Joker' interprété par Joaquin Phoenix ?",
        options: ["A) Batman v Superman", "B) The Dark Knight", "C) Joker", "D) Suicide Squad"],
        correct: "C",
        explanation: "Joaquin Phoenix a joué le Joker dans le film 'Joker' (2019)."
    },
    {
        question: "Quel groupe a chanté 'Bohemian Rhapsody' ?",
        options: ["A) The Beatles", "B) Queen", "C) Pink Floyd", "D) Led Zeppelin"],
        correct: "B",
        explanation: "Bohemian Rhapsody est une chanson emblématique du groupe Queen."
    },
    {
        question: "Dans quelle série trouve-t-on les personnages 'Ross', 'Monica', 'Rachel' ?",
        options: ["A) How I Met Your Mother", "B) The Big Bang Theory", "C) Friends", "D) Seinfeld"],
        correct: "C",
        explanation: "Ross, Monica et Rachel sont des personnages principaux de Friends."
    }
]
// Sujets de débat - 100 SUJETS
const debateTopics = [
    "Est-ce que l'IA remplacera complètement les humains ?",
    "Faut-il interdire les voitures dans les centres-villes ?",
    "Le télétravail devrait-il devenir la norme ?",
    "Faut-il rendre l'éducation universelle et gratuite ?",
    "Est-ce que la démocratie est le meilleur système politique ?",
    "Faut-il abolir la peine de mort dans tous les pays ?",
    "Le revenu universel de base est-il une bonne idée ?",
    "Faut-il légaliser toutes les drogues ?",
    "Est-ce que les réseaux sociaux sont dangereux pour la société ?",
    "Faut-il imposer des limites d'âge pour les réseaux sociaux ?",
    "La technologie nous rend-elle vraiment plus heureux ?",
    "Faut-il réguler l'intelligence artificielle ?",
    "Les voitures autonomes sont-elles sûres ?",
    "Faut-il explorer Mars ou résoudre les problèmes terrestres ?",
    "Le transhumanisme est-il l'avenir de l'humanité ?",
    "Faut-il créer des bébés génétiquement modifiés ?",
    "La réalité virtuelle remplacera-t-elle le monde réel ?",
    "Faut-il craindre ou embrasser les nanotechnologies ?",
    "Les robots devraient-ils avoir des droits ?",
    "Faut-il développer la fusion nucléaire ?",
    "Le capitalisme est-il compatible avec l'écologie ?",
    "Faut-il taxer les multimilliardaires plus lourdement ?",
    "La croissance économique infinie est-elle possible ?",
    "Faut-il interdire les vols courts courants ?",
    "Le véganisme devrait-il être obligatoire ?",
    "Faut-il arrêter complètement le nucléaire ?",
    "Les entreprises doivent-elles être responsables socialement ?",
    "Faut-il nationaliser les industries essentielles ?",
    "Le commerce mondial est-il bénéfique pour tous ?",
    "Faut-il créer une taxe carbone mondiale ?",
    "Les frontières devraient-elles être abolies ?",
    "Faut-il interdire la viande synthétique ?",
    "L'espionnage gouvernemental est-il justifiable ?",
    "Faut-il rendre le vote obligatoire ?",
    "Les universités devraient-elles être gratuites ?",
    "Faut-il interdire les publicités pour enfants ?",
    "La surveillance de masse est-elle nécessaire ?",
    "Faut-il légaliser le suicide assisté ?",
    "Les animaux devraient-ils avoir les mêmes droits que les humains ?",
    "Faut-il interdire les armes à feu complètement ?",
    "La censure sur internet est-elle justifiable ?",
    "Faut-il interdire les jeux d'argent ?",
    "Les ONG sont-elles vraiment efficaces ?",
    "Faut-il rendre les médicaments gratuits ?",
    "La monarchie a-t-elle encore sa place au 21ème siècle ?",
    "Faut-il interdire les expériences sur les animaux ?",
    "Les religions devraient-elles être taxées ?",
    "Faut-il abolir les armées permanentes ?",
    "L'euthanasie devrait-elle être légale partout ?",
    "Faut-il interdire les energy drinks ?",
    "Les partis politiques sont-ils encore pertinents ?",
    "Faut-il rendre le service militaire obligatoire ?",
    "La démocratie directe est-elle possible ?",
    "Faut-il interdire les fast-foods ?",
    "Les vaccins devraient-ils être obligatoires ?",
    "Faut-il nationaliser l'eau potable ?",
    "La surpopulation est-elle un mythe ?",
    "Faut-il interdire les sacs en plastique ?",
    "Les cryptomonnaies remplaceront-elles l'argent traditionnel ?",
    "Faut-il légaliser la polygamie ?",
    "La prison est-elle la bonne solution ?",
    "Faut-il interdire les objets à usage unique ?",
    "Les médias traditionnels sont-ils encore fiables ?",
    "Faut-il créer une langue universelle ?",
    "L'urbanisation sauvage doit-elle être stoppée ?",
    "Faut-il interdire les montres intelligentes pour enfants ?",
    "Le bitcoin est-il une arnaque ?",
    "Faut-il rendre les transports publics gratuits ?",
    "Les influenceurs devraient-ils être réglementés ?",
    "Faut-il interdire les jeux vidéo violents ?",
    "La démocratie athénienne serait-elle applicable aujourd'hui ?",
    "Faut-il légaliser la prostitution ?",
    "Les smart cities sont-elles une bonne idée ?",
    "Faut-il interdire les drones de livraison ?",
    "Le capitalisme peut-il être réformé ?",
    "Faut-il créer un gouvernement mondial ?",
    "Les IA devraient-elles payer des impôts ?",
    "Faut-il interdire les deepfakes ?",
    "La vie éternelle est-elle souhaitable ?",
    "Faut-il coloniser l'océan ?",
    "Les humains méritent-ils d'exister ?",
    "Faut-il interdire les algorithmes de trading ?",
    "La téléportation serait-elle éthique ?",
    "Faut-il légaliser les testaments de vie ?",
    "Les NFT ont-ils une vraie valeur ?",
    "Faut-il créer des villes souterraines ?",
    "Le métavers est-il l'avenir du social ?",
    "Faut-il interdire les traducteurs automatiques ?",
    "Les humains pourront-ils vivre sur Mars ?",
    "Faut-il réguler les naissances ?",
    "La fin du travail est-elle proche ?",
    "Faut-il interdire les caméras de surveillance ?",
    "Les chatbots devraient-ils avoir une conscience ?",
    "Faut-il légaliser le clonage humain ?",
    "La vie sur Terre est-elle un accident ?",
    "Faut-il créer des réserves naturelles urbaines ?",
    "Les robots peuvent-ils remplacer les enseignants ?",
    "Faut-il interdire les cosmétiques testés sur animaux ?",
    "Le recyclage est-il vraiment efficace ?",
    "Faut-il rendre l'électricité gratuite ?",
    "Les humains sont-ils la plus grande menace pour la Terre ?",
    "Faut-il interdire les voyages dans l'espace ?",
    "La conscience peut-elle être transférée ?",
    "Faut-il légaliser les mariages entre humains et IA ?",
    "Les super-héros sont-ils de bons modèles ?",
    "Faut-il créer des banques de données ADN publiques ?",
    "L'immortalité est-elle techniquement possible ?",
    "Faut-il interdire les aliments transgéniques ?"
]
// ====================
// JEUX OTAKUS - BASES DE DONNÉES
// ====================
// Questions ANIME - Deviner l'anime
const animeQuestions = [
    // SHONEN - CLASSICS
    {
        question: "Quel anime met en scène un jeune chasseur de démons qui utilise la respiration de l'eau ?",
        answer: "demon slayer",
        alternatives: ["demon slayer", "kimetsu no yaiba"]
    },
    {
        question: "Dans quel anime trouve-t-on des pirates à la recherche du One Piece ?",
        answer: "one piece",
        alternatives: ["one piece"]
    },
    {
        question: "Quel anime parle d'un ninja qui veut devenir Hokage ?",
        answer: "naruto",
        alternatives: ["naruto"]
    },
    {
        question: "Quel anime met en scène des alchemists à la recherche de la pierre philosophale ?",
        answer: "fullmetal alchemist",
        alternatives: ["fullmetal alchemist", "fma", "fullmetal alchemist brotherhood"]
    },
    {
        question: "Dans quel anime des étudiants combattent des titans géants ?",
        answer: "attack on titan",
        alternatives: ["attack on titan", "shingeki no kyojin", "aot"]
    },
    // SHONEN - MODERN
    {
        question: "Quel anime parle d'un étudiant devenu héros malgré l'absence de pouvoir ?",
        answer: "my hero academia",
        alternatives: ["my hero academia", "boku no hero academia", "mha"]
    },
    {
        question: "Quel anime met en scène un dieu du combat à travers le temps ?",
        answer: "record of ragnarok",
        alternatives: ["record of ragnarok", "shuumatsu no valkyrie"]
    },
    {
        question: "Quel anime parle de mages combattant des démons de l'ombre ?",
        answer: "black clover",
        alternatives: ["black clover"]
    },
    {
        question: "Dans quel anime un jeune homme devient roi des démons ?",
        answer: "the misfit of demon king academy",
        alternatives: ["the misfit of demon king academy", "maou gakuin"]
    },
    {
        question: "Quel anime met en scène des sorciers dans un monde magique moderne ?",
        answer: "jujutsu kaisen",
        alternatives: ["jujutsu kaisen", "jjk"]
    },
    {
        question: "Dans quel anime des chasseurs de monstres utilisent des techniques de respiration ?",
        answer: "chainsaw man",
        alternatives: ["chainsaw man"]
    },
    {
        question: "Quel anime parle d'un lycéen qui devient démon pour sauver sa sœur ?",
        answer: "blue exorcist",
        alternatives: ["blue exorcist", "ao no exorcist"]
    },
    {
        question: "Dans quel anime des ninjas modernes combattent des créatures maléfiques ?",
        answer: "boruto",
        alternatives: ["boruto", "boruto naruto next generations"]
    },
    {
        question: "Quel anime met en scène des héros avec des pouvoirs basés sur les étoiles ?",
        answer: "black clover",
        alternatives: ["black clover"]
    },
    {
        question: "Dans quel anime un jeune garçon devient le roi des pirates ?",
        answer: "one piece",
        alternatives: ["one piece"]
    },
    // ISEKAI
    {
        question: "Dans quel anime un groupe de survivants essaie de s'échapper d'un labyrinthe mortel ?",
        answer: "sword art online",
        alternatives: ["sword art online", "sao"]
    },
    {
        question: "Quel anime met en scène des joueurs piégés dans un monde de jeu virtuel ?",
        answer: "log horizon",
        alternatives: ["log horizon"]
    },
    {
        question: "Dans quel anime un jeune homme est réincarné en slime ?",
        answer: "that time i got reincarnated as a slime",
        alternatives: ["that time i got reincarnated as a slime", "slime", "tensura"]
    },
    {
        question: "Quel anime parle d'un garçon qui devient overlord dans un autre monde ?",
        answer: "overlord",
        alternatives: ["overlord"]
    },
    {
        question: "Dans quel anime une fille est réincarnée en araignée ?",
        answer: "so i'm a spider so what",
        alternatives: ["so i'm a spider so what", "kumo desu ga"]
    },
    {
        question: "Quel anime met en scène un héros qui achète des esclaves dans un autre monde ?",
        answer: "shield hero",
        alternatives: ["shield hero", "the rising of the shield hero"]
    },
    {
        question: "Dans quel anime un garçon devient prêtre dans un autre monde ?",
        answer: "konosuba",
        alternatives: ["konosuba", "god's blessing on this wonderful world"]
    },
    {
        question: "Quel anime parle d'un assassin réincarné dans un autre monde ?",
        answer: "the world of otome game",
        alternatives: ["the world of otome game", "hamefura"]
    },
    // SPORTS
    {
        question: "Quel anime parle d'un jeune basketteur qui veut devenir le meilleur ?",
        answer: "kuroko no basket",
        alternatives: ["kuroko no basket", "kuroko's basketball"]
    },
    {
        question: "Dans quel anime des lycéens jouent au volleyball ?",
        answer: "haikyuu",
        alternatives: ["haikyuu"]
    },
    {
        question: "Quel anime met en scène des coureurs dans un club de cyclisme ?",
        answer: "yowamushi pedal",
        alternatives: ["yowamushi pedal"]
    },
    {
        question: "Dans quel anime des lycéens pratiquent le natation synchronisée ?",
        answer: "free",
        alternatives: ["free", "free iwatobi swim club"]
    },
    {
        question: "Quel anime parle de football au lycée ?",
        answer: "blue lock",
        alternatives: ["blue lock"]
    },
    {
        question: "Dans quel anime des boxeurs luttent pour devenir les meilleurs ?",
        answer: "hajime no ippo",
        alternatives: ["hajime no ippo", "fighting spirit"]
    },
    {
        question: "Quel anime met en scène des joueurs de baseball ?",
        answer: "diamond no ace",
        alternatives: ["diamond no ace", "ace of diamond"]
    },
    // ROMANCE/COMEDY
    {
        question: "Quel anime parle d'un garçon qui aide une fille fantôme ?",
        answer: "your lie in april",
        alternatives: ["your lie in april", "shigatsu wa kimi no uso"]
    },
    {
        question: "Dans quel anime deux étudiants tombent amoureux au lycée ?",
        answer: "toradora",
        alternatives: ["toradora"]
    },
    {
        question: "Quel anime met en scène un garçon qui peut voir les lignes de la mort ?",
        answer: "kara no kyoukai",
        alternatives: ["kara no kyoukai", "the garden of sinners"]
    },
    {
        question: "Dans quel anime une fille devient idole malgré sa timidité ?",
        answer: "love live",
        alternatives: ["love live"]
    },
    {
        question: "Quel anime parle de garçons devenus idoles ?",
        answer: "utapri",
        alternatives: ["utapri", "uta no prince sama"]
    },
    // MECHA/SCI-FI
    {
        question: "Quel anime met en scène des robots géants pilotés par des adolescents ?",
        answer: "neon genesis evangelion",
        alternatives: ["neon genesis evangelion", "evangelion", "nge"]
    },
    {
        question: "Dans quel anime des humains se battent dans des titans mobiles ?",
        answer: "gundam",
        alternatives: ["gundam", "mobile suit gundam"]
    },
    {
        question: "Quel anime parle de mechas dans un espace futuriste ?",
        answer: "code geass",
        alternatives: ["code geass"]
    },
    {
        question: "Dans quel anime des pilotes combattent des aliens ?",
        answer: "macross",
        alternatives: ["macross"]
    },
    {
        question: "Quel anime met en scène des robots transformables ?",
        answer: "transformers",
        alternatives: ["transformers"]
    },
    // PSYCHOLOGICAL/HORROR
    {
        question: "Dans quel anime un détective résout des crimes avec un shinigami ?",
        answer: "death note",
        alternatives: ["death note"]
    },
    {
        question: "Quel anime parle d'un jeu mortel dans une école ?",
        answer: "danganronpa",
        alternatives: ["danganronpa"]
    },
    {
        question: "Dans quel anime des étudiants sont piégés dans un jeu mortel ?",
        answer: "future diary",
        alternatives: ["future diary", "mirai nikki"]
    },
    {
        question: "Quel anime met en scène des tueurs en série ?",
        answer: "another",
        alternatives: ["another"]
    },
    {
        question: "Dans quel anime un garoux voit des choses horribles ?",
        answer: "higurashi",
        alternatives: ["higurashi", "when they cry"]
    },
    // FANTASY/MAGIC
    {
        question: "Quel anime met en scène des mages dans un monde de jeux de cartes ?",
        answer: "cardcaptor sakura",
        alternatives: ["cardcaptor sakura"]
    },
    {
        question: "Dans quel anime une jeune fille devient magical girl ?",
        answer: "magical girl lyrical nanoha",
        alternatives: ["magical girl lyrical nanoha"]
    },
    {
        question: "Quel anime parle de magical girls sombres ?",
        answer: "puella magi madoka magica",
        alternatives: ["puella magi madoka magica", "madoka magica"]
    },
    {
        question: "Dans quel anime des sorciers combattent des démons ?",
        answer: "fairy tail",
        alternatives: ["fairy tail"]
    },
    {
        question: "Quel anime met en scène des dragons et des mages ?",
        answer: "fairy tail",
        alternatives: ["fairy tail"]
    },
    // HISTORICAL/SAMURAI
    {
        question: "Quel anime met en scène des samouraïs dans un espace futuriste ?",
        answer: "samurai champloo",
        alternatives: ["samurai champloo"]
    },
    {
        question: "Dans quel anime des samouraïs protègent leur seigneur ?",
        answer: "rurouni kenshin",
        alternatives: ["rurouni kenshin", "samurai x"]
    },
    {
        question: "Quel anime parle de l'ère Meiji avec des swordsmen ?",
        answer: "rurouni kenshin",
        alternatives: ["rurouni kenshin", "samurai x"]
    },
    {
        question: "Dans quel anime des guerriers combattent à l'époque Sengoku ?",
        answer: "sengoku basara",
        alternatives: ["sengoku basara"]
    },
    {
        question: "Quel anime met en scène des ninjas historiques ?",
        answer: "naruto",
        alternatives: ["naruto"]
    }
]
// Questions MANGA - Deviner le manga
const mangaQuestions = [
    // SHONEN MANGA
    {
        question: "Quel manga créé par Eiichiro Oda met en scène des pirates ?",
        answer: "one piece",
        alternatives: ["one piece"]
    },
    {
        question: "Quel manga de Masashi Kishimoto parle d'un ninja orange ?",
        answer: "naruto",
        alternatives: ["naruto"]
    },
    {
        question: "Quel manga de Hajime Isayama met en scène des titans ?",
        answer: "attack on titan",
        alternatives: ["attack on titan", "shingeki no kyojin"]
    },
    {
        question: "Quel manga de Sui Ishida parle de ghouls à Tokyo ?",
        answer: "tokyo ghoul",
        alternatives: ["tokyo ghoul"]
    },
    {
        question: "Quel manga de Yusuke Murata parle d'un héros ordinaire devenu surpuissant ?",
        answer: "one punch man",
        alternatives: ["one punch man", "opm"]
    },
    {
        question: "Quel manga de Kohei Horikoshi met en scène des héros au lycée ?",
        answer: "my hero academia",
        alternatives: ["my hero academia", "boku no hero academia"]
    },
    {
        question: "Quel manga de Yuki Tabata parle de magie sans mana ?",
        answer: "black clover",
        alternatives: ["black clover"]
    },
    {
        question: "Quel manga de Koyoharu Gotouge parle de démons et respiration ?",
        answer: "demon slayer",
        alternatives: ["demon slayer", "kimetsu no yaiba"]
    },
    {
        question: "Quel manga de Gege Akutami parle de sorciers combattant des curses ?",
        answer: "jujutsu kaisen",
        alternatives: ["jujutsu kaisen", "jjk"]
    },
    {
        question: "Quel manga de Tatsuki Fujimoto parle d'un homme démon ?",
        answer: "chainsaw man",
        alternatives: ["chainsaw man"]
    },
    {
        question: "Quel manga de Kazue Katō parle d'un exorciste bleu ?",
        answer: "blue exorcist",
        alternatives: ["blue exorcist", "ao no exorcist"]
    },
    {
        question: "Quel manga de Yūsei Matsui parle d'un professeur assassin ?",
        answer: "assassination classroom",
        alternatives: ["assassination classroom", "ansatsu kyoushitsu"]
    },
    {
        question: "Quel manga de Hiro Mashu parle de dragons et guildes ?",
        answer: "fairy tail",
        alternatives: ["fairy tail"]
    },
    {
        question: "Quel manga de Atsushi Ohkubo parle de faucheurs d'âmes ?",
        answer: "soul eater",
        alternatives: ["soul eater"]
    },
    {
        question: "Quel manga de Yū Watase parle d'une fille dans un monde ancien ?",
        answer: "fushigi yuugi",
        alternatives: ["fushigi yuugi"]
    },
    // SEINEN MANGA
    {
        question: "Quel manga de Tsugumi Ohba parle d'un détective avec un carnet magique ?",
        answer: "death note",
        alternatives: ["death note"]
    },
    {
        question: "Quel manga de Hiromu Arakawa suit des frères alchimistes ?",
        answer: "fullmetal alchemist",
        alternatives: ["fullmetal alchemist", "fma"]
    },
    {
        question: "Quel manga de Clamp parle de cartes magiques ?",
        answer: "cardcaptor sakura",
        alternatives: ["cardcaptor sakura"]
    },
    {
        question: "Quel manga de Takehiko Inoue parle de basket-ball ?",
        answer: "slam dunk",
        alternatives: ["slam dunk"]
    },
    {
        question: "Quel manga de Takehiko Inoue parle d'un vagabond ?",
        answer: "vagabond",
        alternatives: ["vagabond"]
    },
    {
        question: "Quel manga de Hirohiko Araki parle de stands et jojos ?",
        answer: "jojo's bizarre adventure",
        alternatives: ["jojo's bizarre adventure", "jojo"]
    },
    {
        question: "Quel manga de Sui Ishida suit Tokyo après les ghouls ?",
        answer: "tokyo ghoul re",
        alternatives: ["tokyo ghoul re", "tg re"]
    },
    {
        question: "Quel manga de Makoto Yukimura parle de vikings ?",
        answer: "vinland saga",
        alternatives: ["vinland saga"]
    },
    {
        question: "Quel manga de Kei Sanbe parle de mémoire et réincarnation ?",
        answer: "erased",
        alternatives: ["erased", "boku dake ga inai machi"]
    },
    {
        question: "Quel manga de ONE parle d'un héros surpuissant ?",
        answer: "one punch man",
        alternatives: ["one punch man", "opm", "onepunchman"]
    },
    // SHOJO MANGA
    {
        question: "Quel manga de Arina Tanemura parle de magical girls ?",
        answer: "full moon wo sagashite",
        alternatives: ["full moon wo sagashite"]
    },
    {
        question: "Quel manga de Ai Yazawa parle de rock et mode ?",
        answer: "paradise kiss",
        alternatives: ["paradise kiss"]
    },
    {
        question: "Quel manga de CLAMP parle de destins croisés ?",
        answer: "xxxholic",
        alternatives: ["xxxholic"]
    },
    {
        question: "Quel manga de Bisco Hatori parle d'un club hôte ?",
        answer: "ouran high school host club",
        alternatives: ["ouran high school host club", "ohshc"]
    },
    {
        question: "Quel manga de Saki Hiwatari parle de réincarnation ?",
        answer: "please save my earth",
        alternatives: ["please save my earth"]
    },
    {
        question: "Quel manga de Kaoru Mori parle de geishas ?",
        answer: "emma",
        alternatives: ["emma"]
    },
    {
        question: "Quel manga de Kyousuke Motomi parle d'amour et drame ?",
        answer: "dengeki daisy",
        alternatives: ["dengeki daisy"]
    },
    // SPORTS MANGA
    {
        question: "Quel manga de Haruichi Furudate parle de volleyball ?",
        answer: "haikyuu",
        alternatives: ["haikyuu"]
    },
    {
        question: "Quel manga de Wataru Watanabe parle de cyclisme ?",
        answer: "yowamushi pedal",
        alternatives: ["yowamushi pedal"]
    },
    {
        question: "Quel manga de Koji Kumagai parle de natation ?",
        answer: "free",
        alternatives: ["free"]
    },
    {
        question: "Quel manga de Tsuyoshi Yasuda parle de football ?",
        answer: "blue lock",
        alternatives: ["blue lock"]
    },
    {
        question: "Quel manga de George Morikawa parle de boxe ?",
        answer: "hajime no ippo",
        alternatives: ["hajime no ippo"]
    },
    {
        question: "Quel manga de Yuji Terajima parle de baseball ?",
        answer: "diamond no ace",
        alternatives: ["diamond no ace", "ace of diamond"]
    },
    {
        question: "Quel manga de Kaito Shibano parle de tennis ?",
        answer: "prince of tennis",
        alternatives: ["prince of tennis", "tenipuri"]
    },
    {
        question: "Quel manga de Shinji Takehashi parle de rugby ?",
        answer: "all out",
        alternatives: ["all out"]
    },
    // ISEKAI MANGA
    {
        question: "Quel manga de Fuse parle d'un slime surpuissant ?",
        answer: "that time i got reincarnated as a slime",
        alternatives: ["that time i got reincarnated as a slime", "slime", "tensura"]
    },
    {
        question: "Quel manga de Kugane Maruyama parle d'un overlord ?",
        answer: "overlord",
        alternatives: ["overlord"]
    },
    {
        question: "Quel manga de Okina Baba parle d'une araignée ?",
        answer: "so i'm a spider so what",
        alternatives: ["so i'm a spider so what", "kumo desu ga"]
    },
    {
        question: "Quel manga de Aneko Yusagi parle d'un héros bouclier ?",
        answer: "shield hero",
        alternatives: ["shield hero", "the rising of the shield hero"]
    },
    {
        question: "Quel manga de Natsume Akatsuki parle d'un prêtre ?",
        answer: "konosuba",
        alternatives: ["konosuba", "god's blessing on this wonderful world"]
    },
    {
        question: "Quel manga de Haiji Nakano parle d'un assassin ?",
        answer: "the world of otome game",
        alternatives: ["the world of otome game", "hamefura"]
    },
    // CLASSIC/LEGENDARY MANGA
    {
        question: "Quel manga de Akira Toriyama parle de dragon balls ?",
        answer: "dragon ball",
        alternatives: ["dragon ball", "db", "dbz"]
    },
    {
        question: "Quel manga de Rumiko Takahashi parle d'une prêtresse ?",
        answer: "inuyasha",
        alternatives: ["inuyasha"]
    },
    {
        question: "Quel manga de Rumiko Takahashi parle d'une fille transformée ?",
        answer: "ranma 1/2",
        alternatives: ["ranma 1/2", "ranma"]
    },
    {
        question: "Quel manga de Kentaro Miura parle d'un chevalier noir ?",
        answer: "berserk",
        alternatives: ["berserk"]
    },
    {
        question: "Quel manga de Osamu Tezuka est considéré comme le roi du manga ?",
        answer: "astro boy",
        alternatives: ["astro boy", "tetsuwan atomu"]
    },
    {
        question: "Quel manga de Leiji Matsumoto parle d'un space pirate ?",
        answer: "captain harlock",
        alternatives: ["captain harlock", "space pirate captain harlock"]
    },
    {
        question: "Quel manga de Go Nagai parle d'un robot ?",
        answer: "mazinger z",
        alternatives: ["mazinger z"]
    },
    {
        question: "Quel manga de Shotaro Ishinomori parle de cyborgs ?",
        answer: "cyborg 009",
        alternatives: ["cyborg 009"]
    }
]
// Questions PERSONNAGE - Deviner le personnage
const personnageQuestions = [
    {
        question: "Quel personnage est le 'Hokage du feu' et porte un orange ?",
        answer: "naruto uzumaki",
        alternatives: ["naruto", "uzumaki", "naruto uzumaki"]
    },
    {
        question: "Quel personnage utilise le 'Gear Second' et mange des fruits du démon ?",
        answer: "monkey d luffy",
        alternatives: ["luffy", "monkey d luffy", "rouge"]
    },
    {
        question: "Quel personnage utilise l'équipement tridimensionnel contre les titans ?",
        answer: "eren yeager",
        alternatives: ["eren", "yeager", "eren yeager"]
    },
    {
        question: "Quel personnage est le 'Number 1 Hero' et porte un costume vert ?",
        answer: "deku",
        alternatives: ["deku", "izuku midoriya", "midoriya"]
    },
    {
        question: "Quel personnage utilise la respiration de l'eau et a un scar ?",
        answer: "tanjiro kamado",
        alternatives: ["tanjiro", "kamado", "tanjiro kamado"]
    },
    {
        question: "Quel personnage est un alchemist automail et blond ?",
        answer: "edward elric",
        alternatives: ["edward", "elric", "edward elric"]
    },
    {
        question: "Quel personnage est un dieu de la destruction et chauve ?",
        answer: "saitama",
        alternatives: ["saitama", "one punch man"]
    },
    {
        question: "Quel personnage est un professeur extraterrestre jaune ?",
        answer: "koro-sensei",
        alternatives: ["koro sensei", "koro-sensei"]
    },
    {
        question: "Quel personnage utilise le 'Bankai' et porte un kimono noir ?",
        answer: "ichigo kurosaki",
        alternatives: ["ichigo", "kurosaki", "ichigo kurosaki"]
    },
    {
        question: "Quel personnage est le 'Titan colossale' et blond ?",
        answer: "bertholdt",
        alternatives: ["bertholdt", "bertholdt hoover"]
    },
    {
        question: "Quel personnage est le 'King of the Pirates' et a un chapeau de paille ?",
        answer: "monkey d luffy",
        alternatives: ["luffy", "monkey d luffy", "straw hat"]
    },
    {
        question: "Quel personnage est le 'God of Shinobi' et a une cicatrice sur le nez ?",
        answer: "kakashi hatake",
        alternatives: ["kakashi", "hatake", "kakashi hatake", "copy ninja"]
    },
    {
        question: "Quel personnage est une magical girl avec une baguette ?",
        answer: "sakura kinomoto",
        alternatives: ["sakura", "kinomoto", "sakura kinomoto"]
    },
    {
        question: "Quel personnage est le 'Strongest Jujutsu Sorcerer' avec des yeux bleus ?",
        answer: "gojo satoru",
        alternatives: ["gojo", "satoru", "gojo satoru"]
    },
    {
        question: "Quel personnage est le 'Pirate Hunter' avec trois sabres ?",
        answer: "roronoa zoro",
        alternatives: ["zoro", "roronoa", "roronoa zoro"]
    },
    {
        question: "Quel personnage est le 'Cook of Justice' et a une cicatrice sur l'œil ?",
        answer: "vinsmoke sanji",
        alternatives: ["sanji", "vinsmoke", "vinsmoke sanji", "black leg"]
    },
    {
        question: "Quel personnage est le 'Cyborg' avec un nez rouge ?",
        answer: "tony tony chopper",
        alternatives: ["chopper", "tony tony", "tony tony chopper"]
    },
    {
        question: "Quel personnage est le 'Demon Slayer' avec un hanafuda earring ?",
        answer: "tanjiro kamado",
        alternatives: ["tanjiro", "kamado", "tanjiro kamado"]
    },
    {
        question: "Quel personnage est le 'Water Hashira' avec des yeux rouges ?",
        answer: "giyu tomioka",
        alternatives: ["giyu", "tomioka", "giyu tomioka"]
    },
    {
        question: "Quel personnage est le 'Love Hashira' avec des cheveux roses ?",
        answer: "mitsuri kanroji",
        alternatives: ["mitsuri", "kanroji", "mitsuri kanroji"]
    },
    {
        question: "Quel personnage est le 'Sound Hashira' avec un tambour ?",
        answer: "tengen uzui",
        alternatives: ["tengen", "uzui", "tengen uzui"]
    },
    {
        question: "Quel personnage est le 'Insect Hashira' avec un masque ?",
        answer: "shinobu kocho",
        alternatives: ["shinobu", "kocho", "shinobu kocho"]
    },
    {
        question: "Quel personnage est le 'Flame Hashira' avec des cheveux rouges ?",
        answer: "kyojuro rengoku",
        alternatives: ["kyojuro", "rengoku", "kyojuro rengoku"]
    },
    {
        question: "Quel personnage est le 'Stone Hashira' avec un bras gauche manquant ?",
        answer: "gyomei himejima",
        alternatives: ["gyomei", "himejima", "gyomei himejima"]
    },
    {
        question: "Quel personnage est le 'Wind Hashira' avec des cheveux verts ?",
        answer: "sanemi shinazugawa",
        alternatives: ["sanemi", "shinazugawa", "sanemi shinazugawa"]
    }
]
// Questions OPENING - Deviner l'anime par son opening
const openingQuestions = [
    {
        question: "Quel opening commence par 'Gotta go fast, gotta survive' ?",
        answer: "demon slayer",
        alternatives: ["demon slayer", "kimetsu no yaiba", "gurenge"]
    },
    {
        question: "Quel opening avec 'We are, we are on the pirate ship' ?",
        answer: "one piece",
        alternatives: ["one piece", "we are"]
    },
    {
        question: "Quel opening avec 'I wanna be the very best' ?",
        answer: "pokemon",
        alternatives: ["pokemon", "indigo league"]
    },
    {
        question: "Quel opening avec 'Set me free' et des mechas ?",
        answer: "gundam",
        alternatives: ["gundam", "mobile suit gundam"]
    },
    {
        question: "Quel opening avec 'Just communication' et des gundams wing ?",
        answer: "gundam wing",
        alternatives: ["gundam wing"]
    },
    {
        question: "Quel opening avec 'Through the night' et des ninjas ?",
        answer: "naruto",
        alternatives: ["naruto", "haruka kanata"]
    },
    {
        question: "Quel opening avec 'Again' et des alchemists ?",
        answer: "fullmetal alchemist brotherhood",
        alternatives: ["fullmetal alchemist brotherhood", "fmab", "again"]
    },
    {
        question: "Quel opening avec 'The Hero' et des super-héros ?",
        answer: "one punch man",
        alternatives: ["one punch man", "opm", "the hero"]
    },
    {
        question: "Quel opening avec 'Silhouette' et des héros au lycée ?",
        answer: "naruto shippuden",
        alternatives: ["naruto shippuden", "silhouette"]
    },
    {
        question: "Quel opening avec 'Unravel' et des ghouls ?",
        answer: "tokyo ghoul",
        alternatives: ["tokyo ghoul", "unravel"]
    },
    {
        question: "Quel opening avec 'My Dearest' et des super-pouvoirs ?",
        answer: "guilty crown",
        alternatives: ["guilty crown", "my dearest"]
    },
    {
        question: "Quel opening avec 'Colors' et des pirates ?",
        answer: "code geass",
        alternatives: ["code geass", "colors"]
    },
    {
        question: "Quel opening avec 'Hikari e' et des chasseurs de démons ?",
        answer: "hunter x hunter",
        alternatives: ["hunter x hunter", "hikari e"]
    },
    {
        question: "Quel opening avec 'Departure' et des aventuriers ?",
        answer: "hunter x hunter",
        alternatives: ["hunter x hunter", "departure"]
    },
    {
        question: "Quel opening avec 'Cry Baby' et des gangsters ?",
        answer: "tokyo revengers",
        alternatives: ["tokyo revengers", "cry baby"]
    },
    {
        question: "Quel opening avec 'Pretender' et des relations amoureuses ?",
        answer: "horimiya",
        alternatives: ["horimiya", "pretender"]
    },
    {
        question: "Quel opening avec 'KICK BACK' et des démons ?",
        answer: "chainsaw man",
        alternatives: ["chainsaw man", "kick back"]
    },
    {
        question: "Quel opening avec 'Idol' et des idoles ?",
        answer: "ostan",
        alternatives: ["ostan", "idol"]
    },
    {
        question: "Quel opening avec 'Redeemer' et des anges ?",
        answer: "seven deadly sins",
        alternatives: ["seven deadly sins", "redeemer"]
    },
    {
        question: "Quel opening avec 'Vivid' et des magical girls ?",
        answer: "strike witches",
        alternatives: ["strike witches", "vivid"]
    }
]
// Questions SEIYUU - Deviner le seiyuu
const seiyuuQuestions = [
    {
        question: "Quel seiyuu double Naruto Uzumaki et Luffy ?",
        answer: "mayumi tanaka",
        alternatives: ["mayumi tanaka"]
    },
    {
        question: "Quel seiyuu double Edward Elric et Rin Okumura ?",
        answer: "romi park",
        alternatives: ["romi park"]
    },
    {
        question: "Quel seiyuu double Eren Yeager et Meliodas ?",
        answer: "yuki kaji",
        alternatives: ["yuki kaji"]
    },
    {
        question: "Quel seiyuu double Izuku Midoriya et Kaneki Ken ?",
        answer: "daiki yamashita",
        alternatives: ["daiki yamashita"]
    },
    {
        question: "Quel seiyuu double Tanjiro Kamado et Natsu Dragneel ?",
        answer: "natsuki hanae",
        alternatives: ["natsuki hanae"]
    },
    {
        question: "Quel seiyuu double Light Yagami et L Lawliet ?",
        answer: "mamoru miyano",
        alternatives: ["mamoru miyano"]
    },
    {
        question: "Quel seiyuu double Levi Ackerman et Katsuki Bakugo ?",
        answer: "kaito ishikawa",
        alternatives: ["kaito ishikawa"]
    },
    {
        question: "Quel seiyuu double Mikasa Ackerman et Uraraka Ochako ?",
        answer: "yui ishikawa",
        alternatives: ["yui ishikawa"]
    },
    {
        question: "Quel seiyuu double Monkey D. Luffy et Usopp ?",
        answer: "mayumi tanaka",
        alternatives: ["mayumi tanaka"]
    },
    {
        question: "Quel seiyuu double Roronoa Zoro et Sanji ?",
        answer: "kazuya nakai",
        alternatives: ["kazuya nakai"]
    },
    {
        question: "Quel seiyuu double Nami et Nico Robin ?",
        answer: "akemi okamura",
        alternatives: ["akemi okamura"]
    },
    {
        question: "Quel seiyuu double Sasuke Uchiha et Gaara ?",
        answer: "noriaki sugiyama",
        alternatives: ["noriaki sugiyama"]
    },
    {
        question: "Quel seiyuu double Sakura Haruno et Hinata Hyuga ?",
        answer: "chie nakamura",
        alternatives: ["chie nakamura"]
    },
    {
        question: "Quel seiyuu double Kakashi Hatake et Itachi Uchiha ?",
        answer: "noriaki sugiyama",
        alternatives: ["noriaki sugiyama"]
    },
    {
        question: "Quel seiyuu double Jiraiya et Orochimaru ?",
        answer: "masashi ebara",
        alternatives: ["masashi ebara"]
    },
    {
        question: "Quel seiyuu double Tsunade et Shizune ?",
        answer: "masako katsuki",
        alternatives: ["masako katsuki"]
    },
    {
        question: "Quel seiyuu double Neji Hyuga et Rock Lee ?",
        answer: "kenn",
        alternatives: ["kenn"]
    },
    {
        question: "Quel seiyuu double Shikamaru Nara et Kiba Inuzuka ?",
        answer: "kenn",
        alternatives: ["kenn"]
    },
    {
        question: "Quel seiyuu double Ino Yamanaka et Tenten ?",
        answer: "noriaki sugiyama",
        alternatives: ["noriaki sugiyama"]
    },
    {
        question: "Quel seiyuu double Might Guy and Asuma Sarutobi ?",
        answer: "kenn",
        alternatives: ["kenn"]
    }
]
// Types de jeux otakus disponibles pour la commande aléatoire
const otakuGameTypes = ["anime", "manga", "personnage", "opening", "seiyuu"]
// ====================
// STRUCTURES POUR AOUV
// ====================
const aouvGames = new Map() // Parties en cours: { group_jid: { currentPlayer: jid, startTime: timestamp } }
// Questions utilisées pour éviter les répétitions
const aouvUsedQuestions = new Map() // { group_jid: { actions: [], verites: [] } }
// ====================
// LISTES D'ACTIONS (100+ actions réalisables à distance)
// ====================
const aouvActions = [
    // 📱 ACTIONS SUR WHATSAPP (30)
    "Change ton pseudo en 'Le/La plus beau/belle' pour 1 heure",
    "Change ta photo de profil en photo de chat",
    "Envoie un message vocal en chantant",
    "Poste ta dernière photo de galerie",
    "Supprime un message que tu as envoyé récemment",
    "Mets un statut WhatsApp disant 'Je suis le/la meilleur(e)'",
    "Envoie un message à quelqu'un du groupe en utilisant que des emojis",
    "Raconte une blague en message vocal",
    "Change ton pseudo en 'Bébé' pour 30 minutes",
    "Envoie un GIF qui te représente en ce moment",
    "Fais un compliment à 3 personnes du groupe",
    "Envoie une photo de ce que tu manges en ce moment",
    "Partage ta chanson préférée du moment",
    "Écris un poème de 2 lignes sur le groupe",
    "Change ton pseudo en 'Admin bis' pour 15 minutes",
    "Envoie un message en langage sms (tt en abrégé)",
    "Poste un mème dans le groupe",
    "Raconte ton rêve de la nuit dernière",
    "Envoie une photo de ton bureau/tablesur laquelle tu travailles",
    "Partage ton écran de téléphone (capture)",
    "Fais une dédicace à quelqu'un du groupe",
    "Envoie un message écrit à l'envers",
    "Change ta photo de profil en noir pendant 1 heure",
    "Poste une photo de ton animal de compagnie (ou plante)",
    "Raconte ton pire souvenir d'école",
    "Envoie un audio de 10 secondes où tu ris",
    "Partage ton film/série préféré(e)",
    "Écris une critique du groupe en 3 mots",
    "Change ton pseudo en 'Mystère' pour 30 minutes",
    "Envoie un message que seule une personne du groupe doit comprendre",
    // 🌐 ACTIONS SUR INTERNET (20)
    "Trouve et poste la photo la plus mignonne d'un animal",
    "Partage le dernier article que tu as lu",
    "Poste une capture d'écran de ta recherche Google du moment",
    "Trouve une citation inspirante et partage-la",
    "Partage une vidéo YouTube que tu aimes",
    "Poste un fait intéressant que tu as appris récemment",
    "Trouve une photo de toi bébé et poste-la (si possible)",
    "Partage ton jeu mobile préféré",
    "Poste une photo de ton plat préféré",
    "Trouve un meme sur le thème du groupe et poste-le",
    "Partage une recette de cuisine simple",
    "Poste une photo de ton livre préféré",
    "Trouve et partage une blague de dad",
    "Poste une photo de ton endroit préféré dans ta ville",
    "Partage une playlist Spotify/YouTube",
    "Trouve un tuto intéressant et partage-le",
    "Poste une photo de ton objet le plus bizarre",
    "Partage ton application préférée",
    "Trouve une photo de coucher de soleil et poste-la",
    "Poste une photo de ta tasse/bouteille préférée",
    // 🎮 ACTIONS SOCIALES (25)
    "Ajoute quelqu'un du groupe sur un réseau social",
    "Envoie un message privé à quelqu'un du groupe pour lui dire bonjour",
    "Fais un compliment au dernier qui a parlé",
    "Réponds au prochain message avec un GIF",
    "Laisse une réaction 😂 au prochain message",
    "Tag quelqu'un dans un message mignon",
    "Envoie un message à tes 3 derniers contacts",
    "Fais une capture d'écran de ta conversation avec un ami et poste-la (floute les noms)",
    "Partage ton dernier message envoyé (hors groupe)",
    "Ajoute un emoji à ton pseudo pendant 1 heure",
    "Envoie un message à quelqu'un que tu n'as pas contacté depuis longtemps",
    "Fais un sondage dans le groupe sur un sujet random",
    "Réponds au prochain message avec une photo",
    "Partage ton fond d'écran de téléphone",
    "Change ton statut WhatsApp pour la journée",
    "Envoie un message en remplaçant toutes les voyelles par des 'i'",
    "Poste une photo de tes chaussures",
    "Raconte ton premier souvenir avec le groupe",
    "Fais une déclaration d'amour à ton plat préféré",
    "Partage ta liste de courses",
    "Poste une photo de ton réfrigérateur",
    "Raconte ta plus grosse honte numérique",
    "Partage ton mot de passe le plus utilisé (sans donner le vrai)",
    "Fais un classement des 3 membres les plus actifs",
    "Décris chaque membre du groupe en un mot",
    // 🎨 ACTIONS CRÉATIVES (25)
    "Dessine quelque chose sur Paint et poste-le",
    "Écris un haïku (poème de 3 vers) sur le groupe",
    "Crée un acronyme avec le nom du groupe",
    "Fais un montage photo simple avec deux membres",
    "Invente un slogan pour le groupe",
    "Écris une chanson de 2 lignes sur le groupe",
    "Crée un logo pour le groupe",
    "Fais une prédiction pour le prochain événement du groupe",
    "Invente un super-pouvoir pour chaque membre",
    "Écris une lettre d'amour à ton snack préféré",
    "Crée un meme avec ta propre photo",
    "Invente un nouveau emoji et décris-le",
    "Fais un portrait-robot du membre mystère",
    "Écris un tweet fictif sur ta journée",
    "Crée une publicité pour le groupe",
    "Invente un jeu et explique les règles",
    "Décris ta vie en 3 emojis",
    "Crée un code secret pour le groupe",
    "Invente un nouveau mot et sa définition",
    "Fais un classement des meilleurs plats",
    "Écris une critique de film (même si tu l'as pas vu)",
    "Crée un horoscope du jour pour le groupe",
    "Invente une théorie du complot sur le groupe",
    "Fais une interview imaginaire de toi-même",
    "Crée une recette de cocktail sans alcool"
]
// ====================
// LISTES DE VÉRITÉS (100+ questions)
// ====================
const aouvVerites = [
    // ❓ QUESTIONS SUR LES GOÛTS (30)
    "Quelle est ta couleur préférée et pourquoi ?",
    "Quel est ton film préféré de tous les temps ?",
    "Quelle musique écoutes-tu en ce moment en boucle ?",
    "Quel est ton plat préféré ?",
    "Quel est ton dessert préféré ?",
    "Quelle est ta saison préférée ?",
    "Quel est ton animal préféré ?",
    "Quelle est ta série préférée ?",
    "Quel est ton livre préféré ?",
    "Quel est ton jeu vidéo préféré ?",
    "Quelle est ta matière préférée à l'école ?",
    "Quel est ton sport préféré ?",
    "Quelle est ta boisson préférée ?",
    "Quel est ton parfum de glace préféré ?",
    "Quelle est ta marque de vêtements préférée ?",
    "Quel est ton réseau social préféré ?",
    "Quelle est ton application préférée ?",
    "Quel est ton film d'animation préféré ?",
    "Quelle est ta chanson préférée pour danser ?",
    "Quel est ton endroit préféré dans ta ville ?",
    "Quelle est ta période de l'année préférée ?",
    "Quel est ton style de musique préféré ?",
    "Quelle est ta émission de télé préférée ?",
    "Quel est ton acteur/actrice préféré(e) ?",
    "Quelle est ta célébrité préférée ?",
    "Quel est ton monument préféré ?",
    "Quelle est ta ville préférée que tu as visitée ?",
    "Quel est ton souvenir de vacances préféré ?",
    "Quelle est ta tradition familiale préférée ?",
    "Quel est ton moment de la journée préféré ?",
    // ❓ QUESTIONS SUR LES RÊVES (20)
    "Quel métier rêvais-tu de faire enfant ?",
    "Si tu pouvais voyager n'importe où, où irais-tu ?",
    "Quel super-pouvoir aimerais-tu avoir ?",
    "Si tu gagnais au loto, quelle serait ta première action ?",
    "Quelle célébrité aimerais-tu rencontrer ?",
    "Si tu pouvais parler à ton moi du futur, que lui demanderais-tu ?",
    "Quel talent aimerais-tu avoir ?",
    "Si tu pouvais changer une chose dans le monde, quoi ?",
    "Quelle époque historique aimerais-tu visiter ?",
    "Si tu étais invisible pour un jour, que ferais-tu ?",
    "Quel animal aimerais-tu être ?",
    "Si tu pouvais recommencer ta vie, changerais-tu quelque chose ?",
    "Quel est ton plus grand rêve ?",
    "Si tu pouvais apprendre une langue instantanément, laquelle ?",
    "Quel instrument de musique aimerais-tu jouer ?",
    "Si tu pouvais être un personnage de fiction, qui serais-tu ?",
    "Quel pays aimerais-tu visiter absolument ?",
    "Si tu pouvais avoir un dîner avec 3 personnes (mortes ou vivantes), qui ?",
    "Quel est le métier le plus bizarre que tu aimerais essayer ?",
    "Si tu pouvais créer une nouvelle fête, quelle serait-elle ?",
    // ❓ QUESTIONS SUR LES SOUVENIRS (25)
    "Quel est ton plus beau souvenir d'enfance ?",
    "Quel est ton pire souvenir d'école ?",
    "Quelle est la meilleure blague que tu aies faite ?",
    "Quel est ton plus grand regret ?",
    "Quelle est la chose la plus drôle qui te soit arrivée ?",
    "Quel est ton meilleur souvenir avec des amis ?",
    "Quelle est la pire honte de ta vie ?",
    "Quel est ton souvenir préféré en famille ?",
    "Quelle est la meilleure nouvelle que tu aies reçue ?",
    "Quel est ton plus grand accomplissement ?",
    "Quelle est la chose la plus bizarre que tu aies mangée ?",
    "Quel est ton plus beau cadeau reçu ?",
    "Quelle est la pire punition que tu aies eue enfant ?",
    "Quel est ton souvenir préféré de vacances ?",
    "Quelle est la chose la plus courageuse que tu aies faite ?",
    "Quel est ton meilleur souvenir avec ton meilleur ami ?",
    "Quelle est la chose la plus gentille qu'on t'ait faite ?",
    "Quel est ton souvenir le plus embarrassant en public ?",
    "Quelle est la meilleure surprise de ta vie ?",
    "Quel est ton premier souvenir ?",
    "Quelle est la pire bêtise que tu aies faite enfant ?",
    "Quel est ton souvenir préféré avec tes grands-parents ?",
    "Quelle est la chose la plus étrange que tu aies vue ?",
    "Quel est ton meilleur souvenir de Noël ?",
    "Quelle est la plus belle rencontre de ta vie ?",
    // ❓ QUESTIONS SUR LES PRÉFÉRENCES (20)
    "Plutôt matin ou soir ?",
    "Plutôt été ou hiver ?",
    "Plutôt mer ou montagne ?",
    "Plutôt sucré ou salé ?",
    "Plutôt film ou série ?",
    "Plutôt livre ou film ?",
    "Plutôt chat ou chien ?",
    "Plutôt thé ou café ?",
    "Plutôt pizza ou burger ?",
    "Plutôt sport ou musique ?",
    "Plutôt ville ou campagne ?",
    "Plutôt fête ou soirée tranquille ?",
    "Plutôt chaud ou froid ?",
    "Plutôt rire ou pleurer ?",
    "Plutôt parler ou écouter ?",
    "Plutôt leader ou suiveur ?",
    "Plutôt planner ou spontané ?",
    "Plutôt optimiste ou pessimiste ?",
    "Plutôt intérieur ou extérieur ?",
    "Plutôt fantaisie ou réalité ?",
    // ❓ QUESTIONS PERSONNELLES LÉGÈRES (15)
    "Quel est ton plus grand défaut ?",
    "Quelle est ta plus grande qualité ?",
    "Quelle est ta peur la plus ridicule ?",
    "Quel est ton tic nerveux ?",
    "Quelle est ton addiction secrète ?",
    "Quel est ton plus grand talent caché ?",
    "Quelle est la chose que tu fais quand personne ne regarde ?",
    "Quel est ton pire défaut chez les autres ?",
    "Qu'est-ce qui te rend le plus fier/fière ?",
    "Qu'est-ce qui te met le plus en colère ?",
    "Qu'est-ce qui te fait le plus pleurer ?",
    "Qu'est-ce qui te fait le plus rire ?",
    "Quel est ton plus grand complexe ?",
    "Qu'est-ce que tu aimerais changer chez toi ?",
    "Quelle est ta plus grande force ?"
]
// Liens interdits
const bannedLinks = ["bit.ly", "t.co", "tinyurl.com", "goo.gl", "ow.ly", "is.gd"]
// ====================
// CONFIGURATION
// ====================
let config = {} // { jid: { antilink: boolean, welcome: boolean } }
let warns = {} // { user_jid: { [group_jid]: { count: number, reasons: string[] } } }
// ====================
// FONCTIONS DE GESTION
// ====================
function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"))
        }
    } catch (err) {
        console.log("Erreur chargement config:", err)
        config = {}
    }
}
function saveConfig() {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
    } catch (err) {
        console.log("Erreur sauvegarde config:", err)
    }
}
function loadWarns() {
    try {
        if (fs.existsSync(WARNS_FILE)) {
            warns = JSON.parse(fs.readFileSync(WARNS_FILE, "utf8"))
        }
    } catch (err) {
        console.log("Erreur chargement warns:", err)
        warns = {}
    }
}
function saveWarns() {
    try {
        fs.writeFileSync(WARNS_FILE, JSON.stringify(warns, null, 2))
    } catch (err) {
        console.log("Erreur sauvegarde warns:", err)
    }
}
function loadMessageCounts() {
    try {
        if (fs.existsSync(MESSAGES_FILE)) {
            messageCounts = JSON.parse(fs.readFileSync(MESSAGES_FILE, "utf8"))
        }
    } catch (err) {
        console.log("Erreur chargement messages:", err)
        messageCounts = {}
    }
}
function saveMessageCounts() {
    try {
        fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messageCounts, null, 2))
    } catch (err) {
        console.log("Erreur sauvegarde messages:", err)
    }
}
function loadProfiles() {
    try {
        if (fs.existsSync(PROFILES_FILE)) {
            userProfiles = JSON.parse(fs.readFileSync(PROFILES_FILE, "utf8"))
        }
    } catch (err) {
        console.log("Erreur chargement profils:", err)
        userProfiles = {}
    }
}
function saveProfiles() {
    try {
        fs.writeFileSync(PROFILES_FILE, JSON.stringify(userProfiles, null, 2))
    } catch (err) {
        console.log("Erreur sauvegarde profils:", err)
    }
}
// NOUVELLE FONCTION: Charger les scores
function loadScores() {
    try {
        if (fs.existsSync(SCORES_FILE)) {
            const savedScores = JSON.parse(fs.readFileSync(SCORES_FILE, "utf8"))
            Object.entries(savedScores).forEach(([groupId, groupData]) => {
                const groupMap = new Map()
                Object.entries(groupData).forEach(([userId, userData]) => {
                    groupMap.set(userId, userData)
                })
                scores.set(groupId, groupMap)
            })
        }
    } catch (err) {
        console.log("Erreur chargement scores:", err)
    }
}
function saveScores() {
    try {
        const scoresObj = {}
        scores.forEach((groupMap, groupId) => {
            scoresObj[groupId] = Object.fromEntries(groupMap)
        })
        fs.writeFileSync(SCORES_FILE, JSON.stringify(scoresObj, null, 2))
    } catch (err) {
        console.log("Erreur sauvegarde scores:", err)
    }
}
// NOUVELLE FONCTION: Réinitialiser les scores d'un groupe
function resetGroupScores(groupId) {
    if (scores.has(groupId)) {
        scores.set(groupId, new Map())
        saveScores()
        console.log(`🔄 Scores réinitialisés pour le groupe ${groupId}`)
        return true
    }
    return false
}
// ====================
// SYSTÈME D'ORGANISATIONS OTAKU
// ====================
function loadOtakuOrganisations() {
    try {
        if (fs.existsSync(OTAKU_ORGANISATIONS_FILE)) {
            otakuOrganisations = JSON.parse(fs.readFileSync(OTAKU_ORGANISATIONS_FILE, "utf8"))
        } else {
            // Créer le fichier s'il n'existe pas
            otakuOrganisations = {}
        }
        // Toujours initialiser les organisations par défaut si elles n'existent pas
        DEFAULT_ORGANISATIONS.forEach(org => {
            if (!otakuOrganisations[org.name]) {
                otakuOrganisations[org.name] = { ...org, members: [] }
            }
        })
        saveOtakuOrganisations()
    } catch (err) {
        console.log("Erreur chargement organisations:", err)
        otakuOrganisations = {}
        // Initialiser avec les organisations par défaut
        DEFAULT_ORGANISATIONS.forEach(org => {
            otakuOrganisations[org.name] = { ...org, members: [] }
        })
        saveOtakuOrganisations()
    }
}
function saveOtakuOrganisations() {
    try {
        fs.writeFileSync(OTAKU_ORGANISATIONS_FILE, JSON.stringify(otakuOrganisations, null, 2))
    } catch (err) {
        console.log("Erreur sauvegarde organisations:", err)
    }
}
function loadOtakuBattles() {
    try {
        if (fs.existsSync(OTAKU_BATTLES_FILE)) {
            otakuBattles = JSON.parse(fs.readFileSync(OTAKU_BATTLES_FILE, "utf8"))
        }
    } catch (err) {
        console.log("Erreur chargement battles:", err)
        otakuBattles = {}
    }
}
function saveOtakuBattles() {
    try {
        fs.writeFileSync(OTAKU_BATTLES_FILE, JSON.stringify(otakuBattles, null, 2))
    } catch (err) {
        console.log("Erreur sauvegarde battles:", err)
    }
}
function getPlayerOrganisation(playerJid) {
    for (const [orgName, orgData] of Object.entries(otakuOrganisations)) {
        if (orgData.members && orgData.members.includes(playerJid)) {
            return orgName
        }
    }
    return null
}
function joinOrganisation(playerJid, orgName) {
    if (!otakuOrganisations[orgName]) {
        return false
    }
    // Retirer de l'ancienne organisation
    const currentOrg = getPlayerOrganisation(playerJid)
    if (currentOrg && otakuOrganisations[currentOrg].members) {
        otakuOrganisations[currentOrg].members = otakuOrganisations[currentOrg].members.filter(jid => jid !== playerJid)
    }
    // Ajouter à la nouvelle
    if (!otakuOrganisations[orgName].members) {
        otakuOrganisations[orgName].members = []
    }
    otakuOrganisations[orgName].members.push(playerJid)
    saveOtakuOrganisations()
    return true
}
function getUnusedOtakuQuestion(battleJid) {
    if (!otakuBattles[battleJid]) {
        otakuBattles[battleJid] = { usedQuestions: [] }
    }
    const availableQuestions = otakuExpertQuestions.filter(q => 
        !otakuBattles[battleJid].usedQuestions.includes(q.question)
    )
    if (availableQuestions.length === 0) {
        otakuBattles[battleJid].usedQuestions = []
        return otakuExpertQuestions[Math.floor(Math.random() * otakuExpertQuestions.length)]
    }
    const question = availableQuestions[Math.floor(Math.random() * availableQuestions.length)]
    otakuBattles[battleJid].usedQuestions.push(question.question)
    saveOtakuBattles()
    return question
}
// ====================
// FONCTIONS DE BATTLE OTAKU 1v1
// ====================
async function startOtakuBattle(jid, challengerJid, opponentJid, challengerOrg, opponentOrg, sock) {
    // Obtenir les noms des joueurs
    const metadata = await sock.groupMetadata(jid)
    const challenger = metadata.participants.find(p => p.id === challengerJid)
    const opponent = metadata.participants.find(p => p.id === opponentJid)
    const challengerName = challenger?.pushName || challengerJid.split('@')[0]
    const opponentName = opponent?.pushName || opponentJid.split('@')[0]
    // Initialiser le battle
    const battleData = {
        challenger: {
            jid: challengerJid,
            name: challengerName,
            org: challengerOrg,
            score: 0,
            answered: false
        },
        opponent: {
            jid: opponentJid,
            name: opponentName,
            org: opponentOrg,
            score: 0,
            answered: false
        },
        currentQuestion: null,
        questionNumber: 0,
        totalQuestions: 10,
        status: 'waiting',
        startTime: Date.now()
    }
    activeBattles.set(jid, battleData)
    saveOtakuBattles()
    // Annonce épique du battle
    const announceMsg = `⚔️ *BATTLE OTAKU 1v1 DÉMARRÉ* ⚔️
${otakuOrganisations[challengerOrg].emoji} *${challengerName}* (${challengerOrg})
🆚 VS 🆚
${otakuOrganisations[opponentOrg].emoji} *${opponentName}* (${opponentOrg})
🎯 *10 questions OTAKU expertes*
⏱️ 30 secondes par question
🏆 3 points par bonne réponse
🔥 Que le meilleur gagne !
💡 Premier qui répond correctement marque le point !`
    await sock.sendMessage(jid, { 
        text: announceMsg,
        mentions: [challengerJid, opponentJid]
    })
    // Démarrer la première question après 3 secondes
    setTimeout(() => {
        askOtakuQuestion(jid, sock)
    }, 3000)
}
async function askOtakuQuestion(jid, sock) {
    const battle = activeBattles.get(jid)
    if (!battle || battle.questionNumber >= battle.totalQuestions) {
        await endOtakuBattle(jid, sock)
        return
    }
    battle.questionNumber++
    battle.status = 'active'
    battle.challenger.answered = false
    battle.opponent.answered = false
    const question = getUnusedOtakuQuestion(jid)
    battle.currentQuestion = question
    const questionMsg = `🎯 *QUESTION ${battle.questionNumber}/${battle.totalQuestions}* 🎯
${question.question}
⏱️ 30 secondes pour répondre !
💡 3 points pour le premier qui répond correctement !`
    await sock.sendMessage(jid, { text: questionMsg })
    // Timer de 30 secondes
    setTimeout(() => {
        checkOtakuAnswer(jid, sock)
    }, 30000)
}
async function checkOtakuAnswer(jid, sock) {
    const battle = activeBattles.get(jid)
    if (!battle || battle.status !== 'active') return
    if (!battle.challenger.answered || !battle.opponent.answered) {
        await sock.sendMessage(jid, { 
            text: `⏰ Temps écoulé !
${battle.challenger.answered ? '✅' : '❌'} ${battle.challenger.name}: ${battle.challenger.score} points
${battle.opponent.answered ? '✅' : '❌'} ${battle.opponent.name}: ${battle.opponent.score} points
🔄 Question suivante dans 3 secondes...`
        })
    }
    if (battle.questionNumber >= battle.totalQuestions) {
        await endOtakuBattle(jid, sock)
    } else {
        setTimeout(() => {
            askOtakuQuestion(jid, sock)
        }, 3000)
    }
}
async function endOtakuBattle(jid, sock) {
    const battle = activeBattles.get(jid)
    if (!battle) return
    const winner = battle.challenger.score > battle.opponent.score ? battle.challenger : battle.opponent
    const loser = battle.challenger.score > battle.opponent.score ? battle.opponent : battle.challenger
    const winnerOrg = winner.org
    const loserOrg = loser.org
    // Mettre à jour les scores des organisations
    if (!otakuBattles.organizationScores) {
        otakuBattles.organizationScores = {}
    }
    if (!otakuBattles.organizationScores[winnerOrg]) {
        otakuBattles.organizationScores[winnerOrg] = { wins: 0, losses: 0 }
    }
    if (!otakuBattles.organizationScores[loserOrg]) {
        otakuBattles.organizationScores[loserOrg] = { wins: 0, losses: 0 }
    }
    otakuBattles.organizationScores[winnerOrg].wins++
    otakuBattles.organizationScores[loserOrg].losses++
    activeBattles.delete(jid)
    saveOtakuBattles()
    const endMsg = `🏆 *BATTLE TERMINÉ* 🏆
${otakuOrganisations[winner.org].emoji} *${winner.name}* (${winner.org})
🏆 VAINQUEUR avec ${winner.score} points !
🥈 ${otakuOrganisations[loser.org].emoji} *${loser.name}* (${loser.org})
🥈 ${loser.score} points
📊 *CLASSEMENT DES ORGANISATIONS:*
${Object.entries(otakuBattles.organizationScores)
    .sort(([,a], [,b]) => b.wins - a.wins)
    .slice(0, 3)
    .map(([org, stats], index) => 
        `${index + 1}. ${otakuOrganisations[org]?.emoji || '🏢'} ${org}: ${stats.wins}V/${stats.losses}D`
    ).join('\n')}
⚡ ${otakuOrganisations[winner.org].emoji} ${winnerOrg} domine !`
    await sock.sendMessage(jid, { 
        text: endMsg,
        mentions: [battle.challenger.jid, battle.opponent.jid]
    })
}
// Fonction pour trouver la partie d'un joueur
function findPlayerGame(playerJid) {
    console.log("🔍 Recherche de partie pour:", playerJid);
    console.log("📋 Parties en cours:", Array.from(loupGames.keys()));
    // Normaliser le JID pour comparer correctement
    const normalizedPlayerJid = playerJid.endsWith('@s.whatsapp.net') ? playerJid : playerJid + '@s.whatsapp.net';
    console.log("🔧 JID normalisé:", normalizedPlayerJid);
    for (const [groupJid, game] of loupGames.entries()) {
        console.log("🎮 Vérification partie:", groupJid);
        console.log("👥 Joueurs dans cette partie:", game.players.map(p => ({ 
            jid: p.jid, 
            normalizedJid: p.jid.endsWith('@s.whatsapp.net') ? p.jid : p.jid + '@s.whatsapp.net',
            name: p.name 
        })));
        // Vérifier avec JID normalisé
        const player = game.players.find(p => {
            const normalizedPj = p.jid.endsWith('@s.whatsapp.net') ? p.jid : p.jid + '@s.whatsapp.net';
            return normalizedPj === normalizedPlayerJid;
        });
        if (player) {
            console.log("✅ Joueur trouvé dans la partie:", groupJid);
            return { game, groupJid, player }
        }
    }
    console.log("❌ Aucune partie trouvée pour:", normalizedPlayerJid);
    return { game: null, groupJid: null, player: null }
}
// Fonction pour distribuer les rôles
function distributeRoles(game) {
    const players = [...game.players]
    const nbPlayers = players.length
    // Distribution équilibrée des rôles
    let nbLoups, nbSpecialRoles = 0;
    if (nbPlayers <= 5) {
        nbLoups = 1;
        nbSpecialRoles = 0; // Pas de rôles spéciaux pour les petites parties
    } else if (nbPlayers <= 8) {
        nbLoups = 2;
        nbSpecialRoles = 1; // 1 rôle spécial (voyante ou sorcière)
    } else if (nbPlayers <= 12) {
        nbLoups = 2;
        nbSpecialRoles = 2; // Voyante + Sorcière
    } else {
        nbLoups = 3;
        nbSpecialRoles = 2; // Voyante + Sorcière
    }
    // Mélanger les joueurs
    for (let i = players.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [players[i], players[j]] = [players[j], players[i]];
    }
    // Assigner les rôles
    let roleIndex = 0;
    // Assigner les loups
    for (let i = 0; i < nbLoups && roleIndex < players.length; i++) {
        players[roleIndex].role = "loup";
        roleIndex++;
    }
    // Assigner la Voyante si nécessaire
    if (nbSpecialRoles >= 1 && roleIndex < players.length) {
        players[roleIndex].role = "voyante";
        roleIndex++;
    }
    // Assigner la Sorcière si nécessaire
    if (nbSpecialRoles >= 2 && roleIndex < players.length) {
        players[roleIndex].role = "sorciere";
        players[roleIndex].hasPotionLife = true;  // Potion de vie
        players[roleIndex].hasPotionDeath = true; // Potion de mort
        roleIndex++;
    }
    // Le reste sont des villageois
    for (let i = roleIndex; i < players.length; i++) {
        players[i].role = "villageois";
    }
    game.players = players;
    // Afficher la distribution en console pour debug
    console.log(`Distribution des rôles (${nbPlayers} joueurs):`);
    console.log(`- Loups: ${nbLoups}`);
    console.log(`- Voyante: ${nbSpecialRoles >= 1 ? 1 : 0}`);
    console.log(`- Sorcière: ${nbSpecialRoles >= 2 ? 1 : 0}`);
    console.log(`- Villageois: ${nbPlayers - nbLoups - nbSpecialRoles}`);
}
// Fonction pour envoyer les rôles
async function sendRolesToPlayers(jid, game, sock) {
    const groupJid = jid
    // Annonce SECRÈTE dans le groupe - PAS DE RÉVÉLATION
    let roleAnnouncement = `╭───〔  🎭 RÔLES DISTRIBUTION 〕───⬣
│◦❒ 📜 Rôles distribués en message privé !
│◦❒ 
│◦❒ 🤫 TOUS LES RÔLES SONT SECRETS
│◦❒ 🔐 Ne révélez JAMAIS votre rôle
│◦❒ 
│◦❒ 📱 Consultez vos messages privés
│◦❒ 💀 Le secret est votre meilleure arme
│◦❒ 
│◦❒ 🌙 La première nuit commence...
│◦❒ ⏱️ 3 minutes pour les actions de nuit
╰════════════════════════⬣`
    await sock.sendMessage(groupJid, { 
        text: roleAnnouncement,
        mentions: game.players.map(p => p.jid)
    })
    // Envoyer les détails en PV SEULEMENT
    for (const player of game.players) {
        let roleMessage = ""
        if (player.role === "loup") {
            // Trouver les autres loups SEULEMENT en PV
            const autresLoups = game.players
                .filter(p => p.role === "loup" && p.jid !== player.jid)
                .map(p => `${p.displayName}`).join(", ") || "Aucun autre loup"
            roleMessage = `╭───〔  🐺 TON RÔLE : LOUP-GAROU 〕───⬣
│◦❒ Tu es un LOUP-GAROU !
│◦❒ 
│◦❒ 🐺 Autres loups : ${autresLoups}
│◦❒ 
│◦❒ 💬 Discutez AVEC EUX en PV pour décider
│◦❒ 📝 Un loup chef envoie la décision finale
│◦❒ 
│◦❒ ⏱️ Tape !kill pour voir tes cibles
│◦❒ 💀 Votre but : éliminer tous les villageois
│◦❒ 
│◦❒ 🤫 NE RÉVÈLE JAMAIS TON RÔLE !
╰════════════════════════⬣`
        } else if (player.role === "voyante") {
            roleMessage = `╭───〔  🔮 TON RÔLE : VOYANTE 〕───⬣
│◦❒ Tu es la VOYANTE !
│◦❒ 
│◦❒ 🔮 Tu peux voir le rôle d'un joueur chaque nuit
│◦❒ 
│◦❒ Chaque nuit, envoie MOI un message privé
│◦❒ Tape !see pour voir les joueurs disponibles
│◦❒ 
│◦❒ ⚠️ Ne révèle JAMAIS ton rôle aux autres !
│◦❒ 💡 Ton pouvoir est précieux, utilise-le bien
│◦❒ 
│◦❒ 🤫 LE SECRET EST TA FORCE !
╰════════════════════════⬣`
        } else if (player.role === "sorciere") {
            const potions = []
            if (player.hasPotionLife) potions.push("💊 Potion de vie")
            if (player.hasPotionDeath) potions.push("⚗️ Potion de mort")
            roleMessage = `╭─〔  🧪 TON RÔLE : SORCIÈRE 〕─⬣
│◦❒ Tu es la SORCIÈRE !
│◦❒ 
│◦❒ 🧪 Tes potions : ${potions.join(", ")}
│◦❒ 
│◦❒ 💊 Potion de vie : Sauve un joueur tué par les loups
│◦❒ ⚗️ Potion de mort : Tue un joueur de ton choix
│◦❒ 
│◦❒ Chaque nuit, envoie MOI un message privé
│◦❒ Tape !potions pour voir tes options
│◦❒ 
│◦❒ ⚠️ Tu n'as chaque potion qu'une seule fois !
│◦❒ 🤫 NE RÉVÈLE JAMAIS TON RÔLE !
╰════════════════════════⬣`
        } else {
            roleMessage = `╭─〔  👨‍🌾 TON RÔLE : VILLAGEOIS 〕─⬣
│◦❒ Tu es un simple VILLAGEOIS
│◦❒ 
│◦❒ Tu n'as pas de pouvoir spécial
│◦❒ 
│◦❒ 💬 Le jour, discute dans le groupe
│◦❒ 🔍 Essaie de trouver qui sont les loups
│◦❒ 🗳️ Participe aux votes pour les éliminer
│◦❒ 
│◦❒ Tape !vote quand tu es prêt à voter
│◦❒ 🌙 La nuit, patiente jusqu'au matin
│◦❒ 
│◦❒ 🤫 PROTÈGE LE VILLAGE !
╰════════════════════════⬣`
        }
        try {
            await sock.sendMessage(player.jid, { text: roleMessage })
            console.log(`Rôle secret envoyé à ${player.displayName} (${player.role})`)
        } catch (error) {
            console.error(`Erreur en envoyant le rôle à ${player.displayName}:`, error)
            // Envoyer dans le groupe SEULEMENT si PV échoue
            await sock.sendMessage(groupJid, { 
                text: `⚠️ @${player.name} (${player.displayName}), vérifie tes messages privés !`,
                mentions: [player.jid]
            })
        }
    }
}
async function resolveNightPhase(jid, game, sock) {
    // Annuler le timer de nuit si la nuit se termine plus tôt
    if (game.nightTimer) {
        clearTimeout(game.nightTimer)
        game.nightTimer = null
    }
    let deaths = []
    // 1. Action des loups
    const killedJid = game.nightActions.loupKill
    if (killedJid) {
        const killed = game.players.find(p => p.jid === killedJid)
        if (killed && killed.alive) {
            // Vérifier si la sorcière a utilisé sa potion de vie
            if (game.nightActions.sorciereLife === killedJid) {
                // La sorcière a sauvé la victime
                console.log(`${killed.name} a été sauvé par la potion de vie`)
            } else {
                // La victime meurt
                killed.alive = false
                deaths.push(killed)
            }
        }
    }
    // 2. Action de la sorcière (potion de mort)
    const deathJid = game.nightActions.sorciereDeath
    if (deathJid) {
        const target = game.players.find(p => p.jid === deathJid)
        if (target && target.alive) {
            target.alive = false
            deaths.push(target)
        }
    }
    // Message du matin
    let morningMessage = `╭───〔  🌅 LE JOUR SE LÈVE 〕───⬣\n│◦❒ 📜 RÉSULTAT DE LA NUIT\n│\n`
    if (deaths.length === 0) {
        morningMessage += `│◦❒ 🍃 Personne n'est mort cette nuit...\n`
    } else {
        deaths.forEach(dead => {
            morningMessage += `│◦❒ 💀 *${dead.displayName}* a été trouvé(e) mort(e) !\n`
        })
    }
    const aliveCount = game.players.filter(p => p.alive).length
    morningMessage += `│◦❒ \n│◦❒ 👥 Joueurs vivants : ${aliveCount}\n`
    morningMessage += `│◦❒ \n│◦❒ 💬 Discutez pour trouver les coupables\n`
    morningMessage += `│◦❒ 🗳️ Quand vous êtes prêts, tapez *!vote*\n`
    morningMessage += `╰════════════════════════⬣`
    await sock.sendMessage(jid, { text: morningMessage })
    // Passer en phase de jour
    game.status = "day"
    game.votes = {}
    game.votingActive = false
    // Vérifier si la partie est finie
    checkGameEnd(jid, game, sock)
}
function checkGameEnd(jid, game, sock) {
    const loups = game.players.filter(p => p.role === "loup" && p.alive).length
    const villageois = game.players.filter(p => p.role !== "loup" && p.alive).length
    const totalAlive = loups + villageois
    console.log(`Vérification fin de partie: ${loups} loups, ${villageois} villageois, ${totalAlive} total`)
    // Les loups gagnent s'ils sont égaux ou supérieurs aux villageois
    if (loups >= villageois && totalAlive > 1) {
        endGame(jid, game, "wolves", sock)
        return true
    }
    // Les villageois gagnent si tous les loups sont morts
    if (loups === 0) {
        endGame(jid, game, "villagers", sock)
        return true
    }
    // Cas particulier : 1 loup vs 1 villageois = les loups gagnent
    if (totalAlive === 2 && loups === 1 && villageois === 1) {
        endGame(jid, game, "wolves", sock)
        return true
    }
    return false
}
async function endGame(jid, game, winner, sock) {
    if (winner === "villagers") {
        await sock.sendMessage(jid, { 
            text: `🎉 *VICTOIRE DES VILLAGEOIS !* Tous les loups sont morts !` 
        })
    } else {
        await sock.sendMessage(jid, { 
            text: `🐺 *VICTOIRE DES LOUPS !* Ils ont pris le contrôle du village !` 
        })
    }
    // Afficher les rôles de tous
    let rolesMsg = "╭───〔  📜 RÔLES FINAUX 〕───⬣\n"
    game.players.forEach(p => {
        const status = p.alive ? "✅ Vivant" : "💀 Mort"
        rolesMsg += `│◦❒ @${p.name} : ${p.role} ${status}\n` 
    })
    rolesMsg += "╰════════════════════════⬣"
    await sock.sendMessage(jid, { 
        text: rolesMsg,
        mentions: game.players.map(p => p.jid)
    })
    loupGames.delete(jid)
}
async function startNightPhase(jid, game, sock) {
    game.status = "night"
    game.nightActions = {}
    game.turn++
    // Annonce de la nuit
    await sock.sendMessage(jid, { 
        text: `╭───〔  🌙 NUIT ${game.turn} 〕───⬣
│◦❒ La nuit tombe sur le village...
│◦❒ 
│◦❒ 🐺 Loups : !kill en privé
│◦❒ 🔮 Voyante : !see en privé  
│◦❒ 🧪 Sorcière : !potions en privé
│◦❒ 
│◦❒ ⏱️ 3 minutes pour les actions
│◦❒ 💬 Actions privées uniquement
╰════════════════════════⬣`
    })
    // Timer de 3 minutes pour la nuit
    if (game.nightTimer) clearTimeout(game.nightTimer)
    game.nightTimer = setTimeout(() => {
        resolveNightPhase(jid, game, sock)
    }, 180000) // 3 minutes
}
async function resolveVotePhase(jid, game, sock) {
    game.votingActive = false
    game.status = "day" // Temporaire
    // Compter les votes
    const voteCount = {}
    for (const targetJid of Object.values(game.votes)) {
        voteCount[targetJid] = (voteCount[targetJid] || 0) + 1
    }
    // Trouver le maximum
    let maxVotes = 0
    let eliminated = null
    for (const [targetJid, count] of Object.entries(voteCount)) {
        if (count > maxVotes) {
            maxVotes = count
            eliminated = targetJid
        }
    }
    let resultMessage = `╭───〔  ⚖️ RÉSULTAT DU VOTE 〕───⬣\n│\n│ 🔍 Dépouillement :\n` 
    if (eliminated && maxVotes > 0) {
        // Afficher les votes
        for (const [targetJid, count] of Object.entries(voteCount)) {
            const target = game.players.find(p => p.jid === targetJid)
            resultMessage += `│ • ${target.name} : ${count} vote(s)\n` 
        }
        const eliminatedPlayer = game.players.find(p => p.jid === eliminated)
        eliminatedPlayer.alive = false
        resultMessage += `│\n│ ⚰️ *${eliminatedPlayer.name}* est éliminé !\n` 
        resultMessage += `│ \n│ 👤 Rôle de ${eliminatedPlayer.name} : *${eliminatedPlayer.role.toUpperCase()}*\n` 
        await sock.sendMessage(jid, { 
            text: resultMessage,
            mentions: [eliminatedPlayer.jid]
        })
        // Vérifier fin de partie
        if (!checkGameEnd(jid, game, sock)) {
            // Nouvelle nuit
            game.status = "night"
            game.nightActions = {}
            await sock.sendMessage(jid, { 
                text: `🌙 La nuit tombe... Prochaine phase dans 10 secondes` 
            })
            setTimeout(() => {
                startNightPhase(jid, game, sock)
            }, 10000)
        }
    } else {
        resultMessage += `│ Aucun vote valide enregistré\n` 
        resultMessage += `│\n│ ⏱️ Retour à la phase de jour\n` 
        resultMessage += `╰════════════════════════⬣` 
        await sock.sendMessage(jid, { text: resultMessage })
        game.status = "day"
    }
}
function loadGroups() {
    try {
        if (fs.existsSync(GROUPS_FILE)) {
            return JSON.parse(fs.readFileSync(GROUPS_FILE, "utf8"))
        }
    } catch (err) {
        console.log("Erreur chargement groupes:", err)
    }
    return []
}
function saveGroups(groups) {
    try {
        fs.writeFileSync(GROUPS_FILE, JSON.stringify(groups, null, 2))
    } catch (err) {
        console.log("Erreur sauvegarde groupes:", err)
    }
}
// Fonction pour convertir une image en WebP (format des stickers WhatsApp)
async function convertToWebP(buffer) {
    try {
        // Vérifier le format actuel
        const metadata = await sharp(buffer).metadata()
        // Si déjà en WebP, retourner le buffer inchangé
        if (metadata.format === 'webp') {
            return buffer
        }
        // Convertir en WebP avec redimensionnement
        return await sharp(buffer)
            .resize(512, 512, { 
                fit: 'contain', 
                background: { r: 0, g: 0, b: 0, alpha: 0 } 
            })
            .webp({ quality: 80 })
            .toBuffer()
    } catch (err) {
        console.error('Erreur conversion WebP:', err)
        return buffer
    }
}
function startGameTimer(jid, sock, gameType, timeoutSeconds) {
    if (gameTimers.has(jid)) {
        clearTimeout(gameTimers.get(jid))
    }
    const timer = setTimeout(async () => {
        const game = activeGames.get(jid)
        if (game) {
            let answerText = ""
            let timeoutMsg = ""
            switch (game.type) {
                case "country":
                    answerText = game.answer
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\n🌍 La réponse était : *${answerText}*\n\nPersonne n'a trouvé la bonne réponse !`
                    break
                case "capitale":
                    answerText = game.answer
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\n🏛️ La capitale était : *${answerText}*\n\nPersonne n'a trouvé la bonne réponse !`
                    break
                case "vraioufaux":
                    answerText = game.answer ? "VRAI" : "FAUX"
                    const vraiFauxExplanation = game.explanation || ""
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\n❓ La réponse était : *${answerText}*\n💡 ${vraiFauxExplanation}\n\nPersonne n'a trouvé la bonne réponse !`
                    break
                case "devine":
                    answerText = game.answer
                    const indice = game.wordObj?.hint || ""
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\n🔮 Le mot était : *${answerText}*\n💡 Indice : ${indice}\n\nPersonne n'a trouvé la bonne réponse !`
                    break
                case "culture":
                    answerText = game.correctAnswer || "Réponse non disponible"
                    const cultureExplanation = game.explanation || ""
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\n🎓 La bonne réponse était : *${answerText}*\n💡 ${cultureExplanation}\n\nPersonne n'a trouvé la bonne réponse !`
                    break
                case "drapeau":
                    answerText = game.answer
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\n🏁 Le pays était : *${answerText}*\n\nPersonne n'a trouvé la bonne réponse !`
                    break
                case "monument":
                    answerText = game.answer
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\n🏛️ Le monument était : *${answerText}*\n\nPersonne n'a trouvé la bonne réponse !`
                    break
                case "science":
                    answerText = game.correctAnswer || "Réponse non disponible"
                    const scienceExplanation = game.explanation || ""
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\n🔬 La bonne réponse était : *${answerText}*\n💡 ${scienceExplanation}\n\nPersonne n'a trouvé la bonne réponse !`
                    break
                case "sport":
                    answerText = game.correctAnswer || "Réponse non disponible"
                    const sportExplanation = game.explanation || ""
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\n⚽ La bonne réponse était : *${answerText}*\n💡 ${sportExplanation}\n\nPersonne n'a trouvé la bonne réponse !`
                    break
                case "cinema":
                    answerText = game.correctAnswer || "Réponse non disponible"
                    const cinemaExplanation = game.explanation || ""
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\n🎬 La bonne réponse était : *${answerText}*\n💡 ${cinemaExplanation}\n\nPersonne n'a trouvé la bonne réponse !`
                    break
                case "histoire":
                    answerText = game.correctAnswer || "Réponse non disponible"
                    const histoireExplanation = game.explanation || ""
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\n📚 La bonne réponse était : *${answerText}*\n💡 ${histoireExplanation}\n\nPersonne n'a trouvé la bonne réponse !`
                    break
                case "math":
                    answerText = game.correctAnswer || "Réponse non disponible"
                    const mathExplanation = game.explanation || ""
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\n🔢 La bonne réponse était : *${answerText}*\n💡 ${mathExplanation}\n\nPersonne n'a trouvé la bonne réponse !`
                    break
                case "logique":
                    answerText = game.correctAnswer || "Réponse non disponible"
                    const logiqueExplanation = game.explanation || ""
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\n🧩 La bonne réponse était : *${answerText}*\n💡 ${logiqueExplanation}\n\nPersonne n'a trouvé la bonne réponse !`
                    break
                case "culturepop":
                    answerText = game.correctAnswer || "Réponse non disponible"
                    const culturepopExplanation = game.explanation || ""
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\n🎭 La bonne réponse était : *${answerText}*\n💡 ${culturepopExplanation}\n\nPersonne n'a trouvé la bonne réponse !`
                    break
                case "anime":
                    answerText = game.answer
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\n🎌 L'anime était : *${answerText}*\n\nPersonne n'a trouvé la bonne réponse !`
                    break
                case "manga":
                    answerText = game.answer
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\n📖 Le manga était : *${answerText}*\n\nPersonne n'a trouvé la bonne réponse !`
                    break
                case "personnage":
                    answerText = game.answer
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\n👤 Le personnage était : *${answerText}*\n\nPersonne n'a trouvé la bonne réponse !`
                    break
                case "opening":
                    answerText = game.answer
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\n🎵 L'anime de cet opening était : *${answerText}*\n\nPersonne n'a trouvé la bonne réponse !`
                    break
                case "seiyuu":
                    answerText = game.answer
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\n🎙️ Le seiyuu était : *${answerText}*\n\nPersonne n'a trouvé la bonne réponse !`
                    break
                default:
                    answerText = game.answer || "Réponse non disponible"
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\nLa réponse était : *${answerText}*`
            }
            await sock.sendMessage(jid, { text: timeoutMsg })
            activeGames.delete(jid)
            if (usedQuestions.has(jid)) {
                const groupQuestions = usedQuestions.get(jid)
                // Réinitialiser les questions utilisées pour ce type
                const currentGameType = gameTimers.get(jid + '_type')
                if (currentGameType && groupQuestions[currentGameType]) {
                    groupQuestions[currentGameType] = []
                }
            }
            gameTimers.delete(jid)
            gameTimers.delete(jid + '_type')
        }
    }, timeoutSeconds * 1000)
    gameTimers.set(jid, timer)
    gameTimers.set(jid + '_type', gameType)
}
function getUnusedQuestion(jid, gameType, allQuestions, getIdFunc) {
    if (!usedQuestions.has(jid)) {
        usedQuestions.set(jid, { 
            country: [], 
            vraioufaux: [], 
            capitale: [], 
            devine: [],
            anime: [],
            manga: [],
            personnage: [],
            opening: [],
            seiyuu: [],
            debat: [], 
            culture: [], 
            drapeau: [], 
            monument: [], 
            science: [], 
            sport: [], 
            cinema: [], 
            histoire: [], 
            math: [], 
            logique: [], 
            culturepop: [] 
        })
    }
    const groupUsedQuestions = usedQuestions.get(jid)
    const usedIds = groupUsedQuestions[gameType] || []
    let availableQuestions = []
    if (gameType === "devine") {
        // Pour devineWords, c'est un tableau d'objets avec answer
        availableQuestions = allQuestions.filter(q => {
            const id = q.answer || q
            return !usedIds.includes(id)
        })
    } else {
        availableQuestions = allQuestions.filter(q => !usedIds.includes(getIdFunc(q)))
    }
    if (availableQuestions.length === 0) {
        groupUsedQuestions[gameType] = []
        return allQuestions[Math.floor(Math.random() * allQuestions.length)]
    }
    const selectedQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)]
    if (usedIds.length >= 50) {
        groupUsedQuestions[gameType] = usedIds.slice(-25)
    }
    if (gameType === "devine") {
        groupUsedQuestions[gameType].push(selectedQuestion.answer || selectedQuestion)
    } else {
        groupUsedQuestions[gameType].push(getIdFunc(selectedQuestion))
    }
    return selectedQuestion
}
function addWarn(userId, groupId, reason) {
    const key = `${userId}_${groupId}`
    if (!warns[key]) {
        warns[key] = {
            count: 0,
            reasons: []
        }
    }
    // Limite à 3 warns maximum
    if (warns[key].count >= 3) {
        return warns[key].count
    }
    warns[key].count++
    warns[key].reasons.push(reason)
    saveWarns()
    return warns[key].count
}
function removeWarn(userId, groupId) {
    const key = `${userId}_${groupId}`
    if (warns[key]) {
        delete warns[key]
        saveWarns()
        return true
    }
    return false
}
function incrementMessageCount(groupId, userId) {
    if (!messageCounts[groupId]) {
        messageCounts[groupId] = {}
    }
    if (!messageCounts[groupId][userId]) {
        messageCounts[groupId][userId] = 0
    }
    messageCounts[groupId][userId]++
    saveMessageCounts()
    if (!userProfiles[userId]) {
        userProfiles[userId] = {
            messages: 0,
            level: 0,
            xp: 0,
            warns: 0
        }
    }
    userProfiles[userId].messages++
    userProfiles[userId].xp++
    const newLevel = Math.floor(userProfiles[userId].messages / 50)
    if (newLevel > userProfiles[userId].level) {
        userProfiles[userId].level = newLevel
    }
    saveProfiles()
    return messageCounts[groupId][userId]
}
// ====================
// FONCTIONS UTILITAIRES
// ====================
async function isAdmin(sock, groupId, userId) {
    try {
        const metadata = await sock.groupMetadata(groupId)
        return metadata.participants.some(p => 
            p.id === userId && (p.admin === 'admin' || p.admin === 'superadmin')
        )
    } catch (err) {
        console.log("Erreur vérification admin:", err)
        return false
    }
}
async function isBotAdmin(sock, groupId) {
    try {
        const metadata = await sock.groupMetadata(groupId)
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net'
        return metadata.participants.some(p => 
            p.id === botId && (p.admin === 'admin' || p.admin === 'superadmin')
        )
    } catch (err) {
        console.log("Erreur vérification bot admin:", err)
        return false
    }
}
function getCompatibilityEmoji(score) {
    const emojis = ["💕", "❤️", "💗", "💝", "💖", "💘", "💓", "💞", "💫", "⭐", "🌟", "✨", "🎯", "🎪", "🎨", "🎵", "🌺", "🌸", "🌹", "🦋"]
    return emojis[Math.min(Math.floor(score / 5), emojis.length - 1)]
}
function getCompatibilityMessage(score) {
    if (score >= 90) return { emoji: "💕", message: "Amour éternel !", description: "Une âme sœur !" }
    if (score >= 75) return { emoji: "❤️", message: "Très compatible !", description: "Une belle histoire d'amour !" }
    if (score >= 60) return { emoji: "💗", message: "Bien compatible !", description: "Beaucoup de potentiel !" }
    if (score >= 45) return { emoji: "💝", message: "Compatible !", description: "Ça pourrait marcher !" }
    if (score >= 30) return { emoji: "💖", message: "Un peu compatible !", description: "Avec des efforts..." }
    if (score >= 15) return { emoji: "💘", message: "Peu compatible !", description: "Difficile mais possible !" }
    return { emoji: "💔", message: "Pas compatible !", description: "Vaut mieux rester amis !" }
}
function getLoveLevel(score) {
    if (score >= 90) return { emoji: "💕", message: "Amour fou !", description: "Coup de foudre garanti !" }
    if (score >= 75) return { emoji: "❤️", message: "Très amoureux !", description: "Une belle histoire !" }
    if (score >= 60) return { emoji: "💗", message: "Amoureux !", description: "Beaucoup de sentiments !" }
    if (score >= 45) return { emoji: "💝", message: "Begué !", description: "Des sentiments naissants !" }
    if (score >= 30) return { emoji: "💖", message: "Un peu begué !", description: "Une petite flamme !" }
    if (score >= 15) return { emoji: "💘", message: "Légèrement begué !", description: "Une petite attirance !" }
    return { emoji: "💔", message: "Pas begué !", description: "Vaut mieux rester amis !" }
}
// ====================
// FONCTION POUR OBTENIR UNE QUESTION NON RÉPÉTÉE
// ====================
function getUnusedAouvQuestion(jid, type) {
    // Initialiser les questions utilisées pour ce groupe
    if (!aouvUsedQuestions.has(jid)) {
        aouvUsedQuestions.set(jid, { actions: [], verites: [] })
    }
    const groupUsed = aouvUsedQuestions.get(jid)
    const usedList = type === "action" ? groupUsed.actions : groupUsed.verites
    const allQuestions = type === "action" ? aouvActions : aouvVerites
    // Filtrer les questions non utilisées
    const availableQuestions = allQuestions.filter(q => !usedList.includes(q))
    // Si toutes les questions ont été utilisées, on réinitialise la liste
    if (availableQuestions.length === 0) {
        groupUsed[type === "action" ? "actions" : "verites"] = []
        return allQuestions[Math.floor(Math.random() * allQuestions.length)]
    }
    // Choisir une question aléatoire parmi les disponibles
    const selectedQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)]
    // Ajouter aux questions utilisées
    if (type === "action") {
        groupUsed.actions.push(selectedQuestion)
    } else {
        groupUsed.verites.push(selectedQuestion)
    }
    return selectedQuestion
}
function getUserLevel(userId) {
    if (!userProfiles[userId]) {
        return { level: 0, messages: 0, xp: 0, progress: 0 }
    }
    const messages = userProfiles[userId].messages
    const level = Math.floor(messages / 50)
    const progress = messages % 50
    return {
        level: level,
        messages: messages,
        xp: userProfiles[userId].xp,
        progress: progress
    }
}
function addScore(userId, points, groupId) {
    if (!scores.has(groupId)) {
        scores.set(groupId, new Map())
    }
    const groupScores = scores.get(groupId)
    if (!groupScores.has(userId)) {
        groupScores.set(userId, { total: 0, games: 0 })
    }
    const userScore = groupScores.get(userId)
    userScore.total += points
    userScore.games++
    if (!userProfiles[userId]) {
        userProfiles[userId] = {
            messages: 0,
            level: 0,
            xp: 0,
            warns: 0
        }
    }
    userProfiles[userId].xp += points
    saveProfiles()
    saveScores() // NOUVEAU: Sauvegarder les scores
}
// Ancienne fonction startBot supprimée - utiliser celle à la fin du fichier
async function handleMessage(sock, msg, text, jid) {
    try {
        if (!msg.message) return
        if (!jid) return
        const message = msg.message
        let cleanText = message.conversation ||
            message.extendedTextMessage?.text ||
            message.imageMessage?.caption ||
            message.videoMessage?.caption ||
            ""
        cleanText = cleanText.trim()
        if (!cleanText) return
        // Rate limiting désactivé - plus de cooldown
        // const now = Date.now()
        // const cooldownKey = `${msg.key.participant}_${cleanText.split(' ')[0]}`
        // const lastCommandTime = userCooldowns.get(cooldownKey) || 0
        // const commandCooldown = getCommandCooldown(cleanText)
        // 
        // if (now - lastCommandTime < commandCooldown) {
        //     const remainingTime = Math.ceil((commandCooldown - (now - lastCommandTime)) / 1000)
        //     await sock.sendMessage(jid, { 
        //         text: `⏱️ Attends ${remainingTime} secondes avant de réutiliser cette commande !` 
        //     }, { quoted: msg })
        //     return // Ignorer les commandes trop fréquentes
        // }
        // userCooldowns.set(cooldownKey, now)
        // Sauvegarder les groupes
        if (jid.endsWith("@g.us")) {
            if (!cachedGroups.includes(jid)) {
                cachedGroups.push(jid)
                saveGroups(cachedGroups)
            }
            if (msg.key.participant) {
                incrementMessageCount(jid, msg.key.participant)
            }
        }
        // ANTI-LINK SYSTEM
        if (jid.endsWith("@g.us") && config[jid]?.antilink && !msg.key.fromMe) {
            const hasLink = bannedLinks.some(link => cleanText.toLowerCase().includes(link)) ||
                /(https?:\/\/[^\s]+)/g.test(cleanText)
            if (hasLink) {
                await sock.sendMessage(jid, { delete: msg.key })
                await sock.sendMessage(jid, {
                    text: `🚫 @${msg.key.participant.split('@')[0]} pas de liens ici !`,
                    mentions: [msg.key.participant]
                }, { quoted: msg })
                return
            }
        }
            // COMMANDES STATISTIQUES
            if (cleanText === "!msgcount") {
                if (!jid.endsWith("@g.us")) return
                const userId = msg.key.participant
                const count = messageCounts[jid]?.[userId] || 0
                const user = userId.split('@')[0]
                const msgCountMsg = `╭───〔  📊 MESSAGE COUNT 〕───⬣
│◦❒ @${user}
│◦❒ Messages envoyés : ${count}
│◦❒ 
│◦❒ Continue comme ça ! 💪
╰════════════════════════⬣`
                await sock.sendMessage(jid, {
                    text: msgCountMsg,
                    mentions: [userId]
                }, { quoted: msg })
            }
            if (cleanText.startsWith("!msgcount ") && cleanText.includes("@")) {
                if (!jid.endsWith("@g.us")) return
                const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
                if (!mentioned) return
                const count = messageCounts[jid]?.[mentioned] || 0
                const user = mentioned.split('@')[0]
                const msgCountMsg = `╭───〔  📊 MESSAGE COUNT 〕───⬣
│◦❒ @${user}
│◦❒ Messages envoyés : ${count}
╰════════════════════════⬣`
                await sock.sendMessage(jid, {
                    text: msgCountMsg,
                    mentions: [mentioned]
                }, { quoted: msg })
            }
            if (cleanText === "!top") {
                if (!jid.endsWith("@g.us") || !messageCounts[jid]) return
                const sorted = Object.entries(messageCounts[jid])
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                let topMsg = "╭───〔  🏆 TOP 10 ACTIFS 〕───⬣\n"
                for (let i = 0; i < sorted.length; i++) {
                    const [userId, count] = sorted[i]
                    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🎯"
                    topMsg += `│◦❒ ${medal} @${userId.split('@')[0]} : ${count} messages\n`
                }
                topMsg += "╰════════════════════════⬣"
                const mentions = sorted.map(([userId]) => userId)
                await sock.sendMessage(jid, {
                    text: topMsg,
                    mentions: mentions
                }, { quoted: msg })
            }
            if (cleanText === "!groupstats") {
                if (!jid.endsWith("@g.us")) return
                const metadata = await sock.groupMetadata(jid)
                const totalMembers = metadata.participants.length
                const admins = metadata.participants.filter(p => p.admin).length
                let activeMembers = 0
                if (messageCounts[jid]) {
                    activeMembers = Object.values(messageCounts[jid])
                        .filter(count => count > 5).length
                }
                const totalMessages = Object.values(messageCounts[jid] || {}).reduce((a, b) => a + b, 0)
                const statsMsg = `╭───〔  📈 STATISTIQUES GROUPE 〕───⬣
│◦❒ Membres : ${totalMembers}
│◦❒ Admins : ${admins}
│◦❒ Membres actifs : ${activeMembers}
│◦❒ Messages totaux : ${totalMessages}
╰════════════════════════⬣`
                await sock.sendMessage(jid, { text: statsMsg }, { quoted: msg })
            }
            // ====================
            // COMMANDES FUN
            // ====================
            if (cleanText === "!couple") {
                if (!jid.endsWith("@g.us")) return
                const metadata = await sock.groupMetadata(jid)
                const participants = metadata.participants.map(p => p.id)
                const shuffled = participants.sort(() => 0.5 - Math.random())
                const couple1 = shuffled[0]
                const couple2 = shuffled[1]
                const coupleMsg = `╭───〔  💑 COUPLE DU JOUR 〕───⬣
│◦❒ @${couple1.split('@')[0]} ❤️ @${couple2.split('@')[0]}
│◦❒ 
│◦❒ Quel beau couple ! 💕
│◦❒ Ils sont faits l'un pour l'autre !
╰════════════════════════⬣`
                await sock.sendMessage(jid, {
                    text: coupleMsg,
                    mentions: [couple1, couple2]
                }, { quoted: msg })
            }
            if (cleanText.startsWith("!crush")) {
                if (!jid.endsWith("@g.us")) return
                const metadata = await sock.groupMetadata(jid)
                const participants = metadata.participants.map(p => p.id)
                const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || []
                let targetUser = null
                if (mentioned.length > 0) {
                    targetUser = mentioned[0]
                } else {
                    const shuffled = participants.sort(() => 0.5 - Math.random())
                    const cr1 = shuffled[0]
                    const cr2 = shuffled[1]
                    const crushMsg = `╭───〔  🤫 CRUSH SECRET 〕───⬣
│◦❒ @${cr1.split('@')[0]} a un crush sur @${cr2.split('@')[0]} !
│◦❒ 
│◦❒ Mais chut, c'est un secret... 🤐
╰════════════════════════⬣`
                    await sock.sendMessage(jid, {
                        text: crushMsg,
                        mentions: [cr1, cr2]
                    }, { quoted: msg })
                    return
                }
                const possibleCrushes = participants.filter(p => p !== targetUser)
                if (possibleCrushes.length === 0) {
                    await sock.sendMessage(jid, { text: "❌ Personne d'autre disponible dans le groupe !" }, { quoted: msg })
                    return
                }
                const crush = possibleCrushes[Math.floor(Math.random() * possibleCrushes.length)]
                const crushMessages = [
                    `💕 L'algorithme de l'amour a parlé !`,
                    `🔮 Ma boule de cristal ne se trompe jamais !`,
                    `💘 L'analyse des données est formelle !`,
                    `❤️ Les étoiles s'alignent pour révéler...`,
                    `💝 Les mathématiques du sentiment sont claires !`
                ]
                const randomMessage = crushMessages[Math.floor(Math.random() * crushMessages.length)]
                const crushMsg = `╭───〔  💕 CRUSH DÉTECTÉ 〕───⬣
│◦❒ ${randomMessage}
│◦❒ 
│◦❒ @${targetUser.split('@')[0]} est secrètement amoureux(se) de @${crush.split('@')[0]} 💘
│◦❒ 
│◦❒ 💘 Match parfait à ${Math.floor(Math.random() * 30) + 70}% ! 💘
│◦❒ 
│◦❒ Psst... c'est notre secret ! 🤫
╰════════════════════════⬣`
                await sock.sendMessage(jid, {
                    text: crushMsg,
                    mentions: [targetUser, crush]
                }, { quoted: msg })
            }
            if (cleanText === "!mariage") {
                if (!jid.endsWith("@g.us")) return
                const metadata = await sock.groupMetadata(jid)
                const participants = metadata.participants.map(p => p.id)
                const shuffled = participants.sort(() => 0.5 - Math.random())
                const spouse1 = shuffled[0]
                const spouse2 = shuffled[1]
                const marriageMsg = `╭───〔  💒 MARIAGE 〕───⬣
│◦❒ @${spouse1.split('@')[0]} et @${spouse2.split('@')[0]}
│◦❒ 
│◦❒ Félicitations aux nouveaux mariés ! 🎉
│◦❒ Que l'amour soit avec vous ! 💕
╰════════════════════════⬣`
                await sock.sendMessage(jid, {
                    text: marriageMsg,
                    mentions: [spouse1, spouse2]
                }, { quoted: msg })
            }
            // ====================
            // COMMANDES EXISTANTES
            // ====================
            if (cleanText === "!tagall") {
                if (!jid.endsWith("@g.us")) return
                const metadata = await sock.groupMetadata(jid)
                const participants = metadata.participants.map(p => p.id)
                let tagMessage = "╭───〔  👥 TAG ALL 〕───⬣\n"
                participants.forEach((participant, i) => {
                    tagMessage += `│◦❒ @${participant.split('@')[0]}\n`
                })
                tagMessage += "╰════════════════════════⬣"
                await sock.sendMessage(jid, {
                    text: tagMessage,
                    mentions: participants
                }, { quoted: msg })
            }
            // GAME COUNTRY
            if (cleanText === "!game country") {
                if (!jid.endsWith("@g.us")) return
                if (activeGames.has(jid)) {
                    await sock.sendMessage(jid, { text: "❌ Un jeu est déjà en cours !" }, { quoted: msg })
                    return
                }
                const country = countries[Math.floor(Math.random() * countries.length)]
                activeGames.set(jid, { type: "country", answer: country.name, attempts: 0 })
                const gameMsg = `🌍 DEVINE LE PAYS 
💡 Indice : ${country.indice}
🔤 Lettres : ${country.name.charAt(0)}${"_".repeat(country.name.length - 1)} (${country.name.length} lettres)
⏱️ Temps : 60 secondes
🏆 Récompense : 10 points
Écris le nom du pays pour gagner !`
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                startGameTimer(jid, sock, "country", 60)
            }
            // GAME CAPITALE
            if (cleanText === "!game capitale") {
                if (!jid.endsWith("@g.us")) return
                if (activeGames.has(jid)) {
                    await sock.sendMessage(jid, { text: "❌ Un jeu est déjà en cours !" }, { quoted: msg })
                    return
                }
                const country = countries[Math.floor(Math.random() * countries.length)]
                activeGames.set(jid, { type: "capitale", answer: country.capitale, attempts: 0 })
                const gameMsg = `🏛️ DEVINE LA CAPITALE
🌍 Pays : ${country.name}
💡 Indice : ${country.indice}
🔤 Lettres : ${country.capitale.charAt(0)}${"_".repeat(country.capitale.length - 1)} (${country.capitale.length} lettres)
⏱️ Temps : 75 secondes
🏆 Récompense : 10 points
Écris le nom de la capitale pour gagner !`
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                startGameTimer(jid, sock, "capitale", 75)
            }
            // VRAI OU FAUX
            if (cleanText === "!vraioufaux") {
                if (!jid.endsWith("@g.us")) return
                if (activeGames.has(jid)) {
                    await sock.sendMessage(jid, { text: "❌ Un jeu est déjà en cours !" }, { quoted: msg })
                    return
                }
                const question = trueFalseQuestions[Math.floor(Math.random() * trueFalseQuestions.length)]
                activeGames.set(jid, { type: "vraioufaux", answer: question.answer, explanation: question.explanation, attempts: 0 })
                const vraiFauxMsg = `❓ VRAI OU FAUX
💭 Question : ${question.question}
⏱️ Temps : 30 secondes
🏆 Récompense : 5 points
Réponds par "vrai" ou "faux" pour gagner !`
                await sock.sendMessage(jid, { text: vraiFauxMsg }, { quoted: msg })
                startGameTimer(jid, sock, "vraioufaux", 30)
            }
            // GAME DEVINE (CORRIGÉ)
            if (cleanText === "!devine") {
                if (!jid.endsWith("@g.us")) return
                if (activeGames.has(jid)) {
                    await sock.sendMessage(jid, { text: "❌ Un jeu est déjà en cours !" }, { quoted: msg })
                    return
                }
                const wordData = getUnusedQuestion(jid, "devine", devineWords, w => w.answer || w)
                const answer = typeof wordData === 'object' ? wordData.answer : wordData
                const hint = typeof wordData === 'object' ? wordData.hint : "Pas d'indice"
                activeGames.set(jid, { type: "devine", answer: answer, wordObj: wordData, attempts: 0, hints: [] })
                const devineMsg = `╭───〔 🧠 DEVINE 〕───⬣
│
│◦❒ Mot à deviner : ${"_".repeat(answer.length).split("").join(" ")} (${answer.length} lettres)
│◦❒ 
│◦❒ 💡 Indice : ${hint}
│◦❒ 
│◦❒ ⏱️ Temps : 45 secondes
│◦❒ 🏆 Récompense : 8 points
│◦❒ 
│◦❒ 💡 Tape "!indice" pour un indice supplémentaire
╰════════════════════════⬣`
                await sock.sendMessage(jid, { text: devineMsg }, { quoted: msg })
                startGameTimer(jid, sock, "devine", 45)
            }
            // GAME CULTURE GÉNÉRALE
            if (cleanText === "!culture") {
                if (!jid.endsWith("@g.us")) return
                if (activeGames.has(jid)) {
                    await sock.sendMessage(jid, { text: "❌ Un jeu est déjà en cours !" }, { quoted: msg })
                    return
                }
                const questionData = getUnusedQuestion(jid, "culture", cultureQuestions, q => q.question)
                activeGames.set(jid, { 
                    type: "culture", 
                    question: questionData.question, 
                    options: questionData.options,
                    correctAnswer: questionData.correct,
                    explanation: questionData.explanation,
                    attempts: 0,
                    startTime: Date.now(),
                    qcmAnswers: []
                })
                const gameMsg = `╭───〔 🎓 CULTURE GÉNÉRALE 〕───⬣
│
│◦❒ Question : ${questionData.question}
│◦❒ 
│◦❒ ${questionData.options.join('\n│◦❒ ')}
│◦❒ 
│◦❒ ⏱️ Temps : 60 secondes
│◦❒ 🏆 Récompense : 12 points
│◦❒ 
│◦❒ 💡 Réponds avec A, B, C ou D !
╰════════════════════════⬣`
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                startGameTimer(jid, sock, "culture", 60)
            }
            // GAME DRAPEAUX
            if (cleanText === "!drapeau") {
                if (!jid.endsWith("@g.us")) return
                if (activeGames.has(jid)) {
                    await sock.sendMessage(jid, { text: "❌ Un jeu est déjà en cours !" }, { quoted: msg })
                    return
                }
                const drapeauData = getUnusedQuestion(jid, "drapeau", drapeauQuestions, d => d.name)
                activeGames.set(jid, { 
                    type: "drapeau", 
                    answer: drapeauData.name, 
                    description: drapeauData.description,
                    attempts: 0 
                })
                const gameMsg = `╭───〔 🏁 DRAPEAUX 〕───⬣
│
│◦❒ Devine le pays avec ce drapeau :
│◦❒ 
│◦❒ ${drapeauData.description}
│◦❒ 
│◦❒ ⏱️ Temps : 50 secondes
│◦❒ 🏆 Récompense : 8 points
│◦❒ 
│◦❒ 💡 Écris le nom du pays !
╰════════════════════════⬣`
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                startGameTimer(jid, sock, "drapeau", 50)
            }
            // GAME MONUMENTS
            if (cleanText === "!monument") {
                if (!jid.endsWith("@g.us")) return
                if (activeGames.has(jid)) {
                    await sock.sendMessage(jid, { text: "❌ Un jeu est déjà en cours !" }, { quoted: msg })
                    return
                }
                const monumentData = getUnusedQuestion(jid, "monument", monumentQuestions, m => m.name)
                activeGames.set(jid, { 
                    type: "monument", 
                    answer: monumentData.name, 
                    description: monumentData.description,
                    indice: monumentData.indice,
                    indice2: monumentData.indice2,
                    pays: monumentData.pays,
                    attempts: 0,
                    hints: []
                })
                const gameMsg = `╭───〔 🏛️ MONUMENTS 〕───⬣
│
│◦❒ Devine le monument :
│◦❒ 
│◦❒ ${monumentData.description}
│◦❒ 
│◦❒ ⏱️ Temps : 55 secondes
│◦❒ 🏆 Récompense : 9 points
│◦❒ 
│◦❒ 💡 Tape "!indice" pour un indice supplémentaire
╰════════════════════════⬣`
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                startGameTimer(jid, sock, "monument", 55)
            }
            // GAME SCIENCE
            if (cleanText === "!science") {
                if (!jid.endsWith("@g.us")) return
                if (activeGames.has(jid)) {
                    await sock.sendMessage(jid, { text: "❌ Un jeu est déjà en cours !" }, { quoted: msg })
                    return
                }
                const questionData = getUnusedQuestion(jid, "science", scienceQuestions, q => q.question)
                activeGames.set(jid, { 
                    type: "science", 
                    question: questionData.question, 
                    options: questionData.options,
                    correctAnswer: questionData.correct,
                    explanation: questionData.explanation,
                    attempts: 0,
                    qcmAnswers: []
                })
                const gameMsg = `╭───〔 🔬 SCIENCE 〕───⬣
│
│◦❒ Question : ${questionData.question}
│◦❒ 
│◦❒ ${questionData.options.join('\n│◦❒ ')}
│◦❒ 
│◦❒ ⏱️ Temps : 45 secondes
│◦❒ 🏆 Récompense : 11 points
│◦❒ 
│◦❒ 💡 Réponds avec A, B, C ou D !
╰════════════════════════⬣`
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                startGameTimer(jid, sock, "science", 45)
            }
            // GAME SPORT
            if (cleanText === "!sport") {
                if (!jid.endsWith("@g.us")) return
                if (activeGames.has(jid)) {
                    await sock.sendMessage(jid, { text: "❌ Un jeu est déjà en cours !" }, { quoted: msg })
                    return
                }
                const questionData = getUnusedQuestion(jid, "sport", sportQuestions, q => q.question)
                activeGames.set(jid, { 
                    type: "sport", 
                    question: questionData.question, 
                    options: questionData.options,
                    correctAnswer: questionData.correct,
                    explanation: questionData.explanation,
                    attempts: 0,
                    qcmAnswers: []
                })
                const gameMsg = `╭───〔 ⚽ SPORT 〕───⬣
│
│◦❒ Question : ${questionData.question}
│◦❒ 
│◦❒ ${questionData.options.join('\n│◦❒ ')}
│◦❒ 
│◦❒ ⏱️ Temps : 40 secondes
│◦❒ 🏆 Récompense : 7 points
│◦❒ 
│◦❒ 💡 Réponds avec A, B, C ou D !
╰════════════════════════⬣`
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                startGameTimer(jid, sock, "sport", 40)
            }
            // GAME CINÉMA
            if (cleanText === "!cinema") {
                if (!jid.endsWith("@g.us")) return
                if (activeGames.has(jid)) {
                    await sock.sendMessage(jid, { text: "❌ Un jeu est déjà en cours !" }, { quoted: msg })
                    return
                }
                const questionData = getUnusedQuestion(jid, "cinema", cinemaQuestions, q => q.question)
                activeGames.set(jid, { 
                    type: "cinema", 
                    question: questionData.question, 
                    options: questionData.options,
                    correctAnswer: questionData.correct,
                    explanation: questionData.explanation,
                    attempts: 0,
                    qcmAnswers: []
                })
                const gameMsg = `╭───〔 🎬 CINÉMA 〕───⬣
│
│◦❒ Question : ${questionData.question}
│◦❒ 
│◦❒ ${questionData.options.join('\n│◦❒ ')}
│◦❒ 
│◦❒ ⏱️ Temps : 50 secondes
│◦❒ 🏆 Récompense : 8 points
│◦❒ 
│◦❒ 💡 Réponds avec A, B, C ou D !
╰════════════════════════⬣`
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                startGameTimer(jid, sock, "cinema", 50)
            }
            // GAME HISTOIRE
            if (cleanText === "!histoire") {
                if (!jid.endsWith("@g.us")) return
                if (activeGames.has(jid)) {
                    await sock.sendMessage(jid, { text: "❌ Un jeu est déjà en cours !" }, { quoted: msg })
                    return
                }
                const questionData = getUnusedQuestion(jid, "histoire", histoireQuestions, q => q.question)
                activeGames.set(jid, { 
                    type: "histoire", 
                    question: questionData.question, 
                    options: questionData.options,
                    correctAnswer: questionData.correct,
                    explanation: questionData.explanation,
                    attempts: 0,
                    qcmAnswers: []
                })
                const gameMsg = `╭───〔 📚 HISTOIRE 〕───⬣
│
│◦❒ Question : ${questionData.question}
│◦❒ 
│◦❒ ${questionData.options.join('\n│◦❒ ')}
│◦❒ 
│◦❒ ⏱️ Temps : 60 secondes
│◦❒ 🏆 Récompense : 10 points
│◦❒ 
│◦❒ 💡 Réponds avec A, B, C ou D !
╰════════════════════════⬣`
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                startGameTimer(jid, sock, "histoire", 60)
            }
            // GAME MATH
            if (cleanText === "!math") {
                if (!jid.endsWith("@g.us")) return
                if (activeGames.has(jid)) {
                    await sock.sendMessage(jid, { text: "❌ Un jeu est déjà en cours !" }, { quoted: msg })
                    return
                }
                const questionData = getUnusedQuestion(jid, "math", mathQuestions, q => q.question)
                activeGames.set(jid, { 
                    type: "math", 
                    question: questionData.question, 
                    options: questionData.options,
                    correctAnswer: questionData.correct,
                    explanation: questionData.explanation,
                    attempts: 0,
                    qcmAnswers: []
                })
                const gameMsg = `╭───〔 🔢 MATHS 〕───⬣
│
│◦❒ Question : ${questionData.question}
│◦❒ 
│◦❒ ${questionData.options.join('\n│◦❒ ')}
│◦❒ 
│◦❒ ⏱️ Temps : 35 secondes
│◦❒ 🏆 Récompense : 6 points
│◦❒ 
│◦❒ 💡 Réponds avec A, B, C ou D !
╰════════════════════════⬣`
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                startGameTimer(jid, sock, "math", 35)
            }
            // GAME LOGIQUE
            if (cleanText === "!logique") {
                if (!jid.endsWith("@g.us")) return
                if (activeGames.has(jid)) {
                    await sock.sendMessage(jid, { text: "❌ Un jeu est déjà en cours !" }, { quoted: msg })
                    return
                }
                const questionData = getUnusedQuestion(jid, "logique", logiqueQuestions, q => q.question)
                activeGames.set(jid, { 
                    type: "logique", 
                    question: questionData.question, 
                    options: questionData.options,
                    correctAnswer: questionData.correct,
                    explanation: questionData.explanation,
                    attempts: 0,
                    qcmAnswers: []
                })
                const gameMsg = `╭───〔 🧩 LOGIQUE 〕───⬣
│
│◦❒ Question : ${questionData.question}
│◦❒ 
│◦❒ ${questionData.options.join('\n│◦❒ ')}
│◦❒ 
│◦❒ ⏱️ Temps : 45 secondes
│◦❒ 🏆 Récompense : 9 points
│◦❒ 
│◦❒ 💡 Réponds avec A, B, C ou D !
╰════════════════════════⬣`
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                startGameTimer(jid, sock, "logique", 45)
            }
            // GAME CULTURE POPULAIRE
            if (cleanText === "!culturepop") {
                if (!jid.endsWith("@g.us")) return
                if (activeGames.has(jid)) {
                    await sock.sendMessage(jid, { text: "❌ Un jeu est déjà en cours !" }, { quoted: msg })
                    return
                }
                const questionData = getUnusedQuestion(jid, "culturepop", culturepopQuestions, q => q.question)
                activeGames.set(jid, { 
                    type: "culturepop", 
                    question: questionData.question, 
                    options: questionData.options,
                    correctAnswer: questionData.correct,
                    explanation: questionData.explanation,
                    attempts: 0,
                    qcmAnswers: []
                })
                const gameMsg = `╭───〔 🎭 CULTURE POP 〕───⬣
│
│◦❒ Question : ${questionData.question}
│◦❒ 
│◦❒ ${questionData.options.join('\n│◦❒ ')}
│◦❒ 
│◦❒ ⏱️ Temps : 40 secondes
│◦❒ 🏆 Récompense : 7 points
│◦❒ 
│◦❒ 💡 Réponds avec A, B, C ou D !
╰════════════════════════⬣`
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                startGameTimer(jid, sock, "culturepop", 40)
            }
            // INDICE (CORRIGÉ pour mots courts)
            if (cleanText === "!indice") {
                if (!jid.endsWith("@g.us")) return
                const game = activeGames.get(jid)
                if (!game || (game.type !== "devine" && game.type !== "monument")) {
                    await sock.sendMessage(jid, { text: "❌ Aucun jeu avec indices en cours !" }, { quoted: msg })
                    return
                }
                if (game.attempts < 2) {
                    await sock.sendMessage(jid, { text: "❌ Attend au moins 2 essais avant d'avoir un indice !" }, { quoted: msg })
                    return
                }
                if (game.hints.length >= 2) {
                    await sock.sendMessage(jid, { text: "❌ Plus d'indices disponibles !" }, { quoted: msg })
                    return
                }
                let hint = ""
                if (game.type === "monument") {
                    if (game.hints.length === 0) {
                        hint = `💡 Indice sup : ${game.indice}`
                    } else {
                        hint = `💡 Indice sup : ${game.indice2 || "Plus d'informations disponibles"}`
                    }
                } else {
                    const answer = game.answer
                    if (!answer || answer.length === 0) {
                        hint = "💡 Le mot est trop court pour un indice"
                    } else if (game.hints.length === 0) {
                        hint = `💡 Première lettre : ${answer[0].toUpperCase()}`
                    } else if (answer.length > 1) {
                        hint = `💡 Dernière lettre : ${answer[answer.length - 1]}`
                    } else {
                        hint = "💡 Le mot n'a qu'une lettre, pas d'autre indice"
                    }
                }
                game.hints.push(hint)
                const hintMsg = `╭─〔💡 INDICE SUPPLÉMENTAIRE 〕⬣
│◦❒ ${hint}
╰════════════════════════⬣`
                await sock.sendMessage(jid, { text: hintMsg }, { quoted: msg })
            }
            // JEUX RÉPONSES
            if (activeGames.has(jid) && !cleanText.startsWith("!")) {
                const game = activeGames.get(jid)
                if (game.type === "culture" || game.type === "science" || game.type === "sport" || game.type === "cinema" || game.type === "histoire" || game.type === "math" || game.type === "logique" || game.type === "culturepop") {
                    const answer = cleanText.toUpperCase().trim()
                    if (!["A", "B", "C", "D"].includes(answer)) {
                        // NOUVEAU: Feedback pour réponses incorrectes
                        await sock.sendMessage(jid, { 
                            text: `❌ @${msg.key.participant.split('@')[0]}, réponds avec A, B, C ou D !`,
                            mentions: [msg.key.participant]
                        }, { quoted: msg })
                        return
                    }
                }
                const gameStartTime = game.startTime || 0
                const currentTime = Date.now()
                const timeSinceGameStart = currentTime - gameStartTime
                if (timeSinceGameStart < 2000) {
                    return
                }
                game.attempts++
                game.lastAnswerer = msg.key.participant
                game.lastAnswerTime = currentTime
                let correct = false
                if (game.type === "country" || game.type === "capitale") {
                    correct = cleanText.toLowerCase() === game.answer.toLowerCase()
                } else if (game.type === "vraioufaux") {
                    const answer = text.toLowerCase()
                    correct = (answer === "vrai" && game.answer) || (answer === "faux" && !game.answer)
                } else if (game.type === "devine") {
                    correct = cleanText.toLowerCase() === game.answer.toLowerCase()
                } else if (game.type === "culture" || game.type === "science" || game.type === "sport" || game.type === "cinema" || game.type === "histoire" || game.type === "math" || game.type === "logique" || game.type === "culturepop") {
                    const answer = cleanText.toUpperCase().trim()
                    if (!game.qcmAnswers) {
                        game.qcmAnswers = []
                    }
                    game.qcmAnswers.push({ user: msg.key.participant, answer: answer, time: Date.now() })
                    const userAnswers = game.qcmAnswers.filter(a => a.user === msg.key.participant)
                    // Cooldown de réponse désactivé
                    // if (userAnswers.length > 1) {
                    //     const lastAnswerTime = userAnswers[userAnswers.length - 2].time
                    //     const timeDiff = Date.now() - lastAnswerTime
                    //     if (timeDiff < 2000) {
                    //         await sock.sendMessage(jid, { 
                    //             text: `⏱️ @${msg.key.participant.split('@')[0]} : Attends 2 secondes avant de répondre à nouveau !`,
                    //             mentions: [msg.key.participant]
                    //         }, { quoted: msg })
                    //         return
                    //     }
                    // }
                    correct = answer === game.correctAnswer
                } else if (game.type === "drapeau" || game.type === "monument") {
                    correct = cleanText.toLowerCase() === game.answer.toLowerCase()
                } else if (game.type === "anime" || game.type === "manga" || game.type === "personnage" || game.type === "opening" || game.type === "seiyuu") {
                    const normalizedAnswer = normalizeAccents(cleanText.toLowerCase().trim())
                    const normalizedCorrect = normalizeAccents(game.answer.toLowerCase())
                    const normalizedAlternatives = game.alternatives ? game.alternatives.map(alt => normalizeAccents(alt.toLowerCase())) : []
                    correct = normalizedAnswer === normalizedCorrect || normalizedAlternatives.includes(normalizedAnswer)
                }
                if (correct) {
                    let winnerMsg = ""
                    const winnerId = msg.key.participant
                    const winner = winnerId.split('@')[0]
                    let points = 0
                    if (game.type === "country") {
                        points = 10
                    } else if (game.type === "capitale") {
                        points = 10
                    } else if (game.type === "vraioufaux") {
                        points = 5
                    } else if (game.type === "devine") {
                        points = 8
                    } else if (game.type === "culture") {
                        points = 12
                    } else if (game.type === "drapeau") {
                        points = 8
                    } else if (game.type === "monument") {
                        points = 9
                    } else if (game.type === "science") {
                        points = 11
                    } else if (game.type === "sport") {
                        points = 7
                    } else if (game.type === "cinema") {
                        points = 8
                    } else if (game.type === "histoire") {
                        points = 10
                    } else if (game.type === "math") {
                        points = 6
                    } else if (game.type === "logique") {
                        points = 9
                    } else if (game.type === "culturepop") {
                        points = 7
                    } else if (game.type === "anime") {
                        points = 8
                    } else if (game.type === "manga") {
                        points = 8
                    } else if (game.type === "personnage") {
                        points = 7
                    } else if (game.type === "opening") {
                        points = 6
                    } else if (game.type === "seiyuu") {
                        points = 9
                    }
                    addScore(winnerId, points, jid)
                    const groupScores = scores.get(jid) || new Map()
                    const userScore = groupScores.get(winnerId) || { total: 0, games: 0 }
                    winnerMsg = `╭───〔  🏆 GAGNANT 〕───⬣
│◦❒ 👑 @${winner}
│◦❒ 
│◦❒ Bravo ! Bonne réponse : ${game.answer || game.correctAnswer}
│◦❒ ${game.explanation || ""}
│◦❒ 
│◦❒ +${points} points 🎉
│◦❒ Total : ${userScore.total} points (${userScore.games} jeux)
╰════════════════════════⬣`
                    await sock.sendMessage(jid, {
                        text: winnerMsg,
                        mentions: [winnerId]
                    }, { quoted: msg })
                    activeGames.delete(jid)
                    if (usedQuestions.has(jid)) {
                        const groupQuestions = usedQuestions.get(jid)
                        if (game && groupQuestions[game.type]) {
                            groupQuestions[game.type] = []
                        }
                    }
                    if (gameTimers.has(jid)) {
                        clearTimeout(gameTimers.get(jid))
                        gameTimers.delete(jid)
                        gameTimers.delete(jid + '_type')
                    }
                } else if (game.attempts >= 5 || (game.type === "culture" || game.type === "science" || game.type === "sport" || game.type === "cinema" || game.type === "histoire" || game.type === "math" || game.type === "logique" || game.type === "culturepop") && game.attempts >= 2) {
                    let answerText = ""
                    if (game.type === "vraioufaux") {
                        answerText = game.answer ? "VRAI" : "FAUX"
                    } else if (game.type === "culture" || game.type === "science" || game.type === "sport" || game.type === "cinema" || game.type === "histoire" || game.type === "math" || game.type === "logique" || game.type === "culturepop") {
                        answerText = game.correctAnswer || game.answer || "Réponse non disponible"
                    } else {
                        answerText = game.answer || "Réponse non disponible"
                    }
                    let loseMsg = (game.type === "culture" || game.type === "science" || game.type === "sport" || game.type === "cinema" || game.type === "histoire" || game.type === "math" || game.type === "logique" || game.type === "culturepop") ? 
                        `❌ Perdu ! Seulement 2 essais autorisés pour les QCM !\n\n🎯 La bonne réponse était : ${answerText}` :
                        `❌ Perdu ! La réponse était : ${answerText}`
                    await sock.sendMessage(jid, { text: loseMsg }, { quoted: msg })
                    activeGames.delete(jid)
                    if (usedQuestions.has(jid)) {
                        const groupQuestions = usedQuestions.get(jid)
                        if (game && groupQuestions[game.type]) {
                            groupQuestions[game.type] = []
                        }
                    }
                    if (gameTimers.has(jid)) {
                        clearTimeout(gameTimers.get(jid))
                        gameTimers.delete(jid)
                        gameTimers.delete(jid + '_type')
                    }
                } else if (game.type === "culture" || game.type === "science" || game.type === "sport" || game.type === "cinema" || game.type === "histoire" || game.type === "math" || game.type === "logique" || game.type === "culturepop") {
                    // NOUVEAU: Feedback pour réponse incorrecte (SEULEMENT pour les QCM)
                    await sock.sendMessage(jid, { 
                        text: `❌ @${msg.key.participant.split('@')[0]}, ce n'est pas la bonne réponse. Il te reste ${game.attempts >= 2 ? "1" : "2"} essai(s) !`,
                        mentions: [msg.key.participant]
                    }, { quoted: msg })
                } else if (game.type === "anime" || game.type === "manga" || game.type === "personnage" || game.type === "opening" || game.type === "seiyuu") {
                    // RÉPONSE FAUSSE pour les jeux Otaku - Réagir avec ❌
                    if (game.attempts < 3) {
                        try {
                            await sock.sendMessage(jid, { 
                                react: { key: msg.key, text: "❌" }
                            })
                        } catch (reactError) {
                            // Si la réaction échoue, envoyer un message
                            await sock.sendMessage(jid, { 
                                text: `❌ @${msg.key.participant.split('@')[0]}, ce n'est pas la bonne réponse. Il te reste ${game.attempts >= 2 ? "1" : "2"} essai(s) !`,
                                mentions: [msg.key.participant]
                            }, { quoted: msg })
                        }
                    }
                }
                // Pour les autres jeux (devine, country, etc.), on ignore silencieusement les réponses incorrectes
            }
            // JEUX OTAKUS - ANIME
            if (cleanText === "!anime") {
                if (!jid.endsWith("@g.us")) return
                if (activeGames.has(jid)) {
                    await sock.sendMessage(jid, { text: "❌ Un jeu est déjà en cours !" }, { quoted: msg })
                    return
                }
                const questionData = getUnusedQuestion(jid, "anime", animeQuestions, q => q.question)
                activeGames.set(jid, { 
                    type: "anime", 
                    question: questionData.question, 
                    answer: questionData.answer,
                    alternatives: questionData.alternatives,
                    attempts: 0 
                })
                const gameMsg = `╭───〔 🎌 ANIME QUIZ 〕───⬣
│
│◦❒ Question : ${questionData.question}
│◦❒ 
│◦❒ ⏱️ Temps : 45 secondes
│◦❒ 🏆 Récompense : 8 points
│◦❒ 
│◦❒ 💡 Écris le nom de l'anime !
╰════════════════════════⬣`
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                startGameTimer(jid, sock, "anime", 45)
            }
            // JEUX OTAKUS - MANGA
            if (cleanText === "!manga") {
                if (!jid.endsWith("@g.us")) return
                if (activeGames.has(jid)) {
                    await sock.sendMessage(jid, { text: "❌ Un jeu est déjà en cours !" }, { quoted: msg })
                    return
                }
                const questionData = getUnusedQuestion(jid, "manga", mangaQuestions, q => q.question)
                activeGames.set(jid, { 
                    type: "manga", 
                    question: questionData.question, 
                    answer: questionData.answer,
                    alternatives: questionData.alternatives,
                    attempts: 0 
                })
                const gameMsg = `╭───〔 📖 MANGA QUIZ 〕───⬣
│
│◦❒ Question : ${questionData.question}
│◦❒ 
│◦❒ ⏱️ Temps : 45 secondes
│◦❒ 🏆 Récompense : 8 points
│◦❒ 
│◦❒ 💡 Écris le nom du manga !
╰════════════════════════⬣`
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                startGameTimer(jid, sock, "manga", 45)
            }
            // JEUX OTAKUS - PERSONNAGE
            if (cleanText === "!personnage") {
                if (!jid.endsWith("@g.us")) return
                if (activeGames.has(jid)) {
                    await sock.sendMessage(jid, { text: "❌ Un jeu est déjà en cours !" }, { quoted: msg })
                    return
                }
                const questionData = getUnusedQuestion(jid, "personnage", personnageQuestions, q => q.question)
                activeGames.set(jid, { 
                    type: "personnage", 
                    question: questionData.question, 
                    answer: questionData.answer,
                    alternatives: questionData.alternatives,
                    attempts: 0 
                })
                const gameMsg = `╭───〔 👤 PERSONNAGE QUIZ 〕───⬣
│
│◦❒ Question : ${questionData.question}
│◦❒ 
│◦❒ ⏱️ Temps : 40 secondes
│◦❒ 🏆 Récompense : 7 points
│◦❒ 
│◦❒ 💡 Écris le nom du personnage !
╰════════════════════════⬣`
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                startGameTimer(jid, sock, "personnage", 40)
            }
            // JEUX OTAKUS - OPENING
            if (cleanText === "!opening") {
                if (!jid.endsWith("@g.us")) return
                if (activeGames.has(jid)) {
                    await sock.sendMessage(jid, { text: "❌ Un jeu est déjà en cours !" }, { quoted: msg })
                    return
                }
                const questionData = getUnusedQuestion(jid, "opening", openingQuestions, q => q.question)
                activeGames.set(jid, { 
                    type: "opening", 
                    question: questionData.question, 
                    answer: questionData.answer,
                    alternatives: questionData.alternatives,
                    attempts: 0 
                })
                const gameMsg = `╭───〔 🎵 OPENING QUIZ 〕───⬣
│
│◦❒ Question : ${questionData.question}
│◦❒ 
│◦❒ ⏱️ Temps : 35 secondes
│◦❒ 🏆 Récompense : 6 points
│◦❒ 
│◦❒ 💡 Devine l'anime de cet opening !
╰════════════════════════⬣`
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                startGameTimer(jid, sock, "opening", 35)
            }
            // JEUX OTAKUS - SEIYUU
            if (cleanText === "!seiyuu") {
                if (!jid.endsWith("@g.us")) return
                if (activeGames.has(jid)) {
                    await sock.sendMessage(jid, { text: "❌ Un jeu est déjà en cours !" }, { quoted: msg })
                    return
                }
                const questionData = getUnusedQuestion(jid, "seiyuu", seiyuuQuestions, q => q.question)
                activeGames.set(jid, { 
                    type: "seiyuu", 
                    question: questionData.question, 
                    answer: questionData.answer,
                    alternatives: questionData.alternatives,
                    attempts: 0 
                })
                const gameMsg = `╭───〔 🎙️ SEIYUU QUIZ 〕───⬣
│
│◦❒ Question : ${questionData.question}
│◦❒ 
│◦❒ ⏱️ Temps : 50 secondes
│◦❒ 🏆 Récompense : 9 points
│◦❒ 
│◦❒ 💡 Écris le nom du seiyuu !
╰════════════════════════⬣`
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                startGameTimer(jid, sock, "seiyuu", 50)
            }
            // JEUX ALÉATOIRES
            if (cleanText === "!jeu") {
                if (!jid.endsWith("@g.us")) return
                if (activeGames.has(jid)) {
                    await sock.sendMessage(jid, { text: "❌ Un jeu est déjà en cours !" }, { quoted: msg })
                    return
                }
                const gameTypes = ["country", "vraioufaux", "capitale", "devine", "culture", "drapeau", "monument", "science", "sport", "cinema", "histoire", "math", "logique", "culturepop"]
                const randomType = gameTypes[Math.floor(Math.random() * gameTypes.length)]
                if (randomType === "country") {
                    const country = getUnusedQuestion(jid, "country", countries, c => c.name)
                    activeGames.set(jid, { type: "country", answer: country.name, attempts: 0 })
                    const gameMsg = `╭───〔  🌍 DEVINE LE PAYS 〕───⬣
│◦❒ 🎲 Jeu aléatoire : Pays !
│◦❒ 
│◦❒ 💡 Indice : ${country.indice}
│◦❒ 🔤 Lettres : ${country.name.charAt(0)}${"_".repeat(country.name.length - 1)} (${country.name.length} lettres)
│◦❒ 
│◦❒ ⏱️ Temps : 75 secondes
│◦❒ 🏆 Récompense : 10 points
│◦❒ 
│◦❒ Écris le nom du pays pour gagner !
╰════════════════════════⬣`
                    await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                    startGameTimer(jid, sock, "country", 75)
                } else if (randomType === "vraioufaux") {
                    const question = getUnusedQuestion(jid, "vraioufaux", trueFalseQuestions, q => q.question)
                    activeGames.set(jid, { type: "vraioufaux", answer: question.answer, explanation: question.explanation, attempts: 0 })
                    const gameMsg = `╭───〔  ❓ VRAI OU FAUX 〕───⬣
│◦❒ 🎲 Jeu aléatoire : Vrai ou Faux !
│◦❒ 
│◦❒ 💭 Question : ${question.question}
│◦❒ 
│◦❒ ⏱️ Temps : 25 secondes
│◦❒ 🏆 Récompense : 5 points
│◦❒ 
│◦❒ Réponds par "vrai" ou "faux" pour gagner !
╰════════════════════════⬣`
                    await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                    startGameTimer(jid, sock, "vraioufaux", 25)
                } else if (randomType === "capitale") {
                    const country = getUnusedQuestion(jid, "capitale", countries, c => c.capitale)
                    activeGames.set(jid, { type: "capitale", answer: country.capitale, attempts: 0 })
                    const gameMsg = `╭───〔  🏛️ DEVINE LA CAPITALE 〕───⬣
│◦❒ 🎲 Jeu aléatoire : Capitale !
│◦❒ 
│◦❒ 🌍 Pays : ${country.name}
│◦❒ 💡 Indice : ${country.indice}
│◦❒ 🔤 Lettres : ${country.capitale.charAt(0)}${"_".repeat(country.capitale.length - 1)} (${country.capitale.length} lettres)
│◦❒ 
│◦❒ ⏱️ Temps : 75 secondes
│◦❒ 🏆 Récompense : 10 points
│◦❒ 
│◦❒ Écris le nom de la capitale pour gagner !
╰════════════════════════⬣`
                    await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                    startGameTimer(jid, sock, "capitale", 75)
                } else if (randomType === "devine") {
                    const wordObj = getUnusedQuestion(jid, "devine", devineWords, w => w.answer || w)
                    const answer = typeof wordObj === 'object' ? wordObj.answer : wordObj
                    const hint = typeof wordObj === 'object' ? wordObj.hint : "Pas d'indice"
                    activeGames.set(jid, { type: "devine", answer: answer, attempts: 0, hints: [], wordObj: wordObj })
                    const gameMsg = `╭───〔  🔮 DEVINE LE MOT 〕───⬣
│◦❒ 🎲 Jeu aléatoire : Devine le mot !
│◦❒ 
│◦❒ 🔤 Mot à deviner : ${"_".repeat(answer.length).split("").join(" ")} (${answer.length} lettres)
│◦❒ 💡 Indice : ${hint}
│◦❒ 
│◦❒ ⏱️ Temps : 45 secondes
│◦❒ 🏆 Récompense : 8 points
│◦❒ 
│◦❒ 💡 Tape "!indice" pour un indice supplémentaire
│◦❒ Écris le mot pour gagner !
╰════════════════════════⬣`
                    await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                    startGameTimer(jid, sock, "devine", 45)
                } else if (randomType === "culture") {
                    const questionData = getUnusedQuestion(jid, "culture", cultureQuestions, q => q.question)
                    activeGames.set(jid, { 
                        type: "culture", 
                        question: questionData.question, 
                        options: questionData.options,
                        correctAnswer: questionData.correct,
                        explanation: questionData.explanation,
                        attempts: 0,
                        qcmAnswers: []
                    })
                    const gameMsg = `╭───〔  🎓 CULTURE GÉNÉRALE 〕───⬣
│◦❒ 🎲 Jeu aléatoire : Culture Générale !
│◦❒ 
│◦❒ ${questionData.question}
│◦❒ 
│◦❒ ${questionData.options.join('\n│◦❒ ')}
│◦❒ 
│◦❒ ⏱️ Temps : 60 secondes
│◦❒ 🏆 Récompense : 12 points
│◦❒ 
│◦❒ Réponds avec A, B, C ou D pour gagner !
╰════════════════════════⬣`
                    await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                    startGameTimer(jid, sock, "culture", 60)
                } else if (randomType === "drapeau") {
                    const drapeauData = getUnusedQuestion(jid, "drapeau", drapeauQuestions, d => d.name)
                    activeGames.set(jid, { 
                        type: "drapeau", 
                        answer: drapeauData.name, 
                        description: drapeauData.description,
                        attempts: 0 
                    })
                    const gameMsg = `╭───〔  🏁 DRAPEAUX 〕───⬣
│◦❒ 🎲 Jeu aléatoire : Drapeaux !
│◦❒ 
│◦❒ Devine le pays avec ce drapeau :
│◦❒ 
│◦❒ ${drapeauData.description}
│◦❒ 
│◦❒ ⏱️ Temps : 50 secondes
│◦❒ 🏆 Récompense : 8 points
│◦❒ 
│◦❒ Écris le nom du pays pour gagner !
╰════════════════════════⬣`
                    await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                    startGameTimer(jid, sock, "drapeau", 50)
                } else if (randomType === "monument") {
                    const monumentData = getUnusedQuestion(jid, "monument", monumentQuestions, m => m.name)
                    activeGames.set(jid, { 
                        type: "monument", 
                        answer: monumentData.name, 
                        description: monumentData.description,
                        indice: monumentData.indice,
                        indice2: monumentData.indice2,
                        pays: monumentData.pays,
                        attempts: 0,
                        hints: []
                    })
                    const gameMsg = `╭───〔  🏛️ MONUMENTS 〕───⬣
│◦❒ 🎲 Jeu aléatoire : Monuments !
│◦❒ 
│◦❒ Devine le monument :
│◦❒ 
│◦❒ ${monumentData.description}
│◦❒ 
│◦❒ ⏱️ Temps : 55 secondes
│◦❒ 🏆 Récompense : 9 points
│◦❒ 
│◦❒ 💡 Tape "!indice" pour un indice supplémentaire
│◦❒ Écris le nom du monument pour gagner !
╰════════════════════════⬣`
                    await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                    startGameTimer(jid, sock, "monument", 55)
                } else if (randomType === "science") {
                    const questionData = getUnusedQuestion(jid, "science", scienceQuestions, q => q.question)
                    activeGames.set(jid, { 
                        type: "science", 
                        question: questionData.question, 
                        options: questionData.options,
                        correctAnswer: questionData.correct,
                        explanation: questionData.explanation,
                        attempts: 0,
                        qcmAnswers: []
                    })
                    const gameMsg = `╭───〔  🔬 SCIENCE 〕───⬣
│◦❒ 🎲 Jeu aléatoire : Science !
│◦❒ 
│◦❒ ${questionData.question}
│◦❒ 
│◦❒ ${questionData.options.join('\n│◦❒ ')}
│◦❒ 
│◦❒ ⏱️ Temps : 45 secondes
│◦❒ 🏆 Récompense : 11 points
│◦❒ 
│◦❒ Réponds avec A, B, C ou D pour gagner !
╰════════════════════════⬣`
                    await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                    startGameTimer(jid, sock, "science", 45)
                } else if (randomType === "sport") {
                    const questionData = getUnusedQuestion(jid, "sport", sportQuestions, q => q.question)
                    activeGames.set(jid, { 
                        type: "sport", 
                        question: questionData.question, 
                        options: questionData.options,
                        correctAnswer: questionData.correct,
                        explanation: questionData.explanation,
                        attempts: 0,
                        qcmAnswers: []
                    })
                    const gameMsg = `╭───〔  ⚽ SPORT 〕───⬣
│◦❒ 🎲 Jeu aléatoire : Sport !
│◦❒ 
│◦❒ ${questionData.question}
│◦❒ 
│◦❒ ${questionData.options.join('\n│◦❒ ')}
│◦❒ 
│◦❒ ⏱️ Temps : 40 secondes
│◦❒ 🏆 Récompense : 7 points
│◦❒ 
│◦❒ Réponds avec A, B, C ou D pour gagner !
╰════════════════════════⬣`
                    await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                    startGameTimer(jid, sock, "sport", 40)
                } else if (randomType === "cinema") {
                    const questionData = getUnusedQuestion(jid, "cinema", cinemaQuestions, q => q.question)
                    activeGames.set(jid, { 
                        type: "cinema", 
                        question: questionData.question, 
                        options: questionData.options,
                        correctAnswer: questionData.correct,
                        explanation: questionData.explanation,
                        attempts: 0,
                        qcmAnswers: []
                    })
                    const gameMsg = `╭───〔  🎬 CINÉMA 〕───⬣
│◦❒ 🎲 Jeu aléatoire : Cinéma !
│◦❒ 
│◦❒ ${questionData.question}
│◦❒ 
│◦❒ ${questionData.options.join('\n│◦❒ ')}
│◦❒ 
│◦❒ ⏱️ Temps : 50 secondes
│◦❒ 🏆 Récompense : 8 points
│◦❒ 
│◦❒ Réponds avec A, B, C ou D pour gagner !
╰════════════════════════⬣`
                    await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                    startGameTimer(jid, sock, "cinema", 50)
                } else if (randomType === "histoire") {
                    const questionData = getUnusedQuestion(jid, "histoire", histoireQuestions, q => q.question)
                    activeGames.set(jid, { 
                        type: "histoire", 
                        question: questionData.question, 
                        options: questionData.options,
                        correctAnswer: questionData.correct,
                        explanation: questionData.explanation,
                        attempts: 0,
                        qcmAnswers: []
                    })
                    const gameMsg = `╭───〔  📚 HISTOIRE 〕───⬣
│◦❒ 🎲 Jeu aléatoire : Histoire !
│◦❒ 
│◦❒ ${questionData.question}
│◦❒ 
│◦❒ ${questionData.options.join('\n│◦❒ ')}
│◦❒ 
│◦❒ ⏱️ Temps : 60 secondes
│◦❒ 🏆 Récompense : 10 points
│◦❒ 
│◦❒ Réponds avec A, B, C ou D pour gagner !
╰════════════════════════⬣`
                    await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                    startGameTimer(jid, sock, "histoire", 60)
                } else if (randomType === "math") {
                    const questionData = getUnusedQuestion(jid, "math", mathQuestions, q => q.question)
                    activeGames.set(jid, { 
                        type: "math", 
                        question: questionData.question, 
                        options: questionData.options,
                        correctAnswer: questionData.correct,
                        explanation: questionData.explanation,
                        attempts: 0,
                        qcmAnswers: []
                    })
                    const gameMsg = `╭───〔  🔢 MATHS 〕───⬣
│◦❒ 🎲 Jeu aléatoire : Mathématiques !
│◦❒ 
│◦❒ ${questionData.question}
│◦❒ 
│◦❒ ${questionData.options.join('\n│◦❒ ')}
│◦❒ 
│◦❒ ⏱️ Temps : 35 secondes
│◦❒ 🏆 Récompense : 6 points
│◦❒ 
│◦❒ Réponds avec A, B, C ou D pour gagner !
╰════════════════════════⬣`
                    await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                    startGameTimer(jid, sock, "math", 35)
                } else if (randomType === "logique") {
                    const questionData = getUnusedQuestion(jid, "logique", logiqueQuestions, q => q.question)
                    activeGames.set(jid, { 
                        type: "logique", 
                        question: questionData.question, 
                        options: questionData.options,
                        correctAnswer: questionData.correct,
                        explanation: questionData.explanation,
                        attempts: 0,
                        qcmAnswers: []
                    })
                    const gameMsg = `╭───〔  🧩 LOGIQUE 〕───⬣
│◦❒ 🎲 Jeu aléatoire : Logique !
│◦❒ 
│◦❒ ${questionData.question}
│◦❒ 
│◦❒ ${questionData.options.join('\n│◦❒ ')}
│◦❒ 
│◦❒ ⏱️ Temps : 45 secondes
│◦❒ 🏆 Récompense : 9 points
│◦❒ 
│◦❒ Réponds avec A, B, C ou D pour gagner !
╰════════════════════════⬣`
                    await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                    startGameTimer(jid, sock, "logique", 45)
                } else if (randomType === "culturepop") {
                    const questionData = getUnusedQuestion(jid, "culturepop", culturepopQuestions, q => q.question)
                    activeGames.set(jid, { 
                        type: "culturepop", 
                        question: questionData.question, 
                        options: questionData.options,
                        correctAnswer: questionData.correct,
                        explanation: questionData.explanation,
                        attempts: 0,
                        qcmAnswers: []
                    })
                    const gameMsg = `╭───〔  🎭 CULTURE POP 〕───⬣
│◦❒ 🎲 Jeu aléatoire : Culture Populaire !
│◦❒ 
│◦❒ ${questionData.question}
│◦❒ 
│◦❒ ${questionData.options.join('\n│◦❒ ')}
│◦❒ 
│◦❒ ⏱️ Temps : 40 secondes
│◦❒ 🏆 Récompense : 7 points
│◦❒ 
│◦❒ Réponds avec A, B, C ou D pour gagner !
╰════════════════════════⬣`
                    await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                    startGameTimer(jid, sock, "culturepop", 40)
                }
            }
            // JEUX OTAKUS ALÉATOIRES
            if (cleanText === "!otaku") {
                if (!jid.endsWith("@g.us")) return
                if (activeGames.has(jid)) {
                    await sock.sendMessage(jid, { text: "❌ Un jeu est déjà en cours !" }, { quoted: msg })
                    return
                }
                const randomType = otakuGameTypes[Math.floor(Math.random() * otakuGameTypes.length)]
                if (randomType === "anime") {
                    const questionData = getUnusedQuestion(jid, "anime", animeQuestions, q => q.question)
                    activeGames.set(jid, { 
                        type: "anime", 
                        question: questionData.question, 
                        answer: questionData.answer,
                        alternatives: questionData.alternatives,
                        attempts: 0 
                    })
                    const gameMsg = `╭───〔  🎌 OTAKU GAME 〕───⬣
│◦❒ 🎲 Jeu otaku aléatoire : Anime !
│◦❒ 
│◦❒ ${questionData.question}
│◦❒ 
│◦❒ ⏱️ Temps : 45 secondes
│◦❒ 🏆 Récompense : 8 points
│◦❒ 
│◦❒ Écris le nom de l'anime pour gagner !
╰════════════════════════⬣`
                    await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                    startGameTimer(jid, sock, "anime", 45)
                } else if (randomType === "manga") {
                    const questionData = getUnusedQuestion(jid, "manga", mangaQuestions, q => q.question)
                    activeGames.set(jid, { 
                        type: "manga", 
                        question: questionData.question, 
                        answer: questionData.answer,
                        alternatives: questionData.alternatives,
                        attempts: 0 
                    })
                    const gameMsg = `╭───〔  🎌 OTAKU GAME 〕───⬣
│◦❒ 🎲 Jeu otaku aléatoire : Manga !
│◦❒ 
│◦❒ ${questionData.question}
│◦❒ 
│◦❒ ⏱️ Temps : 45 secondes
│◦❒ 🏆 Récompense : 8 points
│◦❒ 
│◦❒ Écris le nom du manga pour gagner !
╰════════════════════════⬣`
                    await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                    startGameTimer(jid, sock, "manga", 45)
                } else if (randomType === "personnage") {
                    const questionData = getUnusedQuestion(jid, "personnage", personnageQuestions, q => q.question)
                    activeGames.set(jid, { 
                        type: "personnage", 
                        question: questionData.question, 
                        answer: questionData.answer,
                        alternatives: questionData.alternatives,
                        attempts: 0 
                    })
                    const gameMsg = `╭───〔  🎌 OTAKU GAME 〕───⬣
│◦❒ 🎲 Jeu otaku aléatoire : Personnage !
│◦❒ 
│◦❒ ${questionData.question}
│◦❒ 
│◦❒ ⏱️ Temps : 40 secondes
│◦❒ 🏆 Récompense : 7 points
│◦❒ 
│◦❒ Écris le nom du personnage pour gagner !
╰════════════════════════⬣`
                    await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                    startGameTimer(jid, sock, "personnage", 40)
                } else if (randomType === "opening") {
                    const questionData = getUnusedQuestion(jid, "opening", openingQuestions, q => q.question)
                    activeGames.set(jid, { 
                        type: "opening", 
                        question: questionData.question, 
                        answer: questionData.answer,
                        alternatives: questionData.alternatives,
                        attempts: 0 
                    })
                    const gameMsg = `╭───〔  🎌 OTAKU GAME 〕───⬣
│◦❒ 🎲 Jeu otaku aléatoire : Opening !
│◦❒ 
│◦❒ ${questionData.question}
│◦❒ 
│◦❒ ⏱️ Temps : 35 secondes
│◦❒ 🏆 Récompense : 6 points
│◦❒ 
│◦❒ Devine l'anime de cet opening !
╰════════════════════════⬣`
                    await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                    startGameTimer(jid, sock, "opening", 35)
                } else if (randomType === "seiyuu") {
                    const questionData = getUnusedQuestion(jid, "seiyuu", seiyuuQuestions, q => q.question)
                    activeGames.set(jid, { 
                        type: "seiyuu", 
                        question: questionData.question, 
                        answer: questionData.answer,
                        alternatives: questionData.alternatives,
                        attempts: 0 
                    })
                    const gameMsg = `╭───〔  🎌 OTAKU GAME 〕───⬣
│◦❒ 🎲 Jeu otaku aléatoire : Seiyuu !
│◦❒ 
│◦❒ ${questionData.question}
│◦❒ 
│◦❒ ⏱️ Temps : 50 secondes
│◦❒ 🏆 Récompense : 9 points
│◦❒ 
│◦❒ Écris le nom du seiyuu pour gagner !
╰════════════════════════⬣`
                    await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                    startGameTimer(jid, sock, "seiyuu", 50)
                }
            }
            // DÉBAT
            if (cleanText === "!debat") {
                if (!jid.endsWith("@g.us")) return
                const topic = getUnusedQuestion(jid, "debat", debateTopics, t => t)
                const debateMsg = `╭───〔  🗣️ DÉBAT 〕───⬣
│◦❒ Sujet : ${topic}
│◦❒ 
│◦❒ Donnez votre avis !
│◦❒ 
╰════════════════════════⬣`
                await sock.sendMessage(jid, { text: debateMsg }, { quoted: msg })
            }
            // ROLL
            if (cleanText.startsWith("!roll")) {
                if (!jid.endsWith("@g.us")) return
                let maxNumber = 100
                let customMessage = ""
                const args = cleanText.slice(6).trim()
                if (args) {
                    const parsedArgs = args.split(" ")
                    if (parsedArgs.length >= 1 && !isNaN(parsedArgs[0])) {
                        maxNumber = parseInt(parsedArgs[0])
                        if (maxNumber > 1000) maxNumber = 1000 // Limité à 1000
                        if (maxNumber < 1) maxNumber = 1
                    }
                    if (parsedArgs.length >= 2) {
                        customMessage = parsedArgs.slice(1).join(" ")
                    }
                }
                const roll = Math.floor(Math.random() * maxNumber) + 1
                let messageReaction = ""
                let emojiReaction = ""
                if (maxNumber === 100) {
                    if (roll >= 95) {
                        messageReaction = "🎉 LÉGENDAIRE ! Tu as touché le jackpot !"
                        emojiReaction = "🎰"
                    } else if (roll >= 80) {
                        messageReaction = "✨ Exceptionnel ! C'est un super score !"
                        emojiReaction = "💎"
                    } else if (roll >= 60) {
                        messageReaction = "👍 Très bien ! Au-dessus de la moyenne !"
                        emojiReaction = "🌟"
                    } else if (roll >= 40) {
                        messageReaction = "😐 Pas mal ! Dans la moyenne !"
                        emojiReaction = "📊"
                    } else if (roll >= 20) {
                        messageReaction = "😅 Peut mieux faire ! En dessous de la moyenne !"
                        emojiReaction = "📉"
                    } else {
                        messageReaction = "😬 Oh là... C'est vraiment pas de chance !"
                        emojiReaction = "💀"
                    }
                } else {
                    if (roll === maxNumber) {
                        messageReaction = `🎯 PARFAIT ! Maximum possible sur ${maxNumber} !`
                        emojiReaction = "🏆"
                    } else if (roll >= maxNumber * 0.9) {
                        messageReaction = `🔥 EXCELLENT ! Presque le maximum !`
                        emojiReaction = "⭐"
                    } else if (roll >= maxNumber * 0.7) {
                        messageReaction = `💪 SOLIDE ! Bonne performance !`
                        emojiReaction = "💪"
                    } else if (roll >= maxNumber * 0.4) {
                        messageReaction = `📊 MOYEN ! Dans la norme !`
                        emojiReaction = "📊"
                    } else {
                        messageReaction = `📈 FAIBLE ! Peut mieux faire !`
                        emojiReaction = "📈"
                    }
                }
                const rollMsg = `╭───〔  🎲 LANCER DE DÉ 〕───⬣
│◦❒ ${emojiReaction} Résultat : ${roll}/${maxNumber}
│◦❒ 📊 Pourcentage : ${Math.round((roll/maxNumber) * 100)}%
│◦❒ 
│◦❒ ${messageReaction}
${customMessage ? `│◦❒ 💬 Message perso : ${customMessage}` : ""}
╰════════════════════════⬣`
                await sock.sendMessage(jid, { text: rollMsg }, { quoted: msg })
            }
            // 8BALL
            if (cleanText.startsWith("!8ball ")) {
                if (!jid.endsWith("@g.us")) return
                const question = cleanText.slice(7).trim()
                if (!question) {
                    await sock.sendMessage(jid, { text: "❌ Usage: !8ball [question]" }, { quoted: msg })
                    return
                }
                const responses = [
                    "Oui, définitivement !",
                    "Sans aucun doute !",
                    "Oui, probablement !",
                    "Les perspectives sont bonnes !",
                    "Signes pointent vers oui !",
                    "Demande à nouveau plus tard !",
                    "Mieux vaut ne pas te le dire maintenant !",
                    "Je ne peux pas prédire maintenant !",
                    "Ne compte pas dessus !",
                    "Ma réponse est non !",
                    "Mes sources disent non !",
                    "Très douteux !",
                    "Perspectives ne sont pas bonnes !"
                ]
                const response = responses[Math.floor(Math.random() * responses.length)]
                const ballMsg = `╭───〔  🔮 MAGIC 8 BALL 〕───⬣
│◦❒ Question : ${question}
│◦❒ 
│◦❒ Réponse : ${response}
╰════════════════════════⬣`
                await sock.sendMessage(jid, { text: ballMsg }, { quoted: msg })
            }
            // SCORES
            if (cleanText === "!scores") {
                if (!jid.endsWith("@g.us")) return
                const groupScores = scores.get(jid) || new Map()
                const topScores = Array.from(groupScores.entries())
                    .map(([userId, scoreData]) => ({ 
                        userId, 
                        username: userId.split('@')[0], 
                        ...scoreData
                    }))
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 10)
                let scoreMsg = "╭───〔  🏆 CLASSEMENT 〕───⬣\n"
                if (topScores.length === 0) {
                    scoreMsg += "│◦❒ Aucun score enregistré dans ce groupe\n"
                } else {
                    topScores.forEach((score, i) => {
                        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🏅"
                        scoreMsg += `│◦❒ ${medal} @${score.username} : ${score.total} points (${score.games} jeux)\n`
                    })
                }
                scoreMsg += "╰════════════════════════⬣"
                const mentions = topScores.map(s => s.userId)
                await sock.sendMessage(jid, {
                    text: scoreMsg,
                    mentions: mentions
                }, { quoted: msg })
            }
            // SHIP
            if (cleanText.startsWith("!ship ")) {
                if (!jid.endsWith("@g.us")) return
                const mentionedJids = msg.message.extendedTextMessage?.contextInfo?.mentionedJid
                if (!mentionedJids || mentionedJids.length < 2) {
                    await sock.sendMessage(jid, { text: "❌ Usage: !ship @user1 @user2" }, { quoted: msg })
                    return
                }
                const user1 = mentionedJids[0].split("@")[0]
                const user2 = mentionedJids[1].split("@")[0]
                const factors = [
                    user1.length * user2.length,
                    user1.charCodeAt(0) + user2.charCodeAt(0),
                    new Date().getHours(),
                    Math.floor(Math.random() * 30)
                ]
                const compatibility = Math.min(99, Math.floor(factors.reduce((a, b) => a + b, 0) % 100))
                const compatLevel = getCompatibilityMessage(compatibility)
                const shipMsg = `╭───〔  💕 COMPATIBILITÉ 〕───⬣
│◦❒ @${user1} ❤️ @${user2}
│◦❒ Compatibilité : ${compatibility}%
│◦❒ ${compatLevel.emoji} ${compatLevel.message}
│◦❒ 
│◦❒ ${compatLevel.description}
╰════════════════════════⬣`
                await sock.sendMessage(jid, {
                    text: shipMsg,
                    mentions: mentionedJids
                }, { quoted: msg })
            }
            // LOVE
            if (cleanText.startsWith("!love ")) {
                if (!jid.endsWith("@g.us")) return
                const mentionedJids = msg.message.extendedTextMessage?.contextInfo?.mentionedJid
                if (!mentionedJids || mentionedJids.length === 0) {
                    await sock.sendMessage(jid, { text: "❌ Usage: !love @user" }, { quoted: msg })
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
            // GHOST - Extraire et renvoyer images/vidéos en vue unique
            if (cleanText === "!ghost") {
                if (!msg.message.extendedTextMessage?.contextInfo?.quotedMessage) {
                    await sock.sendMessage(jid, { 
                        text: "👻 Réponds à un message contenant une image ou vidéo avec !ghost !" 
                    }, { quoted: msg })
                    return
                }
                const quotedMsg = msg.message.extendedTextMessage.contextInfo
                let mediaType = null
                let mediaKey = null
                // Vérifier si c'est une image normale
                if (quotedMsg.quotedMessage?.imageMessage) {
                    mediaType = "image"
                    mediaKey = quotedMsg.quotedMessage.imageMessage
                }
                // Vérifier si c'est une vidéo normale
                else if (quotedMsg.quotedMessage?.videoMessage) {
                    mediaType = "video"
                    mediaKey = quotedMsg.quotedMessage.videoMessage
                }
                // Vérifier si c'est une image avec viewOnce
                else if (quotedMsg.quotedMessage?.viewOnceMessage?.message?.imageMessage) {
                    mediaType = "image"
                    mediaKey = quotedMsg.quotedMessage.viewOnceMessage.message.imageMessage
                }
                // Vérifier si c'est une vidéo avec viewOnce
                else if (quotedMsg.quotedMessage?.viewOnceMessage?.message?.videoMessage) {
                    mediaType = "video"
                    mediaKey = quotedMsg.quotedMessage.viewOnceMessage.message.videoMessage
                }
                if (!mediaType || !mediaKey) {
                    await sock.sendMessage(jid, { 
                        text: "❌ Le message cité ne contient pas d'image ou vidéo !" 
                    }, { quoted: msg })
                    return
                }
                try {
                    // Télécharger le média
                    const stream = await downloadContentFromMessage(mediaKey, mediaType)
                    let buffer = Buffer.from([])
                    for await (const chunk of stream) {
                        buffer = Buffer.concat([buffer, chunk])
                    }
                    // Vérifier si le buffer est vide (média expiré/déjà ouvert)
                    if (buffer.length === 0) {
                        // Tenter de renvoyer le message original même si déjà ouvert
                        try {
                            // Renvoyer le message cité directement (même si déjà vu)
                            const quotedMessage = quotedMsg.quotedMessage
                            let mediaMessage = {}
                            if (mediaType === "image") {
                                if (quotedMsg.quotedMessage?.imageMessage) {
                                    mediaMessage = {
                                        image: quotedMsg.quotedMessage.imageMessage
                                    }
                                } else if (quotedMsg.quotedMessage?.viewOnceMessage?.message?.imageMessage) {
                                    mediaMessage = {
                                        image: quotedMsg.quotedMessage.viewOnceMessage.message.imageMessage
                                    }
                                }
                            } else if (mediaType === "video") {
                                if (quotedMsg.quotedMessage?.videoMessage) {
                                    mediaMessage = {
                                        video: quotedMsg.quotedMessage.videoMessage
                                    }
                                } else if (quotedMsg.quotedMessage?.viewOnceMessage?.message?.videoMessage) {
                                    mediaMessage = {
                                        video: quotedMsg.quotedMessage.viewOnceMessage.message.videoMessage
                                    }
                                }
                            }
                            if (Object.keys(mediaMessage).length > 0) {
                                await sock.sendMessage(jid, mediaMessage, { quoted: msg })
                                return
                            }
                        } catch (retryError) {
                            console.log("Retry failed:", retryError)
                        }
                        await sock.sendMessage(jid, { 
                            text: "❌ Ce média est vraiment expiré et ne peut pas être récupéré !\n\n💀 Le fantôme est parti pour de bon..." 
                        }, { quoted: msg })
                        return
                    }
                    // Obtenir le nom de l'extracteur
                    const extractorName = msg.pushName || msg.key.participant.split('@')[0]
                    // Préparer le message média
                    let mediaMessage = {}
                    if (mediaType === "image") {
                        mediaMessage = {
                            image: buffer
                        }
                    } else if (mediaType === "video") {
                        mediaMessage = {
                            video: buffer
                        }
                    }
                    // Envoyer le média extrait
                    await sock.sendMessage(jid, mediaMessage, { quoted: msg })
                } catch (error) {
                    console.error("Erreur extraction média:", error)
                    await sock.sendMessage(jid, { 
                        text: "❌ Erreur lors de l'extraction du média : " + error.message 
                    }, { quoted: msg })
                }
            }
            // ANTILINK
            if (cleanText === "!antilink on") {
                if (!jid.endsWith("@g.us")) return
                if (!await isAdmin(sock, jid, msg.key.participant || msg.key.remoteJid)) {
                    await sock.sendMessage(jid, { text: "❌ Seuls les admins peuvent utiliser cette commande !" }, { quoted: msg })
                    return
                }
                if (!config[jid]) config[jid] = {}
                config[jid].antilink = true
                saveConfig()
                await sock.sendMessage(jid, {
                    text: "╭───〔  🔒 ANTI-LINK 〕───⬣\n│◦❒ ✅ Anti-liens activé !\n│◦❒ 🚫 Les liens seront supprimés\n│◦❒ 🛡️ Protection du groupe active\n╰════════════════════════⬣"
                }, { quoted: msg })
            }
            if (cleanText === "!antilink off") {
                if (!jid.endsWith("@g.us")) return
                if (!await isAdmin(sock, jid, msg.key.participant || msg.key.remoteJid)) {
                    await sock.sendMessage(jid, { text: "❌ Seuls les admins peuvent utiliser cette commande !" }, { quoted: msg })
                    return
                }
                if (config[jid]) config[jid].antilink = false
                saveConfig()
                await sock.sendMessage(jid, {
                    text: "╭───〔  🔓 ANTI-LINK 〕───⬣\n│◦❒ ❌ Anti-liens désactivé !\n│◦❒ 🔗 Les liens sont autorisés\n│◦❒ ⚠️ Protection du groupe inactive\n╰════════════════════════⬣"
                }, { quoted: msg })
            }
            // WARN
            if (cleanText.startsWith("!warn ")) {
                if (!jid.endsWith("@g.us")) return
                if (!await isAdmin(sock, jid, msg.key.participant || msg.key.remoteJid)) {
                    await sock.sendMessage(jid, { text: "❌ Seuls les admins peuvent warn !" }, { quoted: msg })
                    return
                }
                const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
                const reason = cleanText.slice(6).replace(/@\S+/g, '').trim() || "Non spécifiée"
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
│◦❒ ${warnCount >= 3 ? "🚫 Banni automatiquement !" : "Fais attention !"}`
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
            if (cleanText.startsWith("!kick ")) {
                if (!jid.endsWith("@g.us")) return
                if (!await isAdmin(sock, jid, msg.key.participant || msg.key.remoteJid)) {
                    await sock.sendMessage(jid, { text: "❌ Seuls les admins peuvent kick !" }, { quoted: msg })
                    return
                }
                const botIsAdmin = await isBotAdmin(sock, jid)
                if (!botIsAdmin) {
                    await sock.sendMessage(jid, { text: "❌ Le bot doit être admin pour utiliser cette commande !" }, { quoted: msg })
                    return
                }
                const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid
                if (!mentioned || mentioned.length === 0) {
                    await sock.sendMessage(jid, { text: "❌ Usage: !kick @user" }, { quoted: msg })
                    return
                }
                try {
                    await sock.groupParticipantsUpdate(jid, mentioned, "remove")
                    await sock.sendMessage(jid, {
                        text: `👢 @${mentioned[0].split('@')[0]} a été kick du groupe !`,
                        mentions: mentioned
                    }, { quoted: msg })
                } catch (error) {
                    console.log("Erreur lors du kick:", error)
                    await sock.sendMessage(jid, { text: "❌ Erreur lors du kick: " + error.message }, { quoted: msg })
                }
            }
            // RESET SCORES
            if (cleanText === "!resetscore") {
                if (!jid.endsWith("@g.us")) return
                if (!await isAdmin(sock, jid, msg.key.participant || msg.key.remoteJid)) {
                    await sock.sendMessage(jid, { text: "❌ Seuls les admins peuvent réinitialiser les scores !" }, { quoted: msg })
                    return
                }
                const success = resetGroupScores(jid)
                if (success) {
                    await sock.sendMessage(jid, { 
                        text: `🔄 *SCORES RÉINITIALISÉS* 🔄
✅ Tous les scores du groupe ont été remis à zéro !
🎯 Les joueurs peuvent maintenant recommencer à accumuler des points !
🏆 Nouvelle course pour le première place !
💡 Utilise !scores pour voir le classement actuel (vide)`,
                        mentions: [msg.key.participant]
                    }, { quoted: msg })
                } else {
                    await sock.sendMessage(jid, { 
                        text: "❌ Aucun score à réinitialiser dans ce groupe !" 
                    }, { quoted: msg })
                }
            }
            // ADMINS
            if (cleanText === "!admins") {
                if (!jid.endsWith("@g.us")) return
                try {
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
                } catch (err) {
                    console.log(err)
                }
            }
            // FERME GROUPE
            if (cleanText === "!ferme") {
                if (!jid.endsWith("@g.us")) return
                if (!await isAdmin(sock, jid, msg.key.participant || msg.key.remoteJid)) {
                    await sock.sendMessage(jid, { text: "❌ Seuls les admins peuvent fermer le groupe !" }, { quoted: msg })
                    return
                }
                await sock.groupSettingUpdate(jid, 'announcement')
                await sock.sendMessage(jid, { 
                    text: "🔒 Le groupe est maintenant fermé !\n⚠️ Seuls les admins peuvent envoyer des messages." 
                }, { quoted: msg })
            }
            // OUVRE GROUPE
            if (cleanText === "!ouvre") {
                if (!jid.endsWith("@g.us")) return
                if (!await isAdmin(sock, jid, msg.key.participant || msg.key.remoteJid)) {
                    await sock.sendMessage(jid, { text: "❌ Seuls les admins peuvent ouvrir le groupe !" }, { quoted: msg })
                    return
                }
                await sock.groupSettingUpdate(jid, 'not_announcement')
                await sock.sendMessage(jid, { 
                    text: "🔓 Le groupe est maintenant ouvert !\n✅ Tout le monde peut envoyer des messages." 
                }, { quoted: msg })
            }
            // UNWARN
            if (cleanText.startsWith("!unwarn ")) {
                if (!jid.endsWith("@g.us")) return
                if (!await isAdmin(sock, jid, msg.key.participant || msg.key.remoteJid)) {
                    await sock.sendMessage(jid, { text: "❌ Seuls les admins peuvent unwarn !" }, { quoted: msg })
                    return
                }
                const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
                if (!mentioned) {
                    await sock.sendMessage(jid, { text: "❌ Usage: !unwarn @user" }, { quoted: msg })
                    return
                }
                const key = `${mentioned}_${jid}`
                if (warns[key]) {
                    delete warns[key]
                    saveWarns()
                    await sock.sendMessage(jid, {
                        text: `✅ Les warns de @${mentioned.split('@')[0]} ont été supprimés !`,
                        mentions: [mentioned]
                    }, { quoted: msg })
                } else {
                    await sock.sendMessage(jid, { text: "❌ Cet utilisateur n'a aucun warn !" }, { quoted: msg })
                }
            }
            // SETUP (sécurisé)
            if (cleanText === "!setup") {
                if (!jid.endsWith("@g.us")) return
                if (!await isAdmin(sock, jid, msg.key.participant || msg.key.remoteJid)) {
                    await sock.sendMessage(jid, { text: "❌ Seuls les admins peuvent utiliser cette commande !" }, { quoted: msg })
                    return
                }
                try {
                    let botId = sock.user.id
                    console.log("ID original du bot:", botId)
                    if (botId.includes(':')) {
                        botId = botId.split(':')[0] + '@s.whatsapp.net'
                    }
                    console.log("ID formaté du bot:", botId)
                    console.log("JID du groupe:", jid)
                    await sock.groupParticipantsUpdate(jid, [botId], "promote")
                    await sock.sendMessage(jid, { 
                        text: "✅ Configuration du bot terminée avec succès !" 
                    }, { quoted: msg })
                } catch (error) {
                    console.log("Erreur complète:", error.message)
                    console.log("Stack:", error.stack)
                    await sock.sendMessage(jid, { 
                        text: "❌ Erreur: " + error.message 
                    }, { quoted: msg })
                }
            }
            // MYID
            if (cleanText === "!myid") {
                await sock.sendMessage(jid, { 
                    text: "🤖 Mon ID: " + sock.user.id 
                }, { quoted: msg })
            }
            // WELCOME
            if (cleanText === "!welcome on") {
                if (!jid.endsWith("@g.us")) return
                if (!await isAdmin(sock, jid, msg.key.participant || msg.key.remoteJid)) {
                    await sock.sendMessage(jid, { text: "❌ Seuls les admins peuvent utiliser cette commande !" }, { quoted: msg })
                    return
                }
                if (!config[jid]) config[jid] = {}
                config[jid].welcome = true
                saveConfig()
                await sock.sendMessage(jid, {
                    text: "╭───〔  👋 WELCOME 〕───⬣\n│◦❒ ✅ Messages de bienvenue activés !\n│◦❒ 🎉 Nouveaux membres accueillis\n│◦❒ 💬 Message automatique envoyé\n╰════════════════════════⬣"
                }, { quoted: msg })
            }
            if (cleanText === "!welcome off") {
                if (!jid.endsWith("@g.us")) return
                if (!await isAdmin(sock, jid, msg.key.participant || msg.key.remoteJid)) {
                    await sock.sendMessage(jid, { text: "❌ Seuls les admins peuvent utiliser cette commande !" }, { quoted: msg })
                    return
                }
                if (config[jid]) config[jid].welcome = false
                saveConfig()
                await sock.sendMessage(jid, {
                    text: "╭───〔  👋 WELCOME 〕───⬣\n│◦❒ ❌ Messages de bienvenue désactivés !\n│◦❒ 🔇 Nouveaux membres ignorés\n│◦❒ 🚫 Aucun message automatique\n╰════════════════════════⬣"
                }, { quoted: msg })
            }
    
            // ====================
            // COMMANDE !STICKER (IMAGES/VIDÉOS EN STICKERS)
            // ====================
            if (cleanText === "!sticker") {
                try {
                    const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage
                    if (!quotedMsg) {
                        await sock.sendMessage(jid, { 
                            text: "📍 Réponds à une image, vidéo ou sticker avec !sticker !" 
                        }, { quoted: msg })
                        return
                    }
                    let mediaType = null
                    let mediaKey = null
                    let isAlreadySticker = false
                    // Détection du type de média
                    if (quotedMsg.imageMessage) {
                        mediaType = 'image'
                        mediaKey = quotedMsg.imageMessage
                        isAlreadySticker = false
                    } 
                    else if (quotedMsg.stickerMessage) {
                        mediaType = 'sticker'
                        mediaKey = quotedMsg.stickerMessage
                        isAlreadySticker = true
                    }
                    else if (quotedMsg.videoMessage) {
                        mediaType = 'video'
                        mediaKey = quotedMsg.videoMessage
                        isAlreadySticker = false
                    }
                    // Support des messages à vue unique
                    else if (quotedMsg.viewOnceMessage?.message?.imageMessage) {
                        mediaType = 'image'
                        mediaKey = quotedMsg.viewOnceMessage.message.imageMessage
                        isAlreadySticker = false
                    }
                    else if (quotedMsg.viewOnceMessage?.message?.videoMessage) {
                        mediaType = 'video'
                        mediaKey = quotedMsg.viewOnceMessage.message.videoMessage
                        isAlreadySticker = false
                    }
                    else {
                        await sock.sendMessage(jid, { 
                            text: "❌ Réponds à une image, vidéo ou sticker !" 
                        }, { quoted: msg })
                        return
                    }
                    // Télécharger le média
                    const stream = await downloadContentFromMessage(mediaKey, mediaType)
                    let buffer = await streamToBuffer(stream)
                    // Vérifier si le téléchargement a réussi
                    if (!buffer || buffer.length === 0) {
                        await sock.sendMessage(jid, { 
                            text: "❌ Impossible de télécharger le média. Il est peut-être expiré." 
                        }, { quoted: msg })
                        return
                    }
                    // Vérifier la taille (max 1MB)
                    const MAX_SIZE = 1 * 1024 * 1024
                    if (buffer.length > MAX_SIZE) {
                        await sock.sendMessage(jid, { 
                            text: `❌ L'image est trop grosse (${Math.round(buffer.length/1024)}KB). Max 1024KB.` 
                        }, { quoted: msg })
                        return
                    }
                    // Convertir en WebP si ce n'est pas déjà un sticker
                    if (!isAlreadySticker) {
                        buffer = await convertToWebP(buffer)
                    }
                    // Générer un pack stylé unique
                    const packName = generateStylishPackName()
                    const author = `✨ Created by ${msg.key.participant.split('@')[0]}`
                    // Envoyer le sticker avec le pack stylé
                    await sock.sendMessage(jid, { 
                        sticker: buffer,
                        packname: packName,
                        author: author
                    }, { quoted: msg })
                    // Sauvegarder le pack dans la base de données
                    if (!stickerPacks[jid]) {
                        stickerPacks[jid] = []
                    }
                    const packInfo = {
                        name: packName,
                        author: author,
                        created: new Date().toISOString(),
                        count: 1
                    }
                    stickerPacks[jid].push(packInfo)
                    saveStickerPacks()
                    console.log(`✅ Sticker ${mediaType} créé - Pack: ${packName}`)
                } catch (error) {
                    console.error('❌ Erreur sticker:', error)
                    await sock.sendMessage(jid, { 
                        text: `❌ Erreur: ${error.message}` 
                    }, { quoted: msg })
                }
            }
            // ====================
            // COMMANDE !STICKERS (VOIR LES PACKS CRÉÉS)
            // ====================
            if (cleanText === "!stickers") {
                try {
                    const groupPacks = stickerPacks[jid] || []
                    if (groupPacks.length === 0) {
                        await sock.sendMessage(jid, { 
                            text: "📦 Aucun pack de stickers créé dans ce groupe !\n\nUtilise !sticker pour créer ton premier pack stylé ✨" 
                        }, { quoted: msg })
                        return
                    }
                    // Afficher les 10 derniers packs
                    const recentPacks = groupPacks.slice(-10).reverse()
                    let packList = "╭───〔 📦 PACKS DE STICKERS 〕───⬣\n│\n"
                    recentPacks.forEach((pack, index) => {
                        const date = new Date(pack.created).toLocaleDateString('fr-FR')
                        const author = pack.author.replace('✨ Created by ', '')
                        packList += `│ ${index + 1}. ${pack.name}\n│    👤 Par: ${author}\n│    📅 ${date}\n│\n`
                    })
                    packList += `│\n│ 📊 Total: ${groupPacks.length} pack(s) créé(s)\n│\n╰════════════════════════⬣`
                    await sock.sendMessage(jid, { text: packList }, { quoted: msg })
                } catch (error) {
                    console.error('Erreur !stickers:', error)
                    await sock.sendMessage(jid, { 
                        text: "❌ Erreur lors de l'affichage des packs" 
                    }, { quoted: msg })
                }
            }
            // ====================
            // COMMANDE !AOUV (ACTION OU VÉRITÉ)
            // ====================
            if (text.toLowerCase() === "!aouv") {
                if (!jid.endsWith("@g.us")) return
                const playerId = msg.key.participant
                // Vérifier si une partie est déjà en cours
                if (aouvGames.has(jid)) {
                    const game = aouvGames.get(jid)
                    const timeElapsed = Date.now() - game.startTime
                    // Si ça fait plus de 20 secondes, on annule l'ancienne partie
                    if (timeElapsed > 20000) {
                        aouvGames.delete(jid)
                        await sock.sendMessage(jid, { 
                            text: "⏱️ L'ancienne partie a expiré, nouvelle partie lancée !" 
                        }, { quoted: msg })
                    } else {
                        await sock.sendMessage(jid, { 
                            text: `❌ Une partie est déjà en cours avec @${game.currentPlayer.split('@')[0]} ! Attend qu'elle finisse.`,
                            mentions: [game.currentPlayer]
                        }, { quoted: msg })
                        return
                    }
                }
                // Commencer une nouvelle partie
                aouvGames.set(jid, { 
                    currentPlayer: playerId,
                    startTime: Date.now()
                })
                await sock.sendMessage(jid, { 
                    text: `╭───〔  🎲 ACTION OU VÉRITÉ 〕───⬣
│◦❒ @${playerId.split('@')[0]}
│◦❒ 
│◦❒ Réponds avec "A" (Action) ou "V" (Vérité)
│◦❒ ⏱️ Tu as 30 secondes !
╰════════════════════════⬣`,
                    mentions: [playerId]
                }, { quoted: msg })
                // Timer de 30 secondes
                const timeoutId = setTimeout(() => {
                    if (aouvGames.has(jid) && aouvGames.get(jid).currentPlayer === playerId) {
                        aouvGames.delete(jid)
                        sock.sendMessage(jid, { 
                            text: `⏱️ @${playerId.split('@')[0]} n'a pas répondu, partie annulée.`,
                            mentions: [playerId]
                        })
                    }
                }, 30000)
                // Stocker le timeout ID pour l'annuler si le joueur répond
                aouvGames.get(jid).timeoutId = timeoutId
            }
            // ====================
            // GESTION DES RÉPONSES POUR AOUV
            // ====================
            if (aouvGames.has(jid) && !cleanText.startsWith("!")) {
                const game = aouvGames.get(jid)
                const playerId = msg.key.participant
                const answer = cleanText.toUpperCase().trim()
                // Si ce n'est pas le bon joueur, on IGNORE SILENCIEUSEMENT (pas de message)
                if (playerId !== game.currentPlayer) {
                    return // 👈 ICI : on ignore sans rien dire
                }
                // Annuler le timeout si le joueur répond
                if (game.timeoutId) {
                    clearTimeout(game.timeoutId)
                }
                // Vérifier la réponse
                if (answer === "A" || answer === "ACTION") {
                    // Obtenir une action non répétée
                    const action = getUnusedAouvQuestion(jid, "action")
                    await sock.sendMessage(jid, { 
                        text: `╭───〔  ⚡ ACTION 〕───⬣
│◦❒ @${playerId.split('@')[0]}
│◦❒ 
│◦❒ ${action}
╰════════════════════════⬣`,
                        mentions: [playerId]
                    }, { quoted: msg })
                    aouvGames.delete(jid)
                } else if (answer === "V" || answer === "VERITE" || answer === "VÉRITÉ") {
                    // Obtenir une vérité non répétée
                    const verite = getUnusedAouvQuestion(jid, "verite")
                    await sock.sendMessage(jid, { 
                        text: `╭───〔  ❓ VÉRITÉ 〕───⬣
│◦❒ @${playerId.split('@')[0]}
│◦❒ 
│◦❒ ${verite}
╰════════════════════════⬣`,
                        mentions: [playerId]
                    }, { quoted: msg })
                    aouvGames.delete(jid)
                } else {
                    await sock.sendMessage(jid, { 
                        text: `❌ @${playerId.split('@')[0]}, réponds avec A (Action) ou V (Vérité) !`,
                        mentions: [playerId]
                    }, { quoted: msg })
                }
            }
            // LOUP-GAROU - CREATE
            if (cleanText.startsWith("!loup create")) {
                if (!jid.endsWith("@g.us")) return
                if (loupGames.has(jid)) {
                    await sock.sendMessage(jid, { 
                        text: "❌ Une partie est déjà en cours dans ce groupe !" 
                    }, { quoted: msg })
                    return
                }
                const args = cleanText.split(" ")
                let requiredPlayers = 6
                if (args.length >= 3) {
                    requiredPlayers = parseInt(args[2]) || 6
                    if (requiredPlayers < 4) requiredPlayers = 4
                    if (requiredPlayers > 20) requiredPlayers = 20
                }
                loupGames.set(jid, {
                    status: "waiting",
                    players: [],
                    requiredPlayers,
                    createdBy: msg.key.participant,
                    createdAt: Date.now()
                })
                await sock.sendMessage(jid, { 
                    text: `╭───〔  🐺 LOUP-GAROU 〕───⬣
│◦❒ Partie créée par @${msg.key.participant.split('@')[0]}
│◦❒ 
│◦❒ 👥 Joueurs requis : ${requiredPlayers}
│◦❒ 👤 Joueurs actuels : 0
│◦❒ 
│◦❒ Pour rejoindre : !loup join
│◦❒ Pour démarrer : !loup start
╰════════════════════════⬣`,
                    mentions: [msg.key.participant]
                }, { quoted: msg })
            }
            // LOUP-GAROU - JOIN
            if (cleanText === "!loup join") {
                if (!jid.endsWith("@g.us")) return
                const game = loupGames.get(jid)
                if (!game) {
                    await sock.sendMessage(jid, { 
                        text: "❌ Aucune partie en cours ! Crée-en une avec !loup create" 
                    }, { quoted: msg })
                    return
                }
                if (game.status !== "waiting") {
                    await sock.sendMessage(jid, { 
                        text: "❌ La partie a déjà commencé !" 
                    }, { quoted: msg })
                    return
                }
                const playerName = msg.pushName || msg.key.participant.split('@')[0]
                const playerJid = msg.key.participant.endsWith('@s.whatsapp.net') ? msg.key.participant : msg.key.participant + '@s.whatsapp.net'
                console.log("👤 Ajout du joueur:", { name: playerName, jid: playerJid });
                if (game.players.find(p => p.jid === playerJid)) {
                    await sock.sendMessage(jid, { 
                        text: "❌ Tu participes déjà à cette partie !" 
                    }, { quoted: msg })
                    return
                }
                if (game.players.length >= game.requiredPlayers) {
                    await sock.sendMessage(jid, { 
                        text: "❌ La partie est déjà complète !" 
                    }, { quoted: msg })
                    return
                }
                const playerNumber = game.players.length + 1
                game.players.push({
                    jid: playerJid,
                    name: playerName,
                    displayName: `Joueur${playerNumber}`,
                    number: playerNumber,
                    alive: true,
                    role: null,
                    hasPotionLife: false,
                    hasPotionDeath: false
                })
                const playersLeft = game.requiredPlayers - game.players.length
                await sock.sendMessage(jid, { 
                    text: `╭───〔  🐺 NOUVEAU JOUEUR 〕───⬣
│◦❒ @${msg.key.participant.split('@')[0]} → *Joueur${playerNumber}*
│◦❒ 
│◦❒ 👤 ${game.players.length}/${game.requiredPlayers} joueurs
│◦❒ ${playersLeft > 0 ? `⏳ Encore ${playersLeft} joueur(s) nécessaire(s)` : "🎉 Partie complète ! Fais !loup start"}
╰════════════════════════⬣`,
                    mentions: [msg.key.participant]
                }, { quoted: msg })
            }
            // LOUP-GAROU - START
            if (cleanText === "!loup start") {
                if (!jid.endsWith("@g.us")) return
                const game = loupGames.get(jid)
                if (!game) {
                    await sock.sendMessage(jid, { 
                        text: "❌ Aucune partie en cours !" 
                    }, { quoted: msg })
                    return
                }
                if (msg.key.participant !== game.createdBy) {
                    await sock.sendMessage(jid, { 
                        text: "❌ Seul le créateur de la partie peut la démarrer !" 
                    }, { quoted: msg })
                    return
                }
                if (game.status !== "waiting") {
                    await sock.sendMessage(jid, { 
                        text: "❌ La partie a déjà commencé !" 
                    }, { quoted: msg })
                    return
                }
                if (game.players.length < game.requiredPlayers) {
                    await sock.sendMessage(jid, { 
                        text: `❌ Pas assez de joueurs ! (${game.players.length}/${game.requiredPlayers})` 
                    }, { quoted: msg })
                    return
                }
                // Distribuer les rôles
                distributeRoles(game)
                game.status = "night"
                game.nightActions = {}
                game.votes = {}
                game.turn = 1
                // Annonce dans le groupe
                await sock.sendMessage(jid, { 
                    text: `╭───〔  🐺 LOUP-GAROU DÉMARRE 〕───⬣
│◦❒ 🌙 La première nuit tombe sur le village...
│◦❒ 
│◦❒ 📜 Rôles distribués en message privé !
│◦❒ ⏱️ Phase de nuit : 3 minutes
│◦❒ 
│◦❒ Les loups : utilisez !kill en privé
│◦❒ Les villageois : patientez
╰════════════════════════⬣`
                }, { quoted: msg })
                // Envoyer les rôles en PV
                await sendRolesToPlayers(jid, game, sock)
                // Démarrer la phase de nuit
                startNightPhase(jid, game, sock)
            }
            // LOUP-GAROU - KILL (privé)
            if (text.toLowerCase() === "!kill" && !jid.endsWith("@g.us")) {
                console.log("🐺 Commande !kill reçue en PV de:", msg.key.participant);
                console.log("📱 JID actuel:", jid);
                // Normaliser le JID de l'expéditeur
                const senderJid = msg.key.participant.endsWith('@s.whatsapp.net') ? msg.key.participant : msg.key.participant + '@s.whatsapp.net';
                console.log("🔧 JID normalisé:", senderJid);
                const { game, groupJid } = findPlayerGame(senderJid)
                console.log("🎮 Résultat recherche:", { game: !!game, groupJid });
                if (!game) {
                    await sock.sendMessage(jid, { 
                        text: "❌ Tu ne participes à aucune partie !" 
                    })
                    return
                }
                const player = game.players.find(p => p.jid === senderJid)
                if (!player || player.role !== "loup") {
                    await sock.sendMessage(jid, { 
                        text: "❌ Seuls les loups peuvent utiliser cette commande !" 
                    })
                    return
                }
                if (game.status !== "night") {
                    await sock.sendMessage(jid, { 
                        text: "❌ Ce n'est pas la nuit !" 
                    })
                    return
                }
                const alive = game.players.filter(p => p.alive && p.role !== "loup")
                if (alive.length === 0) {
                    await sock.sendMessage(jid, { 
                        text: "❌ Il n'y a plus de villageois à tuer !" 
                    })
                    return
                }
                let list = ""
                alive.forEach((p, index) => {
                    list += ` ${index + 1}️⃣ ${p.displayName}\n` 
                })
                await sock.sendMessage(jid, { 
                    text: `╭───〔  🐺 CHOISIS TA CIBLE 〕───⬣
│ Villageois vivants :
│
${list}
│ Envoie le numéro de ta cible (1-${alive.length})
╰════════════════════════⬣`
                })
            }
            // LOUP-GAROU - VOYANTE - SEE (privé)
            if (text.toLowerCase() === "!see" && !jid.endsWith("@g.us")) {
                const senderJid = msg.key.participant.endsWith('@s.whatsapp.net') ? msg.key.participant : msg.key.participant + '@s.whatsapp.net';
                const { game, groupJid, player } = findPlayerGame(senderJid)
                if (!game) {
                    await sock.sendMessage(jid, { 
                        text: "❌ Tu ne participes à aucune partie !" 
                    })
                    return
                }
                if (!player || player.role !== "voyante") {
                    await sock.sendMessage(jid, { 
                        text: "❌ Seule la Voyante peut utiliser cette commande !" 
                    })
                    return
                }
                if (game.status !== "night") {
                    await sock.sendMessage(jid, { 
                        text: "❌ Ce n'est pas la nuit !" 
                    })
                    return
                }
                if (game.nightActions?.voyanteSeen) {
                    await sock.sendMessage(jid, { 
                        text: "❌ Tu as déjà utilisé ton pouvoir cette nuit !" 
                    })
                    return
                }
                // Afficher les joueurs disponibles
                const alivePlayers = game.players.filter(p => p.alive && p.jid !== player.jid)
                let list = ""
                alivePlayers.forEach((p, index) => {
                    list += ` ${index + 1}️⃣ ${p.displayName}\n` 
                })
                await sock.sendMessage(jid, { 
                    text: `╭───〔  🔮 CHOISIS UN JOUEUR 〕───⬣
│ Joueurs vivants :
│
${list}
│ Envoie le numéro du joueur dont tu veux voir le rôle (1-${alivePlayers.length})
╰════════════════════════⬣`
                })
            }
            // LOUP-GAROU - SORCIERE - POTIONS (privé)
            if (text.toLowerCase() === "!potions" && !jid.endsWith("@g.us")) {
                const senderJid = msg.key.participant.endsWith('@s.whatsapp.net') ? msg.key.participant : msg.key.participant + '@s.whatsapp.net';
                const { game, groupJid, player } = findPlayerGame(senderJid)
                if (!game) {
                    await sock.sendMessage(jid, { 
                        text: "❌ Tu ne participes à aucune partie !" 
                    })
                    return
                }
                if (!player || player.role !== "sorciere") {
                    await sock.sendMessage(jid, { 
                        text: "❌ Seule la Sorcière peut utiliser cette commande !" 
                    })
                    return
                }
                if (game.status !== "night") {
                    await sock.sendMessage(jid, { 
                        text: "❌ Ce n'est pas la nuit !" 
                    })
                    return
                }
                const potions = []
                if (player.hasPotionLife) potions.push("💊 Potion de vie")
                if (player.hasPotionDeath) potions.push("⚗️ Potion de mort")
                if (potions.length === 0) {
                    await sock.sendMessage(jid, { 
                        text: "❌ Tu n'as plus de potions !" 
                    })
                    return
                }
                let message = `╭───〔  🧪 TES POTIONS 〕───⬣
│ 
│ 🧪 Tes potions disponibles :${potions.join(", ")}
│ 
`
                if (player.hasPotionLife) {
                    message += `│ 💊 Potion de vie : !life [numéro]\n`
                    message += `│    (Sauve un joueur tué par les loups)\n`
                }
                if (player.hasPotionDeath) {
                    message += `│ ⚗️ Potion de mort : !death [numéro]\n`
                    message += `│    (Tue un joueur de ton choix)\n`
                }
                message += `│
╰════════════════════════⬣`
                await sock.sendMessage(jid, { text: message })
            }
            // LOUP-GAROU - GESTION DES RÉPONSES NUMÉRIQUES (privé)
            if (!jid.endsWith("@g.us") && !isNaN(text) && text.trim() !== "") {
                const { game, groupJid, player } = findPlayerGame(msg.key.participant)
                if (!game || !player) return
                const choice = parseInt(text.trim())
                // LOUP - CHOIX DE LA CIBLE
                if (game.status === "night" && player.role === "loup" && !game.nightActions.loupKill) {
                    const aliveVillagers = game.players.filter(p => p.alive && p.role !== "loup")
                    if (choice >= 1 && choice <= aliveVillagers.length) {
                        const target = aliveVillagers[choice - 1]
                        game.nightActions.loupKill = target.jid
                        await sock.sendMessage(jid, { 
                            text: `🐺 Tu as choisi de tuer *${target.displayName}* !\n\n⏳ Attends la fin de la nuit...` 
                        })
                    } else {
                        await sock.sendMessage(jid, { 
                            text: `❌ Numéro invalide ! Choisis entre 1 et ${aliveVillagers.length}` 
                        })
                    }
                }
                // VOYANTE - VOIR RÔLE
                else if (game.status === "night" && player.role === "voyante" && !game.nightActions.voyanteSeen) {
                    const alivePlayers = game.players.filter(p => p.alive && p.jid !== player.jid)
                    if (choice >= 1 && choice <= alivePlayers.length) {
                        const target = alivePlayers[choice - 1]
                        game.nightActions.voyanteSeen = target.jid
                        await sock.sendMessage(jid, { 
                            text: `🔮 Tu as regardé *${target.displayName}*...\n\n🎭 Son rôle est : *${target.role.toUpperCase()}* !\n\n⏳ Garde cette information secrète !` 
                        })
                    } else {
                        await sock.sendMessage(jid, { 
                            text: `❌ Numéro invalide ! Choisis entre 1 et ${alivePlayers.length}` 
                        })
                    }
                }
                // SORCIÈRE - POTION DE MORT
                else if (game.status === "night" && player.role === "sorciere" && player.hasPotionDeath && !game.nightActions.sorciereDeath) {
                    const alivePlayers = game.players.filter(p => p.alive)
                    if (choice >= 1 && choice <= alivePlayers.length) {
                        const target = alivePlayers[choice - 1]
                        game.nightActions.sorciereDeath = target.jid
                        player.hasPotionDeath = false
                        await sock.sendMessage(jid, { 
                            text: `⚗️ Tu as utilisé ta POTION DE MORT sur *${target.displayName}* !\n\n⏳ Attends la fin de la nuit...` 
                        })
                    } else {
                        await sock.sendMessage(jid, { 
                            text: `❌ Numéro invalide ! Choisis entre 1 et ${alivePlayers.length}` 
                        })
                    }
                }
            }
            // LOUP-GAROU - SORCIÈRE - POTION DE VIE (privé)
            if (text.toLowerCase().startsWith("!life") && !jid.endsWith("@g.us")) {
                const senderJid = msg.key.participant.endsWith('@s.whatsapp.net') ? msg.key.participant : msg.key.participant + '@s.whatsapp.net';
                const { game, groupJid, player } = findPlayerGame(senderJid)
                if (!game || !player || player.role !== "sorciere") return
                if (game.status !== "night") {
                    await sock.sendMessage(jid, { 
                        text: "❌ Ce n'est pas la nuit !" 
                    })
                    return
                }
                if (!player.hasPotionLife) {
                    await sock.sendMessage(jid, { 
                        text: "❌ Tu n'as plus de potion de vie !" 
                    })
                    return
                }
                if (!game.nightActions.loupKill) {
                    await sock.sendMessage(jid, { 
                        text: "❌ Personne n'a été tué cette nuit, inutile d'utiliser ta potion !" 
                    })
                    return
                }
                game.nightActions.sorciereLife = game.nightActions.loupKill
                player.hasPotionLife = false
                const saved = game.players.find(p => p.jid === game.nightActions.loupKill)
                await sock.sendMessage(jid, { 
                    text: `💊 Tu as utilisé ta POTION DE VIE pour sauver *${saved.displayName}* !\n\n⏳ Attends la fin de la nuit...` 
                })
            }
            // LOUP-GAROU - VOTE NUMÉRIQUE (groupe)
            const currentGame = loupGames.get(jid)
            if (currentGame && currentGame.votingActive && !isNaN(text) && text.trim() !== "") {
                const choice = parseInt(text.trim())
                const alive = currentGame.players.filter(p => p.alive)
                if (choice >= 1 && choice <= alive.length) {
                    const voter = currentGame.players.find(p => p.jid === msg.key.participant)
                    if (!voter || !voter.alive) return
                    const target = alive[choice - 1]
                    currentGame.votes[msg.key.participant] = target.jid
                    await sock.sendMessage(jid, { 
                        text: `🗳️ @${voter.name} (${voter.displayName}) a voté pour *${target.displayName}* !`,
                        mentions: [voter.jid]
                    })
                } else {
                    await sock.sendMessage(jid, { 
                        text: `❌ Numéro invalide ! Choisis entre 1 et ${alive.length}` 
                    }, { quoted: msg })
                }
            }
            // LOUP-GAROU - VOTE
            if (cleanText === "!vote" && jid.endsWith("@g.us")) {
                const game = loupGames.get(jid)
                if (!game || game.status !== "day" || game.votingActive) return
                game.status = "voting"
                game.votingActive = true
                game.votes = {}
                const alive = game.players.filter(p => p.alive)
                let voteMenu = `╭───〔  🗳️ VOTE POUR ÉLIMINER UN LOUP 〕───⬣\n` 
                voteMenu += `│ Votez pour la personne que vous soupçonnez !\n│\n` 
                alive.forEach((p, index) => {
                    voteMenu += `│ ${index + 1}️⃣ ${p.displayName}\n` 
                })
                voteMenu += `│\n│ Envoyez simplement le numéro\n` 
                voteMenu += `│ ⏱️ Vous avez 2 minutes\n` 
                voteMenu += `╰════════════════════════⬣` 
                await sock.sendMessage(jid, { 
                    text: voteMenu,
                    mentions: alive.map(p => p.jid)
                })
                // Timer de 2 minutes pour le vote
                if (game.voteTimer) clearTimeout(game.voteTimer)
                game.voteTimer = setTimeout(() => {
                    resolveVotePhase(jid, game, sock)
                }, 120000) // 2 minutes
            }
            // LOUP-GAROU - STATUS
            if (cleanText === "!loup status" && jid.endsWith("@g.us")) {
                const game = loupGames.get(jid)
                if (!game) {
                    await sock.sendMessage(jid, { 
                        text: "❌ Aucune partie en cours !" 
                    }, { quoted: msg })
                    return
                }
                const alive = game.players.filter(p => p.alive)
                const dead = game.players.filter(p => !p.alive)
                let statusMsg = `╭───〔  📊 ÉTAT DE LA PARTIE 〕───⬣\n` 
                statusMsg += `│ Phase : ${game.status}\n` 
                statusMsg += `│ Tour : ${game.turn}\n` 
                statusMsg += `│\n│ ✅ Vivants (${alive.length}) :\n` 
                alive.forEach(p => {
                    statusMsg += `│    • @${p.name}\n` 
                })
                if (dead.length > 0) {
                    statusMsg += `│\n│ 💀 Morts (${dead.length}) :\n` 
                    dead.forEach(p => {
                        statusMsg += `│    • @${p.name} (${p.role})\n` 
                    })
                }
                statusMsg += `╰════════════════════════⬣` 
                await sock.sendMessage(jid, { 
                    text: statusMsg,
                    mentions: game.players.map(p => p.jid)
                }, { quoted: msg })
            }
            // Gestion des réponses numériques en privé (pour les loups)
            if (!jid.endsWith("@g.us") && !isNaN(text) && text.trim() !== "") {
                const number = parseInt(text.trim())
                const senderJid = msg.key.participant.endsWith('@s.whatsapp.net') ? msg.key.participant : msg.key.participant + '@s.whatsapp.net';
                const { game, groupJid, player } = findPlayerGame(senderJid)
                if (!game) return
                if (game.status !== "night") return
                const alive = game.players.filter(p => p.alive && p.role !== "loup")
                if (number < 1 || number > alive.length) {
                    await sock.sendMessage(jid, { 
                        text: `❌ Choisis un numéro entre 1 et ${alive.length} !` 
                    })
                    return
                }
                const target = alive[number - 1]
                if (player.role === "loup") {
                    game.nightActions.loupKill = target.jid
                    await sock.sendMessage(jid, { 
                        text: `✅ Tu as choisi de tuer *${target.name}* cette nuit.` 
                    })
                }
            }
            // Gestion des votes numériques dans le groupe
            if (jid.endsWith("@g.us") && !isNaN(text) && text.trim() !== "") {
                const game = loupGames.get(jid)
                if (!game || !game.votingActive) return
                const number = parseInt(text.trim())
                const alive = game.players.filter(p => p.alive)
                if (number < 1 || number > alive.length) {
                    await sock.sendMessage(jid, { 
                        text: `❌ Choisis un numéro entre 1 et ${alive.length} !` 
                    }, { quoted: msg })
                    return
                }
                const voter = game.players.find(p => p.jid === msg.key.participant)
                if (!voter || !voter.alive) {
                    await sock.sendMessage(jid, { 
                        text: "❌ Tu n'es pas vivant ou tu ne joues pas !" 
                    }, { quoted: msg })
                    return
                }
                const target = alive[number - 1]
                game.votes[msg.key.participant] = target.jid
                await sock.sendMessage(jid, { 
                    text: `🗳️ @${voter.name} a voté`,
                    mentions: [voter.jid]
                }, { quoted: msg })
            }
            // LAST CRY
            if (cleanText === "!lastcry") {
                if (!jid.endsWith("@g.us")) return
                // Gérer les inscriptions au Last Cry
                if (lastCryRegistrations.has(jid)) {
                    await sock.sendMessage(jid, { 
                        text: "💀 Les inscriptions au Last Cry sont déjà en cours ! Tapez \"JE JOUE\" pour participer !" 
                    }, { quoted: msg });
                    return;
                }
                // Gérer les réponses au Last Cry
                if (lastCryGames.has(jid)) {
                    await sock.sendMessage(jid, { 
                        text: "❌ Une partie est déjà en cours !" 
                    }, { quoted: msg });
                    return;
                }
                const gameStarted = startLastCryGame(jid, sock, msg);
                if (!gameStarted) {
                    await sock.sendMessage(jid, { 
                        text: "❌ Impossible de démarrer le jeu !" 
                    }, { quoted: msg });
                }
            }
            // GESTION DES INSCRIPTIONS LAST CRY
            if (lastCryRegistrations.has(jid) && !cleanText.startsWith("!")) {
                handleLastCryRegistration(jid, sock, msg, text, msg.key.participant);
                return;
            }
            // GESTION DES RÉPONSES LAST CRY
            if (lastCryGames.has(jid) && !cleanText.startsWith("!")) {
                handleLastCryAnswer(jid, sock, msg, text);
                return;
            }
            // ====================
            // GESTION DES RÉPONSES BATTLE OTAKU
            // ====================
            if (activeBattles.has(jid) && !cleanText.startsWith("!")) {
                const battle = activeBattles.get(jid)
                const senderJid = msg.key.participant
                if (!battle || battle.status !== 'active') return
                // Vérifier si le sender est un des participants
                let isPlayer = false
                let playerRole = null
                if (senderJid === battle.challenger.jid) {
                    isPlayer = true
                    playerRole = battle.challenger
                } else if (senderJid === battle.opponent.jid) {
                    isPlayer = true
                    playerRole = battle.opponent
                }
                if (!isPlayer || playerRole.answered) return
                // Vérifier la réponse
                const normalizedAnswer = normalizeAccents(cleanText.toLowerCase().trim())
                const correctAnswer = normalizeAccents(battle.currentQuestion.answer.toLowerCase().trim())
                let isCorrect = false
                // Vérifier la réponse principale
                if (normalizedAnswer === correctAnswer) {
                    isCorrect = true
                } else {
                    // Vérifier les alternatives
                    for (const alt of battle.currentQuestion.alternatives) {
                        if (normalizedAnswer === normalizeAccents(alt.toLowerCase().trim())) {
                            isCorrect = true
                            break
                        }
                    }
                }
                if (isCorrect) {
                    // Premier qui répond correctement gagne 3 points
                    playerRole.score += 3
                    playerRole.answered = true
                    await sock.sendMessage(jid, { 
                        text: `⚡ *${playerRole.name}* répond correctement ! +3 points
🎯 Score actuel: ${playerRole.score} points`,
                        mentions: [senderJid]
                    })
                    // Vérifier si les deux ont répondu
                    if (battle.challenger.answered && battle.opponent.answered) {
                        setTimeout(() => {
                            askOtakuQuestion(jid, sock)
                        }, 2000)
                    } else {
                        setTimeout(() => {
                            checkOtakuAnswer(jid, sock)
                        }, 25000) // 25 secondes restantes
                    }
                }
            }
            // Fonctions multimédia - DÉFINIES AVANT LEUR UTILISATION
async function downloadAudioSimple(url) {
    return new Promise(async (resolve, reject) => {
        console.log("🎵 Début téléchargement audio depuis:", url)
        try {
            const safeUserId = String(process.env.PIPCHI_USER_ID || 'default').replace(/[^a-zA-Z0-9_-]/g, '')
            const downloadRoot = process.env.PIPCHI_DOWNLOAD_DIR || path.join(os.tmpdir(), 'pipchi-bot-downloads', safeUserId)
            const downloadDir = path.join(downloadRoot, 'musics')
            const downloadPath = path.join(downloadDir, `temp-${Date.now()}-${Math.random().toString(16).slice(2)}.mp3`)
            // Créer le dossier s'il n'existe pas
            if (!fs.existsSync(downloadDir)) {
                fs.mkdirSync(downloadDir, { recursive: true })
            }
            
            // Utiliser @distube/ytdl-core pour télécharger l'audio
            console.log("🎵 Utilisation de @distube/ytdl-core pour le téléchargement...")
            try {
                const ytdl = require('@distube/ytdl-core')
                const stream = ytdl(url, { quality: 'highestaudio', filter: 'audioonly' })
                const chunks = []
                for await (const chunk of stream) {
                    chunks.push(chunk)
                }
                const buffer = Buffer.concat(chunks)
                console.log(`✅ Téléchargement terminé avec @distube/ytdl-core`)
                resolve(buffer)
            } catch (ytdlError) {
                console.error('❌ Erreur @distube/ytdl-core:', ytdlError)
                // Fallback: essayer play-dl
                console.log("⚠️ @distube/ytdl-core échoué, tentative avec play-dl...")
                try {
                    const { stream, info } = await play.stream(url)
                    const chunks = []
                    for await (const chunk of stream) {
                        chunks.push(chunk)
                    }
                    const buffer = Buffer.concat(chunks)
                    console.log(`✅ Téléchargement terminé avec play-dl`)
                    resolve(buffer)
                } catch (playError) {
                    console.error('❌ Erreur play-dl:', playError)
                    // Fallback: utiliser un service externe de téléchargement
                    console.log("⚠️ play-dl échoué, tentative avec service externe...")
                    try {
                        const axios = require('axios')
                        // Utiliser l'API de téléchargement externe
                        const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1]
                        if (!videoId) {
                            throw new Error('URL YouTube invalide')
                        }
                        
                        // Utiliser l'API de téléchargement (fallback)
                        const downloadApi = `https://api.vevioz.com/api/download/mp3/${videoId}`
                        const response = await axios.get(downloadApi, { timeout: 30000 })
                        
                        if (response.data && response.data.download_url) {
                            const audioResponse = await axios.get(response.data.download_url, { 
                                responseType: 'arraybuffer',
                                timeout: 60000 
                            })
                            console.log(`✅ Téléchargement terminé avec service externe`)
                            resolve(Buffer.from(audioResponse.data))
                        } else {
                            throw new Error('URL de téléchargement non trouvée')
                        }
                    } catch (externalError) {
                        console.error('❌ Erreur service externe:', externalError)
                        reject(new Error('Téléchargement non disponible sur ce serveur (YouTube bloque les serveurs cloud). Essaye localement.'))
                    }
                }
            }
        } catch (error) {
            console.error('❌ Erreur téléchargement:', error)
            reject(error)
        }
    })
}

// Générer une image du match avec les logos des équipes
async function generateMatchImage(homeTeam, awayTeam, score, match, competitionName) {
    try {
        const sharp = require('sharp')
        const axios = require('axios')
        
        // Créer une image de base (800x400)
        const width = 800
        const height = 400
        
        // Créer un fond dégradé
        const gradient = sharp({
            create: {
                width,
                height,
                channels: 3,
                background: { r: 30, g: 30, b: 40 }
            }
        })
        
        // Télécharger les logos des équipes (fallback sur des placeholders)
        let homeLogo, awayLogo
        try {
            if (homeTeam.crest) {
                const homeLogoResponse = await axios.get(homeTeam.crest, { responseType: 'arraybuffer', timeout: 5000 })
                homeLogo = Buffer.from(homeLogoResponse.data)
            }
        } catch (e) {
            console.log('Erreur téléchargement logo home:', e.message)
        }
        
        try {
            if (awayTeam.crest) {
                const awayLogoResponse = await axios.get(awayTeam.crest, { responseType: 'arraybuffer', timeout: 5000 })
                awayLogo = Buffer.from(awayLogoResponse.data)
            }
        } catch (e) {
            console.log('Erreur téléchargement logo away:', e.message)
        }
        
        // Créer l'image de base avec le fond
        let image = sharp({
            create: {
                width,
                height,
                channels: 4,
                background: { r: 20, g: 25, b: 35, alpha: 255 }
            }
        })
        
        // Ajouter un effet de gradient
        image = image.modulate({ brightness: 1.1 })
        
        // Créer un canvas SVG pour le texte
        const svgText = `
            <svg width="${width}" height="${height}">
                <rect x="0" y="0" width="${width}" height="${height}" fill="rgba(0,0,0,0.3)"/>
                <text x="${width/2}" y="50" font-family="Arial" font-size="24" font-weight="bold" fill="#ffffff" text-anchor="middle">⚽ MATCH EN COURS</text>
                <text x="${width/2}" y="80" font-family="Arial" font-size="18" fill="#00d4aa" text-anchor="middle">${competitionName}</text>
                <text x="${width/2}" y="${height/2}" font-family="Arial" font-size="48" font-weight="bold" fill="#ffffff" text-anchor="middle">${score.fullTime.home} - ${score.fullTime.away}</text>
                <text x="${width/2}" y="${height/2 + 40}" font-family="Arial" font-size="20" fill="#aaaaaa" text-anchor="middle">${match.status} (${match.minute}')</text>
                <text x="200" y="${height - 50}" font-family="Arial" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle">${homeTeam.name}</text>
                <text x="${width - 200}" y="${height - 50}" font-family="Arial" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle">${awayTeam.name}</text>
            </svg>
        `
        
        const svgBuffer = Buffer.from(svgText)
        const textOverlay = sharp(svgBuffer)
        
        // Combiner l'image de base avec le texte
        image = await image.composite([{ input: await textOverlay.toBuffer(), blend: 'over' }])
        
        // Ajouter les logos si disponibles
        if (homeLogo) {
            const homeLogoResized = await sharp(homeLogo).resize(100, 100).toBuffer()
            image = await image.composite([{ input: homeLogoResized, left: 150, top: height - 180 }])
        }
        
        if (awayLogo) {
            const awayLogoResized = await sharp(awayLogo).resize(100, 100).toBuffer()
            image = await image.composite([{ input: awayLogoResized, left: width - 250, top: height - 180 }])
        }
        
        // Ajouter une bordure
        image = await image.extend({
            top: 5,
            bottom: 5,
            left: 5,
            right: 5,
            background: { r: 0, g: 212, b: 170, alpha: 255 }
        })
        
        return await image.toBuffer()
    } catch (error) {
        console.error('Erreur génération image match:', error)
        // Fallback: retourner null pour utiliser le texte
        return null
    }
}

// Vérifier si une commande existe
async function checkCommandExists(command) {
    return new Promise((resolve) => {
        const proc = spawn('which', [command])
        proc.on('close', (code) => {
            resolve(code === 0)
        })
        proc.on('error', () => {
            resolve(false)
        })
    })
}
// Convertir stream en buffer
async function streamToBuffer(stream) {
    const chunks = []
    for await (const chunk of stream) {
        chunks.push(chunk)
    }
    return Buffer.concat(chunks)
}
// MULTIMÉDIA - PLAY MUSIQUE AUDIO DIRECT
            if (cleanText.startsWith("!play ")) {
                const query = cleanText.split(' ').slice(1).join(' ')
                if (!query) {
                    await sock.sendMessage(jid, { text: "❌ Spécifie une recherche ! Ex: !play dadju reine" }, { quoted: msg })
                    return
                }
                try {
                    // Réaction de recherche (sablier)
                    await sock.sendMessage(jid, { 
                        react: { 
                            text: "⏳", 
                            key: msg.key 
                        } 
                    })
                    // Attendre un peu
                    await new Promise(resolve => setTimeout(resolve, 1500))
                    const results = await searchYouTube(query)
                    if (results.length === 0) {
                        await sock.sendMessage(jid, { 
                            react: { 
                                text: "❌", 
                                key: msg.key 
                            } 
                        })
                        await sock.sendMessage(jid, { text: "❌ Aucun résultat trouvé" }, { quoted: msg })
                        return
                    }
                    const video = results[0]
                    // Envoyer les détails avec miniature
                    const detailsMessage = `🎵 *MUSIQUE TROUVÉE*\n\n` +
                        `📝 *Titre:* ${video.title}\n` +
                        `👤 *Artiste:* ${video.author}\n` +
                        `⏱️ *Durée:* ${video.duration ? formatDuration(video.duration) : 'Inconnue'}\n\n` +
                        `⬇️ Téléchargement audio en cours...`
                    // Envoyer l'image avec les détails
                    if (video.thumbnail) {
                        await sock.sendMessage(jid, {
                            image: { url: video.thumbnail },
                            caption: detailsMessage
                        }, { quoted: msg })
                    } else {
                        await sock.sendMessage(jid, { text: detailsMessage }, { quoted: msg })
                    }
                    // Attendre avant de télécharger
                    await new Promise(resolve => setTimeout(resolve, 2000))
                    console.log("🎵 Téléchargement audio depuis:", video.url)
                    // TÉLÉCHARGEMENT AUDIO SIMPLE
                    try {
                        console.log("🎵 Lancement téléchargement...")
                        const buffer = await downloadAudioSimple(video.url)
                        console.log(`🎵 Buffer reçu: ${buffer.length} bytes`)
                        if (!buffer || buffer.length === 0) {
                            throw new Error('Buffer vide après téléchargement')
                        }
                        // Réaction de succès
                        await sock.sendMessage(jid, { 
                            react: { 
                                text: "✅", 
                                key: msg.key 
                            } 
                        })
                        console.log("🎵 Envoi de l'audio...")
                        // Envoyer l'audio
                        await sock.sendMessage(jid, {
                            audio: buffer,
                            mimetype: 'audio/mpeg',
                            fileName: `${video.title.replace(/[^\w\s-]/g, '')}.mp3`,
                            caption: `🎵 ${video.title}\n👤 ${video.author}`
                        }, { quoted: msg })
                        console.log("🎉 AUDIO ENVOYÉ!")
                    } catch (downloadError) {
                        console.error('❌ Erreur téléchargement:', downloadError)
                        // Réaction d'erreur
                        await sock.sendMessage(jid, { 
                            react: { 
                                text: "❌", 
                                key: msg.key 
                            } 
                        })
                        await sock.sendMessage(jid, { 
                            text: "❌ Erreur téléchargement audio. Réessaie plus tard!" 
                        }, { quoted: msg })
                    }
                } catch (error) {
                    console.error('❌ ERREUR:', error)
                    // Réaction d'erreur
                    await sock.sendMessage(jid, { 
                        react: { 
                            text: "❌", 
                            key: msg.key 
                        } 
                    })
                    await sock.sendMessage(jid, { text: "❌ Erreur: " + error.message }, { quoted: msg })
                }
            }
            // QR CODE - Générer QR code à partir d'un texte
            if (cleanText.startsWith("!qr ")) {
                const text = cleanText.split(' ').slice(1).join(' ')
                if (!text) {
                    await sock.sendMessage(jid, { text: "❌ Spécifie un texte ou un lien ! Ex: !qr https://example.com" }, { quoted: msg })
                    return
                }
                try {
                    // Réaction de génération
                    await sock.sendMessage(jid, { 
                        react: { 
                            text: "⏳", 
                            key: msg.key 
                        } 
                    })
                    // Générer le QR code en buffer
                    const qrBuffer = await QRCode.toBuffer(text, {
                        width: 400,
                        margin: 2,
                        color: {
                            dark: '#000000',
                            light: '#FFFFFF'
                        }
                    })
                    // Réaction de succès
                    await sock.sendMessage(jid, { 
                        react: { 
                            text: "✅", 
                            key: msg.key 
                        } 
                    })
                    // Envoyer le QR code en image SANS caption
                    await sock.sendMessage(jid, {
                        image: qrBuffer
                    }, { quoted: msg })
                } catch (error) {
                    console.error('❌ Erreur QR code:', error)
                    await sock.sendMessage(jid, { 
                        react: { 
                            text: "❌", 
                            key: msg.key 
                        } 
                    })
                    await sock.sendMessage(jid, { text: "❌ Erreur génération QR code" }, { quoted: msg })
                }
            }
            // V - Télécharger et renvoyer le contenu d'un message (statut ou autre)
            if (cleanText === "!v") {
                const contextInfo = msg.message.extendedTextMessage?.contextInfo
                if (!contextInfo || !contextInfo.quotedMessage) {
                    await sock.sendMessage(jid, { text: "❌ Réponds à un message avec !v pour le télécharger !" }, { quoted: msg })
                    return
                }
                const quotedMsg = contextInfo.quotedMessage
                try {
                    await sock.sendMessage(jid, { 
                        react: { 
                            text: "⏳", 
                            key: msg.key 
                        } 
                    })
                    // Déterminer le type de contenu et le télécharger
                    if (quotedMsg.imageMessage) {
                        const stream = await downloadContentFromMessage(quotedMsg.imageMessage, 'image')
                        const buffer = await streamToBuffer(stream)
                        const caption = quotedMsg.imageMessage.caption || ''
                        await sock.sendMessage(jid, { 
                            image: buffer, 
                            caption: caption || undefined 
                        }, { quoted: msg })
                    } 
                    else if (quotedMsg.videoMessage) {
                        const stream = await downloadContentFromMessage(quotedMsg.videoMessage, 'video')
                        const buffer = await streamToBuffer(stream)
                        const caption = quotedMsg.videoMessage.caption || ''
                        await sock.sendMessage(jid, { 
                            video: buffer, 
                            caption: caption || undefined 
                        }, { quoted: msg })
                    }
                    else if (quotedMsg.audioMessage) {
                        const stream = await downloadContentFromMessage(quotedMsg.audioMessage, 'audio')
                        const buffer = await streamToBuffer(stream)
                        await sock.sendMessage(jid, { 
                            audio: buffer, 
                            mimetype: 'audio/mpeg' 
                        }, { quoted: msg })
                    }
                    else if (quotedMsg.stickerMessage) {
                        const stream = await downloadContentFromMessage(quotedMsg.stickerMessage, 'sticker')
                        const buffer = await streamToBuffer(stream)
                        await sock.sendMessage(jid, { 
                            sticker: buffer 
                        }, { quoted: msg })
                    }
                    else if (quotedMsg.documentMessage) {
                        const stream = await downloadContentFromMessage(quotedMsg.documentMessage, 'document')
                        const buffer = await streamToBuffer(stream)
                        const caption = quotedMsg.documentMessage.caption || ''
                        const fileName = quotedMsg.documentMessage.fileName || 'document'
                        await sock.sendMessage(jid, { 
                            document: buffer, 
                            caption: caption || undefined,
                            fileName: fileName,
                            mimetype: quotedMsg.documentMessage.mimetype || 'application/octet-stream'
                        }, { quoted: msg })
                    }
                    else if (quotedMsg.conversation) {
                        await sock.sendMessage(jid, { 
                            text: quotedMsg.conversation 
                        }, { quoted: msg })
                    }
                    else if (quotedMsg.extendedTextMessage) {
                        await sock.sendMessage(jid, { 
                            text: quotedMsg.extendedTextMessage.text 
                        }, { quoted: msg })
                    }
                    else {
                        await sock.sendMessage(jid, { text: "❌ Type de message non supporté" }, { quoted: msg })
                        return
                    }
                    await sock.sendMessage(jid, { 
                        react: { 
                            text: "✅", 
                            key: msg.key 
                        } 
                    })
                } catch (error) {
                    console.error('❌ Erreur téléchargement message:', error)
                    await sock.sendMessage(jid, { 
                        react: { 
                            text: "❌", 
                            key: msg.key 
                        } 
                    })
                    await sock.sendMessage(jid, { text: "❌ Erreur téléchargement du message" }, { quoted: msg })
                }
            }
            // PROFIL - Afficher photo de profil
            if (cleanText === "!profil" || cleanText.startsWith("!profil ")) {
                const isGroup = jid.endsWith("@g.us")
                let targetJid = null
                if (isGroup) {
                    // En groupe: vérifier si quelqu'un est mentionné
                    const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid
                    if (mentioned && mentioned.length > 0) {
                        targetJid = mentioned[0]
                    } else {
                        await sock.sendMessage(jid, { 
                            text: "❌ En groupe, mentionne quelqu'un ! Ex: !profil @user" 
                        }, { quoted: msg })
                        return
                    }
                } else {
                    // En PV: utiliser l'interlocuteur
                    targetJid = msg.key.remoteJid
                }
                try {
                    // Réaction de chargement
                    await sock.sendMessage(jid, { 
                        react: { 
                            text: "⏳", 
                            key: msg.key 
                        } 
                    })
                    // Récupérer la photo de profil via Baileys
                    const profilePicUrl = await sock.profilePictureUrl(targetJid, 'image')
                    if (!profilePicUrl) {
                        await sock.sendMessage(jid, { 
                            react: { 
                                text: "❌", 
                                key: msg.key 
                            } 
                        })
                        await sock.sendMessage(jid, { text: "❌ Aucune photo de profil trouvée" }, { quoted: msg })
                        return
                    }
                    // Réaction de succès
                    await sock.sendMessage(jid, { 
                        react: { 
                            text: "✅", 
                            key: msg.key 
                        } 
                    })
                    // Envoyer la photo de profil SANS caption
                    await sock.sendMessage(jid, {
                        image: { url: profilePicUrl }
                    }, { quoted: msg })
                } catch (error) {
                    console.error('❌ Erreur photo profil:', error)
                    await sock.sendMessage(jid, { 
                        react: { 
                            text: "❌", 
                            key: msg.key 
                        } 
                    })
                    await sock.sendMessage(jid, { text: "❌ Erreur récupération photo de profil" }, { quoted: msg })
                }
            }
            // FOOTBALL - Résultats football (API football-data.org)
            if (cleanText === "!foot" || cleanText.startsWith("!foot ")) {
                const query = cleanText.startsWith("!foot ") ? cleanText.split(' ').slice(1).join(' ') : null
                try {
                    // Réaction de recherche
                    await sock.sendMessage(jid, {
                        react: {
                            text: "⏳",
                            key: msg.key
                        }
                    })
                    // API football-data.org (nécessite une clé API gratuite)
                    const apiUrl = 'https://api.football-data.org/v4/matches'
                    const headers = {
                        'X-Auth-Token': '8e74208653ed455b8a2a94043c4ebf96'
                    }
                    const axios = require('axios')
                    const sharp = require('sharp')
                    const response = await axios.get(apiUrl, { headers })
                    if (response.status !== 200) {
                        throw new Error('Erreur API Football')
                    }
                    const data = response.data
                    const matches = data.matches || []
                    // Filtrer les matchs en cours
                    const liveMatches = matches.filter(m => m.status === 'IN_PLAY' || m.status === 'LIVE')
                    if (query) {
                        // Recherche spécifique d'une équipe
                        const teamMatches = liveMatches.filter(m =>
                            m.homeTeam.name.toLowerCase().includes(query.toLowerCase()) ||
                            m.awayTeam.name.toLowerCase().includes(query.toLowerCase())
                        )
                        if (teamMatches.length === 0) {
                            await sock.sendMessage(jid, {
                                react: {
                                    text: "❌",
                                    key: msg.key
                                }
                            })
                            await sock.sendMessage(jid, {
                                text: `⚽ ${query.toUpperCase()} ne joue pas actuellement.`
                            }, { quoted: msg })
                            return
                        }
                        const match = teamMatches[0]
                        const homeTeam = match.homeTeam
                        const awayTeam = match.awayTeam
                        const score = match.score
                        await sock.sendMessage(jid, {
                            react: {
                                text: "✅",
                                key: msg.key
                            }
                        })
                        
                        // Générer l'image du match
                        const matchImage = await generateMatchImage(homeTeam, awayTeam, score, match, match.competition.name)
                        if (matchImage) {
                            await sock.sendMessage(jid, {
                                image: matchImage,
                                caption: `⚽ ${homeTeam.name} vs ${awayTeam.name}\n📊 ${score.fullTime.home} - ${score.fullTime.away} | ${match.status} (${match.minute}')`
                            }, { quoted: msg })
                        } else {
                            // Fallback sur le texte
                            const matchMessage = `⚽ *MATCH EN COURS*\n\n` +
                                `🏟️ ${homeTeam.name} vs ${awayTeam.name}\n` +
                                `📊 Score: ${score.fullTime.home} - ${score.fullTime.away}\n` +
                                `⏱️ ${match.status} (${match.minute}')\n` +
                                `🏆 ${match.competition.name}`
                            await sock.sendMessage(jid, {
                                text: matchMessage
                            }, { quoted: msg })
                        }
                    } else {
                        // Afficher le match le plus populaire en cours
                        if (liveMatches.length === 0) {
                            await sock.sendMessage(jid, {
                                react: {
                                    text: "❌",
                                    key: msg.key
                                }
                            })
                            await sock.sendMessage(jid, {
                                text: "⚽ Aucun match en cours actuellement."
                            }, { quoted: msg })
                            return
                        }
                        // Prendre le premier match (le plus populaire)
                        const match = liveMatches[0]
                        const homeTeam = match.homeTeam
                        const awayTeam = match.awayTeam
                        const score = match.score
                        await sock.sendMessage(jid, {
                            react: {
                                text: "✅",
                                key: msg.key
                            }
                        })
                        
                        // Générer l'image du match
                        const matchImage = await generateMatchImage(homeTeam, awayTeam, score, match, match.competition.name)
                        if (matchImage) {
                            await sock.sendMessage(jid, {
                                image: matchImage,
                                caption: `⚽ ${homeTeam.name} vs ${awayTeam.name}\n📊 ${score.fullTime.home} - ${score.fullTime.away} | ${match.status} (${match.minute}')`
                            }, { quoted: msg })
                        } else {
                            // Fallback sur le texte
                            const matchMessage = `⚽ *MATCH EN COURS*\n\n` +
                                `🏟️ ${homeTeam.name} vs ${awayTeam.name}\n` +
                                `📊 Score: ${score.fullTime.home} - ${score.fullTime.away}\n` +
                                `⏱️ ${match.status} (${match.minute}')\n` +
                                `🏆 ${match.competition.name}`
                            await sock.sendMessage(jid, {
                                text: matchMessage
                            }, { quoted: msg })
                        }
                    }
                } catch (error) {
                    console.error('❌ Erreur football:', error)
                    await sock.sendMessage(jid, {
                        react: {
                            text: "❌",
                            key: msg.key
                        }
                    })
                    await sock.sendMessage(jid, {
                        text: "❌ Erreur récupération résultats football.\n💡 Obtenez une clé API gratuite sur: https://www.football-data.org/"
                    }, { quoted: msg })
                }
            }
            // HELP
            if (cleanText === "!help") {
                try {
                    const helpMessage = `╭───〔  📚 COMMANDES 〕───⬣
│
│  📊 *STATISTIQUES*
│  !msgcount • !msgcount @user • !top • !groupstats • !restore
│  !scores - Classement joueurs
│
│  🎮 *JEUX QUIZ (15 jeux)*
│  !jeu - Jeu aléatoire
│  !culture - Culture générale (12 pts)
│  !country - Pays (8 pts, indices)
│  !capitale - Capitales (8 pts, indices)
│  !vraioufaux - Vrai/Faux (explications)
│  !devine - Devine le mot (8 pts, indices)
│  !monument - Monuments (9 pts, indices)
│  !drapeau - Drapeaux (9 pts, indices)
│  !science - Science (indices)
│  !sport - Sport (indices)
│  !cinema - Cinéma (indices)
│  !histoire - Histoire (indices)
│  !math - Maths (5 pts)
│  !logique - Logique (indices)
│  !indice - Donner un indice
│
│  🎌 *JEUX OTAKUS*
│  !otaku - Jeu otaku aléatoire
│  !anime - Quiz anime (8 pts)
│  !manga - Quiz manga (8 pts)
│  !personnage - Quiz personnages (7 pts)
│  !opening - Quiz openings (6 pts)
│  !seiyuu - Quiz seiyuu (9 pts)
│  !battle @joueur - Battle 1v1 OTAKU
│  !organisation [nom] - Crée/rejoint organisation
│  !mon organisation - Voir son organisation
│  !debug org - Debug organisations
│
│  💘 *FUN & SOCIAL*
│  !couple • !crush • !mariage • !ship • !love
│  !roll - Lancer un dé
│  !8ball - Boule magique
│  !aouv - Action ou Vérité (200+ questions)
│  !debat - Lancer un débat
│  !lastcry - Dernier survivant
│
│  🐺 *LOUP-GAROU*
│  !loup create [n] - Crée partie (4-20 joueurs)
│  !loup join - Rejoindre partie
│  !loup start - Démarrer partie
│  !loup status - État partie
│  !vote - Vote pour éliminer
│
│  👥 *GESTION GROUPE*
│  !promote • !demote • !kick • !warn • !unwarn
│  !add • !link • !desc • !subject
│  !ferme • !ouvre • !admins • !setup
│  !tagall - Mentionner tout le groupe
│  !resetscore - Réinitialiser scores
│  !welcome on/off - Message bienvenue
│  !antilink on/off - Anti-lien
│
│  📥 *UTILITAIRES*
│  !play nom - Télécharger musique
│  !qr [texte] - Générer QR code
│  !profil [@user] - Photo de profil
│  !foot [équipe] - Résultats football
│  !ghost - Extraire média fantôme
│  !v - Télécharger contenu message
│  !sticker - Convertir en sticker
│  !stickers - Voir packs créés
│  !info • !help • !myid
│
│  📈 *TOTAL : 60+ COMMANDES*
│
╰════════════════════════⬣`
                    await sock.sendMessage(jid, { text: helpMessage }, { quoted: msg })
                } catch (error) {
                    console.error("Erreur help:", error)
                    await sock.sendMessage(jid, { 
                        text: "❌ Erreur lors de l'affichage de l'aide" 
                    }, { quoted: msg })
                }
                return;
            }
            // ====================
            // SYSTÈME DE BATTLE OTAKU 1v1
            // ====================
            // REJOINDRE UNE ORGANISATION
            if (cleanText.startsWith("!organisation ")) {
                if (!jid.endsWith("@g.us")) return
                const orgName = cleanText.substring(13).trim()
                const senderJid = msg.key.participant
                if (!orgName) {
                    await sock.sendMessage(jid, { 
                        text: "❌ Usage: !organisation [nom]\n\n💡 Crée ou rejoint une organisation avec le nom de ton choix !" 
                    }, { quoted: msg })
                    return
                }
                // Si l'organisation n'existe pas, la créer
                if (!otakuOrganisations[orgName]) {
                    otakuOrganisations[orgName] = {
                        name: orgName,
                        emoji: "🏢",
                        color: "#" + Math.floor(Math.random()*16777215).toString(16),
                        description: `Organisation créée par les membres`,
                        members: []
                    }
                    saveOtakuOrganisations()
                    await sock.sendMessage(jid, { 
                        text: `🎉 *NOUVELLE ORGANISATION CRÉÉE* 🎉
🏢 *${orgName}* vient d'être créée !
📝 Description: Organisation créée par les membres
🎯 Tu es le premier membre !
💡 Invite d'autres joueurs avec !organisation ${orgName}`
                    }, { quoted: msg })
                }
                const success = joinOrganisation(senderJid, orgName)
                if (success) {
                    const org = otakuOrganisations[orgName]
                    const memberCount = org.members ? org.members.length : 0
                    await sock.sendMessage(jid, { 
                        text: `🎉 Bienvenue dans ${org.emoji} *${org.name}* !
${org.description}
👥 Membres: ${memberCount}
🎯 Tu peux maintenant défier d'autres organisations avec !battle !
💡 Fais grandir ton organisation en invitant des amis !`
                    }, { quoted: msg })
                } else {
                    await sock.sendMessage(jid, { 
                        text: "❌ Erreur lors de l'inscription à l'organisation !" 
                    }, { quoted: msg })
                }
            }
            // VOIR SON ORGANISATION
            if (cleanText === "!mon organisation") {
                if (!jid.endsWith("@g.us")) return
                const senderJid = msg.key.participant
                const orgName = getPlayerOrganisation(senderJid)
                if (!orgName) {
                    await sock.sendMessage(jid, { 
                        text: "❌ Tu n'appartiens à aucune organisation !\n\n💡 Rejoins-en une avec !organisation [nom]" 
                    }, { quoted: msg })
                    return
                }
                const org = otakuOrganisations[orgName]
                const members = org.members || []
                const memberCount = members.length
                await sock.sendMessage(jid, { 
                    text: `╭───〔  ${org.emoji} TON ORGANISATION 〕───⬣
│
│🏢 *${org.name}*
│📝 ${org.description}
│
│👥 Membres: ${memberCount}
│🎯 Ton rang: ${memberCount <= 3 ? '🌟 Novice' : memberCount <= 7 ? '⚡ Expert' : '🔥 Légende'}
│
│💡 Fais grandir ton organisation avec !battle !
╰════════════════════════⬣`
                }, { quoted: msg })
            }
            // DEBUG ORGANISATIONS
            if (cleanText === "!debug org") {
                if (!jid.endsWith("@g.us")) return
                const orgList = Object.keys(otakuOrganisations).map(name => {
                    const org = otakuOrganisations[name]
                    const memberCount = org.members ? org.members.length : 0
                    return `${org.emoji} ${name} (${memberCount} membres)`
                }).join('\n│')
                await sock.sendMessage(jid, { 
                    text: `╭───〔  🔍 DEBUG ORGANISATIONS 〕───⬣
│
│${orgList || '❌ Aucune organisation trouvée !'}
│
│📁 Total organisations: ${Object.keys(otakuOrganisations).length}
│💡 Si vide, redémarre le bot !
╰════════════════════════⬣`
                }, { quoted: msg })
            }
            // LANCER UN BATTLE 1v1
            if (cleanText.startsWith("!battle ")) {
                if (!jid.endsWith("@g.us")) return
                const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
                if (!mentioned) {
                    await sock.sendMessage(jid, { 
                        text: "❌ Usage: !battle @joueur\n\n💡 Défie un joueur d'une autre organisation !" 
                    }, { quoted: msg })
                    return
                }
                // Vérifier si un battle est déjà en cours
                if (activeBattles.has(jid)) {
                    await sock.sendMessage(jid, { 
                        text: "❌ Un battle est déjà en cours dans ce groupe !" 
                    }, { quoted: msg })
                    return
                }
                const challengerJid = msg.key.participant
                const opponentJid = mentioned
                const challengerOrg = getPlayerOrganisation(challengerJid)
                const opponentOrg = getPlayerOrganisation(opponentJid)
                if (!challengerOrg) {
                    await sock.sendMessage(jid, { 
                        text: "❌ Tu dois appartenir à une organisation pour lancer un battle !\n\n💡 Rejoins-en une avec !organisation [nom]" 
                    }, { quoted: msg })
                    return
                }
                if (!opponentOrg) {
                    await sock.sendMessage(jid, { 
                        text: "❌ @" + opponentJid.split('@')[0] + " n'appartient à aucune organisation !\n\n💡 Il doit rejoindre une organisation avec !organisation [nom]" 
                    }, { quoted: msg })
                    return
                }
                if (challengerOrg === opponentOrg) {
                    await sock.sendMessage(jid, { 
                        text: "❌ Vous êtes dans la même organisation !\n\n💡 Tu ne peux défier que des joueurs d'organisations différentes !" 
                    }, { quoted: msg })
                    return
                }
                // Lancer le battle immédiatement
                await startOtakuBattle(jid, challengerJid, opponentJid, challengerOrg, opponentOrg, sock)
            }
            // BATTLE SANS MENTION (liste des commandes)
            if (cleanText === "!battle") {
                if (!jid.endsWith("@g.us")) return
                await sock.sendMessage(jid, { 
                    text: `⚔️ *BATTLE OTAKU 1v1* ⚔️
🎯 *Comment utiliser:*
!battle @joueur
📋 *Conditions:*
• Les 2 joueurs doivent être dans des organisations différentes
• Seul le premier qui répond marque 3 points
• 10 questions OTAKU expertes
• 30 secondes par question
💡 Rejoins une organisation avec !organisation [nom]`
                }, { quoted: msg })
            }
            // INFO
            if (cleanText === "!info") {
                const infoMsg = `╭───〔  🤖 INFO BOT 〕───⬣
│◦❒ 📱 Bot WhatsApp Multi-fonctions
│◦❒ ⚡ Version : 3.1
│◦❒ 👨‍💻 Créateur : _?
│◦❒ 
│◦❒ ✨ Bot actif et prêt !
│◦❒ 🎮 15 jeux • 60+ commandes
╰════════════════════════⬣`
                await sock.sendMessage(jid, { text: infoMsg }, { quoted: msg })
            }
        } catch (error) {
            console.error("Erreur message:", error)
        }
}
// Démarrer le bot
async function startBot() {
    try {
        console.log("🚀 Démarrage du bot...")
        await loadConfig()
        await loadWarns()
        await loadMessageCounts()
        await loadProfiles()
        await loadStickerPacks() // Charger les packs de stickers
        await loadScores()
        await loadGroups()
        await loadOtakuOrganisations() // Charger les organisations otaku
        await loadOtakuBattles() // Charger les battles otaku
        const { state, saveCreds } = await useMultiFileAuthState('./auth')
        const { version, isLatest } = await fetchLatestBaileysVersion()
        console.log(`📱 Version WhatsApp Web: ${version}, Latest: ${isLatest}`)
        
        // Désactiver le système de pairing code - utiliser uniquement QR code
        delete process.env.PIPCHI_PAIRING_PHONE
        
        const sock = makeWASocket({
            auth: state,
            version,
            printQRInTerminal: false,
            browser: ['PipChi-Bot', 'Chrome', '120.0.0.0'],
            markOnlineOnConnect: true,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 25000,
            emitOwnEvents: false
        })
        
        if (!state.creds.registered) {
            console.log("\n📱 En attente du QR code pour la connexion...\n")
            console.log("Scanne le QR code ci-dessous avec WhatsApp :\n")
        }
        const sendPendingBroadcasts = async () => {
            const broadcastsFile = process.env.PIPCHI_BROADCASTS_FILE
            const ownerPhone = String(process.env.PIPCHI_OWNER_PHONE || '').replace(/\D/g, '')
            const currentUserId = process.env.PIPCHI_USER_ID || 'default'
            if (!broadcastsFile || !ownerPhone || !fs.existsSync(broadcastsFile)) return
            try {
                const broadcasts = JSON.parse(fs.readFileSync(broadcastsFile, 'utf8'))
                let changed = false
                for (const item of broadcasts) {
                    item.deliveredTo = item.deliveredTo || {}
                    if (item.deliveredTo[currentUserId]) continue
                    const text = `PipChi - ${item.title || 'Annonce'}\n\n${item.message || ''}`
                    await sock.sendMessage(`${ownerPhone}@s.whatsapp.net`, { text })
                    item.deliveredTo[currentUserId] = new Date().toISOString()
                    changed = true
                }
                if (changed) fs.writeFileSync(broadcastsFile, JSON.stringify(broadcasts, null, 2))
            } catch (error) {
                console.log("Erreur annonces dashboard:", error.message)
            }
        }
        sock.ev.on('connection.update', (update) => {
            const { connection, qr, lastDisconnect } = update
            console.log('📊 Connection update:', { connection, qr: !!qr })
            if (qr) {
                console.clear()
                console.log(" Scanne ce QR code avec WhatsApp :\n")
                qrcode.generate(qr, { small: true, margin: 0, scale: 0.25 })
            }
            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) && 
                                   (lastDisconnect?.error?.output?.statusCode !== 401) &&
                                   (lastDisconnect?.error?.message !== 'Connection closed')
                console.log('🔌 Connexion fermée, reconnexion:', shouldReconnect)
                console.log('Détail erreur:', lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.message)
                if (shouldReconnect) {
                    setTimeout(startBot, 5000)
                } else {
                    console.log('🛑 Déconnexion manuelle ou logout')
                }
            } else if (connection === 'open') {
                console.log('✅ Bot connecté !')
                sendPendingBroadcasts()
                setInterval(sendPendingBroadcasts, 60000).unref()
            } else if (connection === 'connecting') {
                console.log('🔄 Connexion en cours...')
            }
        })
        sock.ev.on('creds.update', saveCreds)
        // Gérer les erreurs du socket
        sock.ev.on('error', (error) => {
            console.error('❌ Erreur socket:', error.message)
            if (error.message.includes('405') || error.message.includes('Method Not Allowed')) {
                console.log('🔄 Erreur 405 détectée, tentative de reconnexion...')
                setTimeout(startBot, 5000)
            }
        })
        sock.ev.on('messages.upsert', async (m) => {
            const msg = m.messages[0]
            if (!msg.message) return
            if (msg.key.remoteJid === 'status@broadcast') return
            // Ignorer les messages historiques (plus de 60 secondes)
            const messageTime = msg.messageTimestamp || msg.timestamp
            const currentTime = Math.floor(Date.now() / 1000)
            if (messageTime && (currentTime - messageTime > 60)) {
                return
            }
            const jid = msg.key.remoteJid
            const text = msg.message.conversation ||
                       msg.message.extendedTextMessage?.text ||
                       msg.message.imageMessage?.caption || ""
            console.log(`Message de ${jid}: ${text}`)
            await handleMessage(sock, msg, text, jid)
        })
        // GROUPE PARTICIPANTS UPDATE (welcome)
        sock.ev.on("group-participants.update", async ({ id, participants, action }) => {
            if (action === 'add' && config[id]?.welcome) {
                for (const participant of participants) {
                    const name = participant.id ? participant.id.split('@')[0] : participant.split('@')[0]
                    const welcomeMsg = `╭───〔  👋 BIENVENUE 〕───⬣
│◦❒ 🌟 @${name}
│◦❒ 
│◦❒ 🎉 Bienvenue dans notre super groupe !
│◦❒ 📖 Prends le temps de lire les règles
│◦❒ 🤝 Participe et amuse-toi !
│◦❒ 
│◦❒ ✨ Respect et bonne humeur !
╰════════════════════════⬣`
                    await sock.sendMessage(id, {
                        text: welcomeMsg,
                        mentions: [participant.id || participant]
                    })
                }
            }
        })
    } catch (error) {
        console.error("Erreur démarrage bot:", error)
        // Ne redémarrer que si ce n'est pas une erreur critique
        if (!error.message.includes('EADDRINUSE') && !error.message.includes('already running')) {
            setTimeout(startBot, 5000)
        } else {
            console.error("Erreur critique, arrêt du bot.")
        }
    }
}
// Lancer le bot
startBot()
