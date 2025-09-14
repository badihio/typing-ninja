// Typing Ninja Game - Consolidated JavaScript Version

// Game Configuration
const WORD_LISTS = {
    beginner: [
        'cat', 'dog', 'run', 'jump', 'fast', 'slow', 'big', 'small', 'red', 'blue',
        'car', 'bus', 'sun', 'moon', 'star', 'tree', 'fish', 'bird', 'book', 'pen',
        'cup', 'box', 'key', 'door', 'wall', 'floor', 'hand', 'foot', 'head', 'eye'
    ],
    intermediate: [
        'computer', 'keyboard', 'monitor', 'program', 'website', 'internet', 'software',
        'hardware', 'database', 'network', 'security', 'password', 'download', 'upload',
        'browser', 'smartphone', 'tablet', 'wireless', 'bluetooth', 'technology',
        'digital', 'virtual', 'online', 'offline', 'system', 'application', 'interface',
        'platform', 'framework', 'algorithm'
    ],
    master: [
        'programming', 'development', 'architecture', 'optimization', 'implementation',
        'documentation', 'maintenance', 'scalability', 'performance', 'efficiency',
        'integration', 'deployment', 'configuration', 'authentication', 'authorization',
        'encryption', 'decryption', 'compression', 'synchronization', 'asynchronous',
        'debugging', 'refactoring', 'inheritance', 'polymorphism', 'abstraction',
        'encapsulation', 'instantiation', 'serialization', 'deserialization', 'middleware'
    ],
    ninja: [
        'encapsulation', 'polymorphism', 'inheritance', 'abstraction', 'instantiation',
        'serialization', 'deserialization', 'synchronization', 'asynchronous', 'multithreading',
        'concurrency', 'parallelism', 'optimization', 'profiling', 'benchmarking',
        'microservices', 'containerization', 'orchestration', 'virtualization', 'scalability',
        'distributed', 'decentralized', 'cryptographic', 'authentication', 'authorization',
        'middleware', 'framework', 'architecture', 'infrastructure', 'implementation'
    ]
};

const DIFFICULTY_CONFIGS = {
    beginner: {
        initialSpeed: 30,
        speedIncrement: 3,
        spawnRate: 2000,
        maxWords: 5,
        lives: 3
    },
    intermediate: {
        initialSpeed: 50,
        speedIncrement: 5,
        spawnRate: 1800,
        maxWords: 6,
        lives: 3
    },
    master: {
        initialSpeed: 70,
        speedIncrement: 7,
        spawnRate: 1500,
        maxWords: 7,
        lives: 3
    },
    ninja: {
        initialSpeed: 100,
        speedIncrement: 10,
        spawnRate: 1200,
        maxWords: 8,
        lives: 3
    }
};

// Game State
let gameState = 'menu';
let currentDifficulty = 'beginner';
let gameConfig = null;
let playerStats = {
    score: 0,
    lives: 3,
    level: 1,
    wordsCompleted: 0,
    accuracy: 100,
    wpm: 0
};

let fallingWords = [];
let gameContainer = null;
let gameStartTime = 0;
let lastWordSpawn = 0;
let lastUpdateTime = 0;
let animationId = null;
let correctChars = 0;
let totalChars = 0;
let usedWords = new Set();

// Score Management
class ScoreManager {
    static STORAGE_KEY = 'typing-ninja-scores';
    static MAX_SCORES = 5;

    static saveScore(score) {
        const scores = this.getHighScores();
        scores.push(score);
        scores.sort((a, b) => b.score - a.score);
        scores.splice(this.MAX_SCORES);
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(scores));
    }

    static getHighScores() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    static getHighScoresByDifficulty(difficulty) {
        return this.getHighScores().filter(score => score.level === difficulty);
    }

    static isHighScore(score) {
        const scores = this.getHighScores();
        return scores.length < this.MAX_SCORES || score > scores[scores.length - 1].score;
    }

    static clearScores() {
        localStorage.removeItem(this.STORAGE_KEY);
    }

    static formatScore(score) {
        return score.toLocaleString();
    }

    static calculateWPM(wordsCompleted, timeInMinutes) {
        return timeInMinutes > 0 ? Math.round(wordsCompleted / timeInMinutes) : 0;
    }

    static calculateAccuracy(correctChars, totalChars) {
        return totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;
    }
}

