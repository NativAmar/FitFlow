'use strict'

const { Router } = require('express')
const requireAuth = require('../middleware/requireAuth')
const requireRole = require('../middleware/requireRole')
const validateId  = require('../middleware/validateId')
const ctrl            = require('../controllers/workoutSessionsController')
const wseCtrl         = require('../controllers/workoutSessionExercisesController')

const router = Router()

// ── PUT    /api/workout-sessions/:id            ───────────────────────────────
router.put('/:id',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  ctrl.updateSession
)

// ── DELETE /api/workout-sessions/:id            ───────────────────────────────
router.delete('/:id',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  ctrl.removeSession
)

// ── POST   /api/workout-sessions/:id/exercises  ───────────────────────────────
router.post('/:id/exercises',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  wseCtrl.createAssignment
)

module.exports = router
