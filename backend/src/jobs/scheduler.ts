/**
 * Cron Scheduler
 * Runs deltaSync every SYNC_INTERVAL_MINUTES (default: 15 min)
 * Runs bulkSync once on first start if DB is empty
 */

import cron from 'node-cron';
import { Property } from '../models/Property';
import { bulkSync, deltaSync } from './propertySync';
import { logger } from '../utils/logger';
import { config } from '../config';

let schedulerStarted = false;

export async function startScheduler(): Promise<void> {
  if (schedulerStarted) return;
  schedulerStarted = true;

  // ── On startup: run bulk if DB is empty ──
  try {
    const count = await Property.countDocuments();
    if (count === 0) {
      logger.info('[Scheduler] DB is empty — triggering initial bulk sync…');
      // Run async, don't block server startup
      bulkSync().catch((e) => logger.error('[Scheduler] Initial bulk sync failed:', e));
    } else {
      logger.info(`[Scheduler] DB has ${count} properties — skipping bulk, running delta…`);
      deltaSync().catch((e) => logger.error('[Scheduler] Startup delta failed:', e));
    }
  } catch (e) {
    logger.error('[Scheduler] Startup check failed:', e);
  }

  // ── Recurring delta sync ──
  const minutes = config.idx.syncIntervalMinutes;
  // node-cron expression: every N minutes
  const cronExpr = `*/${minutes} * * * *`;

  cron.schedule(cronExpr, async () => {
    logger.info(`[Scheduler] ⏰ Delta sync triggered (every ${minutes} min)`);
    try {
      await deltaSync();
    } catch (e) {
      logger.error('[Scheduler] Delta sync error:', e);
    }
  });

  logger.info(`[Scheduler] ✅ Running delta sync every ${minutes} minutes`);
}
