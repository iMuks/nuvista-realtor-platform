import mongoose, { type Document, type Model } from 'mongoose';

export interface ISyncState extends Document {
  provider: string;          // 'simplyrets' | 'repliers' | 'reso'
  type: 'bulk' | 'delta';
  status: 'idle' | 'running' | 'success' | 'error';
  lastRunAt?: Date;
  lastSuccessAt?: Date;
  lastSyncTimestamp?: Date;  // watermark for delta sync
  totalSynced: number;
  totalUpserted: number;
  totalErrors: number;
  lastError?: string;
  durationMs?: number;
  nextRunAt?: Date;
}

const syncStateSchema = new mongoose.Schema<ISyncState>(
  {
    provider:           { type: String, required: true, unique: true },
    type:               { type: String, enum: ['bulk', 'delta'], default: 'delta' },
    status:             { type: String, enum: ['idle', 'running', 'success', 'error'], default: 'idle' },
    lastRunAt:          Date,
    lastSuccessAt:      Date,
    lastSyncTimestamp:  Date,
    totalSynced:        { type: Number, default: 0 },
    totalUpserted:      { type: Number, default: 0 },
    totalErrors:        { type: Number, default: 0 },
    lastError:          String,
    durationMs:         Number,
    nextRunAt:          Date,
  },
  { timestamps: true }
);

export const SyncState: Model<ISyncState> = mongoose.model('SyncState', syncStateSchema);
