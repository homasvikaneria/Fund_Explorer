// src/app/api/cache.js
// src/app/api/cache.js
const cache = new Map();

/**
 * Set cache
 * @param {string} key
 * @param {*} data
 * @param {number} ttlMs
 */
export function setCache(key, data, ttlMs = 1000 * 60 * 60 * 12) {
  cache.set(key, { data, expireAt: Date.now() + ttlMs });
}

/**
 * Get cache
 * @param {string} key
 * @returns {*|null}
 */
export function getCache(key) {
  const cached = cache.get(key);
  if (!cached) return null;
  if (Date.now() > cached.expireAt) {
    cache.delete(key);
    return null;
  }
  return cached.data;
}

/**
 * Clear cache key (useful for testing)
 */
export function delCache(key) {
  cache.delete(key);
}
