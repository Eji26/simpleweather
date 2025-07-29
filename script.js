// API Configuration
const API_KEY = 'd1e954118b44ce9b51164bd3d52b8b8f'; // Replace with your actual API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

// DOM Elements
const searchBar = document.querySelector('.search-bar');
const locationBtn = document.querySelector('.location-btn');
const cityElement = document.querySelector('.city');
const countryElement = document.querySelector('.country');
const tempElement = document.querySelector('.temperature');
const weatherIcon = document.querySelector('.weather-icon .icon-animation');
const weatherDesc = document.querySelector('.weather-description');
const humidityElement = document.querySelector('.humidity');
const windElement = document.querySelector('.wind');
const pressureElement = document.querySelector('.pressure');
const unitButtons = document.querySelectorAll('.unit-btn');
const forecastContainer = document.querySelector('.forecast-scroll');
const loadingSpinner = document.querySelector('.loading-spinner');
const errorMessage = document.querySelector('.error-message');
const backgroundGradient = document.querySelector('.background-gradient');

// State
let currentUnit = 'celsius';
let currentWeatherData = null;

// Initialize the app
function init() {
    // Load unit preference from localStorage
    const savedUnit = localStorage.getItem('weatherUnit');
    if (savedUnit) {
        currentUnit = savedUnit;
        document.querySelector(`.unit-btn[data-unit="${savedUnit}"]`).classList.add('active');
        document.querySelector(`.unit-btn[data-unit="${savedUnit === 'celsius' ? 'fahrenheit' : 'celsius'}"]`).classList.remove('active');
    }
    
    // Event Listeners
    searchBar.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            fetchWeather(searchBar.value);
        }
    });
    
    locationBtn.addEventListener('click', getLocationWeather);
    
    unitButtons.forEach(btn => {
        btn.addEventListener('click', () => toggleUnits(btn.dataset.unit));
    });
    
    // Try to get user's location weather on load
    getLocationWeather();
}

// Get weather by geolocation
function getLocationWeather() {
    if (navigator.geolocation) {
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByCoords(latitude, longitude);
            },
            error => {
                console.error('Geolocation error:', error);
                setLoading(false);
                // Default to a popular city if geolocation fails
                fetchWeather('London');
            }
        );
    } else {
        // Geolocation not supported
        fetchWeather('London');
    }
}

// Fetch weather data by city name
async function fetchWeather(city) {
    if (!city) return;
    
    setLoading(true);
    hideError();
    
    try {
        const response = await fetch(`${BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}`);
        
        if (!response.ok) {
            throw new Error('City not found');
        }
        
        const data = await response.json();
        currentWeatherData = data;
        updateUI(data);
        
        // Fetch forecast with coordinates
        fetchForecast(data.coord.lat, data.coord.lon);
    } catch (err) {
        console.error('Error fetching weather:', err);
        showError();
    } finally {
        setLoading(false);
    }
}

// Fetch weather data by coordinates
async function fetchWeatherByCoords(lat, lon) {
    setLoading(true);
    hideError();
    
    try {
        const response = await fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
        
        if (!response.ok) {
            throw new Error('Location not found');
        }
        
        const data = await response.json();
        currentWeatherData = data;
        updateUI(data);
        
        // Fetch forecast with coordinates
        fetchForecast(lat, lon);
    } catch (err) {
        console.error('Error fetching weather by coordinates:', err);
        showError();
    } finally {
        setLoading(false);
    }
}

// Fetch 5-day forecast using both OpenWeatherMap and Open-Meteo
async function fetchForecast(lat, lon) {
    try {
        // First get the basic forecast from OpenWeatherMap
        const owmResponse = await fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
        
        if (!owmResponse.ok) {
            throw new Error('Forecast not available');
        }
        
        const owmData = await owmResponse.json();
        
        // Then get more detailed forecast from Open-Meteo
        const meteoResponse = await fetch(`${OPEN_METEO_URL}?latitude=${lat}&longitude=${lon}&hourly=temperature_2m&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`);
        
        if (!meteoResponse.ok) {
            throw new Error('Detailed forecast not available');
        }
        
        const meteoData = await meteoResponse.json();
        
        // Combine data from both APIs
        updateForecast(owmData, meteoData);
    } catch (err) {
        console.error('Error fetching forecast:', err);
        // Fallback to just OpenWeatherMap if Open-Meteo fails
        if (owmData) {
            updateForecast(owmData);
        }
    }
}

