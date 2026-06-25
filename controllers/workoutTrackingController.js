'use strict'

const { WorkoutSession, WeeklyWorkoutLog, Trainee } = require('../models/index')
const {
  resolveWeekParams,
  resolvePlanForWeek,
  buildTrackerResponse,
  resolveTraineeForTracking
} = require('../services/workoutTrackingService')
const { tryCreateAndEmitNotification, resolveTrainerUserIdFromTrainee } = require('../services/notificationService')
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

// ── GET /api/trainees/me/workout-tracking  (trainee only) ─────────────────────

async function getMyTracking(req, res) {
  const myTrainee = await Trainee.findOne({ where: { userId: req.user.id } })
  if (!myTrainee) {
    throw fail(404, 'TRAINEE_PROFILE_NOT_FOUND', 'Trainee profile not found for this account.', {})
  }

  const { weekStart, weekEnd, isCurrentWeek } = resolveWeekParams(req.query.weekStart)

  const plan = await resolvePlanForWeek(myTrainee.id, weekStart, weekEnd)

  const logs = plan
    ? await WeeklyWorkoutLog.findAll({ where: { traineeId: myTrainee.id, weekStartDate: weekStart } })
    : []

  res.json({ success: true, data: buildTrackerResponse(weekStart, weekEnd, isCurrentWeek, plan, logs), error: null })
}

// ── PUT /api/trainees/me/workout-tracking/:workoutSessionId  (trainee only) ───

