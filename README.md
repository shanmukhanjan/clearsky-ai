# ClearSky AI

## 🌍 Project Overview

ClearSky AI is an environmental monitoring application that allows users to check the current Air Quality Index (AQI) of any city in the world. It not only shows you current pollutant levels (like PM2.5 and PM10) but also provides a weather-aware AQI forecast using a machine learning model.

## 🎓 Why I Built This Project
1. **Learn Full-Stack Web Development:** Understand how to connect a React frontend to an Express.js backend.
2. **Explore Public APIs:** Learn how to fetch data from external services like OpenWeatherMap and AQICN.
3. **Introduction to Machine Learning:** Understand the basics of training a model (XGBoost) on historical data to make predictions.
4. **Deploying Applications:** Learn how to host a project on the internet using Vercel (for frontend) and Render (for backend and AI service).

## 📁 Project Structure

- `frontend/`: React + Vite application with Tailwind CSS for a modern, minimalistic dashboard.
- `backend/`: Node.js + Express API serving as a proxy and caching layer.
- `ai-service/`: Python FastAPI service utilizing lightweight machine learning for AQI forecasting.

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)

### 1. Backend Setup
1. Navigate to the `backend` directory: `cd backend`
2. Install dependencies: `npm install`
3. Create a `.env` file from the example or add your `PORT` and `AQI_API_KEY`.
4. Start the server: `npm start` (or `npm run dev` for development)

### 2. Frontend Setup
1. Navigate to the `frontend` directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the Vite development server: `npm run dev`

### 3. AI Service Setup
1. Navigate to the `ai-service` directory: `cd ai-service`
2. Create a virtual environment: `python -m venv .venv`
3. Activate the virtual environment:
   - Windows: `.venv\Scripts\activate`
   - Mac/Linux: `source .venv/bin/activate`
4. Install requirements: `pip install -r requirements.txt`
5. Start the FastAPI server: `uvicorn app:app --reload --port 8000`

## Features
- Real-time AQI and Weather Data.
- AI-Powered Forecasts (6h, 12h, 24h).
- Smog & AQI Spike Detection.
- Minimalistic, responsive dark/light UI.
- Fast, cached API responses without a database.
