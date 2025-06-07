export function initializeBullets(gameState) {
    const bulletImage = new Image();
    bulletImage.src = "/bullet.png";

    const bullets = [];

    function fireBullet(player, mouseX, mouseY) {
        const angle = Math.atan2(mouseY - player.y, mouseX - player.x);
        bullets.push({
            x: player.x,
            y: player.y,
            radius: 5,
            speed: 15,
            dx: Math.cos(angle) * 15,
            dy: Math.sin(angle) * 15,
            angle: angle,
            image: bulletImage
        });
    }

    function updateBullets(zombies) {
        let scoreIncrease = 0;
        
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            
            bullet.x += bullet.dx;
            bullet.y += bullet.dy;

            // Check for zombie collisions
            for (let j = zombies.length - 1; j >= 0; j--) {
                const zombie = zombies[j];
                const distToBullet = Math.hypot(bullet.x - zombie.x, bullet.y - zombie.y);
                
                if (distToBullet < zombie.radius + bullet.radius) {
                    zombies.splice(j, 1);
                    bullets.splice(i, 1);
                    scoreIncrease += gameState.settings.hardMode ? 25 : 15;  // Increased points values
                    break;
                }
            }

            // Remove bullets that go off-screen
            if (bullet.x < 0 || bullet.x > gameState.canvas.width || 
                bullet.y < 0 || bullet.y > gameState.canvas.height) {
                bullets.splice(i, 1);
            }
        }

        return scoreIncrease;
    }

    function drawBullets(ctx) {
        bullets.forEach(bullet => {
            const bulletWidth = 20;
            const bulletHeight = 10;
            
            ctx.save();
            ctx.translate(bullet.x, bullet.y);
            ctx.rotate(bullet.angle);
            ctx.drawImage(bullet.image, -bulletWidth / 2, -bulletHeight / 2, bulletWidth, bulletHeight);
            ctx.restore();
        });
    }

    // Attach bullet methods and state to game state
    gameState.bullets = bullets;
    gameState.bulletMethods = {
        fireBullet,
        updateBullets,
        drawBullets
    };
}