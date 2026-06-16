const authData = require("../models/authData");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function wrap(fn) {
  return function wrapped(req, res, next) {
    try {
      const out = fn(req, res, next);
      if (out != null && typeof out.then === "function") {
        out.catch(next);
      }
    } catch (err) {
      next(err);
    }
  };
}

function fail(status, code, message, details) {
  const e = new Error(message);
  e.status = status;
  e.code = code;
  e.details = details;
  return e;
}

function validateLoginBody(body) {
  const errors = [];

  if (body.email === undefined || body.email === null || String(body.email).trim() === "") {
    errors.push({ field: "email", message: "email is required" });
  } else if (!EMAIL_REGEX.test(String(body.email).trim())) {
    errors.push({ field: "email", message: "email must be a valid email address" });
  }

  if (body.password === undefined || body.password === null || String(body.password) === "") {
    errors.push({ field: "password", message: "password is required" });
  } else if (String(body.password).length < 6) {
    errors.push({ field: "password", message: "password must be at least 6 characters" });
  }

  if (errors.length > 0) {
    throw fail(400, "VALIDATION_ERROR", "Validation failed", { fields: errors });
  }

  return {
    email: String(body.email).trim(),
    password: String(body.password),
  };
}

function login(req, res) {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const { email, password } = validateLoginBody(body);

  const user = authData.findByCredentials(email, password);
  if (!user) {
    throw fail(401, "INVALID_CREDENTIALS", "Invalid email or password.", {});
  }

  res.json({
    success: true,
    data: {
      token: user.token,
      user: authData.toPublic(user),
    },
    error: null,
  });
}

function logout(req, res) {
  res.json({
    success: true,
    data: { message: "Logged out successfully." },
    error: null,
  });
}

function getMe(req, res) {
  res.json({
    success: true,
    data: authData.toPublic(req.authUser),
    error: null,
  });
}

module.exports = {
  login: wrap(login),
  logout: wrap(logout),
  getMe: wrap(getMe),
};
