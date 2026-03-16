import { useState, useEffect, useCallback } from 'react';
import { MapPin, Search, ChevronDown } from 'lucide-react';

export interface SearchFilters {
  location?: string;
  propertyType?: string;
  priceRange?: string;
  bedrooms?: string;
}

interface HeroSearchProps {
  onSearch: (filters: SearchFilters) => void;
}

const BG_IMAGES = [
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1920&h=1080&fit=crop&q=85',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&h=1080&fit=crop&q=85',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&h=1080&fit=crop&q=85',
];

const CITIES = ['Toronto', 'Mississauga', 'Oakville', 'Burlington', 'London'];
const TABS   = ['Buy', 'Sell', 'New Developments'];

const PROPERTY_TYPES = [
  { label: 'All Types',      value: '' },
  { label: 'Detached',       value: 'detached' },
  { label: 'Semi-Detached',  value: 'semi-detached' },
  { label: 'Townhouse',      value: 'townhouse' },
  { label: 'Condo',          value: 'condo' },
  { label: 'Bungalow',       value: 'bungalow' },
];

const PRICE_RANGES = [
  { label: 'Any Price',      value: '' },
  { label: 'Under $500K',    value: '0-500000' },
  { label: '$500K – $750K',  value: '500000-750000' },
  { label: '$750K – $1M',    value: '750000-1000000' },
  { label: '$1M – $2M',      value: '1000000-2000000' },
  { label: 'Over $2M',       value: '2000000-999999999' },
];

const BEDROOM_OPTIONS = [
  { label: 'Any Beds', value: '' },
  { label: '1+',       value: '1' },
  { label: '2+',       value: '2' },
  { label: '3+',       value: '3' },
  { label: '4+',       value: '4' },
  { label: '5+',       value: '5' },
];

const HERO_STATS = [
  { value: '1,200+', label: 'Homes Sold' },
  { value: '284+',   label: 'Active Listings' },
  { value: '30+',    label: 'Cities Covered' },
  { value: '15 yrs', label: 'Experience' },
];

