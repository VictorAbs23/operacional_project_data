import { Router } from 'express';
import * as formsController from './forms.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

router.use(authenticate);

router.get('/my-proposals', formsController.getClientProposals);
router.get('/slots/:slotId', formsController.getPassengerSlot);
router.post('/slots/:slotId', formsController.savePassengerResponse);
router.get('/instance/:accessId', formsController.getFormInstance);

export default router;
