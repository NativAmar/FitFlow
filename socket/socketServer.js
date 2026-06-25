'use strict'

const { Server } = require('socket.io')
const { createSocketAuthMiddleware } = require('./socketAuth')

let _io = null

// ── Initialization ────────────────────────────────────────────────────────────

function initializeSocketServer(httpServer) {
  const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3001'

  _io = new Server(httpServer, {
    cors: {
      origin: allowedOrigin,
      methods: ['GET', 'POST'],
      credentials: true
    }
  })

  _io.use(createSocketAuthMiddleware())

  _io.on('connection', (socket) => {
    const userId = socket.data.user.id

    // Server-controlled room — client cannot request arbitrary rooms
    socket.join(`user:${userId}`)

    socket.on('notifications:request', makeRequestHandler(socket))
    socket.on('notification:mark-read', makeMarkReadHandler(socket))
    socket.on('notifications:mark-all-read', makeMarkAllReadHandler(socket))
  })

  return _io
}

// ── Public accessors ──────────────────────────────────────────────────────────

function getIo() {
  if (!_io) {
    throw Object.assign(
      new Error('Socket server has not been initialized yet.'),
      { code: 'SOCKET_NOT_INITIALIZED' }
    )
  }
  return _io
}

function emitToUser(userId, eventName, payload) {
  if (!_io) return  // silent — socket server not running (e.g. test environment)
  _io.to(`user:${userId}`).emit(eventName, payload)
}

// ── Event handlers (lazy-require notificationService to avoid circular dep) ───

function makeRequestHandler(socket) {
  return async function handleNotificationsRequest(payload) {
    try {
      const { listNotificationsForUser } = require('../services/notificationService')
      const opts = {}
      if (payload && typeof payload === 'object') {
        if (typeof payload.limit      === 'number')  opts.limit      = payload.limit
        if (typeof payload.unreadOnly === 'boolean') opts.unreadOnly = payload.unreadOnly
      }
      const result = await listNotificationsForUser(socket.data.user.id, opts)
      socket.emit('notifications:list', result)
    } catch (err) {
      console.error('[Socket] notifications:request error:', err.message)
      socket.emit('notification:error', { code: 'LOAD_FAILED', message: 'Failed to load notifications.' })
    }
  }
}

function makeMarkReadHandler(socket) {
  return async function handleMarkRead(payload) {
    try {
      if (!payload || typeof payload !== 'object') {
        return socket.emit('notification:error', { code: 'INVALID_PAYLOAD', message: 'Payload must be an object.' })
      }
      const rawId = payload.notificationId
      const notifId = typeof rawId === 'number' ? rawId : parseInt(String(rawId ?? ''), 10)
      if (!Number.isInteger(notifId) || notifId < 1) {
        return socket.emit('notification:error', { code: 'INVALID_ID', message: 'notificationId must be a positive integer.' })
      }

      const { markNotificationRead, countUnreadForUser } = require('../services/notificationService')
      const result = await markNotificationRead(socket.data.user.id, notifId)
      const unreadCount = await countUnreadForUser(socket.data.user.id)

      // Emit to all tabs of this user
      _io.to(`user:${socket.data.user.id}`).emit('notification:read', {
        notificationId: notifId,
        readAt:         result.readAt,
        unreadCount
      })
    } catch (err) {
      if (err.code === 'NOTIFICATION_NOT_FOUND') {
        return socket.emit('notification:error', { code: 'NOT_FOUND', message: 'Notification not found.' })
      }
      console.error('[Socket] notification:mark-read error:', err.message)
      socket.emit('notification:error', { code: 'MARK_READ_FAILED', message: 'Failed to mark notification as read.' })
    }
  }
}

function makeMarkAllReadHandler(socket) {
  return async function handleMarkAllRead() {
    try {
      const { markAllNotificationsRead } = require('../services/notificationService')
      const result = await markAllNotificationsRead(socket.data.user.id)

      // Emit to all tabs of this user
      _io.to(`user:${socket.data.user.id}`).emit('notifications:all-read', result)
    } catch (err) {
      console.error('[Socket] notifications:mark-all-read error:', err.message)
      socket.emit('notification:error', { code: 'MARK_ALL_FAILED', message: 'Failed to mark all notifications as read.' })
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────

module.exports = { initializeSocketServer, getIo, emitToUser }
