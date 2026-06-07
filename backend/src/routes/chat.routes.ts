import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import * as chatController from '../controllers/chat.controller';

const router = Router();

router.use(authMiddleware, requireRole('client', 'driver', 'merchant'));

router.get('/conversations', chatController.conversations);
router.get('/orders/:orderId/messages', chatController.list);
router.post('/orders/:orderId/messages', chatController.send);

export default router;
