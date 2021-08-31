import {
  setItem,
  getItem,
  cleanAll,
  getAllItems
} from './Memory.js'

/**
 * Cache item.
 * @typedef {Object} CacheItem
 * @property {number} expires
 * @property {object} data
 */

/**
 * Config item
 * @typedef {Object} ConfigItem
 * @property {string} key - unique key for cached item
 * @property {number} ttl - time to live for cached item. Milliseconds.
 */

const DEFAULT_TTL = 60 * 1000;

export default class Storage {
  /**
   * @param {ConfigItem} config
   */
  constructor(config) {
    if (typeof config.key !== 'string') {
      console.error(`Key for cache must be a string. Received type: ${typeof config.key}`);
      console.trace();
      return;
    }

    if (typeof config.ttl !== 'number') {
      console.error(`TTL for cache must be a number. Received type: ${typeof config.ttl}`);
      console.trace();
      return;
    }

    this.key = config.key;
    this.ttl = typeof config.ttl === 'number' && !isNaN(config.ttl) ? config.ttl : DEFAULT_TTL;
  }

  /**
   * @function
   * Fully clear cache
   */
  static cleanAll() {
    cleanAll();
  }

  /**
   * Get full cache object
   * @returns {Object}
   */
  static getAll() {
    return getAllItems()
  }

  /**
   * Get cached item from storage
   * @param {string} keySuffix - additional for keystring
   * @returns {any} cached data
   */
  get(keySuffix = '') {
    return getItem(this.key + keySuffix)
  }

  /**
   * Set item to storage
   * @param {any} data
   * @param {string} keySuffix - additional for keystring
   */
  set(data, keySuffix = '') {
    const now = new Date();
    const expires = new Date(now.valueOf() + this.ttl);
    setItem(this.key + keySuffix, data, expires);
  }
}
