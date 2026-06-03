# ClearSky AI - AQI Monitoring and Prediction System

Hello! Welcome to **ClearSky AI**. 

This is a learning project built to explore web development, APIs, and machine learning. As a 2nd-year engineering student, I wanted to understand how air quality data is collected, how it affects our health, and how machine learning models can help us predict future pollution levels based on weather patterns.

## Project Overview

ClearSky AI is an environmental monitoring application that allows users to check the current Air Quality Index (AQI) of any city in the world. It not only shows you current pollutant levels (like PM2.5 and PM10) but also provides a weather-aware AQI forecast using a machine learning model.

## Why I Built This Project
1. **Learn Full-Stack Web Development:** Understand how to connect a React frontend to an Express.js backend.
2. **Explore Public APIs:** Learn how to fetch data from external services like OpenWeatherMap and AQICN.
3. **Introduction to Machine Learning:** Understand the basics of training a model (XGBoost) on historical data to make predictions.
4. **Deploying Applications:** Learn how to host a project on the internet using Vercel (for frontend) and Render (for backend and AI service).

## Features
- Search for any city to see its current AQI and weather.
- Compare the air quality between two different cities side-by-side.
- View a 24 to 72-hour prediction of future AQI levels.
- Get simple health recommendations based on current pollution levels.
- Beautiful, responsive UI with Dark Mode support.

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS (Hosted on Vercel)
- **Backend:** Node.js, Express.js (Hosted on Render)
- **AI Prediction Service:** Python, FastAPI, XGBoost (Hosted on Render)

## APIs Used
- **OpenWeatherMap API:** To get current temperature, humidity, and wind speed.
- **AQICN API:** To get current real-time pollutant levels.
- **Nominatim (OpenStreetMap):** To power the city search autocomplete.

## Machine Learning Overview
The prediction feature uses an XGBoost model. It was trained using historical AQI and weather data collected from publicly available sources. It looks at the current pollution, temperature, wind, and humidity to estimate if the air quality will get better or worse over the next few days. It's a simple, beginner-friendly model meant to demonstrate how ML can be applied to real-world data.

## Project Structure
```
clearsky-ai/
├── frontend/       # React user interface
├── backend/        # Node.js API that fetches data
└── ai-service/     # Python service that runs the XGBoost prediction model
```

## How To Run Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/clearsky-ai.git
   cd clearsky-ai
   ```

2. **Start the Backend:**
   ```bash
   cd backend
   npm install
   # Create a .env file based on .env.example
   npm start
   ```

3. **Start the Frontend:**
   ```bash
   cd frontend
   npm install
   # Create a .env file based on .env.example
   npm run dev
   ```

4. **Start the AI Service (Optional):**
   ```bash
   cd ai-service
   pip install -r requirements.txt
   uvicorn app:app --reload --port 8000
   ```

## Deployment
The project is set up to deploy automatically via GitHub:
- **Frontend:** Vercel (using `vercel.json` and `vite.config.js`)
- **Backend:** Render (using `render.yaml`)
- **AI Service:** Render (Docker container)

## Future Improvements
- Collect more historical data to make the prediction model more accurate.
- Add historical charts to show how air quality has changed over the last month.
- Implement user accounts to save favorite cities.

---
*This is a student project built for educational purposes. The AI predictions are estimates and should not be used for critical health decisions.*
