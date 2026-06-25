'use strict'

const bcrypt = require('bcryptjs')
const { User } = require('../models/index')
const { generateToken } = require('../services/authService')

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
  e.details = details
  return e
}

function toPublic(user) {
  return {
    id:          user.id,
    firstName:   user.firstName,
    lastName:    user.lastName,
    email:       user.email,
    role:        user.role,
    status:      user.status,
    theme:       user.theme,
    displayName: user.displayName || `${user.firstName} ${user.lastName}`
  }
}

function validateLoginBody(body) {
  const errors = []

  if (body.email === undefined || body.email === null || String(body.email).trim() === '') {
    errors.push({ field: 'email', message: 'email is required' })
  } else if (typeof body.email !== 'string') {
    errors.push({ field: 'email', message: 'email must be a string' })
  } else if (!EMAIL_REGEX.test(String(body.email).trim())) {
    errors.push({ field: 'email', message: 'email must be a valid email address' })
  }

  if (body.password === undefined || body.password === null || String(body.password) === '') {
    errors.push({ field: 'password', message: 'password is required' })
  } else if (typeof body.password !== 'string') {
    errors.push({ field: 'password', message: 'password must be a string' })
  }

  if (errors.length > 0) {
    throw fail(400, 'VALIDATION_ERROR', 'Validation failed', { fields: errors })
  }

  return {
    email:    String(body.email).trim().toLowerCase(),
    password: String(body.password)
  }
}

async function login(req, res) {
  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const { email, password } = validateLoginBody(body)

  const user = await User.findOne({ where: { email } })

  // Use a constant-time comparison even when user is not found to
  // avoid timing-based email enumeration.
  const DUMMY_HASH = '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345'
  const hashToCompare = user ? user.passwordHash : DUMMY_HASH
  const passwordMatch = await bcrypt.compare(password, hashToCompare)

  if (!user || !passwordMatch) {
    throw fail(401, 'INVALID_CREDENTIALS', 'Invalid email or password.', {})
  }

  if (user.status === 'inactive') {
    throw fail(403, 'ACCOUNT_INACTIVE', 'This account has been deactivated.', {})
  }

  const token = generateToken(user)

  res.json({
    success: true,
    data: {
      token,
      user: toPublic(user)
    },
    error: null
  })
}

function logout(req, res) {
  res.json({
    success: true,
    data: { message: 'Logged out successfully. Please remove the token from client storage.' },
    error: null
  })
}

function getMe(req, res) {
  res.json({
    success: true,
    data: req.user,
    error: null
  })
}

module.exports = {
  login:  wrap(login),
  logout: wrap(logout),
  getMe:  wrap(getMe)
}
