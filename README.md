# AuraWeather - Simple Weather App

AuraWeather is a simple, modern weather web app that allows users to search for current weather and a 5-day forecast for any city, or use their current location. It is designed for learning and demonstration purposes, not for production use.

## Features
- Search for weather by city name
- Get weather for your current location (if you allow browser geolocation)
- View current temperature, weather description, humidity, wind, and pressure
- Toggle between Celsius and Fahrenheit
- See a 5-day weather forecast
- Responsive and modern UI

## How It Works
AuraWeather uses the [OpenWeatherMap API](https://openweathermap.org/api) and [Open-Meteo API](https://open-meteo.com/) to fetch weather data. When you enter a city or use your location, the app requests weather data from these APIs and displays it in a user-friendly card layout.

## Requirements
- A modern web browser (Chrome, Firefox, Edge, Safari, etc.)
- Internet connection (the app fetches live data from external APIs)
- A valid OpenWeatherMap API key (replace the placeholder in `script.js` if you fork or deploy this project)

## How to Use
1. Open `index.html` in your browser.
2. Enter a city name and press Enter, or click the location button to use your current location.
3. View the current weather and forecast.
4. Use the °C/°F toggle to switch units.

## Limitations
- This is a simple, educational project and not intended for production.
- No user authentication or advanced error handling.
- API keys are exposed in the code (not secure for real deployments).
- Limited to the free tier and rate limits of the weather APIs.
- No offline support or PWA features by default.

## License
This project is for learning and demonstration only. Use at your own risk.