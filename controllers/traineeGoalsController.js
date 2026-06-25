'use strict'

const { Trainee, Goal, TraineeGoal } = require('../models/index')
const { findTrainerByUserId } = require('../services/traineeService')
const { serializeAssignment } = require('../services/goalService')
const { tryCreateAndEmitNotification } = require('../services/notificationService')
const { NOTIFICATION_TYPES } = require('../constants/notificationTypes')

const VALID_STATUSES = ['in-progress', 'achieved', 'dropped']

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

function parseDate(val) {
  if (val === undefined || val === null || val === '') return { value: null, valid: true }
  const d = String(val).trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || isNaN(new Date(d).getTime())) return { valid: false }
  return { value: d, valid: true }
}

async function resolveTraineeAndCheckOwnership(traineeId, reqUser) {
  const trainee = await Trainee.findByPk(traineeId)
  if (!trainee) {
    throw fail(404, 'TRAINEE_NOT_FOUND', `Trainee with id ${traineeId} not found.`, { id: traineeId })
  }
  if (reqUser.role === 'trainer') {
    const trainerProfile = await findTrainerByUserId(reqUser.id)
    if (!trainerProfile) {
      throw fail(403, 'FORBIDDEN', 'Trainer profile not found.', {})
    }
    if (trainee.trainerId !== trainerProfile.id) {
      throw fail(403, 'FORBIDDEN', 'You do not have permission to manage goals for this trainee.', {})
    }
  }
  return trainee
}

// GET /api/trainees/:id/goals
async function listGoals(req, res) {
  const trainee = await resolveTraineeAndCheckOwnership(req.parsedId, req.user)

  const traineeWithGoals = await Trainee.findByPk(trainee.id, {
    include: [{
      model: Goal,
      as: 'goals',
      through: { model: TraineeGoal, attributes: ['status', 'targetDate', 'createdAt', 'updatedAt'] }
    }]
  })

  const goals = traineeWithGoals.goals || []
  res.json({
    success: true,
    data: goals.map(g => serializeAssignment(g, g.TraineeGoal)),
    error: null
  })
}

// POST /api/trainees/:id/goals
async function assignGoal(req, res) {
  const trainee = await resolveTraineeAndCheckOwnership(req.parsedId, req.user)
  const body = safeBody(req)

  const rawGoalId = body.goalId
  const goalId = typeof rawGoalId === 'number' ? rawGoalId : parseInt(String(rawGoalId ?? ''), 10)
  if (!Number.isInteger(goalId) || goalId < 1) {
    throw fail(400, 'VALIDATION_ERROR', 'goalId is required and must be a positive integer.', { field: 'goalId' })
  }

  const goal = await Goal.findByPk(goalId)
  if (!goal) throw fail(404, 'GOAL_NOT_FOUND', `Goal with id ${goalId} not found.`, { goalId })

  let status = 'in-progress'
  if (body.status !== undefined) {
    const s = String(body.status).trim()
    if (!VALID_STATUSES.includes(s)) {
      throw fail(400, 'VALIDATION_ERROR', `status must be one of: ${VALID_STATUSES.join(', ')}.`, { field: 'status' })
    }
    status = s
  }

  const dateResult = parseDate(body.targetDate)
  if (!dateResult.valid) {
    throw fail(400, 'VALIDATION_ERROR', 'targetDate must be a valid date in YYYY-MM-DD format.', { field: 'targetDate' })
  }

  const existing = await TraineeGoal.findOne({ where: { traineeId: trainee.id, goalId } })
  if (existing) {
    throw fail(409, 'GOAL_ALREADY_ASSIGNED',
      `Goal with id ${goalId} is already assigned to this trainee.`,
      { traineeId: trainee.id, goalId })
  }

  await TraineeGoal.create({ traineeId: trainee.id, goalId, status, targetDate: dateResult.value })
  const tg = await TraineeGoal.findOne({ where: { traineeId: trainee.id, goalId } })

  await tryCreateAndEmitNotification({
    type:            NOTIFICATION_TYPES.GOAL_ASSIGNED,
    recipientUserId: trainee.userId,
    actorUserId:     req.user.id,
    title:           'Goal Assigned',
    message:         `You have been assigned the goal: "${goal.name}".`,
    metadata:        { traineeId: trainee.id, goalId, link: '/trainee/dashboard' }
  })

  res.status(201).json({ success: true, data: serializeAssignment(goal, tg), error: null })
}

