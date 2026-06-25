'use strict'

const { Op } = require('sequelize')

module.exports = {
  async up(queryInterface, Sequelize) {
    // Resolve user IDs by email
    const [userRows] = await queryInterface.sequelize.query(
      "SELECT id, email FROM users WHERE email IN ('trainee@fitflow.com', 'trainee2@fitflow.com', 'trainee3@fitflow.com')"
    )
    if (userRows.length !== 3) throw new Error('Trainee users not found — run users seeder first')

    const userByEmail = {}
    userRows.forEach(r => { userByEmail[r.email] = r.id })

    // Resolve trainer IDs by user email
    const [trainerRows] = await queryInterface.sequelize.query(
      "SELECT t.id AS trainerId, u.email FROM trainers t JOIN users u ON u.id = t.userId WHERE u.email IN ('trainer@fitflow.com', 'trainer2@fitflow.com')"
    )
    if (trainerRows.length !== 2) throw new Error('Trainer profiles not found — run trainer-profiles seeder first')

    const trainerByEmail = {}
    trainerRows.forEach(r => { trainerByEmail[r.email] = r.trainerId })

    const now = new Date()
    await queryInterface.bulkInsert('trainees', [
      {
        userId:          userByEmail['trainee@fitflow.com'],
        trainerId:       trainerByEmail['trainer@fitflow.com'],
        experienceLevel: 'beginner',
        weeklyWorkouts:  3,
        status:          'active',
        notes:           null,
        createdAt:       now,
        updatedAt:       now
      },
      {
        userId:          userByEmail['trainee2@fitflow.com'],
        trainerId:       trainerByEmail['trainer@fitflow.com'],
        experienceLevel: 'intermediate',
        weeklyWorkouts:  4,
        status:          'active',
        notes:           null,
        createdAt:       now,
        updatedAt:       now
      },
      {
        userId:          userByEmail['trainee3@fitflow.com'],
        trainerId:       trainerByEmail['trainer2@fitflow.com'],
        experienceLevel: 'advanced',
        weeklyWorkouts:  5,
        status:          'active',
        notes:           null,
        createdAt:       now,
        updatedAt:       now
      }
    ])
  },

  async down(queryInterface, Sequelize) {
    const [userRows] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email IN ('trainee@fitflow.com', 'trainee2@fitflow.com', 'trainee3@fitflow.com')"
    )
    if (userRows.length) {
      const ids = userRows.map(r => r.id)
      await queryInterface.bulkDelete('trainees', {
        userId: { [Op.in]: ids }
      })
    }
  }
}
