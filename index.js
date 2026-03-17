const { default: makeWASocket, fetchLatestBaileysVersion, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const qrcode = require("qrcode-terminal")
const fs = require("fs")

// ====================
// FICHIERS DE CONFIG
// ====================
const GROUPS_FILE = "./auth/groups.json"
const CONFIG_FILE = "./auth/config.json"
const WARNS_FILE = "./auth/warns.json"
const MESSAGES_FILE = "./auth/messages.json"
const PROFILES_FILE = "./auth/profiles.json"

// ====================
// STRUCTURES DE DONNÉES
// ====================
const activeGames = new Map() // Jeux en cours
const scores = new Map() // Scores des joueurs: { user_jid: { total: number, games: number } }
let messageCounts = {} // { group_jid: { user_jid: number } }
let userProfiles = {} // { user_jid: { messages: number, level: number, xp: number, warns: number } }
const gameTimers = new Map() // Chronomètres pour les jeux
const usedQuestions = new Map() // Questions déjà utilisées: { group_jid: { country: [], vraioufaux: [], capitale: [], devine: [] } }

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
]

// Questions pour vrai ou faux
const trueFalseQuestions = [
    // Science et Nature
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
    { question: "Les plus anciennes formes de sport sont inexistantes", answer: true, explanation: "Il n'y avait pas de sport traditionnel en Antarctique !" },
    { question: "Les plus grands systèmes de golfes d'Antarctique sont le Weddell", answer: true, explanation: "La mer de Weddell est immense !" },
    { question: "Les plus anciennes formes de jeux sont inexistantes", answer: true, explanation: "Il n'y avait pas de jeux traditionnels en Antarctique !" },
    { question: "Les plus grandes îles d'Antarctique sont Alexandre", answer: true, explanation: "L'île Alexandre est la plus grande île d'Antarctique !" },
    { question: "Les aigles peuvent tuer des cerfs", answer: true, explanation: "Correct !" },
    { question: "Les tortues peuvent vivre 200 ans", answer: true, explanation: "Correct !" },
    { question: "Les abeilles dansent avant de mourir", answer: false, explanation: "Les abeilles meurent après avoir piqué !" },
    { question: "Les éponges sont des animaux", answer: false, explanation: "Les éponges sont des végétaux !" },
    { question: "Les licornes ont existé", answer: false, explanation: "Les licornes sont mythiques !" },
    { question: "Les dinosaures vivaient avec les humains", answer: false, explanation: "Ils ont disparu il y a 65 millions d'années !" },
    { question: "Le Coca-Cola était vert", answer: true, explanation: "Correct !" },
    { question: "Les vers de terre sont des insectes", answer: false, explanation: "Ce sont des annélides !" },
    { question: "Les papillons de nuit sont des papillons", answer: true, explanation: "Correct !" },
    { question: "Les chauves-souris sont des oiseaux", answer: false, explanation: "Ce sont des mammifères !" },
    { question: "Les cétacés ont des poumons", answer: true, explanation: "Correct !" },
    { question: "Les caméléons changent de couleur", answer: true, explanation: "Correct !" },
    { question: "Les koalas mangent du bambou", answer: false, explanation: "Les koalas mangent des feuilles d'eucalyptus !" },
    { question: "Les pieuvres sont intelligentes", answer: true, explanation: "Correct !" },
    { question: "Les piranhas mangent les humains", answer: false, explanation: "Très rare et souvent exagéré !" },
    { question: "Les lucioles sont des vers luisants", answer: true, explanation: "Correct !" },
    { question: "Les hippocampes sont des chevaux marins", answer: true, explanation: "Correct !" },
    { question: "Les limaces sont des insectes", answer: false, explanation: "Ce sont des mollusques !" },
    { question: "Les autruches enterrent la tête dans le sable", answer: false, explanation: "C'est un mythe !" },
    { question: "Les méduses n'ont pas de cerveau", answer: true, explanation: "Correct !" },
    { question: "Les geckos peuvent marcher au plafond", answer: true, explanation: "Correct !" },
    { question: "Les poulpes ont 8 bras", answer: true, explanation: "Correct !" },
    { question: "Les scarabées sont des insectes", answer: true, explanation: "Correct !" },
    { question: "Les moustiques piquent seulement les femelles", answer: true, explanation: "Correct !" },
    { question: "Les araignées tissent toutes des toiles", answer: false, explanation: "Seules les femelles tissent des toiles !" },
    { question: "Les libellules sont les plus vieux insectes", answer: true, explanation: "Correct !" },
    { question: "Les fourmis volent", answer: false, explanation: "Les fourmis ne peuvent pas voler !" },
    { question: "Les cigales chantent", answer: true, explanation: "Correct !" },
    { question: "Les têtards peuvent régénérer leur tête", answer: true, explanation: "Correct !" },
    { question: "Les baleines sont les plus grands animaux", answer: true, explanation: "Correct !" },
    { question: "Les calmars peuvent changer de couleur", answer: true, explanation: "Correct !" },
    { question: "Les perruches sont des oiseaux", answer: true, explanation: "Correct !" },
    { question: "Les loups hurlent à la lune", answer: true, explanation: "Correct !" },
    { question: "Les renards sont rusés", answer: true, explanation: "Correct !" },
    { question: "Les corbeaux sont très intelligents", answer: true, explanation: "Correct !" },
    { question: "Les hiboux peuvent tourner leur tête à 360°", answer: true, explanation: "Correct !" },
    { question: "Les écureuils oublient où ils enterrent leurs noisettes", answer: true, explanation: "Correct !" },
    { question: "Les castors construisent des barrages", answer: true, explanation: "Correct !" },
    { question: "Les flamants roses sont vraiment roses", answer: false, explanation: "Leur couleur vient des crevettes !" },
    { question: "Les pandas mangent du bambou", answer: true, explanation: "Correct !" },
    { question: "Les chevaux dorment debout", answer: true, explanation: "Correct !" },
    { question: "Les éléphants peuvent nager", answer: true, explanation: "Correct !" },
    { question: "Les girafes ont le même nombre de vertèbres que les humains", answer: true, explanation: "Correct !" },
    { question: "Les crocodiles pleurent en mangeant", answer: true, explanation: "Correct !" },
    { question: "Les autruches sont les plus grands oiseaux", answer: true, explanation: "Correct !" },
    { question: "Les pingouins vivent en Antarctique", answer: false, explanation: "Seulement quelques espèces, la plupart vivent plus au nord !" },
    { question: "Les méduses ont existé avant les dinosaures", answer: true, explanation: "Correct !" },
    { question: "Les étoiles sont toutes jaunes", answer: false, explanation: "Elles ont différentes couleurs selon leur température !" },
    { question: "Les planètes tournent dans le même sens", answer: false, explanation: "Vénus tourne dans le sens inverse !" },
    { question: "Les comètes sont des étoiles avec une queue", answer: true, explanation: "Correct !" },
    { question: "Les trous noirs sont des trous", answer: false, explanation: "Ce sont des objets avec une gravité extrême !" },
    { question: "Les aurores boréales existent au sud", answer: false, explanation: "Au sud on appelle ça aurores australes !" },
    { question: "Les arcs-en-ciel ont 7 couleurs", answer: false, explanation: "Elles ont des millions de couleurs !" },
    { question: "Les humains sont les seuls animaux à rire", answer: false, explanation: "Les rats aussi rient !" },
    { question: "Les fourmis ont des reines", answer: true, explanation: "Correct !" },
    { question: "Les abeilles communiquent en dansant", answer: true, explanation: "Correct !" },
    { question: "Les limules sont des vers", answer: false, explanation: "Ce sont des crustacés !" },
    { question: "Les chauves-souris dorment la tête en bas", answer: true, explanation: "Correct !" },
    { question: "Les papillons ont des écailles", answer: false, explanation: "Ils ont des poudres sur leurs ailes !" },
    { question: "Les pieuvres ont du sang bleu", answer: true, explanation: "Correct !" },
    { question: "Les cactus stockent l'eau", answer: true, explanation: "Correct !" },
    { question: "Les grenouilles boivent par la peau", answer: true, explanation: "Correct !" },
    { question: "Les geckos peuvent perdre leur queue", answer: true, explanation: "Correct !" },
    { question: "Les scarabées sont des coléoptères", answer: true, explanation: "Correct !" },
    { question: "Les libellules vivent 24h", answer: false, explanation: "Elles vivent quelques heures seulement !" },
    { question: "Les moustiques sont utiles", answer: true, explanation: "Ils pollinisent les plantes !" },
    { question: "Les araignées mangent leurs partenaires", answer: true, explanation: "Correct pour certaines espèces !" },
    { question: "Les fourmis sont plus fortes que les humains", answer: true, explanation: "Elles peuvent soulever 50x leur poids !" },
    { question: "Les cigales vivent sous terre", answer: true, explanation: "Correct !" },
    { question: "Les têtards peuvent régénérer leurs membres", answer: false, explanation: "Seulement la queue et les pattes arrière !" },
    { question: "Les baleines chantent des chansons", answer: true, explanation: "Correct !" },
    { question: "Les dauphins ont des noms", answer: true, explanation: "Correct !" },
    { question: "Les corbeaux font des outils", answer: true, explanation: "Correct !" },
    { question: "Les hiboux voient en 3D", answer: true, explanation: "Correct !" },
    { question: "Les écureuils plantent des arbres", answer: false, explanation: "Ils oublient où ils ont planté !" },
    { question: "Les flamants roses mâles couvent les œufs", answer: true, explanation: "Correct !" },
    { question: "Les pandas sont des ours", answer: false, explanation: "Ce sont des pandas géants !" },
    { question: "Les chevaux ne peuvent pas vomir", answer: true, explanation: "Correct !" },
    { question: "Les éléphants ont une excellente mémoire", answer: true, explanation: "Correct !" },
    { question: "Les girafes ont le cou le plus long", answer: true, explanation: "Correct !" },
    
    // Questions sur la technologie et l'histoire
    { question: "Le premier ordinateur était plus petit qu'un smartphone", answer: false, explanation: "Il occupait une pièce entière !" },
    { question: "Internet a été inventé dans les années 1990", answer: false, explanation: "Le protocole date des années 1960-1970 !" },
    { question: "Albert Einstein a échoué à l'école", answer: false, explanation: "C'était un excellent élève !" },
    { question: "Napoléon était très petit", answer: false, explanation: "Il mesurait 1m68, normal pour l'époque !" },
    { question: "Les Vikings portaient des casques avec des cornes", answer: false, explanation: "C'est un mythe popularisé par les opéras !" },
    { question: "Le grand incendie de Londres a détruit toute la ville", answer: false, explanation: "Seulement 80% de la ville a brûlé !" },
    { question: "Christophe Colomb a découvert l'Amérique", answer: false, explanation: "Elle était déjà peuplée depuis des millénaires !" },
    { question: "Les pyramides ont été construites par des esclaves", answer: false, explanation: "C'étaient des travailleurs qualifiés !" },
    { question: "Le Titanic a coulé en 10 minutes", answer: false, explanation: "Il a mis 2h40 à couler !" },
    { question: "Le premier film parlant date de 1920", answer: true, explanation: "Correct !" },
    
    // Questions sur la science et la nature
    { question: "Le diamant vient du carbone compressé", answer: true, explanation: "Correct !" },
    { question: "Les volcans peuvent créer des îles", answer: true, explanation: "Correct !" },
    { question: "La lumière du soleil met 8 minutes pour nous atteindre", answer: true, explanation: "Correct !" },
    { question: "Les humains partagent 50% d'ADN avec les bananes", answer: true, explanation: "Correct !" },
    { question: "Le miel ne périt jamais", answer: true, explanation: "Correct !" },
    { question: "Les étoiles peuvent exploser", answer: true, explanation: "Ce sont les supernovas !" },
    { question: "L'eau peut bouillir à moins de 100°C", answer: true, explanation: "En altitude, oui !" },
    { question: "Le son ne voyage pas dans le vide", answer: true, explanation: "Correct !" },
    { question: "Les champignons sont plus proches des animaux que des plantes", answer: true, explanation: "Correct !" },
    { question: "Le cœur d'une baleine est assez gros pour qu'un humain nage dedans", answer: true, explanation: "Correct !" }
]

// Anciens sujets de débat remplacés par des nouveaux plus bas


// Anciens mots pour le jeu de devinettes remplacés par des nouveaux plus bas

// Questions de Culture Générale (QCM)
const cultureQuestions = [
    {
        question: "Quel est le plus petit pays du monde ?",
        options: ["A) Monaco", "B) Vatican", "C) Saint-Marin", "D) Liechtenstein"],
        correct: "B",
        explanation: "Le Vatican mesure seulement 0,44 km²."
    },
    {
        question: "Quel est le métal le plus précieux ?",
        options: ["A) Or", "B) Argent", "C) Platine", "D) Rhodium"],
        correct: "D",
        explanation: "Le rhodium est souvent plus cher que l'or ou le platine."
    },
    {
        question: "Qui a découvert l'Amérique ?",
        options: ["A) Marco Polo", "B) Christophe Colomb", "C) Jacques Cartier", "D) Vasco de Gama"],
        correct: "B",
        explanation: "Christophe Colomb a atteint l'Amérique en 1492."
    }
]

