import { useNavigate } from 'react-router-dom';
import { Bed, Bath, Maximize, Eye, MapPin } from 'lucide-react';
import type { Property } from '../../types';

interface PropertyCardProps {
  property: Property;
  onClick?: () => void;
  highlighted?: boolean;
  size?: 'default' | 'large';
}

function formatPrice(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  return `$${(val / 1_000).toFixed(0)}K`;
}

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  active:      { label: 'Active',        bg: '#d1fae5', text: '#065f46' },
  sold:        { label: 'Sold',          bg: '#dbeafe', text: '#1e40af' },
  pending:     { label: 'Under Contract',bg: '#fef3c7', text: '#92400e' },
  coming_soon: { label: 'Coming Soon',   bg: '#ede9fe', text: '#4c1d95' },
  delisted:    { label: 'Delisted',      bg: '#f3f4f6', text: '#374151' },
};

function isNewListing(listedDate: string): boolean {
  return Date.now() - new Date(listedDate).getTime() < 7 * 24 * 60 * 60 * 1000;
}

function daysAgo(date: string): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
}

export default function PropertyCard({
  property, onClick, highlighted = false, size = 'default',
}: PropertyCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) onClick();
    navigate(`/properties/${property._id}`);
  };

  const primaryImage =
    property.images?.find((img) => img.isPrimary)?.url ||
    property.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop&q=80';

  const status   = statusConfig[property.status] ?? { label: property.status, bg: '#f3f4f6', text: '#374151' };
  const isNew    = isNewListing(property.listedDate);
  const dListed  = daysAgo(property.listedDate);
  const isLarge  = size === 'large';

  return (
    <article
      onClick={handleClick}
      className="group cursor-pointer overflow-hidden bg-white rounded-2xl transition-all duration-500"
      style={{
        boxShadow: highlighted
          ? '0 0 0 2px #beaf87, 0 16px 48px rgba(190,175,135,0.25)'
          : '0 2px 16px rgba(15,43,82,0.07), 0 1px 4px rgba(15,43,82,0.04)',
        transform: highlighted ? 'translateY(-3px)' : undefined,
      }}
      onMouseEnter={(e) => {
        if (!highlighted) {
          (e.currentTarget as HTMLElement).style.boxShadow =
            '0 16px 48px rgba(15,43,82,0.14), 0 4px 16px rgba(15,43,82,0.08)';
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!highlighted) {
          (e.currentTarget as HTMLElement).style.boxShadow =
            '0 2px 16px rgba(15,43,82,0.07), 0 1px 4px rgba(15,43,82,0.04)';
          (e.currentTarget as HTMLElement).style.transform = '';
        }
      }}
      aria-label={`${property.title}, ${formatPrice(property.price)}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
    >
      {/* ── Image ── */}
      <div className={`relative overflow-hidden bg-gray-100 ${isLarge ? 'aspect-[4/3]' : 'aspect-[16/10]'}`}>
        <img
          src={primaryImage}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]
                     group-hover:scale-[1.06]"
          loading="lazy"
        />

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

        {/* Gold top accent line on hover */}
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gold-400 origin-left scale-x-0
                        group-hover:scale-x-100 transition-transform duration-500 ease-out z-10" />

        {/* Status badge */}
        <span
          className="absolute top-3.5 left-3.5 px-2.5 py-1 rounded-full text-[11px] font-semibold z-10"
          style={{ background: status.bg, color: status.text }}
        >
          {status.label}
        </span>

        {/* NEW badge */}
        {isNew && property.status === 'active' && (
          <span className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-full text-[11px]
                           font-bold bg-gold-400 text-navy-800 z-10 shadow-sm">
            NEW
          </span>
        )}

        {/* Price (bottom left) */}
        <div className="absolute bottom-0 inset-x-0 p-4 z-10">
          <p className="font-display font-bold text-white leading-none drop-shadow-lg"
             style={{ fontSize: isLarge ? '1.6rem' : '1.35rem' }}>
            {formatPrice(property.price)}
          </p>
          {property.status === 'sold' && property.soldPrice && property.soldPrice !== property.price && (
            <p className="text-white/65 text-xs mt-0.5 font-medium">
              Sold: {formatPrice(property.soldPrice)}
            </p>
          )}
        </div>

        {/* Views (bottom right) */}
        <div className="absolute bottom-4 right-4 flex items-center gap-1
                        text-white/60 text-[11px] z-10">
          <Eye className="w-3.5 h-3.5" />
          <span>{property.views}</span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-4 sm:p-5">
        {/* Title */}
        <h3 className="font-display font-semibold text-gray-900 leading-snug
                       group-hover:text-navy-500 transition-colors duration-200 line-clamp-1"
            style={{ fontSize: isLarge ? '1.1rem' : '0.95rem' }}>
          {property.title}
        </h3>

        {/* Address */}
        <p className="flex items-center gap-1.5 text-gray-400 text-[12.5px] mt-1.5 leading-tight">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gold-500" />
          <span className="truncate">{property.address.street}, {property.address.city}</span>
        </p>

        {/* Separator */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent my-3.5" />

        {/* Key stats */}
        <div className="flex items-center gap-4 text-[12.5px] text-gray-500 font-medium">
          <span className="flex items-center gap-1.5">
            <Bed className="w-3.5 h-3.5 text-navy-300" />
            {property.bedrooms}<span className="hidden sm:inline"> Bed</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Bath className="w-3.5 h-3.5 text-navy-300" />
            {property.bathrooms}<span className="hidden sm:inline"> Bath</span>
          </span>
          {property.squareFeet && (
            <span className="flex items-center gap-1.5">
              <Maximize className="w-3.5 h-3.5 text-navy-300" />
              {property.squareFeet.toLocaleString()}<span className="hidden sm:inline"> sqft</span>
            </span>
          )}

          {/* Days listed */}
          <span className="ml-auto text-[11px] text-gray-300 font-normal">
            {dListed === 0 ? 'Today' : dListed === 1 ? '1d ago' : `${dListed}d ago`}
          </span>
        </div>

        {/* Agent + MLS */}
        <div className="flex items-center justify-between mt-3">
          <p className="text-[11.5px] text-gray-400 truncate">
            {property.agent.firstName} {property.agent.lastName}
          </p>
          {property.mlsNumber && (
            <p className="text-[11px] text-gray-300 font-mono flex-shrink-0 ml-2">
              MLS® {property.mlsNumber}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
