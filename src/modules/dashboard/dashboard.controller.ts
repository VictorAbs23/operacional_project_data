import type { Request, Response, NextFunction } from 'express';
import * as dashboardService from './dashboard.service.js';

export async function getStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await dashboardService.getStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}
