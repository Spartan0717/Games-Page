// Get DOM elements
const gameContainer = document.querySelector(".container");
const userResult = document.querySelector(".user_result img");
const botResult = document.querySelector(".bot_result img");
const result = document.querySelector(".result");
const optionImages = document.querySelectorAll(".option_image");
let playerScoreElement = document.getElementById("player-score");
let computerScoreElement = document.getElementById("computer-score");
const resetButton = document.querySelector(".reset-btn");
const settingsButton = document.querySelector(".settings-btn");
const highscoreButton = document.querySelector(".highscore-btn");
const helpButton = document.querySelector(".help-btn");
const currentRoundElement = document.getElementById("current-round");
const totalRoundsElement = document.getElementById("total-rounds");
const soundToggle = document.getElementById("sound-toggle");
const difficultyLevelElement = document.getElementById("difficulty-level");
const player1Label = document.getElementById("player1-label");
const player2Label = document.getElementById("player2-label");

// Modal elements
const settingsModal = document.getElementById("settings-modal");
const highscoresModal = document.getElementById("highscores-modal");
const helpModal = document.getElementById("help-modal");
const saveSettingsButton = document.getElementById("save-settings");
const closeSettingsButton = document.getElementById("close-settings");
const closeHighscoresButton = document.getElementById("close-highscores");
const closeHelpButton = document.getElementById("close-help");
const clearHighscoresButton = document.getElementById("clear-highscores");
const roundsSelect = document.getElementById("rounds");
const playerNameInput = document.getElementById("player-name");
const difficultySelect = document.getElementById("difficulty");
const highscoresBody = document.getElementById("highscores-body");

// Tab elements
const tabs = document.querySelectorAll(".tab");
const tabContents = document.querySelectorAll(".tab-content");

// Sonidos
const sounds = {
    click: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-plastic-bubble-click-1124.mp3'),
    win: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3'),
    lose: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3'),
    draw: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.mp3'),
    gameOver: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-completion-of-a-level-2063.mp3')
};

// Variables para el juego
let playerScore = 0;
let computerScore = 0;
let currentRound = 1;
let totalRounds = 5;
let playerName = "Jugador";
let soundEnabled = true;
let gameActive = true;
let difficulty = "normal"; // easy, normal, hard

// Historial de elecciones del jugador (para IA en modo difícil)
let playerChoiceHistory = [];

// Define possible outcomes
const outcomes = {
    "00": "Empate",
    "01": "BOT",
    "02": "TÚ",
    "10": "TÚ",
    "11": "Empate",
    "12": "BOT",
    "20": "BOT",
    "21": "TÚ",
    "22": "Empate"
};

// Rutas de las imágenes
const images = ["./images/rock.png", "./images/paper.png", "./images/scissors.png"];

// HTML del loader con el gato
const loaderHTML = `
<div class="loader-container" id="loader-container">
    <p class="loading-text">Cargando</p>
    <div class="cat">
      <div class="cat__segment"></div>
      <div class="cat__segment"></div>
      <div class="cat__segment"></div>
      <div class="cat__segment"></div>
      <div class="cat__segment"></div>
      <div class="cat__segment"></div>
      <div class="cat__segment"></div>
      <div class="cat__segment"></div>
      <div class="cat__segment"></div>
      <div class="cat__segment"></div>
      <div class="cat__segment"></div>
      <div class="cat__segment"></div>
      <div class="cat__segment"></div>
      <div class="cat__segment"></div>
      <div class="cat__segment"></div>
      <div class="cat__segment"></div>
      <div class="cat__segment"></div>
      <div class="cat__segment"></div>
      <div class="cat__segment"></div>
      <div class="cat__segment"></div>
      <div class="cat__segment"></div>
      <div class="cat__segment"></div>
      <div class="cat__segment"></div>
      <div class="cat__segment"></div>
      <div class="cat__segment"></div>
      <div class="cat__segment"></div>
      <div class="cat__segment"></div>
      <div class="cat__segment"></div>
      <div class="cat__segment"></div>
      <div class="cat__segment"></div>
    </div>
        <p class="copyright-text">© 2025 - González Juárez Rodrigo Eduardo - Todos los derechos reservados</p>
</div>
`;

