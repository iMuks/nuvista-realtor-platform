import { useState, useEffect } from 'react';
import {
  Search, SlidersHorizontal, MapPin, Bed, Bath, Maximize,
  Eye, Heart, Plus, Grid3X3, List, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { api } from '../../services/api';
import type { Property, PropertyFilters } from '../../types';

const CITIES = ['All', 'Toronto', 'Mississauga', 'Brampton', 'Oakville', 'Burlington', 'Markham', 'Richmond Hill', 'Vaughan', 'Hamilton'];
const TYPES = ['All', 'detached', 'semi-detached', 'townhouse', 'condo', 'bungalow'];
const STATUSES = ['All', 'active', 'pending', 'sold', 'coming_soon'];

function formatPrice(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  return `$${(val / 1_000).toFixed(0)}K`;
}

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-500/90 text-white',
  sold: 'bg-blue-500/90 text-white',
  pending: 'bg-amber-500/90 text-white',
  coming_soon: 'bg-purple-500/90 text-white',
  delisted: 'bg-slate-500/90 text-white',
};

// Mock properties for demo
const MOCK_PROPERTIES: Property[] = [
  { _id: '1', title: '4 Bed Detached in Liberty Village', slug: 'liberty-village-detached', description: '', propertyType: 'detached', status: 'active', address: { street: '123 King St W', city: 'Toronto', province: 'Ontario', postalCode: 'M5V 1K4', country: 'Canada', location: { type: 'Point', coordinates: [-79.4, 43.64] } }, price: 1299000, bedrooms: 4, bathrooms: 3, squareFeet: 2800, features: ['Hardwood Floors', 'Central AC'], images: [{ url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop', isPrimary: true, caption: '' }], agent: { _id: '1', firstName: 'Sarah', lastName: 'Mitchell', email: '', phone: '' }, views: 234, favorites: 18, daysOnMarket: 5, listedDate: new Date().toISOString(), priceHistory: [], neighbourhood: 'Liberty Village', createdAt: new Date().toISOString() } as Property,
  { _id: '2', title: '2 Bed Condo in Yorkville', slug: 'yorkville-condo', description: '', propertyType: 'condo', status: 'active', address: { street: '88 Bloor St E', city: 'Toronto', province: 'Ontario', postalCode: 'M5S 1M5', country: 'Canada', location: { type: 'Point', coordinates: [-79.39, 43.67] } }, price: 849000, bedrooms: 2, bathrooms: 2, squareFeet: 1100, features: ['Granite Countertops'], images: [{ url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop', isPrimary: true, caption: '' }], agent: { _id: '2', firstName: 'James', lastName: 'Kowalski', email: '', phone: '' }, views: 189, favorites: 12, daysOnMarket: 3, listedDate: new Date().toISOString(), priceHistory: [], neighbourhood: 'Yorkville', maintenanceFee: 650, createdAt: new Date().toISOString() } as Property,
  { _id: '3', title: '3 Bed Townhouse in Port Credit', slug: 'port-credit-townhouse', description: '', propertyType: 'townhouse', status: 'pending', address: { street: '45 Lakeshore Rd E', city: 'Mississauga', province: 'Ontario', postalCode: 'L5H 1E4', country: 'Canada', location: { type: 'Point', coordinates: [-79.59, 43.55] } }, price: 975000, bedrooms: 3, bathrooms: 2, squareFeet: 1800, features: ['Open Concept', 'Finished Basement'], images: [{ url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop', isPrimary: true, caption: '' }], agent: { _id: '3', firstName: 'Priya', lastName: 'Nair', email: '', phone: '' }, views: 312, favorites: 24, daysOnMarket: 12, listedDate: new Date().toISOString(), priceHistory: [], neighbourhood: 'Port Credit', createdAt: new Date().toISOString() } as Property,
  { _id: '4', title: '5 Bed Detached in Bronte', slug: 'bronte-detached', description: '', propertyType: 'detached', status: 'sold', address: { street: '200 Bronte Rd', city: 'Oakville', province: 'Ontario', postalCode: 'L6L 3C4', country: 'Canada', location: { type: 'Point', coordinates: [-79.71, 43.39] } }, price: 2150000, bedrooms: 5, bathrooms: 4, squareFeet: 3600, features: ['In-ground Pool', 'Smart Home'], images: [{ url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop', isPrimary: true, caption: '' }], agent: { _id: '1', firstName: 'Sarah', lastName: 'Mitchell', email: '', phone: '' }, views: 456, favorites: 31, daysOnMarket: 28, listedDate: new Date().toISOString(), priceHistory: [], neighbourhood: 'Bronte', soldPrice: 2200000, createdAt: new Date().toISOString() } as Property,
  { _id: '5', title: '1 Bed Condo in Square One', slug: 'square-one-condo', description: '', propertyType: 'condo', status: 'active', address: { street: '3939 Duke of York Blvd', city: 'Mississauga', province: 'Ontario', postalCode: 'L5B 4N2', country: 'Canada', location: { type: 'Point', coordinates: [-79.64, 43.59] } }, price: 520000, bedrooms: 1, bathrooms: 1, squareFeet: 620, features: ['Stainless Steel Appliances'], images: [{ url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop', isPrimary: true, caption: '' }], agent: { _id: '2', firstName: 'James', lastName: 'Kowalski', email: '', phone: '' }, views: 98, favorites: 5, daysOnMarket: 2, listedDate: new Date().toISOString(), priceHistory: [], neighbourhood: 'Square One', maintenanceFee: 480, createdAt: new Date().toISOString() } as Property,
  { _id: '6', title: '3 Bed Semi in Alton Village', slug: 'alton-village-semi', description: '', propertyType: 'semi-detached', status: 'coming_soon', address: { street: '4210 Trapper Cres', city: 'Burlington', province: 'Ontario', postalCode: 'L7M 0B8', country: 'Canada', location: { type: 'Point', coordinates: [-79.83, 43.42] } }, price: 1049000, bedrooms: 3, bathrooms: 3, squareFeet: 1950, features: ['9ft Ceilings', 'Updated Kitchen'], images: [{ url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop', isPrimary: true, caption: '' }], agent: { _id: '3', firstName: 'Priya', lastName: 'Nair', email: '', phone: '' }, views: 0, favorites: 0, daysOnMarket: 0, listedDate: new Date().toISOString(), priceHistory: [], neighbourhood: 'Alton Village', createdAt: new Date().toISOString() } as Property,
];

export default function Properties() {
  const [properties, setProperties] = useState<Property[]>(MOCK_PROPERTIES);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [pagination, setPagination] = useState({ total: 6, page: 1, limit: 20, pages: 1 });
  const [filters, setFilters] = useState<PropertyFilters>({
    city: '', propertyType: '', status: '', priceMin: undefined, priceMax: undefined,
    bedroomsMin: undefined, bathroomsMin: undefined, sortBy: 'listedDate', sortOrder: 'desc',
    page: 1, limit: 20,
  });

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const result = await api.getProperties(filters);
        setProperties(result.data);
        setPagination(result.pagination);
      } catch {
        setProperties(MOCK_PROPERTIES);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, [filters]);

  const updateFilter = (key: keyof PropertyFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value === 'All' ? '' : value, page: 1 }));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Properties</h1>
          <p className="text-slate-500 text-sm mt-0.5">{pagination.total} listings found</p>
        </div>
        <button className="btn-primary self-start">
          <Plus className="w-4 h-4" /> Add Listing
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by address, neighbourhood, MLS#..."
              className="input-field pl-10"
            />
          </div>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`btn-ghost ${filtersOpen ? 'bg-brand-500/10 text-brand-400 border-brand-500/30' : ''}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
          <div className="hidden sm:flex items-center gap-1 border border-white/[0.06] rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white/[0.08] text-white' : 'text-slate-500'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white/[0.08] text-white' : 'text-slate-500'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {filtersOpen && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-3 border-t border-white/[0.06] animate-fade-in">
            <div>
              <label className="text-[11px] text-slate-500 font-medium mb-1 block">City</label>
              <select className="input-field text-xs py-2" onChange={(e) => updateFilter('city', e.target.value)}>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-medium mb-1 block">Type</label>
              <select className="input-field text-xs py-2" onChange={(e) => updateFilter('propertyType', e.target.value)}>
                {TYPES.map((t) => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-medium mb-1 block">Status</label>
              <select className="input-field text-xs py-2" onChange={(e) => updateFilter('status', e.target.value)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s === 'All' ? 'All Status' : s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-medium mb-1 block">Min Price</label>
              <input type="number" placeholder="$0" className="input-field text-xs py-2" onChange={(e) => updateFilter('priceMin', e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-medium mb-1 block">Max Price</label>
              <input type="number" placeholder="No max" className="input-field text-xs py-2" onChange={(e) => updateFilter('priceMax', e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-medium mb-1 block">Min Beds</label>
              <select className="input-field text-xs py-2" onChange={(e) => updateFilter('bedroomsMin', e.target.value ? Number(e.target.value) : undefined)}>
                <option value="">Any</option>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Quick City Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {CITIES.slice(0, 7).map((city) => (
            <button
              key={city}
              onClick={() => updateFilter('city', city)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                (filters.city === city || (city === 'All' && !filters.city))
                  ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                  : 'bg-white/[0.03] text-slate-500 hover:text-white border border-transparent hover:border-white/[0.06]'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Properties Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
          {properties.map((prop, i) => (
            <div
              key={prop._id}
              className="glass-card-hover overflow-hidden cursor-pointer group animate-slide-up"
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                {prop.images?.[0] && (
                  <img
                    src={prop.images[0].url}
                    alt={prop.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${statusStyles[prop.status] || 'bg-slate-600 text-white'}`}>
                  {prop.status.replace('_', ' ').toUpperCase()}
                </span>
                <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-red-400 transition-colors">
                  <Heart className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-3">
                  <p className="text-xl font-display font-bold text-white drop-shadow-lg">{formatPrice(prop.price)}</p>
                </div>
                <div className="absolute bottom-3 right-3 flex items-center gap-2 text-white/70 text-xs">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{prop.views}</span>
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{prop.favorites}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-display font-semibold text-white text-sm truncate group-hover:text-brand-400 transition-colors">
                  {prop.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  {prop.address.street}, {prop.address.city}
                </p>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.04]">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Bed className="w-3.5 h-3.5" />{prop.bedrooms} Bed
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Bath className="w-3.5 h-3.5" />{prop.bathrooms} Bath
                  </span>
                  {prop.squareFeet && (
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Maximize className="w-3.5 h-3.5" />{prop.squareFeet.toLocaleString()} sqft
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, (f.page || 1) - 1) }))}
            disabled={pagination.page === 1}
            className="btn-ghost py-2 px-3 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-slate-400">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => setFilters((f) => ({ ...f, page: Math.min(pagination.pages, (f.page || 1) + 1) }))}
            disabled={pagination.page === pagination.pages}
            className="btn-ghost py-2 px-3 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
