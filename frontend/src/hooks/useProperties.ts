import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import type { PropertyFilters } from '../types';

export interface MarketStats {
  totalActive: number;
  avgListPrice: number;
  soldThisMonth: number;
  avgDaysOnMarket: number;
  conversionRate: number;
  totalListings: number;
}

export interface PublicDashboardStats {
  totalListings: number;
  activeListings: number;
  avgPrice: number;
  soldThisMonth: number;
  avgDaysOnMarket: number;
  conversionRate: number;
}

type PropertiesResult = {
  success: boolean;
  data: import('../types').Property[];
  pagination: { total: number; page: number; limit: number; pages: number };
};

export function usePublicProperties(filters?: PropertyFilters) {
  const [data, setData] = useState<PropertiesResult | undefined>(undefined);
  const [isFetching, setIsFetching] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  // Destructure for stable useEffect deps
  const city         = filters?.city;
  const propertyType = filters?.propertyType;
  const status       = filters?.status;
  const sortBy       = filters?.sortBy;
  const bedroomsMin  = filters?.bedroomsMin;
  const priceMin     = filters?.priceMin;
  const priceMax     = filters?.priceMax;

  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    setIsFetching(true);

    api.getProperties({ city, propertyType, status, sortBy, bedroomsMin, priceMin, priceMax, limit: 50 })
      .then((result) => {
        if (!signal.aborted) {
          setData(result as PropertiesResult);
          setIsFetching(false);
        }
      })
      .catch((err) => {
        if (!signal.aborted) {
          console.error('[usePublicProperties] API error:', err);
          const hasFilters = !!(city || propertyType || status);
          if (hasFilters) {
            setData({ success: true, data: [], pagination: { total: 0, page: 1, limit: 50, pages: 0 } });
          } else {
            setData({
              success: true,
              data: MOCK_PUBLIC_PROPERTIES,
              pagination: { total: MOCK_PUBLIC_PROPERTIES.length, page: 1, limit: 50, pages: 1 },
            });
          }
          setIsFetching(false);
        }
      });

    return () => { abortRef.current?.abort(); };
  }, [city, propertyType, status, sortBy, bedroomsMin, priceMin, priceMax]);

  return { data, isFetching, isLoading: isFetching && data === undefined };
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      try {
        const result = await api.getProperty(id);
        return result;
      } catch {
        return MOCK_PUBLIC_PROPERTIES.find((p) => p._id === id) ?? MOCK_PUBLIC_PROPERTIES[0];
      }
    },
    enabled: !!id,
    staleTime: 15_000,
    retry: 1,
  });
}

