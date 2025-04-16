// Configuración del juego
let GRID_SIZE = 20;
let GRID_WIDTH;
let GRID_HEIGHT;
document.documentElement.style.setProperty('--food-normal', '#FF5733');
document.documentElement.style.setProperty('--food-speed', '#33FF57');
document.documentElement.style.setProperty('--food-bonus', '#FF33F5');
document.documentElement.style.setProperty('--food-grow', '#33F5FF');
document.documentElement.style.setProperty('--food-shrink', '#F5FF33');

// Velocidades según dificultad (en milisegundos)
const SPEEDS = {
    easy: {
        initial: 180,
        levelDecrease: 15
    },
    medium: {
        initial: 140,
        levelDecrease: 15
    },
    hard: {
        initial: 100,
        levelDecrease: 10
    }
};

// Constantes de comida
const FOOD_TYPES = {
    normal: {
        class: "food-normal",
        points: 10,
        chance: 0.6,
        effect: "none"
    },
    speed: {
        class: "food-speed",
        points: 5,
        chance: 0.1,
        effect: "speed"
    },
    bonus: {
        class: "food-bonus",
        points: 30,
        chance: 0.1,
        effect: "bonus"
    },
    grow: {
        class: "food-grow",
        points: 15,
        chance: 0.1,
        effect: "grow"
    },
    shrink: {
        class: "food-shrink",
        points: 20,
        chance: 0.1,
        effect: "shrink"
    }
};

// Variables del juego
let snake = [];
let foods = [];
let direction = "RIGHT";
let nextDirection = "RIGHT";
let gameInterval;
let score = 0;
let highScore = localStorage.getItem("snakeHighScore") || 0;
let gameRunning = false;
let paused = false;
let difficulty = "easy";
let speed = SPEEDS[difficulty].initial;
let level = 1;
let levelThreshold = 100; // Puntos necesarios para subir de nivel
let specialFoodChance = 0.2; // 20% de probabilidad de comida especial
let gameStartTime;
let elapsedTime = 0;
let isPaused = false;
// Añadir con las otras variables del juego
let snakeColor = "green"; // Color por defecto
// Variables para controles táctiles
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

function updateGridDimensions() {
    const boardWidth = document.getElementById("game-board").offsetWidth;
    const boardHeight = document.getElementById("game-board").offsetHeight;
    GRID_SIZE = window.innerWidth < 500 ? 15 : 20; // Celdas más pequeñas en móvil
    GRID_WIDTH = Math.floor(boardWidth / GRID_SIZE);
    GRID_HEIGHT = Math.floor(boardHeight / GRID_SIZE);
}

// Inicializar dimensiones al cargar
updateGridDimensions();

// Sonidos del juego usando Web Audio API
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

const sounds = {
    eat: {
        play: function() {
            playSimpleTone(600, 0.1, 'triangle');
        }
    },
    gameOver: {
        play: function() {
            playSimpleTone(200, 0.5, 'sawtooth');
        }
    },
    levelUp: {
        play: function() {
            playSequence([400, 500, 600], 0.1);
        }
    },
    specialFood: {
        play: function() {
            playSimpleTone(800, 0.1, 'sine');
        }
    }
};

// Función para reproducir un tono simple
function playSimpleTone(frequency, duration, type = 'sine') {
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        gainNode.gain.value = 0.1;
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        
        // Fade out
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
        
        // Stop after duration
        setTimeout(() => {
            oscillator.stop();
        }, duration * 1000);
    } catch (e) {
        console.log("Error playing sound:", e);
    }
}

// Función para reproducir secuencia de tonos
function playSequence(frequencies, duration) {
    let time = 0;
    frequencies.forEach(freq => {
        setTimeout(() => {
            playSimpleTone(freq, duration);
        }, time * 1000);
        time += duration;
    });
}

// Función para asegurar que el audio funcione en móviles
function resumeAudio() {
    if (audioContext.state === "suspended") {
        audioContext.resume();
    }
}


