const DEFAULT_PRODUCTION_API_BASE =
  "https://autocarsugdjangoapi-production.up.railway.app";

/**
 * Resolves Django API paths for local dev vs production.
 * Local: relative /djangoapp/* (proxied by setupProxy.js).
 * Production: absolute URL to Railway Django (REACT_APP_API_URL or default).
 *
 * @param {string} path - e.g. "/djangoapp/login/"
 * @returns {string}
 */
export function getApiUrl(path) {
  const normalized = path.startsWith("/") ? path : `/${path}`;

  if (process.env.NODE_ENV === "production") {
    const base = (
      process.env.REACT_APP_API_URL || DEFAULT_PRODUCTION_API_BASE
    ).replace(/\/$/, "");
    return `${base}${normalized}`;
  }

  return normalized;
}
