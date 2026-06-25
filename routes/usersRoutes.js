const express      = require('express')
const usersController = require('../controllers/usersController')
const authController  = require('../controllers/authController')
const requireAuth  = require('../middleware/requireAuth')
const requireRole  = require('../middleware/requireRole')
const validateId   = require('../middleware/validateId')

const router = express.Router()

// /me must be registered before /:id so the literal segment wins
router.get('/me', requireAuth, authController.getMe)

// All remaining users endpoints are admin-only
router.get('/',      requireAuth, requireRole('admin'), usersController.getAll)
router.get('/:id',   requireAuth, requireRole('admin'), validateId(), usersController.getById)
router.post('/',     requireAuth, requireRole('admin'), usersController.create)
router.put('/:id',   requireAuth, requireRole('admin'), validateId(), usersController.update)
router.delete('/:id', requireAuth, requireRole('admin'), validateId(), usersController.remove)

module.exports = router