// Elementos del DOM
const gameBoard = document.getElementById("game-board");
const scoreElement = document.getElementById("score");
const finalScoreElement = document.getElementById("final-score");
const highScoreElement = document.getElementById("high-score");
const highScoreValueElement = document.getElementById("high-score-value");
const startButton = document.getElementById("start-button");
const pauseButton = document.getElementById("pause-button");
const gameOverElement = document.querySelector(".game-over");
const pauseOverlay = document.querySelector(".pause-overlay");
const levelValueElement = document.getElementById("level-value");
const levelUpElement = document.querySelector(".level-up");

// Prevenir desplazamiento durante el juego
gameBoard.addEventListener('touchmove', function(e) {
    if (gameRunning && !isPaused) {
        e.preventDefault();
    }
}, { passive: false });

// Prevenir zoom con doble toque
document.addEventListener('dblclick', function(e) {
    if (gameRunning) {
        e.preventDefault();
    }
}, { passive: false });

// Actualizar el valor del récord al cargar
highScoreValueElement.textContent = highScore;

// Configuración de dificultad
document.getElementById("easy-btn").addEventListener("click", () => {
    resumeAudio();
    setDifficulty("easy");
});
document.getElementById("medium-btn").addEventListener("click", () => {
    resumeAudio();
    setDifficulty("medium");
});
document.getElementById("hard-btn").addEventListener("click", () => {
    resumeAudio();
    setDifficulty("hard");
});

function setDifficulty(diff) {
    if (gameRunning && !isPaused) return; // No cambiar dificultad durante el juego
    
    // Actualizar clases activas
    document.querySelectorAll(".difficulty-btn").forEach(btn => btn.classList.remove("active"));
    document.getElementById(`${diff}-btn`).classList.add("active");
    
    difficulty = diff;
    speed = SPEEDS[difficulty].initial;
}

// Añadir después de los controles de dificultad
document.querySelectorAll('.snake-color-option').forEach(option => {
    option.addEventListener('click', () => {
        resumeAudio();
        if (gameRunning && !isPaused) return; // No cambiar durante el juego
        
        // Actualizar selección visual
        document.querySelectorAll('.snake-color-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        
        // Guardar color seleccionado
        snakeColor = option.dataset.color;
    });
});

// Iniciar juego
startButton.addEventListener('click', () => {
    console.log("Botón de inicio presionado");
    startGame(); // Usa la función correcta para iniciar el juego
    startScreen.style.display = 'none'; // Oculta la pantalla de inicio
    initGame(); // Inicializa el juego
    requestAnimationFrame(gameLoop); // Comienza el bucle del juego
});
pauseButton.addEventListener("click", togglePause);

// Modal de instrucciones
const instructionsBtn = document.getElementById("instructions-button");
const instructionsModal = document.getElementById("instructions-modal");
const closeModal = document.querySelector(".close-modal");

instructionsBtn.addEventListener("click", () => {
    instructionsModal.style.display = "flex";
});

closeModal.addEventListener("click", () => {
    instructionsModal.style.display = "none";
});

window.addEventListener("click", (e) => {
    if (e.target === instructionsModal) {
        instructionsModal.style.display = "none";
    }
});

// Control de dirección con teclado
document.addEventListener("keydown", (event) => {
    if (event.key === " ") {
        if (gameRunning) {
            togglePause();
        }
        return;
    }
    
    changeDirection(event);
});

// Controles móviles
document.getElementById("up-btn").addEventListener("click", () => changeDirectionMobile("UP"));
document.getElementById("down-btn").addEventListener("click", () => changeDirectionMobile("DOWN"));
document.getElementById("left-btn").addEventListener("click", () => changeDirectionMobile("LEFT"));
document.getElementById("right-btn").addEventListener("click", () => changeDirectionMobile("RIGHT"));

function changeDirectionMobile(dir) {
    if (!gameRunning || isPaused) return;
    
    switch (dir) {
        case "UP":
            if (direction !== "DOWN") nextDirection = "UP";
            break;
        case "DOWN":
            if (direction !== "UP") nextDirection = "DOWN";
            break;
        case "LEFT":
            if (direction !== "RIGHT") nextDirection = "LEFT";
            break;
        case "RIGHT":
            if (direction !== "LEFT") nextDirection = "RIGHT";
            break;
    }
}

// Añadir soporte para gestos swipe
gameBoard.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, false);

