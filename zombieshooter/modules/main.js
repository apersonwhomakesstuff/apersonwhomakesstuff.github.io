import { initializeSettings } from './settings.js';
import { initializeAudio } from './audio.js';
import { initializePlayer } from './player.js';
import { initializeZombies } from './zombies.js';
import { initializeBullets } from './bullets.js';
import { startGame } from './game.js';

// Global game state and configuration
const gameState = {
    canvas: null,
    ctx: null,
    score: 0,
    highScore: parseInt(localStorage.getItem('zombie-shooter-high-score') || '0'),
    gameOver: false,
    animationFrameId: null,
    zombieSpawnRate: 2000,
    isMobile: false
};

// Initialize function to set up the entire game
function initialize() {
    // Detect mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    gameState.isMobile = isMobile;

    // Set up canvas
    const canvas = document.getElementById('gameCanvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');

    // Store references in game state
    gameState.canvas = canvas;
    gameState.ctx = ctx;

    // Initialize all game modules
    initializeSettings(gameState);
    initializeAudio(gameState);
    initializePlayer(gameState);
    initializeZombies(gameState);
    initializeBullets(gameState);

    // Update high score display
    const highScoreElement = document.getElementById('highScore');
    highScoreElement.textContent = gameState.highScore;

    // Set up event listeners
    setupEventListeners();
}

function setupEventListeners() {
    const startGameBtn = document.getElementById('startGameBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const highScoresBtn = document.getElementById('highScoresBtn');

    startGameBtn.addEventListener('click', () => {
        document.getElementById('mainMenu').style.display = 'none';
        startGame(gameState);
    });
    
    settingsBtn.addEventListener('click', openSettings);
    highScoresBtn.addEventListener('click', showHighScores);

    // Window resize listener
    window.addEventListener('resize', () => {
        if (gameState.canvas) {
            gameState.canvas.width = window.innerWidth;
            gameState.canvas.height = window.innerHeight;
        }
    });
}

function openSettings() {
    const settingsModal = document.getElementById('settingsModal');
    settingsModal.style.display = 'flex';
}

function showHighScores() {
    alert(`High Score: ${gameState.highScore}`);
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);

// Export game state for potential cross-module access
export { gameState };