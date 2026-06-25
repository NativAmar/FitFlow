'use strict'

const { Op } = require('sequelize')

const GOAL_NAMES = [
  'Build Strength',
  'Weight Loss',
  'Endurance',
  'Flexibility',
  'Muscle Gain',
  'General Fitness'
]

const GOAL_DESCRIPTIONS = {
  'Build Strength':  'Increase overall muscular strength through progressive resistance training.',
  'Weight Loss':     'Reduce body weight through a combination of diet and exercise.',
  'Endurance':       'Improve cardiovascular and muscular endurance over sustained effort.',
  'Flexibility':     'Enhance range of motion and reduce injury risk through stretching.',
  'Muscle Gain':     'Build lean muscle mass through hypertrophy-focused training.',
  'General Fitness': 'Achieve and maintain a well-rounded level of physical health.'
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date()
    await queryInterface.bulkInsert('goals',
      GOAL_NAMES.map(name => ({
        name,
        description: GOAL_DESCRIPTIONS[name],
        createdAt: now,
        updatedAt: now
      }))
    )
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('goals', {
      name: { [Op.in]: GOAL_NAMES }
    })
  }
}
