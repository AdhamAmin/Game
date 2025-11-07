/* ---
  Main Script for Words Game
  Based on the provided image and video
--- */

// --- Config Placeholder ---
const config = {
    // NOTE: Replace "YOUR_GEMINI_API_KEY" with your actual key
    API_KEY: "YOUR_GEMINI_API_KEY",
};

// --- Game State Variables ---
let currentLanguage = 'ar'; // Default to Arabic
const languages = ['ar', 'en', 'it', 'es'];
let currentLangIndex = 0;

let isPaused = false;
let soundEnabled = true;
let musicVolume = 0.5;
let sfxVolume = 0.7;
let audioContext = null;
let bgMusic = null;
let playerName = 'Player';
let playerCode = '';
let friends = [];
let sounds = {};

// --- Player Stats for AI ---
let playerStats = {
    level: 1,
    progress: 0, // Default progress is 0 words
    currency: 1230,
    correctInRow: 0,
    hintUsed: 0,
    powerHintUsed: 0,
    topics: {
        general: { correct: 0, total: 0 },
        geography: { correct: 0, total: 0 },
        science: { correct: 0, total: 0 },
        history: { correct: 0, total: 0 },
    }
};

// --- Current Puzzle State ---
let currentPuzzle = {
    word: "", // e.g., "LONDON"
    hint: "", // e.g., "Capital of the UK"
    letters: [], // e.g., ['L', 'O', 'N', 'D', 'O', 'N', 'A', 'B', 'C', 'X', 'Y', 'Z']
    answer: [], // e.g., [null, null, null, null, null, null]
    filledIndexes: [], // Tracks which answer-box index is filled
    firstEmptyBox: 0, // The first index of answer-boxes that is null
};

