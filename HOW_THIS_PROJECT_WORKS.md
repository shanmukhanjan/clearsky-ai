# How This Project Works (File by File Guide)

This document breaks down the purpose of every important file in the project. If you want to understand how the code is organized, this is your map!

---

## Frontend (`/frontend`)
The frontend is built with React and Vite. This is what runs in the user's web browser.

### Important Files:
- **`src/main.jsx`**: The entry point of our React app. It attaches our app to the HTML page.
- **`src/App.jsx`**: The main component. It holds the "state" (like whether we are on the Welcome page or the Dashboard) and handles the Dark/Light mode theme.
- **`src/pages/Dashboard.jsx`**: The main screen that shows the AQI, weather, and charts for a single city.
- **`src/components/CompareView.jsx`**: The screen that lets you search two cities and compares them side-by-side.
- **`src/api/aqi.js`**: Contains the helper functions that use `fetch()` or `axios` to talk to our own Node.js Backend.
- **`vite.config.js`**: Configuration for Vite, our build tool. It makes our local development server run fast.
- **`vercel.json`**: Tells Vercel how to host our frontend when we deploy it.

---

## Backend (`/backend`)
The backend is built with Node.js and Express. It fetches data from the internet, formats it, and talks to the AI service.

### Important Files:
- **`src/server.js`**: The starting point of our server. It listens on a specific port (like 5001) for incoming requests.
- **`src/app.js`**: Sets up the Express application, adds security (CORS), and connects our routes.
- **`src/routes/aqiRoutes.js`**: Defines the URLs (endpoints) our backend responds to (e.g., `/api/aqi/search`).
- **`src/controllers/aqiController.js`**: The "brain" for our routes. When a request comes in, this file decides what to do (e.g., call the AQI service, then call the AI service, then send a response).
- **`src/services/aqiService.js`**: This file makes the actual HTTP requests to the external public APIs (like OpenWeatherMap) to gather raw data.
- **`src/utils/aqiPredictor.js`**: A local backup script that makes a basic guess about future AQI if the Python AI service is turned off or broken.
- **`src/utils/responseFormatter.js`**: Takes the messy raw data from different APIs and organizes it into a neat, clean JSON object before sending it to the frontend.

---

## AI Service (`/ai-service`)
The AI Service is a small Python application running FastAPI. Its only job is to load the XGBoost model and make predictions.

### Important Files:
- **`app.py`**: The main FastAPI server. It defines the `/predict` endpoint that our Node backend calls.
- **`requirements.txt`**: A list of Python packages we need installed (like `fastapi`, `xgboost`, `pandas`) so the app can run on Render.
- **`render-build.sh`**: A simple script that Render runs when deploying to make sure everything installs correctly.

### Model Files (`/ai-service/model`):
- **`trainer.py` & `train_global_model.py`**: The scripts used to train the machine learning model. You run these locally when you have downloaded historical data to teach the model.
- **`predictor.py`**: This script loads the trained model files into memory and uses them to spit out a prediction when given current weather data.
- **`aqi_model_24h.json`**: The actual "brain" of the machine learning model. After training is complete, the knowledge is saved into this JSON file so it can be loaded instantly without retraining.

---

## Configuration Files (Root Folder)

- **`package.json`**: Keeps track of our project's name, version, and the npm scripts we use (like `npm run dev`).
- **`render.yaml`**: The instruction manual for Render.com. It tells Render how to build and start our Backend and our AI Service automatically whenever we push code to GitHub.
