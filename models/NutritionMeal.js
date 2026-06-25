'use strict'

const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const NutritionMeal = sequelize.define('NutritionMeal', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  nutritionPlanId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  mealType: {
    type: DataTypes.ENUM(
      'breakfast',
      'morning-snack',
      'lunch',
      'afternoon-snack',
      'dinner',
      'evening-snack',
      'pre-workout',
      'post-workout',
      'custom'
    ),
    allowNull: false
  },
  dayOfWeek: {
    type: DataTypes.ENUM(
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday'
    ),
    allowNull: true
  },
  scheduledTime: {
    type: DataTypes.TIME,
    allowNull: true
  },
  instructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  displayOrder: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  }
}, {
  tableName: 'nutrition_meals',
  timestamps: true
})

module.exports = NutritionMeal
