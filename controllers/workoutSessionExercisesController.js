'use strict'

const { WorkoutSessionExercise, Exercise, MuscleGroup } = require('../models/index')
const {
  serializeAssignment,
  resolveSessionOwnership,
  resolveAssignmentOwnership,
  validateExerciseOwnership,
  nextAssignmentOrder
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

function assignmentWithExercise() {
  return [
    {
      model: Exercise,
      as: 'exercise',
      include: [{ model: MuscleGroup, as: 'muscleGroup' }]
    }
  ]
}

function parsePositiveInt(val, field) {
  if (val === undefined || val === null) return undefined
  const n = parseInt(val, 10)
  if (isNaN(n) || n < 1) throw fail(400, 'VALIDATION_ERROR', `${field} must be a positive integer.`, { field })
  return n
}

function parseNonNegativeInt(val, field) {
  if (val === undefined || val === null) return undefined
  const n = parseInt(val, 10)
  if (isNaN(n) || n < 0) throw fail(400, 'VALIDATION_ERROR', `${field} must be a non-negative integer.`, { field })
  return n
}

// ── POST /api/workout-sessions/:id/exercises  (admin, trainer) ───────────────

async function createAssignment(req, res) {
  const body = safeBody(req)
  const { session, plan, trainee } = await resolveSessionOwnership(req.parsedId, req.user)

  if (plan.status === 'archived') {
    throw fail(409, 'WORKOUT_PLAN_ARCHIVED', 'Cannot add exercises to a session in an archived plan.', { planId: plan.id })
  }

  // exerciseId required
  if (body.exerciseId === undefined || body.exerciseId === null) {
    throw fail(400, 'VALIDATION_ERROR', 'exerciseId is required.', { field: 'exerciseId' })
  }
  const exerciseId = parseInt(body.exerciseId, 10)
  if (isNaN(exerciseId) || exerciseId < 1) {
    throw fail(400, 'VALIDATION_ERROR', 'exerciseId must be a positive integer.', { field: 'exerciseId' })
  }

  // Verify exercise exists and belongs to trainee's trainer
  await validateExerciseOwnership(exerciseId, trainee)

  // sets required
  if (body.sets === undefined || body.sets === null) {
    throw fail(400, 'VALIDATION_ERROR', 'sets is required.', { field: 'sets' })
  }
  const sets = parsePositiveInt(body.sets, 'sets')

  // At least one of repetitions or durationSeconds must be provided
  const repetitions     = body.repetitions     !== undefined && body.repetitions     !== null
    ? parsePositiveInt(body.repetitions,    'repetitions') : null
  const durationSeconds = body.durationSeconds !== undefined && body.durationSeconds !== null
    ? parsePositiveInt(body.durationSeconds, 'durationSeconds') : null

  if (repetitions === null && durationSeconds === null) {
    throw fail(400, 'VALIDATION_ERROR',
      'At least one of repetitions or durationSeconds must be provided.',
      { fields: ['repetitions', 'durationSeconds'] })
  }

  const restSeconds = body.restSeconds !== undefined && body.restSeconds !== null
    ? parseNonNegativeInt(body.restSeconds, 'restSeconds') : 0

  const notes = body.notes ? String(body.notes).trim() || null : null

  let displayOrder
  if (body.displayOrder !== undefined && body.displayOrder !== null && body.displayOrder !== '') {
    displayOrder = parsePositiveInt(body.displayOrder, 'displayOrder')
  } else {
    displayOrder = await nextAssignmentOrder(session.id)
  }

  const assignment = await WorkoutSessionExercise.create({
    workoutSessionId: session.id,
    exerciseId,
    sets,
    repetitions,
    durationSeconds,
    restSeconds,
    notes,
    displayOrder
  })

  const created = await WorkoutSessionExercise.findByPk(assignment.id, { include: assignmentWithExercise() })

  if (plan.status === 'active' && trainee) {
    await tryCreateAndEmitNotification({
      type:            NOTIFICATION_TYPES.WORKOUT_PLAN_UPDATED,
      recipientUserId: trainee.userId,
      actorUserId:     req.user.id,
      title:           'Workout Plan Updated',
      message:         `An exercise has been added to your active workout plan.`,
      metadata:        { traineeId: trainee.id, workoutPlanId: plan.id, link: '/trainee/workout-plan' }
    })
  }

  res.status(201).json({ success: true, data: serializeAssignment(created), error: null })
}

// ── PUT /api/workout-session-exercises/:id  (admin, trainer) ─────────────────

async function updateAssignment(req, res) {
  const body = safeBody(req)
  const { assignment, plan, trainee } = await resolveAssignmentOwnership(req.parsedId, req.user)

  if (plan.status === 'archived') {
    throw fail(409, 'WORKOUT_PLAN_ARCHIVED', 'Cannot modify exercises in a session from an archived plan.', { planId: plan.id })
  }

  const updates = {}

  if (body.exerciseId !== undefined) {
    const exerciseId = parseInt(body.exerciseId, 10)
    if (isNaN(exerciseId) || exerciseId < 1) {
      throw fail(400, 'VALIDATION_ERROR', 'exerciseId must be a positive integer.', { field: 'exerciseId' })
    }
    await validateExerciseOwnership(exerciseId, trainee)
    updates.exerciseId = exerciseId
  }

  if (body.sets !== undefined) {
    updates.sets = parsePositiveInt(body.sets, 'sets')
  }

  if (body.repetitions !== undefined) {
    updates.repetitions = body.repetitions !== null
      ? parsePositiveInt(body.repetitions, 'repetitions') : null
  }

  if (body.durationSeconds !== undefined) {
    updates.durationSeconds = body.durationSeconds !== null
      ? parsePositiveInt(body.durationSeconds, 'durationSeconds') : null
  }

  if (body.restSeconds !== undefined) {
    updates.restSeconds = parseNonNegativeInt(body.restSeconds, 'restSeconds')
  }

  if (body.notes !== undefined) {
    updates.notes = body.notes ? String(body.notes).trim() || null : null
  }

  if (body.displayOrder !== undefined) {
    updates.displayOrder = parsePositiveInt(body.displayOrder, 'displayOrder')
  }

  if (Object.keys(updates).length === 0) {
    throw fail(400, 'VALIDATION_ERROR', 'No updatable fields were provided.', {})
  }

  // After applying updates, ensure at least one of reps/duration remains non-null
  const finalRepetitions     = 'repetitions'     in updates ? updates.repetitions     : assignment.repetitions
  const finalDurationSeconds = 'durationSeconds' in updates ? updates.durationSeconds : assignment.durationSeconds

  if (finalRepetitions === null && finalDurationSeconds === null) {
    throw fail(400, 'VALIDATION_ERROR',
      'At least one of repetitions or durationSeconds must be non-null.',
      { fields: ['repetitions', 'durationSeconds'] })
  }

  await assignment.update(updates)
  const refreshed = await WorkoutSessionExercise.findByPk(assignment.id, { include: assignmentWithExercise() })

  if (plan.status === 'active' && trainee) {
    await tryCreateAndEmitNotification({
      type:            NOTIFICATION_TYPES.WORKOUT_PLAN_UPDATED,
      recipientUserId: trainee.userId,
      actorUserId:     req.user.id,
      title:           'Workout Plan Updated',
      message:         `An exercise in your active workout plan has been updated.`,
      metadata:        { traineeId: trainee.id, workoutPlanId: plan.id, link: '/trainee/workout-plan' }
    })
  }

  res.json({ success: true, data: serializeAssignment(refreshed), error: null })
}

// ── DELETE /api/workout-session-exercises/:id  (admin, trainer) ──────────────

async function removeAssignment(req, res) {
  const { assignment, plan, trainee } = await resolveAssignmentOwnership(req.parsedId, req.user)

  if (plan.status === 'archived') {
    throw fail(409, 'WORKOUT_PLAN_ARCHIVED', 'Cannot remove exercises from a session in an archived plan.', { planId: plan.id })
  }

  await assignment.destroy() // does NOT delete the Exercise record

  if (plan.status === 'active' && trainee) {
    await tryCreateAndEmitNotification({
      type:            NOTIFICATION_TYPES.WORKOUT_PLAN_UPDATED,
      recipientUserId: trainee.userId,
      actorUserId:     req.user.id,
      title:           'Workout Plan Updated',
      message:         `An exercise has been removed from your active workout plan.`,
      metadata:        { traineeId: trainee.id, workoutPlanId: plan.id, link: '/trainee/workout-plan' }
    })
  }

  res.json({ success: true, data: { id: req.parsedId }, error: null })
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  createAssignment: wrap(createAssignment),
  updateAssignment: wrap(updateAssignment),
  removeAssignment: wrap(removeAssignment)
}
