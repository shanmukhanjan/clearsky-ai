require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please kill the conflicting process.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});
