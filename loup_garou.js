// LOUP-GAROU - Système complet de jeu
const loupGarouGames = new Map() // Stocke les parties en cours
const loupGarouVotes = new Map() // Stocke les votes en cours

// Rôles disponibles dans le jeu
const roles = {
    LOUP: "🐺 Loup-Garou",
    VILLAGEOIS: "👨‍🌾 Villageois",
    VOYANTE: "🔮 Voyante",
    CHASSEUR: "🏹 Chasseur",
    CUPIDON: "💕 Cupidon",
    SORCIERE: "🧙‍♀️ Sorcière",
    PETITE_FILLE: "👧 Petite Fille",
    VOLEUR: "🦹 Voleur",
    CAPITAINE: "👑 Capitaine",
    GARDE: "🛡️ Garde"
}

// Fonctions utilitaires pour le Loup-Garou
function createLoupGarouGame(groupId, creatorId, playerCount) {
    const gameId = `loup_${groupId}_${Date.now()}`
    
    const game = {
        id: gameId,
        groupId: groupId,
        creatorId: creatorId,
        playerCount: playerCount,
        players: new Map(),
        phase: "waiting", // waiting, setup, night, day, vote, ended
        round: 0,
        roles: new Map(),
        votes: new Map(),
        nightActions: new Map(),
        dayActions: new Map(),
        lovers: [],
        deadPlayers: new Set(),
        protectedPlayer: null,
        lastKilled: null,
        voteResults: new Map(),
        winner: null,
        createdAt: Date.now()
    }
    
    loupGarouGames.set(gameId, game)
    return game
}

function addPlayerToGame(gameId, playerId, playerName) {
    const game = loupGarouGames.get(gameId)
    if (!game || game.players.size >= game.playerCount) return false
    
    game.players.set(playerId, {
        id: playerId,
        name: playerName,
        role: null,
        alive: true,
        lover: false,
        protected: false,
        hasVoted: false,
        hasUsedNightAction: false
    })
    
    return true
}

function assignRoles(game) {
    const players = Array.from(game.players.keys())
    const playerCount = players.length
    
    // Distribution des rôles selon le nombre de joueurs
    let roleDistribution = []
    
    if (playerCount >= 4 && playerCount <= 6) {
        roleDistribution = [
            "LOUP", "LOUP", "VOYANTE", "VILLAGEOIS"
        ]
        if (playerCount >= 5) roleDistribution.push("VILLAGEOIS")
        if (playerCount >= 6) roleDistribution.push("CHASSEUR")
    } else if (playerCount >= 7 && playerCount <= 9) {
        roleDistribution = [
            "LOUP", "LOUP", "VOYANTE", "CHASSEUR", "SORCIERE", "VILLAGEOIS", "VILLAGEOIS"
        ]
        if (playerCount >= 8) roleDistribution.push("CUPIDON")
        if (playerCount >= 9) roleDistribution.push("VILLAGEOIS")
    } else if (playerCount >= 10 && playerCount <= 12) {
        roleDistribution = [
            "LOUP", "LOUP", "VOYANTE", "CHASSEUR", "SORCIERE", "CUPIDON", 
            "PETITE_FILLE", "VILLAGEOIS", "VILLAGEOIS", "VILLAGEOIS"
        ]
        if (playerCount >= 11) roleDistribution.push("VOLEUR")
        if (playerCount >= 12) roleDistribution.push("GARDE")
    } else if (playerCount >= 13 && playerCount <= 15) {
        roleDistribution = [
            "LOUP", "LOUP", "LOUP", "VOYANTE", "CHASSEUR", "SORCIERE", "CUPIDON",
            "PETITE_FILLE", "VOLEUR", "GARDE", "CAPITAINE", "VILLAGEOIS", "VILLAGEOIS"
        ]
        if (playerCount >= 14) roleDistribution.push("VILLAGEOIS")
        if (playerCount >= 15) roleDistribution.push("VILLAGEOIS")
    } else if (playerCount >= 16 && playerCount <= 20) {
        roleDistribution = [
            "LOUP", "LOUP", "LOUP", "LOUP", "VOYANTE", "CHASSEUR", "SORCIERE", "CUPIDON",
            "PETITE_FILLE", "VOLEUR", "GARDE", "CAPITAINE", "VILLAGEOIS", "VILLAGEOIS", "VILLAGEOIS", "VILLAGEOIS"
        ]
        if (playerCount >= 17) roleDistribution.push("VILLAGEOIS")
        if (playerCount >= 18) roleDistribution.push("VILLAGEOIS")
        if (playerCount >= 19) roleDistribution.push("VILLAGEOIS")
        if (playerCount >= 20) roleDistribution.push("VILLAGEOIS")
    }
    
    // Mélanger les rôles
    roleDistribution = roleDistribution.sort(() => Math.random() - 0.5)
    
    // Assigner les rôles aux joueurs
    players.forEach((playerId, index) => {
        if (index < roleDistribution.length) {
            const role = roleDistribution[index]
            game.players.get(playerId).role = role
            game.roles.set(role, (game.roles.get(role) || 0) + 1)
        }
    })
    
    return true
}

