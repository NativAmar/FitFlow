'use strict'

const bcrypt  = require('bcryptjs')
const { Op }  = require('sequelize')
const { sequelize, User, Trainer, Trainee } = require('../models/index')
const { traineeIncludes, serializeTrainee, findTrainerByUserId } = require('../services/traineeService')
const { tryCreateAndEmitNotification } = require('../services/notificationService')
const { NOTIFICATION_TYPES } = require('../constants/notificationTypes')

// ── Constants ─────────────────────────────────────────────────────────────────

const VALID_EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced']
const VALID_TRAINING_STATUS   = ['active', 'paused', 'completed']
const EMAIL_REGEX              = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
  e.status = status
  e.code   = code
  e.details = details || {}
  return e
}

function parseWeeklyWorkouts(val) {
  const n = typeof val === 'number' ? val : parseInt(String(val), 10)
  if (!Number.isInteger(n) || n < 1 || n > 255) return null
  return n
}

function parsePositiveInt(val) {
  const n = typeof val === 'number' ? val : parseInt(String(val), 10)
  if (!Number.isInteger(n) || n < 1) return null
  return n
}

function safeBody(req) {
  const b = req.body
  return b && typeof b === 'object' && !Array.isArray(b) ? b : {}
}

/**
 * Resolve the Trainer profile for an authenticated trainer user.
 * Throws 403 if no Trainer profile exists (data-integrity guard).
 */
async function resolveAuthTrainer(userId) {
  const trainer = await findTrainerByUserId(userId)
  if (!trainer) throw fail(403, 'FORBIDDEN', 'Trainer profile not found for this account.', {})
  return trainer
}

/**
 * Assert that the authenticated trainer owns the given Trainee.
 * Throws 403 if ownership check fails.
 */
function assertOwnership(trainee, trainerProfile) {
  if (trainee.trainerId !== trainerProfile.id) {
    throw fail(403, 'FORBIDDEN', 'You do not have permission to access this trainee.', {})
  }
}

// ── GET /api/trainees ─────────────────────────────────────────────────────────

async function getAll(req, res) {
  const where = {}

  if (req.user.role === 'trainer') {
    const trainerProfile = await resolveAuthTrainer(req.user.id)
    where.trainerId = trainerProfile.id
  }

  const trainees = await Trainee.findAll({ where, include: traineeIncludes(), order: [['id', 'ASC']] })
  res.json({ success: true, data: trainees.map(serializeTrainee), error: null })
}

// ── GET /api/trainees/me ──────────────────────────────────────────────────────

async function getMe(req, res) {
  const trainee = await Trainee.findOne({
    where: { userId: req.user.id },
    include: traineeIncludes()
  })
  if (!trainee) {
    throw fail(404, 'TRAINEE_NOT_FOUND', 'Trainee profile not found for this account.', {})
  }
  res.json({ success: true, data: serializeTrainee(trainee), error: null })
}

// ── GET /api/trainees/:id ─────────────────────────────────────────────────────

async function getById(req, res) {
  const trainee = await Trainee.findByPk(req.parsedId, { include: traineeIncludes() })
  if (!trainee) {
    throw fail(404, 'TRAINEE_NOT_FOUND', `Trainee with id ${req.parsedId} not found.`, { id: req.parsedId })
  }

  if (req.user.role === 'trainer') {
    const trainerProfile = await resolveAuthTrainer(req.user.id)
    assertOwnership(trainee, trainerProfile)
  }

  res.json({ success: true, data: serializeTrainee(trainee), error: null })
}

// ── POST /api/trainees ────────────────────────────────────────────────────────