// --- Translations ---
const translations = {
    en: {
        title: "Dr.WEEE's World",
        gameTitle: "WORDS",
        loading: "Loading...",
        aiLoading: "Finding a new puzzle...",
        beginner: "Beginner",
        expert: "Expert",
        continueLevel: "Level",
        level: "Level",
        settings: "Settings",
        playerName: "Player Name",
        musicVolume: "Music Volume",
        sfxVolume: "SFX Volume",
        chooseBackground: "Choose Background",
        friends: "Friends",
        yourCode: "Your Player Code",
        addFriend: "Add Friend by Code",
        add: "Add Friend",
        leaderboard: "Leaderboard",
        reportProblem: "Report a problem",
        levelComplete: "Level Complete!",
        greatJob: "Great job!",
        continueNext: "Continue",
        aiError: "Could not load puzzle. Check connection or API Key.",
        aiErrorTitle: "Error",
        tryAgain: "Try Again",
        mainMenu: "Main Menu",
        copy: "Copy",
        copied: "Copied!",
        word: "Word",
        hint: "Hint",
        category: "Category",
        letters: "Letters",
        puzzleError: "Could not get a puzzle from the AI. Retrying...",
        puzzleParseError: "Failed to parse AI response. Retrying...",
        apiKeyError: "API Key is missing. Please add it to script.js.",
        chooseLanguage: "Choose Language" // NEW
    },
    ar: {
        title: "Dr.WEEE's World",
        gameTitle: "كلمات",
        loading: "تحميل...",
        aiLoading: "البحث عن لغز جديد...",
        beginner: "مبتدئ",
        expert: "متعلم",
        continueLevel: "المستوى",
        level: "المستوى",
        settings: "الإعدادات",
        playerName: "اسم اللاعب",
        musicVolume: "مستوى الموسيقى",
        sfxVolume: "مستوى المؤثرات",
        chooseBackground: "اختر الخلفية",
        friends: "الأصدقاء",
        yourCode: "رمز اللاعب الخاص بك",
        addFriend: "أضف صديق بالرمز",
        add: "إضافة صديق",
        leaderboard: "المتصدرين",
        reportProblem: "الإبلاغ عن مشكلة",
        levelComplete: "اكتمل المستوى!",
        greatJob: "عمل رائع!",
        continueNext: "متابعة",
        aiError: "لم نتمكن من تحميل اللغز. تحقق من الاتصال أو مفتاح API.",
        aiErrorTitle: "خطأ",
        tryAgain: "حاول مرة أخرى",
        mainMenu: "القائمة الرئيسية",
        copy: "نسخ",
        copied: "تم النسخ!",
        word: "كلمة",
        hint: "تلميح",
        category: "فئة",
        letters: "حروف",
        puzzleError: "لم نتمكن من الحصول على لغز. جار المحاولة...",
        puzzleParseError: "فشل في تحليل استجابة الذكاء الاصطناعي. جار المحاولة...",
        apiKeyError: " مفتاح API مفقود. يرجى إضافته إلى script.js.",
        chooseLanguage: "اختر اللغة" // NEW
    },
    it: {
        title: "Il Mondo del Dr.WEEE",
        gameTitle: "PAROLE",
        loading: "Caricamento...",
        aiLoading: "Ricerca di un nuovo puzzle...",
        beginner: "Principiante",
        expert: "Esperto",
        continueLevel: "Livello",
        level: "Livello",
        settings: "Impostazioni",
        playerName: "Nome Giocatore",
        musicVolume: "Volume Musica",
        sfxVolume: "Volume Effetti",
        chooseBackground: "Scegli Sfondo",
        friends: "Amici",
        yourCode: "Il Tuo Codice Giocatore",
        addFriend: "Aggiungi Amico",
        add: "Aggiungi",
        leaderboard: "Classifica",
        reportProblem: "Segnala un problema",
        levelComplete: "Livello Completato!",
        greatJob: "Ottimo lavoro!",
        continueNext: "Continua",
        aiError: "Impossibile caricare il puzzle. Controlla la connessione o la chiave API.",
        aiErrorTitle: "Errore",
        tryAgain: "Riprova",
        mainMenu: "Menu Principale",
        copy: "Copia",
        copied: "Copiato!",
        word: "Parola",
        hint: "Indizio",
        category: "Categoria",
        letters: "Lettere",
        puzzleError: "Impossibile ottenere un puzzle dall'AI. Riprovo...",
        puzzleParseError: "Impossibile analizzare la risposta dell'AI. Riprovo...",
        apiKeyError: "Chiave API mancante. Aggiungila a script.js.",
        chooseLanguage: "Scegli la lingua" // NEW
    },
    es: {
        title: "El Mundo del Dr.WEEE",
        gameTitle: "PALABRAS",
        loading: "Cargando...",
        aiLoading: "Buscando un nuevo rompecabezas...",
        beginner: "Principiante",
        expert: "Experto",
        continueLevel: "Nivel",
        level: "Nivel",
        settings: "Ajustes",
        playerName: "Nombre del Jugador",
        musicVolume: "Volumen de Música",
        sfxVolume: "Volumen de SFX",
        chooseBackground: "Elige Fondo",
        friends: "Amigos",
        yourCode: "Tu Código de Jugador",
        addFriend: "Añadir Amigo",
        add: "Añadir",
        leaderboard: "Clasificación",
        reportProblem: "Reportar un problema",
        levelComplete: "¡Nivel Completado!",
        greatJob: "¡Buen trabajo!",
        continueNext: "Continuar",
        aiError: "No se pudo cargar el rompecabezas. Revisa la conexión o la clave API.",
        aiErrorTitle: "Error",
        tryAgain: "Intentar de Nuevo",
        mainMenu: "Menú Principal",
        copy: "Copiar",
        copied: "¡Copiado!",
        word: "Palabra",
        hint: "Pista",
        category: "Categoría",
        letters: "Letras",
        puzzleError: "No se pudo obtener un rompecabezas de la IA. Reintentando...",
        puzzleParseError: "Error al analizar la respuesta de la IA. Reintentando...",
        apiKeyError: "Falta la clave API. Agrégala a script.js.",
        chooseLanguage: "Elige lengua" // NEW
    }
};

