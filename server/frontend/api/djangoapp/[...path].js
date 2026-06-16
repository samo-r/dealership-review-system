const DEFAULT_DJANGO_API_URL =
  "https://autocarsugdjangoapi-production.up.railway.app";

module.exports = async (req, res) => {
  const djangoBase = (
    process.env.DJANGO_API_URL || DEFAULT_DJANGO_API_URL
  ).replace(/\/$/, "");

  const pathSegments = req.query.path;
  const suffix = Array.isArray(pathSegments)
    ? pathSegments.join("/")
    : pathSegments || "";
  const targetPath = suffix ? `/djangoapp/${suffix}` : "/djangoapp";
  const requestUrl = new URL(req.url || "", "http://localhost");
  const upstreamUrl = `${djangoBase}${targetPath}${requestUrl.search}`;

  const headers = {};
  if (req.headers["content-type"]) {
    headers["Content-Type"] = req.headers["content-type"];
  }
  if (req.headers.authorization) {
    headers.Authorization = req.headers.authorization;
  }

  const init = {
    method: req.method,
    headers,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    if (typeof req.body === "string") {
      init.body = req.body;
    } else if (req.body !== undefined && req.body !== null) {
      init.body = JSON.stringify(req.body);
      if (!headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
      }
    }
  }

  try {
    const upstream = await fetch(upstreamUrl, init);
    const body = await upstream.arrayBuffer();

    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() === "transfer-encoding") {
        return;
      }
      res.setHeader(key, value);
    });
    res.send(Buffer.from(body));
  } catch (error) {
    res.status(502).json({
      status: 502,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: "Could not reach the Django API.",
        details: error.message,
      },
    });
  }
};
