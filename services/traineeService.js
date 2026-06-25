'use strict'

const { User, Trainer, Goal, TraineeGoal } = require('../models/index')

/**
 * Standard Sequelize include array for trainee queries.
 * Excludes passwordHash at the attribute level on every User include.
 */
function traineeIncludes() {
  return [
    {
      model: User,
      as: 'user',
      attributes: ['id', 'firstName', 'lastName', 'email', 'status', 'theme', 'displayName']
    },
    {
      model: Trainer,
      as: 'trainer',
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    },
    {
      model: Goal,
      as: 'goals',
      through: { model: TraineeGoal, attributes: ['status', 'targetDate'] }
    }
  ]
}

/**
 * Safe public DTO for a Trainee Sequelize instance with associations loaded.
 * Never includes passwordHash.
 */
function serializeTrainee(trainee) {
  const u  = trainee.user
  const tr = trainee.trainer
  const goals = trainee.goals || []

  return {
    id:              trainee.id,
    experienceLevel: trainee.experienceLevel,
    weeklyWorkouts:  trainee.weeklyWorkouts,
    status:          trainee.status,
    notes:           trainee.notes,
    createdAt:       trainee.createdAt,
    updatedAt:       trainee.updatedAt,
    user: u ? {
      id:          u.id,
      firstName:   u.firstName,
      lastName:    u.lastName,
      email:       u.email,
      status:      u.status,
      theme:       u.theme,
      displayName: u.displayName || `${u.firstName} ${u.lastName}`
    } : null,
    trainer: tr ? {
      id:             tr.id,
      specialization: tr.specialization,
      user: tr.user ? {
        id:        tr.user.id,
        firstName: tr.user.firstName,
        lastName:  tr.user.lastName,
        email:     tr.user.email
      } : null
    } : null,
    goals: goals.map(g => ({
      id:          g.id,
      name:        g.name,
      description: g.description,
      goalStatus:  g.TraineeGoal ? g.TraineeGoal.status    : null,
      targetDate:  g.TraineeGoal ? g.TraineeGoal.targetDate : null
    }))
  }
}

/**
 * Find a Trainer profile by the authenticated user's id.
 * Returns null if no Trainer profile exists for that user.
 */
async function findTrainerByUserId(userId) {
  return Trainer.findOne({
    where: { userId },
    include: [{ model: User, as: 'user', attributes: ['id', 'status'] }]
  })
}

module.exports = { traineeIncludes, serializeTrainee, findTrainerByUserId }
