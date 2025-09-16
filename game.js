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

// Progression System
class ProgressionSystem {
    static progressionTiers = [
        { level: 1, title: 'Rookie Typist', icon: '🐣', requirement: 0, multiplier: 1.0 },
        { level: 5, title: 'Keyboard Novice', icon: '📝', requirement: 50, multiplier: 1.1 },
        { level: 10, title: 'Word Warrior', icon: '⚔️', requirement: 100, multiplier: 1.2 },
        { level: 15, title: 'Speed Demon', icon: '💨', requirement: 200, multiplier: 1.3 },
        { level: 20, title: 'Typing Master', icon: '🎯', requirement: 400, multiplier: 1.4 },
        { level: 25, title: 'Keyboard Legend', icon: '🏆', requirement: 600, multiplier: 1.5 },
        { level: 30, title: 'Typing Ninja', icon: '🥷', requirement: 1000, multiplier: 1.6 },
        { level: 40, title: 'Grandmaster', icon: '👑', requirement: 1500, multiplier: 1.8 },
        { level: 50, title: 'Legendary Typist', icon: '⭐', requirement: 2500, multiplier: 2.0 }
    ];

    static getCurrentTier(level) {
        let currentTier = this.progressionTiers[0];
        for (const tier of this.progressionTiers) {
            if (level >= tier.level) {
                currentTier = tier;
            } else {
                break;
            }
        }
        return currentTier;
    }

    static getNextTier(level) {
        for (const tier of this.progressionTiers) {
            if (level < tier.level) {
                return tier;
            }
        }
        return null; // Max level reached
    }

    static getProgressToNextTier(level, wordsCompleted) {
        const nextTier = this.getNextTier(level);
        if (!nextTier) return 100; // Max level

        const currentTier = this.getCurrentTier(level);
        const progress = ((wordsCompleted - currentTier.requirement) / 
                         (nextTier.requirement - currentTier.requirement)) * 100;
        return Math.max(0, Math.min(100, progress));
    }

    static calculateScoreMultiplier(level) {
        const tier = this.getCurrentTier(level);
        return tier.multiplier;
    }

    static createProgressionDisplay() {
        const gameHeader = document.querySelector('.game-header');
        if (!gameHeader) return;

        // Check if progression display already exists
        if (document.getElementById('progression-display')) return;

        const progressionDisplay = document.createElement('div');
        progressionDisplay.id = 'progression-display';
        progressionDisplay.className = 'progression-display';
        progressionDisplay.innerHTML = `
            <div class="tier-info">
                <div class="tier-icon" id="tier-icon">🐣</div>
                <div class="tier-details">
                    <div class="tier-title" id="tier-title">Rookie Typist</div>
                    <div class="tier-progress">
                        <div class="tier-progress-bar">
                            <div class="tier-progress-fill" id="tier-progress-fill"></div>
                        </div>
                        <div class="tier-progress-text" id="tier-progress-text">0/50</div>
                    </div>
                </div>
            </div>
        `;

        // Insert between stats
        const statsCenter = gameHeader.querySelector('.stats-center');
        if (statsCenter) {
            gameHeader.insertBefore(progressionDisplay, statsCenter);
        }
    }

    static updateProgressionDisplay(level, wordsCompleted) {
        const tierIcon = document.getElementById('tier-icon');
        const tierTitle = document.getElementById('tier-title');
        const tierProgressFill = document.getElementById('tier-progress-fill');
        const tierProgressText = document.getElementById('tier-progress-text');

        if (!tierIcon || !tierTitle || !tierProgressFill || !tierProgressText) return;

        const currentTier = this.getCurrentTier(level);
        const nextTier = this.getNextTier(level);
        const progress = this.getProgressToNextTier(level, wordsCompleted);

        tierIcon.textContent = currentTier.icon;
        tierTitle.textContent = currentTier.title;
        tierProgressFill.style.width = `${progress}%`;

        if (nextTier) {
            tierProgressText.textContent = `${wordsCompleted}/${nextTier.requirement}`;
        } else {
            tierProgressText.textContent = 'MAX LEVEL';
            tierProgressFill.style.width = '100%';
        }

        // Add tier change animation
        if (this.lastLevel !== undefined && level > this.lastLevel) {
            this.animateTierChange(currentTier);
        }
        this.lastLevel = level;
    }

    static animateTierChange(tier) {
        const tierIcon = document.getElementById('tier-icon');
        const tierTitle = document.getElementById('tier-title');
        
        if (tierIcon && tierTitle) {
            tierIcon.style.animation = 'tierUpgrade 1s ease-in-out';
            tierTitle.style.animation = 'tierUpgrade 1s ease-in-out';
            
            // Create tier up notification
            this.showTierUpNotification(tier);
            
            setTimeout(() => {
                tierIcon.style.animation = '';
                tierTitle.style.animation = '';
            }, 1000);
        }
    }