async function updateMyTracking(req, res) {
  const body      = safeBody(req)
  const sessionId = req.parsedId

  const myTrainee = await Trainee.findOne({ where: { userId: req.user.id } })
  if (!myTrainee) {
    throw fail(404, 'TRAINEE_PROFILE_NOT_FOUND', 'Trainee profile not found for this account.', {})
  }

  const { weekStart, weekEnd, isCurrentWeek, isFutureWeek } = resolveWeekParams(req.query.weekStart)

  if (isFutureWeek) {
    throw fail(409, 'FUTURE_WEEK_TRACKING_NOT_ALLOWED',
      'Tracking cannot be recorded for future weeks.', { weekStart })
  }

  // Validate body.completed — required, must be a real boolean
  if (body.completed === undefined || body.completed === null) {
    throw fail(400, 'VALIDATION_ERROR', 'completed is required.', { field: 'completed' })
  }
  if (typeof body.completed !== 'boolean') {
    throw fail(400, 'VALIDATION_ERROR',
      'completed must be a boolean (true or false), not a string.', { field: 'completed' })
  }

  // Validate body.notes — optional, must be a string when supplied
  let notesProvided = false
  let trimmedNotes  = null
  if (body.notes !== undefined) {
    notesProvided = true
    if (typeof body.notes !== 'string') {
      throw fail(400, 'VALIDATION_ERROR', 'notes must be a string.', { field: 'notes' })
    }
    const raw = body.notes.trim()
    if (raw.length > 2000) {
      throw fail(400, 'VALIDATION_ERROR',
        'notes must be 2000 characters or fewer.', { field: 'notes' })
    }
    trimmedNotes = raw === '' ? null : raw
  }

  const completed = body.completed

  // Resolve plan for this week — must exist to write tracking
  const plan = await resolvePlanForWeek(myTrainee.id, weekStart, weekEnd)
  if (!plan) {
    throw fail(404, 'WORKOUT_PLAN_FOR_WEEK_NOT_FOUND',
      'No workout plan is applicable for this week.', { weekStart })
  }

  // Verify the session belongs to the resolved plan
  const session = await WorkoutSession.findByPk(sessionId)
  if (!session) {
    throw fail(404, 'WORKOUT_SESSION_NOT_FOUND',
      `Workout session with id ${sessionId} not found.`, { id: sessionId })
  }
  if (session.workoutPlanId !== plan.id) {
    throw fail(409, 'WORKOUT_SESSION_NOT_IN_WEEKLY_PLAN',
      'This workout session does not belong to the plan assigned for this week.',
      { workoutSessionId: sessionId, workoutPlanId: plan.id })
  }

  // Load existing log (if any)
  let log = await WeeklyWorkoutLog.findOne({
    where: { traineeId: myTrainee.id, workoutSessionId: sessionId, weekStartDate: weekStart }
  })

  const wasCompleted = log ? log.isCompleted          : false
  const wasNotes     = log ? (log.notes      || null) : null

  // Determine completedAt: set on false→true, clear on →false, preserve on true→true
  let completedAtValue
  if (completed) {
    completedAtValue = (wasCompleted && log && log.completedAt) ? log.completedAt : new Date()
  } else {
    completedAtValue = null
  }

  // Notes: use supplied value if provided, otherwise keep existing
  const notesValue = notesProvided ? trimmedNotes : (log ? (log.notes || null) : null)

  if (log) {
    await log.update({ isCompleted: completed, completedAt: completedAtValue, notes: notesValue })
    await log.reload()
  } else {
    log = await WeeklyWorkoutLog.create({
      traineeId:        myTrainee.id,
      workoutPlanId:    plan.id,
      workoutSessionId: sessionId,
      weekStartDate:    weekStart,
      isCompleted:      completed,
      completedAt:      completedAtValue,
      notes:            notesValue
    })
  }

  // Notify the trainee's trainer if completion state or notes actually changed, before responding
  const completionChanged = completed !== wasCompleted
  const notesChanged      = notesProvided && trimmedNotes !== wasNotes

  if ((completionChanged || notesChanged) && myTrainee.trainerId) {
    const trainerUserId = await resolveTrainerUserIdFromTrainee(myTrainee)
    if (trainerUserId) {
      const actorDisplayName = req.user.displayName || `${req.user.firstName} ${req.user.lastName}`
      let msgParts = [`${actorDisplayName} updated tracking for "${session.name}"`]
      msgParts.push(completed ? 'marked complete' : 'marked incomplete')
      if (notesChanged) msgParts.push('and updated feedback')
      await tryCreateAndEmitNotification({
        type:            NOTIFICATION_TYPES.WORKOUT_TRACKING_UPDATED,
        recipientUserId: trainerUserId,
        actorUserId:     req.user.id,
        title:           'Workout Tracking Updated',
        message:         msgParts.join(', ') + '.',
        metadata: {
          traineeId:        myTrainee.id,
          workoutSessionId: sessionId,
          weekStartDate:    weekStart,
          completed,
          notesChanged,
          link:             `/trainer/trainees/${myTrainee.id}/tracking`
        }
      })
    }
  }

  // Return the full updated tracker for this week
  const allLogs = await WeeklyWorkoutLog.findAll({
    where: { traineeId: myTrainee.id, weekStartDate: weekStart }
  })

  res.json({
    success: true,
    data:    buildTrackerResponse(weekStart, weekEnd, isCurrentWeek, plan, allLogs),
    error:   null
  })
}

// ── GET /api/trainees/:id/workout-tracking  (admin, trainer) ──────────────────

async function getTraineeTracking(req, res) {
  const trainee = await resolveTraineeForTracking(req.user, req.parsedId)

  const { weekStart, weekEnd, isCurrentWeek } = resolveWeekParams(req.query.weekStart)

  const plan = await resolvePlanForWeek(trainee.id, weekStart, weekEnd)

  const logs = plan
    ? await WeeklyWorkoutLog.findAll({ where: { traineeId: trainee.id, weekStartDate: weekStart } })
    : []

  res.json({ success: true, data: buildTrackerResponse(weekStart, weekEnd, isCurrentWeek, plan, logs), error: null })
}

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  getMyTracking:      wrap(getMyTracking),
  updateMyTracking:   wrap(updateMyTracking),
  getTraineeTracking: wrap(getTraineeTracking)
}
