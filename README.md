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
AuraWeather uses the [OpenWeatherMap API](https://openweathermap.org/api) and [Open-Meteo API](https://open-meteo.com/) to fetch weather data. To keep your OpenWeatherMap API key secure, all requests to OpenWeatherMap are proxied through a simple Node.js backend server. The frontend never exposes your API key.

When you enter a city or use your location, the app requests weather data from the backend server, which then fetches data from the weather APIs and returns it to the frontend. This keeps your API key hidden from users.

## Requirements
- A modern web browser (Chrome, Firefox, Edge, Safari, etc.)
- Internet connection (the app fetches live data from external APIs)
- Node.js and npm (for the backend proxy server)
- A valid OpenWeatherMap API key (kept in a `.env` file in the `server` folder)

## How to Use
1. In the `server` folder, copy `.env.example` to `.env` and add your OpenWeatherMap API key.
2. In the `server` folder, run `npm install` to install dependencies.
3. Start the backend server with `npm start` (it will run on port 3001 by default).
4. Open `index.html` in your browser (the frontend will connect to the backend for weather data).
5. Enter a city name and press Enter, or click the location button to use your current location.
6. View the current weather and forecast.
7. Use the °C/°F toggle to switch units.

## Limitations
- This is a simple, educational project and not intended for production.
- No user authentication or advanced error handling.
- The backend proxy server must be running for the app to work.
- API key is protected from the frontend, but anyone with server access can still see it.
- Limited to the free tier and rate limits of the weather APIs.
- No offline support or PWA features by default.

## License
This project is for learning and demonstration only. Use at your own risk.