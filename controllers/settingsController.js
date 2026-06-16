const settingsData = require("../models/settingsData");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_THEMES = ["light", "dark", "system"];

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

function validateSettingsBody(body) {
  const errors = [];

  if (
    body.displayName === undefined ||
    body.displayName === null ||
    String(body.displayName).trim() === ""
  ) {
    errors.push({ field: "displayName", message: "displayName is required" });
  }

  if (body.email === undefined || body.email === null || String(body.email).trim() === "") {
    errors.push({ field: "email", message: "email is required" });
  } else if (!EMAIL_REGEX.test(String(body.email).trim())) {
    errors.push({ field: "email", message: "email must be a valid email address" });
  }

  if (body.theme === undefined || body.theme === null || String(body.theme).trim() === "") {
    errors.push({ field: "theme", message: "theme is required" });
  } else if (!VALID_THEMES.includes(String(body.theme).trim().toLowerCase())) {
    errors.push({
      field: "theme",
      message: "theme must be one of: light, dark, system",
      allowed: VALID_THEMES.slice(),
    });
  }

  if (errors.length > 0) {
    throw fail(400, "VALIDATION_ERROR", "Validation failed", { fields: errors });
  }

  return {
    displayName: String(body.displayName).trim(),
    email: String(body.email).trim(),
    theme: String(body.theme).trim().toLowerCase(),
  };
}

function getSettings(req, res) {
  res.json({ success: true, data: settingsData.get(), error: null });
}

function updateSettings(req, res) {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const payload = validateSettingsBody(body);
  const updated = settingsData.update(payload);
  res.json({ success: true, data: updated, error: null });
}

module.exports = {
  getSettings: wrap(getSettings),
  updateSettings: wrap(updateSettings),
};
