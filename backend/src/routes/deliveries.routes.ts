import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import * as deliveryController from '../controllers/delivery.controller';

const router = Router();

router.use(authMiddleware, requireRole('driver'));

router.get('/available', deliveryController.available);
router.get('/mine', deliveryController.mine);
router.get('/redevance', deliveryController.redevance);
router.post('/:orderId/bid', deliveryController.submitBid);
router.post('/:orderId/accept', deliveryController.accept);
router.get('/:id', deliveryController.getOne);
router.patch('/:id/status', deliveryController.updateStatus);
router.post('/:id/location', deliveryController.updateLocation);
router.post('/:id/confirm-payment', deliveryController.confirmPayment);

export default router;
