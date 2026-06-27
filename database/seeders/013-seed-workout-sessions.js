'use strict'

const { Op } = require('sequelize')

// Sessions defined per plan name. Session counts match each trainee's weeklyWorkouts target.
const PLAN_SESSIONS = {
  'Beginner Strength Foundation': [
    { name: 'Full Body A', scheduledDay: 'monday',    displayOrder: 1 },
    { name: 'Full Body B', scheduledDay: 'wednesday', displayOrder: 2 },
    { name: 'Full Body C', scheduledDay: 'friday',    displayOrder: 3 }
  ],
  'Intermediate Hypertrophy': [
    { name: 'Upper Body A', scheduledDay: 'monday',   displayOrder: 1 },
    { name: 'Lower Body A', scheduledDay: 'tuesday',  displayOrder: 2 },
    { name: 'Upper Body B', scheduledDay: 'thursday', displayOrder: 3 },
    { name: 'Lower Body B', scheduledDay: 'friday',   displayOrder: 4 }
  ],
  'Advanced Performance Program': [
    { name: 'Push Day',     scheduledDay: 'monday',    displayOrder: 1 },
    { name: 'Pull Day',     scheduledDay: 'tuesday',   displayOrder: 2 },
    { name: 'Leg Day',      scheduledDay: 'wednesday', displayOrder: 3 },
    { name: 'Upper Power',  scheduledDay: 'thursday',  displayOrder: 4 },
    { name: 'Conditioning', scheduledDay: 'friday',    displayOrder: 5 }
  ],
  'Beginner Athletic Fundamentals': [
    { name: 'Movement Basics A', scheduledDay: 'monday',    displayOrder: 1 },
    { name: 'Movement Basics B', scheduledDay: 'wednesday', displayOrder: 2 },
    { name: 'Conditioning',      scheduledDay: 'friday',    displayOrder: 3 }
  ],
  'Intermediate Conditioning Block': [
    { name: 'Strength A',     scheduledDay: 'monday',   displayOrder: 1 },
    { name: 'Conditioning A', scheduledDay: 'tuesday',  displayOrder: 2 },
    { name: 'Strength B',     scheduledDay: 'thursday', displayOrder: 3 },
    { name: 'Conditioning B', scheduledDay: 'friday',   displayOrder: 4 }
  ],
  'Powerlifting Prep - 12 Weeks': [
    { name: 'Squat Day',       scheduledDay: 'monday',   displayOrder: 1 },
    { name: 'Bench Day',       scheduledDay: 'tuesday',  displayOrder: 2 },
    { name: 'Deadlift Day',    scheduledDay: 'thursday', displayOrder: 3 },
    { name: 'Accessory Work',  scheduledDay: 'saturday', displayOrder: 4 },
    { name: 'Active Recovery', scheduledDay: 'sunday',   displayOrder: 5 }
  ],
  'Starter Fitness Plan': [
    { name: 'Session A', scheduledDay: 'monday',   displayOrder: 1 },
    { name: 'Session B', scheduledDay: 'thursday', displayOrder: 2 }
  ],
  'Progressive Overload - Phase 1': [
    { name: 'Upper Strength A', scheduledDay: 'monday',   displayOrder: 1 },
    { name: 'Lower Strength A', scheduledDay: 'tuesday',  displayOrder: 2 },
    { name: 'Upper Strength B', scheduledDay: 'thursday', displayOrder: 3 },
    { name: 'Lower Strength B', scheduledDay: 'friday',   displayOrder: 4 }
  ]
}

const PLAN_NAMES = Object.keys(PLAN_SESSIONS)

module.exports = {
  async up(queryInterface, Sequelize) {
    const [planRows] = await queryInterface.sequelize.query(
      `SELECT id, name FROM workout_plans WHERE name IN (${PLAN_NAMES.map(() => '?').join(',')})`,
      { replacements: PLAN_NAMES }
    )
    if (planRows.length !== PLAN_NAMES.length) {
      throw new Error(`Expected ${PLAN_NAMES.length} plans, got ${planRows.length}`)
    }
    const planByName = {}
    planRows.forEach(r => { planByName[r.name] = r.id })

    const now = new Date()
    const sessions = []
    for (const [planName, defs] of Object.entries(PLAN_SESSIONS)) {
      const planId = planByName[planName]
      for (const def of defs) {
        sessions.push({
          workoutPlanId: planId,
          name:          def.name,
          description:   null,
          scheduledDay:  def.scheduledDay,
          displayOrder:  def.displayOrder,
          createdAt:     now,
          updatedAt:     now
        })
      }
    }
    await queryInterface.bulkInsert('workout_sessions', sessions)
  },

  async down(queryInterface, Sequelize) {
    const [planRows] = await queryInterface.sequelize.query(
      `SELECT id FROM workout_plans WHERE name IN (${PLAN_NAMES.map(() => '?').join(',')})`,
      { replacements: PLAN_NAMES }
    )
    if (planRows.length) {
      await queryInterface.bulkDelete('workout_sessions', {
        workoutPlanId: { [Op.in]: planRows.map(r => r.id) }
      })
    }
  }
}
