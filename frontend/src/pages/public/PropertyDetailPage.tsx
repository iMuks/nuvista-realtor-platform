import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Bed, Bath, Maximize, MapPin, Calendar, Eye,
  Home, Car, TrendingDown, CheckCircle2, Clock, Send, Phone,
} from 'lucide-react';
import { useProperty } from '../../hooks/useProperties';
import PropertyMap from '../../components/public/PropertyMap';
import type { Property } from '../../types';

function formatPrice(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  return `$${(val / 1_000).toFixed(0)}K`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  active: { label: 'Active', classes: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  sold: { label: 'Sold', classes: 'bg-blue-100 text-blue-700 border border-blue-200' },
  pending: { label: 'Under Contract', classes: 'bg-amber-100 text-amber-700 border border-amber-200' },
  coming_soon: { label: 'Coming Soon', classes: 'bg-purple-100 text-purple-700 border border-purple-200' },
};

function ImageGallery({ images }: { images: Property['images'] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const sorted = [...images].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));

  if (sorted.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* Primary Image */}
      <div className="aspect-[16/9] overflow-hidden rounded-2xl bg-gray-100">
        <img
          src={sorted[activeIdx]?.url}
          alt={sorted[activeIdx]?.caption || 'Property image'}
          className="w-full h-full object-cover transition-all duration-300"
        />
      </div>
      {/* Thumbnails */}
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sorted.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                i === activeIdx
                  ? 'border-navy-500 opacity-100'
                  : 'border-transparent opacity-60 hover:opacity-90'
              }`}
              aria-label={`View image ${i + 1}`}
              aria-pressed={i === activeIdx}
            >
              <img src={img.url} alt={img.caption || `Image ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ScheduleViewingForm({ propertyTitle }: { propertyTitle: string }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [message, setMessage] = useState(`I'd like to schedule a viewing for: ${propertyTitle}`);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        </div>
        <p className="font-semibold text-gray-900">Request Sent!</p>
        <p className="text-sm text-gray-500 mt-1">
          We'll be in touch within 2 hours to confirm your viewing.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your full name"
        required
        className="input-public text-sm py-2.5"
        aria-label="Full name"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address"
        required
        className="input-public text-sm py-2.5"
        aria-label="Email address"
      />
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone number"
        className="input-public text-sm py-2.5"
        aria-label="Phone number"
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="input-public text-sm py-2.5"
        aria-label="Preferred viewing date"
        min={new Date().toISOString().split('T')[0]}
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        className="input-public text-sm py-2.5 resize-none"
        aria-label="Message"
      />
      <button type="submit" className="btn-navy w-full">
        <Send className="w-4 h-4" />
        Request a Viewing
      </button>
    </form>
  );
}

function PropertyDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="aspect-video bg-gray-200 rounded-2xl" />
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="card-public p-6 space-y-3">
            <div className="h-8 bg-gray-200 rounded w-32" />
            <div className="h-4 bg-gray-100 rounded w-48" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: property, isLoading } = useProperty(id ?? '');

  if (isLoading) return <PropertyDetailSkeleton />;

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Property not found.</p>
          <Link to="/properties" className="mt-4 btn-navy inline-flex">
            Browse Listings
          </Link>
        </div>
      </div>
    );
  }

  const status = statusConfig[property.status] ?? { label: property.status, classes: 'bg-gray-100 text-gray-600' };
  const details = [
    { icon: Bed, label: 'Bedrooms', value: `${property.bedrooms} Bed` },
    { icon: Bath, label: 'Bathrooms', value: `${property.bathrooms} Bath` },
    ...(property.squareFeet
      ? [{ icon: Maximize, label: 'Square Feet', value: `${property.squareFeet.toLocaleString()} sqft` }]
      : []),
    { icon: Home, label: 'Property Type', value: property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1) },
    ...(property.yearBuilt
      ? [{ icon: Calendar, label: 'Year Built', value: property.yearBuilt.toString() }]
      : []),
    ...(property.lotSize
      ? [{ icon: Maximize, label: 'Lot Size', value: `${property.lotSize.toLocaleString()} sqft` }]
      : []),
    ...(property.walkScore
      ? [{ icon: CheckCircle2, label: 'Walk Score', value: `${property.walkScore}/100` }]
      : []),
    ...(property.transitScore
      ? [{ icon: Car, label: 'Transit Score', value: `${property.transitScore}/100` }]
      : []),
  ];

  return (
    <div className="bg-cream min-h-screen pb-16">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm">
          <Link to="/" className="text-gray-400 hover:text-navy-500 transition-colors">Home</Link>
          <span className="text-gray-300">/</span>
          <Link to="/properties" className="text-gray-400 hover:text-navy-500 transition-colors">Properties</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-600 truncate max-w-xs">{property.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          to="/properties"
          className="inline-flex items-center gap-2 text-navy-500 hover:text-gold-600 font-semibold text-sm mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Listings
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Gallery + Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <ImageGallery images={property.images} />

            {/* Property Info Header */}
            <div>
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <span className={`badge-status text-xs mb-2 inline-flex ${status.classes}`}>
                    {status.label}
                  </span>
                  <h1 className="font-display font-bold text-2xl sm:text-3xl text-navy-500 leading-tight">
                    {property.title}
                  </h1>
                  <p className="flex items-center gap-1.5 text-gray-500 mt-2 text-sm">
                    <MapPin className="w-4 h-4 text-gold-500 flex-shrink-0" />
                    {property.address.street}, {property.address.city}, {property.address.province} {property.address.postalCode}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold text-3xl text-navy-500">
                    {formatPrice(property.price)}
                  </p>
                  {property.status === 'sold' && property.soldPrice && (
                    <p className="text-sm text-emerald-600 font-semibold mt-0.5">
                      Sold: {formatPrice(property.soldPrice)}
                    </p>
                  )}
                </div>
              </div>

              {/* Quick Stats Row */}
              <div className="flex flex-wrap gap-4 py-4 border-t border-b border-gray-100">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <Bed className="w-4 h-4 text-navy-400" /> {property.bedrooms} Bedrooms
                </span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <Bath className="w-4 h-4 text-navy-400" /> {property.bathrooms} Bathrooms
                </span>
                {property.squareFeet && (
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                    <Maximize className="w-4 h-4 text-navy-400" /> {property.squareFeet.toLocaleString()} sqft
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Eye className="w-4 h-4" /> {property.views} views
                </span>
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Clock className="w-4 h-4" /> {property.daysOnMarket} days on market
                </span>
                {property.mlsNumber && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-500">
                    MLS® {property.mlsNumber}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {property.description && (
              <section aria-label="Property description">
                <h2 className="font-display font-bold text-xl text-navy-500 mb-3">About This Property</h2>
                <p className="text-gray-600 leading-relaxed">{property.description}</p>
              </section>
            )}

            {/* Details Grid */}
            <section aria-label="Property details">
              <h2 className="font-display font-bold text-xl text-navy-500 mb-4">Property Details</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {details.map((detail) => {
                  const Icon = detail.icon;
                  return (
                    <div key={detail.label} className="card-public p-4 text-center">
                      <div className="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <Icon className="w-5 h-5 text-navy-500" />
                      </div>
                      <p className="font-bold text-gray-900 text-sm">{detail.value}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{detail.label}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Features */}
            {property.features && property.features.length > 0 && (
              <section aria-label="Property features">
                <h2 className="font-display font-bold text-xl text-navy-500 mb-4">Features & Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {property.features.map((feature) => (
                    <span
                      key={feature}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-50 text-navy-600 rounded-lg text-sm font-medium border border-navy-100"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-gold-500" />
                      {feature}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Price History */}
            {property.priceHistory && property.priceHistory.length > 0 && (
              <section aria-label="Price history">
                <h2 className="font-display font-bold text-xl text-navy-500 mb-4">Price History</h2>
                <div className="card-public overflow-hidden">
                  <div className="divide-y divide-gray-100">
                    {property.priceHistory.map((entry, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gold-50 rounded-lg flex items-center justify-center">
                            <TrendingDown className="w-4 h-4 text-gold-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{entry.event}</p>
                            <p className="text-xs text-gray-400">{formatDate(entry.date)}</p>
                          </div>
                        </div>
                        <p className="font-bold text-navy-500">{formatPrice(entry.price)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Map */}
            <section aria-label="Property location">
              <h2 className="font-display font-bold text-xl text-navy-500 mb-4">Location</h2>
              <div className="h-64 rounded-xl overflow-hidden">
                <PropertyMap properties={[property]} />
              </div>
            </section>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            {/* Price Card */}
            <div className="card-public p-6">
              <p className="font-display font-bold text-3xl text-navy-500 mb-1">
                {formatPrice(property.price)}
              </p>
              <span className={`badge-status text-xs mb-4 inline-flex ${status.classes}`}>
                {status.label}
              </span>
              <p className="text-sm text-gray-500 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gold-500" />
                {property.address.street}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                {property.address.city}, {property.address.province} {property.address.postalCode}
              </p>

              {/* Financial Details */}
              {(property.taxAmount || property.maintenanceFee) && (
                <div className="space-y-2 mb-4 pt-4 border-t border-gray-100">
                  {property.taxAmount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Annual Tax</span>
                      <span className="font-semibold text-gray-900">
                        ${property.taxAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {property.maintenanceFee && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Maintenance Fee</span>
                      <span className="font-semibold text-gray-900">
                        ${property.maintenanceFee.toLocaleString()}/mo
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Listed {formatDate(property.listedDate)}
                </p>
              </div>
            </div>

            {/* Agent Card */}
            <div className="card-public p-5">
              <h3 className="font-display font-semibold text-navy-500 mb-4 text-sm uppercase tracking-wide">
                Listed By
              </h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-navy-500 flex items-center justify-center text-gold-400 font-bold text-lg flex-shrink-0">
                  {property.agent.firstName[0]}{property.agent.lastName[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {property.agent.firstName} {property.agent.lastName}
                  </p>
                  <p className="text-xs text-gray-400">NuVista Realty</p>
                </div>
              </div>
              {property.agent.phone && (
                <a
                  href={`tel:${property.agent.phone.replace(/\D/g, '')}`}
                  className="btn-navy w-full mb-2"
                  aria-label={`Call ${property.agent.firstName} ${property.agent.lastName}`}
                >
                  <Phone className="w-4 h-4" />
                  {property.agent.phone}
                </a>
              )}
            </div>

            {/* Schedule Viewing Form */}
            <div className="card-public p-5">
              <h3 className="font-display font-semibold text-navy-500 mb-4">
                Schedule a Viewing
              </h3>
              <ScheduleViewingForm propertyTitle={property.title} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