async function create(req, res) {
  const body = safeBody(req)

  // ── Validate required fields ──────────────────────────────────────────────
  const errors = []

  const firstName = body.firstName ? String(body.firstName).trim() : ''
  if (!firstName) errors.push({ field: 'firstName', message: 'firstName is required' })

  const lastName = body.lastName ? String(body.lastName).trim() : ''
  if (!lastName) errors.push({ field: 'lastName', message: 'lastName is required' })

  const rawEmail = body.email ? String(body.email).trim().toLowerCase() : ''
  if (!rawEmail) {
    errors.push({ field: 'email', message: 'email is required' })
  } else if (!EMAIL_REGEX.test(rawEmail)) {
    errors.push({ field: 'email', message: 'email must be a valid email address' })
  }

  const rawPassword = body.password !== undefined && body.password !== null ? String(body.password) : ''
  if (!rawPassword) {
    errors.push({ field: 'password', message: 'password is required' })
  } else if (rawPassword.length < 6) {
    errors.push({ field: 'password', message: 'password must be at least 6 characters' })
  }

  const rawLevel = body.experienceLevel ? String(body.experienceLevel).trim().toLowerCase() : ''
  if (!rawLevel) {
    errors.push({ field: 'experienceLevel', message: 'experienceLevel is required' })
  } else if (!VALID_EXPERIENCE_LEVELS.includes(rawLevel)) {
    errors.push({ field: 'experienceLevel', message: `experienceLevel must be one of: ${VALID_EXPERIENCE_LEVELS.join(', ')}` })
  }

  const weeklyWorkouts = body.weeklyWorkouts !== undefined ? parseWeeklyWorkouts(body.weeklyWorkouts) : null
  if (body.weeklyWorkouts === undefined || body.weeklyWorkouts === null || body.weeklyWorkouts === '') {
    errors.push({ field: 'weeklyWorkouts', message: 'weeklyWorkouts is required' })
  } else if (weeklyWorkouts === null) {
    errors.push({ field: 'weeklyWorkouts', message: 'weeklyWorkouts must be a positive integer (1–255)' })
  }

  if (errors.length > 0) throw fail(400, 'VALIDATION_ERROR', 'Validation failed', { fields: errors })

  // Optional fields with defaults
  const rawStatus = body.status ? String(body.status).trim().toLowerCase() : 'active'
  if (!VALID_TRAINING_STATUS.includes(rawStatus)) {
    throw fail(400, 'VALIDATION_ERROR', 'Invalid status value.', { field: 'status', allowed: VALID_TRAINING_STATUS })
  }
  const notes = body.notes ? String(body.notes).trim() : null

  // ── Resolve trainer ───────────────────────────────────────────────────────
  let targetTrainer

  if (req.user.role === 'trainer') {
    targetTrainer = await resolveAuthTrainer(req.user.id)
  } else {
    // admin must supply a valid trainerId
    const trainerId = parsePositiveInt(body.trainerId)
    if (!trainerId) {
      throw fail(400, 'VALIDATION_ERROR', 'trainerId is required and must be a positive integer.', { field: 'trainerId' })
    }
    targetTrainer = await Trainer.findByPk(trainerId, {
      include: [{ model: User, as: 'user', attributes: ['id', 'status'] }]
    })
    if (!targetTrainer) {
      throw fail(404, 'TRAINER_NOT_FOUND', `Trainer with id ${trainerId} not found.`, { trainerId })
    }
    if (targetTrainer.user.status !== 'active') {
      throw fail(400, 'TRAINER_INACTIVE', 'Cannot assign a trainee to an inactive trainer.', { trainerId })
    }
  }

  // ── Email uniqueness check ────────────────────────────────────────────────
  const existing = await User.findOne({ where: { email: rawEmail } })
  if (existing) throw fail(409, 'DUPLICATE_EMAIL', 'An account with this email already exists.', {})

  // ── Hash password ─────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(rawPassword, 10)

  // ── Transaction: create User + Trainee ───────────────────────────────────
  let newTraineeId
  try {
    await sequelize.transaction(async t => {
      const newUser = await User.create({
        firstName,
        lastName,
        email: rawEmail,
        passwordHash,
        role:   'trainee',
        status: 'active',
        theme:  'light'
      }, { transaction: t })

      const newTrainee = await Trainee.create({
        userId:          newUser.id,
        trainerId:       targetTrainer.id,
        experienceLevel: rawLevel,
        weeklyWorkouts,
        status: rawStatus,
        notes
      }, { transaction: t })

      newTraineeId = newTrainee.id
    })
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      throw fail(409, 'DUPLICATE_EMAIL', 'An account with this email already exists.', {})
    }
    throw err
  }

  const created = await Trainee.findByPk(newTraineeId, { include: traineeIncludes() })
  res.status(201).json({ success: true, data: serializeTrainee(created), error: null })
}

// ── PUT /api/trainees/:id ─────────────────────────────────────────────────────

