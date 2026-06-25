'use strict'

const { NutritionMealItem } = require('../models/index')
const {
  serializeItem,
  resolveMealOwnership,
  resolveItemOwnership,
  nextItemOrder,
  validateQuantityUnit
} = require('../services/nutritionPlanService')
const { tryCreateAndEmitNotification } = require('../services/notificationService')
const { NOTIFICATION_TYPES } = require('../constants/notificationTypes')

// ── Helpers ───────────────────────────────────────────────────────────────────

function wrap(fn) {
  return function wrapped(req, res, next) {
    try {
      const out = fn(req, res, next)
      if (out != null && typeof out.then === 'function') out.catch(next)
    } catch (err) {
      next(err)
    }
  }
}

function fail(status, code, message, details) {
  const e = new Error(message)
  e.status  = status
  e.code    = code
  e.details = details || {}
  return e
}

function safeBody(req) {
  const b = req.body
  return b && typeof b === 'object' && !Array.isArray(b) ? b : {}
}

// ── POST /api/nutrition-meals/:id/items  (admin, trainer) ────────────────────

async function createItem(req, res) {
  const body = safeBody(req)
  const { meal, plan, trainee } = await resolveMealOwnership(req.parsedId, req.user)

  if (plan.status === 'archived') {
    throw fail(409, 'NUTRITION_PLAN_ARCHIVED', 'Archived nutrition plans are read-only.', { planId: plan.id })
  }

  const foodName = body.foodName ? String(body.foodName).trim() : ''
  if (!foodName) throw fail(400, 'VALIDATION_ERROR', 'foodName is required.', { field: 'foodName' })
  if (foodName.length > 200) throw fail(400, 'VALIDATION_ERROR', 'foodName must be 200 characters or fewer.', { field: 'foodName' })

  const quantity = (body.quantity !== null && body.quantity !== undefined && String(body.quantity).trim() !== '')
    ? body.quantity : null
  const unit = (body.unit !== null && body.unit !== undefined && String(body.unit).trim() !== '')
    ? String(body.unit).trim() : null

  validateQuantityUnit(quantity, unit)

  if (unit && unit.length > 50) {
    throw fail(400, 'VALIDATION_ERROR', 'unit must be 50 characters or fewer.', { field: 'unit' })
  }

  const notes = body.notes ? String(body.notes).trim() || null : null
  if (notes && notes.length > 2000) {
    throw fail(400, 'VALIDATION_ERROR', 'notes must be 2000 characters or fewer.', { field: 'notes' })
  }

  let displayOrder
  if (body.displayOrder !== undefined && body.displayOrder !== null) {
    displayOrder = parseInt(String(body.displayOrder), 10)
    if (Number.isNaN(displayOrder) || displayOrder <= 0) {
      throw fail(400, 'VALIDATION_ERROR', 'displayOrder must be a positive integer.', { field: 'displayOrder' })
    }
  } else {
    displayOrder = await nextItemOrder(meal.id)
  }

  const item = await NutritionMealItem.create({
    nutritionMealId: meal.id,
    foodName,
    quantity: quantity !== null ? Number(quantity) : null,
    unit,
    notes,
    displayOrder
  })

  const created = await NutritionMealItem.findByPk(item.id)

  if (plan.status === 'active' && trainee) {
    await tryCreateAndEmitNotification({
      type:            NOTIFICATION_TYPES.NUTRITION_PLAN_UPDATED,
      recipientUserId: trainee.userId,
      actorUserId:     req.user.id,
      title:           'Nutrition Plan Updated',
      message:         `A food item has been added to your active nutrition plan.`,
      metadata:        { traineeId: trainee.id, nutritionPlanId: plan.id, link: '/trainee/nutrition' }
    })
  }

  res.status(201).json({ success: true, data: serializeItem(created), error: null })
}

// ── PUT /api/nutrition-meal-items/:id  (admin, trainer) ──────────────────────

