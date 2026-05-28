# ClearSky AI - Deployment Guide

This document provides step-by-step instructions for deploying ClearSky AI to production using Vercel (Frontend) and Render (Backend & AI Service).

## Architecture Overview

User <--> Vercel (Frontend) <--> Render (Backend) <--> Render (AI Service)

> [!TIP]
> **Quick Deploy:** This project includes a `render.yaml` Blueprint. You can deploy both the Backend and AI Service simultaneously by connecting your GitHub repo to Render and selecting the Blueprint option.

---

## 1. AI Service Deployment (Render)

**Service Type:** Web Service  
**Runtime:** Python 3  
**Build Command:** `./render-build.sh` (or `pip install -r requirements.txt`)  
**Start Command:** `uvicorn app:app --host 0.0.0.0 --port $PORT`

### Environment Variables:
- `FRONTEND_URL`: Your Vercel URL (e.g., `https://clearsky-ai.vercel.app`)
- `BACKEND_URL`: Your Backend URL (e.g., `https://clearsky-backend.onrender.com`)

---

## 2. Backend Deployment (Render)

**Service Type:** Web Service  
**Runtime:** Node.js  
**Build Command:** `npm install`  
**Start Command:** `npm start`

### Environment Variables:
- `OPENWEATHER_API_KEY`: Your OpenWeather API Key.
- `AI_SERVICE_URL`: The URL of your deployed AI Service (e.g., `https://clearsky-ai.onrender.com`)
- `FRONTEND_URL`: Your Vercel URL (e.g., `https://clearsky-ai.vercel.app`)
- `PORT`: (Managed by Render automatically)

---

## 3. Frontend Deployment (Vercel)

**Framework Preset:** Vite  
**Build Command:** `npm run build`  
**Output Directory:** `dist`

### Environment Variables:
- `VITE_API_URL`: The URL of your deployed Backend (e.g., `https://clearsky-backend.onrender.com/api`)

### Note on Routing:
The project includes a `vercel.json` file that handles SPA routing. Ensure this file is present in the root of your frontend directory.

---

## Deployment Steps

1. **AI Service First:** Deploy the AI service so you have its URL.
2. **Backend Second:** Deploy the backend using the AI service URL.
3. **Frontend Third:** Deploy the frontend using the backend URL.
4. **CORS Loop:** Once the frontend is deployed, update the `FRONTEND_URL` environment variable in BOTH the AI service and Backend on Render, then redeploy them to enable production CORS.

## Performance & Security Notes

- **Compression:** Gzip compression is enabled on the backend for faster data transfers.
- **Security:** `helmet` is configured to provide standard security headers.
- **Rate Limiting:** Production rate limiting is active on the backend to prevent abuse.
- **Geolocation:** Ensure you access the frontend via `HTTPS` for browser geolocation to work.
