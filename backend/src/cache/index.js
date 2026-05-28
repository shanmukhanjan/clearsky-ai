const NodeCache = require('node-cache');

// AQI data: 10 min TTL | Search results: 2 min TTL
// We use a single cache but override TTL per key in the controller
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120, useClones: false });

module.exports = cache;
