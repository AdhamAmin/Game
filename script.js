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
let selectedCharacter = 'boy';
let isPaused = false;
let soundEnabled = true;
let musicVolume = 0.5;
let sfxVolume = 0.7;
let audioContext = null;
let bgMusic = null;
let playerName = 'Player';
let playerCode = '';
let selectedCarColor = '#3498db';
let friends = [];
let sounds = {};

const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;

// --- Asset Loading (Placeholders) ---
const boyImg = new Image();
// Updated: New image src
boyImg.src = 'https://raw.githubusercontent.com/AdhamAmin/Game/main/image-removebg-preview.png';

const girlImg = new Image();
// Updated: New image src
girlImg.src = 'https://raw.githubusercontent.com/AdhamAmin/Game/main/image-removebg-preview.png';

let currentCharacterImg = boyImg;


// --- AI & Session State ---
let gameSession = {
    // Stores performance to personalize AI questions
    playerStats: {
        math: { correct: 0, wrong: 0 },
        science: { correct: 0, wrong: 0 },
        environment: { correct: 0, wrong: 0 },
        geography: { correct: 0, wrong: 0 },
        language: { correct: 0, wrong: 0 }
    },
    // Caches questions from AI for the current game
    currentRaceQuestions: [],
    currentWordPuzzles: [],
    retries: 0 // For exponential backoff
};


// --- Translations (with new AI/Loading keys) ---
const translations = {
    en: {
        title: "Dr.WEEE's World", drweee: "Dr. WEEE", drweeena: "Dr. WEEENA", 
        playAsBoy: "Play as Dr. WEEE", playAsGirl: "Play as Dr. WEEENA", // Kept for logic, though buttons are gone
        raceChallenge: "Race Challenge", leaderboard: "Leaderboard", friends: "Friends", 
        settings: "Settings", musicVolume: "Music Volume", sfxVolume: "SFX Volume", 
        playerName: "Player Name", yourCode: "Your Player Code", addFriend: "Add Friend by Code", 
        add: "Add Friend", chooseColor: "Choose Your Car Color", startRace: "Start Race!", 
        gameOver: "Game Over!", tryAgain: "Try Again", mainMenu: "Main Menu", 
        paused: "PAUSED", resume: "Resume", level: "Level", mission: "Mission", 
        raceProgress: "Progress", levelComplete: "Level Complete!", 
        greatJob: "Great job!", continueNext: "Continue", hallOfHeroes: "Hall of Heroes", 
        back: "Back", close: "Close",
        wordGameTitle: "Word Puzzle", hint: "Hint", completeWord: "Complete the Word!",
        correctWord: "Correct!", wrongLetter: "Wrong Letter!",
        wrongGuessesLeft: "Wrong Guesses Left:", chooseBackground: "Choose Background",
        aiLoading: "Asking the AI for new questions...", // New
        aiError: "AI failed, using backup questions.", // New
        aiGeneratingRace: "Building your race...", // New
        aiGeneratingWords: "Creating new puzzles..." // New
    },
    ar: {
        title: "عالم الدكتور وي", drweee: "د. وي", drweeena: "د. وينا", 
        playAsBoy: "العب كـ د. وي", playAsGirl: "العب كـ د. وينا", 
        raceChallenge: "تحدي السباق", leaderboard: "المتصدرين", friends: "الأصدقاء", 
        settings: "الإعدادات", musicVolume: "مستوى الموسيقى", sfxVolume: "مستوى المؤثرات", 
        playerName: "اسم اللاعب", yourCode: "رمزك", addFriend: "أضف صديق بالرمز", 
        add: "إضافة صديق", chooseColor: "اختر لون سيارتك", startRace: "ابدأ السباق!", 
        gameOver: "انتهت اللعبة!", tryAgain: "حاول مرة أخرى", mainMenu: "القائمة الرئيسية", 
        paused: "متوقف", resume: "استئناف", level: "مستوى", mission: "مهمة", 
        raceProgress: "التقدم", levelComplete: "المستوى مكتمل!", 
        greatJob: "عمل رائع!", continueNext: "متابعة", hallOfHeroes: "قاعة الأبطال", 
        back: "عودة", close: "إغلاق",
        wordGameTitle: "لغز الكلمات", hint: "تلميح", completeWord: "أكمل الكلمة!",
        correctWord: "صحيح!", wrongLetter: "حرف خاطئ!",
        wrongGuessesLeft: "المحاولات الخاطئة المتبقية:", chooseBackground: "اختر الخلفية",
        aiLoading: "سؤال الذكاء الاصطناعي عن أسئلة جديدة...",
        aiError: "فشل الذكاء الاصطناعي، يتم استخدام أسئلة احتياطية.",
        aiGeneratingRace: "يتم بناء سباقك...",
        aiGeneratingWords: "يتم إنشاء ألغاز جديدة..."
    },
    it: {
        title: "Il Mondo del Dr.WEEE", drweee: "Dr. WEEE", drweeena: "Dr. WEEENA",
        playAsBoy: "Gioca come Dr. WEEE", playAsGirl: "Gioca come Dr. WEEENA",
        raceChallenge: "Sfida di Corsa", leaderboard: "Classifica", friends: "Amici",
        settings: "Impostazioni", musicVolume: "Volume Musica", sfxVolume: "Volume Effetti",
        playerName: "Nome Giocatore", yourCode: "Il Tuo Codice", addFriend: "Aggiungi Amico",
        add: "Aggiungi", chooseColor: "Scegli Colore Auto", startRace: "Inizia Gara!",
        gameOver: "Game Over!", tryAgain: "Riprova", mainMenu: "Menu Principale",
        paused: "IN PAUSA", resume: "Riprendi", level: "Livello", mission: "Missione",
        raceProgress: "Progresso", levelComplete: "Completato!", greatJob: "Ottimo!",
        continueNext: "Continua", hallOfHeroes: "Sala Eroi", back: "Indietro", close: "Chiudi",
        wordGameTitle: "Puzzle di Parole", hint: "Indizio", completeWord: "Completa la Parola!",
        correctWord: "Corretto!", wrongLetter: "Lettera Sbagliata!",
        wrongGuessesLeft: "Tentativi Sbagliati Rimasti:", chooseBackground: "Scegli Sfondo",
        aiLoading: "Chiedo all'IA nuove domande...",
        aiError: "L'IA non è riuscita, uso domande di backup.",
        aiGeneratingRace: "Costruendo la tua gara...",
        aiGeneratingWords: "Creando nuovi puzzle..."
    },
    es: {
        title: "El Mundo del Dr.WEEE", drweee: "Dr. WEEE", drweeena: "Dr. WEEENA",
        playAsBoy: "Jugar como Dr. WEEE", playAsGirl: "Jugar como Dr. WEEENA",
        raceChallenge: "Desafío de Carrera", leaderboard: "Tabla de Líderes", friends: "Amigos",
        settings: "Ajustes", musicVolume: "Volumen Música", sfxVolume: "Volumen Efectos",
        playerName: "Nombre del Jugador", yourCode: "Tu Código", addFriend: "Agregar Amigo",
        add: "Agregar", chooseColor: "Elige Color del Auto", startRace: "¡Comenzar Carrera!",
        gameOver: "¡Game Over!", tryAgain: "Intentar de Nuevo", mainMenu: "Menú Principal",
        paused: "PAUSADO", resume: "Reanudar", level: "Nivel", mission: "Misión",
        raceProgress: "Progreso", levelComplete: "¡Completado!", greatJob: "¡Genial!",
        continueNext: "Continuar", hallOfHeroes: "Salón de Héroes", back: "Atrás", close: "Cerrar",
        wordGameTitle: "Puzzle de Palabras", hint: "Pista", completeWord: "¡Completa la Palabra!",
        correctWord: "¡Correcto!", wrongLetter: "¡Letra Incorrecta!",
        wrongGuessesLeft: "Intentos Fallidos Restantes:", chooseBackground: "Elige Fondo",
        aiLoading: "Pidiendo nuevas preguntas a la IA...",
        aiError: "La IA falló, usando preguntas de respaldo.",
        aiGeneratingRace: "Construyendo tu carrera...",
        aiGeneratingWords: "Creando nuevos rompecabezas..."
    }
};