// --- Backgrounds ---
const backgrounds = [
    { name: 'Mountains 1', color: 'url(https://images.unsplash.com/photo-1519681393784-d120267933ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNjEwN3wwfDF8c2VhcmNofDV8fG1vdW50YWlufGVufDB8fHx8MTcyNDA3NzE3NHww&ixlib=rb-4.0.3&q=80&w=400)', iconUrl: 'https://www.thiings.co/_next/image?url=https%3A%2F%2Flftz25oez4aqbxpq.public.blob.vercel-storage.com%2Fimage-GzsgKqOaaNDdBSvCoA558OqVSMUdHF.png&w=1000&q=75' },
    { name: 'Flowers 2', color: 'url(https://images.unsplash.com/photo-1490750967868-88aa4486c946?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNjEwN3wwfDF8c2VhcmNofDF8fGZsb3dlcnN8ZW58MHx8fHwxNzI0MDc3MjMwfDA&ixlib=rb-4.0.3&q=80&w=400)', iconUrl: 'PASTE_FLOWERS_ICON_LINK_HERE' },
    { name: 'Sky 3', color: 'url(https://images.unsplash.com/photo-1534088568595-a066f4e5-919b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNjEwN3wwfDF8c2VhcmNofDEwfHxza3l8ZW58MHx8fHwxNzI0MDc3MjQ5fDA&ixlib=rb-4.0.3&q=80&w=400)', iconUrl: 'PASTE_SKY_ICON_LINK_HERE' },
    { name: 'Forest 4', color: 'url(https://images.unsplash.com/photo-1448375240586-8827074e888e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNjEwN3wwfDF8c2VhcmNofDR8fGZvcmVzdHxlbnwwfHx8fDE3MjQwNzcyNjR8MA&ixlib=rb-4.0.3&q=80&w=400)', iconUrl: 'PASTE_FOREST_ICON_LINK_HERE' },
    { name: 'Sunset 5', color: 'linear-gradient(to right, #ff7e5f, #feb47b)', iconUrl: 'PASTE_SUNSET_ICON_LINK_HERE' },
    { name: 'Night 6', color: 'linear-gradient(to right, #2c3e50, #4a69bd)', iconUrl: 'PASTE_NIGHT_ICON_LINK_HERE' },
    { name: 'Beach 7', color: 'linear-gradient(to right, #00c9ff, #92fe9d)', iconUrl: 'PASTE_BEACH_ICON_LINK_HERE' },
    { name: 'Pastel 8', color: 'linear-gradient(to right, #ff9a9e, #fecfef)', iconUrl: 'PASTE_PASTEL_ICON_LINK_HERE' },
    { name: 'Ruby 9', color: 'linear-gradient(to right, #d31027, #ea384d)', iconUrl: 'PASTE_RUBY_ICON_LINK_HERE' },
    { name: 'Ocean 10', color: 'linear-gradient(to right, #0575e6, #021b79)', iconUrl: 'PASTE_OCEAN_ICON_LINK_HERE' },
    { name: 'Mint 11', color: 'linear-gradient(to right, #11998e, #38ef7d)', iconUrl: 'PASTE_MINT_ICON_LINK_HERE' },
    { name: 'Sakura 12', color: 'linear-gradient(to right, #ffc0cb, #f0f0f0)', iconUrl: 'PASTE_SAKURA_ICON_LINK_HERE' },
    { name: 'Azure 13', color: 'linear-gradient(to right, #007bff, #c2e9fb)', iconUrl: 'PASTE_AZURE_ICON_LINK_HERE' },
    { name: 'Lava 14', color: 'linear-gradient(to right, #ff416c, #ff4b2b)', iconUrl: 'PASTE_LAVA_ICON_LINK_HERE' },
    { name: 'Emerald 15', color: 'linear-gradient(to right, #009688, #4db6ac)', iconUrl: 'PASTE_EMERALD_ICON_LINK_HERE' },
    { name: 'Amethyst 16', color: 'linear-gradient(to right, #9d50bb, #6e48aa)', iconUrl: 'PASTE_AMETHYST_ICON_LINK_HERE' },
    { name: 'Rose 17', color: 'linear-gradient(to right, #f8cdda, #1d2b64)', iconUrl: 'PASTE_ROSE_ICON_LINK_HERE' },
    { name: 'Gold 18', color: 'linear-gradient(to right, #f12711, #f5af19)', iconUrl: 'PASTE_GOLD_ICON_LINK_HERE' },
    { name: 'Steel 19', color: 'linear-gradient(to right, #757f9a, #d7dde8)', iconUrl: 'PASTE_STEEL_ICON_LINK_HERE' },
    { name: 'Sand 20', color: 'linear-gradient(to right, #c2b280, #f0e68c)', iconUrl: 'PASTE_SAND_ICON_LINK_HERE' },
];

// --- Core Functions ---

/**
 * Generates a unique player code.
 */
function generatePlayerCode() {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
}

/**
 * MODIFIED: Opens the language choice panel.
 */
function toggleLanguagePanel() {
    const panel = document.getElementById('languagePanel');
    const isOpening = panel.style.display === 'none' || !panel.style.display;
    panel.style.display = isOpening ? 'block' : 'none';
    
    if (isOpening) {
        feather.replace(); // Make sure icons (like 'x') are rendered
    }
}

/**
 * NEW: Sets the language from the panel.
 */
function selectLanguage(lang) {
    currentLanguage = lang;
    currentLangIndex = languages.indexOf(lang);
    localStorage.setItem('drweee_language', currentLanguage);
    
    updateLanguage();
    toggleLanguagePanel(); // Close the panel
}

/**
 * Updates all text and directionality based on currentLanguage.
 */
function updateLanguage() {
    const isRTL = currentLanguage === 'ar';
    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    
    document.querySelectorAll('[data-lang]').forEach(el => {
        const key = el.getAttribute('data-lang');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            el.textContent = translations[currentLanguage][key];
        } else if (translations.en[key]) {
            el.textContent = translations.en[key]; // Fallback to English
        }
    });
}

/**
 * Toggles the settings panel.
 */
function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    const isOpening = panel.style.display === 'none' || !panel.style.display;
    
    if (isOpening) {
        document.getElementById('playerNameInput').value = playerName;
        panel.style.display = 'block';
        // MODIFIED: Call feather.replace() AFTER showing the panel
        feather.replace(); 
    } else {
        panel.style.display = 'none';
    }
}

/**
 * Shows the Friends panel.
 */
