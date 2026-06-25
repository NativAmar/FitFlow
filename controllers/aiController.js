'use strict'

const { Trainee }                 = require('../models/index')
const { findTrainerByUserId }     = require('../services/traineeService')
const { generateProgressSummary } = require('../services/progressSummaryService')
const {
  isValidDateOnly,
  isMondayString,
  currentWeekMonday
} = require('../services/workoutTrackingService')

// ── Helpers (local copies matching existing controller convention) ─────────────

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
  const e     = new Error(message)
  e.status    = status
  e.code      = code
  e.details   = details || {}
  return e
}

function safeBody(req) {
  const b = req.body
  return b && typeof b === 'object' && !Array.isArray(b) ? b : {}
}

// ── Test-header extraction (guarded by NODE_ENV + ALLOW_TEST_HEADERS) ─────────

function getTestBehavior(req) {
  if (process.env.NODE_ENV !== 'test' || process.env.ALLOW_TEST_HEADERS !== '1') return null
  const h     = req.headers['x-test-gemini']
  const valid = new Set([
    'valid', 'provider-error', 'json-error',
    'missing-field', 'wrong-type', 'array-overflow'
  ])
  return valid.has(h) ? h : null
}

// ── Request body parsing and validation ───────────────────────────────────────

function parseBody(body) {
  // ── endWeekStart ────────────────────────────────────────────────────────────
  let endWeekStart
  if (body.endWeekStart !== undefined) {
    const s = String(body.endWeekStart).trim()
    if (!isValidDateOnly(s)) {
      throw fail(400, 'VALIDATION_ERROR',
        'endWeekStart must be a valid YYYY-MM-DD date.',
        { field: 'endWeekStart' })
    }
    if (!isMondayString(s)) {
      throw fail(400, 'VALIDATION_ERROR',
        'endWeekStart must be a Monday.',
        { field: 'endWeekStart', provided: s })
    }
    if (s > currentWeekMonday()) {
      throw fail(400, 'VALIDATION_ERROR',
        'endWeekStart must not be later than the current Monday.',
        { field: 'endWeekStart', provided: s })
    }
    endWeekStart = s
  } else {
    endWeekStart = currentWeekMonday()
  }

  // ── weeks ────────────────────────────────────────────────────────────────────
  // No parseInt coercion: strings like "4" or "4abc" are rejected.
  let weeks = 4
  if (body.weeks !== undefined) {
    if (
      typeof body.weeks !== 'number' ||
      !Number.isInteger(body.weeks) ||
      body.weeks < 1 ||
      body.weeks > 8
    ) {
      throw fail(400, 'VALIDATION_ERROR',
        'weeks must be an integer from 1 to 8.',
        { field: 'weeks' })
    }
    weeks = body.weeks
  }

  return { endWeekStart, weeks }
}

// ── Controller ────────────────────────────────────────────────────────────────

async function progressSummary(req, res) {
  const body                     = safeBody(req)
  const { endWeekStart, weeks }  = parseBody(body)

  // Load and verify the trainee exists
  const trainee = await Trainee.findByPk(req.parsedId)
  if (!trainee) {
    throw fail(404, 'NOT_FOUND',
      `Trainee with id ${req.parsedId} not found.`,
      { id: req.parsedId })
  }

  // Ownership check for trainer role
  // (Trainee role is blocked upstream by requireRole; admin has no ownership requirement)
  if (req.user.role === 'trainer') {
    const trainerProfile = await findTrainerByUserId(req.user.id)
    if (!trainerProfile) {
      throw fail(403, 'FORBIDDEN', 'Trainer profile not found for this account.', {})
    }
    if (trainee.trainerId !== trainerProfile.id) {
      throw fail(403, 'FORBIDDEN',
        'You do not have permission to access this trainee.',
        {})
    }
  }

  const testBehavior = getTestBehavior(req)
  const result       = await generateProgressSummary(trainee, endWeekStart, weeks, testBehavior)

  res.json({ success: true, data: result, error: null })
}

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  progressSummary: wrap(progressSummary)
}
