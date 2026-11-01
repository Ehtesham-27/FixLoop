import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';

const router = Router();

router.get('/profile', userController.getUserProfile);
router.patch('/profile', userController.updateUserProfile);

export default router;

