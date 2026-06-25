'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('exercises', {
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
      muscleGroupId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'muscle_groups', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
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

    // Index on trainerId for trainer-scoped lookups
    await queryInterface.addIndex('exercises', ['trainerId'], {
      name: 'exercises_trainerId_idx'
    })

    // Index on muscleGroupId for filtering by muscle group
    await queryInterface.addIndex('exercises', ['muscleGroupId'], {
      name: 'exercises_muscleGroupId_idx'
    })

    // Unique constraint: a trainer cannot have two exercises with the same name
    await queryInterface.addIndex('exercises', ['trainerId', 'name'], {
      unique: true,
      name: 'exercises_trainerId_name_unique'
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('exercises')
  }
}
