"use strict";

// --- API & Config ---

// LEAVE THIS EMPTY. Canvas will provide the key at runtime.
const GEMINI_API_KEY = ""; 
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;

// Placeholder for your separate Database (e.g., Firebase, Supabase)
const DB_CONFIG = {
    API_KEY: "YOUR_DATABASE_API_KEY_HERE", 
    LEADERBOARD_GET_URL: "https://your-database-provider.com/api/v1/leaderboard",
    SCORE_POST_URL: "https://your-database-provider.com/api/v1/scores",
};

// --- Game State Variables ---
let currentLanguage = 'en';
let soundEnabled = true;
let musicVolume = 0.5;
let sfxVolume = 0.7;
let audioContext = null;
let bgMusic = null;
let playerName = 'Player';
let playerCode = '';
let friends = [];
let sounds = {};

// --- New Game State ---
let gameState = {
    currentLevel: 7, // Match image
    levelProgress: 18, // Match image
    totalScore: 1230, // Default currency from image
    currentPuzzle: null, // Will hold { word, hint, letters }
    currentAnswer: [], // Array to hold [{ letter, gridIndex }]
    answerSlots: [] // Array to hold the DOM elements for the answer
};

// --- Asset Loading (Placeholders) ---
// We now use CSS backgrounds, so no JS images are needed for this.

// --- AI & Session State ---
let gameSession = {
    // Stores performance to personalize AI questions
    playerStats: {
        language: { correct: 0, wrong: 0 }
    },
    retries: 0 // For exponential backoff
};


// --- Translations ---
const translations = {
    en: {
        title: "Dr.WEEE's World",
        gameTitle: "Words",
        beginner: "Beginner",
        expert: "Expert",
        continueLevel: "Level",
        gameBackgrounds: "Game Backgrounds",
        level: "Level",
        reportProblem: "Report a problem",
        settings: "Settings",
        musicVolume: "Music Volume",
        sfxVolume: "SFX Volume",
        playerName: "Player Name",
        chooseBackground: "Choose Background",
        yourCode: "Your Player Code",
        addFriend: "Add Friend by Code",
        add: "Add Friend",
        friends: "Friends",
        leaderboard: "Leaderboard",
        close: "Close",
        levelComplete: "Level Complete!",
        greatJob: "Great job!",
        continueNext: "Continue",
        aiLoading: "Finding a new puzzle...",
        aiErrorTitle: "Error",
        aiError: "Could not load puzzle. Please try again.",
        tryAgain: "Try Again",
        mainMenu: "Main Menu",
        hint: "Hint",
        notEnoughCoins: "Not enough diamonds!"
    },
    ar: {
        title: "عالم الكلمات",
        gameTitle: "كلمات",
        beginner: "مبتدئ",
        expert: "متعلم", // Match image
        continueLevel: "المستوى",
        gameBackgrounds: "خلفيات اللعبة",
        level: "المستوى",
        reportProblem: "الإبلاغ عن مشكلة",
        settings: "الإعدادات",
        musicVolume: "مستوى الموسيقى",
        sfxVolume: "مستوى المؤثرات",
        playerName: "اسم اللاعب",
        chooseBackground: "اختر الخلفية",
        yourCode: "رمزك",
        addFriend: "أضف صديق بالرمز",
        add: "إضافة صديق",
        friends: "الأصدقاء",
        leaderboard: "المتصدرين",
        close: "إغلاق",
        levelComplete: "المستوى مكتمل!",
        greatJob: "عمل رائع!",
        continueNext: "متابعة",
        aiLoading: "جاري البحث عن لغز جديد...",
        aiErrorTitle: "خطأ",
        aiError: "لا يمكن تحميل اللغز. الرجاء معاودة المحاولة.",
        tryAgain: "حاول مرة أخرى",
        mainMenu: "القائمة الرئيسية",
        hint: "تلميح",
        notEnoughCoins: "لا يوجد ألماس كافي!"
    },
    it: {
        title: "Mondo delle Parole",
        gameTitle: "Parole",
        beginner: "Principiante",
        expert: "Esperto",
        continueLevel: "Livello",
        gameBackgrounds: "Sfondi di Gioco",
        level: "Livello",
        reportProblem: "Segnala un problema",
        settings: "Impostazioni",
        musicVolume: "Volume Musica",
        sfxVolume: "Volume Effetti",
        playerName: "Nome Giocatore",
        chooseBackground: "Scegli Sfondo",
        yourCode: "Il Tuo Codice",
        addFriend: "Aggiungi Amico",
        add: "Aggiungi",
        friends: "Amici",
        leaderboard: "Classifica",
        close: "Chiudi",
        levelComplete: "Livello Completato!",
        greatJob: "Ottimo lavoro!",
        continueNext: "Continua",
        aiLoading: "Ricerca di un nuovo puzzle...",
        aiErrorTitle: "Errore",
        aiError: "Impossibile caricare il puzzle. Riprova.",
        tryAgain: "Riprova",
        mainMenu: "Menu Principale",
        hint: "Indizio",
        notEnoughCoins: "Non hai abbastanza diamanti!"
    },
    es: {
        title: "Mundo de Palabras",
        gameTitle: "Palabras",
        beginner: "Principiante",
        expert: "Experto",
        continueLevel: "Nivel",
        gameBackgrounds: "Fondos de Juego",
        level: "Nivel",
        reportProblem: "Reportar un problema",
        settings: "Ajustes",
        musicVolume: "Volumen Música",
        sfxVolume: "Volumen Efectos",
        playerName: "Nombre del Jugador",
        chooseBackground: "Elige Fondo",
        yourCode: "Tu Código",
        addFriend: "Agregar Amigo",
        add: "Agregar",
        friends: "Amigos",
        leaderboard: "Clasificación",
        close: "Cerrar",
        levelComplete: "¡Nivel Completado!",
        greatJob: "¡Gran trabajo!",
        continueNext: "Continuar",
        aiLoading: "Buscando un nuevo puzzle...",
        aiErrorTitle: "Error",
        aiError: "No se pudo cargar el puzzle. Inténtalo de nuevo.",
        tryAgain: "Intentar de Nuevo",
        mainMenu: "Menú Principal",
        hint: "Pista",
        notEnoughCoins: "¡No hay suficientes diamantes!"
    }
};

