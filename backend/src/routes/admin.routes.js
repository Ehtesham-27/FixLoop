import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';
import { createTechnicianSchema } from '../validators/admin.validators.js';

const router = Router();

// Protect all admin endpoints with authentication and ADMIN role check
router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/users', adminController.getAdminUsers);
router.get('/overview', adminController.getAdminOverview);
router.post('/technicians', validate(createTechnicianSchema), adminController.createTechnician);

export default router;
