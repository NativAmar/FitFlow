'use strict'

const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Trainer = sequelize.define('Trainer', {
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
  specialization: {
    type: DataTypes.STRING(200),
    allowNull: true
  }
}, {
  tableName: 'trainers',
  timestamps: true
})

module.exports = Trainer
