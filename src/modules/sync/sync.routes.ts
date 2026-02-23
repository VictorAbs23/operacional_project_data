import { Router } from 'express';
import * as syncController from './sync.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { Role } from '@absolutsport/shared';

const router = Router();

router.use(authenticate);
router.use(authorize(Role.ADMIN));

router.post('/trigger', syncController.triggerSync);
router.get('/logs', syncController.getSyncLogs);

export default router;
