const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const env = require('./config/env');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const aqiRoutes = require('./routes/aqiRoutes');

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

// Routes — Defensive Dual Routing to support both paths
app.use('/aqi', aqiRoutes);
app.use('/api/aqi', aqiRoutes);

// Health check
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
