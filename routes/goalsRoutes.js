'use strict'

const express         = require('express')
const goalsController = require('../controllers/goalsController')
const requireAuth     = require('../middleware/requireAuth')
const requireRole     = require('../middleware/requireRole')
const validateId      = require('../middleware/validateId')

const router = express.Router()

// Any authenticated role may read the goal catalog
router.get('/',     requireAuth, goalsController.getAll)
router.get('/:id',  requireAuth, validateId(), goalsController.getById)

// Only admins may mutate the catalog
router.post('/',     requireAuth, requireRole('admin'), goalsController.create)
router.put('/:id',   requireAuth, requireRole('admin'), validateId(), goalsController.update)
router.delete('/:id', requireAuth, requireRole('admin'), validateId(), goalsController.remove)

module.exports = router
