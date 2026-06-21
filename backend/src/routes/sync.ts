/**
 * Sync API Routes
 * GET  /api/sync/status      — current sync state
 * POST /api/sync/bulk        — trigger full re-sync (admin only)
 * POST /api/sync/delta       — trigger delta sync now (admin only)
 */

import { Router, type Request, type Response } from 'express';
import { protect, authorize } from '../middleware/auth';
import { UserRole } from '../types';
import { SyncState } from '../models/SyncState';
import { bulkSync, deltaSync } from '../jobs/propertySync';
import { logger } from '../utils/logger';

const router = Router();

/* GET /api/sync/status — public so dashboard can display it */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const state = await SyncState.findOne({ provider: 'simplyrets' });
    res.json({
      success: true,
      data: state ?? {
        provider: 'simplyrets',
        status: 'never_run',
        totalSynced: 0,
        totalUpserted: 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch sync status' });
  }
});

/* POST /api/sync/bulk — admin only */
router.post('/bulk', protect, authorize(UserRole.ADMIN, UserRole.BROKER), async (_req: Request, res: Response) => {
  logger.info('[API] Manual bulk sync triggered');
  // Fire-and-forget — client can poll /status
  bulkSync().catch((e) => logger.error('[API] Bulk sync error:', e));
  res.json({ success: true, message: 'Bulk sync started. Poll /api/sync/status for progress.' });
});

/* POST /api/sync/delta — admin only */
router.post('/delta', protect, authorize(UserRole.ADMIN, UserRole.BROKER), async (_req: Request, res: Response) => {
  logger.info('[API] Manual delta sync triggered');
  deltaSync().catch((e) => logger.error('[API] Delta sync error:', e));
  res.json({ success: true, message: 'Delta sync started. Poll /api/sync/status for progress.' });
});

export default router;
