'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    const [rows] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'admin@fitflow.com' LIMIT 1"
    )
    if (!rows.length) throw new Error('Admin user not found — run users seeder first')

    const now = new Date()
    await queryInterface.bulkInsert('admins', [
      { userId: rows[0].id, createdAt: now, updatedAt: now }
    ])
  },

  async down(queryInterface, Sequelize) {
    const [rows] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'admin@fitflow.com' LIMIT 1"
    )
    if (rows.length) {
      await queryInterface.bulkDelete('admins', { userId: rows[0].id })
    }
  }
}
