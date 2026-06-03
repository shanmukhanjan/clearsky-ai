# Beginner's Learning Guide: ClearSky AI

Welcome! If you are new to web development, APIs, or machine learning, this guide is the perfect place to start. Let's break down all the important concepts you need to understand this project.

## What is AQI?
**AQI (Air Quality Index)** is a number used by governments to communicate to the public how polluted the air currently is or how polluted it is forecast to become. 
- A low AQI (like 20) means the air is clean and healthy.
- A high AQI (like 150 or 300) means the air is very polluted and could be dangerous to breathe.

## Why AQI Matters
Air pollution can cause health problems, especially for people with asthma, children, and the elderly. By checking the AQI, people can decide if it's safe to exercise outdoors or if they should keep their windows closed.

## The Pollutants We Measure
The AQI is calculated based on several different particles and gases in the air:
- **PM2.5:** Tiny particles or droplets in the air that are 2.5 microns or less in width. They are very dangerous because they can travel deep into your lungs. (Usually comes from car exhaust and smoke).
- **PM10:** Slightly larger particles, like dust and pollen.
- **NO2 (Nitrogen Dioxide):** A nasty gas that comes mainly from burning fuel in cars and power plants.
- **SO2 (Sulfur Dioxide):** A toxic gas often produced by volcanoes and industrial factories burning coal.
- **O3 (Ozone):** While ozone high in the atmosphere protects us from the sun, ozone at ground level is bad and creates smog.
- **CO (Carbon Monoxide):** An odorless, colorless gas that can make you sick, mostly coming from car exhaust.

## AQI Calculation Basics
Every pollutant has its own "sub-index" score. The overall AQI for a city is simply the **highest** sub-index among all the pollutants measured. So if PM2.5 scores a 100, and everything else scores below 50, the city's AQI is 100.

## Weather Impact on AQI
Weather plays a huge role in air quality:
- **Wind** can blow pollution away, cleaning the air.
- **Rain** can "wash" particles out of the air.
- **High Temperature and Sunlight** can cook certain chemicals to create ground-level Ozone.
- **High Humidity** can make smog thicker.

## What Machine Learning Means
Machine Learning (ML) is a way of teaching a computer to recognize patterns instead of explicitly programming it with rules. Instead of writing "If wind > 10, then pollution goes down", we show the computer 1,000 days of past weather and pollution data. The computer figures out the complex relationships on its own.

## What XGBoost Means
**XGBoost** is a specific type of machine learning algorithm. Imagine asking 100 different simple decision trees for a prediction, and then combining their answers to get a very accurate result. It is very popular because it's fast and works really well with tabular data (like spreadsheets of weather and pollution).

## The Tech Stack: Why we use these tools

- **Why React is used:** React is a JavaScript library that makes it easy to build user interfaces. It lets us create reusable "components" (like buttons or charts) and update the screen instantly when new data arrives without reloading the whole web page.
- **Why Node.js is used:** Node.js lets us run JavaScript on our server (the backend). This is great because we can use the same language (JavaScript) on both the front and back of our website.
- **Why Express is used:** Express is a framework for Node.js that makes it very easy to create an API. It acts like a waiter in a restaurant, taking requests from the frontend and delivering the data from the backend.
- **Why FastAPI is used:** FastAPI is a framework for Python. Because most Machine Learning libraries (like XGBoost) are written in Python, we built a small separate API just to run our ML model. FastAPI is incredibly fast and easy to use.

---

## How Information Flows in This Project

### 1. Frontend Flow
When you open the website, the **React frontend** loads in your browser. You type a city name and hit search. The frontend sends an HTTP Request asking the backend for data.

### 2. Backend Flow
The **Node.js/Express backend** receives the request. It then acts as a middleman. It makes its own requests to external public APIs (like OpenWeatherMap and AQICN) to gather the raw weather and pollution data for that city.

### 3. Prediction Flow
Once the backend has the current weather and pollution, it needs a prediction. It sends all this data to our **Python AI Service**.

### 4. AI Service Flow
The **FastAPI Python service** takes the current conditions, loads our pre-trained XGBoost model, and asks it: "Based on what you've learned from the past, what will the AQI be in 24 hours?" It then sends the prediction back to the Node backend. 

The Node backend formats everything nicely and sends it to the React frontend, which then displays the beautiful charts and numbers you see on screen!

### 5. Deployment Flow
When we finish writing code, we push it to **GitHub**. We have connected our GitHub to **Vercel** (which hosts the frontend) and **Render** (which hosts the backend and AI service). Whenever we push new code, Vercel and Render automatically download the changes and update the live website!
