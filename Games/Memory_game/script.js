// Galaxias expandidas para niveles
const galaxyThemes = [
    // Nivel 1
    { name: 'Vía Láctea', color: '#34495e', level: 1 },
    { name: 'Andrómeda', color: '#d35400', level: 1 },
    { name: 'Triangulum', color: '#8e44ad', level: 1 },
    { name: 'Sombrero', color: '#c0392b', level: 1 },
    { name: 'Remolino', color: '#2ecc71', level: 1 },
    
    // Nivel 2
    { name: 'Centaurus A', color: '#e74c3c', level: 2 },
    { name: 'Gran Nube de Magallanes', color: '#9b59b6', level: 2 },
    { name: 'Pequeña Nube de Magallanes', color: '#1abc9c', level: 2 },
    { name: 'NGC 1300', color: '#3498db', level: 2 },
    { name: 'Galaxia del Cigarro', color: '#f39c12', level: 2 },
    
    // Nivel 3
    { name: 'Galaxia del Molinete', color: '#2980b9', level: 3 },
    { name: 'Galaxia del Girasol', color: '#f1c40f', level: 3 },
    { name: 'Galaxia Antena', color: '#7f8c8d', level: 3 },
    { name: 'Galaxia del Ojo Negro', color: '#2c3e50', level: 3 },
    { name: 'Galaxia del Cartwheel', color: '#16a085', level: 3 },
    
    // Nivel 4
    { name: 'Galaxia Burbuja', color: '#27ae60', level: 4 },
    { name: 'Galaxia Bailarina', color: '#c39bd3', level: 4 },
    { name: 'Galaxia del Cometa', color: '#f5b041', level: 4 },
    { name: 'Galaxia del Ratón', color: '#cb4335', level: 4 },
    { name: 'Galaxia Mariposa', color: '#3498db', level: 4 }
];

let cards = [];
let hasFlippedCard = false;
let lockBoard = false;
let firstCard, secondCard;
let moves = 0;
let matches = 0;
let gameStarted = false;
let gameTime = 0;
let gameTimer;
let totalPairs = 8; // Default for medium difficulty

// Variables para el sistema de niveles
let currentLevel = 1;
let currentXP = 0;
let neededXP = 100;

// Variables para el modo contrarreloj
let timedMode = false;
let timeLimit = 60; // segundos
let timeRemaining = timeLimit;
let timeCountdown;

// Variables para el sistema de sonido
let soundEnabled = true;
let lastTimerWarningPlayed = 0;

// DOM references
const gameBoard = document.getElementById('memory-game');
const movesDisplay = document.getElementById('moves');
const matchesDisplay = document.getElementById('matches');
const timeDisplay = document.getElementById('time');
const restartBtn = document.getElementById('restart-btn');
const difficultySelect = document.getElementById('difficulty');
const winModal = document.getElementById('win-modal');
const finalScoreDisplay = document.getElementById('final-score');
const starsDisplay = document.getElementById('stars');
const playAgainBtn = document.getElementById('play-again-btn');

// Referencias para el sistema de niveles
const levelDisplay = document.getElementById('current-level');
const currentXPDisplay = document.getElementById('current-xp');
const neededXPDisplay = document.getElementById('needed-xp');
const xpProgressBar = document.getElementById('xp-progress');
const xpGainedDisplay = document.getElementById('xp-gained');

// Referencias para el modo contrarreloj
const normalModeBtn = document.getElementById('normal-mode-btn');
const timedModeBtn = document.getElementById('timed-mode-btn');
const countdownDisplay = document.getElementById('countdown');
const timeBarContainer = document.getElementById('time-bar-container');
const timeBar = document.getElementById('time-bar');
const timeUpModal = document.getElementById('time-up-modal');
const pairsFoundDisplay = document.getElementById('pairs-found');
const totalPairsTimedDisplay = document.getElementById('total-pairs-timed');
const xpGainedTimedDisplay = document.getElementById('xp-gained-timed');
const tryAgainBtn = document.getElementById('try-again-btn');