// Update UI with weather data
function updateUI(data) {
    // Update location
    cityElement.textContent = data.name;
    countryElement.textContent = data.sys.country;
    
    // Update temperature
    updateTemperature(data.main.temp);
    
    // Update weather icon and description
    const weather = data.weather[0];
    weatherDesc.textContent = weather.description.charAt(0).toUpperCase() + weather.description.slice(1);
    setWeatherIcon(weather.icon, data.dt, data.sys.sunrise, data.sys.sunset);
    
    // Update details
    humidityElement.textContent = `${data.main.humidity}%`;
    windElement.textContent = `${convertWindSpeed(data.wind.speed)} ${currentUnit === 'celsius' ? 'km/h' : 'mph'}`;
    pressureElement.textContent = `${data.main.pressure} hPa`;
    
    // Update background based on weather and time
    updateTheme(weather.main, data.dt, data.sys.sunrise, data.sys.sunset);
}

// Update forecast display with combined data
function updateForecast(owmData, meteoData = null) {
    // Clear previous forecast
    forecastContainer.innerHTML = '';
    
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Use Open-Meteo data if available, otherwise fall back to OpenWeatherMap
    if (meteoData && meteoData.daily) {
        // Process Open-Meteo daily forecast data
        for (let i = 0; i < 5; i++) { // Show next 5 days
            const date = new Date(meteoData.daily.time[i]);
            const dayElement = document.createElement('div');
            dayElement.className = 'forecast-day';
            
            // Day name
            const dayName = document.createElement('span');
            dayName.className = 'forecast-day-name';
            dayName.textContent = daysOfWeek[date.getDay()];
            
            // Weather icon (using weather code from Open-Meteo)
            const iconElement = document.createElement('div');
            iconElement.className = 'forecast-icon';
            
            const weatherCode = meteoData.daily.weathercode[i];
            const iconClass = getIconClassFromWeatherCode(weatherCode);
            const iconDiv = document.createElement('div');
            iconDiv.className = `icon-animation icon-${iconClass}`;
            iconElement.appendChild(iconDiv);
            
            // Temperatures (max and min from Open-Meteo)
            const maxTemp = meteoData.daily.temperature_2m_max[i];
            const minTemp = meteoData.daily.temperature_2m_min[i];
            
            const tempsElement = document.createElement('div');
            tempsElement.className = 'forecast-temps';
            
            const maxTempElement = document.createElement('span');
            maxTempElement.className = 'forecast-temp-high';
            maxTempElement.textContent = `${Math.round(currentUnit === 'celsius' ? maxTemp : (maxTemp * 9/5) + 32)}°`;
            
            const minTempElement = document.createElement('span');
            minTempElement.className = 'forecast-temp-low';
            minTempElement.textContent = `${Math.round(currentUnit === 'celsius' ? minTemp : (minTemp * 9/5) + 32)}°`;
            
            tempsElement.appendChild(maxTempElement);
            tempsElement.appendChild(minTempElement);
            
            // Assemble the day element
            dayElement.appendChild(dayName);
            dayElement.appendChild(iconElement);
            dayElement.appendChild(tempsElement);
            
            forecastContainer.appendChild(dayElement);
        }
    } else {
        // Fallback to OpenWeatherMap data
        // Group forecast by day
        const dailyForecast = {};
        
        owmData.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dayKey = date.toLocaleDateString();
            
            if (!dailyForecast[dayKey]) {
                dailyForecast[dayKey] = {
                    date: date,
                    temps: [],
                    icons: [],
                    descriptions: []
                };
            }
            
            dailyForecast[dayKey].temps.push(item.main.temp);
            dailyForecast[dayKey].icons.push(item.weather[0].icon);
            dailyForecast[dayKey].descriptions.push(item.weather[0].main);
        });
        
        // Get the next 5 days (skip today)
        const forecastDays = Object.values(dailyForecast).slice(1, 6);
        
        forecastDays.forEach(day => {
            // Create forecast day element
            const dayElement = document.createElement('div');
            dayElement.className = 'forecast-day';
            
            // Day name
            const dayName = document.createElement('span');
            dayName.className = 'forecast-day-name';
            dayName.textContent = daysOfWeek[day.date.getDay()];
            
            // Weather icon (use most common icon of the day)
            const iconElement = document.createElement('div');
            iconElement.className = 'forecast-icon';
            
            // Find most frequent weather condition
            const mostFrequentIcon = mode(day.icons);
            const iconClass = mostFrequentIcon.substring(0, 2);
            const iconMap = {
                '01': 'sun',
                '02': 'cloudy',
                '03': 'cloudy',
                '04': 'cloudy',
                '09': 'rain',
                '10': 'rain',
                '11': 'rain',
                '13': 'snow',
                '50': 'cloudy'
            };
            
            const iconDiv = document.createElement('div');
            iconDiv.className = `icon-animation icon-${iconMap[iconClass] || 'default'}`;
            iconElement.appendChild(iconDiv);
            
            // Temperatures (max and min)
            const maxTemp = Math.max(...day.temps);
            const minTemp = Math.min(...day.temps);
            
            const tempsElement = document.createElement('div');
            tempsElement.className = 'forecast-temps';
            
            const maxTempElement = document.createElement('span');
            maxTempElement.className = 'forecast-temp-high';
            maxTempElement.textContent = `${Math.round(currentUnit === 'celsius' ? maxTemp : (maxTemp * 9/5) + 32)}°`;
            
            const minTempElement = document.createElement('span');
            minTempElement.className = 'forecast-temp-low';
            minTempElement.textContent = `${Math.round(currentUnit === 'celsius' ? minTemp : (minTemp * 9/5) + 32)}°`;
            
            tempsElement.appendChild(maxTempElement);
            tempsElement.appendChild(minTempElement);
            
            // Assemble the day element
            dayElement.appendChild(dayName);
            dayElement.appendChild(iconElement);
            dayElement.appendChild(tempsElement);
            
            forecastContainer.appendChild(dayElement);
        });
    }
}

