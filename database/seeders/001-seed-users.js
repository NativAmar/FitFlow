'use strict'

const bcrypt = require('bcryptjs')
const { Op } = require('sequelize')

const DEMO_EMAILS = [
  'admin@fitflow.com',
  'trainer@fitflow.com',
  'trainer2@fitflow.com',
  'trainee@fitflow.com',
  'trainee2@fitflow.com',
  'trainee3@fitflow.com'
]

module.exports = {
  async up(queryInterface, Sequelize) {
    const hash = bcrypt.hashSync('123456', 10)
    const now = new Date()

    await queryInterface.bulkInsert('users', [
      {
        firstName: 'Alex',
        lastName: 'Admin',
        email: 'admin@fitflow.com',
        passwordHash: hash,
        role: 'admin',
        status: 'active',
        theme: 'light',
        displayName: null,
        createdAt: now,
        updatedAt: now
      },
      {
        firstName: 'Daniel',
        lastName: 'Cohen',
        email: 'trainer@fitflow.com',
        passwordHash: hash,
        role: 'trainer',
        status: 'active',
        theme: 'light',
        displayName: null,
        createdAt: now,
        updatedAt: now
      },
      {
        firstName: 'Rachel',
        lastName: 'Turner',
        email: 'trainer2@fitflow.com',
        passwordHash: hash,
        role: 'trainer',
        status: 'active',
        theme: 'light',
        displayName: null,
        createdAt: now,
        updatedAt: now
      },
      {
        firstName: 'Sam',
        lastName: 'Levi',
        email: 'trainee@fitflow.com',
        passwordHash: hash,
        role: 'trainee',
        status: 'active',
        theme: 'light',
        displayName: null,
        createdAt: now,
        updatedAt: now
      },
      {
        firstName: 'Lisa',
        lastName: 'Park',
        email: 'trainee2@fitflow.com',
        passwordHash: hash,
        role: 'trainee',
        status: 'active',
        theme: 'light',
        displayName: null,
        createdAt: now,
        updatedAt: now
      },
      {
        firstName: 'Tom',
        lastName: 'Reyes',
        email: 'trainee3@fitflow.com',
        passwordHash: hash,
        role: 'trainee',
        status: 'active',
        theme: 'light',
        displayName: null,
        createdAt: now,
        updatedAt: now
      }
    ])
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      email: { [Op.in]: DEMO_EMAILS }
    })
  }
}
