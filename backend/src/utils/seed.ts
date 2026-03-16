import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Property } from '../models/Property';
import { Lead } from '../models/Lead';

dotenv.config();

const GTA_LOCATIONS = [
  { city: 'Toronto', neighbourhood: 'Liberty Village', lat: 43.6383, lng: -79.4183 },
  { city: 'Toronto', neighbourhood: 'The Annex', lat: 43.6708, lng: -79.4059 },
  { city: 'Toronto', neighbourhood: 'Yorkville', lat: 43.6726, lng: -79.3929 },
  { city: 'Mississauga', neighbourhood: 'Port Credit', lat: 43.5512, lng: -79.5874 },
  { city: 'Mississauga', neighbourhood: 'Square One', lat: 43.5932, lng: -79.6441 },
  { city: 'Brampton', neighbourhood: 'Mount Pleasant', lat: 43.7097, lng: -79.7647 },
  { city: 'Oakville', neighbourhood: 'Bronte', lat: 43.3918, lng: -79.7093 },
  { city: 'Burlington', neighbourhood: 'Downtown Burlington', lat: 43.3255, lng: -79.7990 },
  { city: 'Markham', neighbourhood: 'Unionville', lat: 43.8711, lng: -79.3181 },
  { city: 'Richmond Hill', neighbourhood: 'Oak Ridges', lat: 43.9252, lng: -79.4591 },
  { city: 'Vaughan', neighbourhood: 'Woodbridge', lat: 43.7856, lng: -79.5988 },
  { city: 'Hamilton', neighbourhood: 'Westdale', lat: 43.2621, lng: -79.9023 },
];

