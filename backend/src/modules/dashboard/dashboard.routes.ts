import { Router } from 'express';
import * as dashboardController from './dashboard.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { Role } from '@absolutsport/shared';

const router = Router();

router.use(authenticate);
router.use(authorize(Role.ADMIN));

router.get('/stats', dashboardController.getStats);

export default router;
