import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Property } from '../../types';

interface PropertyMapProps {
  properties: Property[];
  highlightedId?: string;
  onMarkerClick?: (id: string) => void;
}

function formatPriceShort(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(val / 1_000)}K`;
}

function createPriceIcon(price: number, isHighlighted: boolean): L.DivIcon {
  const label = formatPriceShort(price);
  const className = isHighlighted ? 'nuvista-marker nuvista-marker-highlighted' : 'nuvista-marker';
  return L.divIcon({
    className: '',
    html: `<div class="${className}">${label}</div>`,
    iconAnchor: [0, 0],
  });
}

function createPopupContent(property: Property): string {
  const primaryImage =
    property.images?.find((img) => img.isPrimary)?.url ||
    property.images?.[0]?.url ||
    '';

  const statusLabel =
    property.status === 'coming_soon' ? 'Coming Soon' : property.status.charAt(0).toUpperCase() + property.status.slice(1);

  const statusColorMap: Record<string, string> = {
    active: '#16a34a',
    sold: '#2563eb',
    pending: '#d97706',
    coming_soon: '#7c3aed',
    delisted: '#6b7280',
  };
  const statusColor = statusColorMap[property.status] ?? '#6b7280';

  return `
    <div style="font-family: Inter, sans-serif; width: 220px;">
      ${
        primaryImage
          ? `<img src="${primaryImage}" alt="${property.title}" style="width:100%;height:130px;object-fit:cover;" loading="lazy" />`
          : ''
      }
      <div style="padding: 12px;">
        <span style="display:inline-block;background:${statusColor}20;color:${statusColor};font-size:10px;font-weight:600;padding:2px 8px;border-radius:12px;margin-bottom:6px;">${statusLabel}</span>
        <p style="font-size:18px;font-weight:700;color:#0f2b52;margin:0 0 4px 0;">${formatPriceShort(property.price)}</p>
        <p style="font-size:11px;color:#374151;margin:0 0 8px 0;line-height:1.4;">${property.address.street}, ${property.address.city}</p>
        <div style="display:flex;gap:10px;margin-bottom:10px;">
          <span style="font-size:11px;color:#6b7280;">🛏 ${property.bedrooms}</span>
          <span style="font-size:11px;color:#6b7280;">🚿 ${property.bathrooms}</span>
          ${property.squareFeet ? `<span style="font-size:11px;color:#6b7280;">📐 ${property.squareFeet.toLocaleString()} sqft</span>` : ''}
        </div>
        <a href="/properties/${property._id}" style="display:block;text-align:center;background:#0f2b52;color:white;text-decoration:none;font-size:12px;font-weight:600;padding:8px;border-radius:8px;">View Details →</a>
      </div>
    </div>
  `;
}

// Component to handle fly-to when properties change
function MapController({ properties }: { properties: Property[] }) {
  const map = useMap();

  useEffect(() => {
    if (properties.length === 0) return;

    const validCoords = properties.filter(
      (p) =>
        p.address.location?.coordinates &&
        p.address.location.coordinates.length === 2 &&
        Math.abs(p.address.location.coordinates[0]) > 0
    );

    if (validCoords.length === 0) return;

    if (validCoords.length === 1) {
      const coords = validCoords[0].address.location!.coordinates;
      map.flyTo([coords[1], coords[0]], 13, { duration: 0.8 });
      return;
    }

    const bounds = L.latLngBounds(
      validCoords.map((p) => {
        const [lng, lat] = p.address.location!.coordinates;
        return [lat, lng] as [number, number];
      })
    );
    map.flyToBounds(bounds, { padding: [40, 40], duration: 0.8 });
  }, [properties, map]);

  return null;
}

// Component to handle markers
function PropertyMarkers({
  properties,
  highlightedId,
  onMarkerClick,
}: PropertyMapProps) {
  const map = useMap();
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    // Remove existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    properties.forEach((property) => {
      const coords = property.address.location?.coordinates;
      if (!coords || coords.length < 2) return;

      const [lng, lat] = coords;
      if (lat === 0 && lng === 0) return;

      const isHighlighted = property._id === highlightedId;
      const icon = createPriceIcon(property.price, isHighlighted);

      const marker = L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(createPopupContent(property), {
          maxWidth: 220,
          className: 'nuvista-popup',
        });

      marker.on('click', () => {
        if (onMarkerClick) onMarkerClick(property._id);
        marker.openPopup();
      });

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [properties, highlightedId, map, onMarkerClick]);

  return null;
}

export default function PropertyMap({ properties, highlightedId, onMarkerClick }: PropertyMapProps) {
  // Default center: GTA (Ontario)
  const defaultCenter: [number, number] = [43.7, -79.4];
  const defaultZoom = 10;

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ width: '100%', height: '100%', minHeight: '400px' }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />
        <MapController properties={properties} />
        <PropertyMarkers
          properties={properties}
          highlightedId={highlightedId}
          onMarkerClick={onMarkerClick}
        />
      </MapContainer>
    </div>
  );
}
