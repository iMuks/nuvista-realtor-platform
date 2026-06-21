/**
 * Property Sync Worker
 * ─────────────────────────────────────────────────────────
 * Phase 1  bulkSync()   — one-time full load from IDX feed
 * Phase 2  deltaSync()  — incremental (only modified since last run)
 *
 * Both phases upsert into MongoDB using mlsNumber as the key,
 * so re-runs are always safe / idempotent.
 */

import { Property } from '../models/Property';
import { SyncState } from '../models/SyncState';
import { idxClient } from '../services/idxClient';
import { mapSimplyRETSToProperty } from '../services/propertyMapper';
import { logger } from '../utils/logger';
import { getIO } from '../services/socketService';

const PROVIDER = 'simplyrets';

/* ─── helpers ─── */

async function getOrCreateState() {
  let state = await SyncState.findOne({ provider: PROVIDER });
  if (!state) {
    state = await SyncState.create({ provider: PROVIDER, status: 'idle', totalSynced: 0, totalUpserted: 0, totalErrors: 0 });
  }
  return state;
}

function emitSyncEvent(event: string, data: object) {
  try {
    getIO().emit(`sync:${event}`, { provider: PROVIDER, ...data });
  } catch {
    // socket not initialised yet (tests / early startup)
  }
}

/* ─── Bulk sync (run once or on demand) ─── */

export async function bulkSync(): Promise<void> {
  const state = await getOrCreateState();
  if (state.status === 'running') {
    logger.warn('[Sync] Already running — skipping bulkSync');
    return;
  }

  const start = Date.now();
  await state.updateOne({ status: 'running', type: 'bulk', lastRunAt: new Date() });
  emitSyncEvent('started', { type: 'bulk' });
  logger.info('[Sync] ▶ Bulk sync started');

  let upserted = 0;
  let errors   = 0;

  try {
    const listings = await idxClient.fetchAll({ status: ['Active', 'Pending', 'Closed'] });

    // Process in batches of 50
    for (let i = 0; i < listings.length; i += 50) {
      const chunk = listings.slice(i, i + 50);
      const ops   = chunk.map((raw) => {
        try {
          const doc = mapSimplyRETSToProperty(raw);
          return {
            updateOne: {
              filter:  { mlsNumber: doc.mlsNumber },
              update:  { $set: doc },
              upsert:  true,
            },
          };
        } catch (e) {
          errors++;
          logger.error('[Sync] Map error', { mlsId: raw.mlsId, err: (e as Error).message });
          return null;
        }
      }).filter(Boolean) as object[];

      if (ops.length) {
        const result = await Property.bulkWrite(ops as Parameters<typeof Property.bulkWrite>[0]);
        upserted += result.upsertedCount + result.modifiedCount;
      }

      emitSyncEvent('progress', { synced: i + chunk.length, total: listings.length, upserted });
    }

    const watermark = new Date();
    await state.updateOne({
      status: 'success',
      lastSuccessAt: watermark,
      lastSyncTimestamp: watermark,
      totalSynced:   (state.totalSynced || 0) + listings.length,
      totalUpserted: (state.totalUpserted || 0) + upserted,
      totalErrors:   (state.totalErrors || 0) + errors,
      durationMs:    Date.now() - start,
    });

    emitSyncEvent('completed', { type: 'bulk', upserted, errors, durationMs: Date.now() - start });
    logger.info(`[Sync] ✅ Bulk sync done. Upserted: ${upserted}, Errors: ${errors}`);

  } catch (err) {
    const msg = (err as Error).message;
    await state.updateOne({ status: 'error', lastError: msg, durationMs: Date.now() - start });
    emitSyncEvent('error', { type: 'bulk', error: msg });
    logger.error('[Sync] ❌ Bulk sync failed:', msg);
    throw err;
  }
}

/* ─── Delta sync (runs on cron every N minutes) ─── */

export async function deltaSync(): Promise<void> {
  const state = await getOrCreateState();
  if (state.status === 'running') {
    logger.warn('[Sync] Already running — skipping deltaSync');
    return;
  }

  const start     = Date.now();
  const watermark = state.lastSyncTimestamp;

  // If never run, fall back to bulk
  if (!watermark) {
    logger.info('[Sync] No watermark found — running bulk sync first');
    return bulkSync();
  }

  await state.updateOne({ status: 'running', type: 'delta', lastRunAt: new Date() });
  emitSyncEvent('started', { type: 'delta', since: watermark });
  logger.info(`[Sync] ▶ Delta sync since ${watermark.toISOString()}`);

  let upserted = 0;
  let errors   = 0;
  const changed: { id: string; changeType: 'new' | 'updated' | 'sold' | 'price_reduced' }[] = [];

  try {
    // SimplyRETS: minlistdate filters by listing date, not modification date.
    // For true delta we fetch recent listings and let upsert handle deduplication.
    // With a real RESO endpoint use ModificationTimestamp ge <watermark>
    const listings = await idxClient.fetchProperties({
      modifiedAfter: watermark.toISOString(),
      limit: config_batchSize(),
      sort: 'listdate',
    });

    for (const raw of listings) {
      try {
        const doc = mapSimplyRETSToProperty(raw);

        // Check if this is a new listing or an update
        const existing = await Property.findOne({ mlsNumber: doc.mlsNumber }).select('price status');

        await Property.findOneAndUpdate(
          { mlsNumber: doc.mlsNumber },
          { $set: doc },
          { upsert: true, new: true }
        );
        upserted++;

        // Determine change type for WebSocket push
        let changeType: 'new' | 'updated' | 'sold' | 'price_reduced' = 'updated';
        if (!existing) changeType = 'new';
        else if (doc.status === 'sold') changeType = 'sold';
        else if (existing.price !== doc.price) changeType = 'price_reduced';

        changed.push({ id: doc.mlsNumber, changeType });
      } catch (e) {
        errors++;
        logger.error('[Sync] Delta map error', { mlsId: raw.mlsId, err: (e as Error).message });
      }
    }

    const newWatermark = new Date();
    await state.updateOne({
      status: 'success',
      lastSuccessAt:    newWatermark,
      lastSyncTimestamp: newWatermark,
      totalSynced:   (state.totalSynced || 0) + listings.length,
      totalUpserted: (state.totalUpserted || 0) + upserted,
      totalErrors:   (state.totalErrors || 0) + errors,
      durationMs:    Date.now() - start,
      nextRunAt:     new Date(Date.now() + syncInterval()),
    });

    // Push individual change events to connected clients
    for (const change of changed) {
      const prop = await Property.findOne({ mlsNumber: change.id });
      if (prop) {
        getIO().emit('listing:update', {
          type:     change.changeType,
          property: prop,
        });
      }
    }

    emitSyncEvent('completed', {
      type:      'delta',
      fetched:   listings.length,
      upserted,
      errors,
      changes:   changed.length,
      durationMs: Date.now() - start,
    });

    logger.info(
      `[Sync] ✅ Delta done. Fetched: ${listings.length}, Upserted: ${upserted}, Changes: ${changed.length}`
    );

  } catch (err) {
    const msg = (err as Error).message;
    await state.updateOne({ status: 'error', lastError: msg, durationMs: Date.now() - start });
    emitSyncEvent('error', { type: 'delta', error: msg });
    logger.error('[Sync] ❌ Delta sync failed:', msg);
  }
}

/* ─── helpers ─── */
function config_batchSize() {
  return parseInt(process.env.SYNC_BATCH_SIZE || '50', 10);
}
function syncInterval() {
  return parseInt(process.env.SYNC_INTERVAL_MINUTES || '15', 10) * 60 * 1000;
}
