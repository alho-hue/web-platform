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
    { name: "Argentine", capitale: "Buenos Aires", indice: "Pays du tango et du Messi", continent: "Amérique du Sud" },
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
    { question: "La Terre est plate", answer: false, explanation: "La Terre est ronde !" },
    { question: "1+1=3", answer: false, explanation: "1+1=2 !" },
    { question: "Le chat est un mammifère", answer: true, explanation: "Correct !" },
    { question: "Le soleil est une planète", answer: false, explanation: "Le soleil est une étoile !" },
    { question: "L'eau bout à 100°C", answer: true, explanation: "Correct !" },
    { question: "Les oiseaux peuvent voler tous", answer: false, explanation: "Le pingouin ne peut pas voler !" },
    { question: "Les humains ont 5 sens", answer: true, explanation: "Correct !" },
    { question: "La lune est une planète", answer: false, explanation: "La lune est un satellite !" },
    { question: "Le fer est plus lourd que le plomb", answer: false, explanation: "Le plomb est plus lourd que le fer !" },
    { question: "Les poissons respirent avec des poumons", answer: false, explanation: "Les poissons respirent avec des branchies !" },
    { question: "Le papier brûle à 100°C", answer: false, explanation: "Le papier brûle à 233°C !" },
    { question: "Les chauves-souris sont aveugles", answer: false, explanation: "Elles utilisent l'écholocation !" },
    { question: "Le cœur humain bat 100 fois par minute", answer: false, explanation: "Le cœur bat 60-80 fois par minute !" },
    { question: "Les abeilles sont des mammifères", answer: false, explanation: "Les abeilles sont des insectes !" },
    { question: "L'or est magnétique", answer: false, explanation: "L'or n'est pas magnétique !" },
    { question: "Les humains utilisent 100% de leur cerveau", answer: false, explanation: "Nous utilisons environ 10% de notre cerveau !" },
    { question: "La vitesse de la lumière est de 300000 km/s", answer: true, explanation: "Correct !" },
    { question: "Les grenouilles sont des mammifères", answer: false, explanation: "Les grenouilles sont des amphibiens !" },
    { question: "Le diamant est le minéral le plus dur", answer: true, explanation: "Correct !" },
    { question: "Les plantes respirent du CO2", answer: false, explanation: "Les plantes absorbent le CO2 et rejettent de l'oxygène !" },
    { question: "La Tour Eiffel mesure 100m", answer: false, explanation: "Elle mesure 324m !" },
    { question: "Les dauphins sont des poissons", answer: false, explanation: "Les dauphins sont des mammifères marins !" },
    { question: "Le zéro est un nombre positif", answer: false, explanation: "Le zéro est neutre !" },
    { question: "Les humains ont 32 dents", answer: true, explanation: "Correct !" },
    { question: "La Lune est plus grande que le Soleil", answer: false, explanation: "La Lune est beaucoup plus petite !" },
    { question: "Les araignées sont des insectes", answer: false, explanation: "Les araignées sont des arachnides !" },
    { question: "Le son voyage plus vite que la lumière", answer: false, explanation: "La lumière voyage plus vite que le son !" },
    { question: "Les pingouins peuvent voler", answer: false, explanation: "Les pingouins ne peuvent pas voler !" },
    { question: "La Terre a une seule lune", answer: true, explanation: "Correct !" },
    { question: "Les étoiles sont des planètes", answer: false, explanation: "Les étoiles ne sont pas des planètes !" },
    { question: "Les cactus poussent dans le désert", answer: true, explanation: "Correct !" },
    { question: "Les crocodiles mangent des humains", answer: false, explanation: "Les attaques sont très rares !" },
    { question: "Les nuages sont faits de coton", answer: false, explanation: "Les nuages sont faits de gouttelettes d'eau !" },
    { question: "Les éléphants ont peur des souris", answer: true, explanation: "Correct !" },
    { question: "Le papier est fait de bois", answer: true, explanation: "Correct !" },
    { question: "Les humains peuvent survivre sans eau 1 semaine", answer: true, explanation: "Correct !" },
    { question: "Les requins sont des poissons", answer: false, explanation: "Les requins sont des poissons cartilagineux !" },
    { question: "Les montagnes grandissent", answer: true, explanation: "Correct !" },
    { question: "Les papillons goûtent avec leurs pieds", answer: true, explanation: "Correct !" },
    { question: "Les bananes poussent sur les arbres", answer: true, explanation: "Correct !" },
    { question: "Les robots ont des sentiments", answer: false, explanation: "Les robots simulent les sentiments !" },
    { question: "L'univers a un début", answer: true, explanation: "Correct !" },
    { question: "Les fourmis peuvent soulever 50 fois leur poids", answer: true, explanation: "Correct !" },
    { question: "Les humains utilisent seulement 10% de leur cerveau", answer: false, explanation: "Nous utilisons environ 10% mais pas seulement 10% !" },
    { question: "Les méduses ont 100% d'eau", answer: true, explanation: "Correct !" },
    { question: "Les kangourous ne peuvent pas reculer", answer: true, explanation: "Correct !" },
    { question: "Les pieuvres ont 3 cœurs", answer: true, explanation: "Correct !" },
    { question: "Les étoiles filantes sont des étoiles", answer: false, explanation: "Ce sont des météorites !" },
    { question: "Les humains ont plus d'os bébés que d'adultes", answer: true, explanation: "Correct !" },
    { question: "Le café est fait de grains de blé", answer: false, explanation: "Le café vient des cerises de café !" },
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
    { question: " les corbeaux font des outils", answer: true, explanation: "Correct !" },
    { question: "Les hiboux voient en 3D", answer: true, explanation: "Correct !" },
    { question: "Les écureuils plantent des arbres", answer: false, explanation: "Ils oublient où ils ont planté !" },
    { question: "Les flamants roses mâles couvent les œufs", answer: true, explanation: "Correct !" },
    { question: " Les pandas sont des ours", answer: false, explanation: "Ce sont des pandas géants !" },
    { question: "Les chevaux ne peuvent pas vomir", answer: true, explanation: "Correct !" },
    { question: "Les éléphants ont une excellente mémoire", answer: true, explanation: "Correct !" },
    { question: "Les girafes ont le cou le plus long", answer: true, explanation: "Correct !" }
]

