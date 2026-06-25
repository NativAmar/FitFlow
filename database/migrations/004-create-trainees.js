'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('trainees', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        unique: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      trainerId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'trainers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      experienceLevel: {
        type: Sequelize.ENUM('beginner', 'intermediate', 'advanced'),
        allowNull: false
      },
      weeklyWorkouts: {
        type: Sequelize.TINYINT.UNSIGNED,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('active', 'paused', 'completed'),
        allowNull: false,
        defaultValue: 'active'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    }, {
      engine: 'InnoDB',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('trainees')
  }
}
