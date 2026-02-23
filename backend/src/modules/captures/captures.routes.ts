import { Router } from 'express';
import * as capturesController from './captures.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { Role } from '@absolutsport/shared';

const router = Router();

router.use(authenticate);

router.post('/dispatch', authorize(Role.ADMIN), capturesController.dispatch);
router.get('/:accessId/schema', capturesController.getSchema);

export default router;