const educationalTips = {
    en: ["Recycling helps save our planet!", "Plastic takes 450 years to decompose!", "Always turn off lights when leaving a room!", "Trees produce the oxygen we breathe!", "Use reusable bags!"],
    ar: ["إعادة التدوير تساعد في إنقاذ كوكبنا!", "البلاستيك يستغرق 450 سنة ليتحلل!", "أطفئ الأنوار عند مغادرة الغرفة!", "الأشجار تنتج الأكسجين الذي نتنفسه!", "استخدم أكياس قابلة لإعادة الاستخدام!"],
    it: ["Il riciclaggio aiuta a salvare il pianeta!", "La plastica impiega 450 anni a decomporsi!", "Spegni sempre le luci when esci!", "Gli alberi producono l'ossigeno!", "Usa borse riutilizzabili!"],
    es: ["¡Reciclar ayuda a salvar el planeta!", "¡El plástico tarda 450 años en descomponerse!", "¡Apaga las luces al salir!", "¡Los árboles producen el oxígeno!", "¡Usa bolsas reutilizabili!"]
};

// --- Fallback Questions (if AI fails) ---
const fallbackRaceQuestions = [
    { topic: 'math', q: 'What is 10 + 10?', a: ['20', '30', '10', '0'], correct: 0 },
    { topic: 'science', q: 'What planet do we live on?', a: ['Mars', 'Earth', 'Venus', 'Jupiter'], correct: 1 },
    { topic: 'environment', q: 'What color is grass?', a: ['Blue', 'Red', 'Green', 'Yellow'], correct: 2 }
];
const fallbackWordPuzzles = {
    en: [{ word: "EARTH", hint: "Our planet." }],
    ar: [{ word: "أرض", hint: "كوكبنا." }],
    it: [{ word: "TERRA", hint: "Il nostro pianeta." }],
    es: [{ word: "TIERRA", hint: "Nuestro planeta." }]
};

