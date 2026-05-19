/**
 * Allows only listed roles (from x-user-role header). Role string is compared case-insensitively.
 */
function requireRole(allowedRoles) {
  const allowed = allowedRoles.map((r) => String(r).toLowerCase());

  return function roleMiddleware(req, res, next) {
    const header = req.headers["x-user-role"];
    if (header === undefined || header === null || String(header).trim() === "") {
      const err = new Error("You do not have permission to perform this action.");
      err.status = 403;
      err.code = "FORBIDDEN";
      err.details = { header: "x-user-role" };
      return next(err);
    }

    const role = String(header).trim().toLowerCase();
    if (!allowed.includes(role)) {
      const err = new Error("You do not have permission to perform this action.");
      err.status = 403;
      err.code = "FORBIDDEN";
      err.details = { role, allowedRoles: allowedRoles.slice() };
      return next(err);
    }

    req.userRole = role;
    next();
  };
}

module.exports = requireRole;
