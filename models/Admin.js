'use strict'

const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Admin = sequelize.define('Admin', {
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
  }
}, {
  tableName: 'admins',
  timestamps: true
})

module.exports = Admin