// --- Backgrounds ---
const backgrounds = [
    { name: 'Sky', value: 'linear-gradient(180deg, #87CEEB 0%, #E0F6FF 100%)' },
    { name: 'Sunset', value: 'linear-gradient(180deg, #ff7e5f 0%, #feb47b 100%)' },
    { name: 'Night', value: 'linear-gradient(180deg, #2c3e50 0%, #4a69bd 100%)' },
    { name: 'Forest', value: 'linear-gradient(180deg, #2a623d 0%, #a8e063 100%)' }
];

// --- Map & Race Game Data ---
const gameState = { currentLevel: 1, currentMission: 1, totalScore: 0, levelsData: [] };
for (let i = 1; i <= 10; i++) {
    const missions = [];
    for (let j = 1; j <= 10; j++) {
        missions.push({ completed: false, x: 100 + 100 * (j - 1), y: 100 + 50 * Math.sin(j) + 50 * (i - 1) });
    }
    gameState.levelsData.push({ missions });
}

const mapCanvas = document.getElementById('mapCanvas'), mapCtx = mapCanvas.getContext('2d');
const raceCanvas = document.getElementById('raceCanvas'), raceCtx = raceCanvas.getContext('2d');

const character = { x: 100, y: 100, targetX: 100, targetY: 100, moving: false };
let raceState = { playerPos: 0, aiPos: 0, questionCount: 0, racing: false, roadOffset: 0 };
let currentWordGame = {
    missionIndex: 0, word: "", hint: "", guesses: [], wrongGuesses: 0,
    maxWrongGuesses: 6, boxes: []
};


// --- Core Functions ---

function generatePlayerCode() {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
}

function changeLanguage() {
    currentLanguage = document.getElementById('languageSelect').value;
    updateTranslations();
}

function updateTranslations() {
    document.querySelectorAll('[data-lang]').forEach(e => {
        const key = e.getAttribute('data-lang');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            e.textContent = translations[currentLanguage][key];
        }
    });
    if (document.getElementById('wordGameContainer').style.display === 'block') {
        updateWrongGuessesText();
    }
}

function selectCharacterAndStart(e) {
    selectedCharacter = e;
    currentCharacterImg = (e === 'boy') ? boyImg : girlImg;
    // Pre-load word puzzles for the level
    showLoadingSpinner(translations[currentLanguage].aiGeneratingWords || "Creating new puzzles...");
    fetchWordPuzzlesFromAI().then(() => {
        showMap();
    }).finally(() => {
        hideLoadingSpinner();
    });
}

function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    const isOpening = panel.style.display === 'none' || !panel.style.display;
    panel.style.display = isOpening ? 'block' : 'none';
    
    if (isOpening) {
        document.getElementById('playerCode').textContent = playerCode;
        document.getElementById('playerNameInput').value = playerName;
    }
}

function initSettings() {
    const optionsContainer = document.getElementById('backgroundOptions');
    optionsContainer.innerHTML = '';
    const savedBg = localStorage.getItem('drweee_background') || backgrounds[0].value;
    let selectedOption = null;

    backgrounds.forEach((bg) => {
        const option = document.createElement('div');
        option.className = 'bg-option';
        option.style.background = bg.value;
        option.title = bg.name;
        option.onclick = () => setBackground(bg.value, option);
        optionsContainer.appendChild(option);
        if (bg.value === savedBg) {
            selectedOption = option;
        }
    });

    if (selectedOption) {
        setBackground(savedBg, selectedOption);
    } else {
        setBackground(backgrounds[0].value, optionsContainer.children[0]);
    }
}

function setBackground(bgValue, selectedOption) {
    document.body.style.background = bgValue;
    localStorage.setItem('drweee_background', bgValue);
    
    document.querySelectorAll('.bg-option').forEach(opt => opt.classList.remove('selected'));
    if(selectedOption) {
        selectedOption.classList.add('selected');
    }
}

// --- Friends Functions ---

function showFriends() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('friendsPanel').style.display = 'block';
    updateFriendsList();
}
function closeFriends() {
    document.getElementById('friendsPanel').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'flex';
}
function addFriend() {
    const friendCode = document.getElementById('friendCodeInput').value.trim().toUpperCase();
    if (friendCode && friendCode !== playerCode && !friends.includes(friendCode)) {
        friends.push(friendCode);
        localStorage.setItem('drweee_friends', JSON.stringify(friends));
        updateFriendsList();
        document.getElementById('friendCodeInput').value = '';
        alert(translations[currentLanguage].add || 'Friend added!');
    }
}
function updateFriendsList() {
    const list = document.getElementById('friendsList');
    list.innerHTML = '';
    friends.forEach(code => {
        const item = document.createElement('div');
        item.className = 'friend-item';
        item.innerHTML = `<span>👤 ${code}</span><button onclick="removeFriend('${code}')" style="background:#e74c3c;color:white;border:none;padding:5px 15px;border-radius:5px;cursor:pointer;">Remove</button>`;
        list.appendChild(item);
    });
}
function removeFriend(code) {
    friends = friends.filter(f => f !== code);
    localStorage.setItem('drweee_friends', JSON.stringify(friends));
    updateFriendsList();
}

