export function initializeSettings(gameState) {
    // Load settings from localStorage with default values
    const settings = {
        musicEnabled: localStorage.getItem('musicEnabled') !== 'false', // Default to true
        platformerMode: localStorage.getItem('platformerMode') === 'true',
        hardMode: localStorage.getItem('hardMode') === 'true'
    };

    // Store original settings for comparison
    gameState.originalSettings = {...settings};

    // Attach settings to game state
    gameState.settings = settings;

    // Setup settings toggle event listeners
    const musicToggle = document.getElementById('musicToggle');
    const platformerToggle = document.getElementById('platformerToggle');
    const hardModeToggle = document.getElementById('hardModeToggle');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
    const settingsModal = document.getElementById('settingsModal');

    // Initialize checkbox states
    musicToggle.checked = settings.musicEnabled;
    platformerToggle.checked = settings.platformerMode;
    hardModeToggle.checked = settings.hardMode;

    saveSettingsBtn.addEventListener('click', () => {
        // Update settings
        settings.musicEnabled = musicToggle.checked;
        settings.platformerMode = platformerToggle.checked;
        settings.hardMode = hardModeToggle.checked;

        // Save to localStorage
        localStorage.setItem('musicEnabled', settings.musicEnabled);
        localStorage.setItem('platformerMode', settings.platformerMode);
        localStorage.setItem('hardMode', settings.hardMode);

        // Close settings modal
        settingsModal.style.display = 'none';
    });

    cancelSettingsBtn.addEventListener('click', () => {
        // Revert toggle states to current settings
        musicToggle.checked = settings.musicEnabled;
        platformerToggle.checked = settings.platformerMode;
        hardModeToggle.checked = settings.hardMode;

        settingsModal.style.display = 'none';
    });
}