// Función para insertar el HTML del loader
function insertLoaderHTML() {
    // Crea un div temporal para contener el HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = loaderHTML;
    
    // Inserta el loader al principio del body
    document.body.insertBefore(tempDiv.firstElementChild, document.body.firstChild);
}

// Función para ocultar el loader
function hideLoader() {
    const loaderContainer = document.getElementById('loader-container');
    if (loaderContainer) {
        loaderContainer.classList.add('hidden');
        
        // Eliminar el loader después de la transición
        setTimeout(() => {
            if (loaderContainer && loaderContainer.parentNode) {
                loaderContainer.parentNode.removeChild(loaderContainer);
            }
        }, 500); // Tiempo para que termine la transición de opacidad
    }
}

// Function to play sound
function playSound(soundName) {
    if (soundEnabled) {
        sounds[soundName].currentTime = 0;
        sounds[soundName].play().catch(e => console.log("Error playing sound:", e));
    }
}

// Function to make bot choice based on difficulty
function getBotChoice() {
    // Easy mode: completely random
    if (difficulty === "easy") {
        return Math.floor(Math.random() * 3);
    }
    
    // Normal mode: mostly random but slightly smarter
    if (difficulty === "normal") {
        if (Math.random() < 0.8) {
            // 80% random
            return Math.floor(Math.random() * 3);
        } else {
            // 20% counter to most common player choice
            if (playerChoiceHistory.length > 0) {
                // Count occurrences of each choice
                let counts = [0, 0, 0];
                playerChoiceHistory.forEach(choice => {
                    counts[choice]++;
                });
                
                // Find most common choice
                let mostCommonChoice = counts.indexOf(Math.max(...counts));
                
                // Return counter (rock beats scissors, scissors beats paper, paper beats rock)
                return (mostCommonChoice + 1) % 3;
            }
            return Math.floor(Math.random() * 3);
        }
    }
    
    // Hard mode: analyze patterns and counter
    if (difficulty === "hard") {
        if (playerChoiceHistory.length < 3) {
            return Math.floor(Math.random() * 3);
        }
        
        // Get last 3 choices
        const lastChoices = playerChoiceHistory.slice(-3);
        
        // Look for patterns in past choices
        if (lastChoices[0] === lastChoices[1] && lastChoices[1] === lastChoices[2]) {
            // Player repeats same choice 3 times - high chance they'll continue
            // Return counter move
            return (lastChoices[0] + 1) % 3;
        }
        
        // Look for rotation patterns (0,1,2 or 2,1,0)
        if ((lastChoices[0] + 1) % 3 === lastChoices[1] && 
            (lastChoices[1] + 1) % 3 === lastChoices[2]) {
            // Predict next in sequence and counter it
            return (lastChoices[2] + 2) % 3;
        }
        
        // Analyze recent choices frequency
        let recentChoices = playerChoiceHistory.slice(-5);
        let counts = [0, 0, 0];
        recentChoices.forEach(choice => {
            counts[choice]++;
        });
        
        // Find most common recent choice
        let mostLikelyChoice = counts.indexOf(Math.max(...counts));
        
        // 70% chance to counter most likely choice, 30% random
        if (Math.random() < 0.7) {
            return (mostLikelyChoice + 1) % 3;
        } else {
            return Math.floor(Math.random() * 3);
        }
    }
    
    // Default: random
    return Math.floor(Math.random() * 3);
}

// Event handler for image click
function handleOptionClick(event) {
    if (!gameActive) return;
    
    playSound('click');
    
    const clickedImage = event.currentTarget;
    const clickedIndex = Array.from(optionImages).indexOf(clickedImage);
    
    // Solo modo un jugador
    handleSinglePlayerChoice(clickedIndex);
}

