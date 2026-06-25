'use strict'

const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const NutritionPlan = sequelize.define('NutritionPlan', {
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
  traineeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  generalNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'archived'),
    allowNull: false,
    defaultValue: 'draft'
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  }
}, {
  tableName: 'nutrition_plans',
  timestamps: true
})

module.exports = NutritionPlan
