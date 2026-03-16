import { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import FilterBar, { type PublicFilters } from '../../components/public/FilterBar';
import PropertyCard from '../../components/public/PropertyCard';
import PropertyMap from '../../components/public/PropertyMap';
import { usePublicProperties, MOCK_PUBLIC_PROPERTIES } from '../../hooks/useProperties';

const PAGE_SIZE = 12;

export default function PropertiesPublicPage() {
  const [filters, setFilters] = useState<PublicFilters>({});
  const [highlightedId, setHighlightedId] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const { data: propertiesData, isLoading } = usePublicProperties({
    city: filters.location,
    propertyType: filters.propertyType,
    status: filters.status,
    page,
    limit: PAGE_SIZE,
  });

  const rawProperties = propertiesData?.data ?? MOCK_PUBLIC_PROPERTIES;

  // Client-side filters
  const filteredProperties = useMemo(() => {
    let result = [...rawProperties];

    if (filters.priceRange) {
      const [minStr, maxStr] = filters.priceRange.split('-');
      const min = parseInt(minStr, 10);
      const max = parseInt(maxStr, 10);
      result = result.filter((p) => p.price >= min && p.price <= max);
    }

    if (filters.bedrooms) {
      const minBeds = parseInt(filters.bedrooms, 10);
      result = result.filter((p) => p.bedrooms >= minBeds);
    }

    switch (filters.sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'beds_desc':
        result.sort((a, b) => b.bedrooms - a.bedrooms);
        break;
      default:
        result.sort(
          (a, b) => new Date(b.listedDate).getTime() - new Date(a.listedDate).getTime()
        );
    }

    return result;
  }, [rawProperties, filters]);

  const total = filteredProperties.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const pagedProperties = filteredProperties.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterChange = useCallback((newFilters: PublicFilters) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  return (
    <div className="bg-cream min-h-screen">
      {/* Page Title */}
      <div className="bg-navy-500 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-display font-bold text-3xl text-white mb-1">
            Ontario Properties
          </h1>
          <p className="text-white/60 text-sm">
            Browse MLS listings across the GTA and Southern Ontario
          </p>
        </div>
      </div>

      {/* Sticky Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        total={total}
      />

      {/* Main Content: List + Map */}
      <div className="flex h-[calc(100vh-10rem)]">
        {/* Left: Scrollable Property List */}
        <div className="w-full lg:w-[420px] xl:w-[480px] flex-shrink-0 overflow-y-auto bg-cream border-r border-gray-200">
          <div className="p-4 space-y-4">
            {isLoading ? (
              // Skeleton loading
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card-public overflow-hidden animate-pulse">
                  <div className="aspect-video bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                </div>
              ))
            ) : pagedProperties.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400 text-sm font-medium">No properties found.</p>
                <button
                  onClick={() => handleFilterChange({})}
                  className="mt-3 text-navy-500 text-sm font-semibold hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-400 font-medium px-1">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} listings
                </p>

                {pagedProperties.map((property) => (
                  <div
                    key={property._id}
                    onMouseEnter={() => setHighlightedId(property._id)}
                    onMouseLeave={() => setHighlightedId(undefined)}
                  >
                    <PropertyCard
                      property={property}
                      highlighted={highlightedId === property._id}
                    />
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-4 pb-6">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg border border-gray-200 hover:border-navy-300 hover:bg-navy-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${
                              pageNum === page
                                ? 'bg-navy-500 text-white'
                                : 'text-gray-500 hover:bg-gray-100'
                            }`}
                            aria-label={`Go to page ${pageNum}`}
                            aria-current={pageNum === page ? 'page' : undefined}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      {totalPages > 5 && (
                        <span className="text-gray-400 text-sm px-1">...</span>
                      )}
                    </div>

                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-2 rounded-lg border border-gray-200 hover:border-navy-300 hover:bg-navy-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right: Sticky Map */}
        <div className="hidden lg:block flex-1 sticky top-0">
          <PropertyMap
            properties={filteredProperties}
            highlightedId={highlightedId}
            onMarkerClick={(id) => setHighlightedId(id)}
          />
        </div>
      </div>
    </div>
  );
}
