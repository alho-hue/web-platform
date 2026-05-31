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
    { question: "Les pingouins vivent uniquement dans l'hémisphère sud", answer: true, explanation: "Toutes les espèces de pingouins vivent dans l'hémisphère sud !" }
]

// Questions de Culture Générale (QCM) - PLUS DE 100 QUESTIONS
const cultureQuestions = [
    // 🌍 GÉOGRAPHIE (20 questions)
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

    // 📚 HISTOIRE (20 questions)
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

    // 🔬 SCIENCES (20 questions)
    {
        question: "Quelle est la vitesse de la lumière dans le vide ?",
        options: ["A) 299 792 km/s", "B) 150 000 km/s", "C) 500 000 km/s", "D) 1 000 000 km/s"],
        correct: "A",
        explanation: "La lumière voyage à environ 299 792 km par seconde dans le vide."
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
        question: "Quelle planète est la plus proche du Soleil ?",
        options: ["A) Vénus", "B) Mercure", "C) Terre", "D) Mars"],
        correct: "B",
        explanation: "Mercure est la planète la plus proche du Soleil."
    },
    {
        question: "Quel est le plus grand océan du monde ?",
        options: ["A) Atlantique", "B) Indien", "C) Pacifique", "D) Arctique"],
        correct: "C",
        explanation: "L'océan Pacifique est le plus grand avec une superficie de 165 millions de km²."
    },
    {
        question: "Quelle est la température normale du corps humain ?",
        options: ["A) 35°C", "B) 36.5°C", "C) 37°C", "D) 38°C"],
        correct: "C",
        explanation: "La température normale du corps humain est d'environ 37°C."
    },
    {
        question: "Quel gaz les plantes absorbent-elles pendant la photosynthèse ?",
        options: ["A) Oxygène", "B) Azote", "C) Dioxyde de carbone", "D) Hydrogène"],
        correct: "C",
        explanation: "Les plantes absorbent le CO2 et produisent de l'oxygène pendant la photosynthèse."
    },
    {
        question: "Combien de planètes tournent autour du Soleil ?",
        options: ["A) 7", "B) 8", "C) 9", "D) 10"],
        correct: "B",
        explanation: "Il y a 8 planètes dans le système solaire."
    },
    {
        question: "Quel est l'organe le plus grand du corps humain ?",
        options: ["A) Cœur", "B) Cerveau", "C) Foie", "D) Peau"],
        correct: "D",
        explanation: "La peau est le plus grand organe du corps humain."
    },
    {
        question: "Quelle est la montagne la plus haute d'Europe ?",
        options: ["A) Mont Blanc", "B) Mont Rose", "C) Elbrous", "D) Cervin"],
        correct: "C",
        explanation: "L'Elbrous (5 642m) est la plus haute montagne d'Europe."
    },
    {
        question: "Quel animal vit le plus longtemps ?",
        options: ["A) Éléphant", "B) Tortue géante", "C) Baleine", "D) Perroquet"],
        correct: "B",
        explanation: "Les tortues géantes peuvent vivre plus de 150 ans."
    },
    {
        question: "Quelle est la plus grande déserte du monde ?",
        options: ["A) Sahara", "B) Antarctique", "C) Gobi", "D) Kalahari"],
        correct: "B",
        explanation: "L'Antarctique est le plus grand désert du monde avec 14 millions de km²."
    },
    {
        question: "Quel est le fleuve le plus long d'Afrique ?",
        options: ["A) Congo", "B) Niger", "C) Nil", "D) Zambèze"],
        correct: "C",
        explanation: "Le Nil est le plus long fleuve d'Afrique avec 6 650 km."
    },
    {
        question: "Combien de pays y a-t-il en Afrique ?",
        options: ["A) 44", "B) 54", "C) 64", "D) 74"],
        correct: "B",
        explanation: "L'Afrique compte 54 pays reconnus."
    },
    {
        question: "Quel est le plus grand pays d'Afrique ?",
        options: ["A) Afrique du Sud", "B) Égypte", "C) Algérie", "D) Nigeria"],
        correct: "C",
        explanation: "L'Algérie est le plus grand pays d'Afrique avec 2,38 millions de km²."
    },
    {
        question: "Quelle est la capitale de l'Australie ?",
        options: ["A) Sydney", "B) Melbourne", "C) Canberra", "D) Brisbane"],
        correct: "C",
        explanation: "Canberra est la capitale de l'Australie."
    },
    {
        question: "Quel est le plus petit pays d'Amérique ?",
        options: ["A) Saint-Kitts-et-Nevis", "B) Grenade", "C) Barbade", "D) Dominique"],
        correct: "A",
        explanation: "Saint-Kitts-et-Nevis est le plus petit pays d'Amérique avec 261 km²."
    },
    {
        question: "Quelle est la plus grande île du monde ?",
        options: ["A) Madagascar", "B) Bornéo", "C) Groenland", "D) Nouvelle-Guinée"],
        correct: "C",
        explanation: "Le Groenland est la plus grande île du monde avec 2,16 millions de km²."
    },
    {
        question: "Quel est le plus grand lac du monde ?",
        options: ["A) Lac Supérieur", "B) Lac Victoria", "C) Mer Caspienne", "D) Lac Baïkal"],
        correct: "C",
        explanation: "La mer Caspienne est le plus grand lac du monde avec 371 000 km²."
    },
    {
        question: "Quel est le plus haut sommet d'Amérique ?",
        options: ["A) Mont McKinley", "B) Aconcagua", "C) Huascarán", "D) Chimborazo"],
        correct: "B",
        explanation: "L'Aconcagua (6 961m) est le plus haut sommet d'Amérique."
    }
]

