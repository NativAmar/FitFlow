const express       = require('express')
const requireAuth   = require('../middleware/requireAuth')
const settingsController = require('../controllers/settingsController')

const router = express.Router()

router.get('/', requireAuth, settingsController.getSettings)
router.put('/', requireAuth, settingsController.updateSettings)

module.exports = router
