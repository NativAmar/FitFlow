'use strict'

const sequelize = require('../config/database')

const User        = require('./User')
const Admin       = require('./Admin')
const Trainer     = require('./Trainer')
const Trainee     = require('./Trainee')
const Goal        = require('./Goal')
const TraineeGoal = require('./TraineeGoal')
const MuscleGroup            = require('./MuscleGroup')
const Exercise               = require('./Exercise')
const WorkoutPlan            = require('./WorkoutPlan')
const WorkoutSession         = require('./WorkoutSession')
const WorkoutSessionExercise = require('./WorkoutSessionExercise')
const WeeklyWorkoutLog       = require('./WeeklyWorkoutLog')
const NutritionPlan          = require('./NutritionPlan')
const NutritionMeal          = require('./NutritionMeal')
const NutritionMealItem      = require('./NutritionMealItem')
const Notification           = require('./Notification')

// ── User ↔ profile associations ──────────────────────────────────────────────

User.hasOne(Admin, {
  as: 'admin',
  foreignKey: 'userId',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE'
})

User.hasOne(Trainer, {
  as: 'trainerProfile',
  foreignKey: 'userId',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT'
})

User.hasOne(Trainee, {
  as: 'traineeProfile',
  foreignKey: 'userId',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE'
})

Admin.belongsTo(User, {
  as: 'user',
  foreignKey: 'userId',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE'
})

Trainer.belongsTo(User, {
  as: 'user',
  foreignKey: 'userId',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT'
})

Trainee.belongsTo(User, {
  as: 'user',
  foreignKey: 'userId',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE'
})

// ── Trainer ↔ Trainee ────────────────────────────────────────────────────────

Trainer.hasMany(Trainee, {
  as: 'trainees',
  foreignKey: 'trainerId',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT'
})

Trainee.belongsTo(Trainer, {
  as: 'trainer',
  foreignKey: 'trainerId',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT'
})

// ── Trainee ↔ Goal (many-to-many through TraineeGoal) ────────────────────────

Trainee.belongsToMany(Goal, {
  as: 'goals',
  through: TraineeGoal,
  foreignKey: 'traineeId',
  otherKey: 'goalId'
})

Goal.belongsToMany(Trainee, {
  as: 'trainees',
  through: TraineeGoal,
  foreignKey: 'goalId',
  otherKey: 'traineeId'
})

// ── Trainer ↔ Exercise ───────────────────────────────────────────────────────

Trainer.hasMany(Exercise, {
  as: 'exercises',
  foreignKey: 'trainerId',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT'
})

Exercise.belongsTo(Trainer, {
  as: 'trainer',
  foreignKey: 'trainerId',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT'
})

// ── MuscleGroup ↔ Exercise ────────────────────────────────────────────────────

MuscleGroup.hasMany(Exercise, {
  as: 'exercises',
  foreignKey: 'muscleGroupId',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT'
})

Exercise.belongsTo(MuscleGroup, {
  as: 'muscleGroup',
  foreignKey: 'muscleGroupId',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT'
})

// ── Trainer ↔ WorkoutPlan ─────────────────────────────────────────────────────

Trainer.hasMany(WorkoutPlan, {
  as: 'workoutPlans',
  foreignKey: 'trainerId',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT'
})

WorkoutPlan.belongsTo(Trainer, {
  as: 'trainer',
  foreignKey: 'trainerId',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT'
})

// ── Trainee ↔ WorkoutPlan ─────────────────────────────────────────────────────

Trainee.hasMany(WorkoutPlan, {
  as: 'workoutPlans',
  foreignKey: 'traineeId',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE'
})

WorkoutPlan.belongsTo(Trainee, {
  as: 'trainee',
  foreignKey: 'traineeId',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE'
})

// ── WorkoutPlan ↔ WorkoutSession ──────────────────────────────────────────────

WorkoutPlan.hasMany(WorkoutSession, {
  as: 'sessions',
  foreignKey: 'workoutPlanId',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE'
})

WorkoutSession.belongsTo(WorkoutPlan, {
  as: 'workoutPlan',
  foreignKey: 'workoutPlanId',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE'
})

// ── WorkoutSession ↔ WorkoutSessionExercise ───────────────────────────────────