// --- Pause & Resume ---

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pauseMenu').style.display = isPaused ? 'block' : 'none';
    if (isPaused) {
        // Stop race animation loop if it's active
        if(raceState.racing) raceState.racing = false;
    } else {
        resumeGame();
    }
}

function resumeGame() {
    isPaused = false;
    document.getElementById('pauseMenu').style.display = 'none';
    
    if (document.getElementById('mapContainer').style.display === 'block') {
        drawMap();
    } else if (document.getElementById('raceContainer').style.display === 'block') {
        raceState.racing = true; // Re-enable racing flag
        drawRace(); // Start loop again
    }
}

// --- AI Loading Spinner ---
function showLoadingSpinner(text) {
    document.getElementById('aiLoaderText').textContent = text || (translations[currentLanguage].aiLoading || "Loading...");
    document.getElementById('aiLoader').style.display = 'flex';
}
function hideLoadingSpinner() {
    document.getElementById('aiLoader').style.display = 'none';
}


// --- AI Data Fetching ---

/**
 * Fetches 10 personalized race questions from the Gemini API.
 * Uses playerStats to tailor questions to weaker subjects.
 * Provides a fallback to static questions on failure.
 */
async function fetchRaceQuestionsFromAI() {
    gameSession.retries = 0; // Reset retry counter
    const systemPrompt = `You are an adaptive educational tutor for a children's game. The player's current performance is: ${JSON.stringify(gameSession.playerStats)}.
Generate 10 new, unique, multiple-choice quiz questions.
Focus on the player's weaker topics to help them learn. If stats are all 0, provide a mix.
Topics must be 'math', 'science', 'environment', or 'geography'.
The language for questions and answers must be: ${currentLanguage}.
Return *ONLY* a valid JSON array matching the provided schema. Do not include 'json' or '```' wrappers.`;

    const schema = {
        type: "ARRAY",
        items: {
            type: "OBJECT",
            properties: {
                topic: { type: "STRING" },
                q: { type: "STRING" },
                a: { type: "ARRAY", items: { type: "STRING" } },
                correct: { type: "NUMBER" }
            },
            required: ["topic", "q", "a", "correct"],
            propertyOrdering: ["topic", "q", "a", "correct"]
        }
    };

    const payload = {
        contents: [{ parts: [{ text: "Generate 10 questions." }] }], // Simple user prompt
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    };

    try {
        const questions = await fetchWithRetry(GEMINI_API_URL, payload);
        gameSession.currentRaceQuestions = questions;
        console.log("AI Race Questions:", questions);
    } catch (error) {
        console.error("AI Race Question fetch failed:", error);
        alert(translations[currentLanguage].aiError || "AI failed, using backup questions.");
        gameSession.currentRaceQuestions = fallbackRaceQuestions;
    }
}

/**
 * Fetches 10 word puzzles from the Gemini API for the current level.
 * Provides a fallback to static puzzles on failure.
 */
async function fetchWordPuzzlesFromAI() {
    gameSession.retries = 0; // Reset retry counter
    const systemPrompt = `You are an educational game designer. Generate 10 unique, age-appropriate, one-word puzzles for a children's game.
The words should be related to 'science', 'nature', 'technology', and 'environment'.
The words must be between 5-10 letters.
The language for words and hints must be: ${currentLanguage}.
Return *ONLY* a valid JSON array matching the provided schema. Do not include 'json' or '```' wrappers.`;

    const schema = {
        type: "ARRAY",
        items: {
            type: "OBJECT",
            properties: {
                word: { type: "STRING" },
                hint: { type: "STRING" }
            },
            required: ["word", "hint"],
            propertyOrdering: ["word", "hint"]
        }
    };
    
    const payload = {
        contents: [{ parts: [{ text: "Generate 10 puzzles." }] }], // Simple user prompt
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    };
    
    try {
        const puzzles = await fetchWithRetry(GEMINI_API_URL, payload);
        gameSession.currentWordPuzzles = puzzles;
        console.log("AI Word Puzzles:", puzzles);
    } catch (error) {
        console.error("AI Word Puzzle fetch failed:", error);
        alert(translations[currentLanguage].aiError || "AI failed, using backup questions.");
        gameSession.currentWordPuzzles = fallbackWordPuzzles[currentLanguage] || fallbackWordPuzzles.en;
    }
}

/**
 * A wrapper for fetch that includes exponential backoff for retries.
 */
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
        
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            
            const jsonText = result.candidates[0].content.parts[0].text;
            gameSession.retries = 0; // Success, reset retry counter
            return JSON.parse(jsonText); // This should be the array
        } else {
            throw new Error("Invalid AI response structure.");
        }
    } catch (error) {
        console.error(`Attempt ${gameSession.retries + 1} failed:`, error);
        gameSession.retries++;
        if (gameSession.retries < maxRetries) {
            const delay = Math.pow(2, gameSession.retries) * 1000; // 1s, 2s, 4s
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(url, payload, maxRetries);
        } else {
            throw new Error("AI request failed after multiple retries.");
        }
    }
}


// --- Race Game ---

