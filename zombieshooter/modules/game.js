export function startGame(gameState) {
    const { canvas, ctx, audio, settings } = gameState;
    const { player } = gameState;
    const { spawnZombie, updateZombies, drawZombies } = gameState.zombieMethods;
    const { fireBullet, updateBullets, drawBullets } = gameState.bulletMethods;
    const { updatePosition, draw: drawPlayer } = gameState.playerMethods;

    // Reset game state
    gameState.score = 0;
    gameState.gameOver = false;
    gameState.zombies.length = 0;
    gameState.bullets.length = 0;

    // Update score display
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('highScore').textContent = gameState.highScore;

    // Position player in center
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;

    // Setup key tracking for platformer mode
    gameState.keysPressed = {};
    setupKeyListeners();

    // Setup mouse tracking
    let mouseX = canvas.width / 2;
    let mouseY = canvas.height / 2;
    setupMouseListener();

    // Initialize audio
    audio.setupAudioContext().then(() => {
        if (audio.state === 'suspended') audio.resume();
        if (settings.musicEnabled) audio.playMusic();
    });

    // Start game loop
    function gameLoop(timestamp) {
        if (gameState.gameOver) {
            endGame();
            return;
        }

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update player position
        updatePosition(mouseX, mouseY);

        // Draw player
        drawPlayer(ctx);

        // Spawn zombies periodically
        if (timestamp - (gameState.lastZombieSpawn || 0) > gameState.zombieSpawnRate) {
            spawnZombie();
            gameState.lastZombieSpawn = timestamp;
        }

        // Update and draw zombies
        const gameOverByZombies = updateZombies(player);
        if (gameOverByZombies) {
            gameState.gameOver = true;
            endGame();
            return;
        }
        drawZombies(ctx);

        // Update and draw bullets
        const scoreIncrease = updateBullets(gameState.zombies);
        gameState.score += scoreIncrease;
        
        // Update score display
        document.getElementById('score').textContent = gameState.score;
        document.getElementById('highScore').textContent = gameState.highScore;

        // Check if high score was broken
        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            document.getElementById('highScore').textContent = gameState.highScore;
        }
        
        drawBullets(ctx);

        // Draw aiming beam
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(mouseX, mouseY);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Request next frame
        gameState.animationFrameId = requestAnimationFrame(gameLoop);
    }

    function setupKeyListeners() {
        document.addEventListener('keydown', (e) => {
            if (settings.platformerMode) {
                gameState.keysPressed[e.key.toLowerCase()] = true;
            }
        });

        document.addEventListener('keyup', (e) => {
            if (settings.platformerMode) {
                gameState.keysPressed[e.key.toLowerCase()] = false;
            }
        });
    }

    function setupMouseListener() {
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX - canvas.offsetLeft;
            mouseY = e.clientY - canvas.offsetTop;
        });

        canvas.addEventListener('click', () => {
            if (gameState.gameOver) {
                startGame(gameState);
                return;
            }
            fireBullet(player, mouseX, mouseY);
        });
    }

    function endGame() {
        // Cancel any ongoing animation
        if (gameState.animationFrameId) {
            cancelAnimationFrame(gameState.animationFrameId);
        }

        // Display game over screen
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.shadowColor = 'red';
        ctx.font = 'bold 72px Impact';
        ctx.fillText('YOU DIED!', canvas.width / 2, canvas.height / 2 - 100);

        ctx.fillStyle = 'white';
        ctx.font = '28px Arial';
        ctx.fillText(`Points: ${gameState.score}`, canvas.width / 2, canvas.height / 2);
        ctx.fillText(`Kills: ${gameState.zombies.length}`, canvas.width / 2, canvas.height / 2 + 40);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '20px Arial';
        ctx.fillText('Press anywhere to return to Main Menu', canvas.width / 2, canvas.height / 2 + 100);

        ctx.restore();

        // Update high score
        const currentHighScore = parseInt(localStorage.getItem('zombie-shooter-high-score') || '0');
        if (gameState.score > currentHighScore) {
            localStorage.setItem('zombie-shooter-high-score', gameState.score.toString());
            gameState.highScore = gameState.score;
            document.getElementById('highScore').textContent = gameState.highScore;
        }

        // Set up click back to menu handler
        const returnToMenu = () => {
            canvas.removeEventListener('click', returnToMenu);
            document.getElementById('mainMenu').style.display = 'flex';
            document.getElementById('score').textContent = '0';
        }

        canvas.addEventListener('click', returnToMenu);
    }

    // Start the game loop
    gameState.animationFrameId = requestAnimationFrame(gameLoop);
}