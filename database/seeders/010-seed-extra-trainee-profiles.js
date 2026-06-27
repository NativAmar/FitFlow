'use strict'

const { Op } = require('sequelize')

const EXTRA_TRAINEE_EMAILS = [
  'trainee4@fitflow.com',
  'trainee5@fitflow.com',
  'trainee6@fitflow.com',
  'trainee7@fitflow.com',
  'trainee8@fitflow.com'
]

module.exports = {
  async up(queryInterface, Sequelize) {
    const [userRows] = await queryInterface.sequelize.query(
      `SELECT id, email FROM users WHERE email IN (${EXTRA_TRAINEE_EMAILS.map(() => '?').join(',')})`,
      { replacements: EXTRA_TRAINEE_EMAILS }
    )
    if (userRows.length !== 5) throw new Error('Extra trainee users not found — run 008-seed-extra-users first')
    const byEmail = {}
    userRows.forEach(r => { byEmail[r.email] = r.id })

    const [trainerRows] = await queryInterface.sequelize.query(
      "SELECT t.id AS trainerId, u.email FROM trainers t JOIN users u ON u.id = t.userId WHERE u.email IN ('trainer@fitflow.com','trainer2@fitflow.com','trainer3@fitflow.com')"
    )
    if (trainerRows.length !== 3) throw new Error('Trainer profiles not found — run trainer-profiles seeders first')
    const trainerByEmail = {}
    trainerRows.forEach(r => { trainerByEmail[r.email] = r.trainerId })

    const now = new Date()
    await queryInterface.bulkInsert('trainees', [
      {
        userId:          byEmail['trainee4@fitflow.com'],
        trainerId:       trainerByEmail['trainer3@fitflow.com'],
        experienceLevel: 'beginner',
        weeklyWorkouts:  3,
        status:          'active',
        notes:           'Recovering from a minor knee strain — avoid high-impact movements.',
        createdAt:       now,
        updatedAt:       now
      },
      {
        userId:          byEmail['trainee5@fitflow.com'],
        trainerId:       trainerByEmail['trainer@fitflow.com'],
        experienceLevel: 'intermediate',
        weeklyWorkouts:  4,
        status:          'active',
        notes:           null,
        createdAt:       now,
        updatedAt:       now
      },
      {
        userId:          byEmail['trainee6@fitflow.com'],
        trainerId:       trainerByEmail['trainer3@fitflow.com'],
        experienceLevel: 'advanced',
        weeklyWorkouts:  5,
        status:          'active',
        notes:           'Competing in a powerlifting meet in approximately 3 months.',
        createdAt:       now,
        updatedAt:       now
      },
      {
        userId:          byEmail['trainee7@fitflow.com'],
        trainerId:       trainerByEmail['trainer2@fitflow.com'],
        experienceLevel: 'beginner',
        weeklyWorkouts:  2,
        status:          'paused',
        notes:           'Training paused due to extended work travel.',
        createdAt:       now,
        updatedAt:       now
      },
      {
        userId:          byEmail['trainee8@fitflow.com'],
        trainerId:       trainerByEmail['trainer2@fitflow.com'],
        experienceLevel: 'intermediate',
        weeklyWorkouts:  4,
        status:          'active',
        notes:           null,
        createdAt:       now,
        updatedAt:       now
      }
    ])
  },

  async down(queryInterface, Sequelize) {
    const [userRows] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email IN (${EXTRA_TRAINEE_EMAILS.map(() => '?').join(',')})`,
      { replacements: EXTRA_TRAINEE_EMAILS }
    )
    if (userRows.length) {
      await queryInterface.bulkDelete('trainees', {
        userId: { [Op.in]: userRows.map(r => r.id) }
      })
    }
  }
}
