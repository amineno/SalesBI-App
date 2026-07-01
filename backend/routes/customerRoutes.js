const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { protect, authorize, checkPermission } = require('../middleware/authMiddleware');

router.get('/', protect, customerController.getCustomers);
router.get('/:id', protect, customerController.getCustomerById);
router.post('/', protect, authorize('Admin', 'Super Admin', 'Manager', 'Sales Representative', 'User'), customerController.createCustomer);
router.put('/:id', protect, authorize('Admin', 'Super Admin', 'Manager', 'Sales Representative'), customerController.updateCustomer);
router.delete('/:id', protect, authorize('Admin', 'Super Admin', 'Manager'), customerController.deleteCustomer);

module.exports = router;
