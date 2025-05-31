// PWA Installation
let deferredPrompt;
let isInstalled = false;

// Check if app is installed
window.addEventListener('appinstalled', () => {
    isInstalled = true;
    document.getElementById('install-prompt').style.display = 'none';
});

// Listen for install prompt
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    if (!isInstalled) {
        setTimeout(() => {
            document.getElementById('install-prompt').style.display = 'block';
        }, 3000);
    }
});

// Install button click
document.getElementById('install-btn').addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            document.getElementById('install-prompt').style.display = 'none';
        }
        deferredPrompt = null;
    }
});

// Dismiss install prompt
document.getElementById('install-dismiss').addEventListener('click', () => {
    document.getElementById('install-prompt').style.display = 'none';
});

// --- WEATHER APP: National Weather Service (NWS) ONLY Implementation ---

class WeatherApp {
    constructor() {
        this.currentLocation = null;
        this.nwsForecastLink = '';
        this.nwsData = null;
        this.hasAutoTriedLocation = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.tryAutoLocation();
    }

    bindEvents() {
        document.getElementById('location-btn').addEventListener('click', () => {
            this.getCurrentLocation();
        });
    }

    // Auto-try to get location on load
    tryAutoLocation() {
        // Only attempt once to avoid double-prompt if user also clicks
        if (!this.hasAutoTriedLocation) {
            this.hasAutoTriedLocation = true;
            this.getCurrentLocation(true);
        }
    }