function startGame(game) {
    if (!assignRoles(game)) return false
    
    game.phase = "night"
    game.round = 1
    
    // Envoyer les rôles privés
    const roleMessages = []
    
    game.players.forEach((player, playerId) => {
        if (player.role) {
            const roleMsg = `╭───〔  🎭 TON RÔLE 〕───⬣
│◦❒ ${roles[player.role]}
│◦❒ 🎮 Partie #${game.id.split('_')[2]}
│◦❒ 🌙 Nuit ${game.round}
│◦❒ 
│◦❒ ${getRoleDescription(player.role)}
│◦❒ 
│◦❒ 📝 Utilise les commandes privées:
│◦❒ !kill @joueur (Loups)
│◦❒ !see @joueur (Voyante)
│◦❒ !protect @joueur (Sorcière)
│◦❒ !shoot @joueur (Chasseur mort)
│◦❒ 
│◦❒ 🤫 Ton rôle est SECRET !
╰════════════════════════⬣`
            
            roleMessages.push({
                userId: playerId,
                message: roleMsg
            })
        }
    })
    
    return roleMessages
}

function getRoleDescription(role) {
    const descriptions = {
        "LOUP": "🐺 Chaque nuit, tu choisis une victime à éliminer avec les autres loups. Tu dois faire gagner le clan des loups.",
        "VILLAGEOIS": "👨‍🌾 Tu n'as aucun pouvoir spécial mais tu votes chaque jour pour éliminer un loup. Le village doit gagner !",
        "VOYANTE": "🔮 Chaque nuit, tu peux espionner un joueur pour découvrir son vrai rôle. Utilise ton pouvoir avec sagesse.",
        "CHASSEUR": "🏹 Quand tu meurs, tu peux tirer sur un joueur et l'éliminer avec toi. Venge-toi intelligemment.",
        "CUPIDON": "💕 Au début du jeu, tu choisis 2 amants qui mourront ensemble. Un amour éternel... ou fatal.",
        "SORCIERE": "🧙‍♀️ Tu as une potion de vie (sauver) et une potion de mort (tuer). Utilise-les stratégiquement.",
        "PETITE_FILLE": "👧 Tu peux espionner les loups la nuit sans être vue. Mais si tu te fais repérer, tu meurs.",
        "VOLEUR": "🦹 Au début, tu peux voler le rôle de 2 joueurs et choisir celui que tu veux. Deviens ce que tu voles.",
        "CAPITAINE": "👑 Ton vote compte double. Si tu meurs, tu passes ton brassard à un joueur de ton choix.",
        "GARDE": "🛡️ Chaque nuit, tu peux protéger un joueur (sauf toi-même 2 fois de suite). Sauve le village !"
    }
    
    return descriptions[role] || "Rôle mystérieux..."
}

