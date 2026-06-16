/**
 * Django API base URL for production (Vercel → Railway direct).
 * Leave unset locally so create-react-app's setupProxy.js handles /djangoapp.
 */
const DJANGO_API_BASE = (process.env.REACT_APP_DJANGO_API_URL || "").replace(
  /\/$/,
  "",
);

/**
 * @param {string} path - e.g. "/djangoapp/login/" or "/djangoapp/dealer/1"
 * @returns {string}
 */
export function djangoApiUrl(path) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!DJANGO_API_BASE) {
    return normalized;
  }
  return `${DJANGO_API_BASE}${normalized}`;
}
