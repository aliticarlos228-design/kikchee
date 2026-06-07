import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import * as adminController from '../controllers/admin.controller';

const router = Router();

router.use(authMiddleware, requireRole('admin'));

router.get('/stats', adminController.stats);
router.get('/users', adminController.users);
router.post('/users', adminController.createUser);
router.get('/users/:id', adminController.getUser);
router.patch('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.patch('/users/:id/active', adminController.toggleUserActive);
router.get('/finances', adminController.finances);
router.get('/orders', adminController.orders);
router.get('/deliveries', adminController.deliveries);

export default router;