// Initialize the game
function initGame() {
    resetGame();
    let difficulty = difficultySelect.value;
    
    // Set up grid and pairs based on difficulty
    let gridCols, gridRows, cardCount;
    
    if (difficulty === 'easy') {
        gridCols = 4;
        gridRows = 2;
        cardCount = 8;
        totalPairs = 4;
        gameBoard.style.gridTemplateColumns = 'repeat(4, 1fr)';
        if (timedMode) timeLimit = 45; // Menos tiempo para fácil
    } else if (difficulty === 'medium') {
        gridCols = 4;
        gridRows = 4;
        cardCount = 16;
        totalPairs = 8;
        gameBoard.style.gridTemplateColumns = 'repeat(4, 1fr)';
        if (timedMode) timeLimit = 60; // Tiempo estándar para medio
    } else { // hard
        gridCols = 5;
        gridRows = 4;
        cardCount = 20;
        totalPairs = 10;
        gameBoard.style.gridTemplateColumns = 'repeat(5, 1fr)';
        if (timedMode) timeLimit = 75; // Más tiempo para difícil
    }
    
    // Actualizar el tiempo restante para modo contrarreloj
    timeRemaining = timeLimit;
    countdownDisplay.textContent = timeLimit;
    
    // Configurar UI para el modo seleccionado
    setupGameMode();
    
    // Create card pairs for the current level
    createCardPairs(cardCount/2);
    
    // Create card elements
    createCardElements();
    
    // Reset statistics displays
    matches = 0;
    matchesDisplay.textContent = '0';
    
    // Actualizar la visualización de niveles
    updateLevelInfo();
}

// Cambiar entre modos de juego
function setupGameMode() {
    if (timedMode) {
        timeBarContainer.style.display = 'block';
        countdownDisplay.style.display = 'block';
        timeBar.style.width = '100%';
        
        // Actualizar displays para el modo contrarreloj
        totalPairsTimedDisplay.textContent = totalPairs;
    } else {
        timeBarContainer.style.display = 'none';
        countdownDisplay.style.display = 'none';
    }
}

// Actualizar la información de nivel y XP
function updateLevelInfo() {
    levelDisplay.textContent = currentLevel;
    currentXPDisplay.textContent = currentXP;
    neededXPDisplay.textContent = neededXP;
    
    // Actualizar barra de progreso
    const progressPercent = (currentXP / neededXP) * 100;
    xpProgressBar.style.width = `${progressPercent}%`;
}

// Create card pairs based on count and level
function createCardPairs(pairCount) {
    cards = [];
    
    // Filtrar galaxias por nivel actual y anteriores
    const availableThemes = galaxyThemes.filter(theme => theme.level <= currentLevel);

    // Asegurar que tenemos suficientes temas disponibles
if (availableThemes.length < pairCount) {
console.warn("No hay suficientes temas de galaxias disponibles para este nivel");
// Usar temas repetidos si es necesario
}
    
    // Obtener temas aleatorios
    let selectedThemes = [];
const shuffledThemes = [...availableThemes].sort(() => 0.5 - Math.random());

// Asegurar que tenemos exactamente el número de pares requerido
for (let i = 0; i < pairCount; i++) {
selectedThemes.push(shuffledThemes[i % shuffledThemes.length]);
}
    
    // Create pairs
    selectedThemes.forEach((theme, index) => {
        cards.push({
            id: index * 2,
            name: theme.name,
            color: theme.color,
            matched: false,
            level: theme.level
        });
        
        cards.push({
            id: index * 2 + 1,
            name: theme.name,
            color: theme.color,
            matched: false,
            level: theme.level
        });
    });
    
    // Shuffle cards
    cards.sort(() => 0.5 - Math.random());

    // Verificación de depuración
console.log(`Creados ${cards.length} cartas (${pairCount} pares)`);
}

