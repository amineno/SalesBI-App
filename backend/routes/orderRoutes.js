const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, authorize, checkPermission } = require('../middleware/authMiddleware');

router.get('/', protect, orderController.getOrders);
router.get('/:id', protect, orderController.getOrderById);
router.post('/', protect, checkPermission('orders.create'), orderController.createOrder);
router.patch('/:id/status', protect, checkPermission('orders.approve'), orderController.updateOrderStatus);
router.post('/:id/payment', protect, orderController.createPaymentSession);
router.get('/:id/invoice', protect, orderController.downloadInvoice);
router.delete('/:id', protect, checkPermission('orders.delete'), orderController.deleteOrder);

module.exports = router;
