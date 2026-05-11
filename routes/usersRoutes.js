const express = require("express");
const usersController = require("../controllers/usersController");
const requireRole = require("../middleware/roleCheck");
const validateId = require("../middleware/validateId");

const router = express.Router();

const allRoles = ["admin", "trainer", "trainee"];
const adminOnly = ["admin"];

router.get("/", requireRole(allRoles), usersController.getAll);
router.get("/:id", requireRole(allRoles), validateId(), usersController.getById);
router.post("/", requireRole(adminOnly), usersController.create);
router.put("/:id", requireRole(adminOnly), validateId(), usersController.update);
router.delete("/:id", requireRole(adminOnly), validateId(), usersController.remove);

module.exports = router;
