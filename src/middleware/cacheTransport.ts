import fetch from 'cross-fetch'
import cacheStorage from '../storage/index.js'
import { parseSearchFromUrl, mergeCookies } from '../utils/urlUtils.js'
import { NextFunction, Request, Response } from 'express'

type ComputeHashProps = {
  search: string
  cookies: Request['cookies']
  req: Request
}
type ComputeHash = (props: ComputeHashProps) => string

type CacheConfigItem = {
  /** source path of transport endpoint */
  path: string

  /** destination path to get data */
  destination: string

  /** time to live for cached item */
  ttl: number

  /** custom function for generating storage key */
  computeHash?: ComputeHash

  /** redirect request to target URL if error happens */
  redirectOnError?: boolean

  /** callback on internal fetch error */
  onError?: (error: Error, req: Request, res: Response) => void

  headers?: Record<string, string> | ((req: Request) => Record<string, string>)
}

type CacheTransportParams = {
  /** configuration of transport endpoints */
  cacheConfig: CacheConfigItem[]

  /** use cookies for internal fetching */
  useCookie?: boolean

  /** custom function for generating storage key */
  computeHash?: ComputeHash

  /** add debug endpoints */
  debug?: boolean

  /** redirect request to target URL if error happens */
  redirectOnError?: boolean

  /** callback on internal fetch error */
  onError?: (error: Error, req: Request, res: Response) => void
}

export function createCacheTransport({
  cacheConfig,
  useCookie,
  computeHash,
  debug = false,
  redirectOnError = true,
  onError
}: CacheTransportParams) {
  const cacheStorageByKey: Record<string, cacheStorage> = cacheConfig.reduce((prev, next) => ({
    ...prev,
    [next.path]: new cacheStorage({
      key: next.path,
      ttl: next.ttl
    })
  }), {});

  const cacheTransportMiddleware = function (req: Request, res: Response, next: NextFunction) {
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

          const fetchOptions: RequestInit = {
            headers: {
              'User-Agent': req.get('User-Agent') ?? '',
              'X-Forwarded-For': req.get('X-Forwarded-For') ?? '',
              'Accept-Language': req.get('Accept-Language') ?? '',
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
                const errorHandler = config.onError ?? onError
                if (errorHandler) {
                  errorHandler(error, req, res)
                } else {
                  res.send({ cacheTransport: 'Destination url is not available', error })

                }
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
