import mongoose, { Schema } from 'mongoose';
import slugify from 'slugify';
import { IProperty, PropertyStatus, PropertyType } from '../types';

const propertySchema = new Schema<IProperty>(
  {
    mlsNumber: { type: String, unique: true, sparse: true },
    slug: { type: String, unique: true },
    title: {
      type: String,
      required: [true, 'Property title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, 'Property description is required'],
      maxlength: 5000,
    },
    propertyType: {
      type: String,
      enum: Object.values(PropertyType),
      required: [true, 'Property type is required'],
    },
    status: {
      type: String,
      enum: Object.values(PropertyStatus),
      default: PropertyStatus.ACTIVE,
    },
    address: {
      street: { type: String, required: true, trim: true },
      unit: { type: String, trim: true },
      city: { type: String, required: true, trim: true },
      province: { type: String, required: true, trim: true },
      postalCode: { type: String, required: true, trim: true },
      country: { type: String, default: 'Canada' },
      location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: {
          type: [Number], // [longitude, latitude]
          required: true,
          validate: {
            validator: (v: number[]) =>
              v.length === 2 &&
              v[0] >= -180 && v[0] <= 180 &&
              v[1] >= -90 && v[1] <= 90,
            message: 'Invalid coordinates',
          },
        },
      },
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    originalPrice: Number,
    priceHistory: [
      {
        price: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        event: { type: String, enum: ['listed', 'reduced', 'increased', 'sold'] },
      },
    ],
    bedrooms: { type: Number, required: true, min: 0 },
    bathrooms: { type: Number, required: true, min: 0 },
    squareFeet: { type: Number, min: 0 },
    lotSize: { type: Number, min: 0 },
    yearBuilt: { type: Number, min: 1800, max: new Date().getFullYear() + 2 },
    parkingSpaces: { type: Number, min: 0, default: 0 },
    garage: { type: Boolean, default: false },
    features: [{ type: String, trim: true }],
    images: [
      {
        url: { type: String, required: true },
        caption: String,
        isPrimary: { type: Boolean, default: false },
      },
    ],
    virtualTourUrl: String,
    agent: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Agent is required'],
    },
    views: { type: Number, default: 0 },
    favorites: { type: Number, default: 0 },
    openHouseDates: [Date],
    listedDate: { type: Date, default: Date.now },
    soldDate: Date,
    soldPrice: Number,
    taxAmount: Number,
    maintenanceFee: Number,
    neighbourhood: { type: String, trim: true },
    walkScore: { type: Number, min: 0, max: 100 },
    transitScore: { type: Number, min: 0, max: 100 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ─────────────────────────────────────────────
propertySchema.index({ 'address.location': '2dsphere' });
propertySchema.index({ 'address.city': 1, status: 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ propertyType: 1, status: 1 });
propertySchema.index({ agent: 1 });
propertySchema.index({ listedDate: -1 });
propertySchema.index({ neighbourhood: 1 });

// ─── Virtual: Days on Market ─────────────────────────────
propertySchema.virtual('daysOnMarket').get(function (this: IProperty) {
  const end = this.soldDate || new Date();
  return Math.floor(
    (end.getTime() - this.listedDate.getTime()) / (1000 * 60 * 60 * 24)
  );
});

// ─── Pre-save: Generate Slug ─────────────────────────────
propertySchema.pre('save', function (next) {
  if (this.isModified('title') || this.isNew) {
    const base = `${this.title}-${this.address.city}`;
    const suffix = Math.random().toString(36).slice(2, 7);
    this.slug = slugify(`${base}-${suffix}`, { lower: true, strict: true });
  }
  // Track price changes
  if (this.isModified('price') && !this.isNew) {
    this.priceHistory.push({
      price: this.price,
      date: new Date(),
      event: this.price < (this.originalPrice || this.price) ? 'reduced' : 'increased',
    });
  }
  next();
});

export const Property = mongoose.model<IProperty>('Property', propertySchema);