// Falling Word Class
class FallingWord {
    constructor(text, startX, speed) {
        this.id = 'word-' + Date.now() + '-' + Math.random();
        this.text = text.toLowerCase();
        this.position = { x: startX, y: 0 };
        this.typedPrefix = '';
        this.speed = speed;
        this.isActive = true;
        this.element = null; // Initialize as null
        this.element = this.createElement();
    }

    createElement() {
        const wordElement = document.createElement('div');
        wordElement.className = 'falling-word';
        wordElement.id = this.id;
        wordElement.style.left = `${this.position.x}px`;
        wordElement.style.top = `${this.position.y}px`;
        
        // Set the element first, then update display
        this.element = wordElement;
        this.updateDisplay();
        return wordElement;
    }

    update(deltaTime) {
        if (!this.isActive) return;
        
        this.position.y += this.speed * deltaTime;
        this.element.style.top = `${this.position.y}px`;
    }

    typeCharacter(char) {
        if (!this.isActive) return false;
        
        const nextChar = this.text[this.typedPrefix.length];
        if (char.toLowerCase() === nextChar) {
            this.typedPrefix += char.toLowerCase();
            this.updateDisplay();
            return true;
        }
        return false;
    }

    isCompleted() {
        return this.typedPrefix === this.text;
    }

    isOffScreen(screenHeight) {
        return this.position.y > screenHeight;
    }

    updateDisplay() {
        if (!this.element) {
            return;
        }
        const typedSpan = `<span class="typed">${this.typedPrefix}</span>`;
        const remainingSpan = `<span class="remaining">${this.text.slice(this.typedPrefix.length)}</span>`;
        this.element.innerHTML = typedSpan + remainingSpan;
    }

    destroy() {
        this.isActive = false;
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

// Word Generator
function getRandomWord(difficulty) {
    const wordList = WORD_LISTS[difficulty];
    const availableWords = wordList.filter(word => !usedWords.has(word));
    
    if (availableWords.length === 0) {
        usedWords.clear();
        return wordList[Math.floor(Math.random() * wordList.length)];
    }
    
    const word = availableWords[Math.floor(Math.random() * availableWords.length)];
    usedWords.add(word);
    return word;
}

// Game Functions
function initializeGame() {
    gameContainer = document.getElementById('game-container');
    if (!gameContainer) {
        console.error('Game container not found!');
        return;
    }
    // Force a reflow to ensure dimensions are calculated
    gameContainer.offsetHeight;
    setupEventListeners();
    updateLeaderboard();
}

function setupEventListeners() {
    // Difficulty buttons
    document.querySelectorAll('.difficulty-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const difficulty = e.currentTarget.dataset.difficulty;
            startGame(difficulty);
        });
    });

    // Navigation buttons
    document.getElementById('show-leaderboard')?.addEventListener('click', () => {
        showScreen('leaderboard-screen');
    });

    document.getElementById('show-settings')?.addEventListener('click', () => {
        showScreen('settings-screen');
    });

    document.getElementById('back-to-menu')?.addEventListener('click', () => {
        showScreen('main-menu');
    });

    document.getElementById('settings-back')?.addEventListener('click', () => {
        showScreen('main-menu');
    });

    document.getElementById('menu-btn')?.addEventListener('click', () => {
        resetGame();
        showScreen('main-menu');
    });

    // Game controls
    document.getElementById('pause-btn')?.addEventListener('click', () => {
        if (gameState === 'playing') {
            pauseGame();
            showModal('pause-dialog');
        }
    });

    document.getElementById('resume-game')?.addEventListener('click', () => {
        resumeGame();
        hideModal('pause-dialog');
    });

    document.getElementById('pause-menu')?.addEventListener('click', () => {
        resetGame();
        hideModal('pause-dialog');
        showScreen('main-menu');
    });

    // Settings
    const volumeSlider = document.getElementById('volume-slider');
    const volumeValue = document.getElementById('volume-value');

    volumeSlider?.addEventListener('input', (e) => {
        const volume = parseInt(e.target.value);
        if (volumeValue) volumeValue.textContent = `${volume}%`;
    });

    document.getElementById('clear-scores')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all high scores?')) {
            ScoreManager.clearScores();
            updateLeaderboard();
        }
    });

    // Leaderboard tabs
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const difficulty = e.currentTarget.dataset.tab;
            
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            updateLeaderboardContent(difficulty);
        });
    });

    // Game over dialog
    document.getElementById('play-again')?.addEventListener('click', () => {
        hideModal('game-over-dialog');
        startGame(currentDifficulty);
    });

    document.getElementById('return-menu')?.addEventListener('click', () => {
        hideModal('game-over-dialog');
        showScreen('main-menu');
    });

    // Keyboard input
    document.addEventListener('keydown', handleKeyPress);
}

