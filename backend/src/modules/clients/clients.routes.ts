import { Router } from 'express';
import * as clientsController from './clients.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { Role } from '@absolutsport/shared';

const router = Router();

router.use(authenticate);
router.use(authorize(Role.ADMIN));

router.get('/', clientsController.list);
router.get('/:id', clientsController.getById);
router.post('/:id/reset-password', clientsController.resetPassword);
router.post('/:id/deactivate', clientsController.deactivate);
router.delete('/:id', clientsController.deleteClient);

export default router;
