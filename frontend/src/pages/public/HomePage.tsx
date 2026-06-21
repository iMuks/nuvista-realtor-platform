import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Phone, ArrowRight, Star } from 'lucide-react';
import HeroSearch, { type SearchFilters } from '../../components/public/HeroSearch';
import MarketStats from '../../components/public/MarketStats';
import FilterBar, { type PublicFilters } from '../../components/public/FilterBar';
import PropertyCard from '../../components/public/PropertyCard';
import PropertyMap from '../../components/public/PropertyMap';
import AgentCard from '../../components/public/AgentCard';
import { usePublicProperties, useAvailableCities, MOCK_PUBLIC_PROPERTIES } from '../../hooks/useProperties';
import { preloadImages } from '../../utils/imageCache';
import type { User } from '../../types';

/* ── Scroll-reveal hook ─────────────────────────────────── */
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return ref;
}

/* ── Mock agents ─────────────────────────────────────────── */
const MOCK_AGENTS: User[] = [
  {
    _id: 'a1', firstName: 'Sarah', lastName: 'Mitchell',
    email: 'sarah@nuvistarealty.ca', phone: '(519) 438-5478',
    role: 'broker', brokerage: 'NuVista Realty', licenseNumber: 'M22001234',
    bio: 'With 12+ years in the London and Southern Ontario market, Sarah specialises in luxury and executive properties.',
    fullName: 'Sarah Mitchell', isActive: true,
    createdAt: new Date(Date.now() - 3 * 365 * 86400000).toISOString(),
  },
  {
    _id: 'a2', firstName: 'James', lastName: 'Kowalski',
    email: 'james@nuvistarealty.ca', phone: '(519) 438-5479',
    role: 'agent', brokerage: 'NuVista Realty', licenseNumber: 'M24005678',
    bio: 'First-time buyer specialist helping families find the right home at the right price across the GTA.',
    fullName: 'James Kowalski', isActive: true,
    createdAt: new Date(Date.now() - 2 * 365 * 86400000).toISOString(),
  },
  {
    _id: 'a3', firstName: 'Priya', lastName: 'Nair',
    email: 'priya@nuvistarealty.ca', phone: '(519) 438-5480',
    role: 'agent', brokerage: 'NuVista Realty', licenseNumber: 'M23009012',
    bio: 'Investment property expert and relocation specialist helping clients maximise returns since 2019.',
    fullName: 'Priya Nair', isActive: true,
    createdAt: new Date(Date.now() - 1.5 * 365 * 86400000).toISOString(),
  },
];

function agentListingCount(id: string) {
  return MOCK_PUBLIC_PROPERTIES.filter((p) => p.agent?._id === id && p.status === 'active').length;
}

/* ── Why Choose NuVista data ─────────────────────────────── */
const WHY_ITEMS = [
  {
    icon: '🏆',
    title: 'Award-Winning Service',
    body: 'Consistently ranked among Ontario\'s top brokerages for client satisfaction and transaction volume.',
  },
  {
    icon: '📊',
    title: 'Live Market Intelligence',
    body: 'Real-time MLS® data, price trend analytics, and neighbourhood insights at your fingertips.',
  },
  {
    icon: '🤝',
    title: 'End-to-End Support',
    body: 'From your first search to closing day — our team is with you every step of the way.',
  },
  {
    icon: '📍',
    title: 'Local Expertise',
    body: 'Deep roots in London, GTA, and Southern Ontario with hyper-local neighbourhood knowledge.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Anita Sharma',
    role: 'First-time Buyer · Toronto',
    text: 'NuVista made buying our first home completely stress-free. Sarah guided us every step of the way and we closed $40K under asking.',
    stars: 5,
  },
  {
    name: 'Marcus & Talia Webb',
    role: 'Upsizers · Oakville',
    text: 'James found us our dream home in Bronte within two weeks. His knowledge of the local market is exceptional.',
    stars: 5,
  },
  {
    name: 'David Chen',
    role: 'Investor · Mississauga',
    text: 'Priya\'s investment insight helped me build a portfolio of three properties. Her advice on timing and location was spot on.',
    stars: 5,
  },
];