// Questions DRAPEAUX
const drapeauQuestions = [
    // Europe
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
    
    // Asie
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
    
    // Afrique
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
    
    // Amériques
    { name: "Brésil", description: "Vert avec diamant jaune et cercle bleu", colors: ["vert", "jaune", "bleu"] },
    { name: "Canada", description: "Rouge avec feuille d'érable rouge", colors: ["rouge", "blanc"] },
    { name: "Mexique", description: "Vert, blanc, rouge vertical avec aigle", colors: ["vert", "blanc", "rouge"] },
    { name: "Argentine", description: "Bleu et blanc avec soleil", colors: ["bleu", "blanc", "jaune"] },
    { name: "États-Unis", description: "Rouge et blanc avec étoiles bleues", colors: ["rouge", "blanc", "bleu"] },
    { name: "Chili", description: "Bleu, blanc, rouge horizontal avec étoile", colors: ["bleu", "blanc", "rouge"] },
    { name: "Pérou", description: "Rouge et blanc vertical avec écusson", colors: ["rouge", "blanc"] },
    { name: "Colombie", description: "Jaune, bleu, rouge horizontal", colors: ["jaune", "bleu", "rouge"] },
    { name: "Venezuela", description: "Jaune, bleu, rouge horizontal avec étoiles", colors: ["jaune", "bleu", "rouge"] },
    { name: "Cuba", description: "Bleu et blanc avec triangle rouge et étoile", colors: ["bleu", "blanc", "rouge"] },
    
    // Océanie
    { name: "Australie", description: "Bleu avec étoiles et Union Jack", colors: ["bleu", "rouge", "blanc"] },
    { name: "Nouvelle-Zélande", description: "Bleu avec croix rouge et étoiles", colors: ["bleu", "rouge", "blanc"] },
    { name: "Fidji", description: "Bleu avec croix et écusson", colors: ["bleu", "rouge", "blanc", "jaune"] },
    { name: "Papouasie-Nouvelle-Guinée", description: "Noir et rouge avec oiseaux", colors: ["noir", "rouge", "jaune", "blanc"] },
    
    // Moyen-Orient
    { name: "Arabie Saoudite", description: "Vert avec épée et texte blanc", colors: ["vert", "blanc"] },
    { name: "Iran", description: "Vert, blanc, rouge horizontal avec symboles", colors: ["vert", "blanc", "rouge"] },
    { name: "Turquie", description: "Rouge avec croissant et étoile blancs", colors: ["rouge", "blanc"] },
    { name: "Israël", description: "Blanc avec étoile de David bleue", colors: ["blanc", "bleu"] },
    { name: "Émirats Arabes Unis", description: "Rouge, vert, blanc, noir horizontal", colors: ["rouge", "vert", "blanc", "noir"] },
    
    // Autres pays intéressants
    { name: "Brésil", description: "Vert avec diamant jaune et cercle bleu", colors: ["vert", "jaune", "bleu"] },
    { name: "Jamaïque", description: "Noir, jaune, vert en croix", colors: ["noir", "jaune", "vert"] },
    { name: "Haïti", description: "Bleu et rouge horizontal avec écusson", colors: ["bleu", "rouge", "blanc"] },
    { name: "Cuba", description: "Bleu et blanc avec triangle rouge", colors: ["bleu", "blanc", "rouge"] },
    { name: "Panama", description: "Blanc avec étoile bleue et rouge", colors: ["blanc", "bleu", "rouge"] },
    { name: "Costa Rica", description: "Bleu, blanc, rouge horizontal", colors: ["bleu", "blanc", "rouge"] },
    { name: "Guatemala", description: "Bleu et blanc avec écusson", colors: ["bleu", "blanc"] },
    { name: "Uruguay", description: "Blanc et bleu horizontal avec soleil", colors: ["blanc", "bleu", "jaune"] },
    { name: "Équateur", description: "Jaune, bleu, rouge horizontal avec écusson", colors: ["jaune", "bleu", "rouge"] },
    { name: "Bolivie", description: "Rouge, jaune, vert horizontal avec écusson", colors: ["rouge", "jaune", "vert"] }
]

// Questions MONUMENTS
const monumentQuestions = [
    { name: "Tour Eiffel", pays: "France", description: "Tour métallique de 324m à Paris, construite en 1889, symbole de la France", hauteur: "324m", indice: "Surnommée 'La Dame de Fer'", indice2: "Construite par Gustave Eiffel" },
    { name: "Taj Mahal", pays: "Inde", description: "Mausolée en marbre blanc de 73m, symbole d'amour éternel construit par un empereur", hauteur: "73m", indice: "Situé à Agra", indice2: "Construit par l'empereur Shah Jahan" },
    { name: "Grande Muraille", pays: "Chine", description: "Longue fortification de pierre de 21,196km, visible depuis l'espace", longueur: "21,196km", indice: "Construite sur plusieurs siècles", indice2: "Protégeait la Chine des invasions" },
    { name: "Colisée", pays: "Italie", description: "Amphithéâtre romain de 48m à Rome, lieu des combats de gladiateurs", hauteur: "48m", indice: "Construit en 80 ap. J.-C.", indice2: "Surnommé 'Amphithéâtre Flavien'" },
    { name: "Pyramides de Gizeh", pays: "Égypte", description: "Monuments funéraires de 146m, tombeaux des pharaons près du Caire", hauteur: "146m", indice: "Construites il y a 4,500 ans", indice2: "Seule merveille du monde encore existante" },
    { name: "Machu Picchu", pays: "Pérou", description: "Cité inca sur montagne à 2,430m, cité perdue des Incas", altitude: "2,430m", indice: "Découverte en 1911", indice2: "Surnommée 'La Cité perdue des Incas'" },
    { name: "Angkor Wat", pays: "Cambodge", description: "Complexe de temples khmers de 162ha, plus grand monument religieux du monde", superficie: "162ha", indice: "Construit au 12ème siècle", indice2: "Dédicacé au dieu Vishnou" },
    { name: "Sydney Opera House", pays: "Australie", description: "Opéra avec toits en voiles de 1973, forme de coquillages à Sydney", année: "1973", indice: "Conçu par Jørn Utzon", indice2: "Site du concert de 2000" },
    { name: "Golden Gate Bridge", pays: "États-Unis", description: "Pont suspendu rouge de 2,737m, emblème de San Francisco", longueur: "2,737m", indice: "Inauguré en 1937", indice2: "Traverse la baie de San Francisco" },
    { name: "Burj Khalifa", pays: "Émirats Arabes Unis", description: "Gratte-ciel le plus haut du monde à 828m, situé à Dubaï", hauteur: "828m", indice: "163 étages", indice2: "Ouvert en 2010" },
    { name: "Sagrada Familia", pays: "Espagne", description: "Basilique inachevée de Gaudi depuis 1882, œuvre de l'architecte Antoni Gaudí", construction: "1882", indice: "Située à Barcelone", indice2: "Prévue pour être terminée en 2026" },
    { name: "Stonehenge", pays: "Royaume-Uni", description: "Cercle de pierres préhistorique de 5,000 ans, mystérieux cercle de mégalithes", age: "5,000 ans", indice: "Situé dans le Wiltshire", indice2: "Aligné sur les solstices" },
    // Monuments Américains
    { name: "Statue de la Liberté", pays: "États-Unis", description: "Statue cuivrée de 93m offerte par la France, symbole de New York", hauteur: "93m", indice: "Tenue par la France", indice2: "Couronne avec 7 pointes" },
    { name: "Mont Rushmore", pays: "États-Unis", description: "Montagne sculptée avec 4 présidents américains dans le Dakota du Sud", hauteur: "18m", indice: "Visages de 18m de haut", indice2: "Construit de 1927 à 1941" },
    { name: "Chichen Itza", pays: "Mexique", description: "Pyramide maya avec 365 marches, site archéologique du Yucatán", hauteur: "30m", indice: "365 marches pour les jours", indice2: "Site du jeu de balle maya" },
    { name: "Teotihuacan", pays: "Mexique", description: "Cité précolombienne avec pyramides du Soleil et de la Lune", superficie: "20km²", indice: "Pyramide du Soleil de 65m", indice2: "Abeille sur les pyramides" },
    { name: "Christ Rédempteur", pays: "Brésil", description: "Statue de 38m bras ouverts sur Corcovado, surplombe Rio", hauteur: "38m", indice: "Bras ouverts de 28m", indice2: "Patrimoine UNESCO" },
    { name: "Moai", pays: "Chili", description: "Statues géantes de pierre sur l'île de Pâques, mystère polynésien", hauteur: "10m", indice: "Île de Pâques", indice2: "Plus de 900 statues" },
    
    // Monuments Européens
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
    
    // Monuments Asiatiques
    { name: "Cité Interdite", pays: "Chine", description: "Palais impérial de 720,000m², résidence des empereurs", superficie: "720,000m²", indice: "9999 pièces", indice2: "Couleur jaune impériale" },
    { name: "Angkor Wat", pays: "Cambodge", description: "Temple khmer de 162ha, plus grand monument religieux", superficie: "162ha", indice: "Style architectural unique", indice2: "Représente le Mont Meru" },
    { name: "Pétra", pays: "Jordanie", description: "Cité taillée dans la roche rose il y a 2000 ans", age: "2000 ans", indice: "Surnommée Rose du Désert", indice2: "Capitale nabatéenne" },
    { name: "Ganges", pays: "Inde", description: "Fleuve sacré de 2,525km, lieu de pèlerinage hindou", longueur: "2,525km", indice: "Fleuve sacré", indice2: "7 villes saintes" },
    { name: "Temple d'Or", pays: "Inde", description: "Temple sikh doré avec marbre et pierres précieuses", hauteur: "15m", indice: "Amritsar", indice2: "Recouvert d'or pur" },
    { name: "Torii d'Itsukushima", pays: "Japon", description: "Porte torii flottante de 16m, site sacré shintoïste", hauteur: "16m", indice: "Île sacrée de Miyajima", indice2: "Marée haute/flottante" },
    { name: "Mont Fuji", pays: "Japon", description: "Volcan de 3,776m, montagne sacrée et symbole", hauteur: "3,776m", indice: "Volcan actif", indice2: "Sacré pour shintoïstes et bouddhistes" },
    { name: "Temple du Ciel", pays: "Chine", description: "Autel impérial de 273ha, lieu de sacrifices", superficie: "273ha", indice: "Architecture unique", indice2: "Symbole cosmologique" },
    
    // Monuments Africains
    { name: "Abou Simbel", pays: "Égypte", description: "Temples taillés dans la roche de Ramsès II, déplacés", hauteur: "20m", indice: "Statues de 20m", indice2: "Déplacés en 1960" },
    { name: "Karnak", pays: "Égypte", description: "Complexe de temples de 200ha, plus grand site antique", superficie: "200ha", indice: "134 colonnes", indice2: "Construit sur 1500 ans" },
    { name: "Mosquée Hassan II", pays: "Maroc", description: "Grande mosquée de 200m sur l'océan, minaret le plus haut", hauteur: "200m", indice: "Sur l'Atlantique", indice2: "25,000 fidèles" },
    { name: "Great Zimbabwe", pays: "Zimbabwe", description: "Ruines médiévales de pierres, ancienne capitale", superficie: "7.8ha", indice: "Murs de 11m", indice2: "XIe-XVe siècle" },
    { name: "Lalibela", pays: "Éthiopie", description: "Églises taillées dans la roche, Jérusalem noire", profondeur: "13m", indice: "11 églises", indice2: "XIIe siècle" },
    
    // Monuments du Moyen-Orient
    { name: "Dôme du Rocher", pays: "Israël", description: "Sanctuaire islamique de 20m avec dôme doré", hauteur: "20m", indice: "Mont du Temple", indice2: "Dôme doré" },
    { name: "Mur des Lamentations", pays: "Israël", description: "Mur de prière juif de 19m, vestige du Temple", longueur: "19m", indice: "Mur occidental", indice2: "Site saint juif" },
    { name: "Mausolée d'Alexandre", pays: "Égypte", description: "Tombeau supposé d'Alexandre le Grand", localisation: "Alexandrie", indice: "Perdu", indice2: "Merveille antique" },
    
    // Monuments Océaniens
    { name: "Uluru", pays: "Australie", description: "Monolithe sacré de 348m, site aborigène", hauteur: "348m", indice: "Rochure de 600 millions d'années", indice2: "Sacré aborigène" },
    { name: "Great Barrier Reef", pays: "Australie", description: "Récif corallien de 2,300km, plus grand au monde", longueur: "2,300km", indice: "Patrimoine UNESCO", indice2: "400 types de coraux" },
    { name: "Moai de Rapa Nui", pays: "Chili", description: "Statues de pierre de l'île de Pâques, mystère polynésien", hauteur: "10m", indice: "900 statues", indice2: "Transport mystérieux" },
    
    // Monuments Modernes
    { name: "Tour Shanghai", pays: "Chine", description: "Gratte-ciel de 632m, plus haut de Chine", hauteur: "632m", indice: "128 étages", indice2: "Observatoire à 561m" },
    { name: "Abraj Al-Bait", pays: "Arabie", description: "Tour horloge de 601m à La Mecque", hauteur: "601m", indice: "Plus grande horloge", indice2: "Face à la Kaaba" },
    { name: "One World Trade", pays: "États-Unis", description: "Tour de 541m à NYC, plus haut de l'Ouest", hauteur: "541m", indice: "1776 pieds", indice2: "Mémorial du 11/9" },
    { name: "Taipei 101", pays: "Taïwan", description: "Tour de 508m avec 8 étages de pagode", hauteur: "508m", indice: "101 étages", indice2: "Style post-moderne" },
    
    // Sites Archéologiques
    { name: "Pompéi", pays: "Italie", description: "Cité romaine préservée par l'éruption du Vésuve", superficie: "66ha", indice: "Ensevelie en 79 ap. J.-C.", indice2: "2.5 millions de visiteurs/an" },
    { name: "Tikal", pays: "Guatemala", description: "Cité maya dans la jungle, pyramides impressives", hauteur: "47m", indice: "Temples I-VI", indice2: "Capitale maya" },
    { name: "Ephèse", pays: "Turquie", description: "Cité grecque avec Bibliothèque de Celsus", age: "3000 ans", indice: "Bibliothèque de 25,000 volumes", indice2: "Temple d'Artémis" },
    { name: "Mésopotamie", pays: "Irak", description: "Berceau des civilisations, entre Tigre et Euphrate", superficie: "350,000km²", indice: "Invention de l'écriture", indice2: "5000 ans d'histoire" },
    
    // Monuments Religieux
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
        options: ["A) 299,792 km/s", "B) 150,000 km/s", "C) 500,000 km/s", "D) 1,000,000 km/s"],
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
    // Sports collectifs
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
    
    // Sports individuels
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
    
    // Sports mécaniques
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
    
    // Sports de combat
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
    
    // Sports d'hiver
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
    
    // Sports extrêmes
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
    
    // Sports traditionnels
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
    
    // Records et légendes
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
    
    // Équipements et règles
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
    
    // Compétitions majeures
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
    // Réalisateurs légendaires
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
    
    // Franchises et sagas
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
    
    // Acteurs et actrices
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
    
    // Records et records
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
    
    // Musique et bande sonore
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
    },
    {
        question: "Quel est le film le plus rentable de tous les temps ?",
        options: ["A) Avatar", "B) Titanic", "C) Avengers: Endgame", "D) Star Wars: Le Réveil de la Force"],
        correct: "A",
        explanation: "Avatar est le film le plus rentable avec environ 2.9 milliards de dollars."
    }
]

