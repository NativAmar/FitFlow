/**
 * Logs HTTP method, URL, response status, and duration after the response finishes.
 */
function logger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms)`
    );
  });
  next();
}

module.exports = logger;
