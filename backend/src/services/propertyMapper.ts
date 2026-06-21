/**
 * Maps SimplyRETS response → NuVista Property schema
 * Updated to match actual SimplyRETS field layout.
 */

import slugify from 'slugify';
import type { SimplyRETSProperty } from './idxClient';

const STATUS_MAP: Record<string, string> = {
  Active:      'active',
  active:      'active',
  Pending:     'pending',
  pending:     'pending',
  Closed:      'sold',
  closed:      'sold',
  Sold:        'sold',
  sold:        'sold',
  Expired:     'active',
  'Coming Soon': 'coming_soon',
};

function mapType(type: string, subType?: string | null): string {
  const t = ((subType || type) ?? '').toLowerCase();
  if (t.includes('detach'))                              return 'detached';
  if (t.includes('semi'))                               return 'semi-detached';
  if (t.includes('town'))                               return 'townhouse';
  if (t.includes('condo') || t.includes('condominium')) return 'condo';
  if (t.includes('bungalow'))                           return 'bungalow';
  if (t.includes('duplex'))                             return 'duplex';
  // SimplyRETS uses 'RES' for residential detached
  if (t === 'res' || t === 'residential')               return 'detached';
  return 'detached';
}

export function mapSimplyRETSToProperty(src: SimplyRETSProperty) {
  const mlsId  = String(src.mlsId);                 // convert int → string
  const addr   = src.address;                        // TOP-LEVEL in actual API
  const city   = addr?.city  || 'Unknown';
  const province = addr?.state || 'ON';
  const street = addr?.full
    ?? (`${addr?.streetNumber ?? ''} ${addr?.streetName ?? ''}`.trim() || 'Unknown');

  // Status lives in mls.status; top-level status is often null
  const rawStatus = src.mls?.status ?? src.status ?? 'Active';
  const status    = STATUS_MAP[rawStatus] || 'active';

  const slug = slugify(`${mapType(src.property.type)}-${city}-${mlsId}`.toLowerCase(), { strict: true });

  // Bathrooms: prefer bathsFull + 0.5*bathsHalf, fall back to property.bathrooms
  const baths = (src.property.bathsFull ?? 0) + (src.property.bathsHalf ?? 0) * 0.5
    || src.property.bathrooms
    || 0;

  // Lot size: can be string "127X146" or number
  let lotSize: number | undefined;
  if (typeof src.property.lotSizeArea === 'number') lotSize = src.property.lotSizeArea;
  else if (typeof src.property.lotSize === 'number') lotSize = src.property.lotSize;

  return {
    mlsNumber: mlsId,
    slug,
    title: buildTitle(src),
    description: src.remarks || '',
    propertyType: mapType(src.property.type, src.property.subType),
    status,

    address: {
      street,
      city,
      province,
      postalCode: addr?.postalCode || '',
      country:   addr?.country    || 'United States',
      ...(src.geo
        ? { location: { type: 'Point' as const, coordinates: [src.geo.lng, src.geo.lat] } }
        : {}),
    },

    price:      src.listPrice,
    soldPrice:  src.sales?.closePrice,
    soldDate:   src.sales?.closeDate ? new Date(src.sales.closeDate) : undefined,

    bedrooms:   src.property.bedrooms  || 0,
    bathrooms:  baths,
    squareFeet: src.property.area,
    lotSize,
    yearBuilt:  src.property.yearBuilt,

    parkingSpaces: src.property.parking?.spaces ?? (src.property.garageSpaces ? Math.round(src.property.garageSpaces) : undefined),
    garage: !!(src.property.parking?.description?.toLowerCase().includes('garage') || (src.property.garageSpaces ?? 0) > 0),

    features: [
      src.property.interiorFeatures,
      src.property.exteriorFeatures,
      src.property.pool ? `Pool: ${src.property.pool}` : null,
    ].filter(Boolean).join(', ').split(',').map((s) => s.trim()).filter(Boolean),

    images: (src.photos ?? []).map((url, i) => ({
      url,
      isPrimary: i === 0,
      caption: `Photo ${i + 1}`,
    })),

    neighbourhood: src.mls?.area || src.geo?.marketArea || src.property.subdivision,
    maintenanceFee: src.association?.fee,
    taxAmount: src.tax?.annualAmount,
    daysOnMarket: src.mls?.daysOnMarket ?? 0,

    listedDate: src.listDate ? new Date(src.listDate) : new Date(),

    _idxSource:    'simplyrets',
    _idxUpdatedAt: src.modified ? new Date(src.modified) : new Date(),
  };
}

function buildTitle(src: SimplyRETSProperty): string {
  const beds  = src.property.bedrooms ? `${src.property.bedrooms} Bed ` : '';
  const type  = capitalise(mapType(src.property.type, src.property.subType));
  const area  = src.mls?.area || src.geo?.marketArea || src.address?.city || '';
  return `${beds}${type}${area ? ` in ${area}` : ''}`;
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
