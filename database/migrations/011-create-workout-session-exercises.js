'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('workout_session_exercises', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      workoutSessionId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'workout_sessions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      exerciseId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'exercises', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      sets: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },
      repetitions: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true
      },
      durationSeconds: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true
      },
      restSeconds: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      displayOrder: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
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

    await queryInterface.addIndex('workout_session_exercises', ['workoutSessionId'], {
      name: 'wse_workoutSessionId_idx'
    })
    await queryInterface.addIndex('workout_session_exercises', ['exerciseId'], {
      name: 'wse_exerciseId_idx'
    })
    await queryInterface.addIndex('workout_session_exercises', ['workoutSessionId', 'displayOrder'], {
      name: 'wse_workoutSessionId_displayOrder_idx'
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('workout_session_exercises')
  }
}
