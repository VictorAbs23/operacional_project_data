import { Router } from 'express';
import multer from 'multer';
import * as uploadController from './upload.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.use(authenticate);
router.post('/profile-photo', upload.single('photo'), uploadController.uploadProfilePhoto);

export default router;
