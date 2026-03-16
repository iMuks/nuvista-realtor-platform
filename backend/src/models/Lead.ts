import mongoose, { Schema } from 'mongoose';
import { ILead, LeadStatus, LeadSource, PropertyType } from '../types';

const leadSchema = new Schema<ILead>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: { type: String, trim: true },
    status: {
      type: String,
      enum: Object.values(LeadStatus),
      default: LeadStatus.NEW,
    },
    source: {
      type: String,
      enum: Object.values(LeadSource),
      default: LeadSource.WEBSITE,
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    assignedAgent: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned agent is required'],
    },
    interestedIn: [{ type: Schema.Types.ObjectId, ref: 'Property' }],
    preferredLocations: [{ type: String, trim: true }],
    budget: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    preferredPropertyTypes: [
      { type: String, enum: Object.values(PropertyType) },
    ],
    bedrooms: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 },
    },
    timeline: { type: String, trim: true },
    notes: [
      {
        content: { type: String, required: true },
        author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    activities: [
      {
        type: { type: String, required: true },
        description: { type: String, required: true },
        date: { type: Date, default: Date.now },
      },
    ],
    lastContactDate: Date,
    nextFollowUp: Date,
    tags: [{ type: String, trim: true, lowercase: true }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ─────────────────────────────────────────────
leadSchema.index({ assignedAgent: 1, status: 1 });
leadSchema.index({ status: 1, score: -1 });
leadSchema.index({ preferredLocations: 1 });
leadSchema.index({ email: 1 });
leadSchema.index({ tags: 1 });
leadSchema.index({ nextFollowUp: 1 });
leadSchema.index({ createdAt: -1 });

// ─── Virtual: Full Name ──────────────────────────────────
leadSchema.virtual('fullName').get(function (this: ILead) {
  return `${this.firstName} ${this.lastName}`;
});

// ─── Auto-score leads based on activity ──────────────────
leadSchema.methods.recalculateScore = function (): number {
  let score = 10; // base score
  if (this.phone) score += 10;
  if (this.budget.max > 0) score += 15;
  if (this.preferredLocations.length > 0) score += 10;
  if (this.preferredPropertyTypes.length > 0) score += 10;
  if (this.interestedIn.length > 0) score += 15;
  if (this.activities.length > 5) score += 15;
  if (this.timeline) score += 15;
  this.score = Math.min(score, 100);
  return this.score;
};

export const Lead = mongoose.model<ILead>('Lead', leadSchema);
