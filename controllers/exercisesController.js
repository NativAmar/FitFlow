'use strict'

const { Op } = require('sequelize')
const { Exercise, MuscleGroup, Trainer, User, WorkoutSessionExercise } = require('../models/index')
const { serializeExercise, findTrainerByUserId } = require('../services/exerciseService')

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

// Standard include for exercise queries: loads muscleGroup + optional trainer user
function exerciseIncludes(includeTrainer = false) {
  const incs = [
    { model: MuscleGroup, as: 'muscleGroup' }
  ]
  if (includeTrainer) {
    incs.push({
      model: Trainer,
      as: 'trainer',
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'displayName'] }]
    })
  }
  return incs
}

/**
 * Resolve the effective trainerId for a request:
 * - Trainer role: always their own trainer profile id (body.trainerId is ignored)
 * - Admin role: uses body.trainerId (required for create; ignored for updates)
 * Returns the trainer profile (Trainer instance) so callers can validate it.
 */
async function resolveTrainerForCreate(reqUser, body) {
  if (reqUser.role === 'trainer') {
    const profile = await findTrainerByUserId(reqUser.id)
    if (!profile) {
      throw fail(403, 'FORBIDDEN', 'Trainer profile not found for this account.', {})
    }
    return profile
  }

  // Admin: trainerId is required in body
  const rawId = body.trainerId
  const trainerId = typeof rawId === 'number' ? rawId : parseInt(String(rawId ?? ''), 10)
  if (!Number.isInteger(trainerId) || trainerId < 1) {
    throw fail(400, 'VALIDATION_ERROR', 'trainerId is required and must be a positive integer.', { field: 'trainerId' })
  }

  const profile = await Trainer.findByPk(trainerId)
  if (!profile) {
    throw fail(404, 'TRAINER_NOT_FOUND', `Trainer with id ${trainerId} not found.`, { trainerId })
  }
  return profile
}

/**
 * Fetch an Exercise by id and enforce ownership for trainer role.
 */
async function resolveExerciseAndCheckOwnership(exerciseId, reqUser) {
  const exercise = await Exercise.findByPk(exerciseId, {
    include: exerciseIncludes(reqUser.role === 'admin')
  })
  if (!exercise) {
    throw fail(404, 'EXERCISE_NOT_FOUND', `Exercise with id ${exerciseId} not found.`, { id: exerciseId })
  }

  if (reqUser.role === 'trainer') {
    const profile = await findTrainerByUserId(reqUser.id)
    if (!profile || exercise.trainerId !== profile.id) {
      throw fail(403, 'FORBIDDEN', 'You do not have permission to access this exercise.', {})
    }
    // Attach muscleGroup for serialization (already included)
  }

  return exercise
}

// ── GET /api/exercises ────────────────────────────────────────────────────────

async function getAll(req, res) {
  const isAdmin   = req.user.role === 'admin'
  const isTrainer = req.user.role === 'trainer'

  const where = {}

  // Trainer always sees only their own exercises; trainerId param is ignored
  if (isTrainer) {
    const profile = await findTrainerByUserId(req.user.id)
    if (!profile) {
      return res.json({ success: true, data: [], error: null })
    }
    where.trainerId = profile.id
  } else if (isAdmin && req.query.trainerId) {
    // Admin may optionally filter by trainer
    const tid = parseInt(String(req.query.trainerId), 10)
    if (Number.isInteger(tid) && tid > 0) where.trainerId = tid
  }

  // Optional muscle-group filter (all roles)
  if (req.query.muscleGroupId) {
    const mgid = parseInt(String(req.query.muscleGroupId), 10)
    if (Number.isInteger(mgid) && mgid > 0) where.muscleGroupId = mgid
  }

  // Optional name search (case-insensitive via database collation)
  if (req.query.search) {
    const q = String(req.query.search).trim()
    if (q) where.name = { [Op.like]: `%${q}%` }
  }

  const exercises = await Exercise.findAll({
    where,
    include: exerciseIncludes(isAdmin),
    order: [['name', 'ASC']]
  })

  res.json({ success: true, data: exercises.map(serializeExercise), error: null })
}

// ── GET /api/exercises/:id ────────────────────────────────────────────────────

async function getById(req, res) {
  if (req.user.role === 'trainee') {
    throw fail(403, 'FORBIDDEN', 'You do not have permission to perform this action.', {})
  }
  const exercise = await resolveExerciseAndCheckOwnership(req.parsedId, req.user)
  res.json({ success: true, data: serializeExercise(exercise), error: null })
}

// ── POST /api/exercises ───────────────────────────────────────────────────────

