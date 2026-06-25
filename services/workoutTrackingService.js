'use strict'

const { Op } = require('sequelize')
const {
  WorkoutPlan,
  WeeklyWorkoutLog,
  Trainee
} = require('../models/index')
const {
  fullPlanIncludes,
  serializeAssignment
} = require('./workoutPlanService')
const { findTrainerByUserId } = require('./exerciseService')

// ── Error factory ──────────────────────────────────────────────────────────────

function fail(status, code, message, details) {
  const e = new Error(message)
  e.status  = status
  e.code    = code
  e.details = details || {}
  return e
}

// ── DATEONLY helpers (no timezone shifting) ───────────────────────────────────

function toDateOnly(d) {
  const y   = d.getFullYear()
  const m   = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function currentWeekMonday() {
  const now = new Date()
  const dow  = now.getDay()                   // 0=Sun … 6=Sat
  const diff = dow === 0 ? -6 : 1 - dow      // days back to Monday
  const mon  = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff)
  return toDateOnly(mon)
}

function getWeekEnd(weekStart) {
  const [y, m, d] = weekStart.split('-').map(Number)
  const sunday = new Date(y, m - 1, d + 6)
  return toDateOnly(sunday)
}

function isValidDateOnly(str) {
  if (!str || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return false
  const [y, m, d] = str.split('-').map(Number)
  if (m < 1 || m > 12 || d < 1 || d > 31) return false
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

function isMondayString(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d).getDay() === 1
}

/**
 * Parse and validate the optional weekStart query parameter.
 * Returns { weekStart, weekEnd, isCurrentWeek, isFutureWeek }.
 */
function resolveWeekParams(weekStartParam) {
  let weekStart
  if (weekStartParam) {
    const str = String(weekStartParam).trim()
    if (!isValidDateOnly(str)) {
      throw fail(400, 'INVALID_WEEK_START',
        'weekStart must be a valid date in YYYY-MM-DD format.', { param: 'weekStart' })
    }
    if (!isMondayString(str)) {
      throw fail(400, 'WEEK_START_MUST_BE_MONDAY',
        'weekStart must be a Monday.', { param: 'weekStart', provided: str })
    }
    weekStart = str
  } else {
    weekStart = currentWeekMonday()
  }
  const weekEnd      = getWeekEnd(weekStart)
  const thisMonday   = currentWeekMonday()
  const isCurrentWeek = weekStart === thisMonday
  const isFutureWeek  = weekStart > thisMonday
  return { weekStart, weekEnd, isCurrentWeek, isFutureWeek }
}

// ── Weekly plan resolution ────────────────────────────────────────────────────

/**
 * Determine which WorkoutPlan applies to the requested week for a trainee.
 *
 * Resolution order:
 * 1. If logs already exist for that week, reuse the stored workoutPlanId.
 * 2. Otherwise find a plan (active or archived) whose date range intersects the week.
 * 3. Returns null when no applicable plan exists — callers treat this as a normal state.
 */
async function resolvePlanForWeek(traineeId, weekStart, weekEnd) {
  const existingLog = await WeeklyWorkoutLog.findOne({
    where:      { traineeId, weekStartDate: weekStart },
    attributes: ['workoutPlanId']
  })

  if (existingLog) {
    return WorkoutPlan.findByPk(existingLog.workoutPlanId, { include: fullPlanIncludes() })
  }

  const plans = await WorkoutPlan.findAll({
    where: {
      traineeId,
      status: { [Op.in]: ['active', 'archived'] },
      [Op.and]: [
        { [Op.or]: [{ startDate: null }, { startDate: { [Op.lte]: weekEnd   } }] },
        { [Op.or]: [{ endDate:   null }, { endDate:   { [Op.gte]: weekStart } }] }
      ]
    },
    order: [['startDate', 'DESC']]
  })

  if (plans.length === 0) return null

  return WorkoutPlan.findByPk(plans[0].id, { include: fullPlanIncludes() })
}

// ── Tracker serialization ─────────────────────────────────────────────────────

function serializeTrackingRow(log) {
  if (!log) return { id: null, isCompleted: false, completedAt: null, notes: '' }
  return {
    id:          log.id,
    isCompleted: log.isCompleted,
    completedAt: log.completedAt || null,
    notes:       log.notes || ''
  }
}

/**
 * Build the full tracker response envelope.
 * When plan is null, returns success with plan = null and sessions = [].
 */
function buildTrackerResponse(weekStart, weekEnd, isCurrentWeek, plan, logs) {
  if (!plan) {
    return {
      weekStartDate:  weekStart,
      weekEndDate:    weekEnd,
      isCurrentWeek,
      plan:           null,
      summary: { plannedWorkouts: 0, completedWorkouts: 0, remainingWorkouts: 0, completionRate: 0 },
      sessions:       []
    }
  }

  const logMap = {}
  for (const log of logs) {
    logMap[log.workoutSessionId] = log
  }

  const sessions = (plan.sessions || [])
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id)

  const serializedSessions = sessions.map(session => {
    const assignments = (session.exerciseAssignments || [])
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id)

    return {
      id:                  session.id,
      name:                session.name,
      description:         session.description || null,
      scheduledDay:        session.scheduledDay || null,
      displayOrder:        session.displayOrder,
      tracking:            serializeTrackingRow(logMap[session.id] || null),
      exerciseAssignments: assignments.map(serializeAssignment)
    }
  })

  const completedCount  = serializedSessions.filter(s => s.tracking.isCompleted).length
  const plannedCount    = serializedSessions.length
  const completionRate  = plannedCount > 0 ? Math.round((completedCount / plannedCount) * 100) : 0

  return {
    weekStartDate:  weekStart,
    weekEndDate:    weekEnd,
    isCurrentWeek,
    plan: {
      id:        plan.id,
      name:      plan.name,
      status:    plan.status,
      startDate: plan.startDate || null,
      endDate:   plan.endDate   || null
    },
    summary: {
      plannedWorkouts:   plannedCount,
      completedWorkouts: completedCount,
      remainingWorkouts: plannedCount - completedCount,
      completionRate
    },
    sessions: serializedSessions
  }
}

