import fetch from 'isomorphic-fetch'
import cacheStorage from '../storage/index.js'
import { parseSearchFromUrl, mergeCookies } from '../utils/urlUtils.js'

/**
 * @typedef {Object} cacheConfigItem
 * @property {String} path - source path of transport endpoint
 * @property {String} destination - destination path to get data
 * @property {Number} ttl - time to live for cached item
 * @property {Function} [computeHash] - custom function for generating storage key
 * @property {Boolean} [redirectOnError] - redirect request to target URL if error happens
 */

/**
 * @typedef {Object} cacheTransportParams
 * @property {cacheConfigItem[]} cacheConfig - configuration of transport endpoints
 * @property {Boolean} [useCookie] - use cookies for internal fetching
 * @property {Function} [computeHash] - custom function for generating storage key
 * @property {Boolean} [debug] - add debug endpoints
 * @property {Boolean} [redirectOnError] - redirect request to target URL if error happens
 * @property {Function} [onError] - callback on internal fetch error
 */

/**
 * @param {cacheTransportParams}
 * @returns {Function} - cacheTransportMiddleware
 */
export function createCacheTransport({ cacheConfig, useCookie, computeHash, debug = false, redirectOnError = true, onError }) {
  const cacheStorageByKey = cacheConfig.reduce((prev, next) => ({
    ...prev,
    [next.path]: new cacheStorage({
      key: next.path,
      ttl: next.ttl
    })
  }), {});

  const cacheTransportMiddleware = function (req, res, next) {
    cacheConfig.forEach(config => {
      const cached = cacheStorageByKey[config.path];

      if (debug) {
        req.app.get('/debug/list', (req, res) => {
          res.send(cacheStorage.getAll());
        });
      }

      req.app.get(config.path, (req, res) => {
        const search = parseSearchFromUrl(req.originalUrl) || ''
        const cacheKey = (
          config.computeHash ? config.computeHash({ search, cookies: req.cookies, req }) :
            computeHash ? computeHash({ search, cookies: req.cookies, req }) :
              search
        );
        const cachedData = cached.get(cacheKey);

        if (cachedData) {
          res.set({ 'content-type': cachedData.contentType })
          res.send(cachedData.data);
        } else {
          const url = new URL(config.destination);
          url.search = search;

          const fetchOptions = {
            headers: {
              'User-Agent': req.get('User-Agent'),
              'X-Forwarded-For': req.get('X-Forwarded-For'),
              'Accept-Language': req.get('Accept-Language'),
              ...(typeof config.headers === 'function'
                ? config.headers(req) : config.headers),
            }
          };

          if (useCookie) {
            fetchOptions.credentials = 'include';
            fetchOptions.headers = {
              ...fetchOptions.headers,
              Cookie: mergeCookies(req.cookies)
            }
          }

          fetch(url.toString(), fetchOptions)
            .then(response => {
              if (!response.ok) {
                throw new Error('Response is not cacheable');
              }

              cached._contentType = response.headers.get('content-type')
              res.set({ 'content-type': cached._contentType })
              return response;
            })
            .then(response => response.text())
            .then(response => {
              cached.set({
                data: response,
                contentType: cached._contentType
              }, cacheKey);
              res.send(response);
            })
            .catch((error) => {
              if (redirectOnError && config.redirectOnError !== false || config.redirectOnError === true) {
                res.redirect(url.toString())
              } else {
                config.onError?.(error, req, res) ??
                  onError?.(error, req, res) ??
                  res.send({ cacheTransport: 'Destination url is not available', error })
              }
            })

        }

      });
    });


    next();
  }
  return cacheTransportMiddleware;
}

export default createCacheTransport;