/* ═══════════════════════════════════════════════════════════ */
export default function HomePage() {
  const [filters,       setFilters]       = useState<PublicFilters>({});
  const [highlightedId, setHighlightedId] = useState<string | undefined>();

  const { data: availableCities = [] } = useAvailableCities();

  /* React Query — auto-refetch every 30s */
  const { data: propertiesData, isFetching } = usePublicProperties({
    city:         filters.location,
    propertyType: filters.propertyType,
    status:       filters.status,
  });

  // Show real API data when available; fall back to mock only on cold load with no filters
  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== '');
  const properties = propertiesData?.data ?? (hasActiveFilters ? [] : MOCK_PUBLIC_PROPERTIES);
  const total      = propertiesData?.pagination?.total ?? properties.length;

  // True loading = fetching AND no data at all to show yet
  const isLoadingFresh = isFetching && propertiesData === undefined;

  // Preload all primary images when the property list changes
  useEffect(() => {
    const urls = properties.flatMap((p) =>
      (p.images ?? []).map((img) => img.url).filter(Boolean)
    );
    preloadImages(urls);
  }, [properties]);

  /* Client-side price/bed/sort filter */
  const filtered = useMemo(() => {
    let r = [...properties];
    if (filters.priceRange) {
      const [lo, hi] = filters.priceRange.split('-').map(Number);
      r = r.filter((p) => p.price >= lo && p.price <= hi);
    }
    if (filters.bedrooms) r = r.filter((p) => p.bedrooms >= Number(filters.bedrooms));
    switch (filters.sortBy) {
      case 'price_asc':  r.sort((a, b) => a.price - b.price);       break;
      case 'price_desc': r.sort((a, b) => b.price - a.price);       break;
      case 'beds_desc':  r.sort((a, b) => b.bedrooms - a.bedrooms); break;
      default:           r.sort((a, b) => new Date(b.listedDate).getTime() - new Date(a.listedDate).getTime());
    }
    return r;
  }, [properties, filters]);

  const featured = useMemo(
    () => filtered.filter((p) => p.status === 'active').slice(0, 6),
    [filtered]
  );

  const handleHeroSearch = useCallback((sf: SearchFilters) => {
    setFilters({ location: sf.location, propertyType: sf.propertyType, priceRange: sf.priceRange, bedrooms: sf.bedrooms });
    const el = document.getElementById('listings-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  /* Reveal refs */
  const revealListings   = useReveal();
  const revealFeatured   = useReveal();
  const revealWhy        = useReveal();
  const revealAgents     = useReveal();
  const revealTestimonials = useReveal();
  const revealCta        = useReveal();

  return (
    <div style={{ background: '#f8f5f0' }}>

      {/* ══ HERO ══════════════════════════════════════════ */}
      <HeroSearch onSearch={handleHeroSearch} />

      {/* ══ LIVE MARKET STATS (dark strip) ═══════════════ */}
      <MarketStats />

      {/* ══ LISTINGS + MAP ════════════════════════════════ */}
      <section id="listings-section" className="pt-16 pb-10" aria-label="Property listings">
        <div className="max-w-screen-2xl mx-auto px-5 sm:px-8">

          <div ref={revealListings} className="reveal mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="label-overline mb-2">Live Listings</p>
              <h2 className="section-title">Browse Properties</h2>
              <p className="text-gray-400 text-sm mt-2 font-medium flex items-center gap-2">
                {isLoadingFresh ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-navy-300 border-t-navy-500 rounded-full animate-spin" />
                    Searching listings…
                  </>
                ) : (
                  <>{total} {total === 1 ? 'property' : 'properties'} match your search</>
                )}
              </p>
            </div>
            <Link
              to="/properties"
              className="hidden sm:flex items-center gap-1.5 text-[13.5px] font-semibold
                         text-navy-500 hover:text-gold-600 transition-colors group flex-shrink-0"
            >
              View all
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Filter + Cards + Map */}
          <div className="flex flex-col xl:flex-row gap-6">

            {/* Left: filters + card grid */}
            <div className="flex-1 xl:max-w-[640px] min-w-0">
              {/* Filter bar */}
              <div className="mb-5 bg-white rounded-2xl border border-gray-100 overflow-hidden"
                   style={{ boxShadow: '0 2px 12px rgba(15,43,82,0.06)' }}>
                <FilterBar
                  filters={filters}
                  onFilterChange={setFilters}
                  total={filtered.length}
                />
              </div>

              {/* Cards — loading skeleton */}
              {isLoadingFresh ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse"
                         style={{ boxShadow: '0 2px 16px rgba(15,43,82,0.07)' }}>
                      <div className="aspect-[16/10] bg-gray-200" />
                      <div className="p-5 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                        <div className="h-px bg-gray-100" />
                        <div className="flex gap-4">
                          <div className="h-3 bg-gray-100 rounded w-12" />
                          <div className="h-3 bg-gray-100 rounded w-12" />
                          <div className="h-3 bg-gray-100 rounded w-16" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl
                                border border-gray-100 text-center px-6">
                  <p className="text-3xl mb-3">🔍</p>
                  <p className="font-display text-navy-800 text-xl font-semibold mb-1">No listings found</p>
                  <p className="text-gray-400 text-sm mb-5">
                    {filters.location
                      ? `No properties found in "${filters.location}". Try one of the available cities below:`
                      : 'Try adjusting your filters'}
                  </p>
                  {filters.location && availableCities.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center mb-5">
                      {availableCities.slice(0, 8).map((city) => (
                        <button
                          key={city}
                          onClick={() => setFilters({ ...filters, location: city })}
                          className="px-3.5 py-1.5 rounded-full text-[13px] font-medium border border-navy-200
                                     text-navy-600 hover:bg-navy-50 transition-colors"
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => setFilters({})}
                    className="btn-navy text-sm px-5 py-2"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filtered.slice(0, 8).map((prop) => (
                    <div
                      key={prop._id}
                      onMouseEnter={() => setHighlightedId(prop._id)}
                      onMouseLeave={() => setHighlightedId(undefined)}
                    >
                      <PropertyCard
                        property={prop}
                        highlighted={highlightedId === prop._id}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: sticky map */}
            <div className="xl:flex-1 h-[480px] xl:h-auto xl:sticky xl:top-20
                            xl:max-h-[calc(100vh-6rem)] rounded-2xl overflow-hidden"
                 style={{ minHeight: '480px' }}>
              <PropertyMap
                properties={filtered}
                highlightedId={highlightedId}
                onMarkerClick={setHighlightedId}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══ FEATURED LISTINGS ════════════════════════════ */}
      <section className="py-20" style={{ background: '#f0ebe4' }} aria-label="Featured listings">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">

          <div ref={revealFeatured} className="reveal text-center mb-12">
            <p className="label-overline mb-3">Handpicked Properties</p>
            <h2 className="section-title mx-auto max-w-lg">
              Featured Listings
            </h2>
            <p className="text-gray-400 mt-3 max-w-lg mx-auto text-[15px] leading-relaxed">
              Curated selection of premier properties across Ontario's most sought-after communities.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((prop, i) => (
              <div
                key={prop._id}
                className="reveal"
                ref={(el) => {
                  if (el) {
                    el.style.transitionDelay = `${i * 80}ms`;
                    const obs = new IntersectionObserver(([e]) => {
                      if (e.isIntersecting) { el.classList.add('visible'); obs.disconnect(); }
                    }, { threshold: 0.1 });
                    obs.observe(el);
                  }
                }}
              >
                <PropertyCard property={prop} size={i === 0 ? 'large' : 'default'} />
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/properties" className="btn-ghost-navy">
              View All Listings
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══ WHY NUVISTA ══════════════════════════════════ */}
      <section className="py-20 bg-white" aria-label="Why NuVista">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left: text */}
            <div ref={revealWhy} className="reveal">
              <p className="label-overline mb-4">Why Choose Us</p>
              <h2 className="section-title mb-6">
                Ontario's Most Trusted<br />
                <em className="text-gold-500 not-italic">Real Estate Team</em>
              </h2>
              <p className="text-gray-500 text-[15px] leading-relaxed mb-8 max-w-md">
                Since 2009, NuVista Realty has been the brokerage families, investors, and
                developers trust for honest advice and exceptional results across Southern Ontario.
              </p>
              <Link to="/agents" className="btn-navy">
                Meet Our Team
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Right: feature grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {WHY_ITEMS.map((item, i) => (
                <div
                  key={item.title}
                  className="reveal p-6 rounded-2xl border border-gray-100 hover:border-gold-200
                             hover:shadow-lg hover:shadow-gold-100/50 transition-all duration-400 bg-white"
                  ref={(el) => {
                    if (el) {
                      el.style.transitionDelay = `${i * 80}ms`;
                      const obs = new IntersectionObserver(([e]) => {
                        if (e.isIntersecting) { el.classList.add('visible'); obs.disconnect(); }
                      }, { threshold: 0.1 });
                      obs.observe(el);
                    }
                  }}
                >
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h4 className="font-semibold text-navy-500 text-[15px] mb-1.5">{item.title}</h4>
                  <p className="text-gray-400 text-[13.5px] leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ OUR AGENTS ═══════════════════════════════════ */}
      <section
        id="agents"
        className="py-20"
        style={{ background: 'linear-gradient(180deg, #f0ebe4 0%, #f8f5f0 100%)' }}
        aria-label="Our agents"
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">

          <div ref={revealAgents} className="reveal text-center mb-14">
            <p className="label-overline mb-3">Meet the Team</p>
            <h2 className="section-title">Our Realtors</h2>
            <p className="text-gray-400 mt-3 max-w-lg mx-auto text-[15px] leading-relaxed">
              Experienced, dedicated professionals ready to guide you through every step of your real estate journey.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 max-w-4xl mx-auto">
            {MOCK_AGENTS.map((agent, i) => (
              <div
                key={agent._id}
                className="reveal"
                ref={(el) => {
                  if (el) {
                    el.style.transitionDelay = `${i * 100}ms`;
                    const obs = new IntersectionObserver(([e]) => {
                      if (e.isIntersecting) { el.classList.add('visible'); obs.disconnect(); }
                    }, { threshold: 0.1 });
                    obs.observe(el);
                  }
                }}
              >
                <AgentCard agent={agent} listingsCount={agentListingCount(agent._id)} />
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/agents" className="btn-ghost-navy">
              Meet All Agents
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ════════════════════════════════ */}
      <section className="py-20 bg-white" aria-label="Client testimonials">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">

          <div ref={revealTestimonials} className="reveal text-center mb-14">
            <p className="label-overline mb-3">What Clients Say</p>
            <h2 className="section-title">Trusted by Families<br />Across Ontario</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                className="reveal p-7 rounded-2xl bg-cream border border-gray-100
                           hover:border-gold-200 hover:shadow-lg transition-all duration-400"
                ref={(el) => {
                  if (el) {
                    el.style.transitionDelay = `${i * 100}ms`;
                    const obs = new IntersectionObserver(([e]) => {
                      if (e.isIntersecting) { el.classList.add('visible'); obs.disconnect(); }
                    }, { threshold: 0.1 });
                    obs.observe(el);
                  }
                }}
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-gold-400 text-gold-400" />
                  ))}
                </div>
                {/* Quote mark */}
                <p className="font-display text-4xl text-gold-300 leading-none mb-2 -mt-1">"</p>
                <p className="text-gray-600 text-[14px] leading-relaxed mb-5">{t.text}</p>
                <div className="border-t border-gray-100 pt-4">
                  <p className="font-semibold text-navy-500 text-[13.5px]">{t.name}</p>
                  <p className="text-gray-400 text-[12px] mt-0.5">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA BANNER ══════════════════════════════════ */}
      <section
        ref={revealCta}
        className="reveal relative py-24 overflow-hidden"
        aria-label="Call to action"
        style={{
          background: 'linear-gradient(135deg, #0b1d3a 0%, #0f2b52 50%, #0d2449 100%)',
        }}
      >
        {/* Gold orb */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10 pointer-events-none"
             style={{ background: 'radial-gradient(circle, #beaf87 0%, transparent 70%)' }} />
        <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full opacity-8 pointer-events-none"
             style={{ background: 'radial-gradient(circle, #beaf87 0%, transparent 70%)' }} />

        <div className="relative max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <p className="label-overline text-gold-400 mb-4">Start Your Journey</p>
          <h2 className="section-title-light mb-5">
            Ready to Find Your<br />
            <em className="italic text-gold-400">Dream Home?</em>
          </h2>
          <p className="text-white/55 text-[15px] mb-10 leading-relaxed max-w-xl mx-auto">
            Our team of experienced Ontario real estate professionals is here to help you every step of the way.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/agents" className="btn-gold px-8 py-3.5 text-[15px]">
              Contact an Agent
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="tel:5194385478"
              className="btn-ghost-white px-6 py-3.5 text-[15px]"
            >
              <Phone className="w-4 h-4" />
              (519) 438-5478
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
