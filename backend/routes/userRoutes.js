const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('Admin'));

router.get('/', userController.getUsers);
router.get('/roles', userController.getRoles);
router.post('/', userController.createUser);
router.patch('/:id/role', userController.assignUserRole);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
