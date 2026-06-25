'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('nutrition_meals', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      nutritionPlanId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'nutrition_plans', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      mealType: {
        type: Sequelize.ENUM(
          'breakfast',
          'morning-snack',
          'lunch',
          'afternoon-snack',
          'dinner',
          'evening-snack',
          'pre-workout',
          'post-workout',
          'custom'
        ),
        allowNull: false
      },
      dayOfWeek: {
        type: Sequelize.ENUM(
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
          'sunday'
        ),
        allowNull: true
      },
      scheduledTime: {
        type: Sequelize.TIME,
        allowNull: true
      },
      instructions: {
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

    await queryInterface.addIndex('nutrition_meals', ['nutritionPlanId'], {
      name: 'nutrition_meals_nutritionPlanId_idx'
    })
    await queryInterface.addIndex('nutrition_meals', ['nutritionPlanId', 'displayOrder'], {
      name: 'nutrition_meals_nutritionPlanId_displayOrder_idx'
    })
    await queryInterface.addIndex('nutrition_meals', ['dayOfWeek'], {
      name: 'nutrition_meals_dayOfWeek_idx'
    })
    await queryInterface.addIndex('nutrition_meals', ['mealType'], {
      name: 'nutrition_meals_mealType_idx'
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('nutrition_meals')
  }
}
