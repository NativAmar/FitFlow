'use strict'

const bcrypt = require('bcryptjs')
const { Op } = require('sequelize')

const EXTRA_EMAILS = [
  'trainer3@fitflow.com',
  'trainee4@fitflow.com',
  'trainee5@fitflow.com',
  'trainee6@fitflow.com',
  'trainee7@fitflow.com',
  'trainee8@fitflow.com'
]

module.exports = {
  async up(queryInterface, Sequelize) {
    const hash = bcrypt.hashSync('123456', 10)
    const now  = new Date()

    await queryInterface.bulkInsert('users', [
      {
        firstName:    'Marcus',
        lastName:     'Johnson',
        email:        'trainer3@fitflow.com',
        passwordHash: hash,
        role:         'trainer',
        status:       'active',
        theme:        'dark',
        displayName:  null,
        createdAt:    now,
        updatedAt:    now
      },
      {
        firstName:    'Emma',
        lastName:     'Wilson',
        email:        'trainee4@fitflow.com',
        passwordHash: hash,
        role:         'trainee',
        status:       'active',
        theme:        'light',
        displayName:  null,
        createdAt:    now,
        updatedAt:    now
      },
      {
        firstName:    'James',
        lastName:     'Carter',
        email:        'trainee5@fitflow.com',
        passwordHash: hash,
        role:         'trainee',
        status:       'active',
        theme:        'light',
        displayName:  null,
        createdAt:    now,
        updatedAt:    now
      },
      {
        firstName:    'Sofia',
        lastName:     'Martinez',
        email:        'trainee6@fitflow.com',
        passwordHash: hash,
        role:         'trainee',
        status:       'active',
        theme:        'system',
        displayName:  null,
        createdAt:    now,
        updatedAt:    now
      },
      {
        firstName:    'Liam',
        lastName:     'Brown',
        email:        'trainee7@fitflow.com',
        passwordHash: hash,
        role:         'trainee',
        status:       'active',
        theme:        'light',
        displayName:  null,
        createdAt:    now,
        updatedAt:    now
      },
      {
        firstName:    'Noah',
        lastName:     'Kim',
        email:        'trainee8@fitflow.com',
        passwordHash: hash,
        role:         'trainee',
        status:       'active',
        theme:        'dark',
        displayName:  null,
        createdAt:    now,
        updatedAt:    now
      }
    ])
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      email: { [Op.in]: EXTRA_EMAILS }
    })
  }
}
