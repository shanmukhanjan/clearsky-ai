require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5001,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3002',
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || '',
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:8000'
};
