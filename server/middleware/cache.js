const NodeCache = require('node-cache');
const { logger } = require('../utils/logger');

// Cache mit 5 Minuten TTL
const cache = new NodeCache({ 
  stdTTL: 300,
  checkperiod: 60,
  useClones: false
});

// Cache-Statistiken
let cacheStats = {
  hits: 0,
  misses: 0,
  keys: 0
};

// Cache-Middleware
const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    // Nur GET-Anfragen cachen
    if (req.method !== 'GET') {
      return next();
    }

    const key = `${req.originalUrl || req.url}`;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      cacheStats.hits++;
      logger.debug(`Cache-Hit für ${key}`);
      return res.json(cachedResponse);
    }

    cacheStats.misses++;
    logger.debug(`Cache-Miss für ${key}`);

    // Originale res.json-Methode speichern
    const originalJson = res.json;

    // res.json überschreiben
    res.json = (body) => {
      cache.set(key, body, duration);
      cacheStats.keys = cache.keys().length;
      originalJson.call(res, body);
    };

    next();
  };
};

// Cache-Statistiken abrufen
const getCacheStats = () => {
  return {
    ...cacheStats,
    hitRate: cacheStats.hits / (cacheStats.hits + cacheStats.misses) || 0
  };
};

// Cache leeren
const clearCache = () => {
  cache.flushAll();
  cacheStats = {
    hits: 0,
    misses: 0,
    keys: 0
  };
  logger.info('Cache wurde geleert');
};

module.exports = {
  cacheMiddleware,
  getCacheStats,
  clearCache
}; 