// Helper function to map Open-Meteo weather codes to our icon classes
function getIconClassFromWeatherCode(code) {
    // Open-Meteo weather codes: https://open-meteo.com/en/docs
    if (code === 0) return 'sun';                 // Clear sky
    if (code >= 1 && code <= 3) return 'cloudy';  // Mainly clear, partly cloudy, overcast
    if (code >= 45 && code <= 48) return 'cloudy'; // Fog and depositing rime fog
    if (code >= 51 && code <= 67) return 'rain';  // Drizzle and rain
    if (code >= 71 && code <= 77) return 'snow';  // Snow
    if (code >= 80 && code <= 86) return 'rain';  // Rain showers
    if (code >= 95 && code <= 99) return 'rain';  // Thunderstorms
    
    return 'default';
}

// Update temperature display
function updateTemperature(tempC) {
    const temp = currentUnit === 'celsius' ? tempC : (tempC * 9/5) + 32;
    tempElement.textContent = `${Math.round(temp)}°`;
}

// Convert wind speed based on unit
function convertWindSpeed(speedMps) {
    // Convert m/s to km/h or mph
    const speedKph = speedMps * 3.6;
    return currentUnit === 'celsius' ? Math.round(speedKph) : Math.round(speedKph * 0.621371);
}

// Set weather icon based on condition code
function setWeatherIcon(iconCode, currentTime, sunrise, sunset) {
    // Clear previous icon classes
    weatherIcon.className = 'icon-animation';
    
    // Determine if it's day or night
    const isDayTime = currentTime > sunrise && currentTime < sunset;
    
    // Map OpenWeatherMap icon codes to our animations
    const iconMap = {
        '01': 'sun',         // clear sky
        '02': 'cloudy',      // few clouds
        '03': 'cloudy',      // scattered clouds
        '04': 'cloudy',      // broken clouds
        '09': 'rain',        // shower rain
        '10': 'rain',        // rain
        '11': 'rain',        // thunderstorm
        '13': 'snow',        // snow
        '50': 'cloudy'       // mist
    };
    
    const iconPrefix = iconCode.substring(0, 2);
    const iconClass = iconMap[iconPrefix] || 'default';
    
    // Add the appropriate icon class
    weatherIcon.classList.add(`icon-${iconClass}`);
    
    // If night time and clear sky, use moon style
    if (!isDayTime && iconPrefix === '01') {
        weatherIcon.classList.add('icon-night');
    }
}