const PROPERTY_TYPES = ['detached', 'semi-detached', 'townhouse', 'condo', 'bungalow'];
const FEATURES = [
  'Hardwood Floors', 'Granite Countertops', 'Stainless Steel Appliances',
  'Central AC', 'Finished Basement', 'Open Concept', 'Walk-in Closet',
  'Ensuite Bath', 'Smart Home', 'EV Charger', 'In-ground Pool',
  'Rooftop Terrace', 'Home Office', 'Updated Kitchen', 'Crown Moulding',
];
const LEAD_SOURCES = ['website', 'referral', 'social_media', 'open_house', 'cold_call'];
const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'showing', 'offer', 'closed', 'lost'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomSubset<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/realtorhub';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Property.deleteMany({}),
    Lead.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  // Create users
  const users = await User.create([
    {
      firstName: 'Sarah', lastName: 'Chen', email: 'sarah@realtorhub.com',
      password: 'Password123!', phone: '416-555-0101', role: 'admin',
      brokerage: 'RealtorHub Realty', licenseNumber: 'ON-2024-001',
      bio: 'Top-performing agent in the GTA with 12 years of experience.',
    },
    {
      firstName: 'Michael', lastName: 'Torres', email: 'michael@realtorhub.com',
      password: 'Password123!', phone: '905-555-0202', role: 'agent',
      brokerage: 'RealtorHub Realty', licenseNumber: 'ON-2024-002',
      bio: 'Specializing in luxury homes across Oakville and Burlington.',
    },
    {
      firstName: 'Priya', lastName: 'Sharma', email: 'priya@realtorhub.com',
      password: 'Password123!', phone: '647-555-0303', role: 'broker',
      brokerage: 'RealtorHub Realty', licenseNumber: 'ON-2024-003',
      bio: 'Broker with expertise in investment properties and condos.',
    },
  ]);
  console.log(`Created ${users.length} users`);

  // Create properties
  const properties = [];
  for (let i = 0; i < 40; i++) {
    const loc = randomItem(GTA_LOCATIONS);
    const type = randomItem(PROPERTY_TYPES);
    const isCondo = type === 'condo';
    const price = isCondo
      ? randomRange(350000, 1200000)
      : randomRange(600000, 3500000);
    const bedrooms = isCondo ? randomRange(1, 3) : randomRange(2, 6);
    const sqft = isCondo ? randomRange(500, 1400) : randomRange(1200, 4500);
    const statuses = ['active', 'active', 'active', 'active', 'sold', 'pending', 'coming_soon'];
    const status = randomItem(statuses);
    const listedDate = new Date(
      Date.now() - randomRange(1, 180) * 24 * 60 * 60 * 1000
    );

    properties.push({
      title: `${bedrooms} Bed ${type.charAt(0).toUpperCase() + type.slice(1)} in ${loc.neighbourhood}`,
      description: `Beautiful ${bedrooms} bedroom ${type} in the heart of ${loc.neighbourhood}, ${loc.city}. Features include ${randomSubset(FEATURES, 4).join(', ')}. Close to transit, schools, and amenities.`,
      propertyType: type,
      status,
      address: {
        street: `${randomRange(1, 999)} ${randomItem(['Maple', 'Oak', 'King', 'Queen', 'Bay', 'Bloor', 'Dundas', 'Lakeshore', 'Hurontario'])} ${randomItem(['St', 'Ave', 'Blvd', 'Rd', 'Cres', 'Dr'])}`,
        unit: isCondo ? `Unit ${randomRange(100, 3500)}` : undefined,
        city: loc.city,
        province: 'Ontario',
        postalCode: `${randomItem(['M', 'L'])}${randomRange(1, 9)}${randomItem(['A', 'B', 'C', 'E', 'G', 'H', 'K', 'M', 'N'])} ${randomRange(1, 9)}${randomItem(['A', 'B', 'C', 'E', 'G'])}${randomRange(1, 9)}`,
        country: 'Canada',
        location: {
          type: 'Point',
          coordinates: [
            loc.lng + (Math.random() - 0.5) * 0.02,
            loc.lat + (Math.random() - 0.5) * 0.02,
          ],
        },
      },
      price,
      originalPrice: price,
      priceHistory: [{ price, date: listedDate, event: 'listed' }],
      bedrooms,
      bathrooms: randomRange(1, bedrooms),
      squareFeet: sqft,
      lotSize: isCondo ? undefined : randomRange(2000, 8000),
      yearBuilt: randomRange(1960, 2025),
      parkingSpaces: isCondo ? randomRange(0, 2) : randomRange(1, 4),
      garage: !isCondo && Math.random() > 0.3,
      features: randomSubset(FEATURES, randomRange(3, 8)),
      images: [
        { url: `https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop`, isPrimary: true, caption: 'Front Exterior' },
        { url: `https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop`, isPrimary: false, caption: 'Living Room' },
        { url: `https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop`, isPrimary: false, caption: 'Kitchen' },
      ],
      agent: randomItem(users)._id,
      views: randomRange(10, 500),
      favorites: randomRange(0, 50),
      listedDate,
      soldDate: status === 'sold' ? new Date(listedDate.getTime() + randomRange(7, 90) * 24 * 60 * 60 * 1000) : undefined,
      soldPrice: status === 'sold' ? price + randomRange(-50000, 100000) : undefined,
      neighbourhood: loc.neighbourhood,
      taxAmount: Math.round(price * 0.008),
      maintenanceFee: isCondo ? randomRange(300, 1200) : undefined,
      walkScore: randomRange(40, 98),
      transitScore: randomRange(30, 95),
    });
  }

  const createdProperties = await Property.create(properties);
  console.log(`Created ${createdProperties.length} properties`);

  // Create leads
  const firstNames = ['James', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'Raj', 'Wei', 'Fatima', 'Carlos', 'Yuki'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Patel', 'Wong', 'Hassan', 'Kim', 'Tanaka'];

  const leads = [];
  for (let i = 0; i < 30; i++) {
    const fn = randomItem(firstNames);
    const ln = randomItem(lastNames);
    const loc = randomItem(GTA_LOCATIONS);
    const status = randomItem(LEAD_STATUSES);

    leads.push({
      firstName: fn,
      lastName: ln,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}${randomRange(1, 99)}@email.com`,
      phone: `${randomItem(['416', '905', '647'])}-${randomRange(100, 999)}-${randomRange(1000, 9999)}`,
      status,
      source: randomItem(LEAD_SOURCES),
      score: randomRange(10, 95),
      assignedAgent: randomItem(users)._id,
      interestedIn: randomSubset(createdProperties.map((p) => p._id), randomRange(0, 3)),
      preferredLocations: randomSubset(
        GTA_LOCATIONS.map((l) => l.city),
        randomRange(1, 3)
      ),
      budget: {
        min: randomRange(300000, 800000),
        max: randomRange(800001, 3000000),
      },
      preferredPropertyTypes: randomSubset(PROPERTY_TYPES, randomRange(1, 3)),
      bedrooms: { min: randomRange(1, 2), max: randomRange(3, 5) },
      timeline: randomItem(['Immediate', '1-3 months', '3-6 months', '6-12 months', 'Just browsing']),
      notes: [
        {
          content: `Initial contact — interested in ${loc.city} area properties.`,
          author: randomItem(users)._id,
          createdAt: new Date(Date.now() - randomRange(1, 60) * 24 * 60 * 60 * 1000),
        },
      ],
      activities: [
        {
          type: 'created',
          description: 'Lead created',
          date: new Date(Date.now() - randomRange(30, 90) * 24 * 60 * 60 * 1000),
        },
      ],
      tags: randomSubset(
        ['first-time-buyer', 'investor', 'downsizing', 'upsizing', 'relocation', 'pre-approved', 'hot-lead', 'VIP'],
        randomRange(1, 3)
      ),
      lastContactDate: new Date(Date.now() - randomRange(0, 14) * 24 * 60 * 60 * 1000),
      nextFollowUp: new Date(Date.now() + randomRange(1, 14) * 24 * 60 * 60 * 1000),
    });
  }

  await Lead.create(leads);
  console.log(`Created ${leads.length} leads`);

  console.log('\n✅ Seed complete!');
  console.log('Login credentials:');
  console.log('  Admin:  sarah@realtorhub.com / Password123!');
  console.log('  Agent:  michael@realtorhub.com / Password123!');
  console.log('  Broker: priya@realtorhub.com / Password123!');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
