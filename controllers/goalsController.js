'use strict'

const { Op } = require('sequelize')
const { Goal, TraineeGoal } = require('../models/index')
const { serializeGoal } = require('../services/goalService')

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

// GET /api/goals — any authenticated role
async function getAll(req, res) {
  const goals = await Goal.findAll({ order: [['name', 'ASC']] })
  res.json({ success: true, data: goals.map(serializeGoal), error: null })
}

// GET /api/goals/:id — any authenticated role
async function getById(req, res) {
  const goal = await Goal.findByPk(req.parsedId)
  if (!goal) {
    throw fail(404, 'GOAL_NOT_FOUND', `Goal with id ${req.parsedId} not found.`, { id: req.parsedId })
  }
  res.json({ success: true, data: serializeGoal(goal), error: null })
}

// POST /api/goals — admin only
async function create(req, res) {
  const body = safeBody(req)

  const name = body.name ? String(body.name).trim() : ''
  if (!name) throw fail(400, 'VALIDATION_ERROR', 'name is required.', { field: 'name' })
  if (name.length > 100) throw fail(400, 'VALIDATION_ERROR', 'name must be 100 characters or fewer.', { field: 'name' })

  const description = body.description ? String(body.description).trim() || null : null

  const existing = await Goal.findOne({ where: { name } })
  if (existing) throw fail(409, 'DUPLICATE_GOAL', `A goal named "${name}" already exists.`, { name })

  const goal = await Goal.create({ name, description })
  res.status(201).json({ success: true, data: serializeGoal(goal), error: null })
}

// PUT /api/goals/:id — admin only
async function update(req, res) {
  const body = safeBody(req)

  const goal = await Goal.findByPk(req.parsedId)
  if (!goal) {
    throw fail(404, 'GOAL_NOT_FOUND', `Goal with id ${req.parsedId} not found.`, { id: req.parsedId })
  }

  const updates = {}

  if (body.name !== undefined) {
    const name = String(body.name).trim()
    if (!name) throw fail(400, 'VALIDATION_ERROR', 'name cannot be empty.', { field: 'name' })
    if (name.length > 100) throw fail(400, 'VALIDATION_ERROR', 'name must be 100 characters or fewer.', { field: 'name' })

    if (name !== goal.name) {
      const dup = await Goal.findOne({ where: { name, id: { [Op.ne]: req.parsedId } } })
      if (dup) throw fail(409, 'DUPLICATE_GOAL', `A goal named "${name}" already exists.`, { name })
    }
    updates.name = name
  }

  if (body.description !== undefined) {
    updates.description = body.description ? String(body.description).trim() || null : null
  }

  if (Object.keys(updates).length === 0) {
    throw fail(400, 'VALIDATION_ERROR', 'No updatable fields were provided.', {})
  }

  await goal.update(updates)
  res.json({ success: true, data: serializeGoal(goal), error: null })
}

// DELETE /api/goals/:id — admin only
async function remove(req, res) {
  const goal = await Goal.findByPk(req.parsedId)
  if (!goal) {
    throw fail(404, 'GOAL_NOT_FOUND', `Goal with id ${req.parsedId} not found.`, { id: req.parsedId })
  }

  const assignmentCount = await TraineeGoal.count({ where: { goalId: req.parsedId } })
  if (assignmentCount > 0) {
    throw fail(409, 'GOAL_IN_USE',
      `This goal is assigned to ${assignmentCount} trainee(s) and cannot be deleted.`,
      { assignmentCount })
  }

  const snapshot = serializeGoal(goal)
  await goal.destroy()
  res.json({ success: true, data: snapshot, error: null })
}

module.exports = {
  getAll:  wrap(getAll),
  getById: wrap(getById),
  create:  wrap(create),
  update:  wrap(update),
  remove:  wrap(remove)
}
