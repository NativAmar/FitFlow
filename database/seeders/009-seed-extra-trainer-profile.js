'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    const [[user]] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'trainer3@fitflow.com' LIMIT 1"
    )
    if (!user) throw new Error('trainer3 user not found — run 008-seed-extra-users first')

    const now = new Date()
    await queryInterface.bulkInsert('trainers', [
      {
        userId:         user.id,
        specialization: 'Strength & Conditioning',
        createdAt:      now,
        updatedAt:      now
      }
    ])
  },

  async down(queryInterface, Sequelize) {
    const [[user]] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'trainer3@fitflow.com' LIMIT 1"
    )
    if (user) {
      await queryInterface.bulkDelete('trainers', { userId: user.id })
    }
  }
}
