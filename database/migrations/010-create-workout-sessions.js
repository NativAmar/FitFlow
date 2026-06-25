'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('workout_sessions', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      workoutPlanId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'workout_plans', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      scheduledDay: {
        type: Sequelize.ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
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

    await queryInterface.addIndex('workout_sessions', ['workoutPlanId'], {
      name: 'workout_sessions_workoutPlanId_idx'
    })
    await queryInterface.addIndex('workout_sessions', ['workoutPlanId', 'displayOrder'], {
      name: 'workout_sessions_workoutPlanId_displayOrder_idx'
    })
    await queryInterface.addIndex('workout_sessions', ['scheduledDay'], {
      name: 'workout_sessions_scheduledDay_idx'
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('workout_sessions')
  }
}