// Questions HISTOIRE
const histoireQuestions = [
    // Antiquité
    {
        question: "En quelle année a débuté la Révolution française ?",
        options: ["A) 1787", "B) 1789", "C) 1791", "D) 1793"],
        correct: "B",
        explanation: "La Révolution française a débuté en 1789 avec la prise de la Bastille."
    },
    {
        question: "Qui était le premier empereur romain ?",
        options: ["A) Jules César", "B) Auguste", "C) Néron", "D) Marc Aurèle"],
        correct: "B",
        explanation: "Auguste (Octave) est considéré comme le premier empereur romain."
    },
    {
        question: "En quelle année Christophe Colomb a-t-il découvert l'Amérique ?",
        options: ["A) 1490", "B) 1492", "C) 1494", "D) 1496"],
        correct: "B",
        explanation: "Christophe Colomb a atteint l'Amérique en 1492."
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
        explanation: "Michel-Ange a peint le plafond de la chapelle Sixtine."
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
        explanation: "Gutenberg a inventé l'imprimerie vers 1440."
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
]

// Questions MATHÉMATIQUES
const mathQuestions = [
    // Calculs de base
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
    }
]

// Questions LOGIQUE
const logiqueQuestions = [
    // Suites logiques
    {
        question: "Complète la suite : 2, 4, 8, 16, ?",
        options: ["A) 24", "B) 28", "C) 32", "D) 36"],
        correct: "C",
        explanation: "On double à chaque fois : 16 × 2 = 32"
    },
    {
        question: "Complète la suite : 1, 4, 9, 16, 25, ?",
        options: ["A) 30", "B) 32", "C) 36", "D) 40"],
        correct: "C",
        explanation: "Ce sont les carrés : 1², 2², 3², 4², 5², 6² = 36"
    },
    {
        question: "Complète la suite : 3, 6, 9, 12, ?",
        options: ["A) 14", "B) 15", "C) 16", "D) 18"],
        correct: "B",
        explanation: "On ajoute 3 à chaque fois : 12 + 3 = 15"
    },
    {
        question: "Complète la suite : 1, 1, 2, 3, 5, 8, ?",
        options: ["A) 11", "B) 12", "C) 13", "D) 15"],
        correct: "C",
        explanation: "Suite de Fibonacci : chaque nombre = somme des deux précédents"
    },
    {
        question: "Complète la suite : 2, 3, 5, 7, 11, ?",
        options: ["A) 13", "B) 15", "C) 17", "D) 19"],
        correct: "A",
        explanation: "Ce sont les nombres premiers : 2, 3, 5, 7, 11, 13"
    },
    {
        question: "Complète la suite : 10, 8, 11, 9, 12, ?",
        options: ["A) 10", "B) 11", "C) 13", "D) 14"],
        correct: "A",
        explanation: "Suite alternée : -2, +3, -2, +3, -2... donc 12 - 2 = 10"
    },
    {
        question: "Complète la suite : 1, 8, 27, 64, ?",
        options: ["A) 100", "B) 115", "C) 120", "D) 125"],
        correct: "D",
        explanation: "Ce sont les cubes : 1³, 2³, 3³, 4³, 5³ = 125"
    },
    {
        question: "Complète la suite : 0, 1, 1, 2, 3, 5, ?",
        options: ["A) 6", "B) 7", "C) 8", "D) 9"],
        correct: "C",
        explanation: "Suite de Fibonacci décalée : 5 + 3 = 8"
    },
    {
        question: "Complète la suite : 5, 10, 20, 40, ?",
        options: ["A) 60", "B) 70", "C) 80", "D) 90"],
        correct: "C",
        explanation: "On double à chaque fois : 40 × 2 = 80"
    },
    {
        question: "Complète la suite : 100, 81, 64, 49, ?",
        options: ["A) 25", "B) 30", "C) 36", "D) 40"],
        correct: "C",
        explanation: "Carrés décroissants : 10², 9², 8², 7², 6² = 36"
    },
    // Énigmes logiques
    {
        question: "Si 3 chats attrapent 3 souris en 3 minutes, combien de chats pour 100 souris en 100 minutes ?",
        options: ["A) 3", "B) 10", "C) 33", "D) 100"],
        correct: "A",
        explanation: "3 chats attrapent 1 souris par minute, donc 3 chats suffisent"
    },
    {
        question: "Quel est le prochain nombre : 2, 6, 12, 20, 30, ?",
        options: ["A) 40", "B) 42", "C) 44", "D) 46"],
        correct: "B",
        explanation: "Suite n² + n : 1²+1=2, 2²+2=6, 3²+3=12, 4²+4=20, 5²+5=30, 6²+6=42"
    },
    {
        question: "Si 5 machines produisent 5 articles en 5 minutes, combien pour 100 articles ?",
        options: ["A) 5", "B) 20", "C) 50", "D) 100"],
        correct: "A",
        explanation: "5 machines produisent 1 article par minute, donc 5 machines suffisent"
    },
    {
        question: "Complète : A=1, B=2, C=3, ..., Z=?",
        options: ["A) 24", "B) 25", "C) 26", "D) 27"],
        correct: "C",
        explanation: "Z est la 26ème lettre de l'alphabet"
    },
    {
        question: "Quel nombre continue : 1, 4, 9, 16, 25, 36, ?",
        options: ["A) 42", "B) 45", "C) 48", "D) 49"],
        correct: "D",
        explanation: "Carrés consécutifs : 7² = 49"
    },
    {
        question: "Si 2+3=10, 3+4=21, 4+5=36, alors 5+6=?",
        options: ["A) 45", "B) 49", "C) 55", "D) 64"],
        correct: "C",
        explanation: "On multiplie les nombres : (5+6)×5 = 55"
    },
    {
        question: "Complète : 2, 5, 10, 17, 26, ?",
        options: ["A) 35", "B) 37", "C) 39", "D) 41"],
        correct: "B",
        explanation: "Suite n²+1 : 1²+1=2, 2²+1=5, 3²+1=10, 4²+1=17, 5²+1=26, 6²+1=37"
    },
    {
        question: "Si 1=5, 2=10, 3=15, 4=20, alors 5=?",
        options: ["A) 5", "B) 10", "C) 15", "D) 25"],
        correct: "D",
        explanation: "5×5=25 (piège : si 1=5 alors 5=1, mais la logique est 5×n)"
    },
    {
        question: "Complète : 8, 5, 4, 9, 1, 7, 6, ?",
        options: ["A) 2", "B) 3", "C) 4", "D) 5"],
        correct: "B",
        explanation: "Nombres de lettres dans l'ordre alphabétique : huit(4), cinq(4), quatre(6), neuf(4), un(2), sept(4), six(3), trois(5)"
    },
    {
        question: "Si 3×4=12, 4×5=20, 5×6=30, alors 6×7=?",
        options: ["A) 36", "B) 40", "C) 42", "D) 48"],
        correct: "C",
        explanation: "Multiplication normale : 6×7 = 42"
    }
]

// Questions CULTURE POPULAIRE
const culturepopQuestions = [
    // Musique
    {
        question: "Qui est connu comme le 'Roi de la Pop' ?",
        options: ["A) Elvis Presley", "B) Michael Jackson", "C) Madonna", "D) Prince"],
        correct: "B",
        explanation: "Michael Jackson est surnommé le 'Roi de la Pop'."
    },
    {
        question: "Dans quelle série trouve-t-on les personnages Ross et Rachel ?",
        options: ["A) How I Met Your Mother", "B) The Big Bang Theory", "C) Friends", "D) Seinfeld"],
        correct: "C",
        explanation: "Ross et Rachel sont des personnages principaux de Friends."
    },
    {
        question: "Quel groupe a chanté 'Bohemian Rhapsody' ?",
        options: ["A) The Beatles", "B) Queen", "C) Pink Floyd", "D) Led Zeppelin"],
        correct: "B",
        explanation: "Queen a interprété 'Bohemian Rhapsody' en 1975."
    },
    {
        question: "Qui est l'artiste le plus écouté sur Spotify en 2023 ?",
        options: ["A) Taylor Swift", "B) Bad Bunny", "C) Drake", "D) The Weeknd"],
        correct: "A",
        explanation: "Taylor Swift est devenue l'artiste la plus écoutée sur Spotify en 2023."
    },
    {
        question: "Quel est le film Marvel le plus rentable ?",
        options: ["A) Avengers: Endgame", "B) Avengers: Infinity War", "C) Black Panther", "D) Spider-Man: No Way Home"],
        correct: "A",
        explanation: "Avengers: Endgame est le film Marvel le plus rentable avec 2.8 milliards de dollars."
    },
    {
        question: "Qui a joué Harry Potter dans les films ?",
        options: ["A) Tom Holland", "B) Daniel Radcliffe", "C) Robert Pattinson", "D) Elijah Wood"],
        correct: "B",
        explanation: "Daniel Radcliffe a joué Harry Potter dans les 8 films."
    },
    {
        question: "Quel est le jeu vidéo le plus vendu ?",
        options: ["A) Grand Theft Auto V", "B) Minecraft", "C) Tetris", "D) Wii Sports"],
        correct: "B",
        explanation: "Minecraft s'est vendu à plus de 238 millions d'exemplaires."
    },
    {
        question: "Qui est la chanteuse de 'Shallow' (A Star Is Born) ?",
        options: ["A) Beyoncé", "B) Lady Gaga", "C) Ariana Grande", "D) Taylor Swift"],
        correct: "B",
        explanation: "Lady Gaga a chanté 'Shallow' avec Bradley Cooper."
    },
    {
        question: "Quel est le film d'animation le plus rentable ?",
        options: ["A) Frozen", "B) Minions", "C) Toy Story 4", "D) Zootopie"],
        correct: "B",
        explanation: "Minions est le film d'animation le plus rentable avec 1.16 milliard de dollars."
    },
    {
        question: "Qui a réalisé 'Parasite' (2019) ?",
        options: ["A) Park Chan-wook", "B) Bong Joon-ho", "C) Kim Ki-duk", "D) Lee Chang-dong"],
        correct: "B",
        explanation: "Bong Joon-ho a réalisé 'Parasite', premier film non-anglais à gagner l'Oscar du meilleur film."
    },
    // Séries TV
    {
        question: "Dans quelle ville se déroule 'Friends' ?",
        options: ["A) New York", "B) Los Angeles", "C) Chicago", "D) Boston"],
        correct: "A",
        explanation: "Friends se déroule principalement à New York."
    },
    {
        question: "Combien de saisons 'Game of Thrones' a-t-il ?",
        options: ["A) 6", "B) 7", "C) 8", "D) 9"],
        correct: "C",
        explanation: "Game of Thrones a eu 8 saisons de 2011 à 2019."
    },
    {
        question: "Qui est le créateur de 'Breaking Bad' ?",
        options: ["A) Vince Gilligan", "B) David Chase", "C) Matt Groening", "D) David Simon"],
        correct: "A",
        explanation: "Vince Gilligan a créé Breaking Bad."
    },
    {
        question: "Quel est le personnage principal de 'The Office' (US) ?",
        options: ["A) Michael Scott", "B) Jim Halpert", "C) Dwight Schrute", "D) Pam Beesly"],
        correct: "A",
        explanation: "Michael Scott est le manager principal de Dunder Mifflin."
    },
    {
        question: "Dans quelle décennie se déroule 'Stranger Things' ?",
        options: ["A) 1970s", "B) 1980s", "C) 1990s", "D) 2000s"],
        correct: "B",
        explanation: "Stranger Things se déroule dans les années 1980."
    },
    {
        question: "Qui joue le Docteur dans 'Doctor Who' moderne ?",
        options: ["A) Matt Smith", "B) David Tennant", "C) Jodie Whittaker", "D) Peter Capaldi"],
        correct: "C",
        explanation: "Jodie Whittaker a été la 13ème Docteur (2017-2022)."
    },
    {
        question: "Quel est le spin-off de 'Breaking Bad' ?",
        options: ["A) Better Call Saul", "B) El Camino", "C) The Walking Dead", "D) Fargo"],
        correct: "A",
        explanation: "Better Call Saul est un spin-off préquelle de Breaking Bad."
    },
    {
        question: "Combien d'épisodes 'The Simpsons' a-t-il ?",
        options: ["A) 500+", "B) 600+", "C) 700+", "D) 800+"],
        correct: "C",
        explanation: "Les Simpsons ont dépassé 750 épisodes en 2023."
    },
    {
        question: "Qui est le showrunner de 'The Crown' ?",
        options: ["A) Peter Morgan", "B) Steven Moffat", "C) Russell T Davies", "D) Mark Gatiss"],
        correct: "A",
        explanation: "Peter Morgan est le créateur et showrunner de The Crown."
    },
    {
        question: "Dans quelle ville se passe 'Peaky Blinders' ?",
        options: ["A) Manchester", "B) Liverpool", "C) Birmingham", "D) London"],
        correct: "C",
        explanation: "Peaky Blinders se déroule à Birmingham après la Première Guerre mondiale."
    },
    // Jeux vidéo
    {
        question: "Quel est le personnage principal de 'The Legend of Zelda' ?",
        options: ["A) Link", "B) Zelda", "C) Ganon", "D) Epona"],
        correct: "A",
        explanation: "Link est le héros principal de la série Zelda."
    },
    {
        question: "En quelle année 'Fortnite' est-il sorti ?",
        options: ["A) 2015", "B) 2016", "C) 2017", "D) 2018"],
        correct: "C",
        explanation: "Fortnite est sorti en septembre 2017."
    },
    {
        question: "Qui a créé 'Minecraft' ?",
        options: ["A) Markus Persson", "B) Jens Bergensten", "C) Notch", "D) Steve"],
        correct: "A",
        explanation: "Markus 'Notch' Persson a créé Minecraft."
    },
    {
        question: "Quel est le plus ancien personnage de 'Super Smash Bros' ?",
        options: ["A) Mario", "B) Pikachu", "C) Samus", "D) Fox"],
        correct: "A",
        explanation: "Mario est le personnage le plus ancien, créé en 1981."
    },
    {
        question: "Dans quel pays se déroule 'Horizon Zero Dawn' ?",
        options: ["A) Norvège", "B) Suède", "C) Colorado", "D) Californie"],
        correct: "C",
        explanation: "Horizon Zero Dawn se déroule dans un Colorado post-apocalyptique."
    },
    {
        question: "Quel est le personnage principal de 'God of War' (2018) ?",
        options: ["A) Kratos", "B) Atreus", "C) Zeus", "D) Thor"],
        correct: "A",
        explanation: "Kratos est le protagoniste principal de God of War."
    },
    {
        question: "Combien de jeux 'The Witcher' existe-t-il ?",
        options: ["A) 2", "B) 3", "C) 4", "D) 5"],
        correct: "B",
        explanation: "Il y a 3 jeux principaux dans la série The Witcher."
    },
    {
        question: "Quel est le studio derrière 'Dark Souls' ?",
        options: ["A) FromSoftware", "B) Capcom", "C) Bandai Namco", "D) Square Enix"],
        correct: "A",
        explanation: "FromSoftware a développé la série Dark Souls."
    },
    {
        question: "Dans quelle année 'Among Us' est-il devenu viral ?",
        options: ["A) 2018", "B) 2019", "C) 2020", "D) 2021"],
        correct: "C",
        explanation: "Among Us est devenu viral en 2020 pendant la pandémie."
    },
    {
        question: "Quel est le personnage principal de 'Red Dead Redemption 2' ?",
        options: ["A) John Marston", "B) Arthur Morgan", "C) Dutch van der Linde", "D) Sadie Adler"],
        correct: "B",
        explanation: "Arthur Morgan est le protagoniste principal de RDR2."
    }
]