// Handle single player choice
function handleSinglePlayerChoice(clickedIndex) {
    // Reset results and display initial image
    userResult.src = "./images/rock.png";
    botResult.src = "./images/rock.png";
    result.textContent = "Espera...";

    // Activate clicked image and deactivate others
    optionImages.forEach((image, index) => {
        image.classList.toggle("active", index === clickedIndex);
    });

    gameContainer.classList.add("start");
    
    // Add player choice to history for AI learning
    playerChoiceHistory.push(clickedIndex);
    
    // Keep history at a reasonable size
    if (playerChoiceHistory.length > 20) {
        playerChoiceHistory.shift();
    }

    setTimeout(() => {
        gameContainer.classList.remove("start");

        // Set user image based on selection
        userResult.src = images[clickedIndex];

        // Bot selects based on difficulty
        const botChoice = getBotChoice();
        botResult.src = images[botChoice];

        // Determine the result
        const outcomeKey = clickedIndex.toString() + botChoice.toString();
        const outcome = outcomes[outcomeKey] || "Desconocido";

        // Update score
        if (outcome === "TÚ") {
            playerScore++;
            playerScoreElement.textContent = playerScore;
            playSound('win');
        } else if (outcome === "BOT") {
            computerScore++;
            computerScoreElement.textContent = computerScore;
            playSound('lose');
        } else {
            playSound('draw');
        }

        // Display the result
        if (clickedIndex === botChoice) {
            result.textContent = "¡Empate!";
        } else {
            result.textContent = `¡${outcome} GANA!`;
        }
        
        // Check if the round is complete
        checkRoundCompletion();
        
    }, 2500);
}

// Función corregida para verificar si la ronda está completa y si el juego ha terminado
function checkRoundCompletion() {
    // Verificar si se ha alcanzado el número máximo de rondas o si hay un ganador claro
    const winsNeeded = Math.ceil(totalRounds / 2);
    const remainingRounds = totalRounds - currentRound;
    
    // Verificar si alguien ya ganó suficientes rondas
    if (playerScore >= winsNeeded || computerScore >= winsNeeded) {
        gameActive = false;
        
        // Determinar el ganador
        let winner;
        if (playerScore > computerScore) {
            winner = playerName;
            result.textContent = `¡${winner} ha ganado el juego!`;
            
            // Guardar puntuación alta solo para modo un jugador y solo si el jugador gana
            saveHighScore();
        } else {
            winner = "La computadora";
            result.textContent = `¡${winner} ha ganado el juego!`;
        }
        
        playSound('gameOver');
    }
    // Verificar si ya no hay suficientes rondas restantes para que el perdedor pueda alcanzar al ganador
    else if (playerScore > computerScore + remainingRounds) {
        gameActive = false;
        result.textContent = `¡${playerName} ha ganado el juego!`;
        playSound('gameOver');
        saveHighScore();
    }
    else if (computerScore > playerScore + remainingRounds) {
        gameActive = false;
        result.textContent = `¡La computadora ha ganado el juego!`;
        playSound('gameOver');
    }
    // Si todavía no ha terminado el juego y no hemos alcanzado el total de rondas
    else if (currentRound < totalRounds) {
        // Incrementamos la ronda solo si el juego sigue activo
        currentRound++;
        currentRoundElement.textContent = currentRound;
    }
    // Si hemos llegado a la última ronda y hay empate
    else {
        gameActive = false;
        if (playerScore === computerScore) {
            result.textContent = "¡El juego ha terminado en empate!";
        } else if (playerScore > computerScore) {
            result.textContent = `¡${playerName} ha ganado el juego!`;
            saveHighScore();
        } else {
            result.textContent = "¡La computadora ha ganado el juego!";
        }
        playSound('gameOver');
    }
}

// Función corregida para restablecer el juego
function resetGame() {
    playerScore = 0;
    computerScore = 0;
    currentRound = 1;
    gameActive = true;
    playerChoiceHistory = [];
    
    // Restablecer la interfaz de usuario
    playerScoreElement.textContent = "0";
    computerScoreElement.textContent = "0";
    currentRoundElement.textContent = "1";
    totalRoundsElement.textContent = totalRounds;
    result.textContent = "¡Vamos a jugar!";
    
    // Quitar la clase "active" de las opciones
    optionImages.forEach(image => {
        image.classList.remove("active");
    });
    
    // Restablecer imágenes
    userResult.src = "./images/paper.png";
    botResult.src = "./images/paper.png";
}

// High Score functionality
function saveHighScore() {
    const highScores = JSON.parse(localStorage.getItem('rpsHighScores') || '[]');
    
    const newScore = {
        name: playerName,
        rounds: totalRounds,
        score: playerScore,
        difficulty: difficulty,
        date: new Date().toLocaleDateString()
    };
    
    highScores.push(newScore);
    
    // Sort by score (descending) and limit to top 10
    highScores.sort((a, b) => b.score - a.score);
    const topScores = highScores.slice(0, 10);
    
    localStorage.setItem('rpsHighScores', JSON.stringify(topScores));
}

