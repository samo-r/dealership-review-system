const { createProxyMiddleware } = require("http-proxy-middleware");

const djangoProxyTarget =
  process.env.REACT_APP_DJANGO_PROXY_URL || "http://127.0.0.1:8000";

module.exports = function setupProxy(app) {
  app.use(
    "/djangoapp",
    createProxyMiddleware({
      target: djangoProxyTarget,
      changeOrigin: true,
    }),
  );
};