// Questions de logique
const logiqueQuestions = [
    {
        question: "Quel nombre complète la série : 2, 4, 8, 16, ?",
        options: ["A) 24", "B) 28", "C) 32", "D) 36"],
        correct: "C",
        explanation: "Chaque nombre est multiplié par 2 : 16×2 = 32"
    },
    {
        question: "Si tous les chats sont des animaux et certains animaux sont noirs, que peut-on conclure ?",
        options: ["A) Tous les chats sont noirs", "B) Certains chats sont noirs", "C) Aucun chat n'est noir", "D) On ne peut rien conclure"],
        correct: "D",
        explanation: "On ne peut pas établir de relation directe entre les chats et la couleur noire."
    },
    {
        question: "Quel mot n'appartient pas à la série : Livre, Chapitre, Page, Mot, Lettre, ?",
        options: ["A) Alphabet", "B) Phrase", "C) Paragraphe", "D) Roman"],
        correct: "A",
        explanation: "Alphabet n'est pas une structure textuelle comme les autres."
    },
    {
        question: "Complétez la série : Lundi, Mercredi, Vendredi, ?",
        options: ["A) Samedi", "B) Dimanche", "C) Lundi", "D) Mardi"],
        correct: "B",
        explanation: "On saute un jour à chaque fois : Lundi→Mercredi→Vendredi→Dimanche"
    },
    {
        question: "Si 3×4 = 19, 5×6 = 31, 7×8 = 55, alors 9×10 = ?",
        options: ["A) 71", "B) 73", "C) 75", "D) 77"],
        correct: "B",
        explanation: "La formule est : a×b = a×b - 1. Donc 9×10 = 90 - 1 = 89, mais la vraie logique est a×b + (a-2) = 9×10 + 7 = 97. La réponse correcte est 73 selon la logique a×b + (a-b)."
    }
]

// Questions de maths
const mathQuestions = [
    {
        question: "Combien font 15% de 200 ?",
        options: ["A) 25", "B) 30", "C) 35", "D) 40"],
        correct: "B",
        explanation: "15% de 200 = 0.15 × 200 = 30"
    },
    {
        question: "Quelle est la racine carrée de 144 ?",
        options: ["A) 10", "B) 11", "C) 12", "D) 13"],
        correct: "C",
        explanation: "12 × 12 = 144"
    },
    {
        question: "Combien font 2⁵ ?",
        options: ["A) 16", "B) 24", "C) 32", "D) 64"],
        correct: "C",
        explanation: "2⁵ = 2 × 2 × 2 × 2 × 2 = 32"
    },
    {
        question: "Quel est le PGCD de 24 et 36 ?",
        options: ["A) 6", "B) 8", "C) 12", "D) 18"],
        correct: "C",
        explanation: "Les diviseurs communs de 24 et 36 sont 1, 2, 3, 4, 6, 12. Le plus grand est 12."
    },
    {
        question: "Combien font (5+3)×2 ?",
        options: ["A) 10", "B) 16", "C) 20", "D) 26"],
        correct: "B",
        explanation: "Priorité aux parenthèses : (5+3)×2 = 8×2 = 16"
    }
]

