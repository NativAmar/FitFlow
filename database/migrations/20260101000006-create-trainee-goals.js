'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('trainee_goals', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      traineeId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'trainees', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      goalId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'goals', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      targetDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('in-progress', 'achieved', 'dropped'),
        allowNull: false,
        defaultValue: 'in-progress'
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

    await queryInterface.addIndex('trainee_goals', ['traineeId', 'goalId'], {
      unique: true,
      name: 'trainee_goals_traineeId_goalId_unique'
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('trainee_goals')
  }
}