// Sujets de débat
const debateTopics = [
    "Est-ce que l'IA remplacera les humains ?",
    "Faut-il interdire les réseaux sociaux pour les moins de 16 ans ?",
    "Les jeux vidéo sont-ils un sport ?",
    "Faut-il travailler 4 jours par semaine ?",
    "Le chocolat est-il meilleur que la vanille ?",
    "Les chats sont-ils meilleurs que les chiens ?",
    "Faut-il supprimer les devoirs pendant les vacances ?",
    "Les séries Netflix sont-elles meilleures que les films au cinéma ?",
    "Faut-il rendre l'école gratuite pour tous ?",
    "Les fast foods doivent-ils avoir un avertissement santé ?",
    "Les réseaux sociaux sont-ils bons pour la santé mentale ?",
    "Faut-il interdire les voitures en centre-ville ?",
    "Les animaux domestiques sont-ils heureux en appartement ?",
    "Le télétravail est-il plus efficace que le bureau ?",
    "Faut-il apprendre le codage à l'école primaire ?",
    "Les vaccins devraient-ils être obligatoires ?",
    "La musique en streaming a-t-elle tué les CD ?",
    "Les livres papier sont-ils encore utiles à l'ère numérique ?",
    "Faut-il payer les étudiants pour leurs notes ?",
    "Les écrans OLED sont-ils meilleurs que les LCD ?",
    "Les voitures électriques sont-elles vraiment écologiques ?",
    "Le métavers est-il l'avenir d'internet ?",
    "Faut-il interdire la viande artificielle ?",
    "Les crypto-monnaies remplaceront-elles l'argent liquide ?",
    "Les IA génératives sont-elles de l'art ou du plagiat ?",
    "Faut-il réguler les deepfakes et les fake news ?",
    "Les smartphones devraient-ils avoir une batterie amovible ?",
    "Le cloud gaming est-il l'avenir du jeu vidéo ?",
    "Faut-il interdire les algorithmes sur les réseaux sociaux ?",
    "Les plantes végétales sont-elles vraiment éthiques ?",
    "Le voyage spatial est-il un gaspillage d'argent ?",
    "Les NFT sont-ils vraiment de l'art ou une arnaque ?",
    "Faut-il rendre les universités gratuites ?",
    "Les livraisons par drone sont-elles sûres ?",
    "Les maisons intelligentes sont-elles un risque pour la vie privée ?",
    "Faut-il interdire les publicités ciblées sur les enfants ?",
    "Les voitures autonomes partagent-elles nos données personnelles ?",
    "La vie sur Mars est-elle réservée aux milliardaires ?",
    "Faut-il interdire les algorithmes qui créent des bulles de filtre ?",
    "Les objets connectés sont-ils vraiment sécurisés ?",
    "La médecine prédictive est-elle l'avenir de la santé ?",
    "Faut-il payer les citoyens qui protègent l'environnement ?",
    "Les transports par hyperloop sont-ils vraiment réalisables ?",
    "La vie synthétique est-elle vraiment possible ?",
    "Faut-il interdire les publicités qui manipulent les émotions ?",
    "Les énergies marémotrices sont-elles vraiment propres ?",
    "La colonisation de la Lune est-elle encore pertinente ?",
    "Faut-il réguler les plateformes de micro-travail ?",
    "Les robots humanoïdes sont-ils vraiment humains ?",
    "La vie dans une simulation est-elle une vraie vie ?",
    "Faut-il interdire les armes autonomes dans les guerres ?",
    "Les voitures à hydrogène sont-elles vraiment l'avenir ?",
    "La téléportation est-elle de la science-fiction ou bientôt réalité ?",
    "Faut-il payer les gens qui recyclent vraiment ?",
    "Les robots dans les maisons sont-ils des aides ou des menaces ?",
    "La vie éternelle est-elle vraiment souhaitable ?",
    "Faut-il interdire les expériences génétiques sur humains ?",
    "Les transports par tubes pneumatiques sont-ils l'avenir ?",
    "La fusion froide est-elle vraiment contrôlable ?",
    "Faut-il réguler les plateformes de rencontres géolocalisées ?",
    "Les robots dans l'industrie sont-ils une menace pour l'emploi ?",
    "La vie dans des habitats sous-marins est-elle réaliste ?",
    "Faut-il interdire les armes biologiques ?",
    "Les voitures volantes personnelles sont-elles bientôt accessibles ?",
    "La colonisation d'autres planètes est-elle éthique ?",
    "Faut-il payer les gens qui innovent dans les énergies propres ?",
    "Les robots dans l'éducation sont-ils vraiment efficaces ?",
    "La vie sur Titan est-elle vraiment possible ?",
    "Faut-il réguler les algorithmes de recommandation ?",
    "Les objets connectés médicaux sont-ils vraiment sûrs ?",
    "La vie en apesanteur est-elle vraiment souhaitable ?",
    "Faut-il interdire les armes autonomes dans la police ?",
    "Les voitures solaires sont-elles vraiment efficaces ?",
    "La colonisation d'astéroïdes est-elle nécessaire ?",
    "Faut-il payer les gens qui protègent la biodiversité ?",
    "Les robots dans l'agriculture sont-ils vraiment durables ?",
    "La vie sur une exoplanète est-elle vraiment possible ?",
    "Faut-il réguler les plateformes de partage de vidéos ?",
    "Les robots humanoïdes ont-ils vraiment des droits ?",
    "La vie en réalité augmentée est-elle vraiment l'avenir ?",
    "Faut-il interdire les armes à énergie cinétique ?",
    "Les voitures amphibies sont-elles vraiment utiles ?",
    "La colonisation de Mars est-elle réservée aux scientifiques ?",
    "Faut-il payer les gens qui développent des logiciels libres ?",
    "Les robots dans l'espace sont-ils vraiment nécessaires ?",
    "La vie synthétique est-elle vraiment la vie ?",
    "Faut-il réguler les plateformes d'intelligence artificielle ?",
    "Les voitures à air comprimé sont-elles vraiment propres ?",
    "La vie sur Europe est-elle vraiment possible ?",
    "Faut-il payer les gens qui font de la recherche fondamentale ?",
    "Les robots dans les hôpitaux sont-ils vraiment sûrs ?",
    "La vie dans des cités sous-marines est-elle réaliste ?",
    "Faut-il interdire les armes autonomes dans les civils ?",
    "Les voitures électriques à induction sont-elles vraiment efficaces ?",
    "La colonisation de la Lune est-elle encore pertinente ?",
    "Faut-il payer les gens qui recyclent les métaux rares ?",
    "Les robots dans l'armée sont-ils vraiment éthiques ?",
    "La vie en hibernation est-elle vraiment possible ?",
    "Faut-il réguler les plateformes de micro-travail ?",
    "Les robots humanoïdes sont-ils vraiment conscients ?",
    "La vie dans des habitats spatiaux est-elle vraiment souhaitable ?",
    "Faut-il interdire les armes autonomes dans les guerres ?",
    "Les voitures solaires sont-elles vraiment efficaces ?",
    "La colonisation d'astéroïdes est-elle nécessaire ?",
    "Faut-il payer les gens qui protègent la biodiversité ?",
    "Les robots dans l'agriculture sont-ils vraiment durables ?",
    "La vie sur une exoplanète est-elle vraiment possible ?",
    "Faut-il réguler les plateformes de partage de vidéos ?",
    "Les robots humanoïdes ont-ils vraiment des droits ?",
    "La vie en réalité augmentée est-elle vraiment l'avenir ?",
    "Faut-il interdire les armes à énergie cinétique ?",
    "Les voitures amphibies sont-elles vraiment utiles ?",
    "La colonisation de Mars est-elle réservée aux scientifiques ?",
    "Faut-il payer les gens qui développent des logiciels libres ?",
    "Les robots dans l'espace sont-ils vraiment nécessaires ?",
    "La vie synthétique est-elle vraiment la vie ?",
    "Faut-il réguler les plateformes d'intelligence artificielle ?",
    "Les voitures à air comprimé sont-elles vraiment propres ?",
    "La vie sur Europe est-elle vraiment possible ?",
    "Faut-il payer les gens qui font de la recherche fondamentale ?",
    "Les robots dans les hôpitaux sont-ils vraiment sûrs ?",
    "La vie dans des cités sous-marines est-elle réaliste ?",
    "Faut-il interdire les armes autonomes dans les civils ?",
    "Les voitures électriques à induction sont-elles vraiment efficaces ?",
    "La colonisation de la Lune est-elle encore pertinente ?",
    "Faut-il payer les gens qui recyclent les métaux rares ?"
]

