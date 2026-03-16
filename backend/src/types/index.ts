import { Request } from 'express';
import { Document, Types } from 'mongoose';

// ─── User Types ──────────────────────────────────────────
export enum UserRole {
  AGENT = 'agent',
  BROKER = 'broker',
  ADMIN = 'admin',
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  brokerage?: string;
  licenseNumber?: string;
  bio?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  fullName: string;
}

// ─── Property Types ──────────────────────────────────────
export enum PropertyStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  PENDING = 'pending',
  DELISTED = 'delisted',
  COMING_SOON = 'coming_soon',
}

export enum PropertyType {
  DETACHED = 'detached',
  SEMI_DETACHED = 'semi-detached',
  TOWNHOUSE = 'townhouse',
  CONDO = 'condo',
  BUNGALOW = 'bungalow',
  DUPLEX = 'duplex',
  TRIPLEX = 'triplex',
  COMMERCIAL = 'commercial',
  LAND = 'land',
}

export interface IGeoLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface IAddress {
  street: string;
  unit?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  location: IGeoLocation;
}

export interface IProperty extends Document {
  _id: Types.ObjectId;
  mlsNumber?: string;
  slug: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  status: PropertyStatus;
  address: IAddress;
  price: number;
  originalPrice?: number;
  priceHistory: Array<{ price: number; date: Date; event: string }>;
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
  lotSize?: number;
  yearBuilt?: number;
  parkingSpaces?: number;
  garage?: boolean;
  features: string[];
  images: Array<{ url: string; caption?: string; isPrimary: boolean }>;
  virtualTourUrl?: string;
  agent: Types.ObjectId;
  views: number;
  favorites: number;
  openHouseDates?: Date[];
  listedDate: Date;
  soldDate?: Date;
  soldPrice?: number;
  daysOnMarket: number;
  taxAmount?: number;
  maintenanceFee?: number;
  neighbourhood?: string;
  walkScore?: number;
  transitScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Lead Types ──────────────────────────────────────────
export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  SHOWING = 'showing',
  OFFER = 'offer',
  CLOSED = 'closed',
  LOST = 'lost',
}

export enum LeadSource {
  WEBSITE = 'website',
  REFERRAL = 'referral',
  SOCIAL_MEDIA = 'social_media',
  OPEN_HOUSE = 'open_house',
  COLD_CALL = 'cold_call',
  ADVERTISEMENT = 'advertisement',
  OTHER = 'other',
}

export interface ILead extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: LeadStatus;
  source: LeadSource;
  score: number; // 0-100 lead score
  assignedAgent: Types.ObjectId;
  interestedIn: Types.ObjectId[]; // property references
  preferredLocations: string[];
  budget: { min: number; max: number };
  preferredPropertyTypes: PropertyType[];
  bedrooms?: { min: number; max: number };
  timeline?: string;
  notes: Array<{
    content: string;
    author: Types.ObjectId;
    createdAt: Date;
  }>;
  activities: Array<{
    type: string;
    description: string;
    date: Date;
  }>;
  lastContactDate?: Date;
  nextFollowUp?: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  fullName: string;
  recalculateScore(): number;
}

// ─── Search / Filter Types ───────────────────────────────
export interface PropertySearchFilters {
  city?: string;
  province?: string;
  propertyType?: PropertyType[];
  status?: PropertyStatus[];
  priceMin?: number;
  priceMax?: number;
  bedroomsMin?: number;
  bathroomsMin?: number;
  squareFeetMin?: number;
  yearBuiltMin?: number;
  features?: string[];
  sortBy?: 'price' | 'listedDate' | 'squareFeet' | 'bedrooms';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  near?: { lat: number; lng: number; radiusKm: number };
}

export interface LeadSearchFilters {
  status?: LeadStatus[];
  source?: LeadSource[];
  location?: string;
  scoreMin?: number;
  scoreMax?: number;
  assignedAgent?: string;
  tags?: string[];
  sortBy?: 'score' | 'createdAt' | 'lastContactDate';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ─── API Response Types ──────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ─── Auth Types ──────────────────────────────────────────
export interface AuthRequest extends Request {
  user?: IUser;
}

export interface TokenPayload {
  id: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// ─── Dashboard Types ─────────────────────────────────────
export interface DashboardStats {
  totalListings: number;
  activeListings: number;
  totalLeads: number;
  newLeadsThisWeek: number;
  totalSold: number;
  soldThisMonth: number;
  averageDaysOnMarket: number;
  totalRevenue: number;
  conversionRate: number;
  topNeighbourhoods: Array<{ name: string; count: number; avgPrice: number }>;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: Date;
  }>;
  monthlyPerformance: Array<{
    month: string;
    listings: number;
    sold: number;
    revenue: number;
  }>;
}
