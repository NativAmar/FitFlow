const authData = require("../models/authData");

/**
 * Resolves Bearer token from Authorization header and sets req.authUser.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header === undefined || header === null || String(header).trim() === "") {
    const err = new Error("Authentication is required.");
    err.status = 401;
    err.code = "UNAUTHORIZED";
    err.details = { header: "Authorization" };
    return next(err);
  }

  const match = String(header).trim().match(/^Bearer\s+(.+)$/i);
  if (!match) {
    const err = new Error("Authentication is required.");
    err.status = 401;
    err.code = "UNAUTHORIZED";
    err.details = { header: "Authorization" };
    return next(err);
  }

  const user = authData.findByToken(match[1].trim());
  if (!user) {
    const err = new Error("Authentication is required.");
    err.status = 401;
    err.code = "UNAUTHORIZED";
    err.details = { header: "Authorization" };
    return next(err);
  }

  req.authUser = user;
  next();
}

module.exports = requireAuth;
