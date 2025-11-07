document.addEventListener('DOMContentLoaded', () => {
    const player = document.getElementById('player');
    const platforms = document.querySelectorAll('.platform');
    const goal = document.getElementById('goal-star');
    const winMessage = document.getElementById('win-message');
    const gameContainer = document.getElementById('game-container');
    const knowledgeGate = document.getElementById('knowledge-gate');
    const quizModal = document.getElementById('quiz-modal');
    const quizQuestion = document.getElementById('quiz-question');
    const quizAnswers = document.getElementById('quiz-answers');
    let isQuizActive = false;
    const gateQuestion = {
        question: "Which planet is closest to the Sun?",
        answers: ["Venus", "Earth", "Mercury", "Mars"],
        correct: 2
    };
    let playerPos = { x: 50, y: 390 };
    let playerVel = { x: 0, y: 0 };
    const speed = 5, jumpStrength = 15, gravity = 0.8;
    let isOnGround = false;
    const keys = { right: false, left: false };

    function gameLoop() {
        if (isQuizActive) { requestAnimationFrame(gameLoop); return; }
        playerVel.y += gravity;
        playerVel.x = 0;
        if (keys.right) playerVel.x = speed;
        if (keys.left) playerVel.x = -speed;
        playerPos.x += playerVel.x;
        playerPos.y += playerVel.y;
        isOnGround = false;
        platforms.forEach(p => {
            const pRect = p.getBoundingClientRect(), playerRect = player.getBoundingClientRect();
            if (playerPos.x + playerRect.width > pRect.left - gameContainer.offsetLeft && playerPos.x < pRect.right - gameContainer.offsetLeft && playerPos.y + playerRect.height > pRect.top - gameContainer.offsetTop && playerPos.y < pRect.top - gameContainer.offsetTop) {
                playerVel.y = 0; playerPos.y = pRect.top - gameContainer.offsetTop - playerRect.height; isOnGround = true;
            }
        });
        if (knowledgeGate.style.display !== 'none') {
            const gateRect = knowledgeGate.getBoundingClientRect();
            if (playerPos.x < gateRect.right - gameContainer.offsetLeft && playerPos.x + 40 > gateRect.left - gameContainer.offsetLeft && playerPos.y < gateRect.bottom - gameContainer.offsetTop && playerPos.y + 60 > gateRect.top - gameContainer.offsetTop) {
                triggerQuiz();
            }
        }
        const goalRect = goal.getBoundingClientRect();
        if (playerPos.x < goalRect.right - gameContainer.offsetLeft && playerPos.x + 40 > goalRect.left - gameContainer.offsetLeft && playerPos.y < goalRect.bottom - gameContainer.offsetTop && playerPos.y + 60 > goalRect.top - gameContainer.offsetTop) {
            goal.style.display = 'none'; winMessage.style.display = 'block'; return;
        }
        player.style.left = playerPos.x + 'px';
        player.style.top = playerPos.y + 'px';
        requestAnimationFrame(gameLoop);
    }
    function triggerQuiz() {
        isQuizActive = true; quizModal.style.display = 'flex'; quizQuestion.textContent = gateQuestion.question; quizAnswers.innerHTML = '';
        gateQuestion.answers.forEach((answer, index) => {
            const button = document.createElement('button');
            button.textContent = answer; button.className = 'quiz-answer'; button.onclick = () => checkAnswer(index);
            quizAnswers.appendChild(button);
        });
    }
    function checkAnswer(selectedIndex) {
        quizModal.style.display = 'none';
        if (selectedIndex === gateQuestion.correct) {
            playCorrectSound();
            knowledgeGate.style.display = 'none';
        } else {
            playWrongSound();
            playerPos.x -= 30;
        }
        isQuizActive = false;
    }
    window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') keys.right = true;
        if (e.key === 'ArrowLeft') keys.left = true;
        if (e.key === ' ' && isOnGround) { playerVel.y = -jumpStrength; isOnGround = false; }
    });
    window.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowRight') keys.right = false;
        if (e.key === 'ArrowLeft') keys.left = false;
    });
    gameLoop();
});