async function update(req, res) {
  const body = safeBody(req)

  const trainee = await Trainee.findByPk(req.parsedId, { include: traineeIncludes() })
  if (!trainee) throw fail(404, 'TRAINEE_NOT_FOUND', `Trainee with id ${req.parsedId} not found.`, { id: req.parsedId })

  if (req.user.role === 'trainer') {
    const trainerProfile = await resolveAuthTrainer(req.user.id)
    assertOwnership(trainee, trainerProfile)
  }

  const userUpdate    = {}
  const traineeUpdate = {}

  if (body.firstName !== undefined) {
    const v = String(body.firstName).trim()
    if (!v) throw fail(400, 'VALIDATION_ERROR', 'firstName cannot be empty.', { field: 'firstName' })
    userUpdate.firstName = v
  }

  if (body.lastName !== undefined) {
    const v = String(body.lastName).trim()
    if (!v) throw fail(400, 'VALIDATION_ERROR', 'lastName cannot be empty.', { field: 'lastName' })
    userUpdate.lastName = v
  }

  if (body.displayName !== undefined) {
    userUpdate.displayName = body.displayName ? String(body.displayName).trim() : null
  }

  if (body.email !== undefined) {
    const email = String(body.email).trim().toLowerCase()
    if (!EMAIL_REGEX.test(email)) throw fail(400, 'VALIDATION_ERROR', 'email must be a valid email address.', { field: 'email' })
    if (email !== trainee.user.email) {
      const dup = await User.findOne({ where: { email, id: { [Op.ne]: trainee.userId } } })
      if (dup) throw fail(409, 'DUPLICATE_EMAIL', 'An account with this email already exists.', {})
    }
    userUpdate.email = email
  }

  if (body.experienceLevel !== undefined) {
    const v = String(body.experienceLevel).trim().toLowerCase()
    if (!VALID_EXPERIENCE_LEVELS.includes(v)) {
      throw fail(400, 'VALIDATION_ERROR', `experienceLevel must be one of: ${VALID_EXPERIENCE_LEVELS.join(', ')}.`, { field: 'experienceLevel' })
    }
    traineeUpdate.experienceLevel = v
  }

  if (body.weeklyWorkouts !== undefined) {
    const ww = parseWeeklyWorkouts(body.weeklyWorkouts)
    if (ww === null) throw fail(400, 'VALIDATION_ERROR', 'weeklyWorkouts must be a positive integer (1–255).', { field: 'weeklyWorkouts' })
    traineeUpdate.weeklyWorkouts = ww
  }

  if (body.status !== undefined) {
    const st = String(body.status).trim().toLowerCase()
    if (!VALID_TRAINING_STATUS.includes(st)) {
      throw fail(400, 'VALIDATION_ERROR', `status must be one of: ${VALID_TRAINING_STATUS.join(', ')}.`, { field: 'status' })
    }
    traineeUpdate.status = st
  }

  if (body.notes !== undefined) {
    traineeUpdate.notes = body.notes ? String(body.notes).trim() : null
  }

  const hasUserUpdates    = Object.keys(userUpdate).length > 0
  const hasTraineeUpdates = Object.keys(traineeUpdate).length > 0

  if (!hasUserUpdates && !hasTraineeUpdates) {
    throw fail(400, 'VALIDATION_ERROR', 'No updatable fields were provided.', {})
  }

  await sequelize.transaction(async t => {
    if (hasUserUpdates)    await User.update(userUpdate,    { where: { id: trainee.userId }, transaction: t })
    if (hasTraineeUpdates) await Trainee.update(traineeUpdate, { where: { id: trainee.id }, transaction: t })
  })

  const refreshed = await Trainee.findByPk(trainee.id, { include: traineeIncludes() })
  res.json({ success: true, data: serializeTrainee(refreshed), error: null })
}

// ── PATCH /api/trainees/:id/status ───────────────────────────────────────────

