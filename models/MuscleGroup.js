'use strict'

const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const MuscleGroup = sequelize.define('MuscleGroup', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'muscle_groups',
  timestamps: true
})

module.exports = MuscleGroup
