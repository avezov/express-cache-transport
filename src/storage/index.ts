import {
  setItem,
  getItem,
  cleanAll,
  getAllItems
} from './Memory'

export type CacheItem = {
  expires: Date
  data: {
    data: unknown
    contentType?: string | null
  }
}

type ConfigItem = {
  /** unique key for cached item */
  key: string

  /** time to live for cached item. Milliseconds. */
  ttl: number
}

const DEFAULT_TTL = 60 * 1000;

export default class Storage {
  key: string = ''
  ttl: number = 0
  _contentType?: string | null

  constructor(config: ConfigItem) {
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
    this.ttl = !isNaN(config.ttl) ? config.ttl : DEFAULT_TTL;
  }

  /**
   * Fully clear cache
   */
  static cleanAll() {
    cleanAll();
  }

  /**
   * Get full cache object
   */
  static getAll() {
    return getAllItems()
  }

  /**
   * Get cached item from storage
   */
  get(keySuffix = '') {
    return getItem(this.key + keySuffix)
  }

  /**
   * Set item to storage
   */
  set(data: CacheItem['data'], keySuffix = '') {
    const now = new Date();
    const expires = new Date(now.valueOf() + this.ttl);
    setItem(this.key + keySuffix, data, expires);
  }
}