async function updateStatus(req, res) {
  const body = safeBody(req)

  const rawStatus = body.status ? String(body.status).trim().toLowerCase() : ''
  if (!rawStatus) throw fail(400, 'VALIDATION_ERROR', 'status is required.', { field: 'status' })
  if (!VALID_TRAINING_STATUS.includes(rawStatus)) {
    throw fail(400, 'VALIDATION_ERROR', `status must be one of: ${VALID_TRAINING_STATUS.join(', ')}.`, { field: 'status', allowed: VALID_TRAINING_STATUS })
  }

  const trainee = await Trainee.findByPk(req.parsedId)
  if (!trainee) throw fail(404, 'TRAINEE_NOT_FOUND', `Trainee with id ${req.parsedId} not found.`, { id: req.parsedId })

  if (req.user.role === 'trainer') {
    const trainerProfile = await resolveAuthTrainer(req.user.id)
    assertOwnership(trainee, trainerProfile)
  }

  // Updates ONLY Trainee.status — User.status is never touched here
  const previousStatus = trainee.status
  await Trainee.update({ status: rawStatus }, { where: { id: trainee.id } })

  // Only notify on actual status change, before sending the response
  if (rawStatus !== previousStatus) {
    await tryCreateAndEmitNotification({
      type:            NOTIFICATION_TYPES.TRAINEE_STATUS_CHANGED,
      recipientUserId: trainee.userId,
      actorUserId:     req.user.id,
      title:           'Training Status Updated',
      message:         `Your training status has been updated to "${rawStatus}".`,
      metadata:        { traineeId: trainee.id, link: '/trainee/dashboard' }
    })
  }

  const refreshed = await Trainee.findByPk(trainee.id, { include: traineeIncludes() })
  res.json({ success: true, data: serializeTrainee(refreshed), error: null })
}

// ── PATCH /api/trainees/:id/trainer ──────────────────────────────────────────

async function reassignTrainer(req, res) {
  const body = safeBody(req)

  const trainerId = parsePositiveInt(body.trainerId)
  if (!trainerId) {
    throw fail(400, 'VALIDATION_ERROR', 'trainerId is required and must be a positive integer.', { field: 'trainerId' })
  }

  const trainee = await Trainee.findByPk(req.parsedId)
  if (!trainee) throw fail(404, 'TRAINEE_NOT_FOUND', `Trainee with id ${req.parsedId} not found.`, { id: req.parsedId })

  const targetTrainer = await Trainer.findByPk(trainerId, {
    include: [{ model: User, as: 'user', attributes: ['id', 'status'] }]
  })
  if (!targetTrainer) throw fail(404, 'TRAINER_NOT_FOUND', `Trainer with id ${trainerId} not found.`, { trainerId })
  if (targetTrainer.user.status !== 'active') {
    throw fail(400, 'TRAINER_INACTIVE', 'Cannot assign a trainee to an inactive trainer.', { trainerId })
  }

  const previousTrainerId = trainee.trainerId
  await Trainee.update({ trainerId }, { where: { id: trainee.id } })

  // Only notify on actual trainer change, before sending the response
  if (trainerId !== previousTrainerId) {
    await tryCreateAndEmitNotification({
      type:            NOTIFICATION_TYPES.TRAINER_ASSIGNMENT_CHANGED,
      recipientUserId: trainee.userId,
      actorUserId:     req.user.id,
      title:           'Trainer Reassigned',
      message:         'You have been assigned to a new trainer.',
      metadata:        { traineeId: trainee.id, link: '/trainee/dashboard' }
    })
  }

  const refreshed = await Trainee.findByPk(trainee.id, { include: traineeIncludes() })
  res.json({ success: true, data: serializeTrainee(refreshed), error: null })
}

// ── DELETE /api/trainees/:id ──────────────────────────────────────────────────

async function remove(req, res) {
  const trainee = await Trainee.findByPk(req.parsedId, {
    include: [{ model: User, as: 'user', attributes: ['id'] }]
  })
  if (!trainee) throw fail(404, 'TRAINEE_NOT_FOUND', `Trainee with id ${req.parsedId} not found.`, { id: req.parsedId })

  const traineeId = trainee.id
  const userId    = trainee.userId

  // Deleting the User cascades: Trainee row → TraineeGoal rows
  await sequelize.transaction(async t => {
    await User.destroy({ where: { id: userId }, transaction: t })
  })

  res.json({ success: true, data: { id: traineeId, userId }, error: null })
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  getAll:          wrap(getAll),
  getMe:           wrap(getMe),
  getById:         wrap(getById),
  create:          wrap(create),
  update:          wrap(update),
  updateStatus:    wrap(updateStatus),
  reassignTrainer: wrap(reassignTrainer),
  remove:          wrap(remove)
}