// --- Fallback Puzzle (if AI fails) ---
const fallbackWordPuzzle = {
    en: { word: "EARTH", hint: "Our home planet.", letters: ["E", "A", "R", "T", "H", "S", "U", "N", "M", "O", "P", "L"] },
    ar: { word: "لندن", hint: "عاصمة المملكة المتحدة", letters: ["ا", "ل", "ن", "د", "م", "س", "ق", "ر", "ب", "ج", "و", "ي"] },
    it: { word: "TERRA", hint: "Il nostro pianeta.", letters: ["T", "E", "R", "A", "S", "O", "L", "M", "N", "V", "C", "P"] },
    es: { word: "TIERRA", hint: "Nuestro planeta.", letters: ["T", "I", "E", "R", "A", "S", "O", "L", "M", "N", "V", "C"] }
};

// --- Backgrounds (Matching style) ---
const backgrounds = [
    { name: 'Hero Mountain', value: 'url("https://placehold.co/1080x1920/5a8f9e/FFFFFF?text=Mountains&font=fredoka+one")' },
    { name: 'Flowers', value: 'url("https://placehold.co/1080x1920/d0a7a9/f0e1e1?text=Flowers&font=fredoka+one")' },
    { name: 'Sky', value: 'url("https://placehold.co/1080x1920/87CEEB/E0F6FF?text=Sky&font=fredoka+one")' },
    { name: 'Forest', value: 'url("https://placehold.co/1080x1920/2a623d/a8e063?text=Forest&font=fredoka+one")' }
];

// --- Core Functions ---

function generatePlayerCode() {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
}

function changeLanguage() {
    currentLanguage = document.getElementById('languageSelect').value;
    // Set page direction
    if (currentLanguage === 'ar') {
        document.documentElement.setAttribute('dir', 'rtl');
    } else {
        document.documentElement.setAttribute('dir', 'ltr');
    }
    updateTranslations();
}