function displayHighScores() {
    const highScores = JSON.parse(localStorage.getItem('rpsHighScores') || '[]');
    highscoresBody.innerHTML = '';
    
    if (highScores.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" style="text-align: center;">No hay puntuaciones guardadas</td>';
        highscoresBody.appendChild(row);
        return;
    }
    
    highScores.forEach(score => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${score.name}</td>
            <td>${score.rounds}</td>
            <td>${score.score}</td>
            <td>${getDifficultyInSpanish(score.difficulty)}</td>
            <td>${score.date}</td>
        `;
        highscoresBody.appendChild(row);
    });
}

function getDifficultyInSpanish(diff) {
    switch(diff) {
        case 'easy': return 'Fácil';
        case 'normal': return 'Normal';
        case 'hard': return 'Difícil';
        default: return diff;
    }
}

function clearHighScores() {
    if (confirm('¿Estás seguro de que quieres borrar todas las puntuaciones?')) {
        localStorage.removeItem('rpsHighScores');
        displayHighScores();
    }
}

// Settings functionality
function openSettingsModal() {
    settingsModal.style.display = 'flex';
    
    // Set current values
    roundsSelect.value = totalRounds;
    playerNameInput.value = playerName;
    difficultySelect.value = difficulty;
}

// Función corregida para guardar la configuración
function saveSettings() {
    const newTotalRounds = parseInt(roundsSelect.value);
    const newPlayerName = playerNameInput.value.trim() || "Jugador";
    const newDifficulty = difficultySelect.value;
    
    // Actualizar configuración del juego
    totalRounds = newTotalRounds;
    playerName = newPlayerName;
    difficulty = newDifficulty;
    
    // Actualizar la interfaz
    totalRoundsElement.textContent = totalRounds;
    difficultyLevelElement.textContent = getDifficultyInSpanish(difficulty);
    
    // Actualizar las etiquetas manteniendo los spans originales
    player1Label.textContent = `${playerName}: `;
    player1Label.appendChild(playerScoreElement);
    
    // Reiniciar el juego con la nueva configuración
    resetGame();
    
    // Cerrar modal
    settingsModal.style.display = 'none';
}

// Tab switching functionality
function switchTab(tabId) {
    // Remove active class from all tabs and contents
    tabs.forEach(tab => tab.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(`${tabId}-content`).classList.add('active');
}

// Sound toggle
function toggleSound() {
    soundEnabled = !soundEnabled;
    soundToggle.textContent = soundEnabled ? '🔊' : '🔇';
}

// Event listeners
optionImages.forEach(image => {
    image.addEventListener("click", handleOptionClick);
});

resetButton.addEventListener("click", resetGame);
settingsButton.addEventListener("click", openSettingsModal);
highscoreButton.addEventListener("click", () => {
    displayHighScores();
    highscoresModal.style.display = 'flex';
});
helpButton.addEventListener("click", () => {
    helpModal.style.display = 'flex';
});

// Modal event listeners
saveSettingsButton.addEventListener("click", saveSettings);
closeSettingsButton.addEventListener("click", () => {
    settingsModal.style.display = 'none';
});
closeHighscoresButton.addEventListener("click", () => {
    highscoresModal.style.display = 'none';
});
closeHelpButton.addEventListener("click", () => {
    helpModal.style.display = 'none';
});
clearHighscoresButton.addEventListener("click", clearHighScores);

// Tab switching event listeners
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        switchTab(tab.getAttribute('data-tab'));
    });
});

// Sound toggle event listener
soundToggle.addEventListener('click', toggleSound);

// Inicializar el loader y el juego al cargar el DOM
document.addEventListener('DOMContentLoaded', function() {
    // Inserta el HTML del loader
    insertLoaderHTML();
    
    // Configurar el texto personalizado del loader si se desea
    const loadingText = document.querySelector('.loading-text');
    if (loadingText) {
        loadingText.textContent = "Cargando";
    }
    
    // Simular tiempo de carga y luego mostrar el juego
    setTimeout(() => {
        hideLoader();
        
        // Initialize the game después de ocultar el loader
        resetGame();
    }, 5000); // Tiempo de carga simulado (5 segundos)
});