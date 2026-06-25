'use strict'

const {
  sequelize,
  WorkoutPlan,
  WorkoutSession,
  WorkoutSessionExercise,
  Exercise,
  MuscleGroup,
  Trainee,
  User
} = require('../models/index')
const { findTrainerByUserId } = require('./exerciseService')

// ── Error factory (mirrored in controllers for request-level errors) ──────────

function fail(status, code, message, details) {
  const e = new Error(message)
  e.status  = status
  e.code    = code
  e.details = details || {}
  return e
}

// ── Status ordering for list sorting ─────────────────────────────────────────

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
      model: WorkoutSession,
      as: 'sessions',
      include: [
        {
          model: WorkoutSessionExercise,
          as: 'exerciseAssignments',
          include: [
            {
              model: Exercise,
              as: 'exercise',
              include: [{ model: MuscleGroup, as: 'muscleGroup' }]
            }
          ]
        }
      ]
    }
  ]
}

function summaryPlanIncludes() {
  return [
    { model: WorkoutSession, as: 'sessions', attributes: ['id'] }
  ]
}

// ── Serializers ───────────────────────────────────────────────────────────────

function serializeAssignment(assignment) {
  const ex = assignment.exercise
  const mg = ex ? ex.muscleGroup : null
  return {
    id:               assignment.id,
    workoutSessionId: assignment.workoutSessionId,
    exerciseId:       assignment.exerciseId,
    sets:             assignment.sets,
    repetitions:      assignment.repetitions !== null && assignment.repetitions !== undefined
                        ? assignment.repetitions : null,
    durationSeconds:  assignment.durationSeconds !== null && assignment.durationSeconds !== undefined
                        ? assignment.durationSeconds : null,
    restSeconds:      assignment.restSeconds,
    notes:            assignment.notes || null,
    displayOrder:     assignment.displayOrder,
    exercise: ex ? {
      id:          ex.id,
      name:        ex.name,
      description: ex.description,
      muscleGroup: mg ? { id: mg.id, name: mg.name } : null
    } : null
  }
}

function serializeSession(session) {
  const assignments = (session.exerciseAssignments || [])
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id)
  return {
    id:                   session.id,
    workoutPlanId:        session.workoutPlanId,
    name:                 session.name,
    description:          session.description || null,
    scheduledDay:         session.scheduledDay || null,
    displayOrder:         session.displayOrder,
    exerciseAssignments:  assignments.map(serializeAssignment),
    createdAt:            session.createdAt,
    updatedAt:            session.updatedAt
  }
}

function serializeSessionSummary(session) {
  return {
    id:           session.id,
    workoutPlanId: session.workoutPlanId,
    name:         session.name,
    description:  session.description || null,
    scheduledDay: session.scheduledDay || null,
    displayOrder: session.displayOrder,
    createdAt:    session.createdAt,
    updatedAt:    session.updatedAt
  }
}

function serializePlanSummary(plan) {
  return {
    id:           plan.id,
    trainerId:    plan.trainerId,
    traineeId:    plan.traineeId,
    name:         plan.name,
    description:  plan.description || null,
    status:       plan.status,
    startDate:    plan.startDate || null,
    endDate:      plan.endDate   || null,
    sessionCount: plan.sessions ? plan.sessions.length : 0,
    createdAt:    plan.createdAt,
    updatedAt:    plan.updatedAt
  }
}

function serializePlanFull(plan) {
  const sessions = (plan.sessions || [])
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id)
  return {
    id:          plan.id,
    trainerId:   plan.trainerId,
    traineeId:   plan.traineeId,
    name:        plan.name,
    description: plan.description || null,
    status:      plan.status,
    startDate:   plan.startDate || null,
    endDate:     plan.endDate   || null,
    sessions:    sessions.map(serializeSession),
    createdAt:   plan.createdAt,
    updatedAt:   plan.updatedAt
  }
}

// ── Ownership resolution ──────────────────────────────────────────────────────

/**
 * Resolve trainee and check trainer ownership.
 * Returns { trainee, trainerProfile }.
 * trainerProfile is null for admin.
 */
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

/**
 * Load a workout plan and enforce role-specific ownership.
 * Returns { plan, trainerProfile, trainee }.
 */
async function resolvePlanOwnership(planId, reqUser) {
  const plan = await WorkoutPlan.findByPk(planId)
  if (!plan) {
    throw fail(404, 'WORKOUT_PLAN_NOT_FOUND', `Workout plan with id ${planId} not found.`, { id: planId })
  }

  if (reqUser.role === 'trainer') {
    const trainerProfile = await findTrainerByUserId(reqUser.id)
    if (!trainerProfile) {
      throw fail(403, 'FORBIDDEN', 'Trainer profile not found for this account.', {})
    }
    const trainee = await Trainee.findByPk(plan.traineeId)
    if (!trainee || trainee.trainerId !== trainerProfile.id) {
      throw fail(403, 'FORBIDDEN', 'You do not have permission to access this workout plan.', {})
    }
    return { plan, trainerProfile, trainee }
  }

  if (reqUser.role === 'trainee') {
    const myTrainee = await Trainee.findOne({ where: { userId: reqUser.id } })
    if (!myTrainee || plan.traineeId !== myTrainee.id) {
      throw fail(403, 'FORBIDDEN', 'You do not have permission to access this workout plan.', {})
    }
    // Draft plans are private trainer working documents — trainees cannot access them
    if (plan.status === 'draft') {
      throw fail(404, 'WORKOUT_PLAN_NOT_FOUND', `Workout plan with id ${planId} not found.`, { id: planId })
    }
    return { plan, trainerProfile: null, trainee: myTrainee }
  }

  // Admin
  const trainee = await Trainee.findByPk(plan.traineeId)
  return { plan, trainerProfile: null, trainee }
}