export default function HeroSearch({ onSearch }: HeroSearchProps) {
  const [location,     setLocation]     = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [priceRange,   setPriceRange]   = useState('');
  const [bedrooms,     setBedrooms]     = useState('');
  const [activeTab,    setActiveTab]    = useState(0);
  const [bgIndex,      setBgIndex]      = useState(0);
  const [cityIdx,      setCityIdx]      = useState(0);
  const [cityVisible,  setCityVisible]  = useState(true);
  const [mounted,      setMounted]      = useState(false);

  // Mount animation trigger
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Background crossfade every 6s
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((i) => (i + 1) % BG_IMAGES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // City cycling
  useEffect(() => {
    const interval = setInterval(() => {
      setCityVisible(false);
      setTimeout(() => {
        setCityIdx((i) => (i + 1) % CITIES.length);
        setCityVisible(true);
      }, 350);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = useCallback(() => {
    onSearch({
      location:     location     || undefined,
      propertyType: propertyType || undefined,
      priceRange:   priceRange   || undefined,
      bedrooms:     bedrooms     || undefined,
    });
  }, [location, propertyType, priceRange, bedrooms, onSearch]);

  return (
    <section
      className="relative flex items-center justify-center overflow-hidden"
      style={{ minHeight: '100svh' }}
      aria-label="Property search hero"
    >
      {/* ── Background images with Ken Burns ── */}
      {BG_IMAGES.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${src})`,
            opacity: i === bgIndex ? 1 : 0,
            transition: 'opacity 1.5s ease-in-out',
            animation: i === bgIndex ? 'kenBurns 18s ease-in-out infinite alternate' : 'none',
            zIndex: i === bgIndex ? 1 : 0,
          }}
          aria-hidden="true"
        />
      ))}

      {/* ── Gradient overlay — deep navy at bottom, transparent top ── */}
      <div
        className="absolute inset-0 z-[2]"
        style={{
          background: 'linear-gradient(to bottom, rgba(5,14,29,0.62) 0%, rgba(8,22,44,0.55) 40%, rgba(5,14,29,0.85) 100%)',
        }}
        aria-hidden="true"
      />

      {/* ── Subtle noise texture ── */}
      <div
        className="absolute inset-0 z-[3] opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
        }}
        aria-hidden="true"
      />

      {/* ── Content ── */}
      <div className="relative z-[4] w-full max-w-5xl mx-auto px-5 sm:px-8 py-28 sm:py-32">

        {/* Overline badge */}
        <div
          className="inline-flex items-center gap-2.5 mb-7"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(16px)',
            transition: 'all 0.8s cubic-bezier(0.19,1,0.22,1) 0.1s',
          }}
        >
          <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse-dot" />
          <span className="text-[12.5px] font-semibold text-gold-300 uppercase tracking-[0.14em]">
            Ontario's Premier Real Estate Brokerage
          </span>
        </div>

        {/* ── Main headline ── */}
        <h1
          className="font-display font-bold text-white mb-5 leading-[1.1]"
          style={{
            fontSize: 'clamp(2.4rem, 6.5vw, 4.5rem)',
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(24px)',
            transition: 'all 0.9s cubic-bezier(0.19,1,0.22,1) 0.2s',
          }}
        >
          Find Your Perfect Home
          <br />
          <span className="italic text-gold-400">in{' '}</span>
          <span
            className="italic text-gold-400 inline-block"
            style={{
              opacity: cityVisible ? 1 : 0,
              transform: cityVisible ? 'translateY(0)' : 'translateY(10px)',
              transition: 'all 0.35s cubic-bezier(0.19,1,0.22,1)',
            }}
          >
            {CITIES[cityIdx]}
          </span>
        </h1>

        {/* Subheadline */}
        <p
          className="text-white/65 mb-9 max-w-lg font-light leading-relaxed"
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.9s cubic-bezier(0.19,1,0.22,1) 0.32s',
          }}
        >
          Browse thousands of MLS® listings across the GTA and Southern Ontario with real-time data.
        </p>

        {/* ── Search Card ── */}
        <div
          className="bg-white/[0.97] backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl shadow-black/30"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(28px)',
            transition: 'all 1s cubic-bezier(0.19,1,0.22,1) 0.45s',
          }}
        >
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`flex-1 py-3.5 text-[13px] font-semibold tracking-[0.01em] transition-all duration-200
                  ${activeTab === i
                    ? 'text-navy-500 border-b-2 border-navy-500 bg-white'
                    : 'text-gray-400 hover:text-gray-700 bg-gray-50/50'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Fields */}
          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">

              {/* Location */}
              <div className="lg:col-span-1">
                <label className="block text-[10.5px] font-semibold text-gray-400 mb-1.5 uppercase tracking-[0.1em]">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-500 pointer-events-none" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="City, neighbourhood…"
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl text-sm text-gray-900
                               placeholder-gray-400 border border-gray-200 bg-white
                               focus:outline-none focus:border-navy-400 focus:ring-2 focus:ring-navy-500/10
                               transition-all duration-200"
                    aria-label="Location"
                  />
                </div>
              </div>

              {/* Property Type */}
              <div>
                <label className="block text-[10.5px] font-semibold text-gray-400 mb-1.5 uppercase tracking-[0.1em]">
                  Property Type
                </label>
                <div className="relative">
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl text-sm text-gray-900
                               border border-gray-200 bg-white appearance-none cursor-pointer
                               focus:outline-none focus:border-navy-400 focus:ring-2 focus:ring-navy-500/10
                               transition-all duration-200"
                    aria-label="Property type"
                  >
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-[10.5px] font-semibold text-gray-400 mb-1.5 uppercase tracking-[0.1em]">
                  Price Range
                </label>
                <div className="relative">
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl text-sm text-gray-900
                               border border-gray-200 bg-white appearance-none cursor-pointer
                               focus:outline-none focus:border-navy-400 focus:ring-2 focus:ring-navy-500/10
                               transition-all duration-200"
                    aria-label="Price range"
                  >
                    {PRICE_RANGES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Bedrooms */}
              <div>
                <label className="block text-[10.5px] font-semibold text-gray-400 mb-1.5 uppercase tracking-[0.1em]">
                  Bedrooms
                </label>
                <div className="relative">
                  <select
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl text-sm text-gray-900
                               border border-gray-200 bg-white appearance-none cursor-pointer
                               focus:outline-none focus:border-navy-400 focus:ring-2 focus:ring-navy-500/10
                               transition-all duration-200"
                    aria-label="Bedrooms"
                  >
                    {BEDROOM_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="w-full bg-navy-500 hover:bg-navy-600 text-white
                         py-4 rounded-xl font-semibold text-[15px] tracking-[0.01em]
                         transition-all duration-300 flex items-center justify-center gap-2.5
                         shadow-lg shadow-navy-500/25 hover:shadow-xl hover:shadow-navy-500/35
                         active:scale-[0.99]"
              aria-label="Search properties"
            >
              <Search className="w-5 h-5" />
              Search Properties
            </button>
          </div>
        </div>

        {/* ── Hero Stats ── */}
        <div
          className="flex flex-wrap items-center gap-x-8 gap-y-4 mt-10"
          style={{
            opacity: mounted ? 1 : 0,
            transition: 'opacity 0.8s ease 0.8s',
          }}
        >
          {HERO_STATS.map((stat, i) => (
            <div key={stat.label} className="flex items-center gap-3">
              {i > 0 && <span className="w-px h-8 bg-white/15 hidden sm:block" />}
              <div>
                <p className="font-display font-bold text-white leading-none" style={{ fontSize: '1.45rem' }}>
                  {stat.value}
                </p>
                <p className="text-white/45 text-xs mt-0.5 font-medium uppercase tracking-[0.1em]">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Scroll indicator ── */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[4] flex flex-col items-center gap-2"
        style={{
          opacity: mounted ? 0.6 : 0,
          transition: 'opacity 1s ease 1.2s',
        }}
        aria-hidden="true"
      >
        <span className="text-[10px] text-white/50 font-medium uppercase tracking-[0.16em]">Scroll</span>
        <div className="w-5 h-8 border border-white/30 rounded-full flex items-start justify-center pt-1.5">
          <div className="w-0.5 h-2 bg-white/50 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}
