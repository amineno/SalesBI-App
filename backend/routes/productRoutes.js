const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, authorize, checkPermission } = require('../middleware/authMiddleware');
const upload = require('../utils/upload');

router.get('/', protect, productController.getProducts);
router.post('/', protect, authorize('Admin'), productController.createProduct);
router.post('/:id/image', protect, authorize('Admin'), upload.single('image'), productController.uploadProductImage);
router.put('/:id', protect, authorize('Admin'), productController.updateProduct);
router.post('/bulk-delete', protect, authorize('Admin'), productController.bulkDeleteProducts);
router.delete('/:id', protect, authorize('Admin'), productController.deleteProduct);

module.exports = router;
