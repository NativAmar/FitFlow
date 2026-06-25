'use strict'

const { User, Trainee } = require('../models/index')

function trainerIncludes() {
  return [
    {
      model: User,
      as: 'user',
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'status', 'theme', 'displayName']
    },
    {
      model: Trainee,
      as: 'trainees',
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'displayName']
        }
      ]
    }
  ]
}

function serializeTrainer(trainer) {
  const u       = trainer.user
  const trainees = trainer.trainees || []

  return {
    id:             trainer.id,
    specialization: trainer.specialization,
    accountStatus:  u ? u.status : null,
    createdAt:      trainer.createdAt,
    updatedAt:      trainer.updatedAt,
    user: u ? {
      id:          u.id,
      firstName:   u.firstName,
      lastName:    u.lastName,
      email:       u.email,
      role:        u.role,
      status:      u.status,
      theme:       u.theme,
      displayName: u.displayName || `${u.firstName} ${u.lastName}`
    } : null,
    traineeCount: trainees.length,
    trainees: trainees.map(t => {
      const tu = t.user
      return {
        id:              t.id,
        experienceLevel: t.experienceLevel,
        weeklyWorkouts:  t.weeklyWorkouts,
        status:          t.status,
        notes:           t.notes,
        user: tu ? {
          id:          tu.id,
          firstName:   tu.firstName,
          lastName:    tu.lastName,
          email:       tu.email,
          displayName: tu.displayName || `${tu.firstName} ${tu.lastName}`
        } : null
      }
    })
  }
}

module.exports = { trainerIncludes, serializeTrainer }