function selectCarColor(e) {
    selectedCarColor = e;
    document.querySelectorAll('.car-color').forEach(t => t.classList.remove('selected'));
    event.target.classList.add('selected');
}

function startRace() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('carSelection').style.display = 'block';
}

async function startRaceWithColor() {
    document.getElementById('carSelection').style.display = 'none';
    
    // Fetch new questions from AI
    showLoadingSpinner(translations[currentLanguage].aiGeneratingRace || "Building your race...");
    await fetchRaceQuestionsFromAI();
    hideLoadingSpinner();
    
    raceState = { playerPos: 0, aiPos: 0, questionCount: 0, racing: true, roadOffset: 0 };
    document.getElementById('raceContainer').style.display = 'flex'; // Use flex
    document.getElementById('raceProgress').textContent = 0;
    
    // Ensure canvas dimensions are set correctly
    resizeCanvas(raceCanvas);
    
    drawRace();
    setTimeout(() => showQuestion('race'), 1000);
}

function drawRace() {
    if (!raceState.racing || isPaused) return;

    raceCtx.clearRect(0, 0, raceCanvas.width, raceCanvas.height);
    
    // Simple responsive sky/ground
    const skyHeight = raceCanvas.height * 0.5;
    const groundHeight = raceCanvas.height * 0.5;

    const skyGradient = raceCtx.createLinearGradient(0, 0, 0, skyHeight);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#E0F6FF');
    raceCtx.fillStyle = skyGradient;
    raceCtx.fillRect(0, 0, raceCanvas.width, skyHeight);
    
    raceCtx.fillStyle = '#34495e'; // Road color
    raceCtx.fillRect(0, skyHeight, raceCanvas.width, groundHeight);
    
    raceState.roadOffset += 5;
    if (raceState.roadOffset > 60) raceState.roadOffset = 0;
    
    const lineY = skyHeight + groundHeight * 0.25; // Line in upper part of road
    raceCtx.strokeStyle = '#f1c40f';
    raceCtx.lineWidth = 5;
    raceCtx.setLineDash([30, 30]);
    raceCtx.beginPath();
    raceCtx.moveTo(raceState.roadOffset, lineY);
    raceCtx.lineTo(raceCanvas.width + raceState.roadOffset, lineY);
    raceCtx.stroke();
    raceCtx.setLineDash([]);
    
    // Responsive car sizes
    const carWidth = clamp(80, raceCanvas.width * 0.1, 100);
    const carHeight = carWidth * 0.4;
    const wheelSize = carWidth * 0.1;
    
    // Player
    const playerX = clamp(50, raceCanvas.width * 0.1, 150) + raceState.playerPos;
    const playerY = skyHeight + groundHeight * 0.1;
    drawCar(raceCtx, playerX, playerY, carWidth, carHeight, wheelSize, selectedCarColor, playerName);

    // AI
    const aiX = clamp(50, raceCanvas.width * 0.1, 150) + raceState.aiPos;
    const aiY = skyHeight + groundHeight * 0.6;
    drawCar(raceCtx, aiX, aiY, carWidth, carHeight, wheelSize, '#e74c3c', 'AI Racer');

    requestAnimationFrame(drawRace);
}