WorkoutSession.hasMany(WorkoutSessionExercise, {
  as: 'exerciseAssignments',
  foreignKey: 'workoutSessionId',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE'
})

WorkoutSessionExercise.belongsTo(WorkoutSession, {
  as: 'workoutSession',
  foreignKey: 'workoutSessionId',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE'
})

// ── Exercise ↔ WorkoutSessionExercise ─────────────────────────────────────────

Exercise.hasMany(WorkoutSessionExercise, {
  as: 'workoutAssignments',
  foreignKey: 'exerciseId',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT'
})

WorkoutSessionExercise.belongsTo(Exercise, {
  as: 'exercise',
  foreignKey: 'exerciseId',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT'
})

// ── Trainee ↔ WeeklyWorkoutLog ────────────────────────────────────────────────

Trainee.hasMany(WeeklyWorkoutLog, {
  foreignKey: 'traineeId',
  as: 'weeklyWorkoutLogs'
})

WeeklyWorkoutLog.belongsTo(Trainee, {
  foreignKey: 'traineeId',
  as: 'trainee'
})

// ── WorkoutPlan ↔ WeeklyWorkoutLog ────────────────────────────────────────────

WorkoutPlan.hasMany(WeeklyWorkoutLog, {
  foreignKey: 'workoutPlanId',
  as: 'weeklyWorkoutLogs'
})

WeeklyWorkoutLog.belongsTo(WorkoutPlan, {
  foreignKey: 'workoutPlanId',
  as: 'workoutPlan'
})

// ── WorkoutSession ↔ WeeklyWorkoutLog ─────────────────────────────────────────

WorkoutSession.hasMany(WeeklyWorkoutLog, {
  foreignKey: 'workoutSessionId',
  as: 'weeklyWorkoutLogs'
})

WeeklyWorkoutLog.belongsTo(WorkoutSession, {
  foreignKey: 'workoutSessionId',
  as: 'workoutSession'
})

// ── Trainer ↔ NutritionPlan ───────────────────────────────────────────────────

Trainer.hasMany(NutritionPlan, {
  foreignKey: 'trainerId',
  as: 'nutritionPlans',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT'
})

NutritionPlan.belongsTo(Trainer, {
  foreignKey: 'trainerId',
  as: 'trainer',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT'
})

// ── Trainee ↔ NutritionPlan ───────────────────────────────────────────────────

Trainee.hasMany(NutritionPlan, {
  foreignKey: 'traineeId',
  as: 'nutritionPlans',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE'
})

NutritionPlan.belongsTo(Trainee, {
  foreignKey: 'traineeId',
  as: 'trainee',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE'
})

// ── NutritionPlan ↔ NutritionMeal ────────────────────────────────────────────

NutritionPlan.hasMany(NutritionMeal, {
  foreignKey: 'nutritionPlanId',
  as: 'meals',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE'
})

NutritionMeal.belongsTo(NutritionPlan, {
  foreignKey: 'nutritionPlanId',
  as: 'nutritionPlan',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE'
})

// ── NutritionMeal ↔ NutritionMealItem ────────────────────────────────────────

NutritionMeal.hasMany(NutritionMealItem, {
  foreignKey: 'nutritionMealId',
  as: 'items',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE'
})

NutritionMealItem.belongsTo(NutritionMeal, {
  foreignKey: 'nutritionMealId',
  as: 'nutritionMeal',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE'
})

// ── User ↔ Notification associations ─────────────────────────────────────────

User.hasMany(Notification, {
  foreignKey: 'recipientUserId',
  as: 'receivedNotifications'
})

Notification.belongsTo(User, {
  foreignKey: 'recipientUserId',
  as: 'recipient'
})

User.hasMany(Notification, {
  foreignKey: 'actorUserId',
  as: 'createdNotifications'
})

Notification.belongsTo(User, {
  foreignKey: 'actorUserId',
  as: 'actor'
})

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  sequelize,
  User,
  Admin,
  Trainer,
  Trainee,
  Goal,
  TraineeGoal,
  MuscleGroup,
  Exercise,
  WorkoutPlan,
  WorkoutSession,
  WorkoutSessionExercise,
  WeeklyWorkoutLog,
  NutritionPlan,
  NutritionMeal,
  NutritionMealItem,
  Notification
}