function showFriends() {
    updateFriendsList();
    document.getElementById('friendsPanel').style.display = 'block';
    // MODIFIED: Call feather.replace() AFTER showing the panel
    feather.replace();
}

/**
 * Hides the Friends panel.
 */
function closeFriends() {
    document.getElementById('friendsPanel').style.display = 'none';
}

/**
 * Shows the Leaderboard panel.
 */
function showLeaderboard() {
    document.getElementById('leaderboardPanel').style.display = 'block';
    // MODIFIED: Call feather.replace() AFTER showing the panel
    feather.replace();
    // Load leaderboard data
    loadLeaderboard();
}

/**
 * Hides the Leaderboard panel.
 */
function closeLeaderboard() {
    document.getElementById('leaderboardPanel').style.display = 'none';
}

/**
 * Adds a friend code.
 */
function addFriend() {
    const friendCode = document.getElementById('friendCodeInput').value.trim().toUpperCase();
    if (friendCode && friendCode !== playerCode && !friends.includes(friendCode)) {
        friends.push(friendCode);
        localStorage.setItem('drweee_friends', JSON.stringify(friends));
        updateFriendsList();
        document.getElementById('friendCodeInput').value = '';
    }
}

/**
 * Updates the visual list of friends.
 */
function updateFriendsList() {
    const list = document.getElementById('friendsList');
    list.innerHTML = ''; // Clear old list
    friends.forEach(code => {
        const item = document.createElement('div');
        item.className = 'friend-item';
        item.innerHTML = `<span>👤 ${code}</span><button class="remove-friend-btn" onclick="removeFriend('${code}')">&times;</button>`;
        list.appendChild(item);
    });
}

/**
 * Removes a friend.
 */
function removeFriend(code) {
    friends = friends.filter(f => f !== code);
    localStorage.setItem('drweee_friends', JSON.stringify(friends));
    updateFriendsList();
}

/**
 * Copies the player code to the clipboard.
 */
function copyPlayerCode() {
    const code = document.getElementById('playerCode').textContent;
    
    // Use modern clipboard API
    navigator.clipboard.writeText(code).then(() => {
        // Success! Show a temporary checkmark
        const copyBtn = document.querySelector('.copy-btn');
        const originalIcon = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i data-feather="check"></i>';
        feather.replace({ width: '100%', height: '100%' });
        
        setTimeout(() => {
            copyBtn.innerHTML = originalIcon;
            feather.replace({ width: '100%', height: '100%' });
        }, 1500);
        
    }).catch(err => {
        console.error('Failed to copy code: ', err);
        // Fallback for older browsers
        try {
            const textArea = document.createElement('textarea');
            textArea.value = code;
            textArea.style.position = 'fixed'; // Avoid scrolling
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            // Show checkmark (as above)
            const copyBtn = document.querySelector('.copy-btn');
            const originalIcon = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i data-feather="check"></i>';
            feather.replace({ width: '100%', height: '100%' });
            setTimeout(() => {
                copyBtn.innerHTML = originalIcon;
                feather.replace({ width: '100%', height: '100%' });
            }, 1500);
        } catch (e) {
            console.error('Fallback copy failed: ', e);
        }
    });
}


/**
 * Fetches and displays the leaderboard.
 * This is a placeholder; replace with your database logic.
 */
function loadLeaderboard() {
    const list = document.getElementById('leaderboardEntries');
    list.innerHTML = 'Loading...'; // Placeholder
    
    // --- DATABASE PLACEHOLDER ---
    // In a real app, you would fetch this from your server/database.
    setTimeout(() => {
        const fakeData = [
            { name: 'Player1', score: 1500 },
            { name: 'Player_XYZ', score: 1250 },
            { name: playerName, score: playerStats.currency },
            { name: 'TestUser', score: 800 },
        ].sort((a, b) => b.score - a.score);
        
        list.innerHTML = ''; // Clear loading
        fakeData.forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = 'friend-item'; // Reuse style
            item.innerHTML = `<span>${index + 1}. 👤 ${entry.name}</span> <span>${entry.score}</span>`;
            list.appendChild(item);
        });
    }, 1000);
}

/**
 * Populates the background options in the Settings panel.
 * MODIFIED: Now renders <img> or <i> tags based on iconUrl.
 */