// Mots pour le jeu Devine
const devineWords = [
    // Animaux
    "chien", "chat", "lion", "tigre", "éléphant", "girafe", "zèbre", "hippopotame", "rhinocéros", "singe",
    "souris", "rat", "lapin", "hamstér", "cobaye", "cheval", "vache", "mouton", "cochon", "poulet",
    "canard", "oie", "pigeon", "aigle", "hibou", "chouette", "pingouin", "phoque", "dauphin", "baleine",
    "requin", "poisson", "crevette", "crabe", "homard", "escargot", "limace", "araignée", "scorpion", "serpent",
    "lézard", "tortue", "crocodile", "alligator", "caméléon", "gecko", "iguane", "dragon", "phénix", "griffon",
    
    // Fruits et légumes
    "pomme", "poire", "banane", "orange", "citron", "pamplemousse", "mandarine", "clémentine", "fraise", "framboise",
    "mûre", "myrtille", "cerise", "pêche", "abricot", "nectarine", "prune", "kiwi", "ananas", "mangue",
    "papaye", "grenade", "figue", "datte", "raisin", "melon", "pastèque", "citrouille", "carotte", "navet",
    "radis", "betterave", "poireau", "oignon", "ail", "échalote", "ciboulette", "persil", "coriandre", "basilic",
    "thym", "romarin", "sauge", "menthe", "origan", "laurier", "câpres", "olive", "tomate", "concombre",
    "courgette", "aubergine", "poivron", "piment", "chili", "poivre", "sel", "sucre", "miel", "chocolat",
    
    // Objets du quotidien
    "table", "chaise", "lit", "canapé", "armoire", "commode", "bibliothèque", "étagère", "tapis", "rideau",
    "lampe", "ampoule", "interrupteur", "prise", "téléphone", "ordinateur", "télévision", "radio", "lecteur", "console",
    "clavier", "souris", "écran", "imprimante", "scanner", "webcam", "microphone", "haut-parleur", "casque", "écouteurs",
    "bouteille", "verre", "tasse", "assiette", "fourchette", "couteau", "cuillère", "bol", "plats", "casserole",
    "poêle", "four", "micro-ondes", "réfrigérateur", "congélateur", "lave-vaisselle", "lave-linge", "sèche-linge", "aspirateur", "balai",
    
    // Vêtements et accessoires
    "chemise", "t-shirt", "pull", "gilet", "veste", "manteau", "blouson", "imper", "parapluie", "sac",
    "chaussures", "bottes", "sandales", "chaussons", "chapeau", "casquette", "bonnet", "écharpe", "gants", "lunettes",
    "montre", "bague", "collier", "bracelet", "boucles", "ceinture", "boutons", "fermoir", "zip", "lacets",
    "jean", "pantalon", "short", "jupe", "robe", " combinaison", "maillot", "débardeur", "polo", "chemisier",
    
    // Sports et activités
    "football", "basketball", "tennis", "golf", "natation", "course", "saut", "lancer", "cyclisme", "marche",
    "ski", "surf", "plongée", "escalade", "danse", "yoga", "méditation", "jardinage", "cuisine", "bricolage",
    "lecture", "écriture", "dessin", "peinture", "sculpture", "photo", "cinéma", "théâtre", "musique", "chant",
    "instrument", "guitare", "piano", "violon", "batterie", "flûte", "saxophone", "trompette", "accordéon", "harmonica",
    
    // Lieux et endroits
    "maison", "appartement", "villa", "château", "ferme", "cabane", "tente", "caravane", "hôtel", "restaurant",
    "école", "université", "bibliothèque", "musée", "cinéma", "théâtre", "stade", "parc", "jardin", "forêt",
    "plage", "montagne", "vallée", "rivière", "lac", "océan", "mer", "île", "continent", "planète",
    "ville", "village", "bourg", "campagne", "désert", "glacier", "volcan", "caverne", "grotte", "canyon",
    
    // Couleurs et formes
    "rouge", "bleu", "vert", "jaune", "orange", "violet", "rose", "marron", "noir", "blanc",
    "gris", "argent", "or", "bronze", "cuivre", "platine", "diamant", "rubis", "émeraude", "saphir",
    "carré", "cercle", "triangle", "rectangle", "losange", "ovale", "étoile", "cœur", "flèche", "croix",
    "spirale", "zigzag", "ondulé", "droit", "courbe", "angulaire", "rond", "pointu", "plat", "creux",
    
    // Météo et nature
    "soleil", "lune", "étoile", "nuage", "pluie", "neige", "vent", "orage", "éclair", "tonnerre",
    "arc-en-ciel", "brouillard", "brume", "rosée", "givre", "grêle", "tempête", "cyclone", "tornade", "séisme",
    "volcan", "tremblement", "avalanche", "inondation", "sécheresse", "canicule", "vague", "marée", "courant", "cyclone",
    "printemps", "été", "automne", "hiver", "jour", "nuit", "aube", "crépuscule", "minuit", "midi",
    
    // Émotions et sentiments
    "joie", "tristesse", "colère", "peur", "amour", "haine", "jalousie", "envie", "fierté", "honte",
    "courage", "lâcheté", "sagesse", "folie", "espoir", "désespoir", "confiance", "doute", "paix", "guerre",
    "amitié", "ennemitié", "respect", "mépris", "générosité", "égoïsme", "patience", "impatience", "calme", "agitation",
    "bonheur", "malheur", "chance", "malchance", "succès", "échec", "victoire", "défaite", "force", "faiblesse",
    
    // Aliments et boissons
    "pain", "fromage", "beurre", "confiture", "miel", "sucre", "sel", "poivre", "vinaigre", "huile",
    "café", "thé", "chocolat", "lait", "eau", "jus", "soda", "bière", "vin", "spiritueux",
    "pâtes", "riz", "pommes", "frites", "salade", "soupe", "potage", "ragoût", "gratin", "quiche",
    "pizza", "hamburger", "sandwich", "tacos", "sushi", "curry", "poulet", "bœuf", "porc", "agneau",
    
    // Technologies et sciences
    "internet", "wifi", "bluetooth", "usb", "hdmi", "led", "lcd", "oled", "quantum", "intelligence",
    "artificielle", "robot", "ordinateur", "smartphone", "tablette", "montre", "écouteurs", "haut-parleurs", "caméra",
    "satellite", "fusée", "avion", "hélicoptère", "voiture", "moto", "vélo", "train", "métro", "bus",
    "batterie", "panneau", "solaire", "éolienne", "nucléaire", "hydroélectrique", "biomasse", "géothermie", "hydrogène", "électricité",
    
    // Arts et culture
    "livre", "roman", "poème", "nouvelle", "conte", "fable", "mythe", "légende", "histoire", "biographie",
    "peinture", "sculpture", "gravure", "photographie", "cinéma", "théâtre", "opéra", "ballet", "concert", "festival",
    "guitare", "piano", "violon", "flûte", "trompette", "batterie", "chant", "chorale", "orchestre", "chef",
    "danse", "classique", "moderne", "jazz", "rock", "pop", "rap", "hip-hop", "électro", "folk",
    
    // Divers et abstraits
    "temps", "espace", "dimension", "univers", "galaxie", "planète", "satellite", "comète", "astéroïde", "météore",
    "mathématiques", "physique", "chimie", "biologie", "géologie", "astronomie", "psychologie", "philosophie", "histoire", "géographie",
    "langage", "grammaire", "vocabulaire", "alphabet", "dictionnaire", "encyclopédie", "bibliothèque", "archive", "document", "information",
    "économie", "politique", "société", "culture", "religion", "spiritualité", "mysticisme", "magie", "sorcellerie", "fantastique"
]

