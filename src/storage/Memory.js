/**
 * @typedef {import('./index.js').CacheItem} CacheItem
 */

let CACHE = {};

/**
 * Wipe all cache data
 */
export function cleanAll() {
  CACHE = {};
}


/**
 * Add or replace cache data with unique key
 * @param {string} key - unique key
 * @param {CacheItem} data
 */
export function setItem(key, data, expires = new Date()) {
  CACHE[key] = {
    data,
    expires
  }
}

/**
 * Delete cached data from storage
 * @param {string} key - unique key
 */
export function deleteItem(key) {
  delete CACHE[key];
}

/**
 * Get cached data
 * @param {string} key
 * @returns {CacheItem|null} cached data
 */
export function getItem(key) {
  const cachedItem = CACHE[key];
  if (!cachedItem) {
    return null;
  }

  const now = new Date();
  if (now.valueOf() > cachedItem.expires) {
    deleteItem(key);
    return null;
  }

  return cachedItem.data;
}

/**
 * Get all cached data
 * @returns {Object} all cached data
 */
export function getAllItems() {
  return CACHE;
}
