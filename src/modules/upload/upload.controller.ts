import type { Request, Response, NextFunction } from 'express';
import * as uploadService from './upload.service.js';
import { logAudit } from '../../middleware/auditLogger.js';
import { AuditAction } from '@absolutsport/shared';

export async function uploadProfilePhoto(req: Request, res: Response, next: NextFunction) {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ message: 'No file provided' });
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      res.status(400).json({ message: 'Invalid file type. Use JPEG, PNG, or WebP' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      res.status(400).json({ message: 'File too large. Maximum 5MB' });
      return;
    }

    const url = await uploadService.uploadProfilePhoto(req.user!.id, {
      buffer: file.buffer,
      mimetype: file.mimetype,
      originalname: file.originalname,
    });

    await logAudit(req, {
      action: AuditAction.PHOTO_UPLOADED,
      entity: 'user',
      entityId: req.user!.id,
    });

    res.json({ url });
  } catch (err) {
    next(err);
  }
}