    static showTierUpNotification(tier) {
        const notification = document.createElement('div');
        notification.className = 'tier-up-notification';
        notification.innerHTML = `
            <div class="tier-up-content">
                <div class="tier-up-icon">${tier.icon}</div>
                <div class="tier-up-text">
                    <div class="tier-up-title">TIER UP!</div>
                    <div class="tier-up-name">${tier.title}</div>
                    <div class="tier-up-bonus">+${Math.round((tier.multiplier - 1) * 100)}% Score Bonus</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove after 4 seconds
        setTimeout(() => {
            notification.classList.add('hide');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 4000);
    }

    static reset() {
        this.lastLevel = undefined;
    }
}

// Theme System
class ThemeManager {
    static STORAGE_KEY = 'typing-ninja-theme';
    static currentTheme = 'space';
    static themes = {
        space: {
            id: 'space',
            name: 'Space',
            icon: '🌌',
            description: 'Journey through the cosmos',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            gameBackground: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
            wordColor: 'rgba(255, 255, 255, 0.95)',
            textColor: '#fff'
        },
        neon: {
            id: 'neon',
            name: 'Neon',
            icon: '🌈',
            description: 'Cyberpunk vibes',
            background: 'linear-gradient(135deg, #ff006e 0%, #8338ec 50%, #3a86ff 100%)',
            gameBackground: 'linear-gradient(135deg, #1a0033 0%, #330066 50%, #0066cc 100%)',
            wordColor: 'rgba(255, 20, 147, 0.9)',
            textColor: '#ff1493'
        },
        forest: {
            id: 'forest',
            name: 'Forest',
            icon: '🌲',
            description: 'Nature\'s tranquility',
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            gameBackground: 'linear-gradient(135deg, #0f4c3a 0%, #2d5a3d 100%)',
            wordColor: 'rgba(255, 255, 255, 0.95)',
            textColor: '#fff'
        },
        sunset: {
            id: 'sunset',
            name: 'Sunset',
            icon: '🌅',
            description: 'Golden hour magic',
            background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
            gameBackground: 'linear-gradient(135deg, #ff6b6b 0%, #ffa726 50%, #ff8a80 100%)',
            wordColor: 'rgba(255, 255, 255, 0.95)',
            textColor: '#fff'
        },
        ocean: {
            id: 'ocean',
            name: 'Ocean',
            icon: '🌊',
            description: 'Deep blue serenity',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            gameBackground: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
            wordColor: 'rgba(255, 255, 255, 0.95)',
            textColor: '#fff'
        },
        dark: {
            id: 'dark',
            name: 'Dark',
            icon: '🌙',
            description: 'Minimal dark mode',
            background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
            gameBackground: 'linear-gradient(135deg, #1a252f 0%, #2c3e50 100%)',
            wordColor: 'rgba(236, 240, 241, 0.95)',
            textColor: '#ecf0f1'
        }
    };

    static initialize() {
        this.loadTheme();
        this.createThemeSelector();
    }

    static loadTheme() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored && this.themes[stored]) {
                this.currentTheme = stored;
            }
        } catch (error) {
            console.warn('Could not load theme:', error);
        }
        this.applyTheme(this.currentTheme);
    }

    static saveTheme() {
        localStorage.setItem(this.STORAGE_KEY, this.currentTheme);
    }

    static setTheme(themeId) {
        if (this.themes[themeId]) {
            this.currentTheme = themeId;
            this.applyTheme(themeId);
            this.saveTheme();
            this.updateThemeSelector();
        }
    }

    static applyTheme(themeId) {
        const theme = this.themes[themeId];
        if (!theme) return;

        const root = document.documentElement;
        
        // Apply CSS custom properties
        root.style.setProperty('--theme-background', theme.background);
        root.style.setProperty('--theme-game-background', theme.gameBackground);
        root.style.setProperty('--theme-word-color', theme.wordColor);
        root.style.setProperty('--theme-text-color', theme.textColor);

        // Apply to body
        document.body.style.background = theme.background;
        
        // Apply to game screen
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) {
            gameScreen.style.background = theme.gameBackground;
        }

        // Update falling words
        document.querySelectorAll('.falling-word').forEach(word => {
            if (!word.classList.contains('lightning')) {
                word.style.background = theme.wordColor;
            }
        });

        // Update theme-dependent elements
        this.updateThemeElements(theme);
    }

    static updateThemeElements(theme) {
        // Update particle colors based on theme
        if (theme.id === 'neon') {
            ParticleSystem.themeColors = {
                success: ['#ff1493', '#00ffff', '#ff00ff', '#ffff00'],
                error: ['#ff0066', '#ff3399'],
                levelUp: ['#ff1493', '#00ffff', '#ff00ff'],
                combo: ['#8a2be2', '#ff1493', '#00ffff']
            };
        } else if (theme.id === 'forest') {
            ParticleSystem.themeColors = {
                success: ['#228b22', '#32cd32', '#00ff7f', '#98fb98'],
                error: ['#dc143c', '#ff6347'],
                levelUp: ['#ffd700', '#ffff00', '#f0e68c'],
                combo: ['#9370db', '#dda0dd', '#ee82ee']
            };
        } else {
            // Default space theme colors
            ParticleSystem.themeColors = {
                success: ['#28a745', '#20c997', '#17a2b8', '#ffc107'],
                error: ['#dc3545', '#fd7e14', '#e83e8c'],
                levelUp: ['#ffd700', '#ffed4e', '#fff3cd', '#f8f9fa'],
                combo: ['#6f42c1', '#e83e8c', '#fd7e14', '#ffc107']
            };
        }
    }

    static createThemeSelector() {
        // Add theme selector to settings
        const settingsContainer = document.querySelector('.settings-container');
        if (!settingsContainer) return;

        const themeSection = document.createElement('div');
        themeSection.className = 'setting-section';
        themeSection.innerHTML = `
            <h3>🎨 Theme</h3>
            <div class="theme-grid" id="theme-grid">
                ${Object.values(this.themes).map(theme => `
                    <div class="theme-option ${theme.id === this.currentTheme ? 'selected' : ''}" 
                         data-theme="${theme.id}"
                         style="background: ${theme.background}">
                        <div class="theme-icon">${theme.icon}</div>
                        <div class="theme-name">${theme.name}</div>
                    </div>
                `).join('')}
            </div>
        `;

        // Insert before existing settings
        const firstSetting = settingsContainer.querySelector('.setting-item');
        if (firstSetting) {
            settingsContainer.insertBefore(themeSection, firstSetting);
        } else {
            settingsContainer.appendChild(themeSection);
        }

        // Add event listeners
        themeSection.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                const themeId = option.dataset.theme;
                this.setTheme(themeId);
            });
        });
    }

    static updateThemeSelector() {
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
            option.classList.toggle('selected', option.dataset.theme === this.currentTheme);
        });
    }

    static getRandomTheme() {
        const themeIds = Object.keys(this.themes);
        const randomId = themeIds[Math.floor(Math.random() * themeIds.length)];
        return randomId;
    }

    static cycleTheme() {
        const themeIds = Object.keys(this.themes);
        const currentIndex = themeIds.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themeIds.length;
        this.setTheme(themeIds[nextIndex]);
    }
}

// Power-ups System
class PowerUpSystem {
    static activePowerUps = [];
    static powerUpTypes = {
        timeFreeze: {
            id: 'timeFreeze',
            name: 'Time Freeze',
            icon: '❄️',
            duration: 5000,
            cooldown: 30000,
            description: 'Freezes all falling words',
            rarity: 0.1
        },
        doublePoints: {
            id: 'doublePoints',
            name: 'Double Points',
            icon: '✨',
            duration: 10000,
            cooldown: 20000,
            description: 'Double points for all words',
            rarity: 0.15
        },
        wordHighlight: {
            id: 'wordHighlight',
            name: 'Word Highlight',
            icon: '💡',
            duration: 15000,
            cooldown: 25000,
            description: 'Highlights next letter to type',
            rarity: 0.12
        },
        shield: {
            id: 'shield',
            name: 'Shield',
            icon: '🛡️',
            duration: 8000,
            cooldown: 35000,
            description: 'Prevents life loss',
            rarity: 0.08
        }
    };
    static lastPowerUpSpawn = 0;
    static powerUpElements = [];

    static spawnPowerUp(gameContainer, currentTime) {
        const timeSinceLastSpawn = currentTime - this.lastPowerUpSpawn;
        
        // Spawn power-up every 15-25 seconds
        if (timeSinceLastSpawn >= 15000 + Math.random() * 10000) {
            const powerUpTypes = Object.values(this.powerUpTypes);
            const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
            
            // Random chance based on rarity
            if (Math.random() < randomType.rarity) {
                this.createPowerUpElement(gameContainer, randomType);
                this.lastPowerUpSpawn = currentTime;
            }
        }
    }

    static createPowerUpElement(gameContainer, powerUpType) {
        const containerWidth = gameContainer.offsetWidth || 800;
        const x = Math.random() * (containerWidth - 80);

        const powerUpElement = document.createElement('div');
        powerUpElement.className = 'power-up';
        powerUpElement.dataset.type = powerUpType.id;
        powerUpElement.style.left = `${x}px`;
        powerUpElement.style.top = '0px';
        powerUpElement.innerHTML = `
            <div class="power-up-icon">${powerUpType.icon}</div>
            <div class="power-up-name">${powerUpType.name}</div>
            <div class="power-up-key">SPACE</div>
        `;

        const activatePowerUp = () => {
            this.activatePowerUp(powerUpType);
            SoundManager.playSound('powerUp');
            this.removePowerUpElement(powerUpElement);
            
            // Create pickup effect
            const rect = powerUpElement.getBoundingClientRect();
            const gameRect = gameContainer.getBoundingClientRect();
            const relativeX = rect.left - gameRect.left + rect.width / 2;
            const relativeY = rect.top - gameRect.top + rect.height / 2;
            ParticleSystem.createParticle(relativeX, relativeY, 'combo');
        };

        // Mouse click activation
        powerUpElement.addEventListener('click', activatePowerUp);

        // Store reference for keyboard activation
        powerUpElement.activatePowerUp = activatePowerUp;

        gameContainer.appendChild(powerUpElement);
        this.powerUpElements.push({
            element: powerUpElement,
            speed: 20 + Math.random() * 30,
            type: powerUpType
        });
    }

    static updatePowerUps(deltaTime, gameContainer) {
        // Update falling power-ups
        this.powerUpElements = this.powerUpElements.filter(powerUp => {
            const currentTop = parseFloat(powerUp.element.style.top);
            const newTop = currentTop + powerUp.speed * deltaTime;
            
            if (newTop > gameContainer.offsetHeight) {
                this.removePowerUpElement(powerUp.element);
                return false;
            }
            
            powerUp.element.style.top = `${newTop}px`;
            return true;
        });

        // Update active power-ups
        this.activePowerUps = this.activePowerUps.filter(powerUp => {
            const timeLeft = powerUp.endTime - Date.now();
            
            if (timeLeft <= 0) {
                this.deactivatePowerUp(powerUp);
                return false;
            }
            
            this.updatePowerUpUI(powerUp, timeLeft);
            return true;
        });
    }

    static activatePowerUp(powerUpType) {
        const endTime = Date.now() + powerUpType.duration;
        
        const activePowerUp = {
            type: powerUpType,
            endTime: endTime,
            id: `powerup-${Date.now()}-${Math.random()}`
        };

        this.activePowerUps.push(activePowerUp);
        this.createPowerUpUI(activePowerUp);
        
        // Apply power-up effects
        switch (powerUpType.id) {
            case 'timeFreeze':
                this.freezeTime(true);
                break;
            case 'wordHighlight':
                this.enableWordHighlight(true);
                break;
            case 'shield':
                this.enableShield(true);
                break;
        }
    }

    static deactivatePowerUp(powerUp) {
        // Remove power-up effects
        switch (powerUp.type.id) {
            case 'timeFreeze':
                this.freezeTime(false);
                break;
            case 'wordHighlight':
                this.enableWordHighlight(false);
                break;
            case 'shield':
                this.enableShield(false);
                break;
        }

        this.removePowerUpUI(powerUp.id);
    }

    static freezeTime(enabled) {
        if (enabled) {
            document.documentElement.style.setProperty('--time-freeze', '0.1');
            document.querySelector('.game-area')?.classList.add('time-frozen');
        } else {
            document.documentElement.style.removeProperty('--time-freeze');
            document.querySelector('.game-area')?.classList.remove('time-frozen');
        }
    }

    static enableWordHighlight(enabled) {
        document.querySelector('.game-area')?.classList.toggle('word-highlight-active', enabled);
    }

    static enableShield(enabled) {
        document.querySelector('.game-area')?.classList.toggle('shield-active', enabled);
    }

    static isShieldActive() {
        return this.activePowerUps.some(p => p.type.id === 'shield');
    }

    static isDoublePointsActive() {
        return this.activePowerUps.some(p => p.type.id === 'doublePoints');
    }

    static createPowerUpUI(powerUp) {
        const uiContainer = document.querySelector('.game-controls') || document.querySelector('.game-header');
        if (!uiContainer) return;

        const uiElement = document.createElement('div');
        uiElement.className = 'active-power-up';
        uiElement.id = powerUp.id;
        uiElement.innerHTML = `
            <div class="power-up-ui-icon">${powerUp.type.icon}</div>
            <div class="power-up-ui-timer">
                <div class="power-up-ui-name">${powerUp.type.name}</div>
                <div class="power-up-ui-time">5s</div>
            </div>
            <div class="power-up-ui-progress">
                <div class="power-up-ui-progress-bar"></div>
            </div>
        `;

        uiContainer.appendChild(uiElement);
    }

    static updatePowerUpUI(powerUp, timeLeft) {
        const uiElement = document.getElementById(powerUp.id);
        if (!uiElement) return;

        const timeElement = uiElement.querySelector('.power-up-ui-time');
        const progressBar = uiElement.querySelector('.power-up-ui-progress-bar');
        
        if (timeElement) {
            timeElement.textContent = `${Math.ceil(timeLeft / 1000)}s`;
        }
        
        if (progressBar) {
            const progress = (timeLeft / powerUp.type.duration) * 100;
            progressBar.style.width = `${progress}%`;
        }
    }

    static removePowerUpUI(powerUpId) {
        const uiElement = document.getElementById(powerUpId);
        if (uiElement && uiElement.parentNode) {
            uiElement.parentNode.removeChild(uiElement);
        }
    }

    static removePowerUpElement(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }

    static clearAll() {
        // Clear active power-ups
        this.activePowerUps.forEach(powerUp => {
            this.deactivatePowerUp(powerUp);
        });
        this.activePowerUps = [];

        // Clear power-up elements
        this.powerUpElements.forEach(powerUp => {
            this.removePowerUpElement(powerUp.element);
        });
        this.powerUpElements = [];

        // Clear effects
        this.freezeTime(false);
        this.enableWordHighlight(false);
        this.enableShield(false);
    }

    static reset() {
        this.clearAll();
        this.lastPowerUpSpawn = 0;
    }
}

// Achievement System
class AchievementSystem {
    static STORAGE_KEY = 'typing-ninja-achievements';
    static achievements = {
        // Speed achievements
        speedDemon: { 
            id: 'speedDemon', 
            name: 'Speed Demon', 
            description: 'Reach 60+ WPM', 
            icon: '🚀', 
            unlocked: false,
            check: (stats) => stats.wpm >= 60
        },
        lightningFast: { 
            id: 'lightningFast', 
            name: 'Lightning Fast', 
            description: 'Reach 80+ WPM', 
            icon: '⚡', 
            unlocked: false,
            check: (stats) => stats.wpm >= 80
        },
        supersonic: { 
            id: 'supersonic', 
            name: 'Supersonic', 
            description: 'Reach 100+ WPM', 
            icon: '🌟', 
            unlocked: false,
            check: (stats) => stats.wpm >= 100
        },

        // Accuracy achievements
        perfectionist: { 
            id: 'perfectionist', 
            name: 'Perfectionist', 
            description: 'Achieve 95%+ accuracy', 
            icon: '🎯', 
            unlocked: false,
            check: (stats) => stats.accuracy >= 95
        },
        flawless: { 
            id: 'flawless', 
            name: 'Flawless', 
            description: 'Achieve 100% accuracy', 
            icon: '💎', 
            unlocked: false,
            check: (stats) => stats.accuracy >= 100
        },

        // Endurance achievements
        wordMaster: { 
            id: 'wordMaster', 
            name: 'Word Master', 
            description: 'Type 100 words in one session', 
            icon: '📚', 
            unlocked: false,
            check: (stats) => stats.wordsCompleted >= 100
        },
        marathon: { 
            id: 'marathon', 
            name: 'Marathon', 
            description: 'Type 500 words in one session', 
            icon: '🏃', 
            unlocked: false,
            check: (stats) => stats.wordsCompleted >= 500
        },
        
        // Level achievements
        ascended: { 
            id: 'ascended', 
            name: 'Ascended', 
            description: 'Reach level 10', 
            icon: '🗻', 
            unlocked: false,
            check: (stats) => stats.level >= 10
        },
        legendary: { 
            id: 'legendary', 
            name: 'Legendary', 
            description: 'Reach level 25', 
            icon: '👑', 
            unlocked: false,
            check: (stats) => stats.level >= 25
        },

        // Score achievements
        highScorer: { 
            id: 'highScorer', 
            name: 'High Scorer', 
            description: 'Score 10,000+ points', 
            icon: '🏆', 
            unlocked: false,
            check: (stats) => stats.score >= 10000
        },
        pointMaster: { 
            id: 'pointMaster', 
            name: 'Point Master', 
            description: 'Score 50,000+ points', 
            icon: '💰', 
            unlocked: false,
            check: (stats) => stats.score >= 50000
        },

        // Special achievements
        survivor: { 
            id: 'survivor', 
            name: 'Survivor', 
            description: 'Complete a game with 1 life remaining', 
            icon: '❤️', 
            unlocked: false,
            check: (stats) => Math.ceil(stats.lives) === 1 && stats.wordsCompleted >= 10
        },
        comeback: { 
            id: 'comeback', 
            name: 'Comeback Kid', 
            description: 'Win after losing 2 lives', 
            icon: '🔥', 
            unlocked: false,
            check: (stats, gameData) => gameData && gameData.maxLivesLost >= 2 && stats.wordsCompleted >= 20
        }
    };

    static gameSessionData = {
        maxLivesLost: 0,
        startingLives: 3
    };

    static unlockedThisSession = [];

    static checkAchievements(stats) {
        const newUnlocks = [];
        
        Object.values(this.achievements).forEach(achievement => {
            if (!achievement.unlocked && achievement.check(stats, this.gameSessionData)) {
                achievement.unlocked = true;
                newUnlocks.push(achievement);
                this.unlockedThisSession.push(achievement);
            }
        });

        if (newUnlocks.length > 0) {
            this.saveAchievements();
            this.showAchievementNotifications(newUnlocks);
        }

        return newUnlocks;
    }

    static showAchievementNotifications(achievements) {
        achievements.forEach((achievement, index) => {
            setTimeout(() => {
                this.createAchievementNotification(achievement);
                SoundManager.playSound('powerUp');
            }, index * 500);
        });
    }

    static createAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-text">
                    <div class="achievement-title">Achievement Unlocked!</div>
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-desc">${achievement.description}</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove after 4 seconds
        setTimeout(() => {
            notification.classList.add('hide');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 4000);
    }

    static updateGameSessionData(stats) {
        const livesLost = this.gameSessionData.startingLives - Math.ceil(stats.lives);
        this.gameSessionData.maxLivesLost = Math.max(this.gameSessionData.maxLivesLost, livesLost);
    }

    static resetSession() {
        this.gameSessionData = {
            maxLivesLost: 0,
            startingLives: 3
        };
        this.unlockedThisSession = [];
    }

    static getUnlockedCount() {
        return Object.values(this.achievements).filter(a => a.unlocked).length;
    }

    static getTotalCount() {
        return Object.keys(this.achievements).length;
    }

    static getProgress() {
        return Math.round((this.getUnlockedCount() / this.getTotalCount()) * 100);
    }

    static saveAchievements() {
        const saveData = {};
        Object.keys(this.achievements).forEach(key => {
            saveData[key] = this.achievements[key].unlocked;
        });
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saveData));
    }

    static loadAchievements() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const saveData = JSON.parse(stored);
                Object.keys(saveData).forEach(key => {
                    if (this.achievements[key]) {
                        this.achievements[key].unlocked = saveData[key];
                    }
                });
            }
        } catch (error) {
            console.warn('Could not load achievements:', error);
        }
    }

    static clearAchievements() {
        Object.values(this.achievements).forEach(achievement => {
            achievement.unlocked = false;
        });
        localStorage.removeItem(this.STORAGE_KEY);
    }
}

// Particle Effects System
class ParticleSystem {
    static particles = [];
    static canvas = null;
    static ctx = null;
    static themeColors = {
        success: ['#28a745', '#20c997', '#17a2b8', '#ffc107'],
        error: ['#dc3545', '#fd7e14', '#e83e8c'],
        levelUp: ['#ffd700', '#ffed4e', '#fff3cd', '#f8f9fa'],
        combo: ['#6f42c1', '#e83e8c', '#fd7e14', '#ffc107']
    };

    static initialize() {
        try {
            // Create canvas for particles
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'particle-canvas';
            this.canvas.style.position = 'absolute';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.pointerEvents = 'none';
            this.canvas.style.zIndex = '999';
            
            this.ctx = this.canvas.getContext('2d');
            
            // Insert canvas into game area
            const gameArea = document.querySelector('.game-area');
            if (gameArea) {
                gameArea.appendChild(this.canvas);
                this.resizeCanvas();
            }
            
            // Start animation loop
            this.animateParticles();
            
            // Resize canvas when window resizes
            window.addEventListener('resize', () => this.resizeCanvas());
        } catch (error) {
            console.warn('Particle system initialization failed:', error);
        }
    }

    static resizeCanvas() {
        if (!this.canvas) return;
        
        const gameArea = document.querySelector('.game-area');
        if (gameArea) {
            this.canvas.width = gameArea.offsetWidth;
            this.canvas.height = gameArea.offsetHeight;
        }
    }

    static createParticle(x, y, type = 'success') {
        const particleColors = this.themeColors[type] || this.themeColors.success;
        const particleCount = type === 'levelUp' ? 15 : type === 'combo' ? 10 : 5;

        for (let i = 0; i < particleCount; i++) {
            const particle = {
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4 - 2,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.02,
                size: 2 + Math.random() * 4,
                color: particleColors[Math.floor(Math.random() * particleColors.length)],
                type: type
            };
            
            this.particles.push(particle);
        }
    }

    static createExplosion(x, y, intensity = 1) {
        const particleCount = 8 * intensity;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 2 + Math.random() * 3 * intensity;
            
            const particle = {
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: 0.015 + Math.random() * 0.015,
                size: 3 + Math.random() * 5 * intensity,
                color: `hsl(${45 + Math.random() * 60}, 100%, ${50 + Math.random() * 30}%)`,
                type: 'explosion'
            };
            
            this.particles.push(particle);
        }
    }

    static createTypingTrail(x, y) {
        const particle = {
            x: x + (Math.random() - 0.5) * 20,
            y: y + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 1,
            vy: -1 - Math.random(),
            life: 0.8,
            decay: 0.03,
            size: 1 + Math.random() * 2,
            color: `rgba(255, 255, 255, ${0.7 + Math.random() * 0.3})`,
            type: 'trail'
        };
        
        this.particles.push(particle);
    }

    static animateParticles() {
        if (!this.ctx) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // gravity
            
            // Update life
            particle.life -= particle.decay;
            
            // Remove dead particles
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            
            // Draw particle
            this.ctx.save();
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            
            if (particle.type === 'explosion' || particle.type === 'levelUp') {
                // Star shape for special particles
                this.drawStar(particle.x, particle.y, particle.size);
            } else {
                // Circle for regular particles
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            }
            
            this.ctx.fill();
            this.ctx.restore();
        }
        
        requestAnimationFrame(() => this.animateParticles());
    }

    static drawStar(x, y, size) {
        const spikes = 5;
        const outerRadius = size;
        const innerRadius = size * 0.5;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - outerRadius);
        
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes - Math.PI / 2;
            this.ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
        }
        
        this.ctx.closePath();
    }

    static clear() {
        this.particles = [];
    }
}

// Sound Management
class SoundManager {
    static STORAGE_KEY = 'typing-ninja-sound-settings';
    static sounds = {
        keyPress: null,
        wordComplete: null,
        levelUp: null,
        gameOver: null,
        powerUp: null,
        error: null,
        background: null
    };
    static isEnabled = true;
    static volume = 0.5;
    static backgroundMusicEnabled = true;

    static async initialize() {
        // Create audio context for better sound management
        try {
            // Note: Audio context may need user interaction to start in some browsers
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.loadSettings();
            this.createSounds();
            
            // Resume audio context on user interaction if needed
            if (this.audioContext.state === 'suspended') {
                document.addEventListener('click', () => {
                    if (this.audioContext.state === 'suspended') {
                        this.audioContext.resume();
                    }
                }, { once: true });
            }
        } catch (error) {
            console.warn('Audio not supported:', error);
        }
    }

    static createSounds() {
        // Create synthetic sounds using Web Audio API
        this.sounds.keyPress = this.createTone(800, 0.1, 'square');
        this.sounds.wordComplete = this.createSuccessSound();
        this.sounds.levelUp = this.createLevelUpSound();
        this.sounds.gameOver = this.createGameOverSound();
        this.sounds.powerUp = this.createPowerUpSound();
        this.sounds.error = this.createErrorSound();
    }

    static createTone(frequency, duration, type = 'sine') {
        if (!this.audioContext) return null;
        
        return () => {
            if (!this.isEnabled) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        };
    }

    static createSuccessSound() {
        return () => {
            if (!this.isEnabled || !this.audioContext) return;
            
            // Play ascending notes
            const notes = [523, 659, 784]; // C, E, G
            notes.forEach((freq, index) => {
                setTimeout(() => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                    oscillator.type = 'triangle';
                    
                    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(this.volume * 0.2, this.audioContext.currentTime + 0.01);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
                    
                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + 0.3);
                }, index * 50);
            });
        };
    }

    static createLevelUpSound() {
        return () => {
            if (!this.isEnabled || !this.audioContext) return;
            
            // Triumphant sound
            const notes = [261, 329, 392, 523, 659, 784]; // C, E, G, C, E, G (higher)
            notes.forEach((freq, index) => {
                setTimeout(() => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                    oscillator.type = 'sawtooth';
                    
                    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.01);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.4);
                    
                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + 0.4);
                }, index * 100);
            });
        };
    }

    static createGameOverSound() {
        return () => {
            if (!this.isEnabled || !this.audioContext) return;
            
            // Descending dramatic sound
            const notes = [392, 329, 261, 196]; // G, E, C, G (lower)
            notes.forEach((freq, index) => {
                setTimeout(() => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                    oscillator.type = 'square';
                    
                    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(this.volume * 0.4, this.audioContext.currentTime + 0.01);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.8);
                    
                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + 0.8);
                }, index * 200);
            });
        };
    }

    static createPowerUpSound() {
        return () => {
            if (!this.isEnabled || !this.audioContext) return;
            
            // Magical ascending sound
            let freq = 200;
            for (let i = 0; i < 10; i++) {
                setTimeout(() => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    oscillator.frequency.setValueAtTime(freq + i * 50, this.audioContext.currentTime);
                    oscillator.type = 'sine';
                    
                    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(this.volume * 0.2, this.audioContext.currentTime + 0.01);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
                    
                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + 0.2);
                }, i * 30);
            }
        };
    }

    static createErrorSound() {
        return () => {
            if (!this.isEnabled || !this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
            oscillator.type = 'sawtooth';
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.3);
        };
    }

    static playSound(soundName) {
        try {
            if (this.sounds[soundName] && this.isEnabled && this.audioContext) {
                this.sounds[soundName]();
            }
        } catch (error) {
            console.warn('Error playing sound:', error);
        }
    }

    static setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume / 100));
        this.saveSettings();
    }

    static toggleSound() {
        this.isEnabled = !this.isEnabled;
        this.saveSettings();
    }

    static saveSettings() {
        const settings = {
            isEnabled: this.isEnabled,
            volume: this.volume,
            backgroundMusicEnabled: this.backgroundMusicEnabled
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
    }

    static loadSettings() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const settings = JSON.parse(stored);
                this.isEnabled = settings.isEnabled !== false;
                this.volume = settings.volume || 0.5;
                this.backgroundMusicEnabled = settings.backgroundMusicEnabled !== false;
            }
        } catch (error) {
            console.warn('Could not load sound settings:', error);
        }
    }
}

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
    constructor(text, startX, speed, isLightning = false) {
        this.id = 'word-' + Date.now() + '-' + Math.random();
        this.text = text.toLowerCase();
        this.position = { x: startX, y: 0 };
        this.typedPrefix = '';
        this.speed = speed;
        this.isActive = true;
        this.isLightning = isLightning;
        this.element = null; // Initialize as null
        this.element = this.createElement();
    }

    createElement() {
        const wordElement = document.createElement('div');
        wordElement.className = `falling-word ${this.isLightning ? 'lightning' : ''}`;
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
    
    try {
        ParticleSystem.initialize();
        console.log('✅ Particle System initialized');
    } catch (error) {
        console.warn('⚠️ Particle System failed:', error);
    }
    
    setupEventListeners();
    updateLeaderboard();
    
    // Add debug info to console
    console.log('🎮 Game Features Status:');
    console.log('- Sound System:', SoundManager.isEnabled ? '✅ Enabled' : '❌ Disabled');
    console.log('- Achievements:', Object.keys(AchievementSystem.achievements).length, 'available');
    console.log('- Themes:', Object.keys(ThemeManager.themes).length, 'available');
    console.log('- Current Theme:', ThemeManager.currentTheme);
    console.log('- Power-ups:', Object.keys(PowerUpSystem.powerUpTypes).length, 'types available');
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

    document.getElementById('show-achievements')?.addEventListener('click', () => {
        updateAchievementsScreen();
        showScreen('achievements-screen');
    });

    document.getElementById('show-settings')?.addEventListener('click', () => {
        showScreen('settings-screen');
    });

    document.getElementById('back-to-menu')?.addEventListener('click', () => {
        showScreen('main-menu');
    });

    document.getElementById('achievements-back')?.addEventListener('click', () => {
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
    const muteCheckbox = document.getElementById('mute-checkbox');

    volumeSlider?.addEventListener('input', (e) => {
        const volume = parseInt(e.target.value);
        if (volumeValue) volumeValue.textContent = `${volume}%`;
        SoundManager.setVolume(volume);
    });

    muteCheckbox?.addEventListener('change', (e) => {
        SoundManager.toggleSound();
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
    
    // Debug shortcuts (only in development)
    document.addEventListener('keydown', (event) => {
        // Press 'T' to cycle themes quickly
        if (event.key.toLowerCase() === 't' && event.ctrlKey && gameState === 'menu') {
            ThemeManager.cycleTheme();
            console.log('🎨 Theme cycled to:', ThemeManager.currentTheme);
        }
        
        // Press 'A' to trigger test achievement
        if (event.key.toLowerCase() === 'a' && event.ctrlKey && gameState === 'menu') {
            const testStats = { wpm: 65, accuracy: 98, score: 15000, level: 12, wordsCompleted: 150 };
            AchievementSystem.checkAchievements(testStats);
            console.log('🏆 Test achievements triggered');
        }
        
        // Press 'P' to spawn test power-up
        if (event.key.toLowerCase() === 'p' && event.ctrlKey && gameState === 'playing') {
            const testPowerUp = PowerUpSystem.powerUpTypes.timeFreeze;
            PowerUpSystem.activatePowerUp(testPowerUp);
            console.log('⚡ Test power-up activated');
        }
    });
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
    
    // Reset achievement session data and power-ups
    AchievementSystem.resetSession();
    PowerUpSystem.reset();
    ProgressionSystem.reset();
    
    showScreen('game-screen');
    
    // Small delay to ensure the game screen is fully rendered
    setTimeout(() => {
        ProgressionSystem.createProgressionDisplay();
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
    
    // Update power-ups
    PowerUpSystem.spawnPowerUp(gameContainer, currentTime);
    PowerUpSystem.updatePowerUps(deltaTime, gameContainer);

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
        
        // Chance for lightning word (rare, high value)
        const isLightning = Math.random() < 0.05; // 5% chance
        
        // Get the actual container width
        const containerWidth = gameContainer.offsetWidth || gameContainer.clientWidth || 800;
        
        // Create the word first to measure its actual width
        const fallingWord = new FallingWord(word, 0, speed, isLightning);
        gameContainer.appendChild(fallingWord.element);
        
        // Force layout calculation
        fallingWord.element.offsetHeight;
        
        // Get actual word width
        const wordWidth = fallingWord.element.offsetWidth || 120;
        
        // Calculate safe positioning area
        const safeWidth = Math.max(containerWidth - wordWidth - 20, 0); // 20px margin
        const x = Math.random() * safeWidth;
        
        // Set final position
        fallingWord.position.x = x;
        fallingWord.element.style.left = `${x}px`;
        
        fallingWords.push(fallingWord);
        
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
            let points = word.text.length * 10 * playerStats.level;
            
            // Apply progression multiplier
            const progressionMultiplier = ProgressionSystem.calculateScoreMultiplier(playerStats.level);
            points = Math.round(points * progressionMultiplier);
            
            // Apply double points power-up
            if (PowerUpSystem.isDoublePointsActive()) {
                points *= 2;
            }
            
            // Bonus for lightning words
            if (word.isLightning) {
                points *= 3;
            }
            
            playerStats.score += points;
            playerStats.wordsCompleted++;
            correctChars += word.text.length;
            
            // Create particle effects
            const rect = word.element.getBoundingClientRect();
            const gameRect = gameContainer.getBoundingClientRect();
            const relativeX = rect.left - gameRect.left + rect.width / 2;
            const relativeY = rect.top - gameRect.top + rect.height / 2;
            
            if (word.isLightning) {
                ParticleSystem.createParticle(relativeX, relativeY, 'combo');
                ParticleSystem.createExplosion(relativeX, relativeY, 1.5);
            } else {
                ParticleSystem.createParticle(relativeX, relativeY, 'success');
                ParticleSystem.createExplosion(relativeX, relativeY, 0.8);
            }
            
            word.destroy();
            SoundManager.playSound('wordComplete');
            
            if (playerStats.wordsCompleted % 10 === 0) {
                playerStats.level++;
                ParticleSystem.createParticle(relativeX, relativeY, 'levelUp');
                SoundManager.playSound('levelUp');
            }
        }
    });
    
    fallingWords = fallingWords.filter(word => word.isActive);
}

function handleKeyPress(event) {
    if (gameState !== 'playing') return;
    
    const char = event.key;
    
    // Handle spacebar for power-up activation
    if (char === ' ') {
        event.preventDefault();
        
        // Find the lowest (most recent) power-up and activate it
        const availablePowerUps = PowerUpSystem.powerUpElements.filter(p => p.element.parentNode);
        if (availablePowerUps.length > 0) {
            // Sort by vertical position (lowest first)
            availablePowerUps.sort((a, b) => {
                const aTop = parseFloat(a.element.style.top);
                const bTop = parseFloat(b.element.style.top);
                return bTop - aTop; // Highest top value = lowest on screen
            });
            
            const powerUpToActivate = availablePowerUps[0];
            if (powerUpToActivate.element.activatePowerUp) {
                powerUpToActivate.element.activatePowerUp();
            }
        }
        return;
    }
    
    if (char.length === 1 && /[a-zA-Z]/.test(char)) {
        event.preventDefault();
        totalChars++;
        let typed = false;
        
        for (const word of fallingWords) {
            if (word.typeCharacter(char)) {
                correctChars++;
                typed = true;
                SoundManager.playSound('keyPress');
                
                // Create typing trail effect
                const rect = word.element.getBoundingClientRect();
                const gameRect = gameContainer.getBoundingClientRect();
                const relativeX = rect.left - gameRect.left + rect.width / 2;
                const relativeY = rect.top - gameRect.top + rect.height / 2;
                ParticleSystem.createTypingTrail(relativeX, relativeY);
                break;
            }
        }
        
        if (!typed) {
            // Check if shield is active
            if (!PowerUpSystem.isShieldActive()) {
                playerStats.lives = Math.max(0, playerStats.lives - 0.1);
            }
            SoundManager.playSound('error');
        }
    }
}

function updateStats() {
    const timeInMinutes = (Date.now() - gameStartTime) / 60000;
    playerStats.wpm = ScoreManager.calculateWPM(playerStats.wordsCompleted, timeInMinutes);
    playerStats.accuracy = ScoreManager.calculateAccuracy(correctChars, totalChars);
    
    // Update achievement tracking
    AchievementSystem.updateGameSessionData(playerStats);
    AchievementSystem.checkAchievements(playerStats);
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
    
    // Update progression display
    ProgressionSystem.updateProgressionDisplay(playerStats.level, playerStats.wordsCompleted);
}

function endGame() {
    gameState = 'game-over';
    
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    fallingWords.forEach(word => word.destroy());
    fallingWords = [];
    
    SoundManager.playSound('gameOver');
    
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
    ParticleSystem.clear();
    PowerUpSystem.clearAll();
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

function updateAchievementsScreen() {
    const progressElement = document.getElementById('achievement-progress');
    const unlockedCountElement = document.getElementById('unlocked-count');
    const totalCountElement = document.getElementById('total-count');
    const progressFillElement = document.getElementById('progress-fill');
    const achievementsGrid = document.getElementById('achievements-grid');

    if (!achievementsGrid) return;

    const progress = AchievementSystem.getProgress();
    const unlockedCount = AchievementSystem.getUnlockedCount();
    const totalCount = AchievementSystem.getTotalCount();

    if (progressElement) progressElement.textContent = progress;
    if (unlockedCountElement) unlockedCountElement.textContent = unlockedCount;
    if (totalCountElement) totalCountElement.textContent = totalCount;
    if (progressFillElement) progressFillElement.style.width = `${progress}%`;

    achievementsGrid.innerHTML = Object.values(AchievementSystem.achievements).map(achievement => `
        <div class="achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}">
            ${achievement.unlocked ? '<div class="achievement-badge">✓</div>' : ''}
            <div class="achievement-card-icon">${achievement.unlocked ? achievement.icon : '🔒'}</div>
            <div class="achievement-card-name">${achievement.name}</div>
            <div class="achievement-card-desc">${achievement.description}</div>
        </div>
    `).join('');
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM Content Loaded');
    
    try {
        console.log('🔊 Initializing Sound System...');
        await SoundManager.initialize();
        console.log('✅ Sound System initialized');
    } catch (error) {
        console.warn('⚠️ Sound System failed:', error);
    }
    
    try {
        console.log('🏆 Loading Achievements...');
        AchievementSystem.loadAchievements();
        console.log('✅ Achievements loaded');
    } catch (error) {
        console.warn('⚠️ Achievements failed:', error);
    }
    
    try {
        console.log('🎨 Initializing Theme System...');
        ThemeManager.initialize();
        console.log('✅ Theme System initialized');
    } catch (error) {
        console.warn('⚠️ Theme System failed:', error);
    }
    
    try {
        console.log('🎮 Initializing Game...');
        initializeGame();
        console.log('✅ Game initialization complete!');
        
        // Add debug controls for testing
        addDebugControls();
    } catch (error) {
        console.error('❌ Game initialization failed:', error);
    }
});

// Debug controls for testing
function addDebugControls() {
    const debugPanel = document.createElement('div');
    debugPanel.id = 'debug-panel';
    debugPanel.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-size: 12px;
        z-index: 10000;
        display: none;
    `;
    debugPanel.innerHTML = `
        <div>🎮 Typing Ninja Debug Panel</div>
        <button onclick="testAchievements()" style="margin: 2px;">Test Achievements</button>
        <button onclick="testPowerUps()" style="margin: 2px;">Test Power-ups</button>
        <button onclick="testSounds()" style="margin: 2px;">Test Sounds</button>
        <button onclick="testThemes()" style="margin: 2px;">Test Themes</button>
        <button onclick="toggleDebugPanel()" style="margin: 2px;">Hide</button>
    `;
    document.body.appendChild(debugPanel);
    
    // Add keyboard shortcut to toggle debug panel
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F12' || (e.ctrlKey && e.key === 'd')) {
            e.preventDefault();
            toggleDebugPanel();
        }
    });
    
    console.log('🛠️ Debug controls added! Press Ctrl+D or F12 to open debug panel');
}

function toggleDebugPanel() {
    const panel = document.getElementById('debug-panel');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
}

// Test functions
function testAchievements() {
    console.log('🧪 Testing Achievements...');
    // Simulate high WPM achievement
    playerStats.wpm = 65;
    AchievementSystem.checkAchievements(playerStats);
}

function testPowerUps() {
    console.log('🧪 Testing Power-ups...');
    if (gameContainer) {
        PowerUpSystem.createPowerUpElement(gameContainer, PowerUpSystem.powerUpTypes.timeFreeze);
    }
}

function testSounds() {
    console.log('🧪 Testing Sounds...');
    SoundManager.playSound('keyPress');
    setTimeout(() => SoundManager.playSound('wordComplete'), 500);
    setTimeout(() => SoundManager.playSound('levelUp'), 1000);
}

function testThemes() {
    console.log('🧪 Testing Themes...');
    const themes = Object.keys(ThemeManager.themes);
    const currentIndex = themes.indexOf(ThemeManager.currentTheme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    ThemeManager.setTheme(nextTheme);
    console.log(`Switched to theme: ${nextTheme}`);
}
