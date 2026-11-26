import { Router } from 'express';
import * as ctrl from '../controllers/venueController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();
router.get('/', asyncHandler(ctrl.listPublic));
router.get('/:id', asyncHandler(ctrl.getPublic));
export default router;