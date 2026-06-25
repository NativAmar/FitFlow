'use strict'

const { Admin, Trainer, Trainee } = require('../models/index')

/**
 * Sequelize include array for User queries.
 * Loads all three possible role profiles as LEFT JOINs.
 * passwordHash is excluded at the parent query level, not here.
 */
function userIncludes() {
  return [
    {
      model: Admin,
      as: 'admin',
      required: false,
      attributes: ['id']
    },
    {
      model: Trainer,
      as: 'trainerProfile',
      required: false,
      attributes: ['id', 'specialization']
    },
    {
      model: Trainee,
      as: 'traineeProfile',
      required: false,
      attributes: ['id', 'trainerId', 'experienceLevel', 'weeklyWorkouts', 'status', 'notes']
    }
  ]
}

/**
 * Safe public DTO for a User Sequelize instance with associations loaded.
 * Never includes passwordHash.
 * Trainee.status is exposed as trainingStatus to avoid confusion with User.status.
 */
function serializeUser(user) {
  const adm = user.admin
  const trp = user.trainerProfile
  const tnp = user.traineeProfile

  let profile = null
  if (adm) {
    profile = { id: adm.id, type: 'admin' }
  } else if (trp) {
    profile = { id: trp.id, type: 'trainer', specialization: trp.specialization || null }
  } else if (tnp) {
    profile = {
      id:              tnp.id,
      type:            'trainee',
      trainerId:       tnp.trainerId,
      experienceLevel: tnp.experienceLevel,
      weeklyWorkouts:  tnp.weeklyWorkouts,
      trainingStatus:  tnp.status,
      notes:           tnp.notes || null
    }
  }

  return {
    id:          user.id,
    firstName:   user.firstName,
    lastName:    user.lastName,
    email:       user.email,
    role:        user.role,
    status:      user.status,
    theme:       user.theme,
    displayName: user.displayName || `${user.firstName} ${user.lastName}`,
    createdAt:   user.createdAt,
    updatedAt:   user.updatedAt,
    profile
  }
}

module.exports = { userIncludes, serializeUser }
