/**
 * Seed script — London, ON sample listings for QA/dev
 * Run: npx ts-node scripts/seedLondon.ts
 */

import mongoose from 'mongoose';
import slugify from 'slugify';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.qa') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nuvista_qa';

const LONDON_PROPERTIES = [
  {
    mlsNumber: 'X8100001',
    title: '4 Bed Detached in Byron',
    description: 'Stunning 4-bedroom detached home in sought-after Byron. Open-concept main floor with hardwood throughout, gourmet kitchen with quartz countertops, finished walkout basement, and a beautifully landscaped backyard with deck. Minutes to Byron Optimist Sports Complex and top-rated schools.',
    propertyType: 'detached',
    status: 'active',
    address: { street: '1234 Commissioners Rd W', city: 'London', province: 'ON', postalCode: 'N6K 1E6', country: 'Canada', location: { type: 'Point', coordinates: [-81.3301, 42.9533] } },
    price: 1_149_000, bedrooms: 4, bathrooms: 3, squareFeet: 2800, lotSize: 6200, yearBuilt: 2017,
    parkingSpaces: 2, garage: true,
    features: ['Hardwood Floors', 'Central AC', 'Finished Basement', 'Quartz Countertops', 'Pot Lights', 'Double Garage'],
    images: [
      { url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&h=1067&fit=crop&q=90', isPrimary: true, caption: 'Front exterior' },
      { url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Kitchen' },
      { url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Living room' },
    ],
    neighbourhood: 'Byron', daysOnMarket: 4, views: 0, favorites: 0, priceHistory: [], taxAmount: 7800, listedDate: new Date(Date.now() - 4 * 86400000),
  },
  {
    mlsNumber: 'X8100002',
    title: '3 Bed Semi-Detached in Old North',
    description: 'Charming 3-bedroom semi-detached in prestigious Old North London. Recently updated kitchen and baths, original hardwood floors, spacious rear yard with mature trees. Walk to Western University, Wortley Village, and Victoria Hospital. A rare find in one of London\'s most coveted neighbourhoods.',
    propertyType: 'semi-detached',
    status: 'active',
    address: { street: '456 Oxford St W', city: 'London', province: 'ON', postalCode: 'N6H 1S5', country: 'Canada', location: { type: 'Point', coordinates: [-81.2821, 43.0052] } },
    price: 749_000, bedrooms: 3, bathrooms: 2, squareFeet: 1600, lotSize: 3800, yearBuilt: 1965,
    parkingSpaces: 1, garage: false,
    features: ['Original Hardwood', 'Updated Kitchen', 'Updated Baths', 'Mature Trees', 'Walk to Western'],
    images: [
      { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&h=1067&fit=crop&q=90', isPrimary: true, caption: 'Curb appeal' },
      { url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Updated kitchen' },
    ],
    neighbourhood: 'Old North', daysOnMarket: 8, views: 0, favorites: 0, priceHistory: [], taxAmount: 5200, listedDate: new Date(Date.now() - 8 * 86400000),
  },
  {
    mlsNumber: 'X8100003',
    title: '2 Bed Condo in Downtown London',
    description: 'Modern 2-bedroom condo in the heart of Downtown London. Floor-to-ceiling windows with panoramic city views, open-concept layout, stainless steel appliances, and private balcony. Steps to Covent Garden Market, Victoria Park, and the best dining on Richmond Row.',
    propertyType: 'condo',
    status: 'active',
    address: { street: '330 Richmond St', city: 'London', province: 'ON', postalCode: 'N6A 3C7', country: 'Canada', location: { type: 'Point', coordinates: [-81.2498, 42.9849] } },
    price: 489_000, bedrooms: 2, bathrooms: 2, squareFeet: 980, yearBuilt: 2021,
    parkingSpaces: 1, garage: false, maintenanceFee: 520,
    features: ['Floor-to-Ceiling Windows', 'City Views', 'Private Balcony', 'Stainless Appliances', 'Concierge'],
    images: [
      { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&h=1067&fit=crop&q=90', isPrimary: true, caption: 'Open-concept living' },
      { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Primary suite' },
    ],
    neighbourhood: 'Downtown London', daysOnMarket: 2, views: 0, favorites: 0, priceHistory: [], taxAmount: 3100, listedDate: new Date(Date.now() - 2 * 86400000),
  },
  {
    mlsNumber: 'X8100004',
    title: '5 Bed Executive in Sunningdale',
    description: 'Magnificent 5-bedroom executive home on a premium lot in Sunningdale, North London. Grand foyer, chef\'s kitchen with Wolf appliances, main floor den, 3-car garage, and a resort-style backyard. Backing onto green space with no rear neighbours. Close to top schools and Masonville Mall.',
    propertyType: 'detached',
    status: 'active',
    address: { street: '2100 Sunningdale Rd E', city: 'London', province: 'ON', postalCode: 'N5X 4X3', country: 'Canada', location: { type: 'Point', coordinates: [-81.2105, 43.0412] } },
    price: 1_849_000, bedrooms: 5, bathrooms: 4, squareFeet: 4100, lotSize: 9500, yearBuilt: 2019,
    parkingSpaces: 3, garage: true,
    features: ['Wolf Appliances', '3-Car Garage', 'Resort Backyard', 'Main Floor Den', 'Green Space Views', 'Smart Home'],
    images: [
      { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&h=1067&fit=crop&q=90', isPrimary: true, caption: 'Grand exterior' },
      { url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Chef kitchen' },
      { url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Backyard' },
    ],
    neighbourhood: 'Sunningdale', daysOnMarket: 1, views: 0, favorites: 0, priceHistory: [], taxAmount: 12400, listedDate: new Date(Date.now() - 1 * 86400000),
  },
  {
    mlsNumber: 'X8100005',
    title: '3 Bed Townhouse in Lambeth',
    description: 'Beautiful 3-bedroom end-unit townhouse in Lambeth, South London. Bright open-concept main floor, updated kitchen with granite island, finished basement, and private patio. Low-maintenance living in a family-friendly community close to White Oaks Mall, parks, and 401 access.',
    propertyType: 'townhouse',
    status: 'active',
    address: { street: '78 Cranbrook Rd', city: 'London', province: 'ON', postalCode: 'N6P 1H8', country: 'Canada', location: { type: 'Point', coordinates: [-81.2750, 42.9310] } },
    price: 649_000, bedrooms: 3, bathrooms: 3, squareFeet: 1750, lotSize: 2200, yearBuilt: 2015,
    parkingSpaces: 2, garage: true,
    features: ['End Unit', 'Granite Island', 'Finished Basement', 'Private Patio', 'Double Garage', '401 Access'],
    images: [
      { url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1600&h=1067&fit=crop&q=90', isPrimary: true, caption: 'Exterior' },
      { url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Kitchen' },
    ],
    neighbourhood: 'Lambeth', daysOnMarket: 6, views: 0, favorites: 0, priceHistory: [], taxAmount: 4500, listedDate: new Date(Date.now() - 6 * 86400000),
  },
  {
    mlsNumber: 'X8100006',
    title: '4 Bed Detached in Masonville',
    description: 'Move-in ready 4-bedroom family home backing onto Medway Creek in Masonville. Renovated throughout with new kitchen, spa-like primary ensuite, and a large family room with walkout to deck. Minutes from Masonville Place, Western University, and the best schools North London has to offer.',
    propertyType: 'detached',
    status: 'active',
    address: { street: '895 Fanshawe Park Rd W', city: 'London', province: 'ON', postalCode: 'N6G 5B2', country: 'Canada', location: { type: 'Point', coordinates: [-81.2902, 43.0278] } },
    price: 999_000, bedrooms: 4, bathrooms: 3, squareFeet: 2400, lotSize: 5800, yearBuilt: 2003,
    parkingSpaces: 2, garage: true,
    features: ['Backs onto Creek', 'Renovated Kitchen', 'Spa Ensuite', 'Deck Walkout', 'Double Garage', 'Top Schools'],
    images: [
      { url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600&h=1067&fit=crop&q=90', isPrimary: true, caption: 'Exterior' },
      { url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Primary bedroom' },
    ],
    neighbourhood: 'Masonville', daysOnMarket: 3, views: 0, favorites: 0, priceHistory: [], taxAmount: 6800, listedDate: new Date(Date.now() - 3 * 86400000),
  },
  {
    mlsNumber: 'X8100007',
    title: '2 Bed Bungalow in Wortley Village',
    description: 'Adorable 2-bedroom bungalow steps from iconic Wortley Village. Classic London charm with updated mechanical, bright sunroom, large 50x130 lot, and detached garage. Walk to boutique shops, cafes, and the Saturday Farmers\' Market. A rare opportunity in London\'s most beloved neighbourhood.',
    propertyType: 'bungalow',
    status: 'active',
    address: { street: '145 Wortley Rd', city: 'London', province: 'ON', postalCode: 'N6C 3P8', country: 'Canada', location: { type: 'Point', coordinates: [-81.2582, 42.9721] } },
    price: 599_000, bedrooms: 2, bathrooms: 1, squareFeet: 950, lotSize: 6500, yearBuilt: 1952,
    parkingSpaces: 1, garage: true,
    features: ['50x130 Lot', 'Sunroom', 'Updated Mechanical', 'Detached Garage', 'Walk to Village', 'Farmers Market'],
    images: [
      { url: 'https://images.unsplash.com/photo-1565402170291-8491f1b75105?w=1600&h=1067&fit=crop&q=90', isPrimary: true, caption: 'Classic bungalow' },
      { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Rear yard' },
    ],
    neighbourhood: 'Wortley Village', daysOnMarket: 7, views: 0, favorites: 0, priceHistory: [], taxAmount: 4000, listedDate: new Date(Date.now() - 7 * 86400000),
  },
  {
    mlsNumber: 'X8100008',
    title: '3 Bed Detached in Hyde Park',
    description: 'Immaculate 3-bedroom detached home in sought-after Hyde Park, West London. Open-concept layout, kitchen with breakfast bar, main-floor laundry, and a fully fenced backyard with gazebo. Steps to Hyde Park Road amenities and excellent schools including LHSS.',
    propertyType: 'detached',
    status: 'active',
    address: { street: '1560 Hyde Park Rd', city: 'London', province: 'ON', postalCode: 'N6H 5L8', country: 'Canada', location: { type: 'Point', coordinates: [-81.3412, 43.0041] } },
    price: 824_000, bedrooms: 3, bathrooms: 2, squareFeet: 1900, lotSize: 4500, yearBuilt: 2011,
    parkingSpaces: 2, garage: true,
    features: ['Open Concept', 'Breakfast Bar', 'Main Floor Laundry', 'Fenced Yard', 'Gazebo', 'Double Garage'],
    images: [
      { url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&h=1067&fit=crop&q=90', isPrimary: true, caption: 'Front exterior' },
      { url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Living room' },
    ],
    neighbourhood: 'Hyde Park', daysOnMarket: 5, views: 0, favorites: 0, priceHistory: [], taxAmount: 5800, listedDate: new Date(Date.now() - 5 * 86400000),
  },
  {
    mlsNumber: 'X8100009',
    title: '1 Bed Condo in SoHo London',
    description: 'Stylish 1-bedroom condo in London\'s vibrant SoHo district. Contemporary finishes, in-suite laundry, rooftop terrace access, and secure underground parking. Walk to Richmond Row, Victoria Park, and London\'s best restaurants and nightlife. Ideal for first-time buyers or investors.',
    propertyType: 'condo',
    status: 'active',
    address: { street: '220 Simcoe St', city: 'London', province: 'ON', postalCode: 'N6B 1H3', country: 'Canada', location: { type: 'Point', coordinates: [-81.2537, 42.9791] } },
    price: 339_000, bedrooms: 1, bathrooms: 1, squareFeet: 620, yearBuilt: 2020,
    parkingSpaces: 1, garage: false, maintenanceFee: 420,
    features: ['In-Suite Laundry', 'Rooftop Terrace', 'Underground Parking', 'Modern Finishes', 'Walk to Richmond Row'],
    images: [
      { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&h=1067&fit=crop&q=90', isPrimary: true, caption: 'Living area' },
      { url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Bathroom' },
    ],
    neighbourhood: 'SoHo', daysOnMarket: 0, views: 0, favorites: 0, priceHistory: [], taxAmount: 2100, listedDate: new Date(),
  },
  {
    mlsNumber: 'X8100010',
    title: '4 Bed Detached in Riverbend',
    description: 'Gorgeous 4-bedroom home in desirable Riverbend, backing onto the Thames River. Vaulted ceilings, updated kitchen with island, main-floor primary suite, and a stunning four-season sunroom overlooking the ravine. Rare opportunity to live on the Thames in one of London\'s premier communities.',
    propertyType: 'detached',
    status: 'active',
    address: { street: '415 Riverbend Rd', city: 'London', province: 'ON', postalCode: 'N6K 4N7', country: 'Canada', location: { type: 'Point', coordinates: [-81.3521, 42.9628] } },
    price: 1_299_000, bedrooms: 4, bathrooms: 3, squareFeet: 3200, lotSize: 8800, yearBuilt: 2008,
    parkingSpaces: 2, garage: true,
    features: ['Thames River View', 'Vaulted Ceilings', 'Sunroom', 'Main Floor Primary', 'Ravine Lot', 'Updated Kitchen'],
    images: [
      { url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1600&h=1067&fit=crop&q=90', isPrimary: true, caption: 'River view exterior' },
      { url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Kitchen island' },
      { url: 'https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Sunroom' },
    ],
    neighbourhood: 'Riverbend', daysOnMarket: 2, views: 0, favorites: 0, priceHistory: [], taxAmount: 8900, listedDate: new Date(Date.now() - 2 * 86400000),
  },
  {
    mlsNumber: 'X8100011',
    title: '3 Bed Townhouse in Whitehills',
    description: 'Spacious 3-bedroom corner townhome in Whitehills, North London. Bright end unit with extra windows, recently renovated kitchen, finished basement with rec room, and a private backyard patio. Close to Fanshawe College, Stone Ridge Marketplace, and great transit connections.',
    propertyType: 'townhouse',
    status: 'active',
    address: { street: '1200 Fanshawe Park Rd E', city: 'London', province: 'ON', postalCode: 'N5X 4A1', country: 'Canada', location: { type: 'Point', coordinates: [-81.2315, 43.0350] } },
    price: 579_000, bedrooms: 3, bathrooms: 2, squareFeet: 1550, lotSize: 1900, yearBuilt: 2012,
    parkingSpaces: 2, garage: false,
    features: ['Corner Unit', 'Renovated Kitchen', 'Finished Basement', 'Private Patio', 'Near Fanshawe'],
    images: [
      { url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1600&h=1067&fit=crop&q=90', isPrimary: true, caption: 'Exterior' },
      { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&h=1067&fit=crop&q=90', isPrimary: false, caption: 'Master bedroom' },
    ],
    neighbourhood: 'Whitehills', daysOnMarket: 9, views: 0, favorites: 0, priceHistory: [], taxAmount: 3900, listedDate: new Date(Date.now() - 9 * 86400000),
  },
  {
    mlsNumber: 'X8100012',
    title: '4 Bed Detached in South London',
    description: 'Solid 4-bedroom family home in South London near White Oaks Mall. Generous room sizes, updated flooring, large eat-in kitchen, and a fully fenced backyard ideal for entertaining. Close to excellent schools, parks, and quick 401 highway access. Perfect for families relocating to London.',
    propertyType: 'detached',
    status: 'sold',
    address: { street: '770 Wharncliffe Rd S', city: 'London', province: 'ON', postalCode: 'N6J 2N7', country: 'Canada', location: { type: 'Point', coordinates: [-81.2698, 42.9527] } },
    price: 729_000, soldPrice: 755_000, bedrooms: 4, bathrooms: 3, squareFeet: 2100, lotSize: 5200, yearBuilt: 1995,
    parkingSpaces: 2, garage: true,
    features: ['Updated Flooring', 'Eat-in Kitchen', 'Fenced Yard', '401 Access', 'Top Schools'],
    images: [
      { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&h=1067&fit=crop&q=90', isPrimary: true, caption: 'Exterior' },
    ],
    neighbourhood: 'South London', daysOnMarket: 14, views: 0, favorites: 0, soldDate: new Date(Date.now() - 5 * 86400000), priceHistory: [], taxAmount: 5100, listedDate: new Date(Date.now() - 19 * 86400000),
  },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB:', MONGODB_URI);

  const { Property } = await import('../src/models');

  let inserted = 0;
  let skipped = 0;

  for (const p of LONDON_PROPERTIES) {
    const slug = slugify(`${p.propertyType}-london-on-${p.mlsNumber}`.toLowerCase(), { strict: true });
    try {
      await Property.findOneAndUpdate(
        { mlsNumber: p.mlsNumber },
        {
          ...p,
          slug,
          _idxSource: 'seed',
          _idxUpdatedAt: new Date(),
        },
        { upsert: true, new: true, runValidators: false }
      );
      console.log(`  ✓ ${p.title}`);
      inserted++;
    } catch (err: any) {
      console.warn(`  ✗ ${p.title}: ${err.message}`);
      skipped++;
    }
  }

  console.log(`\nDone — ${inserted} upserted, ${skipped} skipped`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
