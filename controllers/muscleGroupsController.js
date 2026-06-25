'use strict'

const { MuscleGroup } = require('../models/index')
const { serializeMuscleGroup } = require('../services/exerciseService')

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

// GET /api/muscle-groups — any authenticated role
async function getAll(req, res) {
  const groups = await MuscleGroup.findAll({ order: [['name', 'ASC']] })
  res.json({ success: true, data: groups.map(serializeMuscleGroup), error: null })
}

module.exports = {
  getAll: wrap(getAll)
}
