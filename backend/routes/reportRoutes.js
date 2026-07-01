const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, authorize, checkPermission } = require('../middleware/authMiddleware');

router.get('/revenue', protect, authorize('Admin'), reportController.getRevenueReport);
router.get('/category', protect, authorize('Admin'), reportController.getCategoryPerformance);
router.get('/inventory-valuation', protect, authorize('Admin'), reportController.getInventoryValuation);
router.get('/bi', protect, authorize('Admin'), reportController.getAdvancedBI);

module.exports = router;