function startGame(difficulty) {
    currentDifficulty = difficulty;
    gameConfig = DIFFICULTY_CONFIGS[difficulty];
    
    playerStats = {
        score: 0,
        lives: gameConfig.lives,
        level: 1,
        wordsCompleted: 0,
        accuracy: 100,
        wpm: 0
    };
    
    fallingWords = [];
    gameState = 'playing';
    gameStartTime = Date.now();
    lastWordSpawn = gameStartTime;
    lastUpdateTime = gameStartTime;
    correctChars = 0;
    totalChars = 0;
    usedWords.clear();
    
    showScreen('game-screen');
    
    // Small delay to ensure the game screen is fully rendered
    setTimeout(() => {
        updateUI();
        gameLoop();
    }, 100);
}

function gameLoop() {
    if (gameState !== 'playing') return;

    const currentTime = Date.now();
    const deltaTime = (currentTime - lastUpdateTime) / 1000;
    lastUpdateTime = currentTime;

    spawnWords(currentTime);
    updateWords(deltaTime);
    checkCollisions();
    updateStats();
    updateUI();

    if (playerStats.lives <= 0) {
        endGame();
        return;
    }

    animationId = requestAnimationFrame(gameLoop);
}

function spawnWords(currentTime) {
    const timeSinceLastSpawn = currentTime - lastWordSpawn;
    
    if (timeSinceLastSpawn >= gameConfig.spawnRate && 
        fallingWords.length < gameConfig.maxWords) {
        
        const word = getRandomWord(currentDifficulty);
        const speed = gameConfig.initialSpeed + 
                     (playerStats.level - 1) * gameConfig.speedIncrement;
        
        // Recalculate container width each time to ensure accuracy
        const containerWidth = gameContainer.offsetWidth || gameContainer.clientWidth || 800; // fallback to 800px
        const wordWidth = 150; // estimated word width
        const maxX = Math.max(containerWidth - wordWidth, 100); // Ensure minimum space
        const x = Math.random() * maxX;
        
        const fallingWord = new FallingWord(word, x, speed);
        fallingWords.push(fallingWord);
        gameContainer.appendChild(fallingWord.element);
        
        lastWordSpawn = currentTime;
    }
}

function updateWords(deltaTime) {
    fallingWords = fallingWords.filter(word => {
        if (!word.isActive) return false;
        
        word.update(deltaTime);
        
        if (word.isOffScreen(gameContainer.offsetHeight)) {
            playerStats.lives--;
            word.destroy();
            return false;
        }
        
        return true;
    });
}

function checkCollisions() {
    fallingWords.forEach(word => {
        if (word.isCompleted()) {
            playerStats.score += word.text.length * 10 * playerStats.level;
            playerStats.wordsCompleted++;
            correctChars += word.text.length;
            word.destroy();
            
            if (playerStats.wordsCompleted % 10 === 0) {
                playerStats.level++;
            }
        }
    });
    
    fallingWords = fallingWords.filter(word => word.isActive);
}

