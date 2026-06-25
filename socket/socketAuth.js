'use strict'

const { verifyToken } = require('../services/authService')
const { User } = require('../models/index')

function createSocketAuthMiddleware() {
  return async function socketAuth(socket, next) {
    const token = socket.handshake.auth && socket.handshake.auth.token

    if (!token || typeof token !== 'string' || !token.trim()) {
      return next(Object.assign(new Error('Authentication token is required.'), { code: 'UNAUTHORIZED' }))
    }

    let decoded
    try {
      decoded = verifyToken(token.trim())
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(Object.assign(new Error('Token has expired.'), { code: 'TOKEN_EXPIRED' }))
      }
      return next(Object.assign(new Error('Invalid token.'), { code: 'UNAUTHORIZED' }))
    }

    let user
    try {
      user = await User.findByPk(decoded.userId, {
        attributes: ['id', 'firstName', 'lastName', 'displayName', 'role', 'status']
      })
    } catch (dbErr) {
      console.error('[SocketAuth] DB error looking up user:', dbErr.message)
      return next(Object.assign(new Error('Authentication failed.'), { code: 'UNAUTHORIZED' }))
    }

    if (!user) {
      return next(Object.assign(new Error('User not found.'), { code: 'USER_NOT_FOUND' }))
    }

    if (user.status === 'inactive') {
      return next(Object.assign(new Error('Account is inactive.'), { code: 'ACCOUNT_INACTIVE' }))
    }

    // Attach only safe identity data — never trust client-supplied role/userId
    socket.data.user = {
      id:          user.id,
      role:        user.role,
      displayName: user.displayName || `${user.firstName} ${user.lastName}`,
      firstName:   user.firstName,
      lastName:    user.lastName
    }

    next()
  }
}

module.exports = { createSocketAuthMiddleware }
