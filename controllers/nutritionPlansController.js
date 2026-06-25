'use strict'

const { Op } = require('sequelize')
const { NutritionPlan, Trainee } = require('../models/index')
const {
  serializePlanSummary,
  serializePlanFull,
  fullPlanIncludes,
  summaryPlanIncludes,
  resolveTraineeOwnership,
  resolvePlanOwnership,
  changeStatus,
  statusSort,
  findTrainerByUserId
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

const VALID_NEW_STATUSES = ['active', 'archived']

// ── GET /api/trainees/me/nutrition-plans  (trainee only) ─────────────────────

async function getMyPlans(req, res) {
  const myTrainee = await Trainee.findOne({ where: { userId: req.user.id } })
  if (!myTrainee) {
    throw fail(404, 'TRAINEE_NOT_FOUND', 'Trainee profile not found for this account.', {})
  }

  const plans = await NutritionPlan.findAll({
    where: { traineeId: myTrainee.id, status: { [Op.in]: ['active', 'archived'] } },
    include: summaryPlanIncludes()
  })

  const sorted = plans.slice().sort(statusSort)
  res.json({ success: true, data: sorted.map(serializePlanSummary), error: null })
}

// ── GET /api/trainees/me/nutrition-plan/active  (trainee only) ────────────────

async function getMyActivePlan(req, res) {
  const myTrainee = await Trainee.findOne({ where: { userId: req.user.id } })
  if (!myTrainee) {
    throw fail(404, 'TRAINEE_NOT_FOUND', 'Trainee profile not found for this account.', {})
  }

  const plan = await NutritionPlan.findOne({
    where: { traineeId: myTrainee.id, status: 'active' },
    include: fullPlanIncludes()
  })

  if (!plan) {
    throw fail(404, 'ACTIVE_NUTRITION_PLAN_NOT_FOUND',
      'No active nutrition plan found for your account.', {})
  }

  res.json({ success: true, data: serializePlanFull(plan), error: null })
}

// ── GET /api/trainees/:id/nutrition-plans  (admin, trainer) ──────────────────

async function getTraineePlans(req, res) {
  const { trainee } = await resolveTraineeOwnership(req.parsedId, req.user)

  const plans = await NutritionPlan.findAll({
    where: { traineeId: trainee.id },
    include: summaryPlanIncludes()
  })

  const sorted = plans.slice().sort(statusSort)
  res.json({ success: true, data: sorted.map(serializePlanSummary), error: null })
}

// ── GET /api/trainees/:id/nutrition-plan/active  (admin, trainer) ─────────────

async function getTraineeActivePlan(req, res) {
  const { trainee } = await resolveTraineeOwnership(req.parsedId, req.user)

  const plan = await NutritionPlan.findOne({
    where: { traineeId: trainee.id, status: 'active' },
    include: fullPlanIncludes()
  })

  if (!plan) {
    throw fail(404, 'ACTIVE_NUTRITION_PLAN_NOT_FOUND',
      `No active nutrition plan found for trainee with id ${trainee.id}.`, { traineeId: trainee.id })
  }

  res.json({ success: true, data: serializePlanFull(plan), error: null })
}

// ── POST /api/trainees/:id/nutrition-plans  (admin, trainer) ─────────────────

async function createForTrainee(req, res) {
  const body = safeBody(req)
  const { trainee } = await resolveTraineeOwnership(req.parsedId, req.user)

  if (!trainee.trainerId) {
    throw fail(409, 'TRAINER_PROFILE_NOT_FOUND',
      'This trainee does not have an assigned trainer. A trainer must be assigned before creating a nutrition plan.',
      { traineeId: trainee.id })
  }

  const name = body.name ? String(body.name).trim() : ''
  if (!name) throw fail(400, 'VALIDATION_ERROR', 'name is required.', { field: 'name' })
  if (name.length > 150) throw fail(400, 'VALIDATION_ERROR', 'name must be 150 characters or fewer.', { field: 'name' })

  const description  = body.description  ? String(body.description).trim()  || null : null
  const generalNotes = body.generalNotes ? String(body.generalNotes).trim() || null : null

  if (generalNotes && generalNotes.length > 5000) {
    throw fail(400, 'VALIDATION_ERROR', 'generalNotes must be 5000 characters or fewer.', { field: 'generalNotes' })
  }

  const plan = await NutritionPlan.create({
    trainerId:    trainee.trainerId,
    traineeId:    trainee.id,
    name,
    description,
    generalNotes,
    status: 'draft'
  })

  const created = await NutritionPlan.findByPk(plan.id, { include: summaryPlanIncludes() })
  res.status(201).json({ success: true, data: serializePlanSummary(created), error: null })
}

// ── GET /api/nutrition-plans/:id  (admin, trainer, trainee) ──────────────────

async function getById(req, res) {
  const { plan } = await resolvePlanOwnership(req.parsedId, req.user)
  const full = await NutritionPlan.findByPk(plan.id, { include: fullPlanIncludes() })
  res.json({ success: true, data: serializePlanFull(full), error: null })
}

// ── PUT /api/nutrition-plans/:id  (admin, trainer) ───────────────────────────

async function update(req, res) {
  const body = safeBody(req)
  const { plan, trainee } = await resolvePlanOwnership(req.parsedId, req.user)

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

  if (body.description !== undefined) {
    updates.description = body.description ? String(body.description).trim() || null : null
  }

  if (body.generalNotes !== undefined) {
    const gn = body.generalNotes ? String(body.generalNotes).trim() || null : null
    if (gn && gn.length > 5000) {
      throw fail(400, 'VALIDATION_ERROR', 'generalNotes must be 5000 characters or fewer.', { field: 'generalNotes' })
    }
    updates.generalNotes = gn
  }

  if (Object.keys(updates).length === 0) {
    throw fail(400, 'VALIDATION_ERROR', 'No updatable fields were provided.', {})
  }

  await plan.update(updates)
  const refreshed = await NutritionPlan.findByPk(plan.id, { include: summaryPlanIncludes() })

  if (plan.status === 'active' && trainee) {
    await tryCreateAndEmitNotification({
      type:            NOTIFICATION_TYPES.NUTRITION_PLAN_UPDATED,
      recipientUserId: trainee.userId,
      actorUserId:     req.user.id,
      title:           'Nutrition Plan Updated',
      message:         `Your active nutrition plan "${refreshed.name}" has been updated.`,
      metadata:        { traineeId: trainee.id, nutritionPlanId: plan.id, link: '/trainee/nutrition' }
    })
  }

  res.json({ success: true, data: serializePlanSummary(refreshed), error: null })
}

// ── PATCH /api/nutrition-plans/:id/status  (admin, trainer) ──────────────────

async function updateStatus(req, res) {
  const body = safeBody(req)
  const { plan, trainee } = await resolvePlanOwnership(req.parsedId, req.user)

  const newStatus = body.status ? String(body.status).trim().toLowerCase() : ''
  if (!VALID_NEW_STATUSES.includes(newStatus)) {
    throw fail(400, 'VALIDATION_ERROR',
      `status must be one of: ${VALID_NEW_STATUSES.join(', ')}.`,
      { field: 'status', allowed: VALID_NEW_STATUSES })
  }

  const previousStatus = plan.status
  const updatedPlan = await changeStatus(plan, newStatus, trainee)

  if (newStatus === 'active' && trainee) {
    await tryCreateAndEmitNotification({
      type:            NOTIFICATION_TYPES.NUTRITION_PLAN_ACTIVATED,
      recipientUserId: trainee.userId,
      actorUserId:     req.user.id,
      title:           'New Nutrition Plan Active',
      message:         `Your nutrition plan "${updatedPlan.name}" is now active.`,
      metadata:        { traineeId: trainee.id, nutritionPlanId: plan.id, link: '/trainee/nutrition' }
    })
  } else if (newStatus === 'archived' && previousStatus === 'active' && trainee) {
    await tryCreateAndEmitNotification({
      type:            NOTIFICATION_TYPES.NUTRITION_PLAN_ARCHIVED,
      recipientUserId: trainee.userId,
      actorUserId:     req.user.id,
      title:           'Nutrition Plan Archived',
      message:         `Your nutrition plan "${updatedPlan.name}" has been archived.`,
      metadata:        { traineeId: trainee.id, nutritionPlanId: plan.id, link: '/trainee/nutrition' }
    })
  }

  res.json({ success: true, data: serializePlanFull(updatedPlan), error: null })
}

// ── DELETE /api/nutrition-plans/:id  (admin, trainer) ────────────────────────

async function remove(req, res) {
  const { plan } = await resolvePlanOwnership(req.parsedId, req.user)

  if (plan.status !== 'draft') {
    throw fail(409, 'NUTRITION_PLAN_DELETE_RESTRICTED',
      'Only draft nutrition plans can be deleted.',
      { planId: plan.id, status: plan.status })
  }

  await plan.destroy()
  res.json({ success: true, data: { id: req.parsedId }, error: null })
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  getMyPlans:           wrap(getMyPlans),
  getMyActivePlan:      wrap(getMyActivePlan),
  getTraineePlans:      wrap(getTraineePlans),
  getTraineeActivePlan: wrap(getTraineeActivePlan),
  createForTrainee:     wrap(createForTrainee),
  getById:              wrap(getById),
  update:               wrap(update),
  updateStatus:         wrap(updateStatus),
  remove:               wrap(remove)
}
