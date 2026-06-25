'use strict'

const { Trainer } = require('../models/index')

function serializeMuscleGroup(mg) {
  return {
    id:          mg.id,
    name:        mg.name,
    description: mg.description || null
  }
}

function serializeExercise(exercise) {
  const mg = exercise.muscleGroup

  const result = {
    id:           exercise.id,
    trainerId:    exercise.trainerId,
    name:         exercise.name,
    description:  exercise.description,
    muscleGroup:  mg ? serializeMuscleGroup(mg) : null,
    createdAt:    exercise.createdAt,
    updatedAt:    exercise.updatedAt
  }

  // Optional safe trainer identity — only populated when the association is loaded
  if (exercise.trainer) {
    const t = exercise.trainer
    const u = t.user
    result.trainer = u ? {
      id:          t.id,
      firstName:   u.firstName,
      lastName:    u.lastName,
      displayName: u.displayName || `${u.firstName} ${u.lastName}`
    } : { id: t.id }
  }

  return result
}

/**
 * Find a Trainer profile by the authenticated user's id.
 * Returns null if no Trainer profile exists for that user.
 */
async function findTrainerByUserId(userId) {
  return Trainer.findOne({ where: { userId } })
}

module.exports = { serializeMuscleGroup, serializeExercise, findTrainerByUserId }
