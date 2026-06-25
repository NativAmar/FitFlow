'use strict'

const { Router } = require('express')
const requireAuth = require('../middleware/requireAuth')
const requireRole = require('../middleware/requireRole')
const validateId  = require('../middleware/validateId')
const ctrl        = require('../controllers/nutritionPlansController')
const mealsCtrl   = require('../controllers/nutritionMealsController')

const router = Router()

// ── GET  /api/nutrition-plans/:id            (admin, trainer, trainee) ────────
router.get('/:id',
  requireAuth,
  validateId(),
  ctrl.getById
)

// ── PUT  /api/nutrition-plans/:id            (admin, trainer) ─────────────────
router.put('/:id',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  ctrl.update
)

// ── PATCH /api/nutrition-plans/:id/status    (admin, trainer) ─────────────────
router.patch('/:id/status',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  ctrl.updateStatus
)

// ── DELETE /api/nutrition-plans/:id          (admin, trainer) ─────────────────
router.delete('/:id',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  ctrl.remove
)

// ── POST /api/nutrition-plans/:id/meals      (admin, trainer) ─────────────────
router.post('/:id/meals',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  mealsCtrl.createMeal
)

module.exports = router
