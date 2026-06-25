'use strict'

const { Router } = require('express')
const requireAuth = require('../middleware/requireAuth')
const requireRole = require('../middleware/requireRole')
const validateId  = require('../middleware/validateId')
const ctrl            = require('../controllers/workoutSessionExercisesController')

const router = Router()

// ── PUT    /api/workout-session-exercises/:id  ────────────────────────────────
router.put('/:id',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  ctrl.updateAssignment
)

// ── DELETE /api/workout-session-exercises/:id  ────────────────────────────────
router.delete('/:id',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  ctrl.removeAssignment
)

module.exports = router