function processNightActions(game) {
    const results = {
        killed: [],
        saved: [],
        protected: null,
        seen: [],
        lovers: []
    }
    
    // Traiter les actions des loups
    const loupActions = []
    game.nightActions.forEach((action, playerId) => {
        const player = game.players.get(playerId)
        if (player.role === "LOUP" && action.type === "kill") {
            loupActions.push(action.target)
        }
    })
    
    // Compter les votes des loups
    const loupVotes = {}
    loupActions.forEach(target => {
        loupVotes[target] = (loupVotes[target] || 0) + 1
    })
    
    // Trouver la victime (majorité des loups)
    let maxVotes = 0
    let victim = null
    
    Object.entries(loupVotes).forEach(([target, votes]) => {
        if (votes > maxVotes) {
            maxVotes = votes
            victim = target
        }
    })
    
    // Vérifier la protection de la sorcière
    game.nightActions.forEach((action, playerId) => {
        const player = game.players.get(playerId)
        
        if (player.role === "SORCIERE") {
            if (action.type === "save" && action.target === victim) {
                results.saved.push(victim)
                victim = null
            } else if (action.type === "kill" && action.target) {
                results.killed.push(action.target)
            }
        }
        
        if (player.role === "GARDE" && action.type === "protect") {
            results.protected = action.target
        }
        
        if (player.role === "VOYANTE" && action.type === "see") {
            const targetPlayer = game.players.get(action.target)
            if (targetPlayer) {
                results.seen.push({
                    voyante: playerId,
                    target: action.target,
                    role: targetPlayer.role
                })
            }
        }
    })
    
    // Appliquer la victime si pas protégée
    if (victim && victim !== results.protected) {
        results.killed.push(victim)
    }
    
    return results
}

function processDayVotes(game) {
    const votes = {}
    
    game.votes.forEach((target, voterId) => {
        votes[target] = (votes[target] || 0) + 1
    })
    
    // Trouver le joueur avec le plus de votes
    let maxVotes = 0
    let eliminated = null
    
    Object.entries(votes).forEach(([target, voteCount]) => {
        if (voteCount > maxVotes) {
            maxVotes = voteCount
            eliminated = target
        }
    })
    
    return eliminated
}

function checkWinCondition(game) {
    const alivePlayers = Array.from(game.players.values()).filter(p => p.alive)
    const aliveLoups = alivePlayers.filter(p => p.role === "LOUP")
    const aliveVillagers = alivePlayers.filter(p => p.role !== "LOUP")
    
    // Vérifier si les loups gagnent
    if (aliveLoups.length >= aliveVillagers.length) {
        game.winner = "LOUP"
        game.phase = "ended"
        return "LOUP"
    }
    
    // Vérifier si le village gagne
    if (aliveLoups.length === 0) {
        game.winner = "VILLAGE"
        game.phase = "ended"
        return "VILLAGE"
    }
    
    // Vérifier si les amants gagnent
    const aliveLovers = alivePlayers.filter(p => p.lover)
    if (aliveLovers.length === 2 && alivePlayers.length === 2) {
        game.winner = "LOVERS"
        game.phase = "ended"
        return "LOVERS"
    }
    
    return null
}

function eliminatePlayer(game, playerId, reason = "game") {
    const player = game.players.get(playerId)
    if (!player || !player.alive) return false
    
    player.alive = false
    game.deadPlayers.add(playerId)
    
    // Action du chasseur
    if (player.role === "CHASSEUR" && reason === "game") {
        // Le chasseur peut tirer
        return {
            type: "chasseur_shot",
            chasseur: playerId,
            message: `🏹 ${player.name} (Chasseur) est mort ! Il peut tirer sur quelqu'un avec !shoot @joueur`
        }
    }
    
    return true
}