// ── Ownership resolution ──────────────────────────────────────────────────────

/**
 * Resolve the target Trainee for a tracking request.
 * For trainee role: uses the authenticated user's own profile.
 * For trainer role: verifies the trainer owns the target trainee.
 * For admin role: allows any trainee.
 */
async function resolveTraineeForTracking(reqUser, targetTraineeId) {
  if (reqUser.role === 'trainee') {
    const trainee = await Trainee.findOne({ where: { userId: reqUser.id } })
    if (!trainee) {
      throw fail(404, 'TRAINEE_PROFILE_NOT_FOUND', 'Trainee profile not found for this account.', {})
    }
    return trainee
  }

  const trainee = await Trainee.findByPk(targetTraineeId)
  if (!trainee) {
    throw fail(404, 'TRAINEE_NOT_FOUND',
      `Trainee with id ${targetTraineeId} not found.`, { id: targetTraineeId })
  }

  if (reqUser.role === 'trainer') {
    const trainerProfile = await findTrainerByUserId(reqUser.id)
    if (!trainerProfile) {
      throw fail(403, 'FORBIDDEN', 'Trainer profile not found for this account.', {})
    }
    if (trainee.trainerId !== trainerProfile.id) {
      throw fail(403, 'FORBIDDEN',
        'You do not have permission to access this trainee\'s tracking data.', {})
    }
  }

  return trainee
}

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  resolveWeekParams,
  resolvePlanForWeek,
  buildTrackerResponse,
  resolveTraineeForTracking,
  currentWeekMonday,
  // Phase 20 additions — used by progressSummaryService
  isValidDateOnly,
  isMondayString,
  toDateOnly,
  getWeekEnd
}
