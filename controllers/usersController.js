'use strict'

const bcrypt = require('bcryptjs')
const { Op }  = require('sequelize')
const { sequelize, User, Admin, Trainer, Trainee } = require('../models/index')
const { userIncludes, serializeUser } = require('../services/userService')

// ── Constants ──────────────────────────────────────────────────────────────────

const VALID_ROLES             = ['admin', 'trainer', 'trainee']
const VALID_THEMES            = ['light', 'dark', 'system']
const VALID_EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced']
const VALID_TRAINING_STATUS   = ['active', 'paused', 'completed']
const EMAIL_REGEX             = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ── Helpers ────────────────────────────────────────────────────────────────────

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

const USER_ATTRS = { exclude: ['passwordHash'] }

// ── GET /api/users ─────────────────────────────────────────────────────────────

async function getAll(req, res) {
  const users = await User.findAll({
    attributes: USER_ATTRS,
    include: userIncludes(),
    order: [['id', 'ASC']]
  })
  res.json({ success: true, data: users.map(serializeUser), error: null })
}

// ── GET /api/users/:id ─────────────────────────────────────────────────────────

async function getById(req, res) {
  const user = await User.findByPk(req.parsedId, {
    attributes: USER_ATTRS,
    include: userIncludes()
  })
  if (!user) {
    throw fail(404, 'USER_NOT_FOUND', `User with id ${req.parsedId} not found.`, { id: req.parsedId })
  }
  res.json({ success: true, data: serializeUser(user), error: null })
}

// ── POST /api/users ────────────────────────────────────────────────────────────

async function create(req, res) {
  const body   = safeBody(req)
  const errors = []

  // ── Required common fields ───────────────────────────────────────────────────
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

  const rawPassword = body.password !== undefined && body.password !== null
    ? String(body.password) : ''
  if (!rawPassword) {
    errors.push({ field: 'password', message: 'password is required' })
  } else if (rawPassword.length < 6) {
    errors.push({ field: 'password', message: 'password must be at least 6 characters' })
  }

  const role = body.role ? String(body.role).trim().toLowerCase() : ''
  if (!role) {
    errors.push({ field: 'role', message: 'role is required' })
  } else if (!VALID_ROLES.includes(role)) {
    errors.push({ field: 'role', message: `role must be one of: ${VALID_ROLES.join(', ')}` })
  }

  let theme = 'light'
  if (body.theme !== undefined) {
    const t = String(body.theme).trim().toLowerCase()
    if (!VALID_THEMES.includes(t)) {
      errors.push({ field: 'theme', message: `theme must be one of: ${VALID_THEMES.join(', ')}` })
    } else {
      theme = t
    }
  }

  // ── Role-specific validation (skip if role already failed) ──────────────────
  let traineeTrainerId, traineeExpLevel, traineeWeeklyWorkouts, traineeTrainingStatus, traineeNotes
  let trainerSpecialization

  const roleIsValid = role && VALID_ROLES.includes(role)

  if (roleIsValid && role === 'trainee') {
    traineeTrainerId = parsePositiveInt(body.trainerId)
    if (!traineeTrainerId) {
      errors.push({ field: 'trainerId', message: 'trainerId is required and must be a positive integer' })
    }

    const rawLevel = body.experienceLevel ? String(body.experienceLevel).trim().toLowerCase() : ''
    if (!rawLevel) {
      errors.push({ field: 'experienceLevel', message: 'experienceLevel is required' })
    } else if (!VALID_EXPERIENCE_LEVELS.includes(rawLevel)) {
      errors.push({ field: 'experienceLevel', message: `experienceLevel must be one of: ${VALID_EXPERIENCE_LEVELS.join(', ')}` })
    } else {
      traineeExpLevel = rawLevel
    }

    if (body.weeklyWorkouts === undefined || body.weeklyWorkouts === null || body.weeklyWorkouts === '') {
      errors.push({ field: 'weeklyWorkouts', message: 'weeklyWorkouts is required' })
    } else {
      traineeWeeklyWorkouts = parseWeeklyWorkouts(body.weeklyWorkouts)
      if (traineeWeeklyWorkouts === null) {
        errors.push({ field: 'weeklyWorkouts', message: 'weeklyWorkouts must be a positive integer (1–255)' })
      }
    }

    const rawStatus = body.trainingStatus ? String(body.trainingStatus).trim().toLowerCase() : 'active'
    if (!VALID_TRAINING_STATUS.includes(rawStatus)) {
      errors.push({ field: 'trainingStatus', message: `trainingStatus must be one of: ${VALID_TRAINING_STATUS.join(', ')}` })
    } else {
      traineeTrainingStatus = rawStatus
    }

    traineeNotes = body.notes ? String(body.notes).trim() : null
  }

  if (roleIsValid && role === 'trainer') {
    trainerSpecialization = body.specialization ? String(body.specialization).trim() : null
  }

  if (errors.length > 0) throw fail(400, 'VALIDATION_ERROR', 'Validation failed', { fields: errors })

  // ── Email uniqueness ─────────────────────────────────────────────────────────
  const existing = await User.findOne({ where: { email: rawEmail } })
  if (existing) throw fail(409, 'DUPLICATE_EMAIL', 'An account with this email already exists.', {})

  // ── Trainer existence and status (trainee only) ──────────────────────────────
  if (role === 'trainee') {
    const targetTrainer = await Trainer.findByPk(traineeTrainerId, {
      include: [{ model: User, as: 'user', attributes: ['id', 'status'] }]
    })
    if (!targetTrainer) {
      throw fail(404, 'TRAINER_NOT_FOUND', `Trainer with id ${traineeTrainerId} not found.`, { trainerId: traineeTrainerId })
    }
    if (targetTrainer.user.status !== 'active') {
      throw fail(400, 'TRAINER_INACTIVE', 'Cannot assign a trainee to an inactive trainer.', { trainerId: traineeTrainerId })
    }
  }

  const passwordHash = await bcrypt.hash(rawPassword, 10)
  const displayName  = body.displayName ? String(body.displayName).trim() : null

  // ── Transaction: create User + role profile ──────────────────────────────────
  let newUserId
  try {
    await sequelize.transaction(async t => {
      const newUser = await User.create({
        firstName, lastName, email: rawEmail, passwordHash,
        role, status: 'active', theme, displayName
      }, { transaction: t })

      newUserId = newUser.id

      if (role === 'admin') {
        await Admin.create({ userId: newUser.id }, { transaction: t })
      } else if (role === 'trainer') {
        await Trainer.create({ userId: newUser.id, specialization: trainerSpecialization }, { transaction: t })
      } else if (role === 'trainee') {
        await Trainee.create({
          userId:          newUser.id,
          trainerId:       traineeTrainerId,
          experienceLevel: traineeExpLevel,
          weeklyWorkouts:  traineeWeeklyWorkouts,
          status:          traineeTrainingStatus,
          notes:           traineeNotes
        }, { transaction: t })
      }
    })
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      throw fail(409, 'DUPLICATE_EMAIL', 'An account with this email already exists.', {})
    }
    throw err
  }

  const created = await User.findByPk(newUserId, { attributes: USER_ATTRS, include: userIncludes() })
  res.status(201).json({ success: true, data: serializeUser(created), error: null })
}

// ── PUT /api/users/:id ─────────────────────────────────────────────────────────

async function update(req, res) {
  const body = safeBody(req)

  const user = await User.findByPk(req.parsedId, { attributes: USER_ATTRS, include: userIncludes() })
  if (!user) {
    throw fail(404, 'USER_NOT_FOUND', `User with id ${req.parsedId} not found.`, { id: req.parsedId })
  }

  const userUpdate    = {}
  const profileUpdate = {}

  // ── Common User fields ────────────────────────────────────────────────────────
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
    if (!EMAIL_REGEX.test(email)) {
      throw fail(400, 'VALIDATION_ERROR', 'email must be a valid email address.', { field: 'email' })
    }
    if (email !== user.email) {
      const dup = await User.findOne({ where: { email, id: { [Op.ne]: user.id } } })
      if (dup) throw fail(409, 'DUPLICATE_EMAIL', 'An account with this email already exists.', {})
    }
    userUpdate.email = email
  }
  if (body.theme !== undefined) {
    const v = String(body.theme).trim().toLowerCase()
    if (!VALID_THEMES.includes(v)) {
      throw fail(400, 'VALIDATION_ERROR', `theme must be one of: ${VALID_THEMES.join(', ')}.`, { field: 'theme' })
    }
    userUpdate.theme = v
  }

  // ── Role-profile fields ───────────────────────────────────────────────────────
  // role, status, password, trainerId, trainingStatus, userId are protected — silently ignored
  const role = user.role
  if (role === 'trainer') {
    if (body.specialization !== undefined) {
      profileUpdate.specialization = body.specialization ? String(body.specialization).trim() : null
    }
  } else if (role === 'trainee') {
    if (body.experienceLevel !== undefined) {
      const v = String(body.experienceLevel).trim().toLowerCase()
      if (!VALID_EXPERIENCE_LEVELS.includes(v)) {
        throw fail(400, 'VALIDATION_ERROR', `experienceLevel must be one of: ${VALID_EXPERIENCE_LEVELS.join(', ')}.`, { field: 'experienceLevel' })
      }
      profileUpdate.experienceLevel = v
    }
    if (body.weeklyWorkouts !== undefined) {
      const ww = parseWeeklyWorkouts(body.weeklyWorkouts)
      if (ww === null) throw fail(400, 'VALIDATION_ERROR', 'weeklyWorkouts must be a positive integer (1–255).', { field: 'weeklyWorkouts' })
      profileUpdate.weeklyWorkouts = ww
    }
    if (body.notes !== undefined) {
      profileUpdate.notes = body.notes ? String(body.notes).trim() : null
    }
  }

  const hasUserUpdates    = Object.keys(userUpdate).length > 0
  const hasProfileUpdates = Object.keys(profileUpdate).length > 0

  if (!hasUserUpdates && !hasProfileUpdates) {
    throw fail(400, 'VALIDATION_ERROR', 'No updatable fields were provided.', {})
  }

  await sequelize.transaction(async t => {
    if (hasUserUpdates) {
      await User.update(userUpdate, { where: { id: user.id }, transaction: t })
    }
    if (hasProfileUpdates) {
      if (role === 'trainer') {
        await Trainer.update(profileUpdate, { where: { userId: user.id }, transaction: t })
      } else if (role === 'trainee') {
        await Trainee.update(profileUpdate, { where: { userId: user.id }, transaction: t })
      }
    }
  })

  const refreshed = await User.findByPk(user.id, { attributes: USER_ATTRS, include: userIncludes() })
  res.json({ success: true, data: serializeUser(refreshed), error: null })
}

// ── DELETE /api/users/:id ──────────────────────────────────────────────────────

async function remove(req, res) {
  const user = await User.findByPk(req.parsedId, { attributes: USER_ATTRS, include: userIncludes() })
  if (!user) {
    throw fail(404, 'USER_NOT_FOUND', `User with id ${req.parsedId} not found.`, { id: req.parsedId })
  }

  const role = user.role

  // Trainer accounts may not be hard-deleted
  if (role === 'trainer') {
    const trainerProfileId = user.trainerProfile ? user.trainerProfile.id : null
    throw fail(409, 'TRAINER_DELETION_RESTRICTED',
      'Trainer accounts cannot be deleted. Use PATCH /api/trainers/:trainerId/status to deactivate.',
      { trainerId: trainerProfileId })
  }

  // Admin deletion guards
  if (role === 'admin') {
    if (req.user.id === req.parsedId) {
      throw fail(409, 'CANNOT_DELETE_SELF', 'You cannot delete your own admin account.', {})
    }
    // Only count active admins; prevents deleting the last one standing
    if (user.status === 'active') {
      const activeAdminCount = await User.count({ where: { role: 'admin', status: 'active' } })
      if (activeAdminCount <= 1) {
        throw fail(409, 'LAST_ADMIN_REQUIRED', 'Cannot delete the last active admin account.', {})
      }
    }
  }

  // Snapshot before destroy (can't read after)
  const snapshot = serializeUser(user)

  // For trainee: User.destroy cascades to Trainee → TraineeGoal (FK onDelete CASCADE)
  // For admin:   User.destroy cascades to Admin (FK onDelete CASCADE)
  await sequelize.transaction(async t => {
    await User.destroy({ where: { id: user.id }, transaction: t })
  })

  res.json({ success: true, data: snapshot, error: null })
}

// ── Exports ────────────────────────────────────────────────────────────────────

module.exports = {
  getAll:  wrap(getAll),
  getById: wrap(getById),
  create:  wrap(create),
  update:  wrap(update),
  remove:  wrap(remove)
}
