import { Router } from 'express';
import multer from 'multer';
import * as ctrl from '../controllers/venueController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024, files: 1 } });

const router = Router();
router.use(authenticate, requireRole('owner'));

router.get('/venues', asyncHandler(ctrl.listMine));
router.post('/venues', asyncHandler(ctrl.createVenue));
router.patch('/venues/:id', asyncHandler(ctrl.updateVenue));
router.post('/venues/:id/image', upload.single('image'), asyncHandler(ctrl.uploadImage));
router.get('/venues/:id/grounds', asyncHandler(ctrl.listGrounds));
router.post('/venues/:id/grounds', asyncHandler(ctrl.createGround));
router.patch('/grounds/:id', asyncHandler(ctrl.updateGround));

export default router;