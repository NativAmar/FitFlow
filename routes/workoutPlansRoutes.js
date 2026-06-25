'use strict'

const { Router } = require('express')
const requireAuth = require('../middleware/requireAuth')
const requireRole = require('../middleware/requireRole')
const validateId  = require('../middleware/validateId')
const ctrl            = require('../controllers/workoutPlansController')
const sessCtrl        = require('../controllers/workoutSessionsController')

const router = Router()

// ── GET  /api/workout-plans/:id            (admin, trainer, trainee) ─────────
router.get('/:id',
  requireAuth,
  validateId(),
  ctrl.getById
)

// ── PUT  /api/workout-plans/:id            (admin, trainer) ───────────────────
router.put('/:id',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  ctrl.update
)

// ── PATCH /api/workout-plans/:id/status    (admin, trainer) ───────────────────
router.patch('/:id/status',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  ctrl.updateStatus
)

// ── DELETE /api/workout-plans/:id          (admin, trainer) ───────────────────
router.delete('/:id',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  ctrl.remove
)

// ── POST /api/workout-plans/:id/sessions   (admin, trainer) ───────────────────
router.post('/:id/sessions',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  sessCtrl.createSession
)

module.exports = router
