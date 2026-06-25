'use strict'

const { Op } = require('sequelize')

// Each trainee gets 3 goals; no (traineeId, goalId) pair is duplicated.
// Trainee 1 (trainee@fitflow.com):  Build Strength, Weight Loss, Endurance
// Trainee 2 (trainee2@fitflow.com): Weight Loss, Flexibility, Muscle Gain
// Trainee 3 (trainee3@fitflow.com): Build Strength, Muscle Gain, General Fitness
const ASSIGNMENTS = [
  { traineeEmail: 'trainee@fitflow.com',  goalNames: ['Build Strength', 'Weight Loss', 'Endurance'] },
  { traineeEmail: 'trainee2@fitflow.com', goalNames: ['Weight Loss', 'Flexibility', 'Muscle Gain'] },
  { traineeEmail: 'trainee3@fitflow.com', goalNames: ['Build Strength', 'Muscle Gain', 'General Fitness'] }
]

module.exports = {
  async up(queryInterface, Sequelize) {
    // Resolve trainee IDs
    const traineeEmails = ASSIGNMENTS.map(a => a.traineeEmail)
    const [userRows] = await queryInterface.sequelize.query(
      `SELECT u.email, t.id AS traineeId FROM trainees t JOIN users u ON u.id = t.userId WHERE u.email IN (${traineeEmails.map(() => '?').join(',')})`,
      { replacements: traineeEmails }
    )
    if (userRows.length !== 3) throw new Error('Trainee profiles not found — run trainee-profiles seeder first')

    const traineeIdByEmail = {}
    userRows.forEach(r => { traineeIdByEmail[r.email] = r.traineeId })

    // Resolve all required goal IDs in one query
    const allGoalNames = [...new Set(ASSIGNMENTS.flatMap(a => a.goalNames))]
    const [goalRows] = await queryInterface.sequelize.query(
      `SELECT id, name FROM goals WHERE name IN (${allGoalNames.map(() => '?').join(',')})`,
      { replacements: allGoalNames }
    )
    if (goalRows.length !== allGoalNames.length) throw new Error('Some goals not found — run goals seeder first')

    const goalIdByName = {}
    goalRows.forEach(r => { goalIdByName[r.name] = r.id })

    const now = new Date()
    const rows = []
    for (const { traineeEmail, goalNames } of ASSIGNMENTS) {
      for (const goalName of goalNames) {
        rows.push({
          traineeId:  traineeIdByEmail[traineeEmail],
          goalId:     goalIdByName[goalName],
          targetDate: null,
          status:     'in-progress',
          createdAt:  now,
          updatedAt:  now
        })
      }
    }

    await queryInterface.bulkInsert('trainee_goals', rows)
  },

  async down(queryInterface, Sequelize) {
    // Resolve trainee IDs, then delete their goal assignments
    const traineeEmails = ASSIGNMENTS.map(a => a.traineeEmail)
    const [userRows] = await queryInterface.sequelize.query(
      `SELECT t.id AS traineeId FROM trainees t JOIN users u ON u.id = t.userId WHERE u.email IN (${traineeEmails.map(() => '?').join(',')})`,
      { replacements: traineeEmails }
    )
    if (userRows.length) {
      const ids = userRows.map(r => r.traineeId)
      await queryInterface.bulkDelete('trainee_goals', {
        traineeId: { [Op.in]: ids }
      })
    }
  }
}