function initSettings() {
    const optionsContainer = document.getElementById('backgroundOptions');
    optionsContainer.innerHTML = ''; // Clear old
    
    const savedBg = localStorage.getItem('drweee_background') || backgrounds[0].color;
    let selectedOption = null;

    backgrounds.forEach((bg) => {
        const option = document.createElement('button');
        option.className = 'bg-option';
        option.title = bg.name; // For accessibility

        if (bg.iconUrl && bg.iconUrl.startsWith('http')) {
            // It's a full URL, use <img>
            option.innerHTML = `<img src="${bg.iconUrl}" alt="${bg.name}" class="bg-icon-img">`;
        } else {
            // It's a placeholder (or 'image'), so just show the color
            // We use the 'color' property which can be a gradient or a URL
            option.style.background = bg.color;
        }

        option.onclick = () => setBackground(bg.color, option);
        optionsContainer.appendChild(option);
        
        if (bg.color === savedBg) {
            selectedOption = option;
        }
    });

    // Apply the saved background
    if (selectedOption) {
        setBackground(savedBg, selectedOption);
    } else {
        setBackground(backgrounds[0].color, optionsContainer.children[0]);
    }
    
    // Replace Feather icons added to the settings panel
    feather.replace();
}


/**
 * Sets the app's background and highlights the selected option.
 */
function setBackground(bgColor, selectedOption) {
    document.getElementById('appContainer').style.backgroundImage = bgColor.startsWith('url') ? bgColor : '';
    document.getElementById('appContainer').style.backgroundColor = bgColor.startsWith('url') ? '#FFF' : bgColor; // Fallback for non-gradient
    if (!bgColor.startsWith('url')) {
        document.getElementById('appContainer').style.backgroundImage = bgColor;
    }
    
    localStorage.setItem('drweee_background', bgColor);
    
    document.querySelectorAll('.bg-option').forEach(opt => opt.classList.remove('selected'));
    if(selectedOption) {
        selectedOption.classList.add('selected');
    }
}

/**
 * Updates all player-facing stats on the UI.
 */
function updateUIStats() {
    const formattedCurrency = playerStats.currency.toLocaleString();
    document.getElementById('mainCurrency').textContent = formattedCurrency;
    document.getElementById('gameCurrency').textContent = formattedCurrency;
    
    // MODIFIED: Progress is now 0-10, so multiply by 10 for percentage
    const progressPercent = playerStats.progress * 10; 
    document.getElementById('levelProgress').style.width = `${progressPercent}%`;
    // MODIFIED: Show progress out of 10
    document.getElementById('progressValue').textContent = `${playerStats.progress}/10`; 
    
    const levelText = `${translations[currentLanguage]?.continueLevel || 'Level'} ${playerStats.level}`;
    document.getElementById('continueBtn').textContent = levelText;
    
    const gameLevelText = `${translations[currentLanguage]?.level || 'Level'} ${playerStats.level}`;
    document.getElementById('gameLevelTitle').textContent = gameLevelText;
}

// --- Audio ---

function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        createSounds();
        playBackgroundMusic();
    } catch (e) {
        console.log('Audio not supported');
    }
}

function createSounds() {
    sounds = {};
    sounds.correct = () => playTone(800, 0.1, 'sine');
    sounds.wrong = () => playTone(200, 0.2, 'sawtooth');
    sounds.click = () => playTone(500, 0.1, 'triangle');
    sounds.win = () => {
        playTone(523, 0.1, 'sine');
        setTimeout(() => playTone(659, 0.1, 'sine'), 100);
        setTimeout(() => playTone(784, 0.2, 'sine'), 200);
    };
    sounds.hint = () => playTone(700, 0.1, 'triangle');
}

function playTone(e, t, n = 'sine') {
    if (!soundEnabled || !audioContext) return;
    const o = audioContext.createOscillator(), a = audioContext.createGain();
    o.connect(a);
    a.connect(audioContext.destination);
    o.frequency.value = e;
    o.type = n;
    a.gain.setValueAtTime(0.3 * sfxVolume, audioContext.currentTime);
    a.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + t);
    o.start(audioContext.currentTime);
    o.stop(audioContext.currentTime + t);
}

function playBackgroundMusic() {
    if (!audioContext) return;
    if (bgMusic) bgMusic.stop();
    bgMusic = audioContext.createOscillator();
    const e = audioContext.createGain();
    bgMusic.connect(e);
    e.connect(audioContext.destination);
    bgMusic.frequency.value = 100; // Low hum
    bgMusic.type = 'sine';
    e.gain.setValueAtTime(0.05 * musicVolume, audioContext.currentTime);
    bgMusic.start();
    bgMusic.loop = true;
}


// --- Game Logic ---

/**
 * Starts the game: loads a puzzle and shows the game screen.
 */
function startGame() {
    console.log("Starting game...");
    sounds.click();
    
    // MODIFIED: Check for API Key
    if (config.API_KEY === "YOUR_GEMINI_API_KEY") {
        console.error("API Key is missing!");
        alert(translations[currentLanguage].apiKeyError); // Alert the user
        return; // Stop the game from starting
    }
    
    // Show AI loading spinner
    document.getElementById('aiLoader').style.display = 'flex';
    document.getElementById('mainMenu').style.display = 'none';

    loadPuzzleFromAI();
}