gameBoard.addEventListener('touchend', function(e) {
    if (!gameRunning || isPaused) return;
    
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    
    handleSwipe();
}, false);

function handleSwipe() {
    const horizontalDistance = touchEndX - touchStartX;
    const verticalDistance = touchEndY - touchStartY;
    
    // Requiere un mínimo de movimiento para considerar como swipe
    const minSwipeDistance = 30;
    
    if (Math.abs(horizontalDistance) > Math.abs(verticalDistance)) {
        // Swipe horizontal
        if (horizontalDistance > minSwipeDistance && direction !== "LEFT") {
            nextDirection = "RIGHT";
        } else if (horizontalDistance < -minSwipeDistance && direction !== "RIGHT") {
            nextDirection = "LEFT";
        }
    } else {
        // Swipe vertical
        if (verticalDistance > minSwipeDistance && direction !== "UP") {
            nextDirection = "DOWN";
        } else if (verticalDistance < -minSwipeDistance && direction !== "DOWN") {
            nextDirection = "UP";
        }
    }
}

function togglePause() {
    if (!gameRunning) return;
    
    if (isPaused) {
        // Reanudar juego
        gameInterval = setInterval(moveSnake, speed);
        pauseOverlay.style.display = "none";
        pauseButton.innerHTML = '<i class="fas fa-pause"></i> Pausar';
    } else {
        // Pausar juego
        clearInterval(gameInterval);
        pauseOverlay.style.display = "flex";
        pauseButton.innerHTML = '<i class="fas fa-play"></i> Reanudar';
    }
    
    isPaused = !isPaused;
}

function startGame() {
    // Si está pausado, reanudar en lugar de reiniciar
    if (gameRunning && isPaused) {
        togglePause();
        return;
    }
    // Actualizar dimensiones de la cuadrícula
    updateGridDimensions();
    
    // Resetear el juego
    clearInterval(gameInterval);
    gameOverElement.style.display = "none";
    pauseOverlay.style.display = "none";
    clearBoard();
    
    // Inicializar la serpiente
    snake = [
        {x: 5, y: 10},
        {x: 4, y: 10},
        {x: 3, y: 10}
    ];
    
    // Inicializar valores
    direction = "RIGHT";
    nextDirection = "RIGHT";
    score = 0;
    level = 1;
    foods = [];
    gameStartTime = Date.now();
    elapsedTime = 0;
    speed = SPEEDS[difficulty].initial;
    
    scoreElement.textContent = score;
    levelValueElement.textContent = level;
    
    // Crear comida
    createFood();
    
    // Renderizar el estado inicial
    renderGame();
    
    // Iniciar el bucle del juego
    gameRunning = true;
    isPaused = false;
    gameInterval = setInterval(moveSnake, speed);
    
    // Actualizar botones
    startButton.innerHTML = '<i class="fas fa-redo"></i> Reiniciar';
    pauseButton.disabled = false;
    pauseButton.innerHTML = '<i class="fas fa-pause"></i> Pausar';
}

