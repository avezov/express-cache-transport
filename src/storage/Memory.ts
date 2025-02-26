import { CacheItem } from ".";

let CACHE: Record<string, CacheItem> = {};

/**
 * Wipe all cache data
 */
export function cleanAll() {
  CACHE = {};
}


/**
 * Add or replace cache data with unique key
 */
export function setItem(key: string, data: CacheItem['data'], expires = new Date()) {
  CACHE[key] = {
    data,
    expires
  }
}

/**
 * Delete cached data from storage
 */
export function deleteItem(key: string) {
  delete CACHE[key];
}

/**
 * Get cached data
 */
export function getItem(key: string) {
  const cachedItem = CACHE[key];
  if (!cachedItem) {
    return null;
  }

  const now = new Date();
  if (now.valueOf() > cachedItem.expires.valueOf()) {
    deleteItem(key);
    return null;
  }

  return cachedItem.data;
}

/**
 * Get all cached data
 */
export function getAllItems() {
  return CACHE;
}
