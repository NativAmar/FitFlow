'use strict'

const express = require('express')
const authController = require('../controllers/authController')
const requireAuth = require('../middleware/requireAuth')

const router = express.Router()

router.post('/login', authController.login)
router.post('/logout', requireAuth, authController.logout)

module.exports = router
