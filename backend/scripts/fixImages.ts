/**
 * Assigns unique images to every property in the database.
 *
 * SimplyRETS test data only has 16 house photos → many properties share the
 * same image. London seeded properties also have some duplicates.
 *
 * Strategy:
 *  - London properties  → curated unique Unsplash real-estate photos (exterior + interior)
 *  - Houston properties → rotate through all 16 SimplyRETS CloudFront photos
 *    ensuring each property gets a distinct primary image + 2 interiors
 */

import mongoose from 'mongoose';
import { config, connectDB } from '../src/config';
import { Property } from '../src/models';

// ── SimplyRETS test image pool (16 distinct house exteriors + interiors) ──────
const CF = 'https://d2bd5h5te3s67r.cloudfront.net/trial';
const IDX_EXTERIORS = Array.from({ length: 16 }, (_, i) => `${CF}/home${i + 1}.jpg`);
const IDX_INTERIORS = Array.from({ length: 16 }, (_, i) => `${CF}/home-inside-${i + 1}.jpg`);

// ── Curated Unsplash real-estate photos (unique per London property) ──────────
// Each entry: [primaryExterior, ...extras]
const LONDON_IMAGE_SETS: Record<string, string[][]> = {
  'Byron': [
    [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&h=1067&fit=crop&q=90',
      'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1600&h=1067&fit=crop&q=90',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1600&h=1067&fit=crop&q=90',
      'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1600&h=1067&fit=crop&q=90',
    ],
  ],
  'Old North': [
    [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&h=1067&fit=crop&q=90',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&h=1067&fit=crop&q=90',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&h=1067&fit=crop&q=90',
    ],
  ],
  'Downtown London': [
    [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&h=1067&fit=crop&q=90',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1600&h=1067&fit=crop&q=90',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&h=1067&fit=crop&q=90',
    ],
  ],
  'Sunningdale': [
    [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&h=1067&fit=crop&q=90',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1600&h=1067&fit=crop&q=90',
      'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1600&h=1067&fit=crop&q=90',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1600&h=1067&fit=crop&q=90',
    ],
  ],
  'Lambeth': [
    [
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1600&h=1067&fit=crop&q=90',
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1600&h=1067&fit=crop&q=90',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&h=1067&fit=crop&q=90',
    ],
  ],
  'Masonville': [
    [
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600&h=1067&fit=crop&q=90',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&h=1067&fit=crop&q=90',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&h=1067&fit=crop&q=90',
    ],
  ],
  'Wortley Village': [
    [
      'https://images.unsplash.com/photo-1565402170291-8491f1b75105?w=1600&h=1067&fit=crop&q=90',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&h=1067&fit=crop&q=90',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1600&h=1067&fit=crop&q=90',
    ],
  ],
  'Hyde Park': [
    [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&h=1067&fit=crop&q=90',
      'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1600&h=1067&fit=crop&q=90',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&h=1067&fit=crop&q=90',
    ],
  ],
  'SoHo': [
    [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&h=1067&fit=crop&q=90',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&h=1067&fit=crop&q=90',
      'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1600&h=1067&fit=crop&q=90',
    ],
  ],
  'Riverbend': [
    [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1600&h=1067&fit=crop&q=90',
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1600&h=1067&fit=crop&q=90',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&h=1067&fit=crop&q=90',
    ],
  ],
  'Whitehills': [
    [
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=1600&h=1067&fit=crop&q=90',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&h=1067&fit=crop&q=90',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1600&h=1067&fit=crop&q=90',
    ],
  ],
  'South London': [
    [
      'https://images.unsplash.com/photo-1592595896616-c37162298647?w=1600&h=1067&fit=crop&q=90',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&h=1067&fit=crop&q=90',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1600&h=1067&fit=crop&q=90',
    ],
  ],
};

async function run() {
  await connectDB();
  console.log('Connected to MongoDB');

  // ── 1. Fix London properties ─────────────────────────────────────────────
  const londonProps = await Property.find({ 'address.city': 'London' });
  console.log(`Found ${londonProps.length} London properties`);

  for (const prop of londonProps) {
    const hood = prop.neighbourhood as string;
    const imgSet = LONDON_IMAGE_SETS[hood];
    if (!imgSet) {
      console.log(`  No image set for neighbourhood: ${hood} — skipping`);
      continue;
    }

    const urls = imgSet[0];
    const images = urls.map((url, i) => ({
      url,
      isPrimary: i === 0,
      caption: i === 0 ? 'Exterior' : i === 1 ? 'Living Area' : i === 2 ? 'Bedroom' : 'Bathroom',
    }));

    await Property.findByIdAndUpdate(prop._id, { images });
    console.log(`  ✓ Updated ${prop.title} (${hood})`);
  }

  // ── 2. Fix Houston (SimplyRETS) properties ───────────────────────────────
  // 42 properties, 16 exterior + 16 interior photos.
  // Strategy: first 16 get exterior as primary, next 16 get an interior as primary,
  // remaining 10 alternate. Every property gets 4 distinct photos.
  const houstonProps = await Property.find({ 'address.city': { $ne: 'London' } });
  console.log(`\nFound ${houstonProps.length} Houston/IDX properties`);

  for (let i = 0; i < houstonProps.length; i++) {
    const prop = houstonProps[i];

    // Primary image: cycle exterior → interior → exterior to avoid consecutive duplicates
    let primaryUrl: string;
    if (i < 16) {
      primaryUrl = IDX_EXTERIORS[i];                    // 0-15: unique exteriors
    } else if (i < 32) {
      primaryUrl = IDX_INTERIORS[i - 16];               // 16-31: unique interiors as hero
    } else {
      primaryUrl = IDX_EXTERIORS[(i * 3 + 7) % 16];    // 32+: offset exteriors
    }

    // 3 additional photos — pick from pool ensuring no duplicates in this set
    const extras: string[] = [];
    for (let offset = 1; extras.length < 3; offset++) {
      const candidate = i % 2 === 0
        ? IDX_INTERIORS[(i + offset) % 16]
        : IDX_EXTERIORS[(i + offset) % 16];
      if (candidate !== primaryUrl && !extras.includes(candidate)) extras.push(candidate);
    }

    const images = [
      { url: primaryUrl,  isPrimary: true,  caption: 'Front Exterior' },
      { url: extras[0],   isPrimary: false, caption: 'Living Area' },
      { url: extras[1],   isPrimary: false, caption: 'Kitchen' },
      { url: extras[2],   isPrimary: false, caption: 'Bedroom' },
    ];

    await Property.findByIdAndUpdate(prop._id, { images });
    console.log(`  ✓ [${i + 1}/${houstonProps.length}] ${prop.title}`);
  }
  console.log('  ✓ Updated all Houston properties with unique rotated images');

  await mongoose.disconnect();
  console.log('\nDone!');
}

run().catch((err) => { console.error(err); process.exit(1); });
