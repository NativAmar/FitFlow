'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('nutrition_meal_items', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      nutritionMealId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'nutrition_meals', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      foodName: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      quantity: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      unit: {
        type: Sequelize.STRING(50),
        allowNull: true
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

    await queryInterface.addIndex('nutrition_meal_items', ['nutritionMealId'], {
      name: 'nutrition_meal_items_nutritionMealId_idx'
    })
    await queryInterface.addIndex('nutrition_meal_items', ['nutritionMealId', 'displayOrder'], {
      name: 'nutrition_meal_items_nutritionMealId_displayOrder_idx'
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('nutrition_meal_items')
  }
}
