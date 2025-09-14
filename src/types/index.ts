export interface GameConfig {
    initialSpeed: number;
    speedIncrement: number;
    spawnRate: number;
    maxWords: number;
    lives: number;
}

export interface PlayerStats {
    score: number;
    lives: number;
    level: number;
    wordsCompleted: number;
    accuracy: number;
    wpm: number;
}

export interface Position {
    x: number;
    y: number;
}

export type Difficulty = 'beginner' | 'intermediate' | 'master' | 'ninja';
export type GameState = 'menu' | 'playing' | 'paused' | 'gameOver';

export interface HighScore {
    name: string;
    score: number;
    difficulty: Difficulty;
    date: string;
    wpm: number;
    accuracy: number;
}
