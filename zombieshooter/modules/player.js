export function initializePlayer(gameState) {
    const playerImage = new Image();
    playerImage.src = "/player.png";

    const player = {
        x: 0,
        y: 0,
        radius: 30,
        speed: 5,
        width: 50,
        height: 80,
        dx: 0,
        dy: 0,
        angle: 0,
        image: playerImage
    };

    function updatePosition(mouseX, mouseY) {
        const { settings, isMobile } = gameState;

        if (settings.platformerMode || isMobile) {
            const keysPressed = gameState.keysPressed || {};

            // If mobile, handle touch controls instead of keyboard
            if (isMobile) {
                // Handle touch controls here
            } else {
                player.dx = 0;
                player.dy = 0;

                if (keysPressed['a']) player.dx = -player.speed;
                if (keysPressed['d']) player.dx = player.speed;
                if (keysPressed['w']) player.dy = -player.speed;
                if (keysPressed['s']) player.dy = player.speed;

                // Normalize diagonal movement
                if (player.dx !== 0 && player.dy !== 0) {
                    const magnitude = Math.sqrt(player.dx * player.dx + player.dy * player.dy);
                    player.dx = (player.dx / magnitude) * player.speed;
                    player.dy = (player.dy / magnitude) * player.speed;
                }

                player.x += player.dx;
                player.y += player.dy;
            }
        } else {
            // Mouse-following movement
            const angle = Math.atan2(mouseY - player.y, mouseX - player.x);
            player.x += Math.cos(angle) * player.speed * 0.1;
            player.y += Math.sin(angle) * player.speed * 0.1;
        }

        // Rotate towards mouse
        player.angle = Math.atan2(mouseY - player.y, mouseX - player.x);

        // Clamp player to screen bounds
        player.x = Math.max(player.width / 2, Math.min(gameState.canvas.width - player.width / 2, player.x));
        player.y = Math.max(player.height / 2, Math.min(gameState.canvas.height - player.height / 2, player.y));
    }

    function draw(ctx) {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.angle);
        ctx.drawImage(player.image, -player.width/2, -player.height/2, player.width, player.height);
        ctx.restore();
    }

    // Attach player methods and state to game state
    gameState.player = player;
    gameState.playerMethods = {
        updatePosition,
        draw
    };
}