// Update theme based on weather and time
function updateTheme(weatherCondition, currentTime, sunrise, sunset) {
    const isDayTime = currentTime > sunrise && currentTime < sunset;
    let startColor, endColor;
    
    switch (weatherCondition.toLowerCase()) {
        case 'clear':
            startColor = isDayTime ? 'var(--sunny-gradient-start)' : 'var(--night-gradient-start)';
            endColor = isDayTime ? 'var(--sunny-gradient-end)' : 'var(--night-gradient-end)';
            break;
        case 'clouds':
            startColor = 'var(--cloudy-gradient-start)';
            endColor = 'var(--cloudy-gradient-end)';
            break;
        case 'rain':
        case 'drizzle':
        case 'thunderstorm':
            startColor = 'var(--rainy-gradient-start)';
            endColor = 'var(--rainy-gradient-end)';
            break;
        case 'snow':
            startColor = 'var(--snow-gradient-start)';
            endColor = 'var(--snow-gradient-end)';
            break;
        default:
            startColor = isDayTime ? 'var(--sunny-gradient-start)' : 'var(--night-gradient-start)';
            endColor = isDayTime ? 'var(--sunny-gradient-end)' : 'var(--night-gradient-end)';
    }
    
    backgroundGradient.style.background = `linear-gradient(135deg, ${startColor}, ${endColor})`;
}

// Toggle between Celsius and Fahrenheit
function toggleUnits(unit) {
    if (unit === currentUnit) return;
    
    currentUnit = unit;
    localStorage.setItem('weatherUnit', unit);
    
    // Update active button
    unitButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.unit === unit);
    });
    
    // Update all temperatures
    if (currentWeatherData) {
        updateTemperature(currentWeatherData.main.temp);
        
        // Update wind speed
        windElement.textContent = `${convertWindSpeed(currentWeatherData.wind.speed)} ${currentUnit === 'celsius' ? 'km/h' : 'mph'}`;
        
        // Update forecast temperatures
        const forecastHighs = document.querySelectorAll('.forecast-temp-high');
        const forecastLows = document.querySelectorAll('.forecast-temp-low');
        
        forecastHighs.forEach(temp => {
            const tempC = parseFloat(temp.textContent);
            temp.textContent = `${Math.round(currentUnit === 'celsius' ? tempC : (tempC * 9/5) + 32)}°`;
        });
        
        forecastLows.forEach(temp => {
            const tempC = parseFloat(temp.textContent);
            temp.textContent = `${Math.round(currentUnit === 'celsius' ? tempC : (tempC * 9/5) + 32)}°`;
        });
    }
}

// Helper function to find mode (most frequent element) in an array
function mode(array) {
    const count = {};
    let maxCount = 0;
    let modeValue = array[0];
    
    array.forEach(value => {
        count[value] = (count[value] || 0) + 1;
        if (count[value] > maxCount) {
            maxCount = count[value];
            modeValue = value;
        }
    });
    
    return modeValue;
}