function moveSnake() {
    // Actualizar la dirección
    direction = nextDirection;
    
    // Obtener la posición actual de la cabeza
    const head = {...snake[0]};
    
    // Calcular la nueva posición de la cabeza según la dirección
    switch (direction) {
        case "UP":
            head.y -= 1;
            break;
        case "DOWN":
            head.y += 1;
            break;
        case "LEFT":
            head.x -= 1;
            break;
        case "RIGHT":
            head.x += 1;
            break;
    }
    
    // Comprobar colisiones
    if (checkCollision(head)) {
        gameOver();
        return;
    }
    
    // Agregar la nueva cabeza al principio del array
    snake.unshift(head);
    
    // Comprobar si la serpiente ha comido la comida
    let foodEaten = false;
    let specialEaten = false;
    let foodIndex = -1;
    
    for (let i = 0; i < foods.length; i++) {
        if (head.x === foods[i].x && head.y === foods[i].y) {
            foodIndex = i;
            foodEaten = true;
            specialEaten = foods[i].special;
            break;
        }
    }
    
    if (foodEaten) {
        // Eliminar la comida comida
        const eatenFood = foods[foodIndex];
        foods.splice(foodIndex, 1);

        // Obtener información del tipo de comida
    const foodInfo = FOOD_TYPES[eatenFood.type];
        
        // Aumentar la puntuación
        //let points = specialEaten ? 30 : 10;
        score += foodInfo.points;
        scoreElement.textContent = score;

        // Aplicar efecto según el tipo
    applyFoodEffect(foodInfo.effect);
        
        // Animar el contador de puntuación
        scoreElement.parentElement.classList.add("pulse");
        setTimeout(() => {
            scoreElement.parentElement.classList.remove("pulse");
        }, 500);
        
        // Reproducir sonido
        //if (specialEaten) {
        //    sounds.specialFood.play();
       // } else {
          //  sounds.eat.play();
       // }
       // sounds[eatenFood.type === "bonus" ? "specialFood" : "eat"].play();

        // Reproducir el sonido correspondiente
    if (eatenFood.type === "bonus") {
        sounds.specialFood.play();
    } else {
        sounds.eat.play();
    }

        // Crear efecto de partículas
        createFoodParticles(head.x * GRID_SIZE + GRID_SIZE/2, head.y * GRID_SIZE + GRID_SIZE/2, eatenFood.type);
        
        // Comprobar nivel
        const newLevel = Math.floor(score / levelThreshold) + 1;
        if (newLevel > level) {
            levelUp();
        }
        
        // Crear nueva comida
        createFood();
    } else {
        // Si no ha comido, eliminar la última parte de la serpiente
        snake.pop();
    }
    
    // Renderizar el nuevo estado del juego
    renderGame();
}

// Añadir esta nueva función
function applyFoodEffect(effect) {
    switch(effect) {
        case "speed":
            // Aumentar velocidad temporalmente
            const originalSpeed = speed;
            speed = Math.max(speed * 0.7, 50); // 30% más rápido
            
            clearInterval(gameInterval);
            gameInterval = setInterval(moveSnake, speed);
            
            // Mostrar indicador
            showMessage("¡Velocidad +30%!");
            
            // Volver a la velocidad normal después de un tiempo
            setTimeout(() => {
                if (gameRunning && !isPaused) {
                    speed = originalSpeed;
                    clearInterval(gameInterval);
                    gameInterval = setInterval(moveSnake, speed);
                }
            }, 5000); // Duración 5 segundos
            break;
            
        case "grow":
            // Añadir partes extra a la serpiente
            const extraParts = 2;
            const tail = snake[snake.length - 1];
            
            for (let i = 0; i < extraParts; i++) {
                snake.push({...tail});
            }
            
            showMessage("¡+2 Segmentos!");
            break;
            
        case "shrink":
            // Reducir el tamaño de la serpiente
            if (snake.length > 3) { // No permitir menos de 3 segmentos
                snake.pop();
                snake.pop();
                showMessage("¡-2 Segmentos!");
            }
            break;
            
        case "bonus":
            // Bonus de puntos ya aplicado
            showMessage("¡Bonus +30!");
            break;
    }
}

// Función para mostrar mensajes temporales
function showMessage(text) {
    const message = document.createElement("div");
    message.textContent = text;
    message.style.position = "absolute";
    message.style.top = "50%";
    message.style.left = "50%";
    message.style.transform = "translate(-50%, -50%)";
    message.style.color = "white";
    message.style.fontSize = "1.5rem";
    message.style.fontWeight = "bold";
    message.style.textShadow = "0 0 5px black";
    message.style.zIndex = "100";
    
    gameBoard.appendChild(message);
    
    // Animar y eliminar después de 1.5 segundos
    message.animate([
        { opacity: 0, transform: "translate(-50%, -50%) scale(0.5)" },
        { opacity: 1, transform: "translate(-50%, -50%) scale(1.2)" },
        { opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
        { opacity: 0, transform: "translate(-50%, -50%) scale(0.8)" }
    ], {
        duration: 1500,
        easing: "ease-out"
    }).onfinish = () => message.remove();
}

function levelUp() {
    level += 1;
    levelValueElement.textContent = level;
    
    // Mostrar animación de nivel
    levelUpElement.textContent = `¡NIVEL ${level}!`;
    levelUpElement.style.animation = "levelUp 2s forwards";
    
    // Reproducir sonido de subida de nivel
    sounds.levelUp.play();
    
    // Aumentar la velocidad del juego
    speed = Math.max(SPEEDS[difficulty].initial - (level - 1) * SPEEDS[difficulty].levelDecrease, 50);
    
    // Reiniciar intervalo con nueva velocidad
    clearInterval(gameInterval);
    gameInterval = setInterval(moveSnake, speed);
    
    // Reiniciar animación después de terminar
    setTimeout(() => {
        levelUpElement.style.animation = "none";
        void levelUpElement.offsetWidth; // Forzar reflow
    }, 2000);
}

    function createFoodParticles(x, y, foodType) {
        // Menos partículas en móviles
    const isMobile = window.innerWidth < 500;
    const particleCount = isMobile ? 
        (foodType === "bonus" ? 8 : 4) : 
        (foodType === "bonus" ? 15 : 8);

 // Asegurarse de que el tipo existe, si no, usar "normal"
    const type = Object.keys(FOOD_TYPES).includes(foodType) ? foodType : "normal";
    
 // Obtener el color de la comida
    const colorMap = {
        "normal": "#FF5733",  // Naranja rojizo
        "speed": "#33FF57",   // Verde claro
        "bonus": "#FF33F5",   // Rosa
        "grow": "#33F5FF",    // Cian
        "shrink": "#F5FF33"   // Amarillo
    };

    const color = colorMap[type] || colorMap["normal"];

    // Crear partículas
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement("div");
        particle.classList.add("food-particle");
        particle.style.backgroundColor = color;
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 2;
        const size = Math.random() * 4 + 2;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        gameBoard.appendChild(particle);
        
        // Animar partícula
        const startTime = Date.now();
        const duration = Math.random() * 500 + 500;
        
        function animateParticle() {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress >= 1) {
                particle.remove();
                return;
            }
            
            const distance = speed * progress * 20;
            const opacity = 1 - progress;
            
            particle.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;
            particle.style.opacity = opacity;
            
            requestAnimationFrame(animateParticle);
        }
        
        requestAnimationFrame(animateParticle);
    }
}

function createFood() {
    // Generar una posición aleatoria para la comida
    let newFood;
    let foodOnSnake;
    
    do {
        foodOnSnake = false;

        // Seleccionar un tipo de comida basado en probabilidades
        const rand = Math.random();
        let foodType = "normal";
        let cumulativeChance = 0;
        
        for (const [type, data] of Object.entries(FOOD_TYPES)) {
            cumulativeChance += data.chance;
            if (rand <= cumulativeChance) {
                foodType = type;
                break;
            }
        }

        newFood = {
            x: Math.floor(Math.random() * GRID_WIDTH),
            y: Math.floor(Math.random() * GRID_HEIGHT),
            type: foodType
        };
        
        // Comprobar que la comida no aparezca sobre la serpiente
        for (let part of snake) {
            if (part.x === newFood.x && part.y === newFood.y) {
                foodOnSnake = true;
                break;
            }
        }
        
        // Comprobar que no colisione con otra comida
        for (let food of foods) {
            if (food.x === newFood.x && food.y === newFood.y) {
                foodOnSnake = true;
                break;
            }
        }
    } while (foodOnSnake);
    
    foods.push(newFood);
    
    // Limitar a máximo 3 comidas en pantalla
    if (foods.length > 3) {
        foods.shift();
    }
}

function renderGame() {
    clearBoard();
    
    // Renderizar la comida
    foods.forEach(food => {
        const foodElement = document.createElement("div");
        foodElement.classList.add("food");
        foodElement.classList.add(FOOD_TYPES[food.type].class);
        //if (food.special) {
          //  foodElement.classList.add("special-food");
        //}
        foodElement.style.left = `${food.x * GRID_SIZE}px`;
        foodElement.style.top = `${food.y * GRID_SIZE}px`;
        gameBoard.appendChild(foodElement);
    });
    
    // Renderizar la serpiente
    snake.forEach((part, index) => {
        const snakePart = document.createElement("div");
        snakePart.classList.add("snake-part");
         // Aplicar el color a TODAS las partes de la serpiente
        snakePart.classList.add(`snake-${snakeColor}`);
        
        // Marcar la cabeza con un estilo diferente
        if (index === 0) {
            snakePart.classList.add("snake-head");            
            // Añadir rotación según la dirección
            let rotation = 0;
            switch (direction) {
                case "UP": rotation = -90; break;
                case "DOWN": rotation = 90; break;
                case "LEFT": rotation = 180; break;
                case "RIGHT": rotation = 0; break;
            }
            snakePart.style.transform = `rotate(${rotation}deg)`;
        }
        
        snakePart.style.left = `${part.x * GRID_SIZE}px`;
        snakePart.style.top = `${part.y * GRID_SIZE}px`;
        gameBoard.appendChild(snakePart);
    });
}

function clearBoard() {
    // Eliminar todos los elementos excepto el game-over y la pausa
    const elements = gameBoard.querySelectorAll(".snake-part, .food, .food-particle");
    elements.forEach(element => element.remove());
}

function changeDirection(event) {
    if (!gameRunning || isPaused) return;
    
    // Cambiar la dirección según la tecla presionada
    // Evitar que la serpiente pueda dar un giro de 180 grados
    switch (event.key) {
        case "ArrowUp":
            if (direction !== "DOWN") nextDirection = "UP";
            break;
        case "ArrowDown":
            if (direction !== "UP") nextDirection = "DOWN";
            break;
        case "ArrowLeft":
            if (direction !== "RIGHT") nextDirection = "LEFT";
            break;
        case "ArrowRight":
            if (direction !== "LEFT") nextDirection = "RIGHT";
            break;
    }
}

function checkCollision(head) {
    // Colisión con los bordes
    if (
        head.x < 0 || 
        head.x >= GRID_WIDTH || 
        head.y < 0 || 
        head.y >= GRID_HEIGHT
    ) {
        return true;
    }
    
    // Colisión con la propia serpiente (excepto la última parte si se está moviendo)
    for (let i = 0; i < snake.length - 1; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            return true;
        }
    }
    
    return false;
}

function gameOver() {
    clearInterval(gameInterval);
    gameRunning = false;
    finalScoreElement.textContent = score;
    
    // Actualizar récord si es necesario
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("snakeHighScore", highScore);
        highScoreElement.textContent = highScore;
        highScoreValueElement.textContent = highScore;
    } else {
        highScoreElement.textContent = highScore;
    }
    
    gameOverElement.style.display = "flex";
    pauseButton.disabled = true;
    
    // Reproducir sonido de fin de juego
    sounds.gameOver.play();

     // Comprobar si la puntuación merece entrar en el ranking
     const scores = getStoredScores();
     if (scores.length < 10 || score > scores[scores.length - 1].score) {
         // Mostrar modal para ingresar nombre
         document.getElementById("new-high-score").textContent = score;
         document.getElementById("highscore-input-modal").style.display = "flex";
     }
}

function showLeaderboard() {
    const leaderboardBody = document.getElementById("leaderboard-body");
    const scores = getStoredScores();
    
    // Mostrar modal
    document.getElementById("leaderboard-modal").style.display = "flex";
    
    // Limpiar contenido anterior
    leaderboardBody.innerHTML = "";
    
    if (scores.length === 0) {
        leaderboardBody.innerHTML = "<tr><td colspan='6'>No hay puntuaciones disponibles</td></tr>";
        return;
    }
    
    // Llenar la tabla
    scores.forEach((score, index) => {
        const date = new Date(score.date).toLocaleDateString();
        leaderboardBody.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${score.name}</td>
                <td>${score.score}</td>
                <td>${score.level}</td>
                <td>${score.difficulty}</td>
                <td>${date}</td>
                <td><button class="delete-score-btn" data-index="${index}"><i class="fas fa-trash"></i></button></td>
            </tr>
        `;
    });
}

// Responsive: ajustar el tamaño del tablero según el dispositivo
function adjustBoardSize() {
    const container = document.getElementById("game-board-container");
    const board = document.getElementById("game-board");
    
    if (window.innerWidth < 500) {
        container.style.width = "300px";
        container.style.height = "300px";
        board.style.width = "300px";
        board.style.height = "300px";
    } else {
        container.style.width = "400px";
        container.style.height = "400px";
        board.style.width = "400px";
        board.style.height = "400px";
    }

    updateGridDimensions();
    
    // Si el juego está corriendo, ajustar posiciones
    if (gameRunning && !isPaused) {
        renderGame();
    }
}

window.addEventListener("resize", adjustBoardSize);
adjustBoardSize();

// Función para obtener las puntuaciones guardadas
function getStoredScores() {
    const scores = localStorage.getItem("snakeLeaderboard");
    return scores ? JSON.parse(scores) : [];
}

// Función para guardar una nueva puntuación
function saveScore(playerName, scoreData) {
    const scores = getStoredScores();
    
    const newScore = {
        name: playerName,
        score: scoreData.score,
        level: scoreData.level,
        difficulty: scoreData.difficulty,
        date: new Date().toISOString()
    };
    
    scores.push(newScore);
    
    // Ordenar por puntuación (de mayor a menor)
    scores.sort((a, b) => b.score - a.score);
    
    // Limitar a 10 mejores puntuaciones
    const topScores = scores.slice(0, 10);
    
    // Guardar en localStorage
    localStorage.setItem("snakeLeaderboard", JSON.stringify(topScores));
    
    return newScore;
}

// Función para eliminar una puntuación
function deleteScore(index) {
    // Confirmar antes de eliminar
    if (!confirm("¿Estás seguro de que quieres eliminar esta puntuación?")) {
        return;
    }
    
    // Obtener las puntuaciones actuales
    const scores = getStoredScores();
    
    // Eliminar la puntuación en el índice dado
    scores.splice(index, 1);
    
    // Guardar las puntuaciones actualizadas
    localStorage.setItem("snakeLeaderboard", JSON.stringify(scores));
    
    // Actualizar la tabla
    showLeaderboard();
}

// Event listener para botones de eliminar en la tabla de clasificación
document.getElementById("leaderboard-body").addEventListener("click", (e) => {
    // Verificar si se ha hecho clic en un botón de eliminar
    if (e.target.closest(".delete-score-btn")) {
        const button = e.target.closest(".delete-score-btn");
        const index = button.getAttribute("data-index");
        deleteScore(parseInt(index));
    }
});

// Para el botón de clasificación
document.getElementById("leaderboard-button").addEventListener("click", showLeaderboard);

// Para cerrar el modal de clasificación
document.querySelector(".leaderboard-close").addEventListener("click", () => {
    document.getElementById("leaderboard-modal").style.display = "none";
});

// Para cerrar el modal de nueva puntuación
document.querySelector(".highscore-close").addEventListener("click", () => {
    document.getElementById("highscore-input-modal").style.display = "none";
});

// Para guardar la puntuación
document.getElementById("save-score-btn").addEventListener("click", () => {
    const playerName = document.getElementById("player-name").value.trim();
    
    if (!playerName) {
        alert("Por favor introduce tu nombre");
        return;
    }
    
    const scoreData = {
        score: score,
        level: level,
        difficulty: difficulty
    };
    
    saveScore(playerName, scoreData);
    
    document.getElementById("highscore-input-modal").style.display = "none";
    alert("¡Puntuación guardada con éxito!");
    showLeaderboard(); // Mostrar la tabla actualizada
});

// Cerrar modales al hacer clic fuera
window.addEventListener("click", (e) => {
    if (e.target === document.getElementById("leaderboard-modal")) {
        document.getElementById("leaderboard-modal").style.display = "none";
    }
    if (e.target === document.getElementById("highscore-input-modal")) {
        document.getElementById("highscore-input-modal").style.display = "none";
    }
});

