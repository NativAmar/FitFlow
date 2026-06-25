'use strict'

const { WorkoutSession, WorkoutSessionExercise, WeeklyWorkoutLog } = require('../models/index')
const {
  serializeSession,
  resolveSessionOwnership,
  resolvePlanOwnership,
  nextSessionOrder
} = require('../services/workoutPlanService')
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

const VALID_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

function sessionWithAssignments() {
  return [{ model: WorkoutSessionExercise, as: 'exerciseAssignments' }]
}

// ── POST /api/workout-plans/:id/sessions  (admin, trainer) ───────────────────

async function createSession(req, res) {
  const body = safeBody(req)

  const { plan, trainee } = await resolvePlanOwnership(req.parsedId, req.user)

  if (plan.status === 'archived') {
    throw fail(409, 'WORKOUT_PLAN_ARCHIVED', 'Cannot add sessions to an archived plan.', { planId: plan.id })
  }

  const name = body.name ? String(body.name).trim() : ''
  if (!name) throw fail(400, 'VALIDATION_ERROR', 'name is required.', { field: 'name' })
  if (name.length > 150) throw fail(400, 'VALIDATION_ERROR', 'name must be 150 characters or fewer.', { field: 'name' })

  const description = body.description ? String(body.description).trim() || null : null

  let scheduledDay = null
  if (body.scheduledDay !== undefined && body.scheduledDay !== null && body.scheduledDay !== '') {
    const day = String(body.scheduledDay).trim().toLowerCase()
    if (!VALID_DAYS.includes(day)) {
      throw fail(400, 'VALIDATION_ERROR',
        `scheduledDay must be one of: ${VALID_DAYS.join(', ')}.`,
        { field: 'scheduledDay', allowed: VALID_DAYS })
    }
    scheduledDay = day
  }

  let displayOrder
  if (body.displayOrder !== undefined && body.displayOrder !== null && body.displayOrder !== '') {
    const parsed = parseInt(body.displayOrder, 10)
    if (isNaN(parsed) || parsed < 1) {
      throw fail(400, 'VALIDATION_ERROR', 'displayOrder must be a positive integer.', { field: 'displayOrder' })
    }
    displayOrder = parsed
  } else {
    displayOrder = await nextSessionOrder(plan.id)
  }

  const session = await WorkoutSession.create({
    workoutPlanId: plan.id,
    name,
    description,
    scheduledDay,
    displayOrder
  })

  const created = await WorkoutSession.findByPk(session.id, { include: sessionWithAssignments() })

  if (plan.status === 'active' && trainee) {
    await tryCreateAndEmitNotification({
      type:            NOTIFICATION_TYPES.WORKOUT_PLAN_UPDATED,
      recipientUserId: trainee.userId,
      actorUserId:     req.user.id,
      title:           'Workout Plan Updated',
      message:         `Your active workout plan has been updated with a new session.`,
      metadata:        { traineeId: trainee.id, workoutPlanId: plan.id, link: '/trainee/workout-plan' }
    })
  }

  res.status(201).json({ success: true, data: serializeSession(created), error: null })
}

// ── PUT /api/workout-sessions/:id  (admin, trainer) ──────────────────────────

async function updateSession(req, res) {
  const body = safeBody(req)
  const { session, plan, trainee } = await resolveSessionOwnership(req.parsedId, req.user)

  if (plan.status === 'archived') {
    throw fail(409, 'WORKOUT_PLAN_ARCHIVED', 'Cannot modify sessions of an archived plan.', { planId: plan.id })
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

  if (body.scheduledDay !== undefined) {
    if (body.scheduledDay === null || body.scheduledDay === '') {
      updates.scheduledDay = null
    } else {
      const day = String(body.scheduledDay).trim().toLowerCase()
      if (!VALID_DAYS.includes(day)) {
        throw fail(400, 'VALIDATION_ERROR',
          `scheduledDay must be one of: ${VALID_DAYS.join(', ')}.`,
          { field: 'scheduledDay', allowed: VALID_DAYS })
      }
      updates.scheduledDay = day
    }
  }

  if (body.displayOrder !== undefined) {
    const parsed = parseInt(body.displayOrder, 10)
    if (isNaN(parsed) || parsed < 1) {
      throw fail(400, 'VALIDATION_ERROR', 'displayOrder must be a positive integer.', { field: 'displayOrder' })
    }
    updates.displayOrder = parsed
  }

  if (Object.keys(updates).length === 0) {
    throw fail(400, 'VALIDATION_ERROR', 'No updatable fields were provided.', {})
  }

  await session.update(updates)
  const refreshed = await WorkoutSession.findByPk(session.id, { include: sessionWithAssignments() })

  if (plan.status === 'active' && trainee) {
    await tryCreateAndEmitNotification({
      type:            NOTIFICATION_TYPES.WORKOUT_PLAN_UPDATED,
      recipientUserId: trainee.userId,
      actorUserId:     req.user.id,
      title:           'Workout Plan Updated',
      message:         `A session in your active workout plan has been updated.`,
      metadata:        { traineeId: trainee.id, workoutPlanId: plan.id, link: '/trainee/workout-plan' }
    })
  }

  res.json({ success: true, data: serializeSession(refreshed), error: null })
}

// ── DELETE /api/workout-sessions/:id  (admin, trainer) ───────────────────────

async function removeSession(req, res) {
  const { session, plan, trainee } = await resolveSessionOwnership(req.parsedId, req.user)

  if (plan.status === 'archived') {
    throw fail(409, 'WORKOUT_PLAN_ARCHIVED', 'Cannot delete sessions from an archived plan.', { planId: plan.id })
  }

  const logCount = await WeeklyWorkoutLog.count({ where: { workoutSessionId: session.id } })
  if (logCount > 0) {
    throw fail(409, 'WORKOUT_SESSION_HAS_TRACKING_HISTORY',
      'This workout session has weekly tracking history and cannot be deleted.',
      { sessionId: session.id, logCount })
  }

  await session.destroy() // cascades to workout_session_exercises

  if (plan.status === 'active' && trainee) {
    await tryCreateAndEmitNotification({
      type:            NOTIFICATION_TYPES.WORKOUT_PLAN_UPDATED,
      recipientUserId: trainee.userId,
      actorUserId:     req.user.id,
      title:           'Workout Plan Updated',
      message:         `A session has been removed from your active workout plan.`,
      metadata:        { traineeId: trainee.id, workoutPlanId: plan.id, link: '/trainee/workout-plan' }
    })
  }

  res.json({ success: true, data: { id: req.parsedId }, error: null })
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  createSession:  wrap(createSession),
  updateSession:  wrap(updateSession),
  removeSession:  wrap(removeSession)
}
