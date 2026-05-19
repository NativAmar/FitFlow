const usersData = require("../models/usersData");

const VALID_ROLES = ["admin", "trainer", "trainee"];

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

function validateUserBody(body, isUpdate) {
  const missing = [];
  if (body.firstName === undefined || body.firstName === null || String(body.firstName).trim() === "") {
    missing.push("firstName");
  }
  if (body.lastName === undefined || body.lastName === null || String(body.lastName).trim() === "") {
    missing.push("lastName");
  }
  if (body.userRole === undefined || body.userRole === null || String(body.userRole).trim() === "") {
    missing.push("userRole");
  }
  if (missing.length > 0) {
    throw fail(400, "VALIDATION_ERROR", "Missing required fields", {
      fields: missing,
      hint: isUpdate
        ? "PUT requires firstName, lastName, and userRole"
        : "POST requires firstName, lastName, and userRole",
    });
  }

  const userRole = String(body.userRole).trim().toLowerCase();
  if (!VALID_ROLES.includes(userRole)) {
    throw fail(400, "VALIDATION_ERROR", "Invalid userRole value", {
      field: "userRole",
      allowed: VALID_ROLES.slice(),
    });
  }

  return {
    firstName: String(body.firstName).trim(),
    lastName: String(body.lastName).trim(),
    userRole,
  };
}

function getAll(req, res) {
  const data = usersData.getAll();
  res.json({ success: true, data, error: null });
}

function getById(req, res) {
  const user = usersData.getById(req.parsedId);
  if (!user) {
    throw fail(404, "USER_NOT_FOUND", `User with userId ${req.parsedId} not found`, { id: req.parsedId });
  }
  res.json({ success: true, data: user, error: null });
}

function create(req, res) {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const payload = validateUserBody(body, false);
  const created = usersData.create(payload);
  res.status(201).json({ success: true, data: created, error: null });
}

function update(req, res) {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const payload = validateUserBody(body, true);
  const updated = usersData.update(req.parsedId, payload);
  if (!updated) {
    throw fail(404, "USER_NOT_FOUND", `User with userId ${req.parsedId} not found`, { id: req.parsedId });
  }
  res.json({ success: true, data: updated, error: null });
}

function remove(req, res) {
  const removed = usersData.remove(req.parsedId);
  if (!removed) {
    throw fail(404, "USER_NOT_FOUND", `User with userId ${req.parsedId} not found`, { id: req.parsedId });
  }
  res.json({ success: true, data: removed, error: null });
}

module.exports = {
  getAll: wrap(getAll),
  getById: wrap(getById),
  create: wrap(create),
  update: wrap(update),
  remove: wrap(remove),
};
