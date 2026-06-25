'use strict'

const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const TraineeGoal = sequelize.define('TraineeGoal', {
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
  goalId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  targetDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('in-progress', 'achieved', 'dropped'),
    allowNull: false,
    defaultValue: 'in-progress'
  }
}, {
  tableName: 'trainee_goals',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['traineeId', 'goalId'],
      name: 'trainee_goals_traineeId_goalId_unique'
    }
  ]
})

module.exports = TraineeGoal