// Create card elements and add to the game board
function createCardElements() {
    gameBoard.innerHTML = '';
    
    cards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('memory-card');
        cardElement.dataset.name = card.name;
        cardElement.dataset.id = card.id;
        cardElement.dataset.level = card.level;
        
        const frontFace = document.createElement('div');
        frontFace.classList.add('front-face');
        frontFace.style.backgroundColor = card.color;
        
        // Create a galaxy pattern unique to each card theme
        const galaxyPattern = document.createElement('div');
        galaxyPattern.classList.add('galaxy-pattern');
        frontFace.appendChild(galaxyPattern);
        
        const cardName = document.createElement('div');
        cardName.textContent = card.name;
        cardName.style.position = 'absolute';
        cardName.style.bottom = '10px';
        cardName.style.fontSize = '0.8rem';
        cardName.style.fontWeight = 'bold';
        cardName.style.textShadow = '0 0 5px rgba(0, 0, 0, 0.5)';
        frontFace.appendChild(cardName);
        
        // Añadir indicador de nivel
        const levelIndicator = document.createElement('div');
        levelIndicator.textContent = `N${card.level}`;
        levelIndicator.style.position = 'absolute';
        levelIndicator.style.top = '5px';
        levelIndicator.style.right = '5px';
        levelIndicator.style.fontSize = '0.7rem';
        levelIndicator.style.padding = '2px 5px';
        levelIndicator.style.backgroundColor = 'rgba(0,0,0,0.5)';
        levelIndicator.style.borderRadius = '10px';
        frontFace.appendChild(levelIndicator);
        
        const backFace = document.createElement('div');
        backFace.classList.add('back-face');
        
        cardElement.appendChild(frontFace);
        cardElement.appendChild(backFace);
        
        cardElement.addEventListener('click', flipCard);
        
        gameBoard.appendChild(cardElement);
    });
}

// Flip card event handler
function flipCard() {
    if (lockBoard) return;
    if (this === firstCard) return;
    
    // Start the timer on first card flip
    if (!gameStarted) {
        startTimer();
        gameStarted = true;
        
        // Iniciar contador para el modo contrarreloj
        if (timedMode) {
            startCountdown();
        }
    }
    
    this.classList.add('flip');
    playSound('flip-sound');

    
    if (!hasFlippedCard) {
        // First card flipped
        hasFlippedCard = true;
        firstCard = this;
        return;
    }
    
    // Second card flipped
    secondCard = this;
    checkForMatch();
}

// Check if the two flipped cards match
function checkForMatch() {
    moves++;
    movesDisplay.textContent = moves;
    
    const isMatch = firstCard.dataset.name === secondCard.dataset.name;
    
    if (isMatch) {
        matches++;
        matchesDisplay.textContent = matches;
        
        disableCards();
        playSound('match-sound');
        createParticles(firstCard);
        createParticles(secondCard);
        
        // Find and update the matched status of the cards
        const firstCardId = parseInt(firstCard.dataset.id);
        const secondCardId = parseInt(secondCard.dataset.id);
        
        const firstCardObj = cards.find(card => card.id === firstCardId);
        const secondCardObj = cards.find(card => card.id === secondCardId);
        
        firstCardObj.matched = true;
        secondCardObj.matched = true;
        
        // Check if all pairs are matched
        if (matches === totalPairs) {
            endGame(true);
        }
    } else {
        unflipCards();
    }
}

// Disable matched cards
function disableCards() {
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);
    
    resetBoard();
}

// Unflip unmatched cards
function unflipCards() {
    lockBoard = true;
    
    setTimeout(() => {
        firstCard.classList.remove('flip');
        secondCard.classList.remove('flip');
        
        resetBoard();
    }, 1000);
}

// Reset board after each turn
function resetBoard() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
}

// Reset the game completely
function resetGame() {
    // Clear previous game state
    clearInterval(gameTimer);
    clearInterval(timeCountdown);
    gameStarted = false;
    gameTime = 0;
    moves = 0;
    matches = 0;
    
    // Update displays
    timeDisplay.textContent = '00:00';
    movesDisplay.textContent = '0';
    matchesDisplay.textContent = '0';
    
    resetBoard();
}