    async getCurrentLocation(isAuto = false) {
        const locationBtn = document.getElementById('location-btn');
        locationBtn.textContent = isAuto ? '📡 Trying to get location...' : '📡 Getting location...';
        locationBtn.disabled = true;

        document.getElementById('weather-loading').style.display = 'block';
        document.getElementById('weather-content').style.display = 'none';

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 12000,
                    enableHighAccuracy: true
                });
            });

            this.currentLocation = {
                lat: position.coords.latitude,
                lon: position.coords.longitude
            };
            this.nwsForecastLink = `https://forecast.weather.gov/MapClick.php?lat=${this.currentLocation.lat.toFixed(4)}&lon=${this.currentLocation.lon.toFixed(4)}`;
            await this.fetchNWSWeather();
        } catch (error) {
            console.error('Location error:', error);
            this.showLocationError(isAuto);
        } finally {
            locationBtn.textContent = '📍 Get Location';
            locationBtn.disabled = false;
        }
    }

    /**
     * Fetches the NWS forecast HTML via AllOrigins, parses into a pseudo-JSON, and updates the UI.
     */
    async fetchNWSWeather() {
        if (!this.currentLocation) return;

        try {
            const lat = this.currentLocation.lat.toFixed(4);
            const lon = this.currentLocation.lon.toFixed(4);
            const nwsUrl = `https://forecast.weather.gov/MapClick.php?lat=${lat}&lon=${lon}`;

            // AllOrigins CORS proxy
            const proxyUrl = 'https://api.allorigins.win/get?url=';
            const response = await fetch(proxyUrl + encodeURIComponent(nwsUrl));
            const data = await response.json();

            // Parse HTML using DOMParser
            const parser = new DOMParser();
            const htmlDoc = parser.parseFromString(data.contents, 'text/html');

            // Extract primary location name (.panel-title)
            let city = htmlDoc.querySelector('.panel-title')?.textContent.trim() ||
                       htmlDoc.querySelector('h2')?.textContent.trim() ||
                       'Your Location';

            // Extract nowcast summary (".myforecast-current") and temp (".myforecast-current-lrg" or ".myforecast-current-sm")
            let nowcastSummary = htmlDoc.querySelector('.myforecast-current')?.textContent.trim() || '';
            let temp = htmlDoc.querySelector('.myforecast-current-lrg')?.textContent.trim() ||
                       htmlDoc.querySelector('.myforecast-current-sm')?.textContent.trim() || '--°';
            // Try to parse out temperature number & unit from temp string
            let tempValue = temp.match(/-?\d+/)?.[0] || '--';
            let tempUnit = temp.match(/[CF]$/) ? `°${temp.match(/[CF]$/)[0]}` : '';

            // Wind, humidity (look for .small, which contains sub-tables)
            let wind = '--', humidity = '--';
            // Use the Current Conditions Details table
            let detailsTable = htmlDoc.querySelector('#current_conditions_detail');
            if (detailsTable) {
                Array.from(detailsTable.querySelectorAll('tr')).forEach(row => {
                    const th = row.querySelector('td');
                    const td = row.querySelector('td:last-child');
                    if (!th || !td) return;
                    const label = th.textContent.trim();
                    const value = td.textContent.trim();
                    if (/humidity/i.test(label)) humidity = value.replace('%', '') + '%';
                    if (/wind/i.test(label)) wind = value;
                });
            }

            // For "feels like", sometimes not shown on NWS, but sometimes in the small block
            let feelsLike = '--';
            let feelsLikeMatch = htmlDoc.querySelector('.myforecast-current-sm')?.textContent.match(/feels like:?[\s ]*(-?\d+)/i);
            if (feelsLikeMatch) {
                feelsLike = feelsLikeMatch[1] + tempUnit;
            }

            // Weather icon (try to get the condition icon shown)
            let weatherIcon = '🌤️';
            let iconImg = htmlDoc.querySelector('.forecast-icon img') || htmlDoc.querySelector('.myforecast-current img');
            if (iconImg && iconImg.getAttribute('alt')) {
                const alt = iconImg.getAttribute('alt').toLowerCase();
                weatherIcon = this.iconFromAlt(alt);
            } else if (nowcastSummary) {
                weatherIcon = this.iconFromAlt(nowcastSummary.toLowerCase());
            }

            // Detailed forecast: get first period from #detailed-forecast-body
            let forecastDetailed = '';
            const detailsPeriods = htmlDoc.querySelectorAll('#detailed-forecast-body .forecast-text');
            if (detailsPeriods.length) forecastDetailed = detailsPeriods[0].textContent.trim();

            // (Optional) Day/Night period from #seven-day-forecast .tombstone-container
            let sevenDay = htmlDoc.querySelector('.tombstone-container');
            let shortDesc = sevenDay?.querySelector('.short-desc')?.textContent.trim() || '';
            let periodName = sevenDay?.querySelector('.period-name')?.textContent.trim() || '';
            let periodTemp = sevenDay?.querySelector('.temp')?.textContent.trim() || '';
            let iconAlt = sevenDay?.querySelector('img')?.alt?.toLowerCase() || '';
            let sevenDayIcon = this.iconFromAlt(iconAlt || shortDesc);

            // Compose JSON "weather" object using the NWS page data
            const weatherData = {
                name: city,
                temperature: { value: tempValue, unit: tempUnit },
                weather_description: nowcastSummary,
                feels_like: feelsLike,
                humidity: humidity,
                wind: wind,
                forecast: forecastDetailed || shortDesc || '',
                icon: weatherIcon,
                period: periodName,
                period_icon: sevenDayIcon,
                period_temp: periodTemp
            };
            this.nwsData = weatherData;

            // Display as per our layout
            this.displayWeatherNWS(weatherData);
        } catch (error) {
            console.error('NWS Weather fetch error:', error);
            this.showWeatherError();
        }
    }

    iconFromAlt(alt) {
        // icon selection based on description
        if (!alt) return '🌤️';
        alt = alt.toLowerCase();
        if (/sun|clear/.test(alt)) return '☀️';
        if (/rain|showers|drizzle/.test(alt)) return '🌧️';
        if (/cloud(?:y|s)/.test(alt)) return '☁️';
        if (/thunder|storm/.test(alt)) return '⛈️';
        if (/snow|sleet|flurries/.test(alt)) return '❄️';
        if (/fog|mist|haze|smoke/.test(alt)) return '🌫️';
        if (/wind/.test(alt)) return '💨';
        if (/partly/.test(alt)) return '⛅';
        return '🌤️';
    }

    displayWeatherNWS(weatherData) {
        // Hide loading spinner, show weather content
        document.getElementById('weather-loading').style.display = 'none';
        document.getElementById('weather-content').style.display = 'block';

        // Update location name w/ NWS link
        document.getElementById('location-name').innerHTML = weatherData.name + 
            ` <a href="${this.nwsForecastLink}" target="_blank" class="nws-link" title="View detailed National Weather Service forecast">[NWS ↗]</a>`;

        // Update weather icon & info
        document.getElementById('weather-icon').textContent = weatherData.icon || '🌤️';
        document.getElementById('temperature').textContent =
            (weatherData.temperature?.value ?? '--') + (weatherData.temperature?.unit ?? '°');

        document.getElementById('weather-description').textContent = weatherData.weather_description || '--';

        document.getElementById('feels-like').textContent =
            weatherData.feels_like && weatherData.feels_like !== '--'
                ? weatherData.feels_like
                : (weatherData.temperature?.value ?? '--') + (weatherData.temperature?.unit ?? '°');

        document.getElementById('humidity').textContent = weatherData.humidity || '--';
        document.getElementById('wind-speed').textContent = weatherData.wind || '--';

        // Remove any previous forecast section, as we'll (re)add it
        const nwsSectionPrev = document.querySelector('.nws-forecast-section');
        if (nwsSectionPrev && nwsSectionPrev.parentElement) nwsSectionPrev.parentElement.removeChild(nwsSectionPrev);

        // Add NWS forecast
        const weatherContent = document.getElementById('weather-content');
        const nwsSection = document.createElement('div');
        nwsSection.className = 'nws-forecast-section';
        nwsSection.innerHTML = `
            <h3 class="nws-forecast-title">🏛️ National Weather Service Forecast</h3>
            <div class="nws-forecast-text">
                ${weatherData.forecast
                    ? weatherData.forecast.slice(0, 280) + (weatherData.forecast.length > 280 ? "..." : "")
                    : '<em>See detailed forecast via the NWS link above.</em>'}
            </div>
        `;
        weatherContent.appendChild(nwsSection);
    }

    showLocationError(isAuto = false) {
        document.getElementById('weather-loading').innerHTML = `
            <div style="text-align: center; color: #ef4444;">
                <p>📍 Unable to get your location${isAuto ? ' automatically' : ''}</p>
                <p>Please enable location services and try again.</p>
                <button id="retry-location" class="retry-btn">Retry Location</button>
            </div>
        `;
        const retryBtn = document.getElementById('retry-location');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.getCurrentLocation(false));
        }
    }

    showWeatherError() {
        document.getElementById('weather-loading').innerHTML = `
            <div style="text-align: center; color: #ef4444;">
                <p>🌐 Weather data unavailable</p>
                <p>Please try again later</p>
            </div>
        `;
    }
}

