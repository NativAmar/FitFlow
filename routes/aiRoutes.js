'use strict'

const express      = require('express')
const aiController = require('../controllers/aiController')
const requireAuth  = require('../middleware/requireAuth')
const requireRole  = require('../middleware/requireRole')
const validateId   = require('../middleware/validateId')

const router = express.Router()

// POST /api/ai/trainees/:id/progress-summary
// Allowed roles: admin (any trainee), trainer (owned trainee only).
// Trainee role is rejected by requireRole with 403 FORBIDDEN.
router.post(
  '/trainees/:id/progress-summary',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  aiController.progressSummary
)

module.exports = router