async function create(req, res) {
  const body = safeBody(req)

  // Resolve trainer ownership
  const trainerProfile = await resolveTrainerForCreate(req.user, body)

  // Validate name
  const name = body.name ? String(body.name).trim() : ''
  if (!name) throw fail(400, 'VALIDATION_ERROR', 'name is required.', { field: 'name' })
  if (name.length > 150) throw fail(400, 'VALIDATION_ERROR', 'name must be 150 characters or fewer.', { field: 'name' })

  // Validate description
  const description = body.description ? String(body.description).trim() : ''
  if (!description) throw fail(400, 'VALIDATION_ERROR', 'description is required.', { field: 'description' })

  // Validate muscleGroupId
  const rawMgId = body.muscleGroupId
  const muscleGroupId = typeof rawMgId === 'number' ? rawMgId : parseInt(String(rawMgId ?? ''), 10)
  if (!Number.isInteger(muscleGroupId) || muscleGroupId < 1) {
    throw fail(400, 'VALIDATION_ERROR', 'muscleGroupId is required and must be a positive integer.', { field: 'muscleGroupId' })
  }

  const muscleGroup = await MuscleGroup.findByPk(muscleGroupId)
  if (!muscleGroup) {
    throw fail(404, 'MUSCLE_GROUP_NOT_FOUND', `Muscle group with id ${muscleGroupId} not found.`, { muscleGroupId })
  }

  // Duplicate name check within this trainer's catalog
  const existing = await Exercise.findOne({
    where: { trainerId: trainerProfile.id, name }
  })
  if (existing) {
    throw fail(409, 'DUPLICATE_EXERCISE',
      `An exercise named "${name}" already exists in your catalog.`,
      { name })
  }

  const exercise = await Exercise.create({
    trainerId:    trainerProfile.id,
    muscleGroupId,
    name,
    description
  })

  const created = await Exercise.findByPk(exercise.id, {
    include: exerciseIncludes(req.user.role === 'admin')
  })

  res.status(201).json({ success: true, data: serializeExercise(created), error: null })
}

// ── PUT /api/exercises/:id ────────────────────────────────────────────────────

async function update(req, res) {
  const body = safeBody(req)

  const exercise = await resolveExerciseAndCheckOwnership(req.parsedId, req.user)

  const updates = {}

  if (body.name !== undefined) {
    const name = String(body.name).trim()
    if (!name) throw fail(400, 'VALIDATION_ERROR', 'name cannot be empty.', { field: 'name' })
    if (name.length > 150) throw fail(400, 'VALIDATION_ERROR', 'name must be 150 characters or fewer.', { field: 'name' })

    if (name !== exercise.name) {
      const dup = await Exercise.findOne({
        where: { trainerId: exercise.trainerId, name, id: { [Op.ne]: exercise.id } }
      })
      if (dup) {
        throw fail(409, 'DUPLICATE_EXERCISE',
          `An exercise named "${name}" already exists in this trainer's catalog.`,
          { name })
      }
    }
    updates.name = name
  }

  if (body.description !== undefined) {
    const description = String(body.description).trim()
    if (!description) throw fail(400, 'VALIDATION_ERROR', 'description cannot be empty.', { field: 'description' })
    updates.description = description
  }

  if (body.muscleGroupId !== undefined) {
    const rawMgId = body.muscleGroupId
    const muscleGroupId = typeof rawMgId === 'number' ? rawMgId : parseInt(String(rawMgId ?? ''), 10)
    if (!Number.isInteger(muscleGroupId) || muscleGroupId < 1) {
      throw fail(400, 'VALIDATION_ERROR', 'muscleGroupId must be a positive integer.', { field: 'muscleGroupId' })
    }
    const mg = await MuscleGroup.findByPk(muscleGroupId)
    if (!mg) {
      throw fail(404, 'MUSCLE_GROUP_NOT_FOUND', `Muscle group with id ${muscleGroupId} not found.`, { muscleGroupId })
    }
    updates.muscleGroupId = muscleGroupId
  }

  if (Object.keys(updates).length === 0) {
    throw fail(400, 'VALIDATION_ERROR', 'No updatable fields were provided.', {})
  }

  await exercise.update(updates)

  const refreshed = await Exercise.findByPk(exercise.id, {
    include: exerciseIncludes(req.user.role === 'admin')
  })

  res.json({ success: true, data: serializeExercise(refreshed), error: null })
}

// ── DELETE /api/exercises/:id ─────────────────────────────────────────────────

async function remove(req, res) {
  const exercise = await resolveExerciseAndCheckOwnership(req.parsedId, req.user)

  const usageCount = await WorkoutSessionExercise.count({ where: { exerciseId: exercise.id } })
  if (usageCount > 0) {
    throw fail(409, 'EXERCISE_IN_USE',
      'This exercise is assigned to one or more workout sessions and cannot be deleted.',
      { exerciseId: exercise.id, usageCount })
  }

  const snapshot = { id: exercise.id }
  await exercise.destroy()
  res.json({ success: true, data: snapshot, error: null })
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  getAll:  wrap(getAll),
  getById: wrap(getById),
  create:  wrap(create),
  update:  wrap(update),
  remove:  wrap(remove)
}
