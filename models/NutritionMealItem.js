'use strict'

const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const NutritionMealItem = sequelize.define('NutritionMealItem', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  nutritionMealId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  foodName: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  unit: {
    type: DataTypes.STRING(50),
    allowNull: true
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
  tableName: 'nutrition_meal_items',
  timestamps: true
})

module.exports = NutritionMealItem
