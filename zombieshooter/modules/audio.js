let audioContext;
let backgroundMusicBuffer;
let backgroundMusicSource;
let gainNode;

export function initializeAudio(gameState) {
    async function setupAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            gainNode = audioContext.createGain();
            gainNode.connect(audioContext.destination);
        }

        if (!backgroundMusicBuffer) {
            try {
                const response = await fetch('/asset_background_music.mp3');
                const arrayBuffer = await response.arrayBuffer();
                backgroundMusicBuffer = await audioContext.decodeAudioData(arrayBuffer);
            } catch (error) {
                console.error('Error loading music:', error);
            }
        }
    }

    function playMusic() {
        if (gameState.settings.musicEnabled && backgroundMusicBuffer && audioContext.state === 'running') {
            stopMusic(); // Stop any existing music
            
            backgroundMusicSource = audioContext.createBufferSource();
            backgroundMusicSource.buffer = backgroundMusicBuffer;
            backgroundMusicSource.connect(gainNode);
            backgroundMusicSource.loop = true;
            backgroundMusicSource.start(0);
            gainNode.gain.value = 0.5;
        }
    }

    function stopMusic() {
        if (backgroundMusicSource) {
            try {
                backgroundMusicSource.stop();
                backgroundMusicSource.disconnect();
            } catch (e) {
                console.warn("Failed to stop music source:", e);
            }
            backgroundMusicSource = null;
        }
    }

    // Attach audio methods to game state
    gameState.audio = {
        setupAudioContext,
        playMusic,
        stopMusic
    };
}