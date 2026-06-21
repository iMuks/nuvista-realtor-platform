import { useState, useEffect, useRef } from 'react';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';

export interface PublicFilters {
  location?: string;
  propertyType?: string;
  priceRange?: string;
  bedrooms?: string;
  status?: string;
  sortBy?: string;
}

interface FilterBarProps {
  filters: PublicFilters;
  onFilterChange: (filters: PublicFilters) => void;
  total: number;
}

const PROPERTY_TYPES = ['All', 'Detached', 'Semi-Detached', 'Townhouse', 'Condo', 'Bungalow'];
const STATUSES = ['Active', 'Sold', 'Pending', 'Coming Soon'];
const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Most Beds', value: 'beds_desc' },
];
const PRICE_RANGES = [
  { label: 'Any Price', value: '' },
  { label: 'Under $500K', value: '0-500000' },
  { label: '$500K – $750K', value: '500000-750000' },
  { label: '$750K – $1M', value: '750000-1000000' },
  { label: '$1M – $2M', value: '1000000-2000000' },
  { label: 'Over $2M', value: '2000000-999999999' },
];
const BEDROOM_OPTIONS = [
  { label: 'Any', value: '' },
  { label: '1+', value: '1' },
  { label: '2+', value: '2' },
  { label: '3+', value: '3' },
  { label: '4+', value: '4' },
  { label: '5+', value: '5' },
];

export default function FilterBar({ filters, onFilterChange, total }: FilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [locationInput, setLocationInput] = useState(filters.location || '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external filter changes (e.g. HeroSearch sets location) into local input state
  useEffect(() => {
    setLocationInput(filters.location || '');
  }, [filters.location]);

  const update = (key: keyof PublicFilters, value: string) => {
    onFilterChange({ ...filters, [key]: value || undefined });
  };

  const handleLocationChange = (value: string) => {
    setLocationInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onFilterChange({ ...filters, location: value || undefined });
    }, 400);
  };

  const clearAll = () => {
    onFilterChange({});
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== '');

  return (
    <div className="bg-white border-b border-gray-200 sticky top-16 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Top Row */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Location Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={locationInput}
              onChange={(e) => handleLocationChange(e.target.value)}
              placeholder="City or neighbourhood..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-500/30 transition-all"
              aria-label="Search by location"
            />
          </div>

          {/* Property Type Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {PROPERTY_TYPES.map((type) => {
              const value = type === 'All' ? '' : type.toLowerCase().replace('-', '-');
              const isActive = (filters.propertyType || '') === value;
              return (
                <button
                  key={type}
                  onClick={() => update('propertyType', value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-navy-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                  }`}
                  aria-pressed={isActive}
                  aria-label={`Filter by ${type}`}
                >
                  {type}
                </button>
              );
            })}
          </div>

          {/* Advanced Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              showAdvanced
                ? 'bg-navy-50 border-navy-200 text-navy-600'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
            aria-expanded={showAdvanced}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            More Filters
          </button>

          {/* Sort */}
          <div className="relative ml-auto hidden sm:block">
            <select
              value={filters.sortBy || 'newest'}
              onChange={(e) => update('sortBy', e.target.value)}
              className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-navy-500 appearance-none cursor-pointer bg-white"
              aria-label="Sort properties"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          {/* Count + Clear */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-navy-500 bg-navy-50 px-2.5 py-1 rounded-full">
              {total.toLocaleString()} {total === 1 ? 'listing' : 'listings'}
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
                aria-label="Clear all filters"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in">
            {/* Price Range */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                Price Range
              </label>
              <div className="relative">
                <select
                  value={filters.priceRange || ''}
                  onChange={(e) => update('priceRange', e.target.value)}
                  className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-navy-500 appearance-none cursor-pointer bg-white"
                  aria-label="Select price range"
                >
                  {PRICE_RANGES.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Bedrooms */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                Bedrooms
              </label>
              <div className="flex gap-1">
                {BEDROOM_OPTIONS.map((opt) => {
                  const isActive = (filters.bedrooms || '') === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => update('bedrooms', opt.value)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        isActive
                          ? 'bg-navy-500 text-white border-navy-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-navy-300'
                      }`}
                      aria-pressed={isActive}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status Pills */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                Status
              </label>
              <div className="flex gap-1 flex-wrap">
                {STATUSES.map((s) => {
                  const value = s.toLowerCase().replace(' ', '_');
                  const isActive = (filters.status || '') === value;
                  return (
                    <button
                      key={s}
                      onClick={() => update('status', isActive ? '' : value)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-navy-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      aria-pressed={isActive}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Sort */}
            <div className="sm:hidden">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                Sort By
              </label>
              <div className="relative">
                <select
                  value={filters.sortBy || 'newest'}
                  onChange={(e) => update('sortBy', e.target.value)}
                  className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-navy-500 appearance-none cursor-pointer bg-white"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
