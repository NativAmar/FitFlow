'use strict'

const { Op } = require('sequelize')

const PLAN_NAMES = [
  'Beginner Strength Foundation',
  'Intermediate Hypertrophy',
  'Advanced Performance Program',
  'Beginner Athletic Fundamentals',
  'Intermediate Conditioning Block',
  'Powerlifting Prep - 12 Weeks',
  'Starter Fitness Plan',
  'Progressive Overload - Phase 1'
]

module.exports = {
  async up(queryInterface, Sequelize) {
    const allEmails = [
      'trainee@fitflow.com', 'trainee2@fitflow.com', 'trainee3@fitflow.com',
      'trainee4@fitflow.com', 'trainee5@fitflow.com', 'trainee6@fitflow.com',
      'trainee7@fitflow.com', 'trainee8@fitflow.com'
    ]
    const [traineeRows] = await queryInterface.sequelize.query(`
      SELECT t.id AS traineeId, t.trainerId, u.email
      FROM trainees t
      JOIN users u ON u.id = t.userId
      WHERE u.email IN (${allEmails.map(() => '?').join(',')})
    `, { replacements: allEmails })
    if (traineeRows.length !== 8) throw new Error(`Expected 8 trainees, got ${traineeRows.length}`)

    const te = {}
    traineeRows.forEach(r => { te[r.email] = r })

    const now = new Date()
    await queryInterface.bulkInsert('workout_plans', [
      // Sam Levi (beginner, trainer Daniel)
      {
        trainerId:   te['trainee@fitflow.com'].trainerId,
        traineeId:   te['trainee@fitflow.com'].traineeId,
        name:        'Beginner Strength Foundation',
        description: 'A 3-day full-body programme to build foundational strength and movement patterns.',
        status:      'active',
        startDate:   '2026-05-05',
        endDate:     null,
        createdAt:   now,
        updatedAt:   now
      },
      // Lisa Park (intermediate, trainer Daniel)
      {
        trainerId:   te['trainee2@fitflow.com'].trainerId,
        traineeId:   te['trainee2@fitflow.com'].traineeId,
        name:        'Intermediate Hypertrophy',
        description: 'A 4-day upper/lower split focused on muscle growth through progressive overload.',
        status:      'active',
        startDate:   '2026-05-05',
        endDate:     null,
        createdAt:   now,
        updatedAt:   now
      },
      // Tom Reyes (advanced, trainer Rachel)
      {
        trainerId:   te['trainee3@fitflow.com'].trainerId,
        traineeId:   te['trainee3@fitflow.com'].traineeId,
        name:        'Advanced Performance Program',
        description: 'A 5-day advanced training block targeting strength, hypertrophy, and conditioning.',
        status:      'active',
        startDate:   '2026-05-05',
        endDate:     null,
        createdAt:   now,
        updatedAt:   now
      },
      // Emma Wilson (beginner, trainer Marcus)
      {
        trainerId:   te['trainee4@fitflow.com'].trainerId,
        traineeId:   te['trainee4@fitflow.com'].traineeId,
        name:        'Beginner Athletic Fundamentals',
        description: 'Entry-level programme focusing on movement quality, conditioning, and injury prevention.',
        status:      'active',
        startDate:   '2026-05-19',
        endDate:     null,
        createdAt:   now,
        updatedAt:   now
      },
      // James Carter (intermediate, trainer Daniel)
      {
        trainerId:   te['trainee5@fitflow.com'].trainerId,
        traineeId:   te['trainee5@fitflow.com'].traineeId,
        name:        'Intermediate Conditioning Block',
        description: 'Four-day programme combining strength work with cardiovascular conditioning.',
        status:      'active',
        startDate:   '2026-05-19',
        endDate:     null,
        createdAt:   now,
        updatedAt:   now
      },
      // Sofia Martinez (advanced, trainer Marcus) — competition prep
      {
        trainerId:   te['trainee6@fitflow.com'].trainerId,
        traineeId:   te['trainee6@fitflow.com'].traineeId,
        name:        'Powerlifting Prep - 12 Weeks',
        description: 'Competition preparation block emphasising squat, bench press, and deadlift peaks.',
        status:      'active',
        startDate:   '2026-04-14',
        endDate:     '2026-07-06',
        createdAt:   now,
        updatedAt:   now
      },
      // Liam Brown (beginner, trainer Rachel) — paused trainee, archived plan
      {
        trainerId:   te['trainee7@fitflow.com'].trainerId,
        traineeId:   te['trainee7@fitflow.com'].traineeId,
        name:        'Starter Fitness Plan',
        description: 'Light introductory plan, archived while trainee is on extended travel.',
        status:      'archived',
        startDate:   '2026-06-02',
        endDate:     '2026-06-16',
        createdAt:   now,
        updatedAt:   now
      },
      // Noah Kim (intermediate, trainer Rachel)
      {
        trainerId:   te['trainee8@fitflow.com'].trainerId,
        traineeId:   te['trainee8@fitflow.com'].traineeId,
        name:        'Progressive Overload - Phase 1',
        description: 'Systematic 4-day progressive overload block building from a moderate base.',
        status:      'active',
        startDate:   '2026-06-02',
        endDate:     null,
        createdAt:   now,
        updatedAt:   now
      }
    ])
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('workout_plans', {
      name: { [Op.in]: PLAN_NAMES }
    })
  }
}
