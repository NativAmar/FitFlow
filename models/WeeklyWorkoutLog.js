'use strict'

const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const WeeklyWorkoutLog = sequelize.define('WeeklyWorkoutLog', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  traineeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  workoutPlanId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  workoutSessionId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  weekStartDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'weekly_workout_logs',
  timestamps: true
})

module.exports = WeeklyWorkoutLog
