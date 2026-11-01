import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';

const router = Router();

router.get('/users', adminController.getAdminUsers);
router.get('/overview', adminController.getAdminOverview);

export default router;