function drawCar(ctx, x, y, w, h, wheelSize, color, name) {
    // Car Body
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    
    // Cabin
    ctx.beginPath();
    ctx.moveTo(x + w * 0.2, y);
    ctx.lineTo(x + w * 0.3, y - h * 0.6);
    ctx.lineTo(x + w * 0.7, y - h * 0.6);
    ctx.lineTo(x + w * 0.8, y);
    ctx.closePath();
    ctx.fill();
    
    // Wheels
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(x + w * 0.2, y + h, wheelSize, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w * 0.8, y + h, wheelSize, 0, 2 * Math.PI);
    ctx.fill();
    
    // Name
    ctx.fillStyle = 'white';
    ctx.font = `bold ${clamp(12, w * 0.15, 16)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(name, x + w / 2, y - h * 0.8);
}

// Helper function
function clamp(min, preferred, max) {
    return Math.max(min, Math.min(preferred, max));
}


// --- Map Functions ---

function showMap() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('mapContainer').style.display = 'flex'; // Use flex
    resizeCanvas(mapCanvas);
    drawMap();
}

function drawMap() {
    if (isPaused) return;

    mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
    const gradient = mapCtx.createLinearGradient(0, 0, 0, mapCanvas.height);
    gradient.addColorStop(0, '#a8edea');
    gradient.addColorStop(1, '#fed6e3');
    mapCtx.fillStyle = gradient;
    mapCtx.fillRect(0, 0, mapCanvas.width, mapCanvas.height);

    // Responsive mission dots
    const missionRadius = clamp(15, mapCanvas.width * 0.02, 25);
    const missionFontSize = clamp(12, missionRadius * 0.8, 20);

    gameState.levelsData[gameState.currentLevel - 1].missions.forEach((mission, index) => {
        // Adjust mission X/Y based on canvas size? For now, assume 1200x600 coordinate space
        const missionX = (mission.x / 1200) * mapCanvas.width;
        const missionY = (mission.y / 600) * mapCanvas.height;

        mapCtx.fillStyle = mission.completed ? '#27ae60' : '#3498db';
        mapCtx.beginPath();
        mapCtx.arc(missionX, missionY, missionRadius, 0, 2 * Math.PI);
        mapCtx.fill();
        mapCtx.strokeStyle = '#2c3e50';
        mapCtx.lineWidth = 3;
        mapCtx.stroke();
        mapCtx.fillStyle = 'white';
        mapCtx.font = `bold ${missionFontSize}px Arial`;
        mapCtx.textAlign = 'center';
        mapCtx.textBaseline = 'middle';
        mapCtx.fillText(index + 1, missionX, missionY);
    });

    const charSize = missionRadius * 3;
    const charX = (character.x / 1200) * mapCanvas.width;
    const charY = (character.y / 600) * mapCanvas.height;
    mapCtx.drawImage(currentCharacterImg, charX - charSize/2, charY - charSize*0.7, charSize, charSize * 1.4);

    if (character.moving) {
        const targetX = (character.targetX / 1200) * mapCanvas.width;
        const targetY = (character.targetY / 600) * mapCanvas.height;
        
        const dx = targetX - charX, dy = targetY - charY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 3) { // Use a small pixel distance
            character.x += (dx / dist * 3) * (1200 / mapCanvas.width); // Move in base coordinate space
            character.y += (dy / dist * 3) * (600 / mapCanvas.height);
        } else {
            character.x = character.targetX;
            character.y = character.targetY;
            character.moving = false;
            startWordGame(gameState.currentMission - 1);
        }
    }
    requestAnimationFrame(drawMap);
}

// --- Word Game Functions ---

function startWordGame(missionIndex) {
    document.getElementById('mapContainer').style.display = 'none';
    document.getElementById('wordGameContainer').style.display = 'flex'; // Use flex

    const puzzleList = gameSession.currentWordPuzzles;
    const puzzle = puzzleList[missionIndex];

    if (!puzzle) {
        console.error(`No puzzle found for index=${missionIndex}. Using fallback.`);
        const fallback = fallbackWordPuzzles[currentLanguage] || fallbackWordPuzzles.en;
        currentWordGame = {
            missionIndex: missionIndex,
            word: fallback[0].word.toUpperCase(),
            hint: fallback[0].hint,
            guesses: [], wrongGuesses: 0, maxWrongGuesses: 6,
            boxes: Array(fallback[0].word.length).fill(null)
        };
    } else {
         currentWordGame = {
            missionIndex: missionIndex,
            word: puzzle.word.toUpperCase(),
            hint: puzzle.hint,
            guesses: [], wrongGuesses: 0, maxWrongGuesses: 6,
            boxes: Array(puzzle.word.length).fill(null)
        };
    }

    document.getElementById('wordGameHint').textContent = currentWordGame.hint;
    updateWrongGuessesText();

    const boxesContainer = document.getElementById('wordBoxes');
    boxesContainer.innerHTML = '';
    for (let i = 0; i < currentWordGame.word.length; i++) {
        const box = document.createElement('div');
        box.className = 'letter-box';
        boxesContainer.appendChild(box);
    }
    generateLetterBank(currentWordGame.word);
}

function updateWrongGuessesText() {
    const guessesLeft = currentWordGame.maxWrongGuesses - currentWordGame.wrongGuesses;
    const text = translations[currentLanguage].wrongGuessesLeft || "Wrong Guesses Left:";
    document.getElementById('wrongGuessesText').textContent = `${text} ${guessesLeft}`;
}

function generateLetterBank(word) {
    const bankContainer = document.getElementById('letterBank');
    bankContainer.innerHTML = '';
    const letters = new Set(word.split(''));
    
    // Use a language-specific alphabet if needed, fallback to English
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; 
    while (letters.size < 18 && letters.size < word.length + 5 && letters.size < alphabet.length) {
        const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
        if (!letters.has(randomLetter)) {
            letters.add(randomLetter);
        }
    }

    const shuffledLetters = Array.from(letters).sort(() => Math.random() - 0.5);
    shuffledLetters.forEach(letter => {
        const btn = document.createElement('button');
        btn.className = 'letter-btn';
        btn.textContent = letter;
        btn.onclick = () => handleLetterClick(letter, btn);
        bankContainer.appendChild(btn);
    });
}

function handleLetterClick(letter, btn) {
    if (isPaused || currentWordGame.guesses.includes(letter)) return;

    btn.disabled = true;
    currentWordGame.guesses.push(letter);

    if (currentWordGame.word.includes(letter)) {
        soundEnabled && sounds.correct();
        let allBoxesFilled = true;
        for (let i = 0; i < currentWordGame.word.length; i++) {
            if (currentWordGame.word[i] === letter) {
                currentWordGame.boxes[i] = letter;
                const boxElement = document.getElementById('wordBoxes').children[i];
                if(boxElement) {
                    boxElement.textContent = letter;
                    boxElement.classList.add('filled');
                }
            }
            if (currentWordGame.boxes[i] === null) {
                allBoxesFilled = false;
            }
        }
        if (allBoxesFilled) {
            gameSession.playerStats.language.correct++;
            soundEnabled && sounds.victory();
            setTimeout(() => {
                document.getElementById('levelComplete').style.display = 'block';
            }, 1000);
        }
    } else {
        gameSession.playerStats.language.wrong++;
        soundEnabled && sounds.wrong();
        currentWordGame.wrongGuesses++;
        updateWrongGuessesText();
        if (currentWordGame.wrongGuesses >= currentWordGame.maxWrongGuesses) {
            showGameOver(true); // true = word game over
        }
    }
}

function retryWordGame() {
    document.getElementById('gameOverPanel').style.display = 'none';
    startWordGame(currentWordGame.missionIndex);
}

// --- Game Over, Level Complete, Navigation ---

function showGameOver(isWordGame = false) {
    const e = educationalTips[currentLanguage];
    const t = e[Math.floor(Math.random() * e.length)];
    document.getElementById('gameOverTip').textContent = t;
    document.getElementById('gameOverPanel').style.display = 'block';
    
    const retryBtn = document.querySelector('#gameOverPanel .retry-btn');
    if (isWordGame) {
        retryBtn.setAttribute('onclick', 'retryWordGame()');
    } else {
        retryBtn.setAttribute('onclick', 'backToMenu()'); 
    }
}

function showLeaderboard() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('leaderboard').style.display = 'block';
    
    const entriesDiv = document.getElementById('leaderboardEntries');
    entriesDiv.innerHTML = "Loading scores...";
    
    // Use the placeholder DB_CONFIG
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
            entryDiv.innerHTML = `<span>${index + 1}. 👤 ${entry.name}</span> <span>${entry.score} pts</span>`;
            entriesDiv.appendChild(entryDiv);
        });
    })
    .catch(error => {
        console.error('Error fetching leaderboard:', error);
        entriesDiv.innerHTML = "Could not load scores. Using placeholder data.";
        // Placeholder data on error
        entriesDiv.innerHTML = `
            <div class="friend-item"><span>1. 👤 Player1</span> <span>500 pts</span></div>
            <div class="friend-item"><span>2. 👤 Player2</span> <span>300 pts</span></div>
            <div class="friend-item"><span>3. 👤 Player3</span> <span>100 pts</span></div>
        `;
    });
}

async function nextLevel() {
    document.getElementById('levelComplete').style.display = 'none';
    
    gameState.levelsData[gameState.currentLevel - 1].missions[gameState.currentMission - 1].completed = true;
    gameState.totalScore += 100;
    saveScoreToDatabase(gameState.totalScore);

    if (gameState.currentMission < 10) {
        gameState.currentMission++;
    } else if (gameState.currentLevel < 10) {
        gameState.currentLevel++;
        gameState.currentMission = 1;
        // Load new puzzles for the next level
        showLoadingSpinner(translations[currentLanguage].aiGeneratingWords || "Creating new puzzles...");
        await fetchWordPuzzlesFromAI();
        hideLoadingSpinner();
    } else {
        alert('Congratulations! You completed all levels!');
        backToMenu();
        return;
    }
    
    document.getElementById('currentLevel').textContent = gameState.currentLevel;
    document.getElementById('currentMission').textContent = gameState.currentMission;
    document.getElementById('mapContainer').style.display = 'flex'; // use flex
    document.getElementById('wordGameContainer').style.display = 'none';
    resizeCanvas(mapCanvas);
    drawMap();
}

function backToMenu() {
    document.getElementById('mapContainer').style.display = 'none';
    document.getElementById('raceContainer').style.display = 'none';
    document.getElementById('wordGameContainer').style.display = 'none';
    document.getElementById('leaderboard').style.display = 'none';
    document.getElementById('levelComplete').style.display = 'none';
    document.getElementById('gameOverPanel').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'flex';
    
    raceState.racing = false;
    isPaused = false;
}

// --- Quiz & Answer Handling (for Race) ---

function showQuestion(mode) {
    // Get question from the pre-fetched list
    const q = gameSession.currentRaceQuestions[raceState.questionCount];
    if (!q) {
        console.error("Out of questions!");
        raceState.racing = false;
        backToMenu();
        return;
    }

    document.getElementById('quizQuestion').textContent = q.q;
    const answersDiv = document.getElementById('quizAnswers');
    answersDiv.innerHTML = '';
    q.a.forEach((ans, idx) => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = ans;
        btn.onclick = () => handleAnswer(idx, q.correct, mode, q.topic);
        answersDiv.appendChild(btn);
    });
    document.getElementById('quizPanel').style.display = 'block';
}

function handleAnswer(selected, correct, mode, topic) {
    const buttons = document.querySelectorAll('.answer-btn');
    const isCorrect = selected === correct;
    
    // Update player stats
    if (topic && gameSession.playerStats[topic]) {
        isCorrect ? gameSession.playerStats[topic].correct++ : gameSession.playerStats[topic].wrong++;
    } else {
        // Fallback for untracked topics
        isCorrect ? gameSession.playerStats.science.correct++ : gameSession.playerStats.science.wrong++;
    }
    
    buttons[selected].className += isCorrect ? ' correct' : ' wrong';
    if(selected !== correct) {
        buttons[correct].className += ' correct';
    }

    soundEnabled && (isCorrect ? sounds.correct() : sounds.wrong());

    setTimeout(() => {
        document.getElementById('quizPanel').style.display = 'none';
        if (mode === 'race') {
            isCorrect ? raceState.playerPos += 80 : raceState.playerPos += 20;
            Math.random() > 0.3 ? raceState.aiPos += 80 : raceState.aiPos += 20;
            
            raceState.questionCount++;
            document.getElementById('raceProgress').textContent = raceState.questionCount;

            if (raceState.questionCount >= gameSession.currentRaceQuestions.length) {
                raceState.racing = false;
                raceState.playerPos > raceState.aiPos ? alert('🏆 You won!') : alert('Try again!');
                backToMenu();
            } else {
                setTimeout(() => showQuestion('race'), 1500);
            }
        }
    }, 1500);
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
function toggleSound() {
    soundEnabled = !soundEnabled;
    document.querySelector('.sound-toggle').textContent = soundEnabled ? '🔊' : '🔇';
    if (!soundEnabled && bgMusic) {
        bgMusic.stop();
        bgMusic = null;
    } else if (soundEnabled && !bgMusic) {
        playBackgroundMusic();
    }
}

// --- Database Placeholder Function ---
function saveScoreToDatabase(score) {
    console.log(`Attempting to save score: ${score} for player: ${playerName}`);
    /*
    fetch(DB_CONFIG.SCORE_POST_URL, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer 'A' + DB_CONFIG.API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            playerName: playerName,
            score: score,
            playerCode: playerCode
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
    // You might want to adjust the bgMusic gain here dynamically
    if (bgMusic && audioContext) {
        // This is a bit complex, gain nodes should be used.
        // For simplicity, we'll just restart it.
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

// Map click/touch listener
mapCanvas.addEventListener('touchstart', handleMapTouch);
mapCanvas.addEventListener('click', handleMapTouch);

function handleMapTouch(e) {
    if (isPaused || character.moving) return;
    e.preventDefault();
    const rect = mapCanvas.getBoundingClientRect();
    const scaleX = mapCanvas.width / rect.width;
    const scaleY = mapCanvas.height / rect.height;
    let clickX, clickY;
    if (e.type === 'touchstart') {
        clickX = (e.touches[0].clientX - rect.left) * scaleX;
        clickY = (e.touches[0].clientY - rect.top) * scaleY;
    } else {
        clickX = (e.clientX - rect.left) * scaleX;
        clickY = (e.clientY - rect.top) * scaleY;
    }
    
    // Convert click to base 1200x600 coordinates
    const baseClickX = (clickX / mapCanvas.width) * 1200;
    const baseClickY = (clickY / mapCanvas.height) * 600;

    const mission = gameState.levelsData[gameState.currentLevel - 1].missions[gameState.currentMission - 1];
    if (!mission) return;

    const dx = baseClickX - mission.x, dy = baseClickY - mission.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const missionRadius = 25; // Base coordinate radius
    if (dist < missionRadius) {
        character.targetX = mission.x;
        character.targetY = mission.y;
        character.moving = true;
    }
}

// --- Canvas Resizing ---
function resizeCanvas(canvas) {
    const container = canvas.parentElement;
    if (!container) return;
    
    // Check if container is visible
    if(container.offsetWidth === 0 || container.offsetHeight === 0) return;

    // Set canvas logical size to its display size
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
}

// Resize all canvases when window changes
window.addEventListener('resize', () => {
    if (document.getElementById('mapContainer').style.display === 'flex') {
        resizeCanvas(mapCanvas);
        drawMap(); // Redraw map
    }
    if (document.getElementById('raceContainer').style.display === 'flex') {
        resizeCanvas(raceCanvas);
        // drawRace() is called by its own loop, no need to call here
    }
});


// --- Game Initialization ---
function simulateLoading() {
    let progress = 0;
    const bar = document.getElementById('loadingBar');
    const text = document.getElementById('loadingText');
    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress > 100) progress = 100;
        bar.style.width = progress + '%';
        text.textContent = `Loading... ${Math.round(progress)}%`;
        
        if (progress === 100) {
            clearInterval(interval);
            setTimeout(() => {
                const loadingScreen = document.getElementById('loadingScreen');
                loadingScreen.style.opacity = '0';
                loadingScreen.addEventListener('transitionend', () => {
                    loadingScreen.style.display = 'none';
                });
                document.getElementById('mainMenu').style.display = 'flex';
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
        document.getElementById('playerNameInput').value = playerName;
    }
    const savedFriends = localStorage.getItem('drweee_friends');
    if (savedFriends) {
        try {
            friends = JSON.parse(savedFriends);
        } catch (e) {
            console.error("Could not parse friends list", e);
            friends = [];
        }
    }
    
    playerCode = generatePlayerCode();
    document.getElementById('musicVolume').value = musicVolume * 100;
    document.getElementById('sfxVolume').value = sfxVolume * 100;
    
    initSettings(); // Setup backgrounds
    updateTranslations();
    simulateLoading();
};
