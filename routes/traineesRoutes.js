'use strict'

const express                   = require('express')
const traineesController        = require('../controllers/traineesController')
const traineeGoalsController    = require('../controllers/traineeGoalsController')
const workoutPlansController    = require('../controllers/workoutPlansController')
const workoutTrackingController = require('../controllers/workoutTrackingController')
const nutritionPlansController  = require('../controllers/nutritionPlansController')
const requireAuth               = require('../middleware/requireAuth')
const requireRole               = require('../middleware/requireRole')
const validateId                = require('../middleware/validateId')

const router = express.Router()

// All routes below require a valid JWT (requireAuth sets req.user).
// requireRole checks req.user.role — never x-user-role.

// GET /api/trainees/me  — must be before /:id so "me" is not parsed as an ID
router.get('/me',
  requireAuth,
  requireRole('trainee'),
  traineesController.getMe
)

// Workout plan sub-routes — must be before /:id to avoid shadowing
// Trainee: self-service
router.get('/me/workout-plans',
  requireAuth,
  requireRole('trainee'),
  workoutPlansController.getMyPlans
)

// Workout tracking sub-routes — must be before /:id to avoid shadowing
// Trainee: self-service read
router.get('/me/workout-tracking',
  requireAuth,
  requireRole('trainee'),
  workoutTrackingController.getMyTracking
)

// Trainee: self-service update
router.put('/me/workout-tracking/:workoutSessionId',
  requireAuth,
  requireRole('trainee'),
  validateId('workoutSessionId'),
  workoutTrackingController.updateMyTracking
)

router.get('/me/workout-plan/active',
  requireAuth,
  requireRole('trainee'),
  workoutPlansController.getMyActivePlan
)

// Nutrition plan sub-routes — trainee self-service (must be before /:id)
router.get('/me/nutrition-plans',
  requireAuth,
  requireRole('trainee'),
  nutritionPlansController.getMyPlans
)

router.get('/me/nutrition-plan/active',
  requireAuth,
  requireRole('trainee'),
  nutritionPlansController.getMyActivePlan
)

// Admin / Trainer: per-trainee
router.get('/:id/workout-plans',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  workoutPlansController.getTraineePlans
)

router.get('/:id/workout-plan/active',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  workoutPlansController.getTraineeActivePlan
)

router.post('/:id/workout-plans',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  workoutPlansController.createForTrainee
)

// Nutrition plan sub-routes — admin/trainer per-trainee (must be before generic /:id)
router.get('/:id/nutrition-plans',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  nutritionPlansController.getTraineePlans
)

router.get('/:id/nutrition-plan/active',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  nutritionPlansController.getTraineeActivePlan
)

router.post('/:id/nutrition-plans',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  nutritionPlansController.createForTrainee
)

// Trainer/Admin: read a specific trainee's weekly tracking
router.get('/:id/workout-tracking',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  workoutTrackingController.getTraineeTracking
)

// Goal assignment sub-routes — must be before /:id to avoid shadowing
router.get('/:id/goals',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  traineeGoalsController.listGoals
)

router.post('/:id/goals',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  traineeGoalsController.assignGoal
)

router.patch('/:id/goals/:goalId',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  traineeGoalsController.updateGoal
)

router.delete('/:id/goals/:goalId',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  traineeGoalsController.removeGoal
)

// GET /api/trainees
router.get('/',
  requireAuth,
  requireRole('admin', 'trainer'),
  traineesController.getAll
)

// GET /api/trainees/:id
router.get('/:id',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  traineesController.getById
)

// POST /api/trainees
router.post('/',
  requireAuth,
  requireRole('admin', 'trainer'),
  traineesController.create
)

// PUT /api/trainees/:id
router.put('/:id',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  traineesController.update
)

// PATCH /api/trainees/:id/status
router.patch('/:id/status',
  requireAuth,
  requireRole('admin', 'trainer'),
  validateId(),
  traineesController.updateStatus
)

// PATCH /api/trainees/:id/trainer  — admin only
router.patch('/:id/trainer',
  requireAuth,
  requireRole('admin'),
  validateId(),
  traineesController.reassignTrainer
)

// DELETE /api/trainees/:id  — admin only
router.delete('/:id',
  requireAuth,
  requireRole('admin'),
  validateId(),
  traineesController.remove
)

module.exports = router
