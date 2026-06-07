import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import * as geocodingController from '../controllers/geocoding.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', geocodingController.geocodeSearch);
router.get('/reverse', geocodingController.geocodeReverse);

export default router;
