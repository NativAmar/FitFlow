'use strict'

/**
 * JWT-based role guard. Reads req.user.role set by requireAuth.
 * Never reads x-user-role or any client-supplied role claim.
 *
 * Usage: requireRole('admin', 'trainer')
 */
function requireRole(...allowedRoles) {
  const allowed = allowedRoles.map(r => String(r).toLowerCase())

  return function roleMiddleware(req, res, next) {
    if (!req.user) {
      const e = new Error('Authentication is required.')
      e.status = 401
      e.code = 'UNAUTHORIZED'
      e.details = {}
      return next(e)
    }

    const role = String(req.user.role).toLowerCase()
    if (!allowed.includes(role)) {
      const e = new Error('You do not have permission to perform this action.')
      e.status = 403
      e.code = 'FORBIDDEN'
      e.details = { role, allowedRoles: allowedRoles.slice() }
      return next(e)
    }

    next()
  }
}

module.exports = requireRole
