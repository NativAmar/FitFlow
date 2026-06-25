'use strict'

const express               = require('express')
const exercisesController   = require('../controllers/exercisesController')
const requireAuth           = require('../middleware/requireAuth')
const requireRole           = require('../middleware/requireRole')
const validateId            = require('../middleware/validateId')

const router = express.Router()

// GET /api/exercises — admin and trainer only (trainee excluded)
router.get('/',
  requireAuth,
  requireRole('admin', 'trainer'),
  exercisesController.getAll
)

// GET /api/exercises/:id — admin and trainer only
router.get('/:id',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  exercisesController.getById
)

// POST /api/exercises — admin and trainer only
router.post('/',
  requireAuth,
  requireRole('admin', 'trainer'),
  exercisesController.create
)

// PUT /api/exercises/:id — admin and trainer only
router.put('/:id',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  exercisesController.update
)

// DELETE /api/exercises/:id — admin and trainer only
router.delete('/:id',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  exercisesController.remove
)

module.exports = router
