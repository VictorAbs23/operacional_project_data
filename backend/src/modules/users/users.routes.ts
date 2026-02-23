import { Router } from 'express';
import * as usersController from './users.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { Role, createUserSchema, updateUserSchema } from '@absolutsport/shared';

const router = Router();

router.use(authenticate);
router.use(authorize(Role.MASTER));

router.get('/', usersController.list);
router.get('/:id', usersController.getById);
router.post('/', validate(createUserSchema), usersController.create);
router.patch('/:id', validate(updateUserSchema), usersController.update);
router.post('/:id/deactivate', usersController.deactivate);
router.post('/:id/reset-password', usersController.resetPassword);
router.delete('/:id', usersController.deleteUser);

export default router;
