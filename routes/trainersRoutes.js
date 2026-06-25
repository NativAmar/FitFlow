'use strict'

const express             = require('express')
const trainersController  = require('../controllers/trainersController')
const requireAuth         = require('../middleware/requireAuth')
const requireRole         = require('../middleware/requireRole')
const validateId          = require('../middleware/validateId')

const router = express.Router()

// GET /api/trainers/me — trainer only, registered before /:id so "me" is not parsed as an ID
router.get('/me',
  requireAuth,
  requireRole('trainer'),
  trainersController.getMe
)

// GET /api/trainers — admin only
router.get('/',
  requireAuth,
  requireRole('admin'),
  trainersController.getAll
)

// GET /api/trainers/:id — admin only
router.get('/:id',
  requireAuth,
  requireRole('admin'),
  validateId(),
  trainersController.getById
)

// POST /api/trainers — admin only
router.post('/',
  requireAuth,
  requireRole('admin'),
  trainersController.create
)

// PUT /api/trainers/:id — admin only
router.put('/:id',
  requireAuth,
  requireRole('admin'),
  validateId(),
  trainersController.update
)

// PATCH /api/trainers/:id/status — admin only
router.patch('/:id/status',
  requireAuth,
  requireRole('admin'),
  validateId(),
  trainersController.updateStatus
)

// DELETE /api/trainers/:id — intentionally blocked (405)
router.delete('/:id',
  requireAuth,
  requireRole('admin'),
  validateId(),
  trainersController.remove
)

module.exports = router
