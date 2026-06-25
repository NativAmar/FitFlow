'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('weekly_workout_logs', {
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
      workoutPlanId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'workout_plans', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      workoutSessionId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'workout_sessions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      weekStartDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      isCompleted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true
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

    await queryInterface.addConstraint('weekly_workout_logs', {
      fields: ['traineeId', 'workoutSessionId', 'weekStartDate'],
      type: 'unique',
      name: 'wwl_unique_trainee_session_week'
    })

    await queryInterface.addIndex('weekly_workout_logs', ['traineeId'], {
      name: 'wwl_traineeId_idx'
    })
    await queryInterface.addIndex('weekly_workout_logs', ['workoutPlanId'], {
      name: 'wwl_workoutPlanId_idx'
    })
    await queryInterface.addIndex('weekly_workout_logs', ['workoutSessionId'], {
      name: 'wwl_workoutSessionId_idx'
    })
    await queryInterface.addIndex('weekly_workout_logs', ['weekStartDate'], {
      name: 'wwl_weekStartDate_idx'
    })
    await queryInterface.addIndex('weekly_workout_logs', ['traineeId', 'weekStartDate'], {
      name: 'wwl_traineeId_weekStartDate_idx'
    })
    await queryInterface.addIndex('weekly_workout_logs', ['traineeId', 'workoutPlanId', 'weekStartDate'], {
      name: 'wwl_traineeId_workoutPlanId_weekStartDate_idx'
    })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('weekly_workout_logs')
  }
}
