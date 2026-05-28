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
const allowedOrigins = [
  'https://clearsky-ai-weld.vercel.app',
  'http://localhost:3002',
  'http://localhost:3000',
  'http://localhost:5173'
];
if (env.FRONTEND_URL) allowedOrigins.push(env.FRONTEND_URL);
if (env.AI_SERVICE_URL) allowedOrigins.push(env.AI_SERVICE_URL);

app.use(cors({ 
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error('CORS blocked: Origin not allowed'), false);
  },
  credentials: true 
}));
app.use(express.json());

// Apply rate limiting to all requests
app.use(rateLimiter);

// Routes — Defensive Dual Routing to support both paths
app.use('/aqi', aqiRoutes);
app.use('/api/aqi', aqiRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', uptime: process.uptime() });
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