function handleKeyPress(event) {
    if (gameState !== 'playing') return;
    
    const char = event.key;
    
    if (char.length === 1 && /[a-zA-Z]/.test(char)) {
        event.preventDefault();
        totalChars++;
        let typed = false;
        
        for (const word of fallingWords) {
            if (word.typeCharacter(char)) {
                correctChars++;
                typed = true;
                break;
            }
        }
        
        if (!typed) {
            playerStats.lives = Math.max(0, playerStats.lives - 0.1);
        }
    }
}

function updateStats() {
    const timeInMinutes = (Date.now() - gameStartTime) / 60000;
    playerStats.wpm = ScoreManager.calculateWPM(playerStats.wordsCompleted, timeInMinutes);
    playerStats.accuracy = ScoreManager.calculateAccuracy(correctChars, totalChars);
}

function updateUI() {
    const scoreElement = document.getElementById('score');
    const livesElement = document.getElementById('lives');
    const levelElement = document.getElementById('level');
    const wpmElement = document.getElementById('wpm');
    const accuracyElement = document.getElementById('accuracy');
    
    if (scoreElement) scoreElement.textContent = ScoreManager.formatScore(playerStats.score);
    if (livesElement) livesElement.textContent = Math.ceil(playerStats.lives).toString();
    if (levelElement) levelElement.textContent = playerStats.level.toString();
    if (wpmElement) wpmElement.textContent = playerStats.wpm.toString();
    if (accuracyElement) accuracyElement.textContent = `${playerStats.accuracy}%`;
}

function endGame() {
    gameState = 'game-over';
    
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    fallingWords.forEach(word => word.destroy());
    fallingWords = [];
    
    if (ScoreManager.isHighScore(playerStats.score)) {
        showHighScoreDialog();
    } else {
        showGameOverDialog();
    }
}

function showHighScoreDialog() {
    const playerName = prompt('New High Score! Enter your name:') || 'Anonymous';
    
    const highScore = {
        name: playerName,
        score: playerStats.score,
        level: currentDifficulty,
        date: new Date().toISOString(),
        wpm: playerStats.wpm
    };
    
    ScoreManager.saveScore(highScore);
    updateLeaderboard();
    showGameOverDialog();
}

function showGameOverDialog() {
    const dialog = document.getElementById('game-over-dialog');
    const finalScore = document.getElementById('final-score');
    const finalWpm = document.getElementById('final-wpm');
    const finalAccuracy = document.getElementById('final-accuracy');
    
    if (dialog && finalScore && finalWpm && finalAccuracy) {
        finalScore.textContent = ScoreManager.formatScore(playerStats.score);
        finalWpm.textContent = playerStats.wpm.toString();
        finalAccuracy.textContent = `${playerStats.accuracy}%`;
        dialog.style.display = 'block';
    }
}

function pauseGame() {
    if (gameState === 'playing') {
        gameState = 'paused';
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }
}

function resumeGame() {
    if (gameState === 'paused') {
        gameState = 'playing';
        lastUpdateTime = Date.now();
        gameLoop();
    }
}

function resetGame() {
    gameState = 'menu';
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    fallingWords.forEach(word => word.destroy());
    fallingWords = [];
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function updateLeaderboard() {
    updateLeaderboardContent('beginner');
}

function updateLeaderboardContent(difficulty) {
    const content = document.getElementById('leaderboard-content');
    if (!content) return;

    const scores = ScoreManager.getHighScoresByDifficulty(difficulty);
    
    if (scores.length === 0) {
        content.innerHTML = '<div class="no-scores">No scores yet. Be the first!</div>';
        return;
    }

    content.innerHTML = scores.map((score, index) => `
        <div class="leaderboard-entry ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}">
            <span class="rank">${index + 1}</span>
            <span class="player-name">${score.name}</span>
            <span class="score">${ScoreManager.formatScore(score.score)}</span>
            <span class="wpm">${score.wpm} WPM</span>
            <span class="date">${new Date(score.date).toLocaleDateString()}</span>
        </div>
    `).join('');
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Content Loaded');
    initializeGame();
});
