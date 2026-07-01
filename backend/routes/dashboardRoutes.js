const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/kpis', protect, dashboardController.getKpis);
router.get('/sales-trend', protect, dashboardController.getSalesTrend);
router.get('/top-products', protect, dashboardController.getTopProducts);
router.get('/category-dist', protect, dashboardController.getCategoryDistribution);
router.get('/order-status', protect, dashboardController.getOrderStatusDist);
router.get('/inventory-health', protect, dashboardController.getInventoryHealth);

module.exports = router;
