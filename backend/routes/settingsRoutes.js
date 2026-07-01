const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.get('/', settingsController.getSettings); // Public/All users
router.patch('/', protect, checkPermission('settings.manage'), settingsController.updateSettings);

module.exports = router;
