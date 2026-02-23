import { Router } from 'express';
import * as exportsController from './exports.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { Role } from '@absolutsport/shared';

const router = Router();

router.use(authenticate);
router.use(authorize(Role.ADMIN));

router.get('/', exportsController.downloadExport);

export default router;