// Mots pour le jeu de devinettes
const devineWords = [
    // Animaux
    { answer: "chat", indice: "Animal qui miaule et ronronne" },
    { answer: "chien", indice: "Meilleur ami de l'homme qui aboie" },
    { answer: "elephant", indice: "Plus grand animal terrestre avec une trompe" },
    { answer: "lion", indice: "Roi de la jungle avec une crinière" },
    { answer: "souris", indice: "Petit rongeur qui adore le fromage" },
    { answer: "poisson", indice: "Animal qui vit dans l'eau et nage" },
    { answer: "oiseau", indice: "Animal qui vole et a des plumes" },
    { answer: "serpent", indice: "Reptile long sans pattes qui rampe" },
    
    // Nature
    { answer: "soleil", indice: "Étoile qui nous donne la lumière et la chaleur" },
    { answer: "lune", indice: "Satellite naturel de la Terre" },
    { answer: "eau", indice: "Liquide indispensable à la vie" },
    { answer: "feu", indice: "Élément qui chauffe et brûle" },
    { answer: "arbre", indice: "Plante avec un tronc et des feuilles" },
    { answer: "fleur", indice: "Plante colorée qui sent bon" },
    { answer: "plage", indice: "Sable au bord de la mer" },
    { answer: "montagne", indice: "Très haute colline" },
    { answer: "foret", indice: "Endroit avec beaucoup d'arbres" },
    { answer: "desert", indice: "Endroit très chaud et sec avec du sable" },
    
    // Objets
    { answer: "voiture", indice: "Véhicule à 4 roues pour se déplacer" },
    { answer: "maison", indice: "Endroit où on habite" },
    { answer: "livre", indice: "Objet avec des pages pour lire" },
    { answer: "table", indice: "Meuble avec 4 pieds pour poser des choses" },
    { answer: "chaise", indice: "Meuble pour s'asseoir" },
    { answer: "porte", indice: "Pour entrer ou sortir d'une pièce" },
    { answer: "fenetre", indice: "Ouverture avec du verre pour voir dehors" },
    { answer: "telephone", indice: "Appareil pour appeler et envoyer des messages" },
    { answer: "ordinateur", indice: "Machine pour travailler et jouer" },
    { answer: "television", indice: "Écran pour regarder des films et émissions" },
    { answer: "radio", indice: "Appareil pour écouter de la musique" },
    { answer: "horloge", indice: "Montre les heures et les minutes" },
    { answer: "lampe", indice: "Objet qui éclaire une pièce" },
    { answer: "couteau", indice: "Ustensile pour couper" },
    { answer: "fourchette", indice: "Ustensile pour manger" },
    
    // Aliments
    { answer: "pomme", indice: "Fruit rouge ou vert" },
    { answer: "banane", indice: "Fruit jaune et long que les singes adorent" },
    { answer: "orange", indice: "Fruit rond et orange plein de vitamine C" },
    { answer: "pain", indice: "Aliment qu'on mange avec du beurre" },
    { answer: "fromage", indice: "Produit laitier qui fond sur les pizzas" },
    { answer: "chocolat", indice: "Douceur brune qui fait fondre" },
    { answer: "pizza", indice: "Plat italien rond avec du fromage" },
    { answer: "pates", indice: "Nourriture italienne longue" },
    { answer: "riz", indice: "Grain blanc qu'on mange en Asie" },
    { answer: "salade", indice: "Plat vert avec des légumes" },
    
    // Sports et activités
    { answer: "football", indice: "Sport avec un ballon qu'on ne touche pas avec les mains" },
    { answer: "basketball", indice: "Sport où on lance un ballon dans un panier" },
    { answer: "tennis", indice: "Sport avec une raquette et une balle jaune" },
    { answer: "natation", indice: "Sport de nage dans l'eau" },
    { answer: "course", indice: "Sport de course à pied" },
    { answer: "velo", indice: "Véhicule à 2 roues qu'on pédale" },
    
    // Divers
    { answer: "ecole", indice: "Endroit où on va apprendre" },
    { answer: "hopital", indice: "Endroit où on va quand on est malade" },
    { answer: "magasin", indice: "Endroit où on achète des choses" },
    { answer: "cinema", indice: "Endroit où on regarde des films sur grand écran" },
    { answer: "musique", indice: "Art des sons et des mélodies" },
    { answer: "jeu", indice: "Activité pour s'amuser" },
    { answer: "cadeau", indice: "Qu'on offre pour un anniversaire" },
    { answer: "fete", indice: "Célébration avec des gens" },
    { answer: "voyage", indice: "Déplacement vers un autre endroit" },
    { answer: "reve", indice: "Ce qu'on voit la nuit en dormant" }
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
        if (text === "!crush") {
            if (!jid.endsWith("@g.us")) return
            
            const metadata = await sock.groupMetadata(jid)
            const participants = metadata.participants.map(p => p.id)
            
            // Sélectionner deux participants aléatoires
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

⏱️ Temps : 60 secondes
🏆 Récompense : 10 points

Écris le nom de la capitale pour gagner !`
            
            await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
        }

        // DEVINE
        if (text === "!devine") {
            if (!jid.endsWith("@g.us")) return
            
            if (activeGames.has(jid)) {
                await sock.sendMessage(jid, { text: "❌ Un jeu est déjà en cours !" }, { quoted: msg })
                return
            }
            
            const devineWords = [
                // Animaux
                { answer: "chat", indice: "Animal qui miaule et ronronne" },
                { answer: "chien", indice: "Meilleur ami de l'homme qui aboie" },
                { answer: "elephant", indice: "Plus grand animal terrestre avec une trompe" },
                { answer: "lion", indice: "Roi de la jungle avec une crinière" },
                { answer: "souris", indice: "Petit rongeur qui adore le fromage" },
                { answer: "poisson", indice: "Animal qui vit dans l'eau et nage" },
                { answer: "oiseau", indice: "Animal qui vole et a des plumes" },
                { answer: "serpent", indice: "Reptile long sans pattes qui rampe" },
                
                // Nature
                { answer: "soleil", indice: "Étoile qui nous donne la lumière et la chaleur" },
                { answer: "lune", indice: "Satellite naturel de la Terre" },
                { answer: "eau", indice: "Liquide indispensable à la vie" },
                { answer: "feu", indice: "Élément qui chauffe et brûle" },
                { answer: "arbre", indice: "Plante avec un tronc et des feuilles" },
                { answer: "fleur", indice: "Plante colorée qui sent bon" },
                { answer: "plage", indice: "Sable au bord de la mer" },
                { answer: "montagne", indice: "Très haute colline" },
                { answer: "foret", indice: "Endroit avec beaucoup d'arbres" },
                { answer: "desert", indice: "Endroit très chaud et sec avec du sable" },
                
                // Objets
                { answer: "voiture", indice: "Véhicule à 4 roues pour se déplacer" },
                { answer: "maison", indice: "Endroit où on habite" },
                { answer: "livre", indice: "Objet avec des pages pour lire" },
                { answer: "table", indice: "Meuble avec 4 pieds pour poser des choses" },
                { answer: "chaise", indice: "Meuble pour s'asseoir" },
                { answer: "porte", indice: "Pour entrer ou sortir d'une pièce" },
                { answer: "fenetre", indice: "Ouverture avec du verre pour voir dehors" },
                { answer: "telephone", indice: "Appareil pour appeler et envoyer des messages" },
                { answer: "ordinateur", indice: "Machine pour travailler et jouer" },
                { answer: "television", indice: "Écran pour regarder des films et émissions" },
                { answer: "radio", indice: "Appareil pour écouter de la musique" },
                { answer: "horloge", indice: "Montre les heures et les minutes" },
                { answer: "lampe", indice: "Objet qui éclaire une pièce" },
                { answer: "couteau", indice: "Ustensile pour couper" },
                { answer: "fourchette", indice: "Ustensile pour manger" },
                
                // Aliments
                { answer: "pomme", indice: "Fruit rouge ou vert" },
                { answer: "banane", indice: "Fruit jaune et long que les singes adorent" },
                { answer: "orange", indice: "Fruit rond et orange plein de vitamine C" },
                { answer: "pain", indice: "Aliment qu'on mange avec du beurre" },
                { answer: "fromage", indice: "Produit laitier qui fond sur les pizzas" },
                { answer: "chocolat", indice: "Douceur brune qui fait fondre" },
                { answer: "pizza", indice: "Plat italien rond avec du fromage" },
                { answer: "pates", indice: "Nourriture italienne longue" },
                { answer: "riz", indice: "Grain blanc qu'on mange en Asie" },
                { answer: "salade", indice: "Plat vert avec des légumes" },
                
                // Sports et activités
                { answer: "football", indice: "Sport avec un ballon qu'on ne touche pas avec les mains" },
                { answer: "basketball", indice: "Sport où on lance un ballon dans un panier" },
                { answer: "tennis", indice: "Sport avec une raquette et une balle jaune" },
                { answer: "natation", indice: "Sport de nage dans l'eau" },
                { answer: "course", indice: "Sport de course à pied" },
                { answer: "velo", indice: "Véhicule à 2 roues qu'on pédale" },
                
                // Divers
                { answer: "ecole", indice: "Endroit où on va apprendre" },
                { answer: "hopital", indice: "Endroit où on va quand on est malade" },
                { answer: "magasin", indice: "Endroit où on achète des choses" },
                { answer: "cinema", indice: "Endroit où on regarde des films sur grand écran" },
                { answer: "musique", indice: "Art des sons et des mélodies" },
                { answer: "jeu", indice: "Activité pour s'amuser" },
                { answer: "cadeau", indice: "Qu'on offre pour un anniversaire" },
                { answer: "fete", indice: "Célébration avec des gens" },
                { answer: "voyage", indice: "Déplacement vers un autre endroit" },
                { answer: "reve", indice: "Ce qu'on voit la nuit en dormant" }
            ]
            
            const wordData = devineWords[Math.floor(Math.random() * devineWords.length)]
            activeGames.set(jid, { type: "devine", answer: wordData.answer, indice: wordData.indice, attempts: 0, hints: [] })
            
            const gameMsg = `╭───〔 🧠 DEVINE 〕───⬣
│
│ Indice :
│ ${wordData.indice}
│
│ Réponse ?
│
│ ⏱️ 40 secondes
│
╰════════════════════════⬣`
            
            await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
        }

        // INDICE
        if (text === "!indice") {
            if (!jid.endsWith("@g.us")) return
            
            const game = activeGames.get(jid)
            if (!game || game.type !== "devine") {
                await sock.sendMessage(jid, { text: "❌ Aucun jeu de devine en cours !" }, { quoted: msg })
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
            
            const answer = game.answer
            let hint = ""
            
            if (game.hints.length === 0) {
                hint = `💡 Première lettre : ${answer[0].toUpperCase()}`
            } else {
                hint = `💡 Dernière lettre : ${answer[answer.length - 1]}`
            }
            
            game.hints.push(hint)
            
            const hintMsg = `╭─〔💡 INDICE SUPPLÉMENTAIRE 〕⬣
│◦❒ ${hint}
│◦❒ 
│◦❒ Indice original : ${game.wordObj.indice}
╰════════════════════════⬣`
            
            await sock.sendMessage(jid, { text: hintMsg }, { quoted: msg })
        }

        // JEUX RÉPONSES
        if (activeGames.has(jid) && !text.startsWith("!")) {
            const game = activeGames.get(jid)
            game.attempts++
            
            let correct = false
            
            if (game.type === "country" || game.type === "capitale") {
                correct = text.toLowerCase() === game.answer.toLowerCase()
            } else if (game.type === "vraioufaux") {
                const answer = text.toLowerCase()
                correct = (answer === "vrai" && game.answer) || (answer === "faux" && !game.answer)
            } else if (game.type === "devine") {
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
                    points = 6
                    addScore(winnerId, points)
                    const userScore = scores.get(winnerId)
                    winnerMsg = `╭───〔  🏆 GAGNANT 〕───⬣
│◦❒ 👑 @${winner}
│◦❒ 
│◦❒ Bravo ! Tu as deviné le mot : ${game.answer}
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
            } else if (game.attempts >= 5) {
                const answerText = game.type === "vraioufaux" ? 
                    (game.answer ? "VRAI" : "FAUX") : game.answer
                await sock.sendMessage(jid, { 
                    text: `❌ Perdu ! La réponse était : ${answerText}` 
                }, { quoted: msg })
                activeGames.delete(jid)
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
            
            const gameTypes = ["country", "vraioufaux", "capitale", "devine"]
            const randomType = gameTypes[Math.floor(Math.random() * gameTypes.length)]
            
            if (randomType === "country") {
                const country = countries[Math.floor(Math.random() * countries.length)]
                activeGames.set(jid, { type: "country", answer: country.name, attempts: 0 })
                
                const gameMsg = `🌍 DEVINE LE PAYS 

💡 Indice : ${country.indice}

🔤 Lettres : ${country.name.charAt(0)}${"_".repeat(country.name.length - 1)} (${country.name.length} lettres)

⏱️ Temps : 60 secondes
🏆 Récompense : 10 points

🎲 Jeu aléatoire choisi : Pays !
Écris le nom du pays pour gagner !`
                
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                
            } else if (randomType === "vraioufaux") {
                const question = trueFalseQuestions[Math.floor(Math.random() * trueFalseQuestions.length)]
                activeGames.set(jid, { type: "vraioufaux", answer: question.answer, explanation: question.explanation, attempts: 0 })
                
                const gameMsg = `❓ VRAI OU FAUX

💭 Question : ${question.question}

⏱️ Temps : 30 secondes
🏆 Récompense : 5 points

🎲 Jeu aléatoire choisi : Vrai ou Faux !
Réponds par "vrai" ou "faux" pour gagner !`
                
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                
            } else if (randomType === "capitale") {
                const country = countries[Math.floor(Math.random() * countries.length)]
                activeGames.set(jid, { type: "capitale", answer: country.capitale, attempts: 0 })
                
                const gameMsg = `🏛️ DEVINE LA CAPITALE

🌍 Pays : ${country.name}

💡 Indice : ${country.indice}

🔤 Lettres : ${country.capitale.charAt(0)}${"_".repeat(country.capitale.length - 1)} (${country.capitale.length} lettres)

⏱️ Temps : 60 secondes
🏆 Récompense : 10 points

🎲 Jeu aléatoire choisi : Capitale !
Écris le nom de la capitale pour gagner !`
                
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
                
            } else if (randomType === "devine") {
                const wordObj = devineWords[Math.floor(Math.random() * devineWords.length)]
                activeGames.set(jid, { type: "devine", answer: wordObj.answer, attempts: 0, hints: [], wordObj: wordObj })
                
                const gameMsg = `🔮 DEVINE LE MOT

🔤 Mot à deviner : ${"_".repeat(wordObj.answer.length).split("").join(" ")} (${wordObj.answer.length} lettres)

⏱️ Temps : 60 secondes
🏆 Récompense : 8 points

🎲 Jeu aléatoire choisi : Devine le mot !
Écris le mot pour gagner !
💡 Tape "!indice" pour un indice`
                
                await sock.sendMessage(jid, { text: gameMsg }, { quoted: msg })
            }
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
                await sock.sendMessage(jid, { text: "❌ Mentionne quelqu'un avec !crush @utilisateur" }, { quoted: msg })
                return
            }
            
            // Exclure l'utilisateur lui-même
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

        // DÉBAT
        if (text === "!debat") {
            if (!jid.endsWith("@g.us")) return
            
            const topic = debateTopics[Math.floor(Math.random() * debateTopics.length)]
            
            const debateMsg = `╭───〔  🗣️ DÉBAT 〕───⬣
│◦❒ Sujet : ${topic}
│◦❒ 
│◦❒ Donnez votre avis !
╰════════════════════════⬣`
            
            await sock.sendMessage(jid, { text: debateMsg }, { quoted: msg })
        }

        // ROLL
        if (text === "!roll") {
            if (!jid.endsWith("@g.us")) return
            
            const roll = Math.floor(Math.random() * 100) + 1
            
            const rollMsg = `╭───〔  🎲 LANCER DE DÉ 〕───⬣
│◦❒ Résultat : ${roll}/100
│◦❒ 
│◦❒ ${roll >= 90 ? "🎉 Incroyable !" : roll >= 70 ? "✨ Très bien !" : roll >= 50 ? "👍 Bien !" : roll >= 30 ? "😐 Pas mal !" : "😅 Peut mieux faire !"}
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
│◦❒ 👨‍💻 Développé par _?
│◦❒ 
│◦❒ 🎮 Jeux : Country, Capitale, Vrai/Faux, Devine
│◦❒ 📊 Stats : Compteur messages, Profils, Classements
│◦❒ 🛡️ Modération : Anti-link, Warn, Kick, Ban
│◦❒ 💘 Fun : Couple, Crush, Mariage, Ship, Love, 8Ball
│◦❒ 📈 Statistiques : !msgcount, !top, !profil, !groupstats
│◦❒ 
│◦❒ ✨ Bot actif et prêt !
╰════════════════════════⬣`
            
            await sock.sendMessage(jid, { text: infoMsg }, { quoted: msg })
        }

        // HELP
        if (text === "!help") {
            const helpMessage = `╭───〔  📚 COMMANDES 〕───⬣
│
│  📊 **STATISTIQUES**
│  !msgcount [@user] - Messages
│  !top - Top 10 actifs
│  !profil [@user] - Profil + niveau
│  !groupstats - Stats du groupe
│
│  🎮 **JEUX**
│  !game country - Devine le pays
│  !vraioufaux - Quiz vrai ou faux
│  !game capitale - Devine la capitale
│  !devine - Devine avec indice
│  !jeu - Jeu aléatoire
│  !debat - Lance un débat
│  !roll - Lance un dé (1-100)
│  !8ball [question] - Magic 8 ball
│  !scores - Voir le classement
│
│  💘 **FUN**
│  !couple - Couple du jour
│  !crush - Crush secret
│  !mariage - Mariage fictif
│  !ship @u1 @u2 - Compatibilité
│  !love @user - Potentiel d'amour
│
│  🛡️ **MODÉRATION** (admins)
│  !antilink on/off - Anti-liens
│  !warn @user [raison] - Avertir
│  !kick @user - Expulser
│  !ban @user - Bannir
│  !unwarn @user - Supprimer warns
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
│  !info - Infos du bot
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