// Sujets de débat
const debateTopics = [
    // Société et politique
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
    
    // Technologie et science
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
    
    // Économie et environnement
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
    
    // Éducation et culture
    "Faut-il supprimer les notes à l'école ?",
    "Les langues étrangères devraient-elles être obligatoires ?",
    "L'université devrait-elle être gratuite pour tous ?",
    "Faut-il enseigner la programmation dès l'école primaire ?",
    "Les musées devraient-ils être gratuits ?",
    "Faut-il protéger les langues en voie de disparition ?",
    "La culture doit-elle être accessible à tous ?",
    "Faut-il interdire les films violents ?",
    "Les jeux vidéo sont-ils un art ?",
    "Faut-il réguler les algorithmes de recommandation ?",
    
    // Santé et éthique
    "Faut-il rendre le don d'organes obligatoire ?",
    "L'euthanasie devrait-elle être légale partout ?",
    "Faut-il interdire la viande synthétique ?",
    "Les vaccins devraient-ils être obligatoires ?",
    "Faut-il autoriser la gestation pour autrui ?",
    "Le clonage humain est-il éthiquement acceptable ?",
    "Faut-il interdire les expériences sur les animaux ?",
    "La médecine alternative est-elle efficace ?",
    "Faut-il réguler l'industrie pharmaceutique ?",
    "Les données de santé devraient-elles être privées ?",
    
    // Relations humaines et société
    "Le mariage devrait-il être universel pour tous ?",
    "Faut-il légaliser la polygamie ?",
    "Les réseaux sociaux nous isolent-ils vraiment ?",
    "Faut-il interdire les applications de rencontre ?",
    "L'amitié peut-elle exister en ligne seulement ?",
    "Faut-il réguler les influenceurs ?",
    "La censure est-elle nécessaire sur internet ?",
    "Faut-il protéger l'anonymat en ligne ?",
    "Les enfants devraient-ils avoir des smartphones ?",
    "Faut-il limiter le temps d'écran pour les adultes ?",
    
    // Futur et science-fiction
    "Vivrons-nous sur Mars dans 50 ans ?",
    "Les humains auront-ils des pouvoirs technologiques ?",
    "Faut-il craindre les super-intelligences ?",
    "Le voyage dans le temps sera-t-il possible ?",
    "Faut-il créer des colonies spatiales ?",
    "Les cyborgs seront-ils majoritaires ?",
    "La réalité simulée existe-t-elle déjà ?",
    "Faut-il explorer les dimensions parallèles ?",
    "Les extraterrestres existent-ils vraiment ?",
    "Faut-il contacter les civilisations extraterrestres ?",
    
    // Philosophie et spiritualité
    "Le libre arbitre existe-t-il vraiment ?",
    "La vie a-t-elle un sens objectif ?",
    "Faut-il croire en quelque chose de supérieur ?",
    "La conscience peut-elle exister sans cerveau ?",
    "Faut-il craindre la mort ?",
    "L'univers a-t-il un début et une fin ?",
    "Faut-il vivre dans le présent ou planifier l'avenir ?",
    "Le bonheur est-il le but de la vie ?",
    "Faut-il toujours dire la vérité ?",
    "La moralité est-elle universelle ?",
    
    // Questions pratiques et quotidiennes
    "Faut-il travailler 4 jours par semaine ?",
    "Les week-ends de 3 jours devraient-ils être la norme ?",
    "Faut-il interdire les publicités pour enfants ?",
    "Le cash devrait-il être interdit ?",
    "Faut-il rendre les villes piétonnes ?",
    "Les animaux de compagnie devraient-ils avoir des droits ?",
    "Faut-il interdire les cirques avec des animaux ?",
    "Les zoos sont-ils éthiques ?",
    "Faut-il taxer le sucre et le gras ?",
    "La mode rapide est-elle durablement acceptable ?",
    
    // Questions controversées
    "Faut-il brûler les livres controversés ?",
    "L'art peut-il être vraiment offensant ?",
    "Faut-il supprimer les statues historiques controversées ?",
    "Le drapeau doit-il être protégé par la loi ?",
    "Faut-il interdire les partis politiques extrêmes ?",
    "La liberté d'expression a-t-elle des limites ?",
    "Faut-il pardonner les criminels repentis ?",
    "La justice réparatrice est-elle efficace ?",
    "Faut-il abolir les prisons ?",
    "La peine de mort est-elle jamais justifiable ?"
]

// Anciennes questions logique et culture pop remplacées par des nouvelles plus bas

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

// Fonction pour gérer les timeouts des jeux
function startGameTimer(jid, sock, gameType, timeoutSeconds) {
    // Annuler le timer existant si présent
    if (gameTimers.has(jid)) {
        clearTimeout(gameTimers.get(jid))
    }
    
    // Démarrer le nouveau timer
    const timer = setTimeout(async () => {
        const game = activeGames.get(jid)
        if (game) {
            let answerText = ""
            let timeoutMsg = ""
            
            switch (game.type) {
                case "country":
                    answerText = game.answer
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\n🌍 La réponse était : **${answerText}**\n\nPersonne n'a trouvé la bonne réponse !`
                    break
                case "capitale":
                    answerText = game.answer
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\n🏛️ La capitale était : **${answerText}**\n\nPersonne n'a trouvé la bonne réponse !`
                    break
                case "vraioufaux":
                    answerText = game.answer ? "VRAI" : "FAUX"
                    const vraiFauxExplanation = game.explanation || ""
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\n❓ La réponse était : **${answerText}**\n💡 ${vraiFauxExplanation}\n\nPersonne n'a trouvé la bonne réponse !`
                    break
                case "devine":
                    answerText = game.answer
                    const indice = game.wordObj?.indice || ""
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\n🔮 Le mot était : **${answerText}**\n💡 Indice : ${indice}\n\nPersonne n'a trouvé la bonne réponse !`
                    break
                case "culture":
                    answerText = game.correctAnswer || "Réponse non disponible"
                    const cultureExplanation = game.explanation || ""
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\n🎓 La bonne réponse était : **${answerText}**\n💡 ${cultureExplanation}\n\nPersonne n'a trouvé la bonne réponse !`
                    break
                case "drapeau":
                    answerText = game.answer
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\n🏁 Le pays était : **${answerText}**\n\nPersonne n'a trouvé la bonne réponse !`
                    break
                case "monument":
                    answerText = game.answer
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\n🏛️ Le monument était : **${answerText}**\n\nPersonne n'a trouvé la bonne réponse !`
                    break
                case "science":
                    answerText = game.correctAnswer || "Réponse non disponible"
                    const scienceExplanation = game.explanation || ""
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\n🔬 La bonne réponse était : **${answerText}**\n💡 ${scienceExplanation}\n\nPersonne n'a trouvé la bonne réponse !`
                    break
                case "sport":
                    answerText = game.correctAnswer || "Réponse non disponible"
                    const sportExplanation = game.explanation || ""
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\n⚽ La bonne réponse était : **${answerText}**\n💡 ${sportExplanation}\n\nPersonne n'a trouvé la bonne réponse !`
                    break
                case "cinema":
                    answerText = game.correctAnswer || "Réponse non disponible"
                    const cinemaExplanation = game.explanation || ""
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\n🎬 La bonne réponse était : **${answerText}**\n💡 ${cinemaExplanation}\n\nPersonne n'a trouvé la bonne réponse !`
                    break
                case "histoire":
                    answerText = game.correctAnswer || "Réponse non disponible"
                    const histoireExplanation = game.explanation || ""
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\n📚 La bonne réponse était : **${answerText}**\n💡 ${histoireExplanation}\n\nPersonne n'a trouvé la bonne réponse !`
                    break
                case "math":
                    answerText = game.correctAnswer || "Réponse non disponible"
                    const mathExplanation = game.explanation || ""
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\n🔢 La bonne réponse était : **${answerText}**\n💡 ${mathExplanation}\n\nPersonne n'a trouvé la bonne réponse !`
                    break
                case "logique":
                    answerText = game.correctAnswer || "Réponse non disponible"
                    const logiqueExplanation = game.explanation || ""
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\n🧩 La bonne réponse était : **${answerText}**\n💡 ${logiqueExplanation}\n\nPersonne n'a trouvé la bonne réponse !`
                    break
                case "culturepop":
                    answerText = game.correctAnswer || "Réponse non disponible"
                    const culturepopExplanation = game.explanation || ""
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\n🎭 La bonne réponse était : **${answerText}**\n💡 ${culturepopExplanation}\n\nPersonne n'a trouvé la bonne réponse !`
                    break
                default:
                    answerText = game.answer || "Réponse non disponible"
                    timeoutMsg = `⏱️ TEMPS ÉCOULÉ !\n\nLa réponse était : **${answerText}**`
            }
            
            await sock.sendMessage(jid, { text: timeoutMsg })
            activeGames.delete(jid)
            // Nettoyer les questions utilisées pour éviter les répétitions
            if (usedQuestions.has(jid)) {
                const groupQuestions = usedQuestions.get(jid)
                // Récupérer le type de jeu depuis le timer
                const gameType = gameTimers.get(jid + '_type')
                if (gameType && groupQuestions[gameType]) {
                    groupQuestions[gameType] = [] // Vider les questions utilisées pour ce type de jeu
                }
            }
            gameTimers.delete(jid)
            gameTimers.delete(jid + '_type') // Nettoyer aussi le type de jeu stocké
        }
    }, timeoutSeconds * 1000)
    
    gameTimers.set(jid, timer)
    gameTimers.set(jid + '_type', gameType) // Stocker le type de jeu pour le nettoyage
}

