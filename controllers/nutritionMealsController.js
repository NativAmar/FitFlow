'use strict'

const { NutritionMeal, NutritionMealItem } = require('../models/index')
const {
  serializeMeal,
  serializeMealOnly,
  resolvePlanOwnership,
  resolveMealOwnership,
  nextMealOrder,
  validateScheduledTime,
  VALID_MEAL_TYPES,
  VALID_DAYS
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

// ── POST /api/nutrition-plans/:id/meals  (admin, trainer) ────────────────────

async function createMeal(req, res) {
  const body = safeBody(req)
  const { plan, trainee } = await resolvePlanOwnership(req.parsedId, req.user)

  if (plan.status === 'archived') {
    throw fail(409, 'NUTRITION_PLAN_ARCHIVED', 'Archived nutrition plans are read-only.', { planId: plan.id })
  }

  const name = body.name ? String(body.name).trim() : ''
  if (!name) throw fail(400, 'VALIDATION_ERROR', 'name is required.', { field: 'name' })
  if (name.length > 150) throw fail(400, 'VALIDATION_ERROR', 'name must be 150 characters or fewer.', { field: 'name' })

  const mealType = body.mealType ? String(body.mealType).trim() : ''
  if (!VALID_MEAL_TYPES.includes(mealType)) {
    throw fail(400, 'VALIDATION_ERROR',
      `mealType must be one of: ${VALID_MEAL_TYPES.join(', ')}.`,
      { field: 'mealType', allowed: VALID_MEAL_TYPES })
  }

  let dayOfWeek = null
  if (body.dayOfWeek !== null && body.dayOfWeek !== undefined) {
    dayOfWeek = String(body.dayOfWeek).trim().toLowerCase()
    if (!VALID_DAYS.includes(dayOfWeek)) {
      throw fail(400, 'VALIDATION_ERROR',
        `dayOfWeek must be one of: ${VALID_DAYS.join(', ')}, or null.`,
        { field: 'dayOfWeek', allowed: VALID_DAYS })
    }
  }

  const scheduledTime = validateScheduledTime(body.scheduledTime)

  const instructions = body.instructions ? String(body.instructions).trim() || null : null
  if (instructions && instructions.length > 3000) {
    throw fail(400, 'VALIDATION_ERROR', 'instructions must be 3000 characters or fewer.', { field: 'instructions' })
  }

  let displayOrder
  if (body.displayOrder !== undefined && body.displayOrder !== null) {
    displayOrder = parseInt(String(body.displayOrder), 10)
    if (Number.isNaN(displayOrder) || displayOrder <= 0) {
      throw fail(400, 'VALIDATION_ERROR', 'displayOrder must be a positive integer.', { field: 'displayOrder' })
    }
  } else {
    displayOrder = await nextMealOrder(plan.id)
  }

  const meal = await NutritionMeal.create({
    nutritionPlanId: plan.id,
    name,
    mealType,
    dayOfWeek,
    scheduledTime,
    instructions,
    displayOrder
  })

  const created = await NutritionMeal.findByPk(meal.id, {
    include: [{ model: NutritionMealItem, as: 'items' }]
  })

  if (plan.status === 'active' && trainee) {
    await tryCreateAndEmitNotification({
      type:            NOTIFICATION_TYPES.NUTRITION_PLAN_UPDATED,
      recipientUserId: trainee.userId,
      actorUserId:     req.user.id,
      title:           'Nutrition Plan Updated',
      message:         `A new meal has been added to your active nutrition plan.`,
      metadata:        { traineeId: trainee.id, nutritionPlanId: plan.id, link: '/trainee/nutrition' }
    })
  }

  res.status(201).json({ success: true, data: serializeMeal(created), error: null })
}

// ── PUT /api/nutrition-meals/:id  (admin, trainer) ───────────────────────────

async function updateMeal(req, res) {
  const body = safeBody(req)
  const { meal, plan, trainee } = await resolveMealOwnership(req.parsedId, req.user)

  if (plan.status === 'archived') {
    throw fail(409, 'NUTRITION_PLAN_ARCHIVED', 'Archived nutrition plans are read-only.', { planId: plan.id })
  }

  const updates = {}

  if (body.name !== undefined) {
    const name = String(body.name).trim()
    if (!name) throw fail(400, 'VALIDATION_ERROR', 'name cannot be empty.', { field: 'name' })
    if (name.length > 150) throw fail(400, 'VALIDATION_ERROR', 'name must be 150 characters or fewer.', { field: 'name' })
    updates.name = name
  }

  if (body.mealType !== undefined) {
    const mt = String(body.mealType).trim()
    if (!VALID_MEAL_TYPES.includes(mt)) {
      throw fail(400, 'VALIDATION_ERROR',
        `mealType must be one of: ${VALID_MEAL_TYPES.join(', ')}.`,
        { field: 'mealType', allowed: VALID_MEAL_TYPES })
    }
    updates.mealType = mt
  }

  if (body.dayOfWeek !== undefined) {
    if (body.dayOfWeek === null) {
      updates.dayOfWeek = null
    } else {
      const dow = String(body.dayOfWeek).trim().toLowerCase()
      if (!VALID_DAYS.includes(dow)) {
        throw fail(400, 'VALIDATION_ERROR',
          `dayOfWeek must be one of: ${VALID_DAYS.join(', ')}, or null.`,
          { field: 'dayOfWeek', allowed: VALID_DAYS })
      }
      updates.dayOfWeek = dow
    }
  }

  if (body.scheduledTime !== undefined) {
    updates.scheduledTime = validateScheduledTime(body.scheduledTime)
  }

  if (body.instructions !== undefined) {
    const inst = body.instructions ? String(body.instructions).trim() || null : null
    if (inst && inst.length > 3000) {
      throw fail(400, 'VALIDATION_ERROR', 'instructions must be 3000 characters or fewer.', { field: 'instructions' })
    }
    updates.instructions = inst
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

  await meal.update(updates)
  const refreshed = await NutritionMeal.findByPk(meal.id, {
    include: [{ model: NutritionMealItem, as: 'items' }]
  })

  if (plan.status === 'active' && trainee) {
    await tryCreateAndEmitNotification({
      type:            NOTIFICATION_TYPES.NUTRITION_PLAN_UPDATED,
      recipientUserId: trainee.userId,
      actorUserId:     req.user.id,
      title:           'Nutrition Plan Updated',
      message:         `A meal in your active nutrition plan has been updated.`,
      metadata:        { traineeId: trainee.id, nutritionPlanId: plan.id, link: '/trainee/nutrition' }
    })
  }

  res.json({ success: true, data: serializeMeal(refreshed), error: null })
}

// ── DELETE /api/nutrition-meals/:id  (admin, trainer) ────────────────────────

async function removeMeal(req, res) {
  const { meal, plan, trainee } = await resolveMealOwnership(req.parsedId, req.user)

  if (plan.status === 'archived') {
    throw fail(409, 'NUTRITION_PLAN_ARCHIVED', 'Archived nutrition plans are read-only.', { planId: plan.id })
  }

  await meal.destroy()

  if (plan.status === 'active' && trainee) {
    await tryCreateAndEmitNotification({
      type:            NOTIFICATION_TYPES.NUTRITION_PLAN_UPDATED,
      recipientUserId: trainee.userId,
      actorUserId:     req.user.id,
      title:           'Nutrition Plan Updated',
      message:         `A meal has been removed from your active nutrition plan.`,
      metadata:        { traineeId: trainee.id, nutritionPlanId: plan.id, link: '/trainee/nutrition' }
    })
  }

  res.json({ success: true, data: { id: req.parsedId }, error: null })
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  createMeal:  wrap(createMeal),
  updateMeal:  wrap(updateMeal),
  removeMeal:  wrap(removeMeal)
}