function updateTranslations() {
    document.querySelectorAll('[data-lang]').forEach(e => {
        const key = e.getAttribute('data-lang');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            e.textContent = translations[currentLanguage][key];
        }
    });
    // Update dynamic text
    updateMainScreenUI();
}

function showLoadingSpinner(text) {
    document.getElementById('aiLoaderText').textContent = text || (translations[currentLanguage].aiLoading || "Loading...");
    document.getElementById('aiLoader').style.display = 'flex';
}
function hideLoadingSpinner() {
    document.getElementById('aiLoader').style.display = 'none';
}

// --- Navigation ---

async function startGame() {
    showLoadingSpinner(translations[currentLanguage].aiLoading);
    await fetchWordPuzzleFromAI(gameState.currentLevel);
    hideLoadingSpinner();

    if (gameState.currentPuzzle) {
        setupWordGame();
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'flex';
    } else {
        // AI fetch failed
        document.getElementById('gameOverTip').textContent = translations[currentLanguage].aiError;
        document.getElementById('gameOverPanel').style.display = 'flex';
    }
}

function backToMenu() {
    document.getElementById('gameContainer').style.display = 'none';
    document.getElementById('gameOverPanel').style.display = 'none';
    document.getElementById('levelCompletePanel').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'flex';
    updateMainScreenUI(); // Refresh level and score
}

function retryGame() {
    document.getElementById('gameOverPanel').style.display = 'none';
    startGame(); // Try to start the level again
}

function nextLevel() {
    document.getElementById('levelCompletePanel').style.display = 'none';
    gameState.currentLevel++;
    gameState.levelProgress += 10; // Arbitrary progress
    if (gameState.levelProgress > 100) gameState.levelProgress = 10;
    
    gameState.totalScore += 100; // Reward for winning
    updateCurrencyDisplays();
    
    // Save progress to localStorage
    localStorage.setItem('drweee_level', gameState.currentLevel);
    localStorage.setItem('drweee_score', gameState.totalScore);
    localStorage.setItem('drweee_progress', gameState.levelProgress);

    saveScoreToDatabase(gameState.totalScore); // Save to server
    
    updateMainScreenUI();
    startGame();
}

function updateMainScreenUI() {
    // Update currency
    updateCurrencyDisplays();
    
    // Update Level Button
    const levelText = translations[currentLanguage].continueLevel || "Level";
    document.getElementById('continueBtn').innerHTML = `<span data-lang="continueLevel">${levelText}</span> ${gameState.currentLevel}`;
    
    // Update Progress Bar
    document.getElementById('levelProgress').style.width = `${gameState.levelProgress}%`;
    document.getElementById('progressValue').textContent = `${gameState.levelProgress}/100`;
}

// --- Settings Panel ---

function toggleSettings(showBackgrounds = false) {
    const panel = document.getElementById('settingsPanel');
    const isOpening = panel.style.display === 'none' || !panel.style.display;
    panel.style.display = isOpening ? 'flex' : 'none';
    
    if (isOpening) {
        document.getElementById('playerNameInput').value = playerName;
        // Scroll to backgrounds if that button was clicked
        if (showBackgrounds) {
            document.getElementById('backgroundSettings').scrollIntoView({ behavior: 'smooth' });
        }
    }
}

function initSettings() {
    const optionsContainer = document.getElementById('backgroundOptions');
    optionsContainer.innerHTML = '';
    const savedBg = localStorage.getItem('drweee_background') || backgrounds[0].value;
    
    backgrounds.forEach((bg) => {
        const option = document.createElement('div');
        option.className = 'bg-option';
        option.style.backgroundImage = bg.value;
        option.title = bg.name;
        option.onclick = () => setBackground(bg.value, option);
        if (bg.value === savedBg) {
            option.classList.add('selected');
        }
        optionsContainer.appendChild(option);
    });
    setBackground(savedBg); // Apply saved or default
}

function setBackground(bgValue, selectedOption) {
    document.getElementById('appContainer').style.backgroundImage = bgValue;
    localStorage.setItem('drweee_background', bgValue);
    
    document.querySelectorAll('.bg-option').forEach(opt => opt.classList.remove('selected'));
    if(selectedOption) {
        selectedOption.classList.add('selected');
    }
}

