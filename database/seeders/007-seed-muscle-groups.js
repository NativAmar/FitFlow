'use strict'

const { Op } = require('sequelize')

const MUSCLE_GROUPS = [
  { name: 'Chest',      description: 'Exercises primarily targeting the pectoral muscles.' },
  { name: 'Back',       description: 'Exercises targeting the latissimus dorsi, rhomboids, and traps.' },
  { name: 'Shoulders',  description: 'Exercises targeting the deltoid muscles.' },
  { name: 'Biceps',     description: 'Exercises targeting the biceps brachii.' },
  { name: 'Triceps',    description: 'Exercises targeting the triceps brachii.' },
  { name: 'Legs',       description: 'Exercises targeting the quadriceps, hamstrings, and glutes.' },
  { name: 'Core',       description: 'Exercises targeting the abdominals and stabilising muscles.' },
  { name: 'Full Body',  description: 'Compound movements that engage multiple major muscle groups.' },
  { name: 'Cardio',     description: 'Cardiovascular exercises to improve endurance and heart health.' },
  { name: 'Other',      description: 'Exercises that do not fit a specific primary muscle group.' }
]

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date()
    await queryInterface.bulkInsert('muscle_groups',
      MUSCLE_GROUPS.map(mg => ({
        name:        mg.name,
        description: mg.description,
        createdAt:   now,
        updatedAt:   now
      }))
    )
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('muscle_groups', {
      name: { [Op.in]: MUSCLE_GROUPS.map(mg => mg.name) }
    })
  }
}
