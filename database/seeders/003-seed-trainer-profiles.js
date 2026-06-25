'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    const [rows] = await queryInterface.sequelize.query(
      "SELECT id, email FROM users WHERE email IN ('trainer@fitflow.com', 'trainer2@fitflow.com') ORDER BY email ASC"
    )
    if (rows.length !== 2) throw new Error('Trainer users not found — run users seeder first')

    // email order after ASC sort: trainer2@fitflow.com, trainer@fitflow.com
    const byEmail = {}
    rows.forEach(r => { byEmail[r.email] = r.id })

    const now = new Date()
    await queryInterface.bulkInsert('trainers', [
      { userId: byEmail['trainer@fitflow.com'],  specialization: 'Strength and Conditioning', createdAt: now, updatedAt: now },
      { userId: byEmail['trainer2@fitflow.com'], specialization: 'Weight Loss and Cardio',   createdAt: now, updatedAt: now }
    ])
  },

  async down(queryInterface, Sequelize) {
    const [rows] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email IN ('trainer@fitflow.com', 'trainer2@fitflow.com')"
    )
    if (rows.length) {
      const ids = rows.map(r => r.id)
      await queryInterface.bulkDelete('trainers', {
        userId: { [require('sequelize').Op.in]: ids }
      })
    }
  }
}
