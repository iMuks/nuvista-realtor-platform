import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Bed, Bath, Maximize, MapPin, Eye,
  Home, Car, CheckCircle2, Clock, Send, Phone, ChevronLeft,
  ChevronRight, Calendar, TrendingDown, TrendingUp, Star,
  Share2, Heart, Mail, X,
} from 'lucide-react';
import { useProperty } from '../../hooks/useProperties';
import PropertyMap from '../../components/public/PropertyMap';
import type { Property } from '../../types';

/* ── helpers ── */
function fmt(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  return `$${(v / 1_000).toFixed(0)}K`;
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
}

const STATUS: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  active:      { label: 'Active',         dot: '#10b981', text: '#065f46', bg: 'rgba(16,185,129,0.15)' },
  sold:        { label: 'Sold',           dot: '#3b82f6', text: '#1e40af', bg: 'rgba(59,130,246,0.15)' },
  pending:     { label: 'Under Contract', dot: '#f59e0b', text: '#92400e', bg: 'rgba(245,158,11,0.15)' },
  coming_soon: { label: 'Coming Soon',    dot: '#8b5cf6', text: '#4c1d95', bg: 'rgba(139,92,246,0.15)' },
};

/* ══════════════════════════════════════════════════════
   FULLSCREEN LIGHTBOX
══════════════════════════════════════════════════════ */
function Lightbox({ images, startIdx, onClose }: {
  images: Property['images'];
  startIdx: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIdx);
  const n = images.length;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft')  setIdx((i) => (i - 1 + n) % n);
      if (e.key === 'ArrowRight') setIdx((i) => (i + 1) % n);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, n]);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center"
      style={{ background: 'rgba(5,14,29,0.96)', backdropFilter: 'blur(16px)' }}
      onClick={onClose}
    >
      <button onClick={onClose}
        className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full flex items-center justify-center
                   text-white/50 hover:text-white transition-colors"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
        <X className="w-4 h-4" />
      </button>
      <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/30 text-xs font-medium tracking-widest">
        {idx + 1} / {n}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + n) % n); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full
                   flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
        <ChevronLeft className="w-5 h-5" />
      </button>
      <img
        src={images[idx]?.url}
        alt={images[idx]?.caption}
        className="max-w-[88vw] max-h-[82vh] object-contain rounded-2xl"
        style={{ boxShadow: '0 40px 80px rgba(0,0,0,0.7)' }}
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={(e) => { e.stopPropagation(); setIdx((i) => (i + 1) % n); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full
                   flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
        <ChevronRight className="w-5 h-5" />
      </button>
      {images[idx]?.caption && (
        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-xs tracking-wide">
          {images[idx].caption}
        </p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   HERO CAROUSEL — pure CSS crossfade, no key remounting
══════════════════════════════════════════════════════ */
function HeroCarousel({ images }: { images: Property['images']; title: string }) {
  const sorted  = [...images].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
  const total   = sorted.length;
  const [idx, setIdx]           = useState(0);
  const [saved, setSaved]       = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (total <= 1) return;
    timerRef.current = setInterval(() => setIdx((i) => (i + 1) % total), 6000);
  }, [total]);

  useEffect(() => { startTimer(); return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, [startTimer]);

  const goTo = (n: number) => { setIdx(((n % total) + total) % total); startTimer(); };

  if (total === 0) return null;

  return (
    <>
      {lightbox !== null && (
        <Lightbox images={sorted} startIdx={lightbox} onClose={() => setLightbox(null)} />
      )}

      <div className="w-full relative overflow-hidden" style={{ height: 'clamp(420px, 66vh, 780px)' }}>

        {/* ── All slides stacked — CSS opacity crossfade, NO key remounting ── */}
        {sorted.map((img, i) => (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              opacity:    i === idx ? 1 : 0,
              transition: 'opacity 0.75s cubic-bezier(0.4,0,0.2,1)',
              zIndex:     i === idx ? 2 : 1,
            }}
          >
            <img
              src={img.url}
              alt=""
              className="w-full h-full object-cover"
              style={{
                transform:  i === idx ? 'scale(1)' : 'scale(1.04)',
                transition: 'transform 6s ease-out',
              }}
              loading={i === 0 ? 'eager' : 'lazy'}
            />
          </div>
        ))}

        {/* ── Gradient vignette ── */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10,
          background: 'linear-gradient(to bottom, rgba(5,14,29,0.52) 0%, rgba(5,14,29,0) 28%, rgba(5,14,29,0) 52%, rgba(5,14,29,0.82) 100%)',
        }} />

        {/* ── Top HUD ── */}
        <div className="absolute top-0 inset-x-0 px-5 pt-5 z-20 flex items-center justify-between">
          {/* slide counter */}
          {total > 1 && (
            <div
              className="text-white text-xs font-semibold tracking-widest px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(5,14,29,0.45)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <span style={{ color: '#d4c59a' }}>{idx + 1}</span>
              <span className="text-white/30 mx-1">/</span>
              <span>{total}</span>
            </div>
          )}

          {/* action buttons */}
          <div className="flex gap-2 ml-auto">
            {[
              {
                label: 'Save',
                icon: <Heart className="w-4 h-4" style={{ color: saved ? '#ef4444' : 'white', fill: saved ? '#ef4444' : 'transparent', transition: 'all 0.3s' }} />,
                action: () => setSaved((s) => !s),
              },
              {
                label: 'Share',
                icon: <Share2 className="w-4 h-4 text-white" />,
                action: () => {},
              },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={btn.action}
                aria-label={btn.label}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                style={{ background: 'rgba(5,14,29,0.45)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {btn.icon}
              </button>
            ))}
          </div>
        </div>

        {/* ── Arrow controls ── */}
        {total > 1 && (
          <>
            <button onClick={() => goTo(idx - 1)} aria-label="Previous"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full
                         flex items-center justify-center text-white transition-all duration-200
                         hover:scale-110 group"
              style={{ background: 'rgba(5,14,29,0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <button onClick={() => goTo(idx + 1)} aria-label="Next"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full
                         flex items-center justify-center text-white transition-all duration-200
                         hover:scale-110 group"
              style={{ background: 'rgba(5,14,29,0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </>
        )}

        {/* ── Bottom bar: dots + caption + thumbnails ── */}
        <div className="absolute bottom-0 inset-x-0 z-20 px-5 pb-4">

          {/* dots + caption row */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/50 text-[11.5px] font-medium tracking-widest uppercase">
              {sorted[idx]?.caption ?? ''}
            </p>
            {total > 1 && total <= 10 && (
              <div className="flex items-center gap-1.5">
                {sorted.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className="rounded-full transition-all duration-400"
                    style={{
                      width:      i === idx ? 22 : 5,
                      height:     5,
                      background: i === idx ? '#beaf87' : 'rgba(255,255,255,0.3)',
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* thumbnail strip */}
          {total > 1 && (
            <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {sorted.map((img, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="flex-shrink-0 overflow-hidden rounded-xl transition-all duration-300"
                  style={{
                    width:      i === idx ? 80 : 64,
                    height:     52,
                    border:     i === idx ? '2px solid #beaf87' : '2px solid rgba(255,255,255,0.15)',
                    opacity:    i === idx ? 1 : 0.55,
                    transform:  i === idx ? 'translateY(-3px) scale(1.06)' : 'scale(1)',
                    boxShadow:  i === idx ? '0 0 0 2px rgba(190,175,135,0.3), 0 6px 20px rgba(0,0,0,0.4)' : 'none',
                  }}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}

              {/* "View All" button */}
              <button
                onClick={() => setLightbox(idx)}
                className="flex-shrink-0 overflow-hidden rounded-xl flex items-center justify-center
                           text-white text-[11px] font-semibold tracking-wide transition-all duration-200
                           hover:opacity-90"
                style={{
                  width: 64, height: 52,
                  background: 'rgba(15,43,82,0.7)',
                  border: '2px solid rgba(190,175,135,0.3)',
                  backdropFilter: 'blur(8px)',
                  flexDirection: 'column',
                  gap: 3,
                }}
              >
                <div className="grid grid-cols-2 gap-0.5 w-5 h-5">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="rounded-[2px]" style={{ background: 'rgba(190,175,135,0.6)' }} />
                  ))}
                </div>
                <span style={{ color: '#d4c59a', fontSize: 9 }}>ALL</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════
   VIEWING FORM
══════════════════════════════════════════════════════ */
function ViewingForm({ title }: { title: string }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', date: '',
    message: `I'd like to schedule a viewing for: ${title}`,
  });
  const [done, setDone] = useState(false);

  if (done) return (
    <div className="text-center py-8">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
           style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }}>
        <CheckCircle2 className="w-7 h-7 text-emerald-400" />
      </div>
      <p className="font-display font-bold text-white text-lg mb-1">Request Sent!</p>
      <p className="text-white/40 text-sm">We'll confirm your viewing within 2 hours.</p>
    </div>
  );

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const base: React.CSSProperties = {
    width: '100%', borderRadius: 10, padding: '11px 14px',
    fontSize: 13.5, outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'white',
  };
  const onF = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = '#beaf87';
    e.target.style.boxShadow = '0 0 0 3px rgba(190,175,135,0.1)';
  };
  const onB = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
    e.target.style.boxShadow = 'none';
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); setDone(true); }} className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2.5">
        <input type="text"  value={form.name}  onChange={update('name')}  placeholder="Full name"  required aria-label="Name"  style={base} onFocus={onF} onBlur={onB} />
        <input type="tel"   value={form.phone} onChange={update('phone')} placeholder="Phone"               aria-label="Phone" style={base} onFocus={onF} onBlur={onB} />
      </div>
      <input type="email" value={form.email} onChange={update('email')} placeholder="Email address" required aria-label="Email" style={base} onFocus={onF} onBlur={onB} />
      <input type="date"  value={form.date}  onChange={update('date')}
             min={new Date().toISOString().split('T')[0]} aria-label="Date"
             style={{ ...base, colorScheme: 'dark' }} onFocus={onF} onBlur={onB} />
      <textarea value={form.message} onChange={update('message')} rows={3}
                aria-label="Message" style={{ ...base, resize: 'none' }} onFocus={onF} onBlur={onB} />
      <button
        type="submit"
        className="w-full py-3.5 rounded-xl font-bold text-[14px] flex items-center justify-center
                   gap-2.5 transition-all duration-300 hover:scale-[1.015] active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, #c9b882 0%, #beaf87 50%, #a89468 100%)',
          color: '#0a1628',
          boxShadow: '0 4px 20px rgba(190,175,135,0.38), inset 0 1px 0 rgba(255,255,255,0.18)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 8px 28px rgba(190,175,135,0.52), inset 0 1px 0 rgba(255,255,255,0.18)')}
        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(190,175,135,0.38), inset 0 1px 0 rgba(255,255,255,0.18)')}
      >
        <Send className="w-4 h-4" />
        Request a Viewing
      </button>
    </form>
  );
}

/* ══════════════════════════════════════════════════════
   SKELETON
══════════════════════════════════════════════════════ */
function Skeleton() {
  return (
    <div className="min-h-screen" style={{ background: '#f5f2ed' }}>
      <div className="w-full bg-gray-200 animate-pulse" style={{ height: '66vh', marginTop: 72 }} />
      <div className="max-w-[1300px] mx-auto px-5 sm:px-8 lg:px-12 py-12
                      grid lg:grid-cols-[1fr_390px] gap-14 animate-pulse">
        <div className="space-y-6">
          <div className="h-10 bg-gray-200 rounded-xl w-3/4" />
          <div className="h-5 bg-gray-100 rounded w-1/2" />
          <div className="grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-72 bg-gray-200 rounded-2xl" />
          <div className="h-44 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   SECTION TITLE
══════════════════════════════════════════════════════ */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <h2
        className="font-display font-bold flex-shrink-0"
        style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.55rem)', color: '#0a1628' }}
      >
        {children}
      </h2>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(190,175,135,0.4) 0%, transparent 100%)' }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════ */
export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: property, isLoading } = useProperty(id ?? '');

  if (isLoading) return <Skeleton />;

  if (!property) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f2ed' }}>
      <div className="text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
             style={{ background: 'rgba(15,43,82,0.06)', border: '1px solid rgba(15,43,82,0.1)' }}>
          <Home className="w-9 h-9" style={{ color: '#beaf87' }} />
        </div>
        <h2 className="font-display font-bold text-2xl mb-2" style={{ color: '#0a1628' }}>Property not found</h2>
        <p className="text-gray-400 mb-6 text-sm">This listing may have been removed.</p>
        <Link to="/properties" className="btn-navy">Browse Listings</Link>
      </div>
    </div>
  );

  const st = STATUS[property.status] ?? { label: property.status, dot: '#6b7280', text: '#374151', bg: 'rgba(107,114,128,0.12)' };

  const details = [
    { icon: Bed,      label: 'Bedrooms',  value: `${property.bedrooms}` },
    { icon: Bath,     label: 'Bathrooms', value: `${property.bathrooms}` },
    ...(property.squareFeet    ? [{ icon: Maximize, label: 'Sq Ft',      value: property.squareFeet.toLocaleString() }] : []),
    { icon: Home,     label: 'Type',      value: property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1) },
    ...(property.yearBuilt     ? [{ icon: Calendar, label: 'Built',      value: `${property.yearBuilt}` }] : []),
    ...(property.parkingSpaces !== undefined ? [{ icon: Car, label: 'Parking', value: `${property.parkingSpaces}` }] : []),
    { icon: Eye,      label: 'Views',     value: `${property.views}` },
    { icon: Clock,    label: 'Days',      value: `${property.daysOnMarket}` },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#f5f2ed' }}>

      {/* ═══ HERO CAROUSEL ═══ */}
      <div style={{ paddingTop: 72 }}>
        <HeroCarousel images={property.images} title={property.title} />
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="max-w-[1300px] mx-auto px-5 sm:px-8 lg:px-12 py-10 lg:py-14">

        {/* Back */}
        <Link
          to="/properties"
          className="inline-flex items-center gap-2 text-[13px] font-semibold
                     hover:text-navy-500 transition-colors group mb-10"
          style={{ color: '#9ca3af' }}
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
          Back to Listings
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_390px] gap-12 lg:gap-16 items-start">

          {/* ═══ LEFT COLUMN ═══ */}
          <div className="space-y-12 min-w-0">

            {/* ── Header ── */}
            <div>
              {/* badges */}
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-bold tracking-wide"
                  style={{ background: st.bg, color: st.text }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: st.dot }} />
                  {st.label}
                </span>
                {property.mlsNumber && (
                  <span className="text-[11.5px] font-mono font-medium tracking-wider" style={{ color: '#b0a090' }}>
                    MLS® {property.mlsNumber}
                  </span>
                )}
              </div>

              {/* title */}
              <h1
                className="font-display font-bold leading-[1.1] mb-3"
                style={{ fontSize: 'clamp(1.9rem, 4vw, 3rem)', color: '#0a1628' }}
              >
                {property.title}
              </h1>

              {/* address */}
              <p className="flex items-center gap-2 mb-7 text-[14px]" style={{ color: '#8a7d6b' }}>
                <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: '#beaf87' }} />
                {property.address.street}, {property.address.city}, {property.address.province} {property.address.postalCode}
              </p>

              {/* ── Quick stats (bento 4-up) ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: Bed,     val: property.bedrooms,     label: 'Bedrooms' },
                  { icon: Bath,    val: property.bathrooms,    label: 'Bathrooms' },
                  ...(property.squareFeet ? [{ icon: Maximize, val: `${property.squareFeet.toLocaleString()}`, label: 'Sq Ft' }] : []),
                  { icon: Clock,   val: property.daysOnMarket, label: 'Days Listed' },
                ].slice(0, 4).map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div
                      key={i}
                      className="flex flex-col items-center justify-center py-5 rounded-2xl"
                      style={{
                        background: 'white',
                        border: '1px solid rgba(190,175,135,0.18)',
                        boxShadow: '0 2px 14px rgba(15,43,82,0.05)',
                      }}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                           style={{ background: 'linear-gradient(135deg, rgba(190,175,135,0.18) 0%, rgba(190,175,135,0.05) 100%)', border: '1px solid rgba(190,175,135,0.2)' }}>
                        <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18, color: '#b09f71' }} />
                      </div>
                      <span className="font-display font-bold text-[1.3rem] leading-none" style={{ color: '#0a1628' }}>
                        {s.val}
                      </span>
                      <span className="text-[10.5px] font-semibold uppercase tracking-widest mt-1" style={{ color: '#b0a090' }}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Description ── */}
            {property.description && (
              <section>
                <SectionTitle>About This Property</SectionTitle>
                <p className="text-[15px] leading-[1.9]" style={{ color: '#5c5c5c' }}>
                  {property.description}
                </p>
              </section>
            )}

            {/* ── Details grid ── */}
            <section>
              <SectionTitle>Property Details</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {details.map((d) => {
                  const Icon = d.icon;
                  return (
                    <div
                      key={d.label}
                      className="flex flex-col items-center text-center p-5 rounded-2xl
                                 cursor-default transition-all duration-300"
                      style={{ background: 'white', border: '1px solid rgba(190,175,135,0.15)', boxShadow: '0 2px 12px rgba(15,43,82,0.04)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = '0 0 0 1.5px rgba(190,175,135,0.4), 0 12px 36px rgba(190,175,135,0.16)';
                        e.currentTarget.style.borderColor = 'rgba(190,175,135,0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = '';
                        e.currentTarget.style.boxShadow = '0 2px 12px rgba(15,43,82,0.04)';
                        e.currentTarget.style.borderColor = 'rgba(190,175,135,0.15)';
                      }}
                    >
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                           style={{ background: 'linear-gradient(135deg, rgba(190,175,135,0.18) 0%, rgba(190,175,135,0.05) 100%)', border: '1px solid rgba(190,175,135,0.2)' }}>
                        <Icon style={{ width: 18, height: 18, color: '#b09f71' }} />
                      </div>
                      <p className="font-display font-bold text-lg leading-none mb-1" style={{ color: '#0a1628' }}>{d.value}</p>
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: '#b0a090' }}>{d.label}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── Features ── */}
            {property.features && property.features.length > 0 && (
              <section>
                <SectionTitle>Features &amp; Amenities</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {property.features.map((f) => (
                    <span
                      key={f}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl
                                 text-[13px] font-semibold transition-all duration-200 hover:-translate-y-0.5"
                      style={{
                        background: 'white', color: '#1a3060',
                        border: '1px solid rgba(190,175,135,0.25)',
                        boxShadow: '0 2px 8px rgba(190,175,135,0.08)',
                      }}
                    >
                      <CheckCircle2 style={{ width: 14, height: 14, color: '#beaf87', flexShrink: 0 }} />
                      {f}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* ── Photo gallery bento ── */}
            {property.images.length >= 3 && (
              <section>
                <SectionTitle>Gallery</SectionTitle>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[...property.images]
                    .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
                    .slice(0, 6)
                    .map((img, i) => (
                      <div
                        key={i}
                        className="relative group overflow-hidden rounded-2xl cursor-pointer"
                        style={{
                          aspectRatio: i === 0 ? '16/9' : '4/3',
                          gridColumn: i === 0 ? 'span 2' : 'span 1',
                        }}
                        onClick={() => {/* handled by lightbox in carousel */}}
                      >
                        <img
                          src={img.url}
                          alt={img.caption}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/18 transition-colors duration-300" />
                        {img.caption && (
                          <div
                            className="absolute bottom-0 inset-x-0 px-4 py-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{ background: 'linear-gradient(transparent, rgba(5,14,29,0.65))' }}
                          >
                            <p className="text-white text-[12px] font-medium">{img.caption}</p>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </section>
            )}

            {/* ── Price history ── */}
            {property.priceHistory && property.priceHistory.length > 0 && (
              <section>
                <SectionTitle>Price History</SectionTitle>
                <div className="rounded-2xl overflow-hidden"
                     style={{ background: 'white', border: '1px solid rgba(190,175,135,0.2)', boxShadow: '0 4px 20px rgba(190,175,135,0.08)' }}>
                  {property.priceHistory.map((entry, i) => {
                    const isUp = entry.event === 'increased' || entry.event === 'listed';
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between px-6 py-4"
                        style={{ borderBottom: i < property.priceHistory.length - 1 ? '1px solid rgba(190,175,135,0.1)' : 'none' }}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                               style={{ background: isUp ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)' }}>
                            {isUp ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-blue-500" />}
                          </div>
                          <div>
                            <p className="text-[13.5px] font-semibold capitalize" style={{ color: '#1a2540' }}>{entry.event}</p>
                            <p className="text-[12px] mt-0.5" style={{ color: '#9ca3af' }}>{fmtDate(entry.date)}</p>
                          </div>
                        </div>
                        <p className="font-display font-bold text-xl" style={{ color: '#0a1628' }}>{fmt(entry.price)}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Map ── */}
            <section>
              <SectionTitle>Location</SectionTitle>
              <div className="rounded-2xl overflow-hidden"
                   style={{ height: 300, border: '1px solid rgba(190,175,135,0.22)', boxShadow: '0 4px 28px rgba(190,175,135,0.12)' }}>
                <PropertyMap properties={[property]} />
              </div>
              {(property.walkScore || property.transitScore) && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {property.walkScore && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                         style={{ background: 'white', border: '1px solid rgba(190,175,135,0.18)', boxShadow: '0 2px 12px rgba(15,43,82,0.04)' }}>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#10b981' }} />
                      <span className="text-[12.5px] font-semibold" style={{ color: '#5c5c5c' }}>Walk Score</span>
                      <span className="font-display font-bold text-lg ml-auto" style={{ color: '#0a1628' }}>{property.walkScore}</span>
                      <span className="text-[11px]" style={{ color: '#b0a090' }}>/100</span>
                    </div>
                  )}
                  {property.transitScore && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                         style={{ background: 'white', border: '1px solid rgba(190,175,135,0.18)', boxShadow: '0 2px 12px rgba(15,43,82,0.04)' }}>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#3b82f6' }} />
                      <span className="text-[12.5px] font-semibold" style={{ color: '#5c5c5c' }}>Transit</span>
                      <span className="font-display font-bold text-lg ml-auto" style={{ color: '#0a1628' }}>{property.transitScore}</span>
                      <span className="text-[11px]" style={{ color: '#b0a090' }}>/100</span>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* ═══ RIGHT SIDEBAR ═══ */}
          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">

            {/* ── Price card (navy) ── */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(155deg, #091526 0%, #0f2b52 60%, #0c2244 100%)',
                border: '1px solid rgba(190,175,135,0.2)',
                boxShadow: '0 0 0 1px rgba(190,175,135,0.06), 0 32px 64px rgba(5,14,29,0.5)',
              }}
            >
              {/* gold shimmer top accent */}
              <div style={{ height: 3, background: 'linear-gradient(90deg, #7a6030 0%, #d4c59a 35%, #f0e0a0 55%, #beaf87 75%, #7a6030 100%)' }} />

              <div className="p-6">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: 'rgba(190,175,135,0.5)' }}>
                  Asking Price
                </p>
                <p
                  className="font-display font-bold text-white leading-none mb-3"
                  style={{ fontSize: 'clamp(2rem, 3.5vw, 2.7rem)' }}
                >
                  {fmt(property.price)}
                </p>
                {property.status === 'sold' && property.soldPrice && (
                  <p className="text-emerald-400 text-[13px] font-semibold mb-2">
                    Sold: {fmt(property.soldPrice)}
                  </p>
                )}
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-bold mb-5"
                  style={{ background: st.bg, color: st.text }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: st.dot }} />
                  {st.label}
                </span>

                {/* address block */}
                <div className="rounded-xl px-4 py-3 mb-4"
                     style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="flex items-start gap-2 text-[13px] leading-snug" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    <MapPin style={{ width: 14, height: 14, marginTop: 2, color: '#beaf87', flexShrink: 0 }} />
                    <span>
                      {property.address.street}<br />
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {property.address.city}, {property.address.province} {property.address.postalCode}
                      </span>
                    </span>
                  </p>
                </div>

                {/* financials */}
                {(property.taxAmount || property.maintenanceFee) && (
                  <div className="space-y-2 mb-4">
                    {property.taxAmount && (
                      <div className="flex justify-between items-center py-2.5 px-4 rounded-xl"
                           style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.38)' }}>Annual Tax</span>
                        <span className="font-semibold text-[13px] text-white">${property.taxAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {property.maintenanceFee && (
                      <div className="flex justify-between items-center py-2.5 px-4 rounded-xl"
                           style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.38)' }}>Maintenance</span>
                        <span className="font-semibold text-[13px] text-white">${property.maintenanceFee.toLocaleString()}/mo</span>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-[11.5px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  Listed {fmtDate(property.listedDate)}
                </p>
              </div>
            </div>

            {/* ── Agent card (white) ── */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: 'white',
                border: '1px solid rgba(190,175,135,0.2)',
                boxShadow: '0 4px 20px rgba(190,175,135,0.1)',
              }}
            >
              <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] mb-4" style={{ color: '#b0a090' }}>
                Listed By
              </p>
              <div className="flex items-center gap-3.5 mb-5">
                <div
                  className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center font-display font-bold text-xl flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #0f2b52 0%, #1e3f6e 100%)',
                    color: '#beaf87',
                    boxShadow: '0 4px 16px rgba(15,43,82,0.25)',
                  }}
                >
                  {property.agent.firstName[0]}{property.agent.lastName[0]}
                </div>
                <div>
                  <p className="font-semibold text-[15px] leading-tight" style={{ color: '#0a1628' }}>
                    {property.agent.firstName} {property.agent.lastName}
                  </p>
                  <p className="text-[11.5px] font-semibold mt-0.5" style={{ color: '#beaf87' }}>NuVista Realty</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} style={{ width: 11, height: 11, fill: '#f59e0b', color: '#f59e0b' }} />
                    ))}
                    <span className="text-[10.5px] ml-1" style={{ color: '#9ca3af' }}>5.0</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {property.agent.phone && (
                  <a
                    href={`tel:${property.agent.phone.replace(/\D/g, '')}`}
                    className="flex items-center justify-center gap-2.5 py-3 rounded-xl
                               font-semibold text-[13.5px] text-white transition-all duration-300 hover:scale-[1.02]"
                    style={{
                      background: 'linear-gradient(135deg, #0f2b52 0%, #0b1d3a 100%)',
                      boxShadow: '0 4px 16px rgba(15,43,82,0.28)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,43,82,0.45)')}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,43,82,0.28)')}
                  >
                    <Phone style={{ width: 14, height: 14 }} />
                    {property.agent.phone}
                  </a>
                )}
                <a
                  href={`mailto:${property.agent.email}`}
                  className="flex items-center justify-center gap-2.5 py-3 rounded-xl
                             font-semibold text-[13.5px] transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    background: 'rgba(15,43,82,0.05)',
                    color: '#0f2b52',
                    border: '1px solid rgba(15,43,82,0.12)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(15,43,82,0.09)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(15,43,82,0.05)')}
                >
                  <Mail style={{ width: 14, height: 14 }} />
                  Send Email
                </a>
              </div>
            </div>

            {/* ── Book viewing (navy) ── */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(155deg, #091526 0%, #0f2b52 100%)',
                border: '1px solid rgba(190,175,135,0.18)',
                boxShadow: '0 0 0 1px rgba(190,175,135,0.05), 0 20px 48px rgba(5,14,29,0.35)',
              }}
            >
              <div style={{ height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(190,175,135,0.55) 50%, transparent 100%)' }} />
              <div className="p-6">
                <h3 className="font-display font-bold text-white text-[1.15rem] mb-1">Book a Viewing</h3>
                <p className="text-[12px] mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Private showings 7 days/week · Confirmed in 2 hrs
                </p>
                <ViewingForm title={property.title} />
              </div>
            </div>

          </div>
          {/* end sidebar */}
        </div>
      </div>
    </div>
  );
}