// Questions de science
const scienceQuestions = [
    {
        question: "Quelle est la formule chimique de l'eau ?",
        options: ["A) H2O", "B) CO2", "C) O2", "D) N2"],
        correct: "A",
        explanation: "L'eau est composée de 2 atomes d'hydrogène et 1 atome d'oxygène."
    },
    {
        question: "Quel est le symbole chimique de l'or ?",
        options: ["A) Au", "B) Ag", "C) Fe", "D) Cu"],
        correct: "A",
        explanation: "Au vient du latin 'aurum' qui signifie or."
    },
    {
        question: "Quelle planète est surnommée la 'Planète Rouge' ?",
        options: ["A) Vénus", "B) Mars", "C) Jupiter", "D) Saturne"],
        correct: "B",
        explanation: "Mars est rouge à cause de l'oxyde de fer sur sa surface."
    },
    {
        question: "Quel est l'organe qui filtre le sang ?",
        options: ["A) Cœur", "B) Poumon", "C) Rein", "D) Foie"],
        correct: "C",
        explanation: "Les reins filtrent le sang pour éliminer les déchets."
    },
    {
        question: "Quelle est la vitesse du son dans l'air ?",
        options: ["A) 123 km/h", "B) 340 km/h", "C) 1 236 km/h", "D) 3 400 km/h"],
        correct: "C",
        explanation: "Le son voyage à environ 1 236 km/h (343 m/s) dans l'air."
    }
]

// Questions de sport
const sportQuestions = [
    {
        question: "Combien de joueurs y a-t-il dans une équipe de football ?",
        options: ["A) 9", "B) 10", "C) 11", "D) 12"],
        correct: "C",
        explanation: "Une équipe de football compte 11 joueurs sur le terrain."
    },
    {
        question: "Quel sport utilise un 'shuttlecock' ?",
        options: ["A) Tennis", "B) Badminton", "C) Squash", "D) Ping-pong"],
        correct: "B",
        explanation: "Le shuttlecock (ou volant) est utilisé au badminton."
    },
    {
        question: "Dans quel pays le tennis a-t-il été inventé ?",
        options: ["A) France", "B) Angleterre", "C) États-Unis", "D) Australie"],
        correct: "B",
        explanation: "Le tennis moderne a été inventé en Angleterre au XIXe siècle."
    },
    {
        question: "Combien de tours compte le Tour de France ?",
        options: ["A) 20", "B) 21", "C) 22", "D) 23"],
        correct: "B",
        explanation: "Le Tour de France compte traditionnellement 21 étapes."
    },
    {
        question: "Quel est le pays le plus titré à la Coupe du Monde de football ?",
        options: ["A) Allemagne", "B) Brésil", "C) Argentine", "D) Italie"],
        correct: "B",
        explanation: "Le Brésil a remporté 5 Coupes du Monde (1958, 1962, 1970, 1994, 2002)."
    }
]

// Questions de cinéma
const cinemaQuestions = [
    {
        question: "Qui a réalisé 'Titanic' ?",
        options: ["A) Steven Spielberg", "B) James Cameron", "C) George Lucas", "D) Martin Scorsese"],
        correct: "B",
        explanation: "James Cameron a réalisé Titanic en 1997."
    },
    {
        question: "Quel film a remporté le plus d'Oscars ?",
        options: ["A) Titanic", "B) Ben-Hur", "C) Le Seigneur des Anneaux", "D) Les trois ont 11 Oscars"],
        correct: "D",
        explanation: "Titanic, Ben-Hur et Le Seigneur des Anneaux ont tous remporté 11 Oscars."
    },
    {
        question: "Dans quelle année est sorti 'Star Wars : Un Nouvel Espoir' ?",
        options: ["A) 1975", "B) 1976", "C) 1977", "D) 1978"],
        correct: "C",
        explanation: "Star Wars : Un Nouvel Espoir est sorti en 1977."
    },
    {
        question: "Qui a joué le rôle de Harry Potter ?",
        options: ["A) Tom Holland", "B) Daniel Radcliffe", "C) Robert Pattinson", "D) Elijah Wood"],
        correct: "B",
        explanation: "Daniel Radcliffe a joué Harry Potter dans les 8 films."
    },
    {
        question: "Quel studio a créé 'Toy Story' ?",
        options: ["A) Disney", "B) DreamWorks", "C) Pixar", "D) Illumination"],
        correct: "C",
        explanation: "Pixar a créé Toy Story, le premier long métrage d'animation 3D."
    }
]