// --- Friends Panel ---

function showFriends() {
    document.getElementById('friendsPanel').style.display = 'flex';
    document.getElementById('playerCode').textContent = playerCode;
    updateFriendsList();
}
function closeFriends() {
    document.getElementById('friendsPanel').style.display = 'none';
}
function addFriend() {
    const friendCode = document.getElementById('friendCodeInput').value.trim().toUpperCase();
    if (friendCode && friendCode !== playerCode && !friends.includes(friendCode)) {
        friends.push(friendCode);
        localStorage.setItem('drweee_friends', JSON.stringify(friends));
        updateFriendsList();
        document.getElementById('friendCodeInput').value = '';
    }
}
function updateFriendsList() {
    const list = document.getElementById('friendsList');
    list.innerHTML = ''; // Clear list
    if (friends.length === 0) {
        list.innerHTML = `<p style="opacity: 0.7; text-align: center;">${translations[currentLanguage].addFriend}</p>`;
        return;
    }
    friends.forEach(code => {
        const item = document.createElement('div');
        item.className = 'friend-item';
        item.innerHTML = `<span>👤 ${code}</span><button onclick="removeFriend('${code}')">X</button>`;
        list.appendChild(item);
    });
}
function removeFriend(code) {
    friends = friends.filter(f => f !== code);
    localStorage.setItem('drweee_friends', JSON.stringify(friends));
    updateFriendsList();
}

// --- Leaderboard Panel ---

function showLeaderboard() {
    document.getElementById('leaderboardPanel').style.display = 'flex';
    const entriesDiv = document.getElementById('leaderboardEntries');
    entriesDiv.innerHTML = `<p>${translations[currentLanguage].aiLoading}</p>`;
    
    // Fetch leaderboard data
    fetch(DB_CONFIG.LEADERBOARD_GET_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + DB_CONFIG.API_KEY }
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(data => {
        entriesDiv.innerHTML = "";
        data.slice(0, 10).forEach((entry, index) => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'friend-item';
            entryDiv.innerHTML = `<span>${index + 1}. 👤 ${entry.name}</span> <span>${entry.score}</span>`;
            entriesDiv.appendChild(entryDiv);
        });
    })
    .catch(error => {
        console.error('Error fetching leaderboard:', error);
        entriesDiv.innerHTML = `<p style="opacity: 0.7; text-align: center;">Could not load leaderboard.</p>`;
        // Placeholder data on error
        entriesDiv.innerHTML += `
            <div class="friend-item"><span>1. 👤 Player1</span> <span>5000</span></div>
            <div class="friend-item"><span>2. 👤 ${playerName}</span> <span>${gameState.totalScore}</span></div>
            <div class="friend-item"><span>3. 👤 Player3</span> <span>1000</span></div>
        `;
    });
}
function closeLeaderboard() {
    document.getElementById('leaderboardPanel').style.display = 'none';
}


// --- AI Data Fetching ---

