import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Protect all admin endpoints with authentication and ADMIN role check
router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/users', adminController.getAdminUsers);
router.get('/overview', adminController.getAdminOverview);

export default router;
