const traineesData = require("../models/traineesData");

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

const VALID_EXPERIENCE_LEVELS = ["beginner", "intermediate", "advanced"];
const VALID_STATUS = ["active", "paused", "completed"];

function parsePositiveInt(value) {
  const n = typeof value === "number" ? value : parseInt(String(value), 10);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

function validateTraineeBody(body, isUpdate) {
  const missing = [];
  if (body.userId === undefined || body.userId === null || body.userId === "") {
    missing.push("userId");
  }
  if (body.trainerId === undefined || body.trainerId === null || body.trainerId === "") {
    missing.push("trainerId");
  }
  if (body.fitnessGoal === undefined || body.fitnessGoal === null || String(body.fitnessGoal).trim() === "") {
    missing.push("fitnessGoal");
  }
  if (
    body.experienceLevel === undefined ||
    body.experienceLevel === null ||
    String(body.experienceLevel).trim() === ""
  ) {
    missing.push("experienceLevel");
  }
  if (body.weeklyWorkouts === undefined || body.weeklyWorkouts === null || body.weeklyWorkouts === "") {
    missing.push("weeklyWorkouts");
  }
  if (body.status === undefined || body.status === null || String(body.status).trim() === "") {
    missing.push("status");
  }
  if (missing.length > 0) {
    throw fail(400, "VALIDATION_ERROR", "Missing required fields", {
      fields: missing,
      hint: isUpdate
        ? "PUT requires userId, trainerId, fitnessGoal, experienceLevel, weeklyWorkouts, and status"
        : "POST requires userId, trainerId, fitnessGoal, experienceLevel, weeklyWorkouts, and status",
    });
  }

  const userId = parsePositiveInt(body.userId);
  if (userId === null) {
    throw fail(400, "VALIDATION_ERROR", "userId must be a positive integer", { field: "userId", value: body.userId });
  }

  const trainerId = parsePositiveInt(body.trainerId);
  if (trainerId === null) {
    throw fail(400, "VALIDATION_ERROR", "trainerId must be a positive integer", {
      field: "trainerId",
      value: body.trainerId,
    });
  }

  const weeklyWorkouts = parsePositiveInt(body.weeklyWorkouts);
  if (weeklyWorkouts === null) {
    throw fail(400, "VALIDATION_ERROR", "weeklyWorkouts must be a positive integer", {
      field: "weeklyWorkouts",
      value: body.weeklyWorkouts,
    });
  }

  const experienceLevel = String(body.experienceLevel).trim().toLowerCase();
  if (!VALID_EXPERIENCE_LEVELS.includes(experienceLevel)) {
    throw fail(400, "VALIDATION_ERROR", "Invalid experienceLevel value", {
      field: "experienceLevel",
      allowed: VALID_EXPERIENCE_LEVELS.slice(),
    });
  }

  const status = String(body.status).trim().toLowerCase();
  if (!VALID_STATUS.includes(status)) {
    throw fail(400, "VALIDATION_ERROR", "Invalid status value", {
      field: "status",
      allowed: VALID_STATUS.slice(),
    });
  }

  const row = {
    userId,
    trainerId,
    fitnessGoal: String(body.fitnessGoal).trim(),
    experienceLevel,
    weeklyWorkouts,
    status,
  };

  return row;
}

function getAll(req, res) {
  const data = traineesData.getAll();
  res.json({ success: true, data, error: null });
}

function getById(req, res) {
  const trainee = traineesData.getById(req.parsedId);
  if (!trainee) {
    throw fail(404, "TRAINEE_NOT_FOUND", `Trainee with traineeId ${req.parsedId} not found`, { id: req.parsedId });
  }
  res.json({ success: true, data: trainee, error: null });
}

function create(req, res) {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const payload = validateTraineeBody(body, false);
  const created = traineesData.create(payload);
  res.status(201).json({ success: true, data: created, error: null });
}

function update(req, res) {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const payload = validateTraineeBody(body, true);
  const updated = traineesData.update(req.parsedId, payload);
  if (!updated) {
    throw fail(404, "TRAINEE_NOT_FOUND", `Trainee with traineeId ${req.parsedId} not found`, { id: req.parsedId });
  }
  res.json({ success: true, data: updated, error: null });
}

function remove(req, res) {
  const removed = traineesData.remove(req.parsedId);
  if (!removed) {
    throw fail(404, "TRAINEE_NOT_FOUND", `Trainee with traineeId ${req.parsedId} not found`, { id: req.parsedId });
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