async function fetchWordPuzzleFromAI(level) {
    gameSession.retries = 0;
    // Updated prompt to match the image's hint
    const systemPrompt = `You are a word puzzle game. The player is on Level ${level}.
Provide one single-word puzzle.
The topic should be general knowledge, geography, science, or nature (e.g., 'Capital of UK', 'A large mammal', etc.).
The language for word, hint, and letters must be: ${currentLanguage}.
Return *ONLY* a valid JSON object matching the schema. Do not include 'json' or \`\`\` wrappers.
The 'letters' array must contain exactly 12 letters for a 3x4 grid.
It must include all unique letters of the 'word'.
Fill the rest of the 12 spots with logical distractor letters for the specified language.
Shuffle the 'letters' array.
If the word has duplicate letters, only include it once in the 'letters' array, then add distractors.`;

    const schema = {
        type: "OBJECT",
        properties: {
            word: { type: "STRING" },
            hint: { type: "STRING" },
            letters: {
                type: "ARRAY",
                items: { type: "STRING" },
                minItems: 12,
                maxItems: 12
            }
        },
        required: ["word", "hint", "letters"]
    };

    const payload = {
        contents: [{ parts: [{ text: "Generate 1 word puzzle." }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    };

    try {
        const puzzle = await fetchWithRetry(GEMINI_API_URL, payload);
        // Basic validation
        if (!puzzle.word || !puzzle.hint || puzzle.letters.length !== 12) {
            throw new Error("Invalid puzzle structure received from AI.");
        }
        // AI might return words in different cases, standardize it
        puzzle.word = puzzle.word.toUpperCase();
        puzzle.letters = puzzle.letters.map(l => l.toUpperCase());

        gameState.currentPuzzle = puzzle;
        console.log("AI Puzzle:", puzzle);
    } catch (error) {
        console.error("AI fetch failed:", error);
        gameState.currentPuzzle = fallbackWordPuzzle[currentLanguage] || fallbackWordPuzzle.en;
    }
}

async function fetchWithRetry(url, payload, maxRetries = 3) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        
        if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
            const jsonText = result.candidates[0].content.parts[0].text;
            gameSession.retries = 0;
            return JSON.parse(jsonText);
        } else {
            throw new Error("Invalid AI response structure.");
        }
    } catch (error) {
        console.error(`Attempt ${gameSession.retries + 1} failed:`, error);
        gameSession.retries++;
        if (gameSession.retries < maxRetries) {
            const delay = Math.pow(2, gameSession.retries) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(url, payload, maxRetries);
        } else {
            throw new Error("AI request failed after multiple retries.");
        }
    }
}

// --- Word Game Logic ---

function setupWordGame() {
    const puzzle = gameState.currentPuzzle;
    gameState.currentAnswer = [];
    gameState.answerSlots = [];

    // Set level title and hint
    document.getElementById('gameLevelTitle').textContent = `${translations[currentLanguage].level} ${gameState.currentLevel}`;
    document.getElementById('gameHint').textContent = puzzle.hint;
    updateCurrencyDisplays();

    // Create answer boxes
    const answerContainer = document.getElementById('answerBoxes');
    answerContainer.innerHTML = '';
    for (let i = 0; i < puzzle.word.length; i++) {
        const box = document.createElement('div');
        box.className = 'answer-box';
        box.dataset.index = i;
        // Add click to remove letter
        box.onclick = () => removeLetterFromAnswer(i);
        answerContainer.appendChild(box);
        gameState.answerSlots.push(box); // Store DOM element
    }

    // Create letter grid (3x4)
    const gridContainer = document.getElementById('letterGrid');
    gridContainer.innerHTML = '';
    puzzle.letters.forEach((letter, index) => {
        const tile = document.createElement('button');
        tile.className = 'letter-tile';
        tile.textContent = letter;
        tile.dataset.gridIndex = index;
        tile.onclick = () => addLetterToAnswer(letter, tile);
        gridContainer.appendChild(tile);
    });

    // Make sure feather icons are rendered
    feather.replace();
}

function addLetterToAnswer(letter, tileElement) {
    if (gameState.currentAnswer.length >= gameState.currentPuzzle.word.length) {
        return; // Answer is full
    }

    // Find first empty slot
    const emptySlotIndex = gameState.currentAnswer.length;
    const slot = gameState.answerSlots[emptySlotIndex];
    
    if (slot) {
        slot.textContent = letter;
        slot.classList.add('filled');
        tileElement.disabled = true;
        
        // Store the letter and the grid button's index
        gameState.currentAnswer.push({
            letter: letter,
            gridIndex: tileElement.dataset.gridIndex,
            answerIndex: emptySlotIndex
        });
    }

    // Check for win
    if (gameState.currentAnswer.length === gameState.currentPuzzle.word.length) {
        checkWord();
    }
}

