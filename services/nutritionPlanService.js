'use strict'

const { Op } = require('sequelize')
const {
  sequelize,
  NutritionPlan,
  NutritionMeal,
  NutritionMealItem,
  Trainee,
  Trainer,
  User
} = require('../models/index')

// ── Error factory ─────────────────────────────────────────────────────────────

function fail(status, code, message, details) {
  const e = new Error(message)
  e.status  = status
  e.code    = code
  e.details = details || {}
  return e
}

// ── Trainer lookup ────────────────────────────────────────────────────────────

async function findTrainerByUserId(userId) {
  return Trainer.findOne({ where: { userId } })
}

// ── Status ordering ───────────────────────────────────────────────────────────

const STATUS_ORDER = { active: 1, draft: 2, archived: 3 }

function statusSort(a, b) {
  const diff = (STATUS_ORDER[a.status] || 99) - (STATUS_ORDER[b.status] || 99)
  if (diff !== 0) return diff
  return new Date(b.createdAt) - new Date(a.createdAt)
}

// ── Include definitions ───────────────────────────────────────────────────────

function fullPlanIncludes() {
  return [
    {
      model: NutritionMeal,
      as: 'meals',
      include: [
        {
          model: NutritionMealItem,
          as: 'items'
        }
      ]
    }
  ]
}

function summaryPlanIncludes() {
  return [
    { model: NutritionMeal, as: 'meals', attributes: ['id'] }
  ]
}

// ── Serializers ───────────────────────────────────────────────────────────────

function normalizeQuantity(value) {
  if (value === null || value === undefined) return null
  const n = parseFloat(value)
  return Number.isNaN(n) ? null : n
}

function serializeItem(item) {
  return {
    id:          item.id,
    foodName:    item.foodName,
    quantity:    normalizeQuantity(item.quantity),
    unit:        item.unit || null,
    notes:       item.notes || null,
    displayOrder: item.displayOrder
  }
}

function serializeMeal(meal) {
  const items = (meal.items || [])
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id)
  return {
    id:              meal.id,
    nutritionPlanId: meal.nutritionPlanId,
    name:            meal.name,
    mealType:        meal.mealType,
    dayOfWeek:       meal.dayOfWeek || null,
    scheduledTime:   meal.scheduledTime || null,
    instructions:    meal.instructions || null,
    displayOrder:    meal.displayOrder,
    items:           items.map(serializeItem),
    createdAt:       meal.createdAt,
    updatedAt:       meal.updatedAt
  }
}

function serializeMealOnly(meal) {
  return {
    id:              meal.id,
    nutritionPlanId: meal.nutritionPlanId,
    name:            meal.name,
    mealType:        meal.mealType,
    dayOfWeek:       meal.dayOfWeek || null,
    scheduledTime:   meal.scheduledTime || null,
    instructions:    meal.instructions || null,
    displayOrder:    meal.displayOrder,
    createdAt:       meal.createdAt,
    updatedAt:       meal.updatedAt
  }
}

function serializePlanSummary(plan) {
  return {
    id:           plan.id,
    trainerId:    plan.trainerId,
    traineeId:    plan.traineeId,
    name:         plan.name,
    description:  plan.description || null,
    generalNotes: plan.generalNotes || null,
    status:       plan.status,
    startDate:    plan.startDate || null,
    endDate:      plan.endDate   || null,
    mealCount:    plan.meals ? plan.meals.length : 0,
    createdAt:    plan.createdAt,
    updatedAt:    plan.updatedAt
  }
}

function serializePlanFull(plan) {
  const meals = (plan.meals || [])
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id)
  return {
    id:           plan.id,
    trainerId:    plan.trainerId,
    traineeId:    plan.traineeId,
    name:         plan.name,
    description:  plan.description || null,
    generalNotes: plan.generalNotes || null,
    status:       plan.status,
    startDate:    plan.startDate || null,
    endDate:      plan.endDate   || null,
    meals:        meals.map(serializeMeal),
    createdAt:    plan.createdAt,
    updatedAt:    plan.updatedAt
  }
}

// ── Ownership resolution ──────────────────────────────────────────────────────

