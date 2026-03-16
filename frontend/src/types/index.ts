// ─── User ────────────────────────────────────────────────
export type UserRole = 'agent' | 'broker' | 'admin';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  brokerage?: string;
  licenseNumber?: string;
  bio?: string;
  fullName: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

// ─── Property ────────────────────────────────────────────
export type PropertyStatus = 'active' | 'sold' | 'pending' | 'delisted' | 'coming_soon';
export type PropertyType = 'detached' | 'semi-detached' | 'townhouse' | 'condo' | 'bungalow' | 'duplex' | 'triplex' | 'commercial' | 'land';

export interface GeoLocation {
  type: 'Point';
  coordinates: [number, number];
}

export interface Address {
  street: string;
  unit?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  location: GeoLocation;
}

export interface PropertyImage {
  url: string;
  caption?: string;
  isPrimary: boolean;
}

export interface Property {
  _id: string;
  mlsNumber?: string;
  slug: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  status: PropertyStatus;
  address: Address;
  price: number;
  originalPrice?: number;
  priceHistory: Array<{ price: number; date: string; event: string }>;
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
  lotSize?: number;
  yearBuilt?: number;
  parkingSpaces?: number;
  garage?: boolean;
  features: string[];
  images: PropertyImage[];
  agent: Pick<User, '_id' | 'firstName' | 'lastName' | 'email' | 'phone' | 'avatar'>;
  views: number;
  favorites: number;
  daysOnMarket: number;
  listedDate: string;
  soldDate?: string;
  soldPrice?: number;
  taxAmount?: number;
  maintenanceFee?: number;
  neighbourhood?: string;
  walkScore?: number;
  transitScore?: number;
  createdAt: string;
}

// ─── Lead ────────────────────────────────────────────────
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'showing' | 'offer' | 'closed' | 'lost';
export type LeadSource = 'website' | 'referral' | 'social_media' | 'open_house' | 'cold_call' | 'advertisement' | 'other';

export interface Lead {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  status: LeadStatus;
  source: LeadSource;
  score: number;
  assignedAgent: Pick<User, '_id' | 'firstName' | 'lastName' | 'email'>;
  interestedIn: Property[];
  preferredLocations: string[];
  budget: { min: number; max: number };
  preferredPropertyTypes: PropertyType[];
  bedrooms?: { min: number; max: number };
  timeline?: string;
  notes: Array<{
    content: string;
    author: Pick<User, '_id' | 'firstName' | 'lastName'>;
    createdAt: string;
  }>;
  activities: Array<{
    type: string;
    description: string;
    date: string;
  }>;
  lastContactDate?: string;
  nextFollowUp?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Dashboard ───────────────────────────────────────────
export interface DashboardKPIs {
  totalListings: number;
  activeListings: number;
  totalLeads: number;
  newLeadsThisWeek: number;
  totalSold: number;
  soldThisMonth: number;
  averageDaysOnMarket: number;
  totalRevenue: number;
  conversionRate: number;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  recentProperties: Property[];
  recentLeads: Lead[];
  monthlyPerformance: Array<{
    month: string;
    listings: number;
    sold: number;
    revenue: number;
  }>;
  topNeighbourhoods: Array<{
    name: string;
    count: number;
    avgPrice: number;
  }>;
  leadPipeline: Record<string, number>;
}

// ─── API ─────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// ─── Search Filters ──────────────────────────────────────
export interface PropertyFilters {
  city?: string;
  propertyType?: string;
  status?: string;
  priceMin?: number;
  priceMax?: number;
  bedroomsMin?: number;
  bathroomsMin?: number;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
}

export interface LeadFilters {
  status?: string;
  source?: string;
  location?: string;
  search?: string;
  scoreMin?: number;
  scoreMax?: number;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
}