// PATCH /api/trainees/:id/goals/:goalId
async function updateGoal(req, res) {
  const trainee = await resolveTraineeAndCheckOwnership(req.parsedId, req.user)
  const body = safeBody(req)

  const rawGoalId = req.params.goalId
  const goalId = parseInt(String(rawGoalId ?? ''), 10)
  if (!Number.isInteger(goalId) || goalId < 1) {
    throw fail(400, 'INVALID_ID', 'goalId must be a positive integer.', { param: 'goalId', value: rawGoalId })
  }

  const tg = await TraineeGoal.findOne({ where: { traineeId: trainee.id, goalId } })
  if (!tg) {
    throw fail(404, 'GOAL_ASSIGNMENT_NOT_FOUND',
      `Goal with id ${goalId} is not assigned to this trainee.`,
      { traineeId: trainee.id, goalId })
  }

  const updates = {}

  if (body.status !== undefined) {
    const s = String(body.status).trim()
    if (!VALID_STATUSES.includes(s)) {
      throw fail(400, 'VALIDATION_ERROR', `status must be one of: ${VALID_STATUSES.join(', ')}.`, { field: 'status' })
    }
    updates.status = s
  }

  if (body.targetDate !== undefined) {
    const dateResult = parseDate(body.targetDate)
    if (!dateResult.valid) {
      throw fail(400, 'VALIDATION_ERROR', 'targetDate must be a valid date in YYYY-MM-DD format.', { field: 'targetDate' })
    }
    updates.targetDate = dateResult.value
  }

  if (Object.keys(updates).length === 0) {
    throw fail(400, 'VALIDATION_ERROR', 'No updatable fields were provided.', {})
  }

  await tg.update(updates)

  const goal = await Goal.findByPk(goalId)

  await tryCreateAndEmitNotification({
    type:            NOTIFICATION_TYPES.GOAL_UPDATED,
    recipientUserId: trainee.userId,
    actorUserId:     req.user.id,
    title:           'Goal Assignment Updated',
    message:         `Your goal assignment for "${goal.name}" has been updated.`,
    metadata:        { traineeId: trainee.id, goalId, link: '/trainee/dashboard' }
  })

  res.json({ success: true, data: serializeAssignment(goal, tg), error: null })
}

// DELETE /api/trainees/:id/goals/:goalId
async function removeGoal(req, res) {
  const trainee = await resolveTraineeAndCheckOwnership(req.parsedId, req.user)

  const rawGoalId = req.params.goalId
  const goalId = parseInt(String(rawGoalId ?? ''), 10)
  if (!Number.isInteger(goalId) || goalId < 1) {
    throw fail(400, 'INVALID_ID', 'goalId must be a positive integer.', { param: 'goalId', value: rawGoalId })
  }

  const tg = await TraineeGoal.findOne({ where: { traineeId: trainee.id, goalId } })
  if (!tg) {
    throw fail(404, 'GOAL_ASSIGNMENT_NOT_FOUND',
      `Goal with id ${goalId} is not assigned to this trainee.`,
      { traineeId: trainee.id, goalId })
  }

  const removedGoal = await Goal.findByPk(goalId)
  await tg.destroy()

  const goalName = removedGoal ? removedGoal.name : `#${goalId}`
  await tryCreateAndEmitNotification({
    type:            NOTIFICATION_TYPES.GOAL_REMOVED,
    recipientUserId: trainee.userId,
    actorUserId:     req.user.id,
    title:           'Goal Removed',
    message:         `The goal "${goalName}" has been removed from your plan.`,
    metadata:        { traineeId: trainee.id, goalId, link: '/trainee/dashboard' }
  })

  res.json({ success: true, data: { traineeId: trainee.id, goalId }, error: null })
}

module.exports = {
  listGoals:  wrap(listGoals),
  assignGoal: wrap(assignGoal),
  updateGoal: wrap(updateGoal),
  removeGoal: wrap(removeGoal)
}