// Start the game timer
function startTimer() {
    const startTime = Date.now() - gameTime;
    
    gameTimer = setInterval(() => {
        gameTime = Date.now() - startTime;
        updateTimeDisplay();
    }, 1000);
}

// Update the time display
function updateTimeDisplay() {
    const minutes = Math.floor(gameTime / 60000);
    const seconds = Math.floor((gameTime % 60000) / 1000);
    
    timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Iniciar cuenta regresiva para el modo contrarreloj
function startCountdown() {
    timeRemaining = timeLimit;
    timeBar.style.width = '100%';
    countdownDisplay.textContent = timeRemaining;
    
    timeCountdown = setInterval(() => {
        timeRemaining--;
        countdownDisplay.textContent = timeRemaining;
        
        // Actualizar la barra de tiempo
        const percentRemaining = (timeRemaining / timeLimit) * 100;
        timeBar.style.width = `${percentRemaining}%`;
        
        // Añadir efecto visual cuando quede poco tiempo
        if (timeRemaining <= 10) {
            timeBar.classList.add('time-warning');
            countdownDisplay.classList.add('time-warning');
            
            // Reproducir sonido de advertencia cada 2 segundos
            if (timeRemaining % 2 === 0) {
                playSound('time-warning-sound');
            }
        }
        
        // Comprobar si se acabó el tiempo
        if (timeRemaining <= 0) {
            clearInterval(timeCountdown); // Detener el contador
            endGame(false);
        }
    }, 1000);
}

// End the game when all pairs are found or time is up
function endGame(isWin) {
    // Detener AMBOS temporizadores
    clearInterval(gameTimer);
    clearInterval(timeCountdown);

    if (isWin) {
        playSound('success-sound');
    } else {
        playSound('fail-sound');
    }
    
    if (isWin) {
        // Calculate score based on moves and time
        const timeScore = timedMode ? 
            Math.max(100 - Math.floor((timeLimit - timeRemaining) / timeLimit * 50), 50) : 
            Math.max(100 - Math.floor(gameTime / 1000), 0);
            
        const moveScore = Math.max(100 - (moves - totalPairs) * 5, 0);
        const totalScore = Math.floor((timeScore + moveScore) / 2);
        
        finalScoreDisplay.textContent = totalScore;
        
        // Determine star rating
        let stars;
        if (totalScore >= 80) {
            stars = '★★★';
        } else if (totalScore >= 60) {
            stars = '★★☆';
        } else {
            stars = '★☆☆';
        }
        
        starsDisplay.textContent = stars;
        
        // Calcular XP ganada - más XP en modo contrarreloj
        let xpGained = Math.floor(totalScore * (currentLevel * 0.5));
        if (timedMode) xpGained = Math.floor(xpGained * 1.5);
        
        // Añadir la XP al total
        addExperience(xpGained);
        xpGainedDisplay.textContent = xpGained;
        
        // Show the win modal with a slight delay
        setTimeout(() => {
            winModal.classList.add('show');
        }, 500);
    } else {
        // Juego perdido por tiempo
        pairsFoundDisplay.textContent = matches;
        
        // Calcular XP ganada por pares encontrados
        let xpGained = Math.floor(matches * 5 * currentLevel);
        addExperience(xpGained);
        xpGainedTimedDisplay.textContent = xpGained;
        
        setTimeout(() => {
            timeUpModal.classList.add('show');
        }, 500);
    }
}

// Añadir experiencia y subir de nivel si corresponde
function addExperience(xp) {
    currentXP += xp;
    
    // Comprobar si subimos de nivel
    if (currentXP >= neededXP && currentLevel < 4) {
        levelUp();
    }
    
    updateLevelInfo();
}

// Subir de nivel
function levelUp() {
    playSound('level-up-sound');
    currentLevel++;
    currentXP = currentXP - neededXP;
    neededXP = Math.floor(neededXP * 1.5);
    
    // Mostrar animación de subida de nivel
    const levelUpEffect = document.createElement('div');
    levelUpEffect.classList.add('level-up-animation');
    
    const levelUpText = document.createElement('div');
    levelUpText.classList.add('level-up-text');
    levelUpText.textContent = `¡NIVEL ${currentLevel}!`;
    
    levelUpEffect.appendChild(levelUpText);
    document.body.appendChild(levelUpEffect);
    
    // Eliminar el efecto después de la animación
    setTimeout(() => {
        levelUpEffect.remove();
    }, 2000);
}

// Create particle effects for matches
function createParticles(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Random size between 5 and 10 pixels
        const size = Math.random() * 5 + 5;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Position at the center of the card
        particle.style.left = `${centerX}px`;
        particle.style.top = `${centerY}px`;
        
        // Random color based on card color
        const cardColor = element.querySelector('.front-face').style.backgroundColor;
        particle.style.backgroundColor = cardColor;
        
        // Random animation duration between 0.5 and 1.5 seconds
        const duration = Math.random() + 0.5;
        particle.style.animation = `float ${duration}s ease-out forwards`;
        
        document.body.appendChild(particle);
        
        // Remove particle after animation completes
        setTimeout(() => {
            particle.remove();
        }, duration * 1000);
    }
}

