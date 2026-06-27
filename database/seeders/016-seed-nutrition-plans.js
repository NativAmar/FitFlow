'use strict'

const { Op } = require('sequelize')

// 6 of 8 trainees get active nutrition plans (Liam paused, Noah left without one to test that edge case)
const PLAN_CONFIGS = [
  { traineeEmail: 'trainee@fitflow.com',  name: 'Bulking Basics',            description: 'Caloric surplus plan to support muscle gain alongside the strength programme.',    generalNotes: 'Aim for ~3000 kcal/day. Prioritise protein at every meal.',             status: 'active', startDate: '2026-05-05', endDate: null },
  { traineeEmail: 'trainee2@fitflow.com', name: 'Lean Muscle Nutrition',      description: 'Moderate surplus diet for lean hypertrophy without excess fat gain.',             generalNotes: 'Keep fats moderate. Carb-cycle around training days.',                  status: 'active', startDate: '2026-05-05', endDate: null },
  { traineeEmail: 'trainee3@fitflow.com', name: 'Performance Fuel Plan',      description: 'High-energy diet to fuel 5 training sessions per week at advanced intensity.',   generalNotes: 'Increase carbs on heavy training days. Hydration is critical.',         status: 'active', startDate: '2026-05-05', endDate: null },
  { traineeEmail: 'trainee4@fitflow.com', name: 'Foundation Nutrition',       description: 'Simple, balanced plan for a beginner building healthy eating habits.',            generalNotes: 'Focus on whole foods and consistent meal timing.',                      status: 'active', startDate: '2026-05-19', endDate: null },
  { traineeEmail: 'trainee5@fitflow.com', name: 'Maintenance & Performance',  description: 'Maintenance-level calories with performance-oriented macro split.',              generalNotes: 'Track protein daily. Pre-workout carbs recommended on strength days.',  status: 'active', startDate: '2026-05-19', endDate: null },
  { traineeEmail: 'trainee6@fitflow.com', name: "Athlete's Competition Diet", description: 'Precision nutrition plan for the 12-week powerlifting competition build-up.',   generalNotes: 'Peak week carb-loading protocol to be added 7 days before meet.',      status: 'active', startDate: '2026-04-14', endDate: '2026-07-06' }
]

const PLAN_NAMES = PLAN_CONFIGS.map(p => p.name)

module.exports = {
  async up(queryInterface, Sequelize) {
    const emails = PLAN_CONFIGS.map(p => p.traineeEmail)

    const [traineeRows] = await queryInterface.sequelize.query(`
      SELECT t.id AS traineeId, t.trainerId, u.email
      FROM trainees t
      JOIN users u ON u.id = t.userId
      WHERE u.email IN (${emails.map(() => '?').join(',')})
    `, { replacements: emails })

    const te = {}
    traineeRows.forEach(r => { te[r.email] = r })

    const now = new Date()
    const rows = PLAN_CONFIGS.map(cfg => ({
      trainerId:    te[cfg.traineeEmail].trainerId,
      traineeId:    te[cfg.traineeEmail].traineeId,
      name:         cfg.name,
      description:  cfg.description,
      generalNotes: cfg.generalNotes,
      status:       cfg.status,
      startDate:    cfg.startDate,
      endDate:      cfg.endDate,
      createdAt:    now,
      updatedAt:    now
    }))

    await queryInterface.bulkInsert('nutrition_plans', rows)
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('nutrition_plans', {
      name: { [Op.in]: PLAN_NAMES }
    })
  }
}
