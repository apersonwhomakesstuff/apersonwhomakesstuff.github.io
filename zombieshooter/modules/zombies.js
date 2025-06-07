export function initializeZombies(gameState) {
    const zombieImage = new Image();
    zombieImage.src = "/zombie.png";

    const zombies = [];
    let lastZombieSpawn = 0;
    let zombieSpeed = 2;
    let zombieSpawnRate = 2000;

    function spawnZombie() {
        const { canvas } = gameState;
        const side = Math.floor(Math.random() * 4);
        let x, y;
        
        if (side === 0) { // top
            x = Math.random() * canvas.width;
            y = -50;
        } else if (side === 1) { // right
            x = canvas.width + 50;
            y = Math.random() * canvas.height;
        } else if (side === 2) { // bottom
            x = Math.random() * canvas.width;
            y = canvas.height + 50;
        } else { // left
            x = -50;
            y = Math.random() * canvas.height;
        }
        
        zombies.push({
            x: x,
            y: y,
            radius: 25,
            speed: zombieSpeed,
            image: zombieImage
        });
    }

    function updateZombies(player) {
        const { settings } = gameState;

        // Increase difficulty if hard mode is on
        if (settings.hardMode) {
            zombieSpeed = Math.min(zombieSpeed + 0.01, 5);
            zombieSpawnRate = Math.max(zombieSpawnRate - 10, 300);
        }

        for (let i = zombies.length - 1; i >= 0; i--) {
            const zombie = zombies[i];
            
            // Move zombie towards player
            const angle = Math.atan2(player.y - zombie.y, player.x - zombie.x);
            zombie.x += Math.cos(angle) * zombie.speed;
            zombie.y += Math.sin(angle) * zombie.speed;

            // Check for collision with player
            if (Math.hypot(player.x - zombie.x, player.y - zombie.y) < player.radius + zombie.radius) {
                return true; // Game over
            }
        }
        return false;
    }

    function drawZombies(ctx) {
        zombies.forEach(zombie => {
            const zombieWidth = 40;
            const zombieHeight = 60;
            const angle = Math.atan2(gameState.player.y - zombie.y, gameState.player.x - zombie.x);
            
            ctx.save();
            ctx.translate(zombie.x, zombie.y);
            ctx.rotate(angle + Math.PI / 2);
            ctx.drawImage(zombie.image, -zombieWidth / 2, -zombieHeight / 2, zombieWidth, zombieHeight);
            ctx.restore();
        });
    }

    // Attach zombie methods and state to game state
    gameState.zombies = zombies;
    gameState.zombieMethods = {
        spawnZombie,
        updateZombies,
        drawZombies
    };
}