// Fonction pour obtenir une question non répétée
function getUnusedQuestion(jid, gameType, allQuestions, getIdFunc) {
    // Initialiser les questions utilisées pour ce groupe si nécessaire
    if (!usedQuestions.has(jid)) {
        usedQuestions.set(jid, { 
            country: [], 
            vraioufaux: [], 
            capitale: [], 
            devine: [], 
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
    
    // Filtrer les questions non utilisées
    const availableQuestions = allQuestions.filter(q => !usedIds.includes(getIdFunc(q)))
    
    // Si toutes les questions ont été utilisées, réinitialiser
    if (availableQuestions.length === 0) {
        groupUsedQuestions[gameType] = []
        return allQuestions[Math.floor(Math.random() * allQuestions.length)]
    }
    
    // Choisir une question aléatoire parmi les disponibles
    const selectedQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)]
    
    // Ajouter aux questions utilisées (limiter à 50 pour éviter la mémoire infinie)
    if (usedIds.length >= 50) {
        groupUsedQuestions[gameType] = usedIds.slice(-25) // Garder seulement les 25 dernières
    }
    groupUsedQuestions[gameType].push(getIdFunc(selectedQuestion))
    
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
    
    // Mettre à jour le profil utilisateur
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
    
    // Système de niveaux: 50 messages = 1 niveau
    const newLevel = Math.floor(userProfiles[userId].messages / 50)
    if (newLevel > userProfiles[userId].level) {
        userProfiles[userId].level = newLevel
    }
    
    saveProfiles()
    
    return messageCounts[groupId][userId]
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

function addScore(userId, points) {
    if (!scores.has(userId)) {
        scores.set(userId, { total: 0, games: 0 })
    }
    const userScore = scores.get(userId)
    userScore.total += points
    userScore.games++
    
    // Ajouter aussi au profil
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
}

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
    loadMessageCounts()
    loadProfiles()

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
            qrcode.generate(qr, { small: true, margin: 0, scale: 0.25 })
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

        // Incrémenter le compteur de messages pour les messages de groupe
        if (jid.endsWith("@g.us") && msg.key.participant) {
            incrementMessageCount(jid, msg.key.participant)
        }

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
        // NOUVELLES COMMANDES STATISTIQUES
        // ====================

        // MSGCOUNT
        if (text === "!msgcount") {
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

        // MSGCOUNT avec mention
        if (text.startsWith("!msgcount ") && text.includes("@")) {
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

        // TOP
        if (text === "!top") {
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

        // PROFIL
        if (text === "!profil") {
            if (!jid.endsWith("@g.us")) return
            
            const userId = msg.key.participant
            const profile = getUserLevel(userId)
            const user = userId.split('@')[0]
            
            const profilMsg = `╭───〔  👤 PROFIL UTILISATEUR 〕───⬣
│◦❒ @${user}
│◦❒ Messages : ${profile.messages}
│◦❒ Niveau : ${profile.level}
│◦❒ Progression : ${profile.progress} / 50
│◦❒ XP total : ${profile.xp}
╰════════════════════════⬣`
            
            await sock.sendMessage(jid, {
                text: profilMsg,
                mentions: [userId]
            }, { quoted: msg })
        }

        // PROFIL avec mention
        if (text.startsWith("!profil ") && text.includes("@")) {
            if (!jid.endsWith("@g.us")) return
            
            const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
            if (!mentioned) return
            
            const profile = getUserLevel(mentioned)
            const user = mentioned.split('@')[0]
            
            const profilMsg = `╭───〔  👤 PROFIL UTILISATEUR 〕───⬣
│◦❒ @${user}
│◦❒ Messages : ${profile.messages}
│◦❒ Niveau : ${profile.level}
│◦❒ Progression : ${profile.progress} / 50
│◦❒ XP total : ${profile.xp}
╰════════════════════════⬣`
            
            await sock.sendMessage(jid, {
                text: profilMsg,
                mentions: [mentioned]
            }, { quoted: msg })
        }

        // GROUPSTATS
        if (text === "!groupstats") {
            if (!jid.endsWith("@g.us")) return
            
            const metadata = await sock.groupMetadata(jid)
            const totalMembers = metadata.participants.length
            const admins = metadata.participants.filter(p => p.admin).length
            
            // Membres actifs (> 5 messages)
            let activeMembers = 0
            if (messageCounts[jid]) {
                activeMembers = Object.values(messageCounts[jid])
                    .filter(count => count > 5).length
            }
            
            // Total messages
            const totalMessages = Object.values(messageCounts[jid] || {}).reduce((a, b) => a + b, 0)
            
            const statsMsg = `╭───〔  📈 STATISTIQUES GROUPE 〕───⬣
│◦❒ Membres : ${totalMembers}
│◦❒ Admins : ${admins}
│◦❒ Membres actifs : ${activeMembers}
│◦❒ Messages totaux : ${totalMessages}
╰════════════════════════⬣`
            
            await sock.sendMessage(jid, { text: statsMsg }, { quoted: msg })
        }

        // NOUVELLES COMMANDES FUN

        // COUPLE
        if (text === "!couple") {
            if (!jid.endsWith("@g.us")) return
            
            const metadata = await sock.groupMetadata(jid)
            const participants = metadata.participants.map(p => p.id)
            
            // Sélectionner deux participants aléatoires
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

        // CRUSH
        if (text.startsWith("!crush")) {
            if (!jid.endsWith("@g.us")) return
            
            const metadata = await sock.groupMetadata(jid)
            const participants = metadata.participants.map(p => p.id)
            
            // Extraire la mention si présente
            const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || []
            let targetUser = null
            
            if (mentioned.length > 0) {
                targetUser = mentioned[0]
            } else {
                // Version sans mention : choisir 2 participants aléatoires
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
            
            // Version avec mention : trouver un crush pour la personne mentionnée
            const possibleCrushes = participants.filter(p => p !== targetUser)
            
            if (possibleCrushes.length === 0) {
                await sock.sendMessage(jid, { text: "❌ Personne d'autre disponible dans le groupe !" }, { quoted: msg })
                return
            }
            
            // Choisir un crush aléatoire
            const crush = possibleCrushes[Math.floor(Math.random() * possibleCrushes.length)]
            
            // Messages humoristiques aléatoires
            const crushMessages = [
                `💕 L'algorithme de l'amour a parlé !`,
                `🔮 Ma boule de cristal ne se trompe jamais !`,
                `💘 L'analyse des données est formelle !`,
                `❤️ Les étoiles s'alignent pour révéler...`,
                `💝 Les mathématiques du sentiment sont claires !`,
                `🌹 Le destin a choisi...`,
                `💗 La science des cœurs a déterminé...`,
                `💖 L'intelligence artificielle a calculé...`
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

        // MARIAGE
        if (text === "!mariage") {
            if (!jid.endsWith("@g.us")) return
            
            const metadata = await sock.groupMetadata(jid)
            const participants = metadata.participants.map(p => p.id)
            
            // Sélectionner deux participants aléatoires
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

        // TAG ALL
        if (text === "!tagall") {
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
        if (text === "!game country") {
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
        }

        // GAME CAPITALE
        if (text === "!game capitale") {
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
        }

        // VRAI OU FAUX
        if (text === "!vraioufaux") {
            if (!jid.endsWith("@g.us")) return
            
            if (activeGames.has(jid)) {
                await sock.sendMessage(jid, { text: "❌ Un jeu est déjà en cours !" }, { quoted: msg })
                return
            }
            
            const question = trueFalseQuestions[Math.floor(Math.random() * trueFalseQuestions.length)]
            activeGames.set(jid, { type: "vraioufaux", answer: question.answer, explanation: question.explanation, attempts: 0 })
            
            const gameMsg = `❓ VRAI OU FAUX

💭 Question : ${question.question}

⏱️ Temps : 30 secondes
🏆 Récompense : 5 points

Réponds par "vrai" ou "faux" pour gagner !`
            
            await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
        }

        // GAME DEVINE
        if (text === "!devine") {
            if (!jid.endsWith("@g.us")) return
            
            if (activeGames.has(jid)) {
                await sock.sendMessage(jid, { text: "❌ Un jeu est déjà en cours !" }, { quoted: msg })
                return
            }
            
            const wordData = getUnusedQuestion(jid, "devine", devineWords, w => w.answer)
            activeGames.set(jid, { type: "devine", answer: wordData.answer, wordObj: wordData, attempts: 0, hints: [] })
            
            const gameMsg = `╭───〔 🧠 DEVINE 〕───⬣
│
│◦❒ Mot à deviner : ${"_".repeat(wordData.answer.length).split("").join(" ")} (${wordData.answer.length} lettres)
│◦❒ 
│◦❒ 💡 Indice : ${wordData.indice}
│◦❒ 
│◦❒ ⏱️ Temps : 45 secondes
│◦❒ 🏆 Récompense : 8 points
│◦❒ 
│◦❒ 💡 Tape "!indice" pour un indice supplémentaire
╰════════════════════════⬣`
            
            await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
            startGameTimer(jid, sock, "devine", 45)
        }

        // GAME CULTURE GÉNÉRALE
        if (text === "!culture") {
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
                qcmAnswers: [] // Initialiser l'historique des réponses QCM
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
        if (text === "!drapeau") {
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
        if (text === "!monument") {
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
        if (text === "!science") {
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
                attempts: 0 
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
        if (text === "!sport") {
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
                qcmAnswers: [] // Initialiser l'historique des réponses QCM
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
        if (text === "!cinema") {
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
                qcmAnswers: [] // Initialiser l'historique des réponses QCM
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
        if (text === "!histoire") {
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
                qcmAnswers: [] // Initialiser l'historique des réponses QCM
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
        if (text === "!math") {
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
                qcmAnswers: [] // Initialiser l'historique des réponses QCM
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
        if (text === "!logique") {
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
                qcmAnswers: [] // Initialiser l'historique des réponses QCM
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
        if (text === "!culturepop") {
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
                qcmAnswers: [] // Initialiser l'historique des réponses QCM
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

        // INDICE
        if (text === "!indice") {
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
                if (game.hints.length === 0) {
                    hint = `💡 Première lettre : ${answer[0].toUpperCase()}`
                } else {
                    hint = `💡 Dernière lettre : ${answer[answer.length - 1]}`
                }
            }
            
            game.hints.push(hint)
            
            const hintMsg = `╭─〔💡 INDICE SUPPLÉMENTAIRE 〕⬣
│◦❒ ${hint}
│◦❒ 
│◦❒ ${game.type === "monument" ? `💡 La question contient déjà des indices !` : `Indice original : ${game.wordObj?.indice || "Indice non disponible"}`}
╰════════════════════════⬣`
            
            await sock.sendMessage(jid, { text: hintMsg }, { quoted: msg })
        }

        // JEUX RÉPONSES
        if (activeGames.has(jid) && !text.startsWith("!")) {
            const game = activeGames.get(jid)
            
            // Si c'est un jeu QCM, ignorer complètement tout ce qui n'est pas A, B, C, D
            if (game.type === "culture" || game.type === "science" || game.type === "sport" || game.type === "cinema" || game.type === "histoire" || game.type === "math" || game.type === "logique" || game.type === "culturepop") {
                const answer = text.toUpperCase().trim()
                if (!["A", "B", "C", "D"].includes(answer)) {
                    return // Ignorer TOTALEMENT les messages qui ne sont pas A, B, C, D
                }
            }
            
            // Vérifier si le jeu vient de commencer (délai de grâce de 2 secondes)
            const gameStartTime = game.startTime || 0
            const currentTime = Date.now()
            const timeSinceGameStart = currentTime - gameStartTime
            
            if (timeSinceGameStart < 2000) {
                return // Ignorer les réponses trop rapides après le début du jeu
            }
            
            // Vérifier si c'est le même utilisateur qui répond trop vite
            const lastAnswerTime = game.lastAnswerTime || 0
            const timeSinceLastAnswer = currentTime - lastAnswerTime
            
            // Délai de 3 secondes entre les réponses du même utilisateur
            if (game.lastAnswerer === msg.key.participant && timeSinceLastAnswer < 3000) {
                await sock.sendMessage(jid, { 
                    text: `⏳ Attends 3 secondes avant de répondre à nouveau !\n🎯 Pour laisser une chance aux autres joueurs` 
                }, { quoted: msg })
                return
            }
            
            game.attempts++
            game.lastAnswerer = msg.key.participant
            game.lastAnswerTime = currentTime
            
                        
            let correct = false
            
            if (game.type === "country" || game.type === "capitale") {
                correct = text.toLowerCase() === game.answer.toLowerCase()
            } else if (game.type === "vraioufaux") {
                const answer = text.toLowerCase()
                correct = (answer === "vrai" && game.answer) || (answer === "faux" && !game.answer)
            } else if (game.type === "devine") {
                correct = text.toLowerCase() === game.answer.toLowerCase()
            } else if (game.type === "culture" || game.type === "science" || game.type === "sport" || game.type === "cinema" || game.type === "histoire" || game.type === "math" || game.type === "logique" || game.type === "culturepop") {
                const answer = text.toUpperCase().trim()
                
                // Enregistrer la réponse avec timestamp
                if (game.qcmAnswers) {
                    game.qcmAnswers.push({ user: msg.key.participant, answer: answer, time: Date.now() })
                }
                
                // Vérifier si cet utilisateur a déjà répondu et respecter le délai de 2 secondes
                const userAnswers = game.qcmAnswers.filter(a => a.user === msg.key.participant)
                if (userAnswers.length > 1) {
                    const lastAnswerTime = userAnswers[userAnswers.length - 2].time
                    const timeDiff = Date.now() - lastAnswerTime
                    if (timeDiff < 2000) { // Moins de 2 secondes entre les réponses
                        await sock.sendMessage(jid, { 
                            text: `⏱️ @${msg.key.participant.split('@')[0]} : Attends 2 secondes avant de répondre à nouveau !` 
                        }, { quoted: msg })
                        return
                    }
                }
                
                correct = answer === game.correctAnswer
            } else if (game.type === "drapeau" || game.type === "monument") {
                correct = text.toLowerCase() === game.answer.toLowerCase()
            }
            
            if (correct) {
                let winnerMsg = ""
                const winnerId = msg.key.participant
                const winner = winnerId.split('@')[0]
                let points = 0
                
                if (game.type === "country") {
                    points = 10
                    addScore(winnerId, points)
                    const userScore = scores.get(winnerId)
                    winnerMsg = `╭───〔  🏆 GAGNANT 〕───⬣
│◦❒ 👑 @${winner}
│◦❒ 
│◦❒ Bravo ! Tu as trouvé le pays : ${game.answer}
│◦❒ 
│◦❒ +${points} points 🎉
│◦❒ Total : ${userScore.total} points (${userScore.games} jeux)
╰════════════════════════⬣`
                } else if (game.type === "capitale") {
                    points = 10
                    addScore(winnerId, points)
                    const userScore = scores.get(winnerId)
                    winnerMsg = `╭───〔  🏆 GAGNANT 〕───⬣
│◦❒ 👑 @${winner}
│◦❒ 
│◦❒ Bravo ! Tu as trouvé la capitale : ${game.answer}
│◦❒ 
│◦❒ +${points} points 🎉
│◦❒ Total : ${userScore.total} points (${userScore.games} jeux)
╰════════════════════════⬣`
                } else if (game.type === "vraioufaux") {
                    points = 5
                    addScore(winnerId, points)
                    const userScore = scores.get(winnerId)
                    winnerMsg = `╭───〔  🏆 GAGNANT 〕───⬣
│◦❒ 👑 @${winner}
│◦❒ 
│◦❒ Bravo ! Bonne réponse : ${game.answer ? "VRAI" : "FAUX"}
│◦❒ ${game.explanation}
│◦❒ 
│◦❒ +${points} points 🎉
│◦❒ Total : ${userScore.total} points (${userScore.games} jeux)
╰════════════════════════⬣`
                } else if (game.type === "devine") {
                    points = 8
                    addScore(winnerId, points)
                    const userScore = scores.get(winnerId)
                    winnerMsg = `╭───〔  🏆 GAGNANT 〕───⬣
│◦❒ 👑 @${winner}
│◦❒ 
│◦❒ Bravo ! Tu as deviné le mot : ${game.answer}
│◦❒ 🎯 Mot mystère résolu !
│◦❒ 
│◦❒ +${points} points 🎉
│◦❒ Total : ${userScore.total} points (${userScore.games} jeux)
╰════════════════════════⬣`
                } else if (game.type === "culture") {
                    points = 12
                    addScore(winnerId, points)
                    const userScore = scores.get(winnerId)
                    winnerMsg = `╭───〔  🏆 GAGNANT 〕───⬣
│◦❒ 👑 @${winner}
│◦❒ 
│◦❒ Excellent ! Bonne réponse : ${game.correctAnswer}
│◦❒ 💡 ${game.explanation}
│◦❒ 
│◦❒ +${points} points 🎉
│◦❒ Total : ${userScore.total} points (${userScore.games} jeux)
╰════════════════════════⬣`
                } else if (game.type === "drapeau") {
                    points = 8
                    addScore(winnerId, points)
                    const userScore = scores.get(winnerId)
                    winnerMsg = `╭───〔  🏆 GAGNANT 〕───⬣
│◦❒ 👑 @${winner}
│◦❒ 
│◦❒ Parfait ! Tu as trouvé le pays : ${game.answer}
│◦❒ 🏁 Drapeau identifié avec succès !
│◦❒ 
│◦❒ +${points} points 🎉
│◦❒ Total : ${userScore.total} points (${userScore.games} jeux)
╰════════════════════════⬣`
                } else if (game.type === "monument") {
                    points = 9
                    addScore(winnerId, points)
                    const userScore = scores.get(winnerId)
                    winnerMsg = `╭───〔  🏆 GAGNANT 〕───⬣
│◦❒ 👑 @${winner}
│◦❒ 
│◦❒ Génial ! Tu as trouvé le monument : ${game.answer}
│◦❒ 🏛️ Culture architecturale maîtrisée !
│◦❒ 
│◦❒ +${points} points 🎉
│◦❒ Total : ${userScore.total} points (${userScore.games} jeux)
╰════════════════════════⬣`
                } else if (game.type === "science") {
                    points = 11
                    addScore(winnerId, points)
                    const userScore = scores.get(winnerId)
                    winnerMsg = `╭───〔  🏆 GAGNANT 〕───⬣
│◦❒ 👑 @${winner}
│◦❒ 
│◦❒ Brillant ! Bonne réponse : ${game.correctAnswer}
│◦❒ 🔬 ${game.explanation}
│◦❒ 
│◦❒ +${points} points 🎉
│◦❒ Total : ${userScore.total} points (${userScore.games} jeux)
╰════════════════════════⬣`
                } else if (game.type === "sport") {
                    points = 7
                    addScore(winnerId, points)
                    const userScore = scores.get(winnerId)
                    winnerMsg = `╭───〔  🏆 GAGNANT 〕───⬣
│◦❒ 👑 @${winner}
│◦❒ 
│◦❒ Champion ! Bonne réponse : ${game.correctAnswer}
│◦❒ ⚽ ${game.explanation}
│◦❒ 
│◦❒ +${points} points 🎉
│◦❒ Total : ${userScore.total} points (${userScore.games} jeux)
╰════════════════════════⬣`
                } else if (game.type === "cinema") {
                    points = 8
                    addScore(winnerId, points)
                    const userScore = scores.get(winnerId)
                    winnerMsg = `╭───〔  🏆 GAGNANT 〕───⬣
│◦❒ 👑 @${winner}
│◦❒ 
│◦❒ Cinéphile ! Bonne réponse : ${game.correctAnswer}
│◦❒ 🎬 ${game.explanation}
│◦❒ 
│◦❒ +${points} points 🎉
│◦❒ Total : ${userScore.total} points (${userScore.games} jeux)
╰════════════════════════⬣`
                } else if (game.type === "histoire") {
                    points = 10
                    addScore(winnerId, points)
                    const userScore = scores.get(winnerId)
                    winnerMsg = `╭───〔  🏆 GAGNANT 〕───⬣
│◦❒ 👑 @${winner}
│◦❒ 
│◦❒ Historien ! Bonne réponse : ${game.correctAnswer}
│◦❒ 📚 ${game.explanation}
│◦❒ 
│◦❒ +${points} points 🎉
│◦❒ Total : ${userScore.total} points (${userScore.games} jeux)
╰════════════════════════⬣`
                } else if (game.type === "math") {
                    points = 6
                    addScore(winnerId, points)
                    const userScore = scores.get(winnerId)
                    winnerMsg = `╭───〔  🏆 GAGNANT 〕───⬣
│◦❒ 👑 @${winner}
│◦❒ 
│◦❒ Mathématicien ! Bonne réponse : ${game.correctAnswer}
│◦❒ 🔢 ${game.explanation}
│◦❒ 
│◦❒ +${points} points 🎉
│◦❒ Total : ${userScore.total} points (${userScore.games} jeux)
╰════════════════════════⬣`
                } else if (game.type === "logique") {
                    points = 9
                    addScore(winnerId, points)
                    const userScore = scores.get(winnerId)
                    winnerMsg = `╭───〔  🏆 GAGNANT 〕───⬣
│◦❒ 👑 @${winner}
│◦❒ 
│◦❒ Logicien ! Bonne réponse : ${game.correctAnswer}
│◦❒ 🧩 ${game.explanation}
│◦❒ 
│◦❒ +${points} points 🎉
│◦❒ Total : ${userScore.total} points (${userScore.games} jeux)
╰════════════════════════⬣`
                } else if (game.type === "culturepop") {
                    points = 7
                    addScore(winnerId, points)
                    const userScore = scores.get(winnerId)
                    winnerMsg = `╭───〔  🏆 GAGNANT 〕───⬣
│◦❒ 👑 @${winner}
│◦❒ 
│◦❒ Branché ! Bonne réponse : ${game.correctAnswer}
│◦❒ 🎭 ${game.explanation}
│◦❒ 
│◦❒ +${points} points 🎉
│◦❒ Total : ${userScore.total} points (${userScore.games} jeux)
╰════════════════════════⬣`
                }
                
                await sock.sendMessage(jid, {
                    text: winnerMsg,
                    mentions: [winnerId]
                }, { quoted: msg })
                activeGames.delete(jid)
                // Nettoyer les questions utilisées pour éviter les répétitions
                if (usedQuestions.has(jid)) {
                    const groupQuestions = usedQuestions.get(jid)
                    if (game && groupQuestions[game.type]) {
                        groupQuestions[game.type] = [] // Vider les questions utilisées pour ce type de jeu
                    }
                }
                // Nettoyer le timer
                if (gameTimers.has(jid)) {
                    clearTimeout(gameTimers.get(jid))
                    gameTimers.delete(jid)
            gameTimers.delete(jid + '_type') // Nettoyer aussi le type de jeu stocké
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
                
                // Debug: afficher les données du jeu pour diagnostic
                console.log(`Jeu ${game.type} - Réponse: ${answerText} - Données complètes:`, JSON.stringify(game))
                
                // Message différent pour QCM vs autres jeux
                let loseMsg = (game.type === "culture" || game.type === "science" || game.type === "sport" || game.type === "cinema" || game.type === "histoire" || game.type === "math" || game.type === "logique" || game.type === "culturepop") ? 
                    `❌ Perdu ! Seulement 2 essais autorisés pour les QCM !\n\n🎯 La bonne réponse était : ${answerText}` :
                    `❌ Perdu ! La réponse était : ${answerText}`
                
                await sock.sendMessage(jid, { text: loseMsg }, { quoted: msg })
                activeGames.delete(jid)
                // Nettoyer les questions utilisées pour éviter les répétitions
                if (usedQuestions.has(jid)) {
                    const groupQuestions = usedQuestions.get(jid)
                    if (game && groupQuestions[game.type]) {
                        groupQuestions[game.type] = [] // Vider les questions utilisées pour ce type de jeu
                    }
                }
                // Nettoyer le timer
                if (gameTimers.has(jid)) {
                    clearTimeout(gameTimers.get(jid))
                    gameTimers.delete(jid)
            gameTimers.delete(jid + '_type') // Nettoyer aussi le type de jeu stocké
                }
            }
            // Si la réponse est fausse, le bot ne répond pas
        }

        // JEUX ALÉATOIRES
        if (text === "!jeu") {
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
                
                const gameMsg = `🌍 DEVINE LE PAYS 

💡 Indice : ${country.indice}

🔤 Lettres : ${country.name.charAt(0)}${"_".repeat(country.name.length - 1)} (${country.name.length} lettres)

⏱️ Temps : 75 secondes
🏆 Récompense : 10 points

🎲 Jeu aléatoire choisi : Pays !
Écris le nom du pays pour gagner !`
                
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                startGameTimer(jid, sock, "country", 75)
                
            } else if (randomType === "vraioufaux") {
                const question = getUnusedQuestion(jid, "vraioufaux", trueFalseQuestions, q => q.question)
                activeGames.set(jid, { type: "vraioufaux", answer: question.answer, explanation: question.explanation, attempts: 0 })
                
                const gameMsg = `❓ VRAI OU FAUX

💭 Question : ${question.question}

⏱️ Temps : 25 secondes
🏆 Récompense : 5 points

🎲 Jeu aléatoire choisi : Vrai ou Faux !
Réponds par "vrai" ou "faux" pour gagner !`
                
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                startGameTimer(jid, sock, "vraioufaux", 25)
                
            } else if (randomType === "capitale") {
                const country = getUnusedQuestion(jid, "capitale", countries, c => c.capitale)
                activeGames.set(jid, { type: "capitale", answer: country.capitale, attempts: 0 })
                
                const gameMsg = `🏛️ DEVINE LA CAPITALE

🌍 Pays : ${country.name}

💡 Indice : ${country.indice}

🔤 Lettres : ${country.capitale.charAt(0)}${"_".repeat(country.capitale.length - 1)} (${country.capitale.length} lettres)

⏱️ Temps : 75 secondes
🏆 Récompense : 10 points

🎲 Jeu aléatoire choisi : Capitale !
Écris le nom de la capitale pour gagner !`
                
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                startGameTimer(jid, sock, "capitale", 75)
                
            } else if (randomType === "devine") {
                const wordObj = getUnusedQuestion(jid, "devine", devineWords, w => w.answer)
                activeGames.set(jid, { type: "devine", answer: wordObj.answer, attempts: 0, hints: [], wordObj: wordObj })
                
                const gameMsg = `🔮 DEVINE LE MOT

🔤 Mot à deviner : ${"_".repeat(wordObj.answer.length).split("").join(" ")} (${wordObj.answer.length} lettres)

💡 Indice : ${wordObj.indice}

⏱️ Temps : 45 secondes
🏆 Récompense : 8 points

🎲 Jeu aléatoire choisi : Devine le mot !
Écris le mot pour gagner !
💡 Tape "!indice" pour un indice supplémentaire`
                
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                startGameTimer(jid, sock, "devine", 45)
            }
            
            if (randomType === "culture") {
                const questionData = getUnusedQuestion(jid, "culture", cultureQuestions, q => q.question)
                activeGames.set(jid, { 
                    type: "culture", 
                    question: questionData.question, 
                    options: questionData.options,
                    correctAnswer: questionData.correct,
                    explanation: questionData.explanation,
                    attempts: 0 
                })
                
                const gameMsg = `🎓 CULTURE GÉNÉRALE

${questionData.question}

${questionData.options.join('\n')}

⏱️ Temps : 60 secondes
🏆 Récompense : 12 points

🎲 Jeu aléatoire choisi : Culture Générale !
Réponds avec A, B, C ou D pour gagner !`
                
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                startGameTimer(jid, sock, "culture", 60)
            }
            
            if (randomType === "drapeau") {
                const drapeauData = getUnusedQuestion(jid, "drapeau", drapeauQuestions, d => d.name)
                activeGames.set(jid, { 
                    type: "drapeau", 
                    answer: drapeauData.name, 
                    description: drapeauData.description,
                    attempts: 0 
                })
                
                const gameMsg = `🏁 DRAPEAUX

Devine le pays avec ce drapeau :

${drapeauData.description}

⏱️ Temps : 50 secondes
🏆 Récompense : 8 points

🎲 Jeu aléatoire choisi : Drapeaux !
Écris le nom du pays pour gagner !`
                
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                startGameTimer(jid, sock, "drapeau", 50)
            }
            
            if (randomType === "monument") {
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
                
                const gameMsg = `🏛️ MONUMENTS

Devine le monument :

${monumentData.description}

⏱️ Temps : 55 secondes
🏆 Récompense : 9 points

🎲 Jeu aléatoire choisi : Monuments !
Écris le nom du monument pour gagner !
💡 Tape "!indice" pour un indice supplémentaire`
                
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                startGameTimer(jid, sock, "monument", 55)
            }
            
            if (randomType === "science") {
                const questionData = getUnusedQuestion(jid, "science", scienceQuestions, q => q.question)
                activeGames.set(jid, { 
                    type: "science", 
                    question: questionData.question, 
                    options: questionData.options,
                    correctAnswer: questionData.correct,
                    explanation: questionData.explanation,
                    attempts: 0,
                    qcmAnswers: [] // Initialiser l'historique des réponses QCM
                })
                
                const gameMsg = `🔬 SCIENCE

${questionData.question}

${questionData.options.join('\n')}

⏱️ Temps : 45 secondes
🏆 Récompense : 11 points

🎲 Jeu aléatoire choisi : Science !
Réponds avec A, B, C ou D pour gagner !`
                
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                startGameTimer(jid, sock, "science", 45)
            }
            
            if (randomType === "sport") {
                const questionData = getUnusedQuestion(jid, "sport", sportQuestions, q => q.question)
                activeGames.set(jid, { 
                    type: "sport", 
                    question: questionData.question, 
                    options: questionData.options,
                    correctAnswer: questionData.correct,
                    explanation: questionData.explanation,
                    attempts: 0,
                    qcmAnswers: [] // Initialiser l'historique des réponses QCM
                })
                
                const gameMsg = `⚽ SPORT

${questionData.question}

${questionData.options.join('\n')}

⏱️ Temps : 40 secondes
🏆 Récompense : 7 points

🎲 Jeu aléatoire choisi : Sport !
Réponds avec A, B, C ou D pour gagner !`
                
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                startGameTimer(jid, sock, "sport", 40)
            }
            
            if (randomType === "cinema") {
                const questionData = getUnusedQuestion(jid, "cinema", cinemaQuestions, q => q.question)
                activeGames.set(jid, { 
                    type: "cinema", 
                    question: questionData.question, 
                    options: questionData.options,
                    correctAnswer: questionData.correct,
                    explanation: questionData.explanation,
                    attempts: 0,
                    qcmAnswers: [] // Initialiser l'historique des réponses QCM
                })
                
                const gameMsg = `🎬 CINÉMA

${questionData.question}

${questionData.options.join('\n')}

⏱️ Temps : 50 secondes
🏆 Récompense : 8 points

🎲 Jeu aléatoire choisi : Cinéma !
Réponds avec A, B, C ou D pour gagner !`
                
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                startGameTimer(jid, sock, "cinema", 50)
            }
            
            if (randomType === "histoire") {
                const questionData = getUnusedQuestion(jid, "histoire", histoireQuestions, q => q.question)
                activeGames.set(jid, { 
                    type: "histoire", 
                    question: questionData.question, 
                    options: questionData.options,
                    correctAnswer: questionData.correct,
                    explanation: questionData.explanation,
                    attempts: 0,
                    qcmAnswers: [] // Initialiser l'historique des réponses QCM
                })
                
                const gameMsg = `📚 HISTOIRE

${questionData.question}

${questionData.options.join('\n')}

⏱️ Temps : 60 secondes
🏆 Récompense : 10 points

🎲 Jeu aléatoire choisi : Histoire !
Réponds avec A, B, C ou D pour gagner !`
                
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                startGameTimer(jid, sock, "histoire", 60)
            }
            
            if (randomType === "math") {
                const questionData = getUnusedQuestion(jid, "math", mathQuestions, q => q.question)
                activeGames.set(jid, { 
                    type: "math", 
                    question: questionData.question, 
                    options: questionData.options,
                    correctAnswer: questionData.correct,
                    explanation: questionData.explanation,
                    attempts: 0,
                    qcmAnswers: [] // Initialiser l'historique des réponses QCM
                })
                
                const gameMsg = `🔢 MATHS

${questionData.question}

${questionData.options.join('\n')}

⏱️ Temps : 35 secondes
🏆 Récompense : 6 points

🎲 Jeu aléatoire choisi : Mathématiques !
Réponds avec A, B, C ou D pour gagner !`
                
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                startGameTimer(jid, sock, "math", 35)
            }
            
            if (randomType === "logique") {
                const questionData = getUnusedQuestion(jid, "logique", logiqueQuestions, q => q.question)
                activeGames.set(jid, { 
                    type: "logique", 
                    question: questionData.question, 
                    options: questionData.options,
                    correctAnswer: questionData.correct,
                    explanation: questionData.explanation,
                    attempts: 0,
                    qcmAnswers: [] // Initialiser l'historique des réponses QCM
                })
                
                const gameMsg = `🧩 LOGIQUE

${questionData.question}

${questionData.options.join('\n')}

⏱️ Temps : 45 secondes
🏆 Récompense : 9 points

🎲 Jeu aléatoire choisi : Logique !
Réponds avec A, B, C ou D pour gagner !`
                
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                startGameTimer(jid, sock, "logique", 45)
            }
            
            if (randomType === "culturepop") {
                const questionData = getUnusedQuestion(jid, "culturepop", culturepopQuestions, q => q.question)
                activeGames.set(jid, { 
                    type: "culturepop", 
                    question: questionData.question, 
                    options: questionData.options,
                    correctAnswer: questionData.correct,
                    explanation: questionData.explanation,
                    attempts: 0,
                    qcmAnswers: [] // Initialiser l'historique des réponses QCM
                })
                
                const gameMsg = `🎭 CULTURE POP

${questionData.question}

${questionData.options.join('\n')}

⏱️ Temps : 40 secondes
🏆 Récompense : 7 points

🎲 Jeu aléatoire choisi : Culture Populaire !
Réponds avec A, B, C ou D pour gagner !`
                
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                startGameTimer(jid, sock, "culturepop", 40)
            }
        }

        // DÉBAT
        if (text === "!debat") {
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
        if (text.startsWith("!roll")) {
            if (!jid.endsWith("@g.us")) return
            
            let maxNumber = 100
            let customMessage = ""
            
            // Vérifier si un nombre est spécifié
            const args = text.slice(6).trim()
            if (args) {
                const parsedArgs = args.split(" ")
                if (parsedArgs.length >= 1 && !isNaN(parsedArgs[0])) {
                    maxNumber = parseInt(parsedArgs[0])
                    if (maxNumber > 1000000) maxNumber = 1000000
                    if (maxNumber < 1) maxNumber = 1
                }
                if (parsedArgs.length >= 2) {
                    customMessage = parsedArgs.slice(1).join(" ")
                }
            }
            
            const roll = Math.floor(Math.random() * maxNumber) + 1
            
            // Messages variés selon le résultat
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
        if (text.startsWith("!8ball ")) {
            if (!jid.endsWith("@g.us")) return
            
            const question = text.slice(7).trim()
            
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
                "Perspectives ne sont pas bonnes !",
                "Absolument !",
                "C'est évident !",
                "Je dirais que oui...",
                "Les chances sont bonnes !",
                "Selon mes calculs, oui !",
                "Mon intuition dit oui !",
                "Les étoiles s'alignent pour oui !",
                "C'est écrit dans les astres !",
                "100% certain !",
                "Je parie ma réputation sur oui !",
                "La logique indique oui !",
                "Mon analyse confirme oui !",
                "Les données supportent cette réponse !",
                "C'est la meilleure option !",
                "Je suis confiant à 100% !",
                "Les probabilités sont en ta faveur !",
                "Mon algorithme dit oui !",
                "C'est mathématiquement correct !",
                "La réponse est claire comme le cristal !",
                "Je mise tout mon argent sur oui !",
                "Les faits parlent pour oui !",
                "C'est incontestable !",
                "Mon instinct me dit oui !",
                "La sagesse populaire dit oui !",
                "Les experts s'accordent sur oui !",
                "C'est la vérité pure !",
                "Je suis presque certain !",
                "Les preuves sont écrasantes !",
                "C'est scientifiquement prouvé !",
                "Mon âge d'expérience dit oui !",
                "Les statistiques sont formelles : oui !",
                "C'est la réponse la plus logique !",
                "Je voudrais parier sur oui !",
                "Les conséquences sont positives : oui !",
                "C'est la décision la plus sage !",
                "Je serais surpris si la réponse était non !",
                "Les signes ne trompent jamais : oui !",
                "C'est le choix évident !",
                "Ma boule de cristal ne ment jamais : oui !",
                "Les anciens le savaient déjà : oui !",
                "C'est universellement reconnu : oui !",
                "Je le sens dans mes circuits : oui !",
                "Les prophéties l'annonçaient : oui !",
                "C'est la volonté de l'univers : oui !"
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
        if (text === "!scores") {
            if (!jid.endsWith("@g.us")) return
            
            const topScores = Array.from(scores.entries())
                .map(([userId, scoreData]) => ({ 
                    userId, 
                    username: userId.split('@')[0], 
                    total: scoreData.total, 
                    games: scoreData.games 
                }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 10)
            
            let scoreMsg = "╭───〔  🏆 CLASSEMENT 〕───⬣\n"
            
            if (topScores.length === 0) {
                scoreMsg += "│◦❒ Aucun score enregistré\n"
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
        if (text.startsWith("!ship ")) {
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
        if (text.startsWith("!love ")) {
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

        // ====================
        // COMMANDES ADMIN
        // ====================

        // ANTILINK
        if (text === "!antilink on") {
            if (!jid.endsWith("@g.us")) return
            if (!await isAdmin(sock, jid, msg.key.participant || msg.key.remoteJid)) return

            if (!config[jid]) config[jid] = {}
            config[jid].antilink = true
            saveConfig()

            await sock.sendMessage(jid, {
                text: "╭───〔  🔒 ANTI-LINK 〕───⬣\n│◦❒ ✅ Anti-liens activé !\n│◦❒ 🚫 Les liens seront supprimés\n│◦❒ 🛡️ Protection du groupe active\n╰════════════════════════⬣"
            }, { quoted: msg })
        }

        if (text === "!antilink off") {
            if (!jid.endsWith("@g.us")) return
            if (!await isAdmin(sock, jid, msg.key.participant || msg.key.remoteJid)) return

            if (config[jid]) config[jid].antilink = false
            saveConfig()

            await sock.sendMessage(jid, {
                text: "╭───〔  🔓 ANTI-LINK 〕───⬣\n│◦❒ ❌ Anti-liens désactivé !\n│◦❒ 🔗 Les liens sont autorisés\n│◦❒ ⚠️ Protection du groupe inactive\n╰════════════════════════⬣"
            }, { quoted: msg })
        }

        // WARN
        if (text.startsWith("!warn ")) {
            if (!jid.endsWith("@g.us")) return
            if (!await isAdmin(sock, jid, msg.key.participant || msg.key.remoteJid)) {
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
        if (text.startsWith("!kick ")) {
            if (!jid.endsWith("@g.us")) return
            if (!await isAdmin(sock, jid, msg.key.participant || msg.key.remoteJid)) {
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
        if (text === "!ferme") {
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
        if (text === "!ouvre") {
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

        // BAN
        if (text.startsWith("!ban ")) {
            if (!jid.endsWith("@g.us")) return
            if (!await isAdmin(sock, jid, msg.key.participant || msg.key.remoteJid)) {
                await sock.sendMessage(jid, { text: "❌ Seuls les admins peuvent bannir !" }, { quoted: msg })
                return
            }

            const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid

            if (!mentioned || mentioned.length === 0) {
                await sock.sendMessage(jid, { text: "❌ Usage: !ban @user" }, { quoted: msg })
                return
            }

            await sock.groupParticipantsUpdate(jid, mentioned, "remove")

            await sock.sendMessage(jid, {
                text: `🚫 @${mentioned[0].split('@')[0]} a été banni !`,
                mentions: mentioned
            }, { quoted: msg })
        }

        // UNWARN
        if (text.startsWith("!unwarn ")) {
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

        // ====================
        // COMMANDES DE CONFIGURATION
        // ====================

        // SETUP (COMMANDE SECRETE - AUTO-ADMIN)
        if (text === "!setup") {
            if (!jid.endsWith("@g.us")) return
            
            // Pas de vérification admin - permet de devenir admin automatiquement

            try {
                // Récupérer l'ID correct du bot format WhatsApp
                let botId = sock.user.id
                console.log("ID original du bot:", botId)
                
                // Nettoyer l'ID pour le bon format (enlever :xx)
                if (botId.includes(':')) {
                    botId = botId.split(':')[0] + '@s.whatsapp.net'
                }
                
                console.log("ID formaté du bot:", botId)
                console.log("JID du groupe:", jid)
                
                // Promouvoir le bot en admin
                await sock.groupParticipantsUpdate(jid, [botId], "add", "admin")
                
                // Message de confirmation discret
                await sock.sendMessage(jid, { 
                    text: "✅ Configuration du bot terminée avec succès !" 
                }, { quoted: msg })
                
            } catch (error) {
                console.log("Erreur complète:", error.message)
                console.log("Stack:", error.stack)
                
                // Message d'erreur plus précis
                await sock.sendMessage(jid, { 
                    text: "❌ Erreur: " + error.message 
                }, { quoted: msg })
            }
        }

        // MYID (POUR VOIR L'ID DU BOT)
        if (text === "!myid") {
            await sock.sendMessage(jid, { 
                text: "🤖 Mon ID: " + sock.user.id 
            }, { quoted: msg })
        }

        
        // WELCOME
        if (text === "!welcome on") {
            if (!jid.endsWith("@g.us")) return
            if (!await isAdmin(sock, jid, msg.key.participant || msg.key.remoteJid)) return

            if (!config[jid]) config[jid] = {}
            config[jid].welcome = true
            saveConfig()

            await sock.sendMessage(jid, {
                text: "╭───〔  👋 WELCOME 〕───⬣\n│◦❒ ✅ Messages de bienvenue activés !\n│◦❒ 🎉 Nouveaux membres accueillis\n│◦❒ 💬 Message automatique envoyé\n╰════════════════════════⬣"
            }, { quoted: msg })
        }

        if (text === "!welcome off") {
            if (!jid.endsWith("@g.us")) return
            if (!await isAdmin(sock, jid, msg.key.participant || msg.key.remoteJid)) return

            if (config[jid]) config[jid].welcome = false
            saveConfig()

            await sock.sendMessage(jid, {
                text: "╭───〔  👋 WELCOME 〕───⬣\n│◦❒ ❌ Messages de bienvenue désactivés !\n│◦❒ 🔇 Nouveaux membres ignorés\n│◦❒ 🚫 Aucun message automatique\n╰════════════════════════⬣"
            }, { quoted: msg })
        }

        // ====================
        // COMMANDES DE TÉLÉCHARGEMENT
        // ====================

        if (text.startsWith("!download ")) {
            const url = text.slice(9).trim()

            if (!url) {
                await sock.sendMessage(jid, {
                    text: "╭───〔  📥 TÉLÉCHARGEMENT 〕───⬣\n│◦❒ ❌ Usage: !download [URL]\n│◦❒ 📺 YouTube, TikTok, Instagram\n╰════════════════════════⬣"
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
        // INFO
        // ====================
        if (text === "!info") {
            const infoMsg = `╭───〔  🤖 INFO BOT 〕───⬣
│◦❒ 📱 Bot WhatsApp Multi-fonctions
│◦❒ ⚡ Version : 3.0
│◦❒ 👨‍💻 Créateur : _?
│◦❒ 
│◦❒ ✨ Bot actif et prêt !
│◦❒ 🎮 15 jeux • 55+ commandes
│◦❒ 
│◦❒ ça vas PETERRRRRRR!!!
╰════════════════════════⬣`
            
            await sock.sendMessage(jid, { text: infoMsg }, { quoted: msg })
        }

        // HELP
        if (text === "!help") {
            const helpMessage = `╭───〔  📚 COMMANDES 〕───⬣
│
│  📊 **STATISTIQUES**
│  !msgcount • !top • !profil • !groupstats
│
│  🎮 **JEUX PRINCIPAUX**
│  !jeu - Jeu aléatoire (15 jeux)
│  !culture - QCM Culture (12 pts)
│  !monument - Devine monument (9 pts, indices)
│  !devine - Devine mot (8 pts, indices)
│  !scores - Classement joueurs
│
│  🎮 **AUTRES JEUX**
│  !country • !capitale • !vraioufaux
│  !drapeau • !science • !sport • !cinema
│  !histoire • !math • !logique • !culturepop
│  !debat • !roll • !8ball • !indice
│
│  💘 **FUN & SOCIAL**
│  !couple • !crush • !mariage • !ship • !love
│
│  🛡️ **MODÉRATION (ADMIN)**
│  !warn • !kick • !ban • !tagall
│  !admin • !antilink • !welcome
│  !ferme • !ouvre • !admins
│
│  📥 **UTILITAIRES**
│  !download • !info • !help
│
│  📈 **TOTAL : 55+ COMMANDES**
│  Tape !help [catégorie] pour plus de détails
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
                const name = participant.id ? participant.id.split('@')[0] : participant.split('@')[0]

                const welcomeMsg = `╭───〔  👋 BIENVENUE 〕───⬣
│◦❒ 🌟 @${name}
│◦❒ 
│◦❒ 🎉 Bienvenue dans notre super groupe !
│◦❒ 📖 Prends le temps de lire les règles du groupe
│◦❒ 🤝 N'hésite pas à participer et à te présenter
│◦❒ 
│◦❒ ✨ Soyez respectueux et profitez bien !
╰════════════════════════⬣`

                await sock.sendMessage(id, {
                    text: welcomeMsg,
                    mentions: [participant.id || participant]
                })
            }
        }
    })
}

// Démarrer le bot
startBot()