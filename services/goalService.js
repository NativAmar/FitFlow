'use strict'

function serializeGoal(goal) {
  return {
    id:          goal.id,
    name:        goal.name,
    description: goal.description || null,
    createdAt:   goal.createdAt,
    updatedAt:   goal.updatedAt
  }
}

function serializeAssignment(goal, tg) {
  return {
    id:          goal.id,
    name:        goal.name,
    description: goal.description || null,
    assignment:  tg ? {
      status:     tg.status,
      targetDate: tg.targetDate || null,
      createdAt:  tg.createdAt,
      updatedAt:  tg.updatedAt
    } : null
  }
}

module.exports = { serializeGoal, serializeAssignment }
