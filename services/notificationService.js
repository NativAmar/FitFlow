'use strict'

const { Op } = require('sequelize')
const { Notification, User, Trainee, Trainer } = require('../models/index')
const { isSupportedType } = require('../constants/notificationTypes')

// ── Serialization ─────────────────────────────────────────────────────────────

function serializeActor(user) {
  if (!user) return null
  return {
    id:          user.id,
    displayName: user.displayName || `${user.firstName} ${user.lastName}`,
    firstName:   user.firstName,
    lastName:    user.lastName,
    role:        user.role
  }
}

function serializeNotification(n) {
  return {
    id:        n.id,
    type:      n.type,
    title:     n.title,
    message:   n.message,
    metadata:  n.metadata   || null,
    isRead:    n.isRead,
    readAt:    n.readAt     || null,
    createdAt: n.createdAt,
    actor:     serializeActor(n.actor || null)
  }
}

// ── Counts ────────────────────────────────────────────────────────────────────

async function countUnreadForUser(userId) {
  return Notification.count({
    where: { recipientUserId: userId, isRead: false }
  })
}

// ── List ──────────────────────────────────────────────────────────────────────

async function listNotificationsForUser(userId, options = {}) {
  let limit = typeof options.limit === 'number' ? options.limit : 20
  if (limit < 1)  limit = 1
  if (limit > 50) limit = 50

  const where = { recipientUserId: userId }
  if (options.unreadOnly === true) where.isRead = false

  const notifications = await Notification.findAll({
    where,
    include: [{
      model: User,
      as: 'actor',
      attributes: ['id', 'firstName', 'lastName', 'displayName', 'role'],
      required: false
    }],
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
    limit
  })

  const unreadCount = await countUnreadForUser(userId)

  return {
    notifications: notifications.map(serializeNotification),
    unreadCount
  }
}

// ── Create ────────────────────────────────────────────────────────────────────

async function createNotification({ type, recipientUserId, actorUserId, title, message, metadata }) {
  if (!isSupportedType(type)) {
    throw Object.assign(new Error(`Unsupported notification type: ${type}`), { code: 'INVALID_NOTIFICATION_TYPE' })
  }
  if (!recipientUserId || !title || !message) {
    throw Object.assign(new Error('recipientUserId, title, and message are required'), { code: 'MISSING_NOTIFICATION_FIELDS' })
  }

  const notification = await Notification.create({
    type,
    recipientUserId,
    actorUserId: actorUserId || null,
    title,
    message,
    metadata:   metadata || null,
    isRead:     false,
    readAt:     null
  })

  return Notification.findByPk(notification.id, {
    include: [{
      model: User,
      as: 'actor',
      attributes: ['id', 'firstName', 'lastName', 'displayName', 'role'],
      required: false
    }]
  })
}

async function createAndEmitNotification(data) {
  const full = await createNotification(data)
  const serialized = serializeNotification(full)

  // Lazy require breaks the circular dependency with socketServer
  try {
    const { emitToUser } = require('../socket/socketServer')
    emitToUser(data.recipientUserId, 'notification:new', serialized)
  } catch (emitErr) {
    console.error('[Notification] Emit failed (socket not ready?):', emitErr.message)
  }

  return serialized
}

// ── Fail-safe wrapper for controllers ─────────────────────────────────────────
// Never allows a notification failure to break the business API response.

async function tryCreateAndEmitNotification(data) {
  try {
    await createAndEmitNotification(data)
  } catch (err) {
    console.error('[Notification] Failed to create/emit notification:', err.message, {
      type:            data.type,
      recipientUserId: data.recipientUserId
    })
  }
}

// ── Mark one read ─────────────────────────────────────────────────────────────

async function markNotificationRead(userId, notificationId) {
  const notification = await Notification.findOne({
    where: { id: notificationId, recipientUserId: userId }
  })

  if (!notification) {
    throw Object.assign(
      new Error('Notification not found.'),
      { code: 'NOTIFICATION_NOT_FOUND', status: 404 }
    )
  }

  if (!notification.isRead) {
    const now = new Date()
    await notification.update({ isRead: true, readAt: now })
  }

  return { notificationId: notification.id, readAt: notification.readAt }
}

// ── Mark all read ──────────────────────────────────────────────────────────────

async function markAllNotificationsRead(userId) {
  const now = new Date()
  const [affectedCount] = await Notification.update(
    { isRead: true, readAt: now },
    { where: { recipientUserId: userId, isRead: false } }
  )

  return {
    affectedCount,
    unreadCount: 0,
    readAt: now
  }
}

// ── Recipient resolution helpers ──────────────────────────────────────────────

async function resolveTraineeUserId(traineeId) {
  const trainee = await Trainee.findByPk(traineeId, { attributes: ['id', 'userId'] })
  if (!trainee) {
    console.error('[Notification] resolveTraineeUserId: trainee not found', { traineeId })
    return null
  }
  return trainee.userId
}

async function resolveTrainerUserIdFromTrainee(trainee) {
  if (!trainee || !trainee.trainerId) {
    console.error('[Notification] resolveTrainerUserIdFromTrainee: no trainerId on trainee')
    return null
  }
  const trainer = await Trainer.findByPk(trainee.trainerId, { attributes: ['id', 'userId'] })
  if (!trainer) {
    console.error('[Notification] resolveTrainerUserIdFromTrainee: trainer not found', { trainerId: trainee.trainerId })
    return null
  }
  return trainer.userId
}

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  serializeNotification,
  listNotificationsForUser,
  countUnreadForUser,
  createNotification,
  createAndEmitNotification,
  tryCreateAndEmitNotification,
  markNotificationRead,
  markAllNotificationsRead,
  resolveTraineeUserId,
  resolveTrainerUserIdFromTrainee
}