function removeLetterFromAnswer(answerIndex) {
    const letterToRemove = gameState.currentAnswer.find(item => item.answerIndex === answerIndex);
    
    if (!letterToRemove) return; // Slot already empty

    // Remove this letter and all letters after it
    const lettersToRemove = gameState.currentAnswer.splice(answerIndex);
    
    lettersToRemove.forEach(item => {
        // Re-enable the grid button
        const gridButton = document.querySelector(`.letter-tile[data-grid-index="${item.gridIndex}"]`);
        if (gridButton) {
            gridButton.disabled = false;
        }
        // Clear the answer slot
        const answerSlot = gameState.answerSlots[item.answerIndex];
        if (answerSlot) {
            answerSlot.textContent = '';
            answerSlot.classList.remove('filled');
        }
    });
}

function clearAnswer() {
    // Kept from previous build, but not in new UI.
    // Can be triggered by a "trash" icon if added back.
    if (gameState.currentAnswer.length > 0) {
        removeLetterFromAnswer(0);
    }
}

// "Wand" icon
function useHint() {
    const cost = 50;
    if (gameState.totalScore < cost) {
        alert(translations[currentLanguage].notEnoughCoins);
        return;
    }
    
    const puzzle = gameState.currentPuzzle;
    const answerWord = puzzle.word;
    
    // Find first incorrect or empty slot
    let slotToFill = -1;
    for (let i = 0; i < answerWord.length; i++) {
        const currentLetter = gameState.currentAnswer[i] ? gameState.currentAnswer[i].letter : null;
        if (currentLetter !== answerWord[i]) {
            slotToFill = i;
            break;
        }
    }
    
    if (slotToFill === -1) return; // Word is already correct

    // Clear from this point
    removeLetterFromAnswer(slotToFill);
    
    // Find the correct letter in the grid
    const correctLetter = answerWord[slotToFill];
    
    // Find the *first available* button for the correct letter
    let correctButton = null;
    const allGridButtons = document.querySelectorAll('.letter-tile:not(:disabled)');
    for (let btn of allGridButtons) {
        if (btn.textContent === correctLetter) {
            correctButton = btn;
            break;
        }
    }

    if (correctButton) {
        gameState.totalScore -= cost;
        updateCurrencyDisplays();
        addLetterToAnswer(correctLetter, correctButton);
    } else {
        // This case shouldn't happen if AI prompt is correct
        console.error("Hint letter not found in grid!");
    }
}

// "Fire" icon
function usePowerHint() {
    const cost = 150;
    if (gameState.totalScore < cost) {
        alert(translations[currentLanguage].notEnoughCoins);
        return;
    }

    const puzzle = gameState.currentPuzzle;
    const answerLetters = new Set(puzzle.word.split(''));
    
    // Find 3 wrong letters on the grid
    const wrongButtons = [];
    const allGridButtons = document.querySelectorAll('.letter-tile:not(:disabled)');
    
    for (let btn of allGridButtons) {
        if (!answerLetters.has(btn.textContent)) {
            wrongButtons.push(btn);
            if (wrongButtons.length >= 3) break;
        }
    }

    if (wrongButtons.length > 0) {
        gameState.totalScore -= cost;
        updateCurrencyDisplays();
        wrongButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.3'; // Make them fade
        });
    }
}


function checkWord() {
    const puzzle = gameState.currentPuzzle;
    const playerWord = gameState.currentAnswer.map(item => item.letter).join('');
    
    if (playerWord === puzzle.word) {
        // Correct!
        gameSession.playerStats.language.correct++;
        soundEnabled && sounds.victory();
        document.getElementById('levelCompletePanel').style.display = 'flex';
    } else {
        // Incorrect
        gameSession.playerStats.language.wrong++;
        soundEnabled && sounds.wrong();
        const answerContainer = document.getElementById('answerBoxes');
        answerContainer.classList.add('shake');
        setTimeout(() => {
            answerContainer.classList.remove('shake');
            clearAnswer();
        }, 500);
    }
}

function updateCurrencyDisplays() {
    document.getElementById('mainCurrency').textContent = gameState.totalScore;
    document.getElementById('gameCurrency').textContent = gameState.totalScore;
}

// --- Audio ---