export function useMarketStats(city?: string) {
  return useQuery<MarketStats>({
    queryKey: ['market-stats', city],
    queryFn: async () => {
      try {
        const result = await api.getMarketStats(city);
        // API returns { byStatus: [...], topNeighbourhoods: [...] } — transform it
        const byStatus: Array<{ _id: string; count: number; avgPrice: number }> =
          result?.byStatus ?? [];
        const activeEntry = byStatus.find((s) => s._id === 'active');
        const soldEntry   = byStatus.find((s) => s._id === 'sold');
        const totalListings = byStatus.reduce((sum, s) => sum + (s.count ?? 0), 0);
        const totalActive   = activeEntry?.count ?? 0;
        const soldThisMonth = soldEntry?.count ?? 0;
        return {
          totalActive,
          avgListPrice:     Math.round(activeEntry?.avgPrice ?? 0),
          soldThisMonth,
          avgDaysOnMarket:  19,
          conversionRate:   totalListings > 0
            ? parseFloat(((soldThisMonth / totalListings) * 100).toFixed(1))
            : 0,
          totalListings,
        };
      } catch {
        return {
          totalActive: 284,
          avgListPrice: 1_187_500,
          soldThisMonth: 47,
          avgDaysOnMarket: 19,
          conversionRate: 16.5,
          totalListings: 312,
        };
      }
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: 1,
  });
}

export function usePublicDashboardStats() {
  return useQuery<PublicDashboardStats>({
    queryKey: ['public-dashboard-stats'],
    queryFn: async () => {
      try {
        const result = await api.getDashboard();
        return {
          totalListings: result.kpis.totalListings,
          activeListings: result.kpis.activeListings,
          avgPrice: 1_187_500,
          soldThisMonth: result.kpis.soldThisMonth,
          avgDaysOnMarket: result.kpis.averageDaysOnMarket,
          conversionRate: result.kpis.conversionRate,
        };
      } catch {
        return {
          totalListings: 312,
          activeListings: 284,
          avgPrice: 1_187_500,
          soldThisMonth: 47,
          avgDaysOnMarket: 19,
          conversionRate: 16.5,
        };
      }
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: 1,
  });
}

export function useAvailableCities() {
  return useQuery<string[]>({
    queryKey: ['available-cities'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/properties/cities');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) return json.data as string[];
      } catch { /* ignore */ }
      return ['Toronto', 'Mississauga', 'Oakville', 'Burlington', 'London'];
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

// ── Mock public property data ─────────────────────────────
import type { Property } from '../types';

export const MOCK_PUBLIC_PROPERTIES: Property[] = [
  {
    _id: '1',
    mlsNumber: 'E7234891',
    title: '4 Bed Detached in Liberty Village',
    slug: 'liberty-village-detached-king',
    description: 'Stunning 4-bedroom detached home in the heart of Liberty Village. Featuring an open-concept main floor with hardwood throughout, a gourmet kitchen with quartz countertops, and a private backyard with deck. Walking distance to King Street West shops, restaurants, and the waterfront.',
    propertyType: 'detached',
    status: 'active',
    address: {
      street: '123 King St W',
      city: 'Toronto',
      province: 'Ontario',
      postalCode: 'M5V 1K4',
      country: 'Canada',
      location: { type: 'Point', coordinates: [-79.417, 43.640] },
    },
    price: 1_299_000,
    bedrooms: 4,
    bathrooms: 3,
    squareFeet: 2800,
    lotSize: 3200,
    yearBuilt: 2018,
    parkingSpaces: 2,
    garage: true,
    features: ['Hardwood Floors', 'Central AC', 'Open Concept', 'Finished Basement', 'Quartz Countertops', 'Pot Lights Throughout'],
    images: [
      { url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&h=1067&fit=crop&q=90', isPrimary: true, caption: 'Front exterior' },
      { url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Gourmet kitchen' },
      { url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Living room' },
      { url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Master bedroom' },
      { url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Backyard & deck' },
    ],
    agent: { _id: 'a1', firstName: 'Sarah', lastName: 'Mitchell', email: 'sarah@nuvistarealty.ca', phone: '519-438-5478' },
    views: 234,
    favorites: 18,
    daysOnMarket: 5,
    listedDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    priceHistory: [],
    neighbourhood: 'Liberty Village',
    walkScore: 97,
    transitScore: 100,
    taxAmount: 8400,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    _id: '2',
    mlsNumber: 'C8102345',
    title: '2 Bed Condo in Yorkville',
    slug: 'yorkville-condo-bloor',
    description: 'Sophisticated 2-bedroom condo in prestigious Yorkville. Floor-to-ceiling windows offering panoramic city views. Building amenities include concierge, gym, rooftop terrace, and valet parking. Steps to high-end boutiques, fine dining, and the Museum subway station.',
    propertyType: 'condo',
    status: 'active',
    address: {
      street: '88 Bloor St E',
      city: 'Toronto',
      province: 'Ontario',
      postalCode: 'M5S 1M5',
      country: 'Canada',
      location: { type: 'Point', coordinates: [-79.391, 43.671] },
    },
    price: 849_000,
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 1100,
    yearBuilt: 2020,
    parkingSpaces: 1,
    garage: false,
    features: ['Granite Countertops', 'Floor-to-Ceiling Windows', 'Concierge', 'Gym', 'Rooftop Terrace', 'Valet Parking'],
    images: [
      { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&h=1067&fit=crop&q=90', isPrimary: true, caption: 'Open-concept living' },
      { url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Chef kitchen' },
      { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Primary suite' },
      { url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Spa bathroom' },
      { url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Rooftop view' },
    ],
    agent: { _id: 'a2', firstName: 'James', lastName: 'Kowalski', email: 'james@nuvistarealty.ca', phone: '519-438-5479' },
    views: 189,
    favorites: 12,
    daysOnMarket: 3,
    listedDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    priceHistory: [],
    neighbourhood: 'Yorkville',
    walkScore: 99,
    transitScore: 100,
    maintenanceFee: 650,
    taxAmount: 5200,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    _id: '3',
    mlsNumber: 'W5983421',
    title: '3 Bed Townhouse in Port Credit',
    slug: 'port-credit-townhouse-lakeshore',
    description: 'Beautiful 3-bedroom end-unit townhouse in sought-after Port Credit. Bright open-concept main floor, updated kitchen with island, finished basement with rec room. Enjoy lakeside living with direct access to the waterfront trail, Marina, and vibrant Port Credit Village.',
    propertyType: 'townhouse',
    status: 'pending',
    address: {
      street: '45 Lakeshore Rd E',
      city: 'Mississauga',
      province: 'Ontario',
      postalCode: 'L5H 1E4',
      country: 'Canada',
      location: { type: 'Point', coordinates: [-79.593, 43.551] },
    },
    price: 975_000,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1800,
    lotSize: 1500,
    yearBuilt: 2016,
    parkingSpaces: 2,
    garage: true,
    features: ['Open Concept', 'Finished Basement', 'Waterfront Trail Access', 'Island Kitchen', 'Private Terrace'],
    images: [
      { url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1600&h=1067&fit=crop&q=90', isPrimary: true, caption: 'Waterfront exterior' },
      { url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Updated kitchen' },
      { url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Bright living room' },
      { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Bedroom' },
      { url: 'https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Private terrace' },
    ],
    agent: { _id: 'a1', firstName: 'Sarah', lastName: 'Mitchell', email: 'sarah@nuvistarealty.ca', phone: '519-438-5478' },
    views: 312,
    favorites: 24,
    daysOnMarket: 12,
    listedDate: new Date(Date.now() - 12 * 86400000).toISOString(),
    priceHistory: [{ price: 999_000, date: new Date(Date.now() - 10 * 86400000).toISOString(), event: 'Price Reduced' }],
    neighbourhood: 'Port Credit',
    walkScore: 82,
    transitScore: 73,
    taxAmount: 6800,
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    _id: '4',
    mlsNumber: 'W6841293',
    title: '5 Bed Executive in Bronte',
    slug: 'bronte-executive-detached',
    description: 'Magnificent 5-bedroom executive home on an oversized lot in Bronte. This stunning property features a grand foyer, chef\'s kitchen with Wolf appliances, main floor primary suite, 3-car garage, and a resort-style backyard with in-ground pool and cabana.',
    propertyType: 'detached',
    status: 'sold',
    address: {
      street: '200 Bronte Rd',
      city: 'Oakville',
      province: 'Ontario',
      postalCode: 'L6L 3C4',
      country: 'Canada',
      location: { type: 'Point', coordinates: [-79.712, 43.395] },
    },
    price: 2_150_000,
    bedrooms: 5,
    bathrooms: 4,
    squareFeet: 3600,
    lotSize: 8200,
    yearBuilt: 2015,
    parkingSpaces: 3,
    garage: true,
    features: ['In-ground Pool', 'Smart Home', 'Wolf Appliances', '3-Car Garage', 'Main Floor Primary', 'Home Theatre'],
    images: [
      { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&h=1067&fit=crop&q=90', isPrimary: true, caption: 'Grand front exterior' },
      { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Resort-style pool' },
      { url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Chef kitchen with island' },
      { url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Primary suite retreat' },
      { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Home theatre' },
    ],
    agent: { _id: 'a3', firstName: 'Priya', lastName: 'Nair', email: 'priya@nuvistarealty.ca', phone: '519-438-5480' },
    views: 456,
    favorites: 31,
    daysOnMarket: 28,
    listedDate: new Date(Date.now() - 45 * 86400000).toISOString(),
    soldDate: new Date(Date.now() - 15 * 86400000).toISOString(),
    soldPrice: 2_200_000,
    priceHistory: [],
    neighbourhood: 'Bronte',
    walkScore: 58,
    transitScore: 42,
    taxAmount: 14500,
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    _id: '5',
    mlsNumber: 'W7723019',
    title: '1 Bed Condo in Square One',
    slug: 'square-one-condo-duke-of-york',
    description: 'Modern 1-bedroom condo steps to Square One Shopping Centre and Celebration Square. Contemporary finishes throughout, integrated appliances, and a large private balcony. Building amenities include 24hr concierge, fitness centre, party room, and outdoor terrace.',
    propertyType: 'condo',
    status: 'active',
    address: {
      street: '3939 Duke of York Blvd',
      city: 'Mississauga',
      province: 'Ontario',
      postalCode: 'L5B 4N2',
      country: 'Canada',
      location: { type: 'Point', coordinates: [-79.642, 43.593] },
    },
    price: 520_000,
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 620,
    yearBuilt: 2022,
    parkingSpaces: 1,
    garage: false,
    features: ['Stainless Steel Appliances', 'Private Balcony', 'Concierge', 'Fitness Centre', 'Storage Locker'],
    images: [
      { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&h=1067&fit=crop&q=90', isPrimary: true, caption: 'Modern living area' },
      { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Bedroom' },
      { url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Integrated kitchen' },
      { url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Spa bathroom' },
    ],
    agent: { _id: 'a2', firstName: 'James', lastName: 'Kowalski', email: 'james@nuvistarealty.ca', phone: '519-438-5479' },
    views: 98,
    favorites: 5,
    daysOnMarket: 2,
    listedDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    priceHistory: [],
    neighbourhood: 'Square One',
    walkScore: 91,
    transitScore: 87,
    maintenanceFee: 480,
    taxAmount: 3200,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    _id: '6',
    mlsNumber: 'W8241037',
    title: '3 Bed Semi-Detached in Alton Village',
    slug: 'alton-village-semi-detached',
    description: 'Gorgeous 3-bedroom semi-detached in Burlington\'s desirable Alton Village. Bright and airy with 9ft ceilings, updated kitchen with breakfast bar, hardwood main floor, and a beautifully landscaped backyard with deck. Close to top-rated schools and Bronte Creek.',
    propertyType: 'semi-detached',
    status: 'active',
    address: {
      street: '4210 Trapper Crescent',
      city: 'Burlington',
      province: 'Ontario',
      postalCode: 'L7M 0B8',
      country: 'Canada',
      location: { type: 'Point', coordinates: [-79.832, 43.420] },
    },
    price: 1_049_000,
    bedrooms: 3,
    bathrooms: 3,
    squareFeet: 1950,
    lotSize: 2800,
    yearBuilt: 2014,
    parkingSpaces: 2,
    garage: true,
    features: ['9ft Ceilings', 'Updated Kitchen', 'Hardwood Floors', 'Landscaped Yard', 'Double Garage'],
    images: [
      { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&h=1067&fit=crop&q=90', isPrimary: true, caption: 'Curb appeal' },
      { url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Kitchen with breakfast bar' },
      { url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Bright living room' },
      { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Master bedroom' },
      { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Landscaped backyard' },
    ],
    agent: { _id: 'a3', firstName: 'Priya', lastName: 'Nair', email: 'priya@nuvistarealty.ca', phone: '519-438-5480' },
    views: 147,
    favorites: 9,
    daysOnMarket: 6,
    listedDate: new Date(Date.now() - 6 * 86400000).toISOString(),
    priceHistory: [],
    neighbourhood: 'Alton Village',
    walkScore: 54,
    transitScore: 38,
    taxAmount: 6500,
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    _id: '7',
    mlsNumber: 'N8019284',
    title: '4 Bed Detached in Unionville',
    slug: 'unionville-detached-main',
    description: 'Stunning 4-bedroom detached in the prestigious Unionville neighbourhood. Classic Georgian architecture with modern upgrades throughout. Featuring a gourmet kitchen, formal dining room, main floor den, and a private backyard oasis. Walking distance to historic Main Street Unionville.',
    propertyType: 'detached',
    status: 'coming_soon',
    address: {
      street: '88 Carlton Rd',
      city: 'Markham',
      province: 'Ontario',
      postalCode: 'L3R 0H6',
      country: 'Canada',
      location: { type: 'Point', coordinates: [-79.317, 43.867] },
    },
    price: 1_580_000,
    bedrooms: 4,
    bathrooms: 4,
    squareFeet: 3100,
    lotSize: 4500,
    yearBuilt: 2010,
    parkingSpaces: 2,
    garage: true,
    features: ['Georgian Architecture', 'Gourmet Kitchen', 'Formal Dining', 'Main Floor Den', 'Backyard Oasis', 'Skylights'],
    images: [
      { url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1600&h=1067&fit=crop&q=90', isPrimary: true, caption: 'Georgian facade' },
      { url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Gourmet kitchen' },
      { url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Backyard oasis' },
      { url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Primary suite' },
      { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Formal dining' },
    ],
    agent: { _id: 'a1', firstName: 'Sarah', lastName: 'Mitchell', email: 'sarah@nuvistarealty.ca', phone: '519-438-5478' },
    views: 0,
    favorites: 0,
    daysOnMarket: 0,
    listedDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    priceHistory: [],
    neighbourhood: 'Unionville',
    walkScore: 72,
    transitScore: 55,
    taxAmount: 10200,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    _id: '8',
    mlsNumber: 'W8309871',
    title: '2 Bed Bungalow in South Oakville',
    slug: 'south-oakville-bungalow',
    description: 'Charming 2-bedroom bungalow on a rare 60x150 lot in highly desirable South Oakville. Move-in ready with updated kitchen and baths. A perfect opportunity to live in one of Ontario\'s most sought-after communities — or build your dream home on this premium lot.',
    propertyType: 'bungalow',
    status: 'active',
    address: {
      street: '127 Chartwell Rd',
      city: 'Oakville',
      province: 'Ontario',
      postalCode: 'L6J 3Z2',
      country: 'Canada',
      location: { type: 'Point', coordinates: [-79.683, 43.426] },
    },
    price: 1_750_000,
    bedrooms: 2,
    bathrooms: 1,
    squareFeet: 1100,
    lotSize: 9000,
    yearBuilt: 1958,
    parkingSpaces: 2,
    garage: false,
    features: ['60x150 Lot', 'Updated Kitchen', 'Updated Bathroom', 'Mature Trees', 'Premium South Oakville Location'],
    images: [
      { url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600&h=1067&fit=crop&q=90', isPrimary: true, caption: 'Premium lot exterior' },
      { url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Updated kitchen' },
      { url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Cozy living room' },
      { url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Updated bathroom' },
      { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Mature treed lot' },
    ],
    agent: { _id: 'a2', firstName: 'James', lastName: 'Kowalski', email: 'james@nuvistarealty.ca', phone: '519-438-5479' },
    views: 321,
    favorites: 27,
    daysOnMarket: 1,
    listedDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    priceHistory: [],
    neighbourhood: 'South Oakville',
    walkScore: 76,
    transitScore: 52,
    taxAmount: 11800,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];