/**
 * Fetches a new puzzle from the Gemini API.
 */
async function loadPuzzleFromAI() {
    const aiLoaderText = document.getElementById('aiLoaderText');
    aiLoaderText.textContent = translations[currentLanguage].aiLoading;

    // Analyze player stats to find weakest topic
    let weakestTopic = 'general';
    let minScore = 1;
    for (const [topic, stats] of Object.entries(playerStats.topics)) {
        const score = stats.total === 0 ? 0 : stats.correct / stats.total;
        if (score < minScore && stats.total > 0) { // Prefer topics they've tried
            minScore = score;
            weakestTopic = topic;
        } else if (stats.total === 0) { // Or try a new topic
             weakestTopic = topic;
        }
    }

    // Construct the prompt
    const lang = currentLanguage.toUpperCase();
    const prompt = `
      You are a fun word puzzle game creator.
      Provide one (1) new puzzle for a word game.
      The player is at Level ${playerStats.level}.
      The player's weakest category is "${weakestTopic}".
      The game language must be ${lang}.
      
      The puzzle word must be between 4 and 8 letters long.
      The puzzle must include a hint, the word, the category, and 12 letters for the grid.
      The 12 letters MUST include all unique letters of the word.
      The 12 letters MUST be provided as a single, shuffled string.
      
      Respond ONLY with a valid JSON object in this exact format:
      {
        "word": "...",
        "hint": "...",
        "category": "...",
        "letters": "..."
      }
      
      Example for ${lang}:
      {
        "word": "${translations[lang]?.word || 'WORD'}",
        "hint": "${translations[lang]?.hint || 'HINT'}",
        "category": "${translations[lang]?.category || 'CATEGORY'}",
        "letters": "${translations[lang]?.letters || 'ABCDEFGHIJKL'}"
      }
    `;

    // --- API Call ---
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${config.API_KEY}`;
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 1.0, // Be creative
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0].content) {
             throw new Error("Invalid AI response structure.");
        }
        
        const jsonString = data.candidates[0].content.parts[0].text;
        const puzzleData = JSON.parse(jsonString);

        if (!puzzleData.word || !puzzleData.hint || !puzzleData.letters || puzzleData.letters.length !== 12) {
            throw new Error("Parsed JSON is missing required fields.");
        }
        
        setupPuzzle(puzzleData);

    } catch (error) {
        console.error("AI Error:", error);
        
        // --- Fallback ---
        if (error.message.includes("API Error") || error.message.includes("Invalid AI response")) {
            // Serious error, show game over panel
            aiLoaderText.textContent = translations[currentLanguage].puzzleError;
            setTimeout(showGameOver, 2000);
        } else {
            // Parsing error, try again
            aiLoaderText.textContent = translations[currentLanguage].puzzleParseError;
            setTimeout(loadPuzzleFromAI, 2000); // Retry
        }
    }
}

/**
 * Shows the game over/error panel.
 */
function showGameOver() {
    document.getElementById('aiLoader').style.display = 'none';
    document.getElementById('gameOverPanel').style.display = 'block';
    document.getElementById('gameOverTip').textContent = translations[currentLanguage].aiError;
    feather.replace(); // MODIFIED: Show icons on error panel
}

/**
 * Retries loading a game after an error.
 */
function retryGame() {
    document.getElementById('gameOverPanel').style.display = 'none';
    startGame(); // Try again from the start
}

/**
 * Sets up the game UI with the new puzzle data.
 */
function setupPuzzle(puzzleData) {
    // 1. Set global puzzle state
    currentPuzzle.word = puzzleData.word.toUpperCase();
    currentPuzzle.hint = puzzleData.hint;
    currentPuzzle.letters = puzzleData.letters.toUpperCase().split('');
    currentPuzzle.answer = Array(currentPuzzle.word.length).fill(null);
    currentPuzzle.filledIndexes = [];
    currentPuzzle.firstEmptyBox = 0;
    
    // 2. Update Hint
    document.getElementById('gameHint').textContent = currentPuzzle.hint;
    
    // 3. Create Answer Boxes
    const answerContainer = document.getElementById('answerBoxes');
    answerContainer.innerHTML = '';
    for (let i = 0; i < currentPuzzle.word.length; i++) {
        const box = document.createElement('div');
        box.className = 'answer-box';
        box.dataset.index = i;
        box.onclick = () => onAnswerBoxClick(i, box);
        answerContainer.appendChild(box);
    }
    
    // 4. Create Letter Grid
    const gridContainer = document.getElementById('letterGrid');
    gridContainer.innerHTML = '';
    currentPuzzle.letters.forEach((letter, index) => {
        const tile = document.createElement('button');
        tile.className = 'letter-tile';
        tile.textContent = letter;
        tile.dataset.index = index;
        tile.onclick = () => onLetterTileClick(letter, index, tile);
        gridContainer.appendChild(tile);
    });
    
    // 5. Hide loader, show game
    document.getElementById('aiLoader').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'flex';
    feather.replace(); // MODIFIED: Replace icons on new game screen (for wand hint)
}

/**
 * Handles clicking on a letter tile.
 */
function onLetterTileClick(letter, tileIndex, tileElement) {
    sounds.click();
    
    // Find the first empty answer box
    const boxIndex = currentPuzzle.answer.indexOf(null);
    if (boxIndex === -1) {
        return; // Word is full
    }
    
    // Disable the tile
    tileElement.disabled = true;
    
    // Fill the box
    currentPuzzle.answer[boxIndex] = letter;
    currentPuzzle.filledIndexes[boxIndex] = tileIndex; // Store which tile filled this box
    
    // Update the box UI
    const boxElement = document.getElementById('answerBoxes').children[boxIndex];
    boxElement.textContent = letter;
    boxElement.classList.add('filled');
    
    // Check for win
    if (currentPuzzle.answer.indexOf(null) === -1) {
        checkWord();
    }
}

/**
 * Handles clicking on a filled answer box to return the letter.
 */
function onAnswerBoxClick(boxIndex, boxElement) {
    if (currentPuzzle.answer[boxIndex] === null) {
        return; // Box is already empty
    }
    
    sounds.click();
    
    // Get the letter and the tile index that filled it
    const letter = currentPuzzle.answer[boxIndex];
    const tileIndex = currentPuzzle.filledIndexes[boxIndex];
    
    // Empty the box
    currentPuzzle.answer[boxIndex] = null;
    currentPuzzle.filledIndexes[boxIndex] = undefined; // MODIFIED: Use undefined
    boxElement.textContent = '';
    boxElement.classList.remove('filled');
    
    // Re-enable the original letter tile
    const tileElement = document.querySelector(`.letter-tile[data-index="${tileIndex}"]`);
    if (tileElement) {
        tileElement.disabled = false;
    }
}

/**
 * Checks if the filled word is correct.
 */
function checkWord() {
    const guessedWord = currentPuzzle.answer.join('');
    
    if (guessedWord === currentPuzzle.word) {
        // --- WIN ---
        sounds.win();
        playerStats.currency += 10; // Reward
        
        // MODIFIED: Level-up logic
        playerStats.progress += 1; // 1 more word solved
        
        if (playerStats.progress >= 10) {
            // Level Up!
            playerStats.level += 1;
            playerStats.progress = 0; // Reset for next level
        }
        
        // Save stats
        localStorage.setItem('drweee_currency', playerStats.currency);
        localStorage.setItem('drweee_level', playerStats.level);
        localStorage.setItem('drweee_progress', playerStats.progress);
        
        // Update stats
        updateUIStats();
        
        // Show Level Complete panel
        document.getElementById('levelCompletePanel').style.display = 'block';
        feather.replace(); // MODIFIED: Show icon on panel
        
    } else {
        // --- LOSE ---
        sounds.wrong();
        const answerContainer = document.getElementById('answerBoxes');
        answerContainer.classList.add('shake');
        setTimeout(() => {
            answerContainer.classList.remove('shake');
            // Return all letters
            resetAnswerBoxes();
        }, 500);
    }
}

/**
 * Returns all letters from answer boxes to the grid.
 */
function resetAnswerBoxes() {
    // Iterate backwards to avoid issues with indexes
    for (let i = currentPuzzle.answer.length - 1; i >= 0; i--) {
        onAnswerBoxClick(i, document.getElementById('answerBoxes').children[i]);
    }
}

/**
 * Called from Level Complete panel to start the next level.
 */
function nextLevel() {
    document.getElementById('levelCompletePanel').style.display = 'none';
    startGame(); // Load a new puzzle
}

/**
 * Returns to the Main Menu from the game.
 */
function backToMenu() {
    document.getElementById('gameContainer').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'flex';
}

/**
 * Uses the "Flame" hint (solves the puzzle).
 * MODIFIED: This logic is now correct.
 */
function usePowerHint() {
    if (playerStats.currency < 150) return; // Not enough currency
    sounds.hint();
    playerStats.currency -= 150;
    updateUIStats();
    localStorage.setItem('drweee_currency', playerStats.currency);

    // Fill the answer boxes with the correct word
    resetAnswerBoxes();
    const wordLetters = currentPuzzle.word.split('');
    
    wordLetters.forEach((letter, index) => {
        // Find the first available (enabled) tile with this letter
        let foundTile = null;
        for (const tile of document.querySelectorAll('.letter-tile:not(:disabled)')) {
            if (tile.textContent === letter) {
                foundTile = tile;
                break;
            }
        }
        
        if (foundTile) {
            // Simulate clicking it
            onLetterTileClick(foundTile.textContent, foundTile.dataset.index, foundTile);
        } else {
            // This case should not happen if the AI prompt is correct
            // But as a fallback, just fill the box
            const boxElement = document.getElementById('answerBoxes').children[index];
            boxElement.textContent = letter;
            boxElement.classList.add('filled');
            currentPuzzle.answer[index] = letter;
        }
    });
    
    // Auto-win (checkWord is called by onLetterTileClick if word is full)
}

/**
 * Uses the "Wand" hint (reveals one letter).
 * MODIFIED: This logic is now correct.
 */
function useHint() {
    if (playerStats.currency < 50) return; // Not enough currency
    
    // Find the first empty box
    const firstEmptyIndex = currentPuzzle.answer.indexOf(null);
    if (firstEmptyIndex === -1) return; // Word is full

    sounds.hint();
    playerStats.currency -= 50;
    updateUIStats();
    localStorage.setItem('drweee_currency', playerStats.currency);
    
    // Get the correct letter for that box
    const correctLetter = currentPuzzle.word[firstEmptyIndex];
    
    // Find the first available (enabled) tile with that letter
    let tileToClick = null;
    for (const tile of document.querySelectorAll('.letter-tile:not(:disabled)')) {
        if (tile.textContent === correctLetter) {
            tileToClick = tile;
            break;
        }
    }
    
    if (tileToClick) {
        // Simulate clicking the found tile
        onLetterTileClick(tileToClick.textContent, tileToClick.dataset.index, tileToClick);
    }
}

// --- Event Listeners & Initialization ---

/**
 * Handles clicking on the background to close panels.
 */
function handleBackdropClick(event) {
    // MODIFIED: This logic is now correct.
    // Check if the clicked element is the 'mainMenu' div itself
    if (event.target.id === 'mainMenu') { 
        if (document.getElementById('settingsPanel').style.display === 'block') {
            toggleSettings();
        }
        if (document.getElementById('friendsPanel').style.display === 'block') {
            closeFriends();
        }
        if (document.getElementById('leaderboardPanel').style.display === 'block') {
            closeLeaderboard();
        }
        if (document.getElementById('languagePanel').style.display === 'block') {
            toggleLanguagePanel();
        }
    }
}

window.onload = () => {
    // 1. Load Saved Data
    playerName = localStorage.getItem('drweee_playerName') || 'Player';
    playerStats.currency = parseInt(localStorage.getItem('drweee_currency') || '1230', 10);
    playerStats.level = parseInt(localStorage.getItem('drweee_level') || '1', 10);
    playerStats.progress = parseInt(localStorage.getItem('drweee_progress') || '0', 10); 
    
    // MODIFIED: Set language from storage *before* updating UI
    const savedLang = localStorage.getItem('drweee_language') || 'ar';
    currentLanguage = savedLang;
    if (languages.indexOf(savedLang) > -1) {
        currentLangIndex = languages.indexOf(savedLang);
    } // else default to 0 ('ar')
    
    try {
        friends = JSON.parse(localStorage.getItem('drweee_friends') || '[]');
    } catch (e) { friends = []; }
    
    playerCode = generatePlayerCode();
    
    // 2. Initialize UI
    initSettings(); // Sets up backgrounds
    updateLanguage(); // Sets all text
    updateUIStats(); // Sets currency, level, etc.
    
    // 3. Set initial slider values
    document.getElementById('musicVolume').value = musicVolume * 100;
    document.getElementById('sfxVolume').value = sfxVolume * 100;
    document.getElementById('playerCode').textContent = playerCode;
    
    // 4. Add listeners
    document.getElementById('musicVolume').addEventListener('input', e => {
        musicVolume = e.target.value / 100;
        // Adjust gain if audioContext is already initialized
        if (audioContext && bgMusic) {
            // This is a bit complex, let's just update the variable
            // The music volume will be set on next play
        }
    });
    document.getElementById('sfxVolume').addEventListener('input', e => {
        sfxVolume = e.target.value / 100;
    });
    document.getElementById('playerNameInput').addEventListener('change', e => {
        playerName = e.target.value || 'Player';
        localStorage.setItem('drweee_playerName', playerName);
    });
    
    // Listener for closing panels
    document.getElementById('mainMenu').addEventListener('click', handleBackdropClick);
    // MODIFIED: Added touch listener for mobile
    document.getElementById('mainMenu').addEventListener('touchstart', handleBackdropClick);

    // 5. Replace all initial icons
    feather.replace();
    
    // 6. Show Main Menu (after hiding loading)
    setTimeout(() => {
        document.getElementById('loadingScreen').style.opacity = '0';
        setTimeout(() => document.getElementById('loadingScreen').style.display = 'none', 500);
        
        // Try to init audio after a short delay (user interaction is better)
        setTimeout(initAudio, 500);
    }, 1000); // Simulate load time
};
