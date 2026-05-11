const express = require("express");
const traineesController = require("../controllers/traineesController");
const requireRole = require("../middleware/roleCheck");
const validateId = require("../middleware/validateId");

const router = express.Router();

const allRoles = ["admin", "trainer", "trainee"];
const adminOrTrainer = ["admin", "trainer"];
const adminOnly = ["admin"];

router.get("/", requireRole(allRoles), traineesController.getAll);
router.get("/:id", requireRole(allRoles), validateId(), traineesController.getById);
router.post("/", requireRole(adminOrTrainer), traineesController.create);
router.put("/:id", requireRole(adminOrTrainer), validateId(), traineesController.update);
router.delete("/:id", requireRole(adminOnly), validateId(), traineesController.remove);

module.exports = router;