/**
 * Load a session and enforce ownership through the parent plan.
 */
async function resolveSessionOwnership(sessionId, reqUser) {
  const session = await WorkoutSession.findByPk(sessionId)
  if (!session) {
    throw fail(404, 'WORKOUT_SESSION_NOT_FOUND', `Workout session with id ${sessionId} not found.`, { id: sessionId })
  }
  const { plan, trainerProfile, trainee } = await resolvePlanOwnership(session.workoutPlanId, reqUser)
  return { session, plan, trainerProfile, trainee }
}

/**
 * Load an assignment and enforce ownership through session → plan.
 */
async function resolveAssignmentOwnership(assignmentId, reqUser) {
  const assignment = await WorkoutSessionExercise.findByPk(assignmentId)
  if (!assignment) {
    throw fail(404, 'WORKOUT_EXERCISE_ASSIGNMENT_NOT_FOUND',
      `Exercise assignment with id ${assignmentId} not found.`, { id: assignmentId })
  }
  const { session, plan, trainerProfile, trainee } = await resolveSessionOwnership(assignment.workoutSessionId, reqUser)
  return { assignment, session, plan, trainerProfile, trainee }
}

// ── Exercise ownership ────────────────────────────────────────────────────────

/**
 * Verify the exercise belongs to the trainee's currently assigned trainer.
 */
async function validateExerciseOwnership(exerciseId, trainee) {
  const exercise = await Exercise.findByPk(exerciseId)
  if (!exercise) {
    throw fail(404, 'EXERCISE_NOT_FOUND', `Exercise with id ${exerciseId} not found.`, { exerciseId })
  }
  if (exercise.trainerId !== trainee.trainerId) {
    throw fail(409, 'EXERCISE_NOT_OWNED_BY_TRAINER',
      'This exercise does not belong to the trainer assigned to this trainee.',
      { exerciseId, requiredTrainerId: trainee.trainerId })
  }
  return exercise
}

// ── Plan activation ───────────────────────────────────────────────────────────

const VALID_TRANSITIONS = {
  draft:    ['active', 'archived'],
  active:   ['archived'],
  archived: []
}

/**
 * Activate or archive a workout plan following lifecycle rules.
 * Returns the refreshed plan with full includes after the operation.
 */
async function changeStatus(plan, newStatus, trainee) {
  const allowed = VALID_TRANSITIONS[plan.status] || []
  if (!allowed.includes(newStatus)) {
    throw fail(409, 'INVALID_PLAN_STATUS_TRANSITION',
      `Cannot transition plan from "${plan.status}" to "${newStatus}".`,
      { currentStatus: plan.status, requestedStatus: newStatus })
  }

  const today = new Date().toISOString().split('T')[0]

  if (newStatus === 'active') {
    // Validate completeness before starting the transaction
    const planWithSessions = await WorkoutPlan.findByPk(plan.id, {
      include: [{
        model: WorkoutSession,
        as: 'sessions',
        attributes: ['id', 'name'],
        include: [{
          model: WorkoutSessionExercise,
          as: 'exerciseAssignments',
          attributes: ['id']
        }]
      }]
    })

    const sessions = planWithSessions.sessions || []
    if (sessions.length === 0) {
      throw fail(409, 'WORKOUT_PLAN_EMPTY',
        'Cannot activate a plan with no sessions.',
        { planId: plan.id })
    }

    const emptySessions = sessions.filter(s => (s.exerciseAssignments || []).length === 0)
    if (emptySessions.length > 0) {
      throw fail(409, 'WORKOUT_SESSION_EMPTY',
        'Cannot activate a plan when one or more sessions have no exercises.',
        { emptySessions: emptySessions.map(s => ({ id: s.id, name: s.name })) })
    }

    // Transactionally archive current active plan and activate the new one
    await sequelize.transaction(async t => {
      const currentActive = await WorkoutPlan.findOne({
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
    // Archiving — single update
    await plan.update({ status: 'archived', endDate: today })
  }

  return WorkoutPlan.findByPk(plan.id, { include: fullPlanIncludes() })
}

// ── DisplayOrder auto-assignment ──────────────────────────────────────────────

async function nextSessionOrder(planId) {
  const maxOrder = await WorkoutSession.max('displayOrder', { where: { workoutPlanId: planId } })
  return (maxOrder === null || maxOrder === undefined ? 0 : maxOrder) + 1
}

async function nextAssignmentOrder(sessionId) {
  const maxOrder = await WorkoutSessionExercise.max('displayOrder', { where: { workoutSessionId: sessionId } })
  return (maxOrder === null || maxOrder === undefined ? 0 : maxOrder) + 1
}

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  // Serializers
  serializePlanSummary,
  serializePlanFull,
  serializeSession,
  serializeSessionSummary,
  serializeAssignment,
  // Includes
  fullPlanIncludes,
  summaryPlanIncludes,
  // Ownership helpers
  resolveTraineeOwnership,
  resolvePlanOwnership,
  resolveSessionOwnership,
  resolveAssignmentOwnership,
  validateExerciseOwnership,
  // Business logic
  changeStatus,
  nextSessionOrder,
  nextAssignmentOrder,
  // Sorting
  statusSort
}