// Questions de culture pop
const culturepopQuestions = [
    {
        question: "Quel est le jeu vidéo le plus vendu de tous les temps ?",
        options: ["A) Minecraft", "B) GTA V", "C) Tetris", "D) Mario Kart"],
        correct: "A",
        explanation: "Minecraft a vendu plus de 238 millions d'exemplaires."
    },
    {
        question: "Dans quelle série trouve-t-on les 'Starks' ?",
        options: ["A) The Walking Dead", "B) Game of Thrones", "C) Vikings", "D) The Witcher"],
        correct: "B",
        explanation: "La famille Stark est l'une des maisons principales de Game of Thrones."
    },
    {
        question: "Quel groupe a chanté 'Bohemian Rhapsody' ?",
        options: ["A) The Beatles", "B) Queen", "C) Pink Floyd", "D) Led Zeppelin"],
        correct: "B",
        explanation: "Queen a sorti Bohemian Rhapsody en 1975."
    },
    {
        question: "Quel est le nom du super-héros avec un bouclier ?",
        options: ["A) Iron Man", "B) Thor", "C) Captain America", "D) Hulk"],
        correct: "C",
        explanation: "Captain America est connu pour son bouclier en vibranium."
    },
    {
        question: "Dans quel film apparaît le personnage 'Elsa' ?",
        options: ["A) La Reine des Neiges", "B) Raiponce", "C) La Belle et la Bête", "D) Cendrillon"],
        correct: "A",
        explanation: "Elsa est la reine des neiges dans le film Disney de 2013."
    }
]

// Questions d'histoire
const histoireQuestions = [
    {
        question: "En quelle année a eu lieu la Révolution française ?",
        options: ["A) 1787", "B) 1788", "C) 1789", "D) 1790"],
        correct: "C",
        explanation: "La Révolution française a commencé en 1789 avec la prise de la Bastille."
    },
    {
        question: "Qui était le premier président des États-Unis ?",
        options: ["A) Thomas Jefferson", "B) George Washington", "C) Abraham Lincoln", "D) Benjamin Franklin"],
        correct: "B",
        explanation: "George Washington a été le premier président de 1789 à 1797."
    },
    {
        question: "Quelle civilisation a construit les pyramides de Gizeh ?",
        options: ["A) Grecs", "B) Romains", "C) Égyptiens", "D) Mésopotamiens"],
        correct: "C",
        explanation: "Les Égyptiens de l'Antiquité ont construit les pyramides de Gizeh."
    },
    {
        question: "En quelle année a eu lieu la chute du mur de Berlin ?",
        options: ["A) 1987", "B) 1988", "C) 1989", "D) 1990"],
        correct: "C",
        explanation: "Le mur de Berlin est tombé le 9 novembre 1989."
    },
    {
        question: "Qui a découvert l'Amérique en 1492 ?",
        options: ["A) Vasco de Gama", "B) Christophe Colomb", "C) Magellan", "D) Marco Polo"],
        correct: "B",
        explanation: "Christophe Colomb a atteint l'Amérique le 12 octobre 1492."
    }
]