async function resolveTraineeOwnership(traineeId, reqUser) {
  const trainee = await Trainee.findByPk(traineeId)
  if (!trainee) {
    throw fail(404, 'TRAINEE_NOT_FOUND', `Trainee with id ${traineeId} not found.`, { id: traineeId })
  }

  if (reqUser.role === 'trainer') {
    const trainerProfile = await findTrainerByUserId(reqUser.id)
    if (!trainerProfile) {
      throw fail(403, 'FORBIDDEN', 'Trainer profile not found for this account.', {})
    }
    if (trainee.trainerId !== trainerProfile.id) {
      throw fail(403, 'FORBIDDEN', 'You do not have permission to access this trainee.', {})
    }
    return { trainee, trainerProfile }
  }

  return { trainee, trainerProfile: null }
}

async function resolvePlanOwnership(planId, reqUser) {
  const plan = await NutritionPlan.findByPk(planId)
  if (!plan) {
    throw fail(404, 'NUTRITION_PLAN_NOT_FOUND', `Nutrition plan with id ${planId} not found.`, { id: planId })
  }

  if (reqUser.role === 'trainer') {
    const trainerProfile = await findTrainerByUserId(reqUser.id)
    if (!trainerProfile) {
      throw fail(403, 'FORBIDDEN', 'Trainer profile not found for this account.', {})
    }
    const trainee = await Trainee.findByPk(plan.traineeId)
    if (!trainee || trainee.trainerId !== trainerProfile.id) {
      throw fail(403, 'FORBIDDEN', 'You do not have permission to access this nutrition plan.', {})
    }
    return { plan, trainerProfile, trainee }
  }

  if (reqUser.role === 'trainee') {
    const myTrainee = await Trainee.findOne({ where: { userId: reqUser.id } })
    if (!myTrainee || plan.traineeId !== myTrainee.id) {
      throw fail(403, 'FORBIDDEN', 'You do not have permission to access this nutrition plan.', {})
    }
    if (plan.status === 'draft') {
      throw fail(404, 'NUTRITION_PLAN_NOT_FOUND', `Nutrition plan with id ${planId} not found.`, { id: planId })
    }
    return { plan, trainerProfile: null, trainee: myTrainee }
  }

  // Admin
  const trainee = await Trainee.findByPk(plan.traineeId)
  return { plan, trainerProfile: null, trainee }
}

async function resolveMealOwnership(mealId, reqUser) {
  const meal = await NutritionMeal.findByPk(mealId, {
    include: [{ model: NutritionPlan, as: 'nutritionPlan' }]
  })
  if (!meal) {
    throw fail(404, 'NUTRITION_MEAL_NOT_FOUND', `Nutrition meal with id ${mealId} not found.`, { id: mealId })
  }
  const { plan, trainerProfile, trainee } = await resolvePlanOwnership(meal.nutritionPlanId, reqUser)
  return { meal, plan, trainerProfile, trainee }
}