// Loading state
function setLoading(isLoading) {
    if (isLoading) {
        loadingSpinner.classList.add('active');
    } else {
        loadingSpinner.classList.remove('active');
    }
}

// Error handling
function showError() {
    errorMessage.classList.add('active');
}

function hideError() {
    errorMessage.classList.remove('active');
}

// Initialize the application
document.addEventListener('DOMContentLoaded', init);

// --- goweather.xyz API Integration (robertoduessmann/weather-api) ---
// Example endpoint: http://goweather.xyz/weather/{city}

// Add a button to trigger goweather.xyz fetch for demo
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.createElement('button');
    btn.textContent = 'Fetch goweather.xyz Weather (Demo)';
    btn.style.position = 'fixed';
    btn.style.bottom = '48px';
    btn.style.right = '16px';
    btn.style.zIndex = 1000;
    btn.style.background = '#fff8';
    btn.style.border = '1px solid #fff4';
    btn.style.backdropFilter = 'blur(4px)';
    btn.style.padding = '8px 16px';
    btn.style.borderRadius = '8px';
    btn.style.cursor = 'pointer';
    btn.addEventListener('click', () => {
        fetchWeatherGoWeather('Nairobi'); // Demo city
    });
    document.body.appendChild(btn);
});

// Fetch weather from goweather.xyz API
async function fetchWeatherGoWeather(city) {
    setLoading(true);
    hideError();
    try {
        const url = `https://goweather.xyz/weather/${encodeURIComponent(city)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('goweather.xyz API error');
        const data = await response.json();
        // Example response:
        // {
        //   "temperature": "29 °C",
        //   "wind": "20 km/h",
        //   "description": "Partly cloudy",
        //   "forecast": [ ... ]
        // }
        cityElement.textContent = city;
        countryElement.textContent = '--';
        // Parse temperature (e.g., "29 °C")
        let tempValue = '--';
        if (data.temperature) {
            const match = data.temperature.match(/(-?\d+)/);
            if (match) tempValue = parseInt(match[1], 10);
        }
        updateTemperature(tempValue);
        weatherDesc.textContent = data.description ? (data.description.charAt(0).toUpperCase() + data.description.slice(1)) : '--';
        humidityElement.textContent = '--%';
        // Parse wind (e.g., "20 km/h")
        windElement.textContent = data.wind || '--';
        pressureElement.textContent = '-- hPa';
        // Set a generic icon
        weatherIcon.className = 'icon-animation icon-sun';
        // Set a generic background
        backgroundGradient.style.background = 'linear-gradient(135deg, #f6d365, #fda085)';
        // Forecast
        forecastContainer.innerHTML = '';
        if (Array.isArray(data.forecast)) {
            data.forecast.slice(0, 5).forEach((f, i) => {
                const dayElement = document.createElement('div');
                dayElement.className = 'forecast-day';
                const dayName = document.createElement('span');
                dayName.className = 'forecast-day-name';
                dayName.textContent = `Day ${f.day || (i+1)}`;
                const iconElement = document.createElement('div');
                iconElement.className = 'forecast-icon';
                const iconDiv = document.createElement('div');
                iconDiv.className = 'icon-animation icon-sun';
                iconElement.appendChild(iconDiv);
                const tempsElement = document.createElement('div');
                tempsElement.className = 'forecast-temps';
                const maxTempElement = document.createElement('span');
                maxTempElement.className = 'forecast-temp-high';
                let tVal = '--';
                if (f.temperature) {
                    const m = f.temperature.match(/(-?\d+)/);
                    if (m) tVal = parseInt(m[1], 10);
                }
                maxTempElement.textContent = `${tVal}°`;
                tempsElement.appendChild(maxTempElement);
                dayElement.appendChild(dayName);
                dayElement.appendChild(iconElement);
                dayElement.appendChild(tempsElement);
                forecastContainer.appendChild(dayElement);
            });
        }
    } catch (err) {
        console.error('goweather.xyz fetch error:', err);
        showError();
    } finally {
        setLoading(false);
    }
}