// News App Class
class NewsApp {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadNews();
    }

    bindEvents() {
        document.getElementById('refresh-news').addEventListener('click', () => {
            this.loadNews();
        });
    }

    async loadNews() {
        const newsLoading = document.getElementById('news-loading');
        const newsContainer = document.getElementById('news-container');
        const refreshBtn = document.getElementById('refresh-news');

        newsLoading.style.display = 'block';
        newsContainer.innerHTML = '';
        refreshBtn.disabled = true;

        try {
            const rssUrl = 'https://hnrss.org/frontpage';
            const proxyUrl = 'https://api.allorigins.win/get?url=';
            const response = await fetch(proxyUrl + encodeURIComponent(rssUrl));
            const data = await response.json();

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data.contents, 'text/xml');
            const items = xmlDoc.querySelectorAll('item');

            const newsItems = Array.from(items).slice(0, 10).map(item => ({
                title: item.querySelector('title')?.textContent || 'No title',
                link: item.querySelector('link')?.textContent || '#',
                description: item.querySelector('description')?.textContent || 'No description',
                pubDate: item.querySelector('pubDate')?.textContent || '',
                comments: item.querySelector('comments')?.textContent || ''
            }));

            this.displayNews(newsItems);
        } catch (error) {
            console.error('News fetch error:', error);
            this.showNewsError();
        } finally {
            newsLoading.style.display = 'none';
            refreshBtn.disabled = false;
        }
    }

    displayNews(newsItems) {
        const newsContainer = document.getElementById('news-container');
        
        newsItems.forEach((item, index) => {
            const newsElement = document.createElement('div');
            newsElement.className = 'news-item';
            newsElement.style.animationDelay = `${index * 0.1}s`;
            
            const pubDate = new Date(item.pubDate);
            const timeAgo = this.getTimeAgo(pubDate);
            
            newsElement.innerHTML = `
                <div class="news-title">
                    <a href="${item.link}" target="_blank" rel="noopener">${item.title}</a>
                </div>
                <div class="news-description">${this.truncateText(item.description, 150)}</div>
                <div class="news-meta">
                    <span class="news-time">${timeAgo}</span>
                    <span class="news-source">Hacker News</span>
                </div>
            `;
            
            newsContainer.appendChild(newsElement);
        });
    }

    showNewsError() {
        const newsContainer = document.getElementById('news-container');
        newsContainer.innerHTML = `
            <div class="error-message">
                <h3>📡 News Unavailable</h3>
                <p>Unable to load Hacker News feed. Please try again later.</p>
                <button class="retry-btn" onclick="newsApp.loadNews()">Retry</button>
            </div>
        `;
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength).trim() + '...';
    }

    getTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    }
}

// Initialize app
const weatherApp = new WeatherApp();

// Initialize news app
const newsApp = new NewsApp();

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}