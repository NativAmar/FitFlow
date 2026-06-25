'use strict'

const bcrypt   = require('bcryptjs')
const { Op }   = require('sequelize')
const { sequelize, User, Trainer } = require('../models/index')
const { trainerIncludes, serializeTrainer } = require('../services/trainerService')

// ── Constants ─────────────────────────────────────────────────────────────────

const VALID_ACCOUNT_STATUS = ['active', 'inactive']
const EMAIL_REGEX          = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

// ── GET /api/trainers ─────────────────────────────────────────────────────────

async function getAll(req, res) {
  const trainers = await Trainer.findAll({
    include: trainerIncludes(),
    order: [['id', 'ASC']]
  })
  res.json({ success: true, data: trainers.map(serializeTrainer), error: null })
}

// ── GET /api/trainers/me ──────────────────────────────────────────────────────

async function getMe(req, res) {
  const trainer = await Trainer.findOne({
    where: { userId: req.user.id },
    include: trainerIncludes()
  })
  if (!trainer) {
    throw fail(404, 'TRAINER_NOT_FOUND', 'Trainer profile not found for this account.', {})
  }
  res.json({ success: true, data: serializeTrainer(trainer), error: null })
}

// ── GET /api/trainers/:id ─────────────────────────────────────────────────────

async function getById(req, res) {
  const trainer = await Trainer.findByPk(req.parsedId, { include: trainerIncludes() })
  if (!trainer) {
    throw fail(404, 'TRAINER_NOT_FOUND', `Trainer with id ${req.parsedId} not found.`, { id: req.parsedId })
  }
  res.json({ success: true, data: serializeTrainer(trainer), error: null })
}

// ── POST /api/trainers ────────────────────────────────────────────────────────

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

  if (errors.length > 0) throw fail(400, 'VALIDATION_ERROR', 'Validation failed', { fields: errors })

  // Optional fields — protected fields (role, userId, status) are silently ignored
  const displayName     = body.displayName     ? String(body.displayName).trim()     : null
  const specialization  = body.specialization  ? String(body.specialization).trim()  : null

  // ── Email uniqueness check ────────────────────────────────────────────────
  const existing = await User.findOne({ where: { email: rawEmail } })
  if (existing) throw fail(409, 'DUPLICATE_EMAIL', 'An account with this email already exists.', {})

  // ── Hash password ─────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(rawPassword, 10)

  // ── Transaction: create User + Trainer ───────────────────────────────────
  let newTrainerId
  try {
    await sequelize.transaction(async t => {
      const newUser = await User.create({
        firstName,
        lastName,
        email: rawEmail,
        passwordHash,
        role:        'trainer',
        status:      'active',
        theme:       'light',
        displayName
      }, { transaction: t })

      const newTrainer = await Trainer.create({
        userId:        newUser.id,
        specialization
      }, { transaction: t })

      newTrainerId = newTrainer.id
    })
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      throw fail(409, 'DUPLICATE_EMAIL', 'An account with this email already exists.', {})
    }
    throw err
  }

  const created = await Trainer.findByPk(newTrainerId, { include: trainerIncludes() })
  res.status(201).json({ success: true, data: serializeTrainer(created), error: null })
}

// ── PUT /api/trainers/:id ─────────────────────────────────────────────────────

async function update(req, res) {
  const body = safeBody(req)

  const trainer = await Trainer.findByPk(req.parsedId, { include: trainerIncludes() })
  if (!trainer) {
    throw fail(404, 'TRAINER_NOT_FOUND', `Trainer with id ${req.parsedId} not found.`, { id: req.parsedId })
  }

  const userUpdate    = {}
  const trainerUpdate = {}

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
    if (email !== trainer.user.email) {
      const dup = await User.findOne({ where: { email, id: { [Op.ne]: trainer.userId } } })
      if (dup) throw fail(409, 'DUPLICATE_EMAIL', 'An account with this email already exists.', {})
    }
    userUpdate.email = email
  }

  if (body.specialization !== undefined) {
    trainerUpdate.specialization = body.specialization ? String(body.specialization).trim() : null
  }

  // Protected fields (role, userId, status, password, trainee assignments) are
  // silently ignored — PUT is restricted to identity and profile fields only.

  const hasUserUpdates    = Object.keys(userUpdate).length > 0
  const hasTrainerUpdates = Object.keys(trainerUpdate).length > 0

  if (!hasUserUpdates && !hasTrainerUpdates) {
    throw fail(400, 'VALIDATION_ERROR', 'No updatable fields were provided.', {})
  }

  await sequelize.transaction(async t => {
    if (hasUserUpdates)    await User.update(userUpdate,    { where: { id: trainer.userId }, transaction: t })
    if (hasTrainerUpdates) await Trainer.update(trainerUpdate, { where: { id: trainer.id },  transaction: t })
  })

  const refreshed = await Trainer.findByPk(trainer.id, { include: trainerIncludes() })
  res.json({ success: true, data: serializeTrainer(refreshed), error: null })
}

// ── PATCH /api/trainers/:id/status ───────────────────────────────────────────

async function updateStatus(req, res) {
  const body = safeBody(req)

  const rawStatus = body.status ? String(body.status).trim().toLowerCase() : ''
  if (!rawStatus) {
    throw fail(400, 'VALIDATION_ERROR', 'status is required.', { field: 'status' })
  }
  if (!VALID_ACCOUNT_STATUS.includes(rawStatus)) {
    throw fail(400, 'VALIDATION_ERROR',
      `status must be one of: ${VALID_ACCOUNT_STATUS.join(', ')}.`,
      { field: 'status', allowed: VALID_ACCOUNT_STATUS })
  }

  const trainer = await Trainer.findByPk(req.parsedId)
  if (!trainer) {
    throw fail(404, 'TRAINER_NOT_FOUND', `Trainer with id ${req.parsedId} not found.`, { id: req.parsedId })
  }

  // Update ONLY User.status — Trainer fields and Trainee assignments are untouched
  await User.update({ status: rawStatus }, { where: { id: trainer.userId } })

  const refreshed = await Trainer.findByPk(trainer.id, { include: trainerIncludes() })
  res.json({ success: true, data: serializeTrainer(refreshed), error: null })
}

// ── DELETE /api/trainers/:id — intentionally blocked ─────────────────────────

function remove(req, res) {
  res.status(405).json({
    success: false,
    data:    null,
    error: {
      code:    'METHOD_NOT_ALLOWED',
      message: 'Trainer accounts cannot be deleted. Use PATCH /api/trainers/:id/status to deactivate.',
      details: {}
    }
  })
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  getAll:       wrap(getAll),
  getMe:        wrap(getMe),
  getById:      wrap(getById),
  create:       wrap(create),
  update:       wrap(update),
  updateStatus: wrap(updateStatus),
  remove
}
