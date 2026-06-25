'use strict'

const jwt = require('jsonwebtoken')

function getSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    const e = new Error('JWT_SECRET is not configured on this server.')
    e.status = 500
    e.code = 'INTERNAL_ERROR'
    e.details = {}
    throw e
  }
  return secret
}

function generateToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role },
    getSecret(),
    { expiresIn: '1h' }
  )
}

function verifyToken(token) {
  return jwt.verify(token, getSecret())
}

module.exports = { generateToken, verifyToken }