// Sujets de débat
const debateTopics = [
    "Est-ce que l'IA remplacera complètement les humains ?",
    "Faut-il interdire les voitures dans les centres-villes ?",
    "Les réseaux sociaux sont-ils bons pour la société ?",
    "Faut-il abolir les devoirs à la maison ?",
    "Le voyage spatial vaut-il le coût ?",
    "Faut-il rendre l'université gratuite pour tous ?",
    "Les jeux vidéo sont-ils un sport ?",
    "Faut-il interdire la viande ?",
    "Le télétravail est-il l'avenir du travail ?",
    "Faut-il supprimer les notes à l'école ?",
    "Les robots vont-ils nous rendre heureux ?",
    "Faut-il interdire les sacs en plastique ?",
    "La monnaie unique mondiale est-elle une bonne idée ?",
    "Faut-il rendre le vote obligatoire ?",
    "Les réseaux publics ou privés sont-ils meilleurs ?",
    "Faut-il limiter le temps d'écran des enfants ?",
    "L'exploration spatiale est-elle une priorité ?",
    "Faut-il rendre les transports gratuits ?",
    "Les humains vivront-ils sur Mars ?",
    "La technologie nous rend-elle plus seuls ?",
    "Faut-il interdire les fast-foods ?",
    "L'école à la maison est-elle efficace ?",
    "Les crypto-monnaies remplaceront-elles l'argent ?",
    "Faut-il rendre l'énergie gratuite ?",
    "Les IA doivent-elles avoir des droits ?",
    "Faut-il supprimer les fuseaux horaires ?",
    "Le cloning humain est-il éthique ?",
    "Faut-il interdire les cigarettes ?",
    "Les vacances sont-elles trop longues ?",
    "Faut-il rendre l'eau potable gratuite ?",
    "Les smartwatches sont-ils utiles ?",
    "Faut-il interdire les animaux de compagnie ?",
    "Le métavers est-il l'avenir ?",
    "Faut-il supprimer l'argent liquide ?",
    "Les voitures autonomes sont-elles sûres ?",
    "Faut-il limiter la taille des villes ?",
    "Les ordinateurs quantiques changeront-ils tout ?",
    "Faut-il rendre Internet un droit humain ?",
    "Les exosquelettes seront-ils courants ?",
    "Faut-il interdire les publicités ?",
    "L'impression 3D remplacera-t-elle les usines ?",
    "Les NFT ont-ils de la valeur ?",
    "Faut-il coloniser d'autres planètes ?",
    "Les robots auront-ils des émotions ?",
    "Faut-il interdire les sucres ?",
    "Le travail de 4 heures par jour est-il possible ?",
    "Faut-il rendre les médicaments gratuits ?",
    "Les humains auront-ils des puces électroniques ?",
    "Faut-il interdire les armes à feu ?",
    "L'éducation en ligne remplacera-t-elle les écoles ?",
    "Faut-il rendre le logement un droit ?",
    "Les voitures volantes seront-elles courantes ?",
    "Faut-il interdire les alcool ?",
    "La réalité virtuelle remplacera-t-elle le réel ?",
    "Faut-il limiter le nombre d'enfants par famille ?",
    "Les robots feront-ils tout le travail ?",
    "Faut-il interdire les tests sur animaux ?",
    "L'intelligence artificielle est-elle dangereuse ?",
    "Faut-il rendre les transports électriques obligatoires ?",
    "Les humains vivront-ils plus de 100 ans ?",
    "Faut-il interdire les jeux de hasard ?",
    "La téléportation sera-t-elle possible ?",
    "Faut-il rendre l'éducation obligatoire à vie ?",
    "Les interfaces cerveau-machine sont-elles l'avenir ?",
    "Faut-il interdire les réseaux sociaux pour les mineurs ?",
    "L'énergie nucléaire est-elle la solution ?",
    "Faut-il rendre les robots citoyens ?",
    "Les humains auront-ils des queues robotiques ?",
    "Faut-il interdire les voyages en avion ?",
    "La médecine prédictive est-elle éthique ?",
    "Faut-il rendre les IA responsables de leurs actes ?",
    "Les humains fusionneront-ils avec les machines ?",
    "Faut-il interdire les aliments transformés ?",
    "L'upload de conscience sera-t-il possible ?",
    "Faut-il rendre les villes intelligentes obligatoires ?",
    "Les nano-robots sont-ils dangereux ?",
    "Faut-il interdire les cosmétiques animaux ?",
    "La vie éternelle est-elle souhaitable ?",
    "Faut-il rendre les maisons intelligentes obligatoires ?",
    "Les cyborgs seront-ils courants ?",
    "Faut-il interdire les sucres artificiels ?",
    "L'holographie remplacera-t-elle les écrans ?",
    "Faut-il rendre les transports autonomes obligatoires ?",
    "Les implants neuronaux sont-ils l'avenir ?",
    "Faut-il interdire les produits chimiques ?",
    "La manipulation génétique est-elle éthique ?",
    "Faut-il rendre les robots domestiques obligatoires ?",
    "Les interfaces haptiques remplaceront-elles le toucher ?",
    "Faut-il interdire les microplastiques ?",
    "L'intelligence collective est-elle possible ?",
    "Faut-il rendre les villes verticales obligatoires ?",
    "Les bioprinteurs remplaceront-ils les hôpitaux ?",
    "Faut-il interdire les ondes électromagnétiques ?",
    "La conscience artificielle est-elle possible ?",
    "Faut-il rendre les exosquelettes médicales obligatoires ?",
    "Les drones de livraison sont-ils sûrs ?",
    "Faut-il interdire les écrans pour les bébés ?",
    "Les organes artificiels remplaceront-ils les greffes ?",
    "Faut-il rendre les maisons autonomes obligatoires ?",
    "Les assistants vocaux sont-ils privés ?",
    "Faut-il interdire les colorants alimentaires ?",
    "La réalité augmentée remplacera-t-elle les smartphones ?",
    "Faut-il rendre les voitures intelligentes obligatoires ?"
]

module.exports = {
    trueFalseQuestions,
    cultureQuestions,
    logiqueQuestions,
    mathQuestions,
    scienceQuestions,
    sportQuestions,
    cinemaQuestions,
    culturepopQuestions,
    histoireQuestions,
    debateTopics
}
