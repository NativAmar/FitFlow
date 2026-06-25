'use strict'

const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  recipientUserId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  actorUserId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  type: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(180),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'notifications',
  timestamps: true
})

module.exports = Notification
