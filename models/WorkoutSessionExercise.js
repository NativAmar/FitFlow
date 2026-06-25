'use strict'

const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const WorkoutSessionExercise = sequelize.define('WorkoutSessionExercise', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  workoutSessionId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  exerciseId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  sets: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  repetitions: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  durationSeconds: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  restSeconds: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  displayOrder: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  }
}, {
  tableName: 'workout_session_exercises',
  timestamps: true
})

module.exports = WorkoutSessionExercise
