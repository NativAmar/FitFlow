'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('nutrition_plans', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      trainerId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'trainers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      traineeId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'trainees', key: 'id' },
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
      generalNotes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('draft', 'active', 'archived'),
        allowNull: false,
        defaultValue: 'draft'
      },
      startDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      endDate: {
        type: Sequelize.DATEONLY,
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

    await queryInterface.addIndex('nutrition_plans', ['trainerId'], {
      name: 'nutrition_plans_trainerId_idx'
    })
    await queryInterface.addIndex('nutrition_plans', ['traineeId'], {
      name: 'nutrition_plans_traineeId_idx'
    })
    await queryInterface.addIndex('nutrition_plans', ['status'], {
      name: 'nutrition_plans_status_idx'
    })
    await queryInterface.addIndex('nutrition_plans', ['traineeId', 'status'], {
      name: 'nutrition_plans_traineeId_status_idx'
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('nutrition_plans')
  }
}
