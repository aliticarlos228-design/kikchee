import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import * as packageController from '../controllers/package.controller';

const router = Router();

router.use(authMiddleware, requireRole('merchant'));

router.get('/linkable-orders', packageController.linkableOrders);
router.post('/ship', packageController.ship);
router.post('/', packageController.create);
router.get('/', packageController.list);
router.get('/:id', packageController.getPackage);
router.patch('/:id/link-order', packageController.linkOrder);
router.patch('/:id/status', packageController.updateStatus);

export default router;
