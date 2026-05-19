/**
 * Global Express error handler — uniform JSON error envelope.
 */
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status && Number.isInteger(err.status) ? err.status : 500;
  const code = typeof err.code === "string" ? err.code : "INTERNAL_ERROR";
  const message =
    typeof err.message === "string" && err.message.length > 0
      ? err.message
      : "Something went wrong";
  const details =
    err.details !== undefined && err.details !== null && typeof err.details === "object"
      ? err.details
      : {};

  res.status(status).json({
    success: false,
    data: null,
    error: {
      code,
      message,
      details,
    },
  });
}

module.exports = errorHandler;