async function updateItem(req, res) {
  const body = safeBody(req)
  const { item, plan, trainee } = await resolveItemOwnership(req.parsedId, req.user)

  if (plan.status === 'archived') {
    throw fail(409, 'NUTRITION_PLAN_ARCHIVED', 'Archived nutrition plans are read-only.', { planId: plan.id })
  }

  const updates = {}

  if (body.foodName !== undefined) {
    const fn = String(body.foodName).trim()
    if (!fn) throw fail(400, 'VALIDATION_ERROR', 'foodName cannot be empty.', { field: 'foodName' })
    if (fn.length > 200) throw fail(400, 'VALIDATION_ERROR', 'foodName must be 200 characters or fewer.', { field: 'foodName' })
    updates.foodName = fn
  }

  // quantity and unit must be validated together even if only one changes
  const hasQtyUpdate  = body.quantity  !== undefined
  const hasUnitUpdate = body.unit      !== undefined

  if (hasQtyUpdate || hasUnitUpdate) {
    // Resolve current values, then overlay incoming changes
    const resolvedQty  = hasQtyUpdate
      ? ((body.quantity !== null && body.quantity !== undefined && String(body.quantity).trim() !== '') ? body.quantity : null)
      : item.quantity
    const resolvedUnit = hasUnitUpdate
      ? ((body.unit !== null && body.unit !== undefined && String(body.unit).trim() !== '') ? String(body.unit).trim() : null)
      : item.unit

    validateQuantityUnit(resolvedQty, resolvedUnit)

    if (resolvedUnit && resolvedUnit.length > 50) {
      throw fail(400, 'VALIDATION_ERROR', 'unit must be 50 characters or fewer.', { field: 'unit' })
    }

    if (hasQtyUpdate)  updates.quantity = resolvedQty !== null ? Number(resolvedQty) : null
    if (hasUnitUpdate) updates.unit     = resolvedUnit
  }

  if (body.notes !== undefined) {
    const n = body.notes ? String(body.notes).trim() || null : null
    if (n && n.length > 2000) {
      throw fail(400, 'VALIDATION_ERROR', 'notes must be 2000 characters or fewer.', { field: 'notes' })
    }
    updates.notes = n
  }

  if (body.displayOrder !== undefined) {
    const ord = parseInt(String(body.displayOrder), 10)
    if (Number.isNaN(ord) || ord <= 0) {
      throw fail(400, 'VALIDATION_ERROR', 'displayOrder must be a positive integer.', { field: 'displayOrder' })
    }
    updates.displayOrder = ord
  }

  if (Object.keys(updates).length === 0) {
    throw fail(400, 'VALIDATION_ERROR', 'No updatable fields were provided.', {})
  }

  await item.update(updates)
  const refreshed = await NutritionMealItem.findByPk(item.id)

  if (plan.status === 'active' && trainee) {
    await tryCreateAndEmitNotification({
      type:            NOTIFICATION_TYPES.NUTRITION_PLAN_UPDATED,
      recipientUserId: trainee.userId,
      actorUserId:     req.user.id,
      title:           'Nutrition Plan Updated',
      message:         `A food item in your active nutrition plan has been updated.`,
      metadata:        { traineeId: trainee.id, nutritionPlanId: plan.id, link: '/trainee/nutrition' }
    })
  }

  res.json({ success: true, data: serializeItem(refreshed), error: null })
}

// ── DELETE /api/nutrition-meal-items/:id  (admin, trainer) ───────────────────

async function removeItem(req, res) {
  const { item, plan, trainee } = await resolveItemOwnership(req.parsedId, req.user)

  if (plan.status === 'archived') {
    throw fail(409, 'NUTRITION_PLAN_ARCHIVED', 'Archived nutrition plans are read-only.', { planId: plan.id })
  }

  await item.destroy()

  if (plan.status === 'active' && trainee) {
    await tryCreateAndEmitNotification({
      type:            NOTIFICATION_TYPES.NUTRITION_PLAN_UPDATED,
      recipientUserId: trainee.userId,
      actorUserId:     req.user.id,
      title:           'Nutrition Plan Updated',
      message:         `A food item has been removed from your active nutrition plan.`,
      metadata:        { traineeId: trainee.id, nutritionPlanId: plan.id, link: '/trainee/nutrition' }
    })
  }

  res.json({ success: true, data: { id: req.parsedId }, error: null })
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  createItem: wrap(createItem),
  updateItem: wrap(updateItem),
  removeItem: wrap(removeItem)
}
