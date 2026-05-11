/**
 * Validates that req.params[paramName] is a positive integer.
 * Sets req.parsedId to the parsed number.
 */
function validateId(paramName = "id") {
  return function validateIdMiddleware(req, res, next) {
    const raw = req.params[paramName];
    const id = parseInt(String(raw), 10);
    if (Number.isNaN(id) || id <= 0) {
      const err = new Error("Invalid id");
      err.status = 400;
      err.code = "INVALID_ID";
      err.details = { param: paramName, value: raw };
      return next(err);
    }
    req.parsedId = id;
    next();
  };
}

module.exports = validateId;
