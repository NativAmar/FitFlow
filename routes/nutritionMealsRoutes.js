'use strict'

const { Router } = require('express')
const requireAuth = require('../middleware/requireAuth')
const requireRole = require('../middleware/requireRole')
const validateId  = require('../middleware/validateId')
const ctrl        = require('../controllers/nutritionMealsController')
const itemsCtrl   = require('../controllers/nutritionMealItemsController')

const router = Router()

// ── PUT    /api/nutrition-meals/:id          (admin, trainer) ─────────────────
router.put('/:id',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  ctrl.updateMeal
)

// ── DELETE /api/nutrition-meals/:id          (admin, trainer) ─────────────────
router.delete('/:id',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  ctrl.removeMeal
)

// ── POST /api/nutrition-meals/:id/items      (admin, trainer) ─────────────────
router.post('/:id/items',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  itemsCtrl.createItem
)

module.exports = router
