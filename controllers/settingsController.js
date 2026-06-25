'use strict'

const { Op } = require('sequelize')
const { User } = require('../models/index')

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const VALID_THEMES = ['light', 'dark', 'system']
const DISPLAY_NAME_MAX = 200

function wrap(fn) {
  return function wrapped(req, res, next) {
    try {
      const out = fn(req, res, next)
      if (out != null && typeof out.then === 'function') {
        out.catch(next)
      }
    } catch (err) {
      next(err)
    }
  }
}

function fail(status, code, message, details) {
  const e = new Error(message)
  e.status = status
  e.code = code
  e.details = details || {}
  return e
}

function serializeSettings(user) {
  return {
    displayName: user.displayName || `${user.firstName} ${user.lastName}`,
    email:       user.email,
    theme:       user.theme,
    firstName:   user.firstName,
    lastName:    user.lastName,
    role:        user.role
  }
}

async function getSettings(req, res) {
  const user = await User.findByPk(req.user.id, {
    attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'theme', 'displayName', 'status']
  })

  if (!user) {
    throw fail(401, 'UNAUTHORIZED', 'Authentication is required.', {})
  }

  if (user.status === 'inactive') {
    throw fail(403, 'ACCOUNT_INACTIVE', 'This account has been deactivated.', {})
  }

  res.json({ success: true, data: serializeSettings(user), error: null })
}

async function updateSettings(req, res) {
  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const errors = []

  // displayName — optional; empty string stored as null
  let displayName = null
  if (body.displayName !== undefined && body.displayName !== null) {
    const trimmed = String(body.displayName).trim()
    if (trimmed.length > DISPLAY_NAME_MAX) {
      errors.push({
        field: 'displayName',
        message: `displayName must be at most ${DISPLAY_NAME_MAX} characters`
      })
    } else {
      displayName = trimmed || null
    }
  }

  // email — required
  const rawEmail = body.email === undefined || body.email === null ? '' : String(body.email).trim()
  if (!rawEmail) {
    errors.push({ field: 'email', message: 'email is required' })
  } else if (!EMAIL_REGEX.test(rawEmail)) {
    errors.push({ field: 'email', message: 'email must be a valid email address' })
  }

  // theme — required
  const rawTheme = body.theme === undefined || body.theme === null ? '' : String(body.theme).trim().toLowerCase()
  if (!rawTheme) {
    errors.push({ field: 'theme', message: 'theme is required' })
  } else if (!VALID_THEMES.includes(rawTheme)) {
    errors.push({
      field: 'theme',
      message: 'theme must be one of: light, dark, system',
      allowed: VALID_THEMES.slice()
    })
  }

  if (errors.length > 0) {
    throw fail(400, 'VALIDATION_ERROR', 'Validation failed', { fields: errors })
  }

  const email = rawEmail.toLowerCase()
  const theme = rawTheme

  // Email uniqueness — only check if email changed
  const duplicate = await User.findOne({
    where: { email, id: { [Op.ne]: req.user.id } },
    attributes: ['id']
  })
  if (duplicate) {
    throw fail(409, 'DUPLICATE_EMAIL', 'This email address is already in use.', {})
  }

  const user = await User.findByPk(req.user.id)
  if (!user) {
    throw fail(401, 'UNAUTHORIZED', 'Authentication is required.', {})
  }

  // Only update the allowlisted fields
  user.displayName = displayName
  user.email       = email
  user.theme       = theme
  await user.save()

  res.json({ success: true, data: serializeSettings(user), error: null })
}

module.exports = {
  getSettings:    wrap(getSettings),
  updateSettings: wrap(updateSettings)
}
