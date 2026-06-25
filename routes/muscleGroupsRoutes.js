'use strict'

const express                  = require('express')
const muscleGroupsController   = require('../controllers/muscleGroupsController')
const requireAuth              = require('../middleware/requireAuth')

const router = express.Router()

// GET /api/muscle-groups — any authenticated role
router.get('/', requireAuth, muscleGroupsController.getAll)

module.exports = router
