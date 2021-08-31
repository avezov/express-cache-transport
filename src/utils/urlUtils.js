import cookie from 'cookie'

export function parseSearchFromUrl(sourceUrl) {
  const url = new URL(sourceUrl, 'http://example.com');
  return url.search;
}

export function mergeCookies(fromReq = {}) {
  let cookies = { ...fromReq };
  return Object.keys(cookies).map(key => cookie.serialize(key, cookies[key])).join('; ');
}