async function resolveItemOwnership(itemId, reqUser) {
  const item = await NutritionMealItem.findByPk(itemId, {
    include: [{
      model: NutritionMeal,
      as: 'nutritionMeal',
      include: [{ model: NutritionPlan, as: 'nutritionPlan' }]
    }]
  })
  if (!item) {
    throw fail(404, 'NUTRITION_MEAL_ITEM_NOT_FOUND', `Nutrition meal item with id ${itemId} not found.`, { id: itemId })
  }
  const { meal, plan, trainerProfile, trainee } = await resolveMealOwnership(item.nutritionMealId, reqUser)
  return { item, meal, plan, trainerProfile, trainee }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

const VALID_TRANSITIONS = {
  draft:    ['active', 'archived'],
  active:   ['archived'],
  archived: []
}

async function changeStatus(plan, newStatus, trainee) {
  const allowed = VALID_TRANSITIONS[plan.status] || []
  if (!allowed.includes(newStatus)) {
    throw fail(409, 'INVALID_NUTRITION_PLAN_STATUS_TRANSITION',
      `Cannot transition nutrition plan from "${plan.status}" to "${newStatus}".`,
      { currentStatus: plan.status, requestedStatus: newStatus })
  }

  const today = new Date().toISOString().split('T')[0]

  if (newStatus === 'active') {
    // Completeness check before transaction
    const planWithMeals = await NutritionPlan.findByPk(plan.id, {
      include: [{
        model: NutritionMeal,
        as: 'meals',
        attributes: ['id', 'name'],
        include: [{
          model: NutritionMealItem,
          as: 'items',
          attributes: ['id']
        }]
      }]
    })

    const meals = planWithMeals.meals || []
    if (meals.length === 0) {
      throw fail(409, 'NUTRITION_PLAN_EMPTY',
        'Cannot activate a nutrition plan with no meals.',
        { planId: plan.id })
    }

    const emptyMeals = meals.filter(m => (m.items || []).length === 0)
    if (emptyMeals.length > 0) {
      throw fail(409, 'NUTRITION_MEAL_EMPTY',
        'Cannot activate a nutrition plan when one or more meals have no food items.',
        { emptyMealIds: emptyMeals.map(m => m.id) })
    }

    await sequelize.transaction(async t => {
      const currentActive = await NutritionPlan.findOne({
        where: { traineeId: trainee.id, status: 'active' },
        lock: t.LOCK.UPDATE,
        transaction: t
      })

      if (currentActive && currentActive.id !== plan.id) {
        await currentActive.update({ status: 'archived', endDate: today }, { transaction: t })
      }

      const startDate = plan.startDate || today
      await plan.update({ status: 'active', startDate, endDate: null }, { transaction: t })
    })
  } else {
    await plan.update({ status: 'archived', endDate: today })
  }

  return NutritionPlan.findByPk(plan.id, { include: fullPlanIncludes() })
}

// ── DisplayOrder auto-assignment ──────────────────────────────────────────────

async function nextMealOrder(nutritionPlanId) {
  const maxOrder = await NutritionMeal.max('displayOrder', { where: { nutritionPlanId } })
  return (maxOrder === null || maxOrder === undefined ? 0 : maxOrder) + 1
}

async function nextItemOrder(nutritionMealId) {
  const maxOrder = await NutritionMealItem.max('displayOrder', { where: { nutritionMealId } })
  return (maxOrder === null || maxOrder === undefined ? 0 : maxOrder) + 1
}

// ── Validation helpers ────────────────────────────────────────────────────────

const VALID_MEAL_TYPES = [
  'breakfast', 'morning-snack', 'lunch', 'afternoon-snack',
  'dinner', 'evening-snack', 'pre-workout', 'post-workout', 'custom'
]

const VALID_DAYS = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
]

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/

function validateScheduledTime(value) {
  if (value === null || value === undefined) return null
  const s = String(value).trim()
  if (!s) return null
  if (!TIME_REGEX.test(s)) {
    throw fail(400, 'VALIDATION_ERROR', 'scheduledTime must be in HH:MM or HH:MM:SS format.', { field: 'scheduledTime' })
  }
  // Normalize to HH:MM:SS
  const parts = s.split(':')
  return `${parts[0]}:${parts[1]}:${parts[2] || '00'}`
}

function validateQuantityUnit(quantity, unit) {
  const hasQty  = quantity !== null && quantity !== undefined
  const hasUnit = unit    !== null && unit    !== undefined && String(unit).trim() !== ''

  if (hasQty && !hasUnit) {
    throw fail(400, 'VALIDATION_ERROR', 'unit is required when quantity is provided.', { field: 'unit' })
  }
  if (hasUnit && !hasQty) {
    throw fail(400, 'VALIDATION_ERROR', 'quantity is required when unit is provided.', { field: 'quantity' })
  }
  if (hasQty) {
    const n = Number(quantity)
    if (Number.isNaN(n) || n <= 0) {
      throw fail(400, 'VALIDATION_ERROR', 'quantity must be a number greater than zero.', { field: 'quantity' })
    }
    if (n > 99999999.99) {
      throw fail(400, 'VALIDATION_ERROR', 'quantity is unreasonably large.', { field: 'quantity' })
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  // Serializers
  serializePlanSummary,
  serializePlanFull,
  serializeMeal,
  serializeMealOnly,
  serializeItem,
  // Includes
  fullPlanIncludes,
  summaryPlanIncludes,
  // Ownership helpers
  resolveTraineeOwnership,
  resolvePlanOwnership,
  resolveMealOwnership,
  resolveItemOwnership,
  // Business logic
  changeStatus,
  nextMealOrder,
  nextItemOrder,
  // Sorting
  statusSort,
  // Validation
  validateScheduledTime,
  validateQuantityUnit,
  VALID_MEAL_TYPES,
  VALID_DAYS,
  // Trainer lookup
  findTrainerByUserId
}