function getGameStatus(game) {
    const alivePlayers = Array.from(game.players.values()).filter(p => p.alive)
    const deadPlayers = Array.from(game.players.values()).filter(p => !p.alive)
    
    const status = `╭───〔  🐺 LOUP-GAROU 〕───⬣
│◦❒ 🎮 Partie #${game.id.split('_')[2]}
│◦❒ 🌙 ${game.phase === "night" ? "Nuit" : game.phase === "day" ? "Jour" : game.phase.toUpperCase()}
│◦❒ 📊 Round ${game.round}
│◦❒ 
│◦❒ 👥 Joueurs: ${alivePlayers.length}/${game.players.length}
│◦❒ 💀 Morts: ${deadPlayers.length}
│◦❒ 
│◦❒ 📋 Joueurs vivants:`
    
    alivePlayers.forEach(player => {
        status += `\n│◦❒ • ${player.name}`
    })
    
    if (deadPlayers.length > 0) {
        status += `\n│◦❒ \n│◦❒ ⚰️ Joueurs morts:`
        deadPlayers.forEach(player => {
            status += `\n│◦❒ • ${player.name} (${roles[player.role]})`
        })
    }
    
    status += `\n╰════════════════════════⬣`
    
    return status
}

function getRoleList(game) {
    const roleCount = {}
    
    game.players.forEach(player => {
        if (player.role) {
            roleCount[player.role] = (roleCount[player.role] || 0) + 1
        }
    })
    
    let roleList = `🎭 Distribution des rôles:\n`
    
    Object.entries(roleCount).forEach(([role, count]) => {
        roleList += `${roles[role]}: ${count}\n`
    })
    
    return roleList
}

function resetGame(game) {
    game.votes.clear()
    game.nightActions.clear()
    game.dayActions.clear()
    game.voteResults.clear()
    
    game.players.forEach(player => {
        player.hasVoted = false
        player.hasUsedNightAction = false
        player.protected = false
    })
}

