'use strict'

const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Trainee = sequelize.define('Trainee', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    unique: true
  },
  trainerId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  experienceLevel: {
    type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
    allowNull: false
  },
  weeklyWorkouts: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'paused', 'completed'),
    allowNull: false,
    defaultValue: 'active'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'trainees',
  timestamps: true
})

module.exports = Trainee
