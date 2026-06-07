import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import * as orderController from '../controllers/order.controller';

const router = Router();

router.use(authMiddleware, requireRole('client'));

router.post('/estimate', orderController.estimate);
router.post('/', orderController.create);
router.get('/', orderController.listMine);
router.get('/:id/bids', orderController.listBids);
router.post('/:id/bids/:bidId/select', orderController.selectBid);
router.get('/:id/track', orderController.track);
router.post('/:id/cancel', orderController.cancel);
router.get('/:id', orderController.getOne);

export default router;