// Fonctions pour les commandes du jeu
function handleLoupCommand(sock, msg, text, jid, userId) {
    const args = text.split(' ')
    
    if (args[1] === "create") {
        const playerCount = parseInt(args[2]) || 6
        
        if (playerCount < 4 || playerCount > 20) {
            return sock.sendMessage(jid, {
                text: "❌ Le nombre de joueurs doit être entre 4 et 20 !"
            }, { quoted: msg })
        }
        
        // Vérifier si une partie existe déjà
        const existingGame = Array.from(loupGarouGames.values()).find(g => 
            g.groupId === jid && g.phase !== "ended"
        )
        
        if (existingGame) {
            return sock.sendMessage(jid, {
                text: "❌ Une partie est déjà en cours dans ce groupe !"
            }, { quoted: msg })
        }
        
        const game = createLoupGarouGame(jid, userId, playerCount)
        
        const createMsg = `╭───〔  🐺 LOUP-GAROU 〕───⬣
│◦❒ 🎮 Partie créée !
│◦❒ 👑 Créateur: @${userId.split('@')[0]}
│◦❒ 👥 Joueurs requis: ${playerCount}
│◦❒ 🆔 Partie: #${game.id.split('_')[2]}
│◦❒ 
│◦❒ 📋 Commandes:
│◦❒ !loup join - Rejoindre
│◦❒ !loup start - Démarrer (créateur)
│◦❒ !loup status - Voir l'état
│◦❒ 
│◦❒ 🎯 Rejoignez la partie !
╰════════════════════════⬣`
        
        return sock.sendMessage(jid, {
            text: createMsg,
            mentions: [userId]
        }, { quoted: msg })
    }
    
    if (args[1] === "join") {
        const game = Array.from(loupGarouGames.values()).find(g => 
            g.groupId === jid && g.phase === "waiting"
        )
        
        if (!game) {
            return sock.sendMessage(jid, {
                text: "❌ Aucune partie en attente ! Créez-en une avec !loup create [nombre]"
            }, { quoted: msg })
        }
        
        if (game.players.has(userId)) {
            return sock.sendMessage(jid, {
                text: "❌ Tu es déjà dans la partie !"
            }, { quoted: msg })
        }
        
        if (game.players.size >= game.playerCount) {
            return sock.sendMessage(jid, {
                text: "❌ La partie est déjà complète !"
            }, { quoted: msg })
        }
        
        const playerName = msg.pushName || `Joueur${game.players.size + 1}`
        
        if (addPlayerToGame(game.id, userId, playerName)) {
            const joinMsg = `✅ @${userId.split('@')[0]} a rejoint la partie !\n\n${getGameStatus(game)}`
            
            return sock.sendMessage(jid, {
                text: joinMsg,
                mentions: [userId]
            }, { quoted: msg })
        } else {
            return sock.sendMessage(jid, {
                text: "❌ Erreur en rejoignant la partie !"
            }, { quoted: msg })
        }
    }
    
    if (args[1] === "start") {
        const game = Array.from(loupGarouGames.values()).find(g => 
            g.groupId === jid && g.phase === "waiting"
        )
        
        if (!game) {
            return sock.sendMessage(jid, {
                text: "❌ Aucune partie à démarrer !"
            }, { quoted: msg })
        }
        
        if (game.creatorId !== userId) {
            return sock.sendMessage(jid, {
                text: "❌ Seul le créateur peut démarrer la partie !"
            }, { quoted: msg })
        }
        
        if (game.players.size < 4) {
            return sock.sendMessage(jid, {
                text: "❌ Il faut au moins 4 joueurs pour démarrer !"
            }, { quoted: msg })
        }
        
        game.playerCount = game.players.size
        
        // Démarrer la partie
        const roleMessages = startGame(game)
        
        const startMsg = `╭───〔  🐺 LOUP-GAROU 〕───⬣
│◦❒ 🎮 Partie démarrée !
│◦❒ 🌙 Nuit ${game.round}
│◦❒ 👥 ${game.players.size} joueurs
│◦❒ 
│◦❒ 🎭 Les rôles ont été distribués !
│◦❒ 📱 Vérifiez vos messages privés
│◦❒ 
│◦❒ 🤫 C'est le début de la nuit...
│◦❒ 🌙 Les loups se réveillent...
╰════════════════════════⬣`
        
        // Envoyer le message de démarrage
        sock.sendMessage(jid, { text: startMsg }, { quoted: msg })
        
        // Envoyer les rôles privés
        roleMessages.forEach(async ({ userId, message }) => {
            try {
                await sock.sendMessage(userId, { text: message })
            } catch (error) {
                console.log("Erreur envoi rôle privé:", error)
            }
        })
        
        return
    }
    
    if (args[1] === "status") {
        const game = Array.from(loupGarouGames.values()).find(g => 
            g.groupId === jid && g.phase !== "ended"
        )
        
        if (!game) {
            return sock.sendMessage(jid, {
                text: "❌ Aucune partie en cours !"
            }, { quoted: msg })
        }
        
        const statusMsg = getGameStatus(game)
        
        return sock.sendMessage(jid, {
            text: statusMsg
        }, { quoted: msg })
    }
    
    // Commande par défaut
    const helpMsg = `╭───〔  🐺 LOUP-GAROU 〕───⬣
│◦❒ 📋 Commandes disponibles:
│◦❒ 
│◦❒ !loup create [4-20] - Créer une partie
│◦❒ !loup join - Rejoindre une partie
│◦❒ !loup start - Démarrer (créateur)
│◦❒ !loup status - Voir l'état
│◦❒ 
│◦❒ 🌙 Actions de nuit (privées):
│◦❒ !kill @joueur (Loups)
│◦❒ !see @joueur (Voyante)
│◦❒ !save @joueur (Sorcière)
│◦❒ !poison @joueur (Sorcière)
│◦❒ !protect @joueur (Garde)
│◦❒ 
│◦❒ ☀️ Actions de jour:
│◦❒ !vote @joueur - Voter
│◦❒ !shoot @joueur (Chasseur mort)
│◦❒ 
│◦❒ 🎮 4-20 joueurs requis
╰════════════════════════⬣`
    
    return sock.sendMessage(jid, { text: helpMsg }, { quoted: msg })
}

// Exporter les fonctions et données
module.exports = {
    loupGarouGames,
    loupGarouVotes,
    roles,
    createLoupGarouGame,
    addPlayerToGame,
    assignRoles,
    startGame,
    getRoleDescription,
    processNightActions,
    processDayVotes,
    checkWinCondition,
    eliminatePlayer,
    getGameStatus,
    getRoleList,
    resetGame,
    handleLoupCommand
}
