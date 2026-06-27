'use strict'

const { Op } = require('sequelize')

// 4 meals per plan: breakfast, pre-workout, lunch, dinner
const PLAN_MEALS = {
  'Bulking Basics': [
    { name: 'Morning Breakfast',    mealType: 'breakfast',    scheduledTime: '07:30:00', displayOrder: 1, instructions: 'Eat within 30 minutes of waking.' },
    { name: 'Pre-Workout Fuel',     mealType: 'pre-workout',  scheduledTime: '11:00:00', displayOrder: 2, instructions: 'Consume 60 minutes before training.' },
    { name: 'Post-Training Lunch',  mealType: 'post-workout', scheduledTime: '13:30:00', displayOrder: 3, instructions: 'Prioritise protein and fast carbs immediately after training.' },
    { name: 'High-Calorie Dinner',  mealType: 'dinner',       scheduledTime: '19:00:00', displayOrder: 4, instructions: 'Largest meal of the day — hit remaining calorie target here.' }
  ],
  'Lean Muscle Nutrition': [
    { name: 'Balanced Breakfast',   mealType: 'breakfast',    scheduledTime: '07:00:00', displayOrder: 1, instructions: null },
    { name: 'Pre-Workout Snack',    mealType: 'pre-workout',  scheduledTime: '12:00:00', displayOrder: 2, instructions: 'Light carbs and protein, nothing too heavy.' },
    { name: 'Recovery Lunch',       mealType: 'post-workout', scheduledTime: '14:00:00', displayOrder: 3, instructions: null },
    { name: 'Lean Dinner',          mealType: 'dinner',       scheduledTime: '19:30:00', displayOrder: 4, instructions: 'Keep fats moderate. Avoid high-fat and high-carb combinations.' }
  ],
  'Performance Fuel Plan': [
    { name: 'Power Breakfast',      mealType: 'breakfast',    scheduledTime: '06:30:00', displayOrder: 1, instructions: 'High carb, moderate protein to fuel the day.' },
    { name: 'Mid-Morning Snack',    mealType: 'morning-snack', scheduledTime: '10:00:00', displayOrder: 2, instructions: null },
    { name: 'Performance Lunch',    mealType: 'lunch',        scheduledTime: '13:00:00', displayOrder: 3, instructions: null },
    { name: 'Recovery Dinner',      mealType: 'dinner',       scheduledTime: '19:00:00', displayOrder: 4, instructions: 'High protein to support overnight muscle repair.' }
  ],
  'Foundation Nutrition': [
    { name: 'Simple Breakfast',     mealType: 'breakfast',    scheduledTime: '08:00:00', displayOrder: 1, instructions: 'Keep it simple and consistent every day.' },
    { name: 'Light Lunch',          mealType: 'lunch',        scheduledTime: '12:30:00', displayOrder: 2, instructions: null },
    { name: 'Afternoon Snack',      mealType: 'afternoon-snack', scheduledTime: '15:30:00', displayOrder: 3, instructions: null },
    { name: 'Balanced Dinner',      mealType: 'dinner',       scheduledTime: '18:30:00', displayOrder: 4, instructions: null }
  ],
  'Maintenance & Performance': [
    { name: 'Training Day Breakfast', mealType: 'breakfast',   scheduledTime: '07:00:00', displayOrder: 1, instructions: 'Adjust carb quantity based on whether today is a training day.' },
    { name: 'Pre-Workout Meal',       mealType: 'pre-workout', scheduledTime: '11:30:00', displayOrder: 2, instructions: 'Higher carbs on strength days, skip on rest days.' },
    { name: 'Lunch',                  mealType: 'lunch',       scheduledTime: '14:00:00', displayOrder: 3, instructions: null },
    { name: 'Dinner',                 mealType: 'dinner',      scheduledTime: '19:00:00', displayOrder: 4, instructions: null }
  ],
  "Athlete's Competition Diet": [
    { name: 'Competition Breakfast',  mealType: 'breakfast',    scheduledTime: '06:00:00', displayOrder: 1, instructions: 'Early and light. Focus on complex carbs and protein.' },
    { name: 'Pre-Lift Meal',          mealType: 'pre-workout',  scheduledTime: '10:00:00', displayOrder: 2, instructions: 'Timed 90 minutes before main lift. No new foods on competition day.' },
    { name: 'Between Attempts Snack', mealType: 'custom',       scheduledTime: '13:00:00', displayOrder: 3, instructions: 'Fast-digesting carbs only. Keep gut calm.' },
    { name: 'Recovery Dinner',        mealType: 'dinner',       scheduledTime: '19:30:00', displayOrder: 4, instructions: 'High protein recovery meal post-competition or training.' }
  ]
}

const PLAN_NAMES = Object.keys(PLAN_MEALS)

module.exports = {
  async up(queryInterface, Sequelize) {
    const [planRows] = await queryInterface.sequelize.query(
      `SELECT id, name FROM nutrition_plans WHERE name IN (${PLAN_NAMES.map(() => '?').join(',')})`,
      { replacements: PLAN_NAMES }
    )
    if (planRows.length !== PLAN_NAMES.length) {
      throw new Error(`Expected ${PLAN_NAMES.length} nutrition plans, got ${planRows.length}`)
    }
    const planByName = {}
    planRows.forEach(r => { planByName[r.name] = r.id })

    const now = new Date()
    const meals = []
    for (const [planName, defs] of Object.entries(PLAN_MEALS)) {
      const planId = planByName[planName]
      for (const def of defs) {
        meals.push({
          nutritionPlanId: planId,
          name:            def.name,
          mealType:        def.mealType,
          dayOfWeek:       null,
          scheduledTime:   def.scheduledTime,
          instructions:    def.instructions,
          displayOrder:    def.displayOrder,
          createdAt:       now,
          updatedAt:       now
        })
      }
    }
    await queryInterface.bulkInsert('nutrition_meals', meals)
  },

  async down(queryInterface, Sequelize) {
    const [planRows] = await queryInterface.sequelize.query(
      `SELECT id FROM nutrition_plans WHERE name IN (${PLAN_NAMES.map(() => '?').join(',')})`,
      { replacements: PLAN_NAMES }
    )
    if (planRows.length) {
      await queryInterface.bulkDelete('nutrition_meals', {
        nutritionPlanId: { [Op.in]: planRows.map(r => r.id) }
      })
    }
  }
}
