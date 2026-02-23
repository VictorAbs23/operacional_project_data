import { Router } from 'express';
import * as proposalsController from './proposals.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { Role } from '@absolutsport/shared';

const router = Router();

router.use(authenticate);
router.use(authorize(Role.ADMIN));

router.get('/', proposalsController.list);
router.get('/:id/matrix', proposalsController.getMatrix);
router.get('/:id', proposalsController.getById);
router.patch('/:proposalId/slots/:slotId/admin-fields', proposalsController.updateAdminFields);

export default router;
