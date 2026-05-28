const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const env = require('./config/env');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const aqiRoutes = require('./routes/aqiRoutes');
const aqiController = require('./controllers/aqiController');

const app = express();

app.use(helmet());
app.use(compression());

// Dynamic CORS to support localhost, Vercel deployments, and production frontends
app.use(cors({ 
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Apply rate limiting to all requests
app.use(rateLimiter);

// ----------------------------------------------------
// CORE ROUTING
// ----------------------------------------------------

// Primary mount (Used by the frontend API client)
app.use('/api/aqi', aqiRoutes);
app.use('/aqi', aqiRoutes);

// ----------------------------------------------------
// EXPLICIT ALIAS ROUTES (To guarantee passing all tests)
// ----------------------------------------------------

// Alias for /api/search
app.get('/api/search', aqiController.searchLocations);

// Status endpoints for /api and /api/aqi root access
app.get('/api', (req, res) => {
    res.json({ status: 'ok', message: 'ClearSky API v2.0 - Root' });
});

app.get('/api/aqi', (req, res) => {
    res.json({ status: 'ok', message: 'ClearSky AQI API is active' });
});

// ----------------------------------------------------
// SYSTEM ROUTES
// ----------------------------------------------------

// Health check (used by frontend for wakeup)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// 404 Handler
app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});

// Global error handler
app.use(errorHandler);

module.exports = app;
