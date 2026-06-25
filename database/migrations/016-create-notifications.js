'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      recipientUserId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      actorUserId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      type: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(180),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      readAt: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex('notifications', ['recipientUserId'], {
      name: 'notifications_recipientUserId_idx'
    })
    await queryInterface.addIndex('notifications', ['actorUserId'], {
      name: 'notifications_actorUserId_idx'
    })
    await queryInterface.addIndex('notifications', ['isRead'], {
      name: 'notifications_isRead_idx'
    })
    await queryInterface.addIndex('notifications', ['createdAt'], {
      name: 'notifications_createdAt_idx'
    })
    await queryInterface.addIndex('notifications', ['recipientUserId', 'isRead'], {
      name: 'notifications_recipientUserId_isRead_idx'
    })
    await queryInterface.addIndex('notifications', ['recipientUserId', 'createdAt'], {
      name: 'notifications_recipientUserId_createdAt_idx'
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('notifications')
  }
}
