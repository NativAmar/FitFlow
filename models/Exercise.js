'use strict'

const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Exercise = sequelize.define('Exercise', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  trainerId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  muscleGroupId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'exercises',
  timestamps: true
})

module.exports = Exercise
