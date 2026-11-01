import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// Protect all user profile endpoints with authentication
router.use(authenticate);

router.get('/profile', userController.getUserProfile);
router.patch('/profile', userController.updateUserProfile);

export default router;
