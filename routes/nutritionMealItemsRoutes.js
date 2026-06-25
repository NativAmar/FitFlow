'use strict'

const { Router } = require('express')
const requireAuth = require('../middleware/requireAuth')
const requireRole = require('../middleware/requireRole')
const validateId  = require('../middleware/validateId')
const ctrl        = require('../controllers/nutritionMealItemsController')

const router = Router()

// ── PUT    /api/nutrition-meal-items/:id     (admin, trainer) ─────────────────
router.put('/:id',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  ctrl.updateItem
)

// ── DELETE /api/nutrition-meal-items/:id     (admin, trainer) ─────────────────
router.delete('/:id',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  ctrl.removeItem
)

module.exports = router