function initAudio() {
    if (audioContext) return; // Already initialized
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        createSounds();
        playBackgroundMusic();
    } catch (e) {
        console.log('Audio not supported');
    }
}
function createSounds() {
    sounds = {
        correct: () => playTone(800, 0.2, 'sine'),
        wrong: () => playTone(200, 0.3, 'sawtooth'),
        victory: () => {
            playTone(523, 0.2, 'sine');
            setTimeout(() => playTone(659, 0.2, 'sine'), 200);
            setTimeout(() => playTone(784, 0.3, 'sine'), 400);
        }
    };
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
    bgMusic.frequency.value = 220;
    bgMusic.type = 'sine';
    e.gain.setValueAtTime(0.05 * musicVolume, audioContext.currentTime);
    bgMusic.start();
    bgMusic.loop = true;
}

// --- Database Placeholder Function ---
function saveScoreToDatabase(score) {
    console.log(`Attempting to save score: ${score} for player: ${playerName}`);
    // Save to server
    /*
    fetch(DB_CONFIG.SCORE_POST_URL, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + DB_CONFIG.API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            playerName: playerName,
            score: score,
            playerCode: playerCode,
            level: gameState.currentLevel
        })
    })
    .then(response => response.json())
    .then(data => console.log('Score saved successfully:', data))
    .catch(error => console.error('Error saving score:', error));
    */
}


// --- Event Listeners & Initialization ---

document.getElementById('musicVolume').addEventListener('input', e => {
    musicVolume = e.target.value / 100;
    if (bgMusic && audioContext) {
        playBackgroundMusic();
    }
});
document.getElementById('sfxVolume').addEventListener('input', e => {
    sfxVolume = e.target.value / 100;
});
document.getElementById('playerNameInput').addEventListener('change', e => {
    playerName = e.target.value || 'Player';
    localStorage.setItem('drweee_playerName', playerName);
});

// --- Game Initialization ---
function simulateLoading() {
    let progress = 0;
    const bar = document.getElementById('loadingBar');
    const text = document.getElementById('loadingText');
    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress > 100) progress = 100;
        
        // Check if elements exist before updating
        if (bar) bar.style.width = progress + '%';
        if (text) text.textContent = `Loading... ${Math.round(progress)}%`;
        
        if (progress === 100) {
            clearInterval(interval);
            setTimeout(() => {
                const loadingScreen = document.getElementById('loadingScreen');
                if (loadingScreen) {
                    loadingScreen.style.opacity = '0';
                    loadingScreen.addEventListener('transitionend', () => {
                        loadingScreen.style.display = 'none';
                    });
                }
                // Audio now inits on first *real* user interaction
                document.body.addEventListener('click', initAudio, { once: true });
                document.body.addEventListener('touchstart', initAudio, { once: true });
            }, 500);
        }
    }, 200);
}

// Load data and start game
window.onload = () => {
    // Load saved data
    const savedName = localStorage.getItem('drweee_playerName');
    if (savedName) {
        playerName = savedName;
    }
    const savedFriends = localStorage.getItem('drweee_friends');
    if (savedFriends) {
        try {
            friends = JSON.parse(savedFriends);
        } catch (e) { friends = []; }
    }
    const savedLevel = localStorage.getItem('drweee_level');
    if (savedLevel) {
        gameState.currentLevel = parseInt(savedLevel, 10);
    }
    const savedScore = localStorage.getItem('drweee_score');
    if (savedScore) {
        gameState.totalScore = parseInt(savedScore, 10);
    }
    const savedProgress = localStorage.getItem('drweee_progress');
    if (savedProgress) {
        gameState.levelProgress = parseInt(savedProgress, 10);
    }
    
    playerCode = generatePlayerCode();
    document.getElementById('musicVolume').value = musicVolume * 100;
    document.getElementById('sfxVolume').value = sfxVolume * 100;
    
    initSettings(); // Setup backgrounds
    changeLanguage(); // Set language and initial translations
    updateMainScreenUI();
    
    // Check if loading screen exists
    if (document.getElementById('loadingScreen')) {
        simulateLoading();
    } else {
        // Fallback if loading screen was removed
        document.body.addEventListener('click', initAudio, { once: true });
        document.body.addEventListener('touchstart', initAudio, { once: true });
    }

    // Activate Feather Icons
    feather.replace();
};
