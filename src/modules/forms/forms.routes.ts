import { Router } from 'express';
import * as formsController from './forms.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

router.use(authenticate);

router.get('/my-proposals', formsController.getClientProposals);
router.get('/:accessId', formsController.getFormInstance);
router.get('/slot/:slotId', formsController.getPassengerSlot);
router.post('/slot/:slotId', formsController.savePassengerResponse);

export default router;
