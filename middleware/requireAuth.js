'use strict'

const { verifyToken } = require('../services/authService')
const { User } = require('../models/index')

function makeErr(status, code, message, details) {
  const e = new Error(message)
  e.status = status
  e.code = code
  e.details = details || {}
  return e
}

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization
    if (!header || !String(header).trim()) {
      return next(makeErr(401, 'UNAUTHORIZED', 'Authentication is required.', { header: 'Authorization' }))
    }

    const match = String(header).trim().match(/^Bearer\s+(.+)$/i)
    if (!match) {
      return next(makeErr(401, 'UNAUTHORIZED', 'Authentication is required.', { header: 'Authorization' }))
    }

    const token = match[1].trim()

    let decoded
    try {
      decoded = verifyToken(token)
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(makeErr(401, 'TOKEN_EXPIRED', 'Token has expired. Please log in again.', {}))
      }
      return next(makeErr(401, 'UNAUTHORIZED', 'Invalid token.', {}))
    }

    const user = await User.findByPk(decoded.userId, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'status', 'theme', 'displayName']
    })

    if (!user) {
      return next(makeErr(401, 'UNAUTHORIZED', 'Authentication is required.', {}))
    }

    if (user.status === 'inactive') {
      return next(makeErr(403, 'ACCOUNT_INACTIVE', 'This account has been deactivated.', {}))
    }

    req.user = {
      id:          user.id,
      role:        user.role,
      firstName:   user.firstName,
      lastName:    user.lastName,
      email:       user.email,
      status:      user.status,
      theme:       user.theme,
      displayName: user.displayName || `${user.firstName} ${user.lastName}`
    }

    next()
  } catch (err) {
    next(err)
  }
}

module.exports = requireAuth