// Cambiar modos de juego
function switchGameMode(mode) {
    if (mode === 'normal') {
        timedMode = false;
        normalModeBtn.classList.add('active');
        timedModeBtn.classList.remove('active');
    } else {
        timedMode = true;
        normalModeBtn.classList.remove('active');
        timedModeBtn.classList.add('active');
    }
    
    // Reiniciar el juego con el nuevo modo
    initGame();
}

// Función para reproducir sonidos
function playSound(soundId) {
    if (!soundEnabled) return;

const sound = document.getElementById(soundId);
    if (sound) {
sound.currentTime = 0; // Reiniciar el sonido
sound.play().catch(error => {
console.log("Error reproduciendo sonido:", error);
});
}
}

// Event listeners
restartBtn.addEventListener('click', initGame);
difficultySelect.addEventListener('change', initGame);
playAgainBtn.addEventListener('click', () => {
    winModal.classList.remove('show');
    initGame();
});
tryAgainBtn.addEventListener('click', () => {
    timeUpModal.classList.remove('show');
    initGame();
});

// Event listeners para modos de juego
normalModeBtn.addEventListener('click', () => switchGameMode('normal'));
timedModeBtn.addEventListener('click', () => switchGameMode('timed'));

// Initialize the game on load
window.addEventListener('load', () => {
    // Cargar nivel guardado si existe
    const savedLevel = localStorage.getItem('memoramaLevel');
    const savedXP = localStorage.getItem('memoramaXP');
    const savedNeededXP = localStorage.getItem('memoramaNeededXP');
    
    if (savedLevel) {
        currentLevel = parseInt(savedLevel);
        currentXP = savedXP ? parseInt(savedXP) : 0;
        neededXP = savedNeededXP ? parseInt(savedNeededXP) : 100;
    }

    const savedSoundPreference = localStorage.getItem('memoramaSoundEnabled');
        if (savedSoundPreference !== null) {
    soundEnabled = savedSoundPreference === 'true';
    document.getElementById('sound-icon').textContent = soundEnabled ? '🔊' : '🔇';
    }
    
    updateLevelInfo();
    initGame();
});

// Guardar progreso cuando se cierra la página
window.addEventListener('beforeunload', () => {
    localStorage.setItem('memoramaLevel', currentLevel);
    localStorage.setItem('memoramaXP', currentXP);
    localStorage.setItem('memoramaNeededXP', neededXP);
});

// Event listener para el botón de sonido
document.getElementById('sound-toggle-btn').addEventListener('click', () => {
soundEnabled = !soundEnabled;
document.getElementById('sound-icon').textContent = soundEnabled ? '🔊' : '🔇';

// Guardar preferencia
localStorage.setItem('memoramaSoundEnabled', soundEnabled);
});