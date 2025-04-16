document.addEventListener('DOMContentLoaded', function() { //Espera a que el HTML esté completamente cargado antes de ejecutar el script.//    
    // Elementos de la pantalla de carga
    const loadingScreen = document.getElementById('loading-screen'); //Pantalla de carga
    const gameContent = document.getElementById('game-content'); //Contenido del juego
    const loadingText = document.querySelector('.loading-text'); //Texto animado de carga
    
    // Simular carga con mensajes cambiantes y alterna mensajes en .loading-text cada 0.8 segundos (setInterval)
    const loadingMessages = [
        'Preparando palabras...',
        'Dibujando la horca...',
        'Configurando el juego...',
        'Cargando categorías...',
        'Conectando con la API...',
        '¡Casi listo!'
    ];
    
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
        loadingText.textContent = loadingMessages[messageIndex];
        messageIndex = (messageIndex + 1) % loadingMessages.length;
    }, 800);
    
    // Mostrar el juego después de un tiempo de carga
    setTimeout(() => {
        clearInterval(messageInterval);
        loadingScreen.classList.add('fade-out'); 
        
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            gameContent.classList.remove('d-none');
            initGame(); // Inicializar el juego una vez que se muestra la pantalla de carga
        }, 500);
    }, 5500); // Tiempo de carga de 5.5 segundos
    
    // Inicializar el juego
    function initGame() { //Define la función que inicializa el juego
        // Palabras organizadas por categoría y dificultad
        const words = {
            general: {
                easy: ['CASA', 'PERRO', 'GATO', 'SOL', 'LUNA', 'LIBRO', 'MESA', 'SILLA', 'ARBOL', 'FLOR'],
                medium: ['COMPUTADORA', 'TELEVISION', 'CHOCOLATE', 'UNIVERSIDAD', 'HAMBURGUESA', 'BIBLIOTECA', 'TELEFONO', 'ELEFANTE', 'DINOSAURIO'],
                hard: ['EXTRAORDINARIO', 'PARANGARICUTIRIMICUARO', 'ELECTROENCEFALOGRAMA', 'DESOXIRRIBONUCLEICO', 'OTORRINOLARINGOLOGO', 'INCONMENSURABLE', 'PARALELEPIPEDO', 'IDIOSINCRASIA', 'ESTERNOCLEIDOMASTOIDEO']
            },
            animals: {
                easy: ['PERRO', 'GATO', 'LEON', 'TIGRE', 'PATO', 'VACA', 'CABALLO', 'CERDO', 'OVEJA', 'RATA'],
                medium: ['ELEFANTE', 'JIRAFA', 'RINOCERONTE', 'HIPOPOTAMO', 'COCODRILO', 'CAMELLO', 'MURCIELAGO', 'CANGURO', 'PINGUINO', 'LEOPARDO'],
                hard: ['ORNITORRINCO', 'EQUIDNA', 'ESCARABAJO', 'TARDIGRADO', 'AXOLOTE', 'QUETZALCOATLUS', 'ARCHAEOPTERYX', 'MANTARAYA', 'LEMUR', 'OKAPI']
            },
            fruits: {
                easy: ['MANZANA', 'PERA', 'UVA', 'LIMON', 'NARANJA', 'MELON', 'SANDIA', 'PIÑA', 'KIWI', 'FRESA'],
                medium: ['MANDARINA', 'PLATANO', 'GUAYABA', 'MANGO', 'PAPAYA', 'CIRUELA', 'CEREZA', 'GRANADA', 'DURAZNO', 'MARACUYA'],
                hard: ['MANGOSTINO', 'CHIRIMOYA', 'TAMARINDO', 'CARAMBOLA', 'GUANABANA', 'PITAHAYA', 'MAMONCILLO', 'ZAPOTE', 'NISPERO', 'AGUAYMANTO']
            },
            countries: {
                easy: ['ESPAÑA', 'MEXICO', 'PERU', 'CHILE', 'CUBA', 'CHINA', 'JAPON', 'ITALIA', 'FRANCIA', 'BRASIL'],
                medium: ['ALEMANIA', 'ARGENTINA', 'COLOMBIA', 'AUSTRALIA', 'TAILANDIA', 'MARRUECOS', 'SUDAFRICA', 'PORTUGAL', 'ISLANDIA', 'URUGUAY'],
                hard: ['KIRGUISTAN', 'AZERBAIYAN', 'LIECHTENSTEIN', 'MADAGASCAR', 'TAYIKISTAN', 'BURKINA FASO', 'UZBEKISTAN', 'MOZAMBIQUE', 'MAURITANIA', 'SURINAM']
            }
        };
        
        // Pistas para las palabras
        const hints = {
            general: {
                easy: {
                    'CASA': 'Lugar donde vives',
                    'PERRO': 'Mejor amigo del hombre',
                    'GATO': 'Felino doméstico',
                    'SOL': 'Estrella del sistema solar',
                    'LUNA': 'Satélite natural de la Tierra',
                    'LIBRO': 'Conjunto de páginas',
                    'MESA': 'Mueble con tabla horizontal',
                    'SILLA': 'Para sentarse',
                    'ARBOL': 'Planta de tronco leñoso',
                    'FLOR': 'Parte reproductiva de las plantas'
                },
                medium: {
                    'COMPUTADORA': 'Dispositivo electrónico para procesar datos',
                    'TELEVISION': 'Aparato para ver programas',
                    'CHOCOLATE': 'Dulce hecho con cacao',
                    'UNIVERSIDAD': 'Centro de educación superior',
                    'HAMBURGUESA': 'Sándwich de carne molida',
                    'BIBLIOTECA': 'Lugar con muchos libros',
                    'TELEFONO': 'Para hablar a distancia',
                    'ELEFANTE': 'Animal con trompa grande',
                    'DINOSAURIO': 'Reptil extinto'
                },
                hard: {
                    'EXTRAORDINARIO': 'Fuera de lo común',
                    'PARANGARICUTIRIMICUARO': 'Pueblo ficticio mexicano',
                    'ELECTROENCEFALOGRAMA': 'Registro de actividad cerebral',
                    'DESOXIRRIBONUCLEICO': 'ADN',
                    'OTORRINOLARINGOLOGO': 'Médico de oídos, nariz y garganta',
                    'INCONMENSURABLE': 'Que no se puede medir',
                    'PARALELEPIPEDO': 'Prisma de bases paralelogramos',
                    'IDIOSINCRASIA': 'Temperamento particular',
                    'ESTERNOCLEIDOMASTOIDEO': 'Músculo del cuello'
                }
            }
            // Se puede añadir más pistas para otras categorías según sea necesario
        };
        
        let currentWord = '';
        let currentHint = '';
        let guessedLetters = [];
        let errors = 0;
        let gameOver = false;
        let score = 0;
        let wins = 0;
        let losses = 0;
        let soundEnabled = true;

        //Variables clave:
            // currentWord: Palabra seleccionada.
            // guessedLetters: Letras adivinadas.
            // errors: Errores cometidos.
            // gameOver: Indica si el juego terminó.
            // score: Puntos acumulados. 
        
        // Elementos del DOM
        const wordContainer = document.getElementById('word-container');
        const gameStatus = document.getElementById('game-status');
        const errorCounter = document.getElementById('errors');
        const newGameButton = document.getElementById('new-game');
        const difficultySelect = document.getElementById('difficulty');
        const categorySelect = document.getElementById('category');
        const themeToggle = document.getElementById('theme-toggle');
        const soundToggle = document.getElementById('sound-toggle');
        const keyboard = document.querySelector('.keyboard');
        const hangmanParts = document.querySelectorAll('.hangman-drawing div:not(.post):not(.top-bar):not(.noose)');
        const scoreDisplay = document.getElementById('score');
        const winsDisplay = document.getElementById('wins');
        const lossesDisplay = document.getElementById('losses');
        const hintText = document.getElementById('hint-text');
        const hintContent = document.getElementById('hint-content');
        const showScoresButton = document.getElementById('show-scores');
        const clearScoresButton = document.getElementById('clear-scores');
        const scoresTableBody = document.getElementById('scores-table-body');
        
        // Elementos de audio
        const soundCorrect = document.getElementById('sound-correct');
        const soundWrong = document.getElementById('sound-wrong');
        const soundWin = document.getElementById('sound-win');
        const soundLose = document.getElementById('sound-lose');
        const soundClick = document.getElementById('sound-click');
        
        // Modal de resultado
        const resultModal = new bootstrap.Modal(document.getElementById('result-modal'));
        const resultMessage = document.getElementById('result-message');
        const resultDetails = document.getElementById('result-details');
        const resultAnimation = document.getElementById('result-animation');
        const resultPoints = document.getElementById('result-points').querySelector('span');
        const playAgainButton = document.getElementById('play-again');
        
        // Modal de puntuaciones
        const scoresModal = new bootstrap.Modal(document.getElementById('scores-modal'));
        
        // Función para reproducir sonido
        function playSound(sound) {
            if (soundEnabled) {
                sound.currentTime = 0;
                sound.play();
            }
        }
        
        // Cargar puntuaciones del almacenamiento local
        function loadScores() {
            const scores = JSON.parse(localStorage.getItem('hangmanScores')) || [];
            return scores;
        }
        
        // Guardar puntuaciones en el almacenamiento local
        function saveScore(points, difficulty, category) {
            const scores = loadScores();
            const newScore = {
                points,
                difficulty,
                category,
                date: new Date().toLocaleDateString()
            };
            
            scores.push(newScore);
            scores.sort((a, b) => b.points - a.points); // Ordenar de mayor a menor
            
            localStorage.setItem('hangmanScores', JSON.stringify(scores.slice(0, 10))); // Guardar solo los 10 mejores
            updateScoresTable();
        }
        
        // Actualizar la tabla de puntuaciones
        function updateScoresTable() {
            const scores = loadScores();
            scoresTableBody.innerHTML = '';
            
            if (scores.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="5" class="text-center">No hay puntuaciones guardadas</td>';
                scoresTableBody.appendChild(row);
                return;
            }
            
            scores.forEach((score, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${score.points}</td>
                    <td>${score.difficulty}</td>
                    <td>${score.category}</td>
                    <td>${score.date}</td>
                `;
                scoresTableBody.appendChild(row);
            });
        }
        
        // Obtener palabra aleatoria de una API
        async function fetchRandomWord() {
            try {
                const difficulty = difficultySelect.value;
                let minLength = 3;
                let maxLength = 6;
                
                if (difficulty === 'medium') {
                    minLength = 7;
                    maxLength = 10;
                } else if (difficulty === 'hard') {
                    minLength = 11;
                    maxLength = 15;
                }
                
                const response = await fetch(`https://random-word-api.herokuapp.com/word?length=${minLength}-${maxLength}&lang=es`);
                if (!response.ok) {
                    throw new Error('Error al obtener palabra');
                }
                
                const data = await response.json();
                return data[0].toUpperCase();
            } catch (error) {
                console.error('Error:', error);
                // Palabra de respaldo en caso de error
                return words.general[difficultySelect.value][Math.floor(Math.random() * words.general[difficultySelect.value].length)];
            }
        }
        
        // Iniciar juego
        async function startGame() {
            playSound(soundClick);
            
            // Reiniciar variables & reinicia el juego limpiando los errores y las letras adivinadas
            guessedLetters = [];
            errors = 0;
            gameOver = false;
            
            // Actualiza la interfaz para reiniciar el juego
            gameStatus.textContent = 'Adivina la palabra';
            gameStatus.className = 'lead';
            errorCounter.textContent = '0';
            hintText.classList.add('d-none');
            
            // Reiniciar teclado
            const keyboardButtons = document.querySelectorAll('.keyboard button');
            keyboardButtons.forEach(button => {
                button.disabled = false;
                button.classList.remove('btn-success', 'btn-danger');
                button.classList.add('btn-outline-primary');
            });
            
            // Reiniciar dibujo del ahorcado
            hangmanParts.forEach(part => {
                part.classList.add('hidden');
            });
            
            // Seleccionar categoría y dificultad
            const category = categorySelect.value;
            const difficulty = difficultySelect.value;
            
            // Elegir palabra según la categoría y dificultad
            if (category === 'api') {
                // Mostrar mensaje de carga
                wordContainer.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>';
                
                // Obtener palabra de la API
                currentWord = await fetchRandomWord();
                currentHint = 'Palabra obtenida de una API';
            } else {
                // Elegir palabra aleatoria de nuestra base de datos
                const wordList = words[category][difficulty];
                currentWord = wordList[Math.floor(Math.random() * wordList.length)];
                
                // Asignar pista si está disponible
                if (hints[category] && hints[category][difficulty] && hints[category][difficulty][currentWord]) {
                    currentHint = hints[category][difficulty][currentWord];
                } else {
                    currentHint = `Categoría: ${category}`;
                }
            }
            
            // Mostrar espacios para letras
            wordContainer.innerHTML = '';
            for (let i = 0; i < currentWord.length; i++) {
                const letterElement = document.createElement('span');
                letterElement.classList.add('letter');
                letterElement.textContent = '';
                letterElement.dataset.letter = currentWord[i];
                wordContainer.appendChild(letterElement);
            }
        }
        
        // Manejar clic en letra
        function handleLetterClick(event) {
            if (gameOver) return; //Si el juego terminó, no hace nada
            
            const button = event.target;
            if (!button.dataset.letter) return;
            
            const letter = button.dataset.letter;
            
            // Evitar letras repetidas
            if (guessedLetters.includes(letter)) return;
            
            playSound(soundClick);
            
            // Deshabilitar botón
            button.disabled = true;
            button.classList.remove('btn-outline-primary');
            
            // Verificar si la letra está en la palabra
            if (currentWord.includes(letter)) {
                playSound(soundCorrect);
                button.classList.add('btn-success');
                guessedLetters.push(letter);
                
                // Actualizar letras adivinadas
                const letterElements = wordContainer.querySelectorAll('.letter');
                let revealedLetters = 0;
                letterElements.forEach(element => {
                    if (element.dataset.letter === letter) {
                        element.textContent = letter;
                        element.classList.add('revealed');
                        
                        // Animación de revelación
                        setTimeout(() => {
                            element.classList.remove('revealed');
                        }, 500);
                        
                        revealedLetters++;
                    }
                });
                
                // Añadir puntos según dificultad y número de letras reveladas
                const difficultyMultiplier = {
                    'easy': 1,
                    'medium': 2,
                    'hard': 3
                };
                
                score += 10 * revealedLetters * difficultyMultiplier[difficultySelect.value];
                scoreDisplay.textContent = score;
                
                // Mostrar pista después de algunos intentos correctos
                if (guessedLetters.length === 3 && !hintText.classList.contains('d-none')) {
                    showHint();
                }
                
                // Verificar victoria
                checkWin();
            } else {
                playSound(soundWrong);
                button.classList.add('btn-danger');
                guessedLetters.push(letter);
                errors++;
                errorCounter.textContent = errors;
                
                // Mostrar parte del ahorcado
                if (errors <= hangmanParts.length) {
                    hangmanParts[errors - 1].classList.remove('hidden');
                }
                
                // Mostrar pista después de algunos errores
                if (errors === 3) {
                    showHint();
                }
                
                // Verificar derrota
                if (errors >= 6) {
                    endGame(false);
                }
            }
        }
        
        // Mostrar pista
        function showHint() {
            hintText.classList.remove('d-none');
            hintContent.textContent = currentHint;
        }
        
        // Verificar victoria
        function checkWin() {
            const letterElements = wordContainer.querySelectorAll('.letter');
            let allLettersGuessed = true; // Recorre todas las letras y verifica si están adivinadas.
            
            letterElements.forEach(element => {
                if (element.textContent === '') {
                    allLettersGuessed = false;
                }
            });
            
            if (allLettersGuessed) {
                endGame(true);
            }
        } //Si todas las letras fueron reveladas, el jugador gana (endGame(true)).

        
        // Finalizar juego
        function endGame(won) {
            gameOver = true; //Marca el juego terminado
            
            // Calcular puntos finales
            let finalPoints = 0;
            const difficultyMultiplier = {
                'easy': 1,
                'medium': 2,
                'hard': 3
            };
            
            // Si el jugador gana, muestra un mensaje de victoria.
            // Si pierde, revela la palabra completa.
            if (won) {
                // Bonus por ganar según dificultad y errores
                finalPoints = 100 * difficultyMultiplier[difficultySelect.value] - (errors * 10);
                wins++;
                winsDisplay.textContent = wins;
                playSound(soundWin);
                
                // Actualizar mensaje
                resultMessage.textContent = '¡Felicidades! ¡Has ganado!';
                resultMessage.className = 'text-success';
                resultDetails.textContent = `Has adivinado la palabra "${currentWord}" con ${errors} errores.`;
                
                // Animación de victoria
                resultAnimation.innerHTML = '<div class="trophy"><i class="fas fa-trophy"></i></div>';
                
                // Crear confeti
                for (let i = 0; i < 30; i++) {
                    createConfetti();
                }
            } else {
                // Puntos mínimos por perder
                finalPoints = 10;
                losses++;
                lossesDisplay.textContent = losses;
                playSound(soundLose);
                
                // Actualizar mensaje
                resultMessage.textContent = '¡Has perdido!';
                resultMessage.className = 'text-danger';
                resultDetails.textContent = `La palabra era "${currentWord}".`;
                
                // Animación de derrota
                resultAnimation.innerHTML = '<div class="sad-face"><i class="fas fa-frown"></i></div>';
                
                // Mostrar palabra completa
                const letterElements = wordContainer.querySelectorAll('.letter');
                letterElements.forEach(element => {
                    if (element.textContent === '') {
                        element.textContent = element.dataset.letter;
                        element.classList.add('final-reveal');
                    }
                });
            }
            
            // Añadir puntos al score
            score += finalPoints;
            scoreDisplay.textContent = score;
            
            // Mostrar puntos en el modal
            resultPoints.textContent = finalPoints;
            
            // Guardar puntuación
            saveScore(finalPoints, difficultySelect.value, categorySelect.value);
            
            // Mostrar modal de resultado
            setTimeout(() => {
                resultModal.show();
            }, 1000);
        }
        
        // Confeti para la animación de victoria
function createConfetti() {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    const confetti = document.createElement('div');
    confetti.classList.add('confetti');
    
    // Posición inicial aleatoria horizontal
    confetti.style.left = Math.random() * 100 + '%';
    // Posición inicial en la parte superior del contenedor
    confetti.style.top = '0%';
    
    // Color aleatorio
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    // Rotación aleatoria
    confetti.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';
    
    // Agregar al contenedor de animación
    resultAnimation.appendChild(confetti);
    
    // Animación de caída
    let position = 0;
    let opacity = 1;
    const animationDuration = 1500 + Math.random() * 1000; // Entre 1.5 y 2.5 segundos
    const startTime = Date.now();
    
    const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / animationDuration;
        
        if (progress < 1) {
            // Posición vertical: movimiento hacia abajo con aceleración
            position = (progress * progress) * 120; // Hasta 120% del contenedor
            confetti.style.top = position + '%';
            
            // Movimiento horizontal oscilante
            const swing = Math.sin(progress * Math.PI * 2) * 10;
            const currentLeft = parseFloat(confetti.style.left);
            confetti.style.left = (currentLeft + swing * 0.05) + '%';
            
            // Reducción gradual de opacidad
            if (progress > 0.7) {
                opacity = 1 - ((progress - 0.7) / 0.3);
                confetti.style.opacity = opacity;
            }
            
            // Continuar animación
            requestAnimationFrame(animate);
        } else {
            // Eliminar cuando termine la animación
            resultAnimation.removeChild(confetti);
        }
    };
    
    // Iniciar animación
    requestAnimationFrame(animate);
}
        
        // Cambiar tema entre blanco y negro
        function toggleTheme() {
            playSound(soundClick);
            document.body.classList.toggle('dark-mode');
            if (document.body.classList.contains('dark-mode')) {
                themeToggle.textContent = 'Modo Claro';
            } else {
                themeToggle.textContent = 'Modo Oscuro';
            }
        }
        
        // Activar/desactivar sonido
        function toggleSound() {
            soundEnabled = !soundEnabled;
            soundToggle.classList.toggle('muted');
            
            // Cambiar icono
            const icon = soundToggle.querySelector('i');
            if (soundEnabled) {
                icon.className = 'fas fa-volume-up';
            } else {
                icon.className = 'fas fa-volume-mute';
            }
            
            // Reproducir sonido de clic si se activa
            if (soundEnabled) {
                playSound(soundClick);
            }
        }
        
        // Manejar pulsación de tecla
        function handleKeyPress(event) {
            if (gameOver) return;
            
            const key = event.key.toUpperCase();
            
            // Solo procesar letras
            if (/^[A-ZÑ]$/.test(key)) {
                const button = document.querySelector(`.keyboard button[data-letter="${key}"]`);
                
                if (button && !button.disabled) {
                    button.click();
                }
            }
        }
        
        // Borrar puntuaciones
        function clearScores() {
            if (confirm('¿Estás seguro de que quieres borrar todas las puntuaciones?')) {
                localStorage.removeItem('hangmanScores');
                updateScoresTable();
                playSound(soundClick);
            }
        }
        
        // Verificar si existen puntuaciones previas
        function loadPreviousGame() {
            score = parseInt(localStorage.getItem('hangmanScore')) || 0;
            wins = parseInt(localStorage.getItem('hangmanWins')) || 0;
            losses = parseInt(localStorage.getItem('hangmanLosses')) || 0;
            
            scoreDisplay.textContent = score;
            winsDisplay.textContent = wins;
            lossesDisplay.textContent = losses;
        }
        
        // Guardar estado del juego
        function saveGameState() {
            localStorage.setItem('hangmanScore', score);
            localStorage.setItem('hangmanWins', wins);
            localStorage.setItem('hangmanLosses', losses);
        }
        
        // Event listeners
        newGameButton.addEventListener('click', startGame);
        keyboard.addEventListener('click', handleLetterClick);
        themeToggle.addEventListener('click', toggleTheme);
        soundToggle.addEventListener('click', toggleSound);
        document.addEventListener('keydown', handleKeyPress);
        showScoresButton.addEventListener('click', () => {
            updateScoresTable();
            scoresModal.show();
            playSound(soundClick);
        });
        clearScoresButton.addEventListener('click', clearScores);
        playAgainButton.addEventListener('click', () => {
            resultModal.hide();
            startGame();
        });
        
        // Guardar el estado del juego cuando la ventana se cierra
        window.addEventListener('beforeunload', saveGameState);
        
        // Comprobar preferencias de tema del sistema
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-mode');
            themeToggle.textContent = 'Modo Claro';
        }
        
        // Inicializar tabla de puntuaciones
        updateScoresTable();
        
        // Cargar juego previo
        loadPreviousGame();
        
        // Iniciar juego al cargar la página
        startGame();
    }
});