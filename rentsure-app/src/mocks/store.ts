/**
 * In-memory database for the mock API layer.
 *
 * This module seeds realistic Ghanaian property and user data so the
 * frontend can be developed and demonstrated without a running backend.
 * All mock endpoint handlers read from and write to the arrays below.
 *
 * IMPORTANT: This store resets every time the app reloads — it is
 * intentionally ephemeral. Never rely on it for persistence; that's
 * the real backend's job.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '@/utils/format';
import type {
  User,
  Property,
  PropertyMedia,
  Booking,
  Payment,
  Agreement,
  Review,
  Verification,
  Notification,
  BookingStatus,
  TenantPreferences,
} from '@/types';

// ---------------------------------------------------------------------------
// Seed users — one per role, all with password "Test1234!"
// ---------------------------------------------------------------------------

/**
 * Plain-text password comparison in mocks only.
 * The real backend uses BCrypt (strength 12). We store plain text here
 * because BCrypt isn't available client-side and these are test-only accounts.
 */
export const SEED_PASSWORD = 'Test1234!';

export const seedUsers: User[] = [
  {
    id: 'u-tenant-001',
    fullName: 'Kwame Mensah',
    email: 'tenant@rentsure.com',
    phone: '+233241234567',
    role: 'LANDLORD',
    isVerifiedEmail: true,
    status: 'ACTIVE',
    createdAt: '2026-01-15T08:30:00Z',
  },
  {
    id: 'u-landlord-001',
    fullName: 'Abena Osei',
    email: 'landlord@rentsure.com',
    phone: '+233551234567',
    role: 'LANDLORD',
    isVerifiedEmail: true,
    status: 'ACTIVE',
    createdAt: '2025-11-02T10:00:00Z',
  },
  {
    id: 'u-admin-001',
    fullName: 'Yaw Boateng',
    email: 'admin@rentsure.com',
    phone: '+233201234567',
    role: 'ADMIN',
    isVerifiedEmail: true,
    status: 'ACTIVE',
    createdAt: '2025-06-01T09:00:00Z',
  },
];

/**
 * Maps user ID → plain-text password for login validation.
 * In a real system this would be a BCrypt hash in the DB.
 */
export const userPasswords: Record<string, string> = {
  'u-tenant-001': SEED_PASSWORD,
  'u-landlord-001': SEED_PASSWORD,
  'u-admin-001': SEED_PASSWORD,
};

// ---------------------------------------------------------------------------
// Seed properties — 12 realistic Ghanaian listings
// Kumasi areas: Kotei, Ayeduase, Bomso, Ahodwo, KNUST area
// Accra areas: East Legon, Madina, Cantonments, Osu
// Prices: GHS 3,000–25,000/year (realistic 2026 range)
// ---------------------------------------------------------------------------

const makeMedia = (
  propertyId: string,
  count: number
): PropertyMedia[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `media-${propertyId}-${i + 1}`,
    mediaType: 'PHOTO' as const,
    /* Placeholder URL — the real app will use S3/CDN URLs */
    url: `https://picsum.photos/seed/${propertyId}-${i + 1}/800/600`,
    sortOrder: i + 1,
  }));

export const seedProperties: Property[] = [
  // --- Kumasi listings ---
  {
    id: 'p-001',
    landlordId: 'u-landlord-001',
    title: 'Cozy Single Room near KNUST',
    description:
      'Affordable single room in Kotei, 5-minute walk to KNUST main gate. Shared bathroom and kitchen. Ideal for students.',
    propertyType: 'SINGLE_ROOM',
    region: 'Ashanti',
    city: 'Kumasi',
    area: 'Kotei',
    gpsLat: 6.6745,
    gpsLng: -1.5716,
    pricePerYear: 3000,
    bedrooms: 1,
    bathrooms: 0,
    amenities: ['water', 'electricity', 'security'],
    isVerified: true,
    status: 'AVAILABLE',
    media: makeMedia('p-001', 3),
    createdAt: '2026-03-10T09:00:00Z',
  },
  {
    id: 'p-002',
    landlordId: 'u-landlord-001',
    title: 'Self-Contained Studio in Ayeduase',
    description:
      'Modern self-contained room with private bath and kitchenette. Tiled floor, fan, and prepaid meter. Quiet residential area.',
    propertyType: 'SELF_CONTAINED',
    region: 'Ashanti',
    city: 'Kumasi',
    area: 'Ayeduase',
    gpsLat: 6.6830,
    gpsLng: -1.5650,
    pricePerYear: 4800,
    bedrooms: 1,
    bathrooms: 1,
    amenities: ['water', 'electricity', 'fan', 'tiled floor', 'prepaid meter'],
    isVerified: true,
    status: 'AVAILABLE',
    media: makeMedia('p-002', 4),
    createdAt: '2026-02-18T14:30:00Z',
  },
  {
    id: 'p-003',
    landlordId: 'u-landlord-001',
    title: '2-Bedroom Apartment in Bomso',
    description:
      'Spacious 2-bed apartment near Bomso junction. Master bedroom en-suite, living area, balcony with garden view. Close to amenities.',
    propertyType: 'APARTMENT',
    region: 'Ashanti',
    city: 'Kumasi',
    area: 'Bomso',
    gpsLat: 6.6802,
    gpsLng: -1.5768,
    pricePerYear: 9600,
    bedrooms: 2,
    bathrooms: 2,
    amenities: ['water', 'electricity', 'security', 'balcony', 'parking'],
    isVerified: false,
    status: 'AVAILABLE',
    media: makeMedia('p-003', 5),
    createdAt: '2026-04-05T11:00:00Z',
  },
  {
    id: 'p-004',
    landlordId: 'u-landlord-001',
    title: 'Executive 3-Bed House in Ahodwo',
    description:
      'Fully furnished executive house in the heart of Ahodwo. 3 bedrooms all en-suite, fitted kitchen, garage, and 24/7 security.',
    propertyType: 'HOUSE',
    region: 'Ashanti',
    city: 'Kumasi',
    area: 'Ahodwo',
    gpsLat: 6.6650,
    gpsLng: -1.6100,
    pricePerYear: 22000,
    bedrooms: 3,
    bathrooms: 3,
    amenities: ['water', 'electricity', 'wifi', 'security', 'garage', 'furnished', 'AC'],
    isVerified: true,
    status: 'AVAILABLE',
    media: makeMedia('p-004', 6),
    createdAt: '2026-01-20T16:00:00Z',
  },
  {
    id: 'p-005',
    landlordId: 'u-landlord-001',
    title: 'Affordable Room at KNUST Campus Area',
    description:
      'Budget-friendly single room within walking distance to KNUST campus. Shared facilities, good ventilation, prepaid electricity.',
    propertyType: 'SINGLE_ROOM',
    region: 'Ashanti',
    city: 'Kumasi',
    area: 'Kotei',
    gpsLat: 6.6739,
    gpsLng: -1.5725,
    pricePerYear: 3200,
    bedrooms: 1,
    bathrooms: 0,
    amenities: ['electricity', 'water', 'fan'],
    isVerified: false,
    status: 'AVAILABLE',
    media: makeMedia('p-005', 2),
    createdAt: '2026-05-12T08:00:00Z',
  },
  {
    id: 'p-006',
    landlordId: 'u-landlord-001',
    title: 'Modern Self-Contained in Ayeduase New Site',
    description:
      'Newly built self-contained with modern finishes. Private bathroom, small kitchen area, tiled throughout. Gated compound.',
    propertyType: 'SELF_CONTAINED',
    region: 'Ashanti',
    city: 'Kumasi',
    area: 'Ayeduase',
    gpsLat: 6.6855,
    gpsLng: -1.5630,
    pricePerYear: 5500,
    bedrooms: 1,
    bathrooms: 1,
    amenities: ['water', 'electricity', 'security', 'tiled floor', 'gated compound'],
    isVerified: true,
    status: 'RENTED',
    media: makeMedia('p-006', 4),
    createdAt: '2026-03-28T13:00:00Z',
  },
  // --- Accra listings ---
  {
    id: 'p-007',
    landlordId: 'u-landlord-001',
    title: '1-Bedroom Apartment in East Legon',
    description:
      'Stylish 1-bedroom apartment in East Legon. Open-plan living, modern kitchen, 24/7 water, generator backup. Close to A&C Mall.',
    propertyType: 'APARTMENT',
    region: 'Greater Accra',
    city: 'Accra',
    area: 'East Legon',
    gpsLat: 5.6350,
    gpsLng: -0.1550,
    pricePerYear: 18000,
    bedrooms: 1,
    bathrooms: 1,
    amenities: ['water', 'electricity', 'wifi', 'AC', 'generator', 'gym', 'parking'],
    isVerified: true,
    status: 'AVAILABLE',
    media: makeMedia('p-007', 5),
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'p-008',
    landlordId: 'u-landlord-001',
    title: 'Budget Single Room in Madina',
    description:
      'Simple single room in a quiet Madina compound. Shared bath, close to Madina market and trotro station. Best for working singles.',
    propertyType: 'SINGLE_ROOM',
    region: 'Greater Accra',
    city: 'Accra',
    area: 'Madina',
    gpsLat: 5.6680,
    gpsLng: -0.1680,
    pricePerYear: 3600,
    bedrooms: 1,
    bathrooms: 0,
    amenities: ['water', 'electricity'],
    isVerified: false,
    status: 'AVAILABLE',
    media: makeMedia('p-008', 2),
    createdAt: '2026-04-22T07:30:00Z',
  },
  {
    id: 'p-009',
    landlordId: 'u-landlord-001',
    title: 'Luxury 4-Bed House in Cantonments',
    description:
      'Premium 4-bedroom detached house in Cantonments. Swimming pool, boys quarters, landscaped garden, double garage. Diplomatic area.',
    propertyType: 'HOUSE',
    region: 'Greater Accra',
    city: 'Accra',
    area: 'Cantonments',
    gpsLat: 5.5760,
    gpsLng: -0.1780,
    pricePerYear: 25000,
    bedrooms: 4,
    bathrooms: 4,
    amenities: ['water', 'electricity', 'wifi', 'AC', 'security', 'pool', 'garden', 'garage', 'furnished'],
    isVerified: true,
    status: 'AVAILABLE',
    media: makeMedia('p-009', 8),
    createdAt: '2025-12-15T12:00:00Z',
  },
  {
    id: 'p-010',
    landlordId: 'u-landlord-001',
    title: 'Self-Contained Room in Osu',
    description:
      'Vibrant Osu location near Oxford Street. Self-contained with private bath, close to restaurants and nightlife. Ideal for young professionals.',
    propertyType: 'SELF_CONTAINED',
    region: 'Greater Accra',
    city: 'Accra',
    area: 'Osu',
    gpsLat: 5.5570,
    gpsLng: -0.1830,
    pricePerYear: 7200,
    bedrooms: 1,
    bathrooms: 1,
    amenities: ['water', 'electricity', 'wifi', 'fan'],
    isVerified: true,
    status: 'AVAILABLE',
    media: makeMedia('p-010', 3),
    createdAt: '2026-05-08T15:00:00Z',
  },
  {
    id: 'p-011',
    landlordId: 'u-landlord-001',
    title: '2-Bedroom Apartment in Madina',
    description:
      'Well-maintained 2-bedroom flat in Madina Zongo Junction area. Both rooms en-suite, spacious hall, fitted kitchen. On a tarred road.',
    propertyType: 'APARTMENT',
    region: 'Greater Accra',
    city: 'Accra',
    area: 'Madina',
    gpsLat: 5.6700,
    gpsLng: -0.1650,
    pricePerYear: 10800,
    bedrooms: 2,
    bathrooms: 2,
    amenities: ['water', 'electricity', 'security', 'parking', 'prepaid meter'],
    isVerified: false,
    status: 'AVAILABLE',
    media: makeMedia('p-011', 4),
    createdAt: '2026-06-01T09:30:00Z',
  },
  {
    id: 'p-012',
    landlordId: 'u-landlord-001',
    title: '3-Bedroom House in East Legon Hills',
    description:
      'Beautiful 3-bed semi-detached in East Legon Hills estate. Gated community, children\'s playground, 24/7 security and water. Family-friendly.',
    propertyType: 'HOUSE',
    region: 'Greater Accra',
    city: 'Accra',
    area: 'East Legon',
    gpsLat: 5.6420,
    gpsLng: -0.1480,
    pricePerYear: 20000,
    bedrooms: 3,
    bathrooms: 3,
    amenities: ['water', 'electricity', 'wifi', 'AC', 'security', 'parking', 'playground', 'gated community'],
    isVerified: true,
    status: 'AVAILABLE',
    media: makeMedia('p-012', 6),
    createdAt: '2026-04-10T11:00:00Z',
  },

  // --- Injected 50 Listings from SQL --- 
  {
    "id": "p-sql-1",
    "landlordId": "u-tenant-001",
    "title": "3 Bedroom Luxurious House in Tarkwa",
    "description": "This is a highly sought-after 3 bedroom luxurious house in tarkwa. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Tarkwa.",
    "propertyType": "HOUSE",
    "region": "Western",
    "city": "Tarkwa",
    "area": "Dzorwulu",
    "gpsLat": 5.6037,
    "gpsLng": -0.187,
    "pricePerYear": 10443,
    "bedrooms": 4,
    "bathrooms": 1,
    "amenities": [
      "Security",
      "Water Tank"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.365Z"
  },
  {
    "id": "p-sql-2",
    "landlordId": "u-tenant-001",
    "title": "4 Bedroom Modern House in Cape Coast",
    "description": "This is a highly sought-after 4 bedroom modern house in cape coast. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Cape Coast.",
    "propertyType": "HOUSE",
    "region": "Central",
    "city": "Cape Coast",
    "area": "Osu",
    "gpsLat": 5.1155,
    "gpsLng": -1.2466,
    "pricePerYear": 17052,
    "bedrooms": 5,
    "bathrooms": 5,
    "amenities": [
      "Parking",
      "Gym",
      "Security",
      "Pool"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-3",
    "landlordId": "u-tenant-001",
    "title": "2 Bedroom Beautiful Apartment in Airport Residential",
    "description": "This is a highly sought-after 2 bedroom beautiful apartment in airport residential. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Accra.",
    "propertyType": "APARTMENT",
    "region": "Greater Accra",
    "city": "Accra",
    "area": "Airport Residential",
    "gpsLat": 5.6037,
    "gpsLng": -0.187,
    "pricePerYear": 21522,
    "bedrooms": 4,
    "bathrooms": 3,
    "amenities": [
      "Parking",
      "WiFi",
      "Pool",
      "Gym",
      "Security",
      "Water Tank"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-4",
    "landlordId": "u-tenant-001",
    "title": "1 Bedroom Newly Renovated Apartment in Airport Residential",
    "description": "This is a highly sought-after 1 bedroom newly renovated apartment in airport residential. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Takoradi.",
    "propertyType": "APARTMENT",
    "region": "Western",
    "city": "Takoradi",
    "area": "Airport Residential",
    "gpsLat": 4.8961,
    "gpsLng": -1.7656,
    "pricePerYear": 6380,
    "bedrooms": 2,
    "bathrooms": 1,
    "amenities": [
      "Gym",
      "Security",
      "Balcony",
      "Backup Generator",
      "Water Tank"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-5",
    "landlordId": "u-tenant-001",
    "title": "Spacious Single Room in Ridge",
    "description": "This is a highly sought-after spacious single room in ridge. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Cape Coast.",
    "propertyType": "SINGLE_ROOM",
    "region": "Central",
    "city": "Cape Coast",
    "area": "Ridge",
    "gpsLat": 5.1155,
    "gpsLng": -1.2466,
    "pricePerYear": 2269,
    "bedrooms": 1,
    "bathrooms": 0,
    "amenities": [
      "Security",
      "Water Tank",
      "Backup Generator",
      "Pool"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-6",
    "landlordId": "u-tenant-001",
    "title": "4 Bedroom Modern House in Tema",
    "description": "This is a highly sought-after 4 bedroom modern house in tema. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Tema.",
    "propertyType": "HOUSE",
    "region": "Greater Accra",
    "city": "Tema",
    "area": "Cantonments",
    "gpsLat": 5.6037,
    "gpsLng": -0.187,
    "pricePerYear": 22360,
    "bedrooms": 1,
    "bathrooms": 1,
    "amenities": [
      "WiFi",
      "Security",
      "Water Tank",
      "Balcony",
      "Parking"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-7",
    "landlordId": "u-tenant-001",
    "title": "3 Bedroom Spacious House in Madina",
    "description": "This is a highly sought-after 3 bedroom spacious house in madina. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Madina.",
    "propertyType": "HOUSE",
    "region": "Greater Accra",
    "city": "Madina",
    "area": "Airport Residential",
    "gpsLat": 5.6037,
    "gpsLng": -0.187,
    "pricePerYear": 4593,
    "bedrooms": 3,
    "bathrooms": 2,
    "amenities": [
      "Water Tank",
      "WiFi",
      "Air Conditioning",
      "Pool"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-8",
    "landlordId": "u-tenant-001",
    "title": "3 Bedroom Newly Renovated Apartment in East Legon",
    "description": "This is a highly sought-after 3 bedroom newly renovated apartment in east legon. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Kasoa.",
    "propertyType": "APARTMENT",
    "region": "Central",
    "city": "Kasoa",
    "area": "East Legon",
    "gpsLat": 5.6037,
    "gpsLng": -0.187,
    "pricePerYear": 13135,
    "bedrooms": 3,
    "bathrooms": 2,
    "amenities": [
      "WiFi",
      "Air Conditioning",
      "Backup Generator",
      "Gym"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-9",
    "landlordId": "u-tenant-001",
    "title": "Stunning Self-Contained in Osu",
    "description": "This is a highly sought-after stunning self-contained in osu. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Obuasi.",
    "propertyType": "SELF_CONTAINED",
    "region": "Ashanti",
    "city": "Obuasi",
    "area": "Osu",
    "gpsLat": 5.6037,
    "gpsLng": -0.187,
    "pricePerYear": 5753,
    "bedrooms": 1,
    "bathrooms": 1,
    "amenities": [
      "Balcony",
      "Water Tank"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-10",
    "landlordId": "u-tenant-001",
    "title": "Affordable Single Room in Dansoman",
    "description": "This is a highly sought-after affordable single room in dansoman. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Madina.",
    "propertyType": "SINGLE_ROOM",
    "region": "Greater Accra",
    "city": "Madina",
    "area": "Dansoman",
    "gpsLat": 5.6037,
    "gpsLng": -0.187,
    "pricePerYear": 12144,
    "bedrooms": 1,
    "bathrooms": 0,
    "amenities": [
      "Gym",
      "Pool",
      "Balcony",
      "Air Conditioning"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-11",
    "landlordId": "u-tenant-001",
    "title": "4 Bedroom Newly Renovated House in Cape Coast",
    "description": "This is a highly sought-after 4 bedroom newly renovated house in cape coast. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Cape Coast.",
    "propertyType": "HOUSE",
    "region": "Central",
    "city": "Cape Coast",
    "area": "Cantonments",
    "gpsLat": 5.1155,
    "gpsLng": -1.2466,
    "pricePerYear": 6986,
    "bedrooms": 1,
    "bathrooms": 1,
    "amenities": [
      "Parking",
      "Security",
      "Gym"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-12",
    "landlordId": "u-tenant-001",
    "title": "Affordable Self-Contained in Dansoman",
    "description": "This is a highly sought-after affordable self-contained in dansoman. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Cape Coast.",
    "propertyType": "SELF_CONTAINED",
    "region": "Central",
    "city": "Cape Coast",
    "area": "Dansoman",
    "gpsLat": 5.1155,
    "gpsLng": -1.2466,
    "pricePerYear": 5861,
    "bedrooms": 1,
    "bathrooms": 1,
    "amenities": [
      "WiFi",
      "Gym",
      "Security",
      "Parking",
      "Water Tank"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-13",
    "landlordId": "u-tenant-001",
    "title": "3 Bedroom Affordable House in Kumasi",
    "description": "This is a highly sought-after 3 bedroom affordable house in kumasi. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Kumasi.",
    "propertyType": "HOUSE",
    "region": "Ashanti",
    "city": "Kumasi",
    "area": "Dansoman",
    "gpsLat": 6.6885,
    "gpsLng": -1.6244,
    "pricePerYear": 22040,
    "bedrooms": 2,
    "bathrooms": 2,
    "amenities": [
      "Pool",
      "Gym",
      "Air Conditioning",
      "Parking"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-14",
    "landlordId": "u-tenant-001",
    "title": "Spacious Self-Contained in Ridge",
    "description": "This is a highly sought-after spacious self-contained in ridge. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Tarkwa.",
    "propertyType": "SELF_CONTAINED",
    "region": "Western",
    "city": "Tarkwa",
    "area": "Ridge",
    "gpsLat": 5.6037,
    "gpsLng": -0.187,
    "pricePerYear": 4979,
    "bedrooms": 1,
    "bathrooms": 1,
    "amenities": [
      "Backup Generator",
      "Gym",
      "Pool",
      "Air Conditioning"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-15",
    "landlordId": "u-tenant-001",
    "title": "Modern Single Room in Ridge",
    "description": "This is a highly sought-after modern single room in ridge. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Kasoa.",
    "propertyType": "SINGLE_ROOM",
    "region": "Central",
    "city": "Kasoa",
    "area": "Ridge",
    "gpsLat": 5.6037,
    "gpsLng": -0.187,
    "pricePerYear": 22234,
    "bedrooms": 1,
    "bathrooms": 0,
    "amenities": [
      "Water Tank",
      "Air Conditioning",
      "Gym",
      "Balcony"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-16",
    "landlordId": "u-tenant-001",
    "title": "4 Bedroom Prime House in Obuasi",
    "description": "This is a highly sought-after 4 bedroom prime house in obuasi. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Obuasi.",
    "propertyType": "HOUSE",
    "region": "Ashanti",
    "city": "Obuasi",
    "area": "East Legon",
    "gpsLat": 5.6037,
    "gpsLng": -0.187,
    "pricePerYear": 7419,
    "bedrooms": 2,
    "bathrooms": 2,
    "amenities": [
      "Gym",
      "Water Tank",
      "Security",
      "Pool"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-17",
    "landlordId": "u-tenant-001",
    "title": "1 Bedroom Newly Renovated Apartment in East Legon",
    "description": "This is a highly sought-after 1 bedroom newly renovated apartment in east legon. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Cape Coast.",
    "propertyType": "APARTMENT",
    "region": "Central",
    "city": "Cape Coast",
    "area": "East Legon",
    "gpsLat": 5.1155,
    "gpsLng": -1.2466,
    "pricePerYear": 18647,
    "bedrooms": 3,
    "bathrooms": 1,
    "amenities": [
      "Backup Generator",
      "Parking"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-18",
    "landlordId": "u-tenant-001",
    "title": "4 Bedroom Modern House in Cape Coast",
    "description": "This is a highly sought-after 4 bedroom modern house in cape coast. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Cape Coast.",
    "propertyType": "HOUSE",
    "region": "Central",
    "city": "Cape Coast",
    "area": "Dzorwulu",
    "gpsLat": 5.1155,
    "gpsLng": -1.2466,
    "pricePerYear": 12939,
    "bedrooms": 1,
    "bathrooms": 1,
    "amenities": [
      "Security",
      "Air Conditioning",
      "Pool",
      "Gym"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-19",
    "landlordId": "u-tenant-001",
    "title": "Beautiful Self-Contained in Cantonments",
    "description": "This is a highly sought-after beautiful self-contained in cantonments. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Obuasi.",
    "propertyType": "SELF_CONTAINED",
    "region": "Ashanti",
    "city": "Obuasi",
    "area": "Cantonments",
    "gpsLat": 5.6037,
    "gpsLng": -0.187,
    "pricePerYear": 22921,
    "bedrooms": 1,
    "bathrooms": 1,
    "amenities": [
      "Backup Generator",
      "Gym",
      "Water Tank",
      "Air Conditioning",
      "WiFi",
      "Security"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-20",
    "landlordId": "u-tenant-001",
    "title": "Stunning Single Room in Cantonments",
    "description": "This is a highly sought-after stunning single room in cantonments. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Tema.",
    "propertyType": "SINGLE_ROOM",
    "region": "Greater Accra",
    "city": "Tema",
    "area": "Cantonments",
    "gpsLat": 5.6037,
    "gpsLng": -0.187,
    "pricePerYear": 11624,
    "bedrooms": 1,
    "bathrooms": 0,
    "amenities": [
      "WiFi",
      "Parking",
      "Gym",
      "Security",
      "Backup Generator"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-21",
    "landlordId": "u-tenant-001",
    "title": "1 Bedroom Spacious Apartment in Airport Residential",
    "description": "This is a highly sought-after 1 bedroom spacious apartment in airport residential. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Kasoa.",
    "propertyType": "APARTMENT",
    "region": "Central",
    "city": "Kasoa",
    "area": "Airport Residential",
    "gpsLat": 5.6037,
    "gpsLng": -0.187,
    "pricePerYear": 2203,
    "bedrooms": 1,
    "bathrooms": 1,
    "amenities": [
      "Gym",
      "Pool",
      "Air Conditioning",
      "Backup Generator",
      "Parking"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-22",
    "landlordId": "u-tenant-001",
    "title": "Luxurious Single Room in Dansoman",
    "description": "This is a highly sought-after luxurious single room in dansoman. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Tarkwa.",
    "propertyType": "SINGLE_ROOM",
    "region": "Western",
    "city": "Tarkwa",
    "area": "Dansoman",
    "gpsLat": 5.6037,
    "gpsLng": -0.187,
    "pricePerYear": 6176,
    "bedrooms": 1,
    "bathrooms": 0,
    "amenities": [
      "WiFi",
      "Backup Generator",
      "Air Conditioning"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-23",
    "landlordId": "u-tenant-001",
    "title": "5 Bedroom Luxurious House in Cape Coast",
    "description": "This is a highly sought-after 5 bedroom luxurious house in cape coast. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Cape Coast.",
    "propertyType": "HOUSE",
    "region": "Central",
    "city": "Cape Coast",
    "area": "Airport Residential",
    "gpsLat": 5.1155,
    "gpsLng": -1.2466,
    "pricePerYear": 3715,
    "bedrooms": 2,
    "bathrooms": 2,
    "amenities": [
      "Backup Generator",
      "Water Tank",
      "Pool",
      "Balcony"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-24",
    "landlordId": "u-tenant-001",
    "title": "3 Bedroom Beautiful House in Takoradi",
    "description": "This is a highly sought-after 3 bedroom beautiful house in takoradi. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Takoradi.",
    "propertyType": "HOUSE",
    "region": "Western",
    "city": "Takoradi",
    "area": "Cantonments",
    "gpsLat": 4.8961,
    "gpsLng": -1.7656,
    "pricePerYear": 15916,
    "bedrooms": 1,
    "bathrooms": 1,
    "amenities": [
      "Air Conditioning",
      "Water Tank",
      "Pool"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-25",
    "landlordId": "u-tenant-001",
    "title": "5 Bedroom Affordable House in Takoradi",
    "description": "This is a highly sought-after 5 bedroom affordable house in takoradi. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Takoradi.",
    "propertyType": "HOUSE",
    "region": "Western",
    "city": "Takoradi",
    "area": "Dansoman",
    "gpsLat": 4.8961,
    "gpsLng": -1.7656,
    "pricePerYear": 7606,
    "bedrooms": 1,
    "bathrooms": 1,
    "amenities": [
      "Security",
      "Balcony",
      "Parking",
      "WiFi",
      "Air Conditioning"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-26",
    "landlordId": "u-tenant-001",
    "title": "Beautiful Self-Contained in Airport Residential",
    "description": "This is a highly sought-after beautiful self-contained in airport residential. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Obuasi.",
    "propertyType": "SELF_CONTAINED",
    "region": "Ashanti",
    "city": "Obuasi",
    "area": "Airport Residential",
    "gpsLat": 5.6037,
    "gpsLng": -0.187,
    "pricePerYear": 1623,
    "bedrooms": 1,
    "bathrooms": 1,
    "amenities": [
      "Backup Generator",
      "Gym",
      "Pool",
      "Parking",
      "WiFi"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-27",
    "landlordId": "u-tenant-001",
    "title": "3 Bedroom Stunning House in Takoradi",
    "description": "This is a highly sought-after 3 bedroom stunning house in takoradi. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Takoradi.",
    "propertyType": "HOUSE",
    "region": "Western",
    "city": "Takoradi",
    "area": "Airport Residential",
    "gpsLat": 4.8961,
    "gpsLng": -1.7656,
    "pricePerYear": 17762,
    "bedrooms": 5,
    "bathrooms": 2,
    "amenities": [
      "WiFi",
      "Balcony",
      "Air Conditioning",
      "Security",
      "Backup Generator"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-28",
    "landlordId": "u-tenant-001",
    "title": "1 Bedroom Stunning Apartment in East Legon",
    "description": "This is a highly sought-after 1 bedroom stunning apartment in east legon. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Tarkwa.",
    "propertyType": "APARTMENT",
    "region": "Western",
    "city": "Tarkwa",
    "area": "East Legon",
    "gpsLat": 5.6037,
    "gpsLng": -0.187,
    "pricePerYear": 23860,
    "bedrooms": 1,
    "bathrooms": 1,
    "amenities": [
      "Gym",
      "Air Conditioning",
      "Balcony",
      "WiFi"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-29",
    "landlordId": "u-tenant-001",
    "title": "5 Bedroom Stunning House in Obuasi",
    "description": "This is a highly sought-after 5 bedroom stunning house in obuasi. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Obuasi.",
    "propertyType": "HOUSE",
    "region": "Ashanti",
    "city": "Obuasi",
    "area": "East Legon",
    "gpsLat": 5.6037,
    "gpsLng": -0.187,
    "pricePerYear": 21766,
    "bedrooms": 2,
    "bathrooms": 1,
    "amenities": [
      "Gym",
      "Pool",
      "Security"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-30",
    "landlordId": "u-tenant-001",
    "title": "Cozy Self-Contained in Cantonments",
    "description": "This is a highly sought-after cozy self-contained in cantonments. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Tarkwa.",
    "propertyType": "SELF_CONTAINED",
    "region": "Western",
    "city": "Tarkwa",
    "area": "Cantonments",
    "gpsLat": 5.6037,
    "gpsLng": -0.187,
    "pricePerYear": 6591,
    "bedrooms": 1,
    "bathrooms": 1,
    "amenities": [
      "WiFi",
      "Security",
      "Balcony",
      "Air Conditioning"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-31",
    "landlordId": "u-tenant-001",
    "title": "1 Bedroom Luxurious Apartment in Airport Residential",
    "description": "This is a highly sought-after 1 bedroom luxurious apartment in airport residential. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Kumasi.",
    "propertyType": "APARTMENT",
    "region": "Ashanti",
    "city": "Kumasi",
    "area": "Airport Residential",
    "gpsLat": 6.6885,
    "gpsLng": -1.6244,
    "pricePerYear": 11758,
    "bedrooms": 3,
    "bathrooms": 3,
    "amenities": [
      "Backup Generator",
      "Security"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-32",
    "landlordId": "u-tenant-001",
    "title": "3 Bedroom Modern Apartment in East Legon",
    "description": "This is a highly sought-after 3 bedroom modern apartment in east legon. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Tarkwa.",
    "propertyType": "APARTMENT",
    "region": "Western",
    "city": "Tarkwa",
    "area": "East Legon",
    "gpsLat": 5.6037,
    "gpsLng": -0.187,
    "pricePerYear": 3516,
    "bedrooms": 4,
    "bathrooms": 4,
    "amenities": [
      "Balcony",
      "Gym"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-33",
    "landlordId": "u-tenant-001",
    "title": "Modern Single Room in Airport Residential",
    "description": "This is a highly sought-after modern single room in airport residential. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Obuasi.",
    "propertyType": "SINGLE_ROOM",
    "region": "Ashanti",
    "city": "Obuasi",
    "area": "Airport Residential",
    "gpsLat": 5.6037,
    "gpsLng": -0.187,
    "pricePerYear": 7729,
    "bedrooms": 1,
    "bathrooms": 0,
    "amenities": [
      "Gym",
      "Backup Generator"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-34",
    "landlordId": "u-tenant-001",
    "title": "5 Bedroom Cozy House in Cape Coast",
    "description": "This is a highly sought-after 5 bedroom cozy house in cape coast. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Cape Coast.",
    "propertyType": "HOUSE",
    "region": "Central",
    "city": "Cape Coast",
    "area": "Dansoman",
    "gpsLat": 5.1155,
    "gpsLng": -1.2466,
    "pricePerYear": 21627,
    "bedrooms": 2,
    "bathrooms": 2,
    "amenities": [
      "Water Tank",
      "Balcony",
      "Air Conditioning",
      "Pool",
      "Gym"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-35",
    "landlordId": "u-tenant-001",
    "title": "Newly Renovated Self-Contained in Cantonments",
    "description": "This is a highly sought-after newly renovated self-contained in cantonments. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Tarkwa.",
    "propertyType": "SELF_CONTAINED",
    "region": "Western",
    "city": "Tarkwa",
    "area": "Cantonments",
    "gpsLat": 5.6037,
    "gpsLng": -0.187,
    "pricePerYear": 3132,
    "bedrooms": 1,
    "bathrooms": 1,
    "amenities": [
      "Backup Generator",
      "WiFi",
      "Air Conditioning"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-36",
    "landlordId": "u-tenant-001",
    "title": "Elegant Single Room in East Legon",
    "description": "This is a highly sought-after elegant single room in east legon. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Accra.",
    "propertyType": "SINGLE_ROOM",
    "region": "Greater Accra",
    "city": "Accra",
    "area": "East Legon",
    "gpsLat": 5.6037,
    "gpsLng": -0.187,
    "pricePerYear": 6537,
    "bedrooms": 1,
    "bathrooms": 0,
    "amenities": [
      "Pool",
      "Air Conditioning",
      "WiFi",
      "Gym"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-37",
    "landlordId": "u-tenant-001",
    "title": "3 Bedroom Beautiful Apartment in Osu",
    "description": "This is a highly sought-after 3 bedroom beautiful apartment in osu. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Accra.",
    "propertyType": "APARTMENT",
    "region": "Greater Accra",
    "city": "Accra",
    "area": "Osu",
    "gpsLat": 5.6037,
    "gpsLng": -0.187,
    "pricePerYear": 3629,
    "bedrooms": 5,
    "bathrooms": 5,
    "amenities": [
      "Pool",
      "Security"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-38",
    "landlordId": "u-tenant-001",
    "title": "Stunning Single Room in Osu",
    "description": "This is a highly sought-after stunning single room in osu. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Tarkwa.",
    "propertyType": "SINGLE_ROOM",
    "region": "Western",
    "city": "Tarkwa",
    "area": "Osu",
    "gpsLat": 5.6037,
    "gpsLng": -0.187,
    "pricePerYear": 12667,
    "bedrooms": 1,
    "bathrooms": 0,
    "amenities": [
      "Backup Generator",
      "WiFi",
      "Air Conditioning"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-39",
    "landlordId": "u-tenant-001",
    "title": "Newly Renovated Single Room in Dansoman",
    "description": "This is a highly sought-after newly renovated single room in dansoman. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Kumasi.",
    "propertyType": "SINGLE_ROOM",
    "region": "Ashanti",
    "city": "Kumasi",
    "area": "Dansoman",
    "gpsLat": 6.6885,
    "gpsLng": -1.6244,
    "pricePerYear": 10336,
    "bedrooms": 1,
    "bathrooms": 0,
    "amenities": [
      "WiFi",
      "Gym"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-40",
    "landlordId": "u-tenant-001",
    "title": "4 Bedroom Modern House in Cape Coast",
    "description": "This is a highly sought-after 4 bedroom modern house in cape coast. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Cape Coast.",
    "propertyType": "HOUSE",
    "region": "Central",
    "city": "Cape Coast",
    "area": "East Legon",
    "gpsLat": 5.1155,
    "gpsLng": -1.2466,
    "pricePerYear": 24149,
    "bedrooms": 1,
    "bathrooms": 1,
    "amenities": [
      "Balcony",
      "Water Tank"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-41",
    "landlordId": "u-tenant-001",
    "title": "Luxurious Self-Contained in Cantonments",
    "description": "This is a highly sought-after luxurious self-contained in cantonments. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Tarkwa.",
    "propertyType": "SELF_CONTAINED",
    "region": "Western",
    "city": "Tarkwa",
    "area": "Cantonments",
    "gpsLat": 5.6037,
    "gpsLng": -0.187,
    "pricePerYear": 10949,
    "bedrooms": 1,
    "bathrooms": 1,
    "amenities": [
      "Security",
      "Water Tank",
      "Gym"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-42",
    "landlordId": "u-tenant-001",
    "title": "Cozy Self-Contained in Osu",
    "description": "This is a highly sought-after cozy self-contained in osu. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Accra.",
    "propertyType": "SELF_CONTAINED",
    "region": "Greater Accra",
    "city": "Accra",
    "area": "Osu",
    "gpsLat": 5.6037,
    "gpsLng": -0.187,
    "pricePerYear": 13708,
    "bedrooms": 1,
    "bathrooms": 1,
    "amenities": [
      "Balcony",
      "Pool",
      "Air Conditioning",
      "Security",
      "Water Tank",
      "WiFi"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-43",
    "landlordId": "u-tenant-001",
    "title": "Luxurious Self-Contained in Ridge",
    "description": "This is a highly sought-after luxurious self-contained in ridge. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Cape Coast.",
    "propertyType": "SELF_CONTAINED",
    "region": "Central",
    "city": "Cape Coast",
    "area": "Ridge",
    "gpsLat": 5.1155,
    "gpsLng": -1.2466,
    "pricePerYear": 10074,
    "bedrooms": 1,
    "bathrooms": 1,
    "amenities": [
      "Parking",
      "Water Tank",
      "Pool"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-44",
    "landlordId": "u-tenant-001",
    "title": "Cozy Self-Contained in Spintex",
    "description": "This is a highly sought-after cozy self-contained in spintex. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Tarkwa.",
    "propertyType": "SELF_CONTAINED",
    "region": "Western",
    "city": "Tarkwa",
    "area": "Spintex",
    "gpsLat": 5.6037,
    "gpsLng": -0.187,
    "pricePerYear": 22498,
    "bedrooms": 1,
    "bathrooms": 1,
    "amenities": [
      "Water Tank",
      "Gym",
      "Air Conditioning",
      "Security",
      "WiFi"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-45",
    "landlordId": "u-tenant-001",
    "title": "Newly Renovated Single Room in Airport Residential",
    "description": "This is a highly sought-after newly renovated single room in airport residential. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Accra.",
    "propertyType": "SINGLE_ROOM",
    "region": "Greater Accra",
    "city": "Accra",
    "area": "Airport Residential",
    "gpsLat": 5.6037,
    "gpsLng": -0.187,
    "pricePerYear": 17006,
    "bedrooms": 1,
    "bathrooms": 0,
    "amenities": [
      "WiFi",
      "Backup Generator",
      "Pool"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-46",
    "landlordId": "u-tenant-001",
    "title": "Luxurious Single Room in Dansoman",
    "description": "This is a highly sought-after luxurious single room in dansoman. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Madina.",
    "propertyType": "SINGLE_ROOM",
    "region": "Greater Accra",
    "city": "Madina",
    "area": "Dansoman",
    "gpsLat": 5.6037,
    "gpsLng": -0.187,
    "pricePerYear": 13702,
    "bedrooms": 1,
    "bathrooms": 0,
    "amenities": [
      "Gym",
      "Pool"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-47",
    "landlordId": "u-tenant-001",
    "title": "5 Bedroom Modern House in Kasoa",
    "description": "This is a highly sought-after 5 bedroom modern house in kasoa. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Kasoa.",
    "propertyType": "HOUSE",
    "region": "Central",
    "city": "Kasoa",
    "area": "Spintex",
    "gpsLat": 5.6037,
    "gpsLng": -0.187,
    "pricePerYear": 4333,
    "bedrooms": 3,
    "bathrooms": 1,
    "amenities": [
      "Backup Generator",
      "Pool"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-48",
    "landlordId": "u-tenant-001",
    "title": "Luxurious Self-Contained in Osu",
    "description": "This is a highly sought-after luxurious self-contained in osu. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Madina.",
    "propertyType": "SELF_CONTAINED",
    "region": "Greater Accra",
    "city": "Madina",
    "area": "Osu",
    "gpsLat": 5.6037,
    "gpsLng": -0.187,
    "pricePerYear": 17022,
    "bedrooms": 1,
    "bathrooms": 1,
    "amenities": [
      "Water Tank",
      "WiFi",
      "Parking",
      "Air Conditioning",
      "Balcony"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-49",
    "landlordId": "u-tenant-001",
    "title": "3 Bedroom Stunning Apartment in East Legon",
    "description": "This is a highly sought-after 3 bedroom stunning apartment in east legon. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Obuasi.",
    "propertyType": "APARTMENT",
    "region": "Ashanti",
    "city": "Obuasi",
    "area": "East Legon",
    "gpsLat": 5.6037,
    "gpsLng": -0.187,
    "pricePerYear": 19412,
    "bedrooms": 3,
    "bathrooms": 1,
    "amenities": [
      "Gym",
      "Parking"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
  {
    "id": "p-sql-50",
    "landlordId": "u-tenant-001",
    "title": "Luxurious Single Room in Airport Residential",
    "description": "This is a highly sought-after luxurious single room in airport residential. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Cape Coast.",
    "propertyType": "SINGLE_ROOM",
    "region": "Central",
    "city": "Cape Coast",
    "area": "Airport Residential",
    "gpsLat": 5.1155,
    "gpsLng": -1.2466,
    "pricePerYear": 14791,
    "bedrooms": 1,
    "bathrooms": 0,
    "amenities": [
      "Security",
      "Parking",
      "Gym",
      "Water Tank",
      "Pool"
    ],
    "isVerified": true,
    "status": "AVAILABLE",
    "media": [],
    "createdAt": "2026-07-12T21:54:13.366Z"
  },
];

// ---------------------------------------------------------------------------
// Seed bookings — spread across various states to exercise the UI
// ---------------------------------------------------------------------------

export const seedBookings: Booking[] = [
  {
    id: 'b-001',
    propertyId: 'p-001',
    tenantId: 'u-tenant-001',
    status: 'COMPLETED',
    requestedAt: '2026-05-01T10:00:00Z',
    moveInDate: '2026-06-01',
    durationMonths: 12,
    totalAmount: 3000,
    bookingRef: 'RS-T4X2KA',
  },
  {
    id: 'b-002',
    propertyId: 'p-002',
    tenantId: 'u-tenant-001',
    status: 'MOVED_IN',
    requestedAt: '2026-06-01T08:00:00Z',
    moveInDate: '2026-07-01',
    durationMonths: 12,
    totalAmount: 4800,
    bookingRef: 'RS-M8P3NB',
  },
  {
    id: 'b-003',
    propertyId: 'p-007',
    tenantId: 'u-tenant-001',
    status: 'PAID_ESCROW',
    requestedAt: '2026-06-20T14:00:00Z',
    moveInDate: '2026-08-01',
    durationMonths: 12,
    totalAmount: 18000,
    bookingRef: 'RS-E5W7QC',
  },
  {
    id: 'b-004',
    propertyId: 'p-003',
    tenantId: 'u-tenant-001',
    status: 'ACCEPTED',
    requestedAt: '2026-07-01T09:00:00Z',
    moveInDate: '2026-08-15',
    durationMonths: 12,
    totalAmount: 9600,
    bookingRef: 'RS-A3J9RD',
  },
  {
    id: 'b-005',
    propertyId: 'p-008',
    tenantId: 'u-tenant-001',
    status: 'REQUESTED',
    requestedAt: '2026-07-10T12:00:00Z',
    moveInDate: '2026-09-01',
    durationMonths: 12,
    totalAmount: 3600,
    bookingRef: 'RS-R7K4SE',
  },
  {
    id: 'b-006',
    propertyId: 'p-010',
    tenantId: 'u-tenant-001',
    status: 'REJECTED',
    requestedAt: '2026-06-15T16:00:00Z',
    moveInDate: '2026-07-15',
    durationMonths: 6,
    totalAmount: 3600,
    bookingRef: 'RS-X2N6VF',
  },
];

// ---------------------------------------------------------------------------
// Seed payments — only for bookings that reached PAID_ESCROW or beyond
// ---------------------------------------------------------------------------

export const seedPayments: Payment[] = [
  {
    id: 'pay-001',
    bookingId: 'b-001',
    paystackRef: 'PSK-REF-001-COMPLETED',
    amount: 3000,
    fee: 52.5,
    escrowStatus: 'RELEASED',
    paidAt: '2026-05-03T10:00:00Z',
    releasedAt: '2026-06-05T14:00:00Z',
  },
  {
    id: 'pay-002',
    bookingId: 'b-002',
    paystackRef: 'PSK-REF-002-MOVEDIN',
    amount: 4800,
    fee: 84.0,
    escrowStatus: 'RELEASED',
    paidAt: '2026-06-03T08:00:00Z',
    releasedAt: '2026-07-02T10:00:00Z',
  },
  {
    id: 'pay-003',
    bookingId: 'b-003',
    paystackRef: 'PSK-REF-003-ESCROW',
    amount: 18000,
    fee: 315.0,
    escrowStatus: 'HELD',
    paidAt: '2026-06-22T14:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Seed reviews — only for COMPLETED/MOVED_IN bookings (anti-fake-review rule)
// ---------------------------------------------------------------------------

export const seedReviews: Review[] = [
  {
    id: 'r-001',
    bookingId: 'b-001',
    reviewerId: 'u-tenant-001',
    revieweeId: 'u-landlord-001',
    rating: 4,
    comment:
      'Great location for KNUST students. Room was clean, landlord responsive. Water supply was occasionally inconsistent.',
    createdAt: '2026-06-10T12:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Other collections — start empty, populated via mock endpoints
// ---------------------------------------------------------------------------

// Agreements are auto-created when a booking reaches PAID_ESCROW.
// Pre-seeding for the two bookings that are already past that point.
export const seedAgreements: Agreement[] = [
  {
    id: 'agr-001',
    bookingId: 'b-001',
    pdfUrl: 'https://rentsure.com/mock-agreements/agr-001.pdf',
    tenantSignedAt: '2026-05-04T10:00:00Z',
    landlordSignedAt: '2026-05-04T11:00:00Z',
  },
  {
    id: 'agr-002',
    bookingId: 'b-003',
    pdfUrl: 'https://rentsure.com/mock-agreements/agr-003.pdf',
    // Neither party has signed yet — the UI should prompt them
  },
];

export const seedVerifications: Verification[] = [];

// Seed notifications — realistic entries for the tenant and landlord
export const seedNotifications: Notification[] = [
  {
    id: 'notif-001',
    userId: 'u-tenant-001',
    type: 'BOOKING_ACCEPTED',
    title: 'Booking Accepted',
    body: 'Your booking RS-A3J9RD for the Bomso apartment has been accepted. Pay now to secure it.',
    bookingId: 'b-004',
    isRead: false,
    createdAt: '2026-07-01T10:00:00Z',
  },
  {
    id: 'notif-002',
    userId: 'u-tenant-001',
    type: 'PAYMENT_RECEIVED',
    title: 'Payment Confirmed',
    body: 'Your escrow payment of GHS 18,000 for RS-E5W7QC is held safely. Both parties must sign the agreement.',
    bookingId: 'b-003',
    isRead: false,
    createdAt: '2026-06-22T14:30:00Z',
  },
  {
    id: 'notif-003',
    userId: 'u-tenant-001',
    type: 'REVIEW_RECEIVED',
    title: 'New Review',
    body: 'Your landlord Abena Osei left you a 5-star review.',
    isRead: true,
    createdAt: '2026-06-12T09:00:00Z',
  },
  {
    id: 'notif-004',
    userId: 'u-landlord-001',
    type: 'BOOKING_REQUESTED',
    title: 'New Booking Request',
    body: 'A tenant has requested booking RS-R7K4SE for your Madina listing.',
    bookingId: 'b-005',
    isRead: false,
    createdAt: '2026-07-10T12:30:00Z',
  },
  {
    id: 'notif-005',
    userId: 'u-landlord-001',
    type: 'PAYMENT_RECEIVED',
    title: 'Escrow Payment Received',
    body: 'GHS 18,000 is now held in escrow for booking RS-E5W7QC. Funds release when tenant confirms move-in.',
    bookingId: 'b-003',
    isRead: false,
    createdAt: '2026-06-22T14:30:00Z',
  },
  {
    id: 'notif-006',
    userId: 'u-landlord-001',
    type: 'REVIEW_RECEIVED',
    title: 'New Review',
    body: 'Kwame Mensah left a 4-star review on your Kotei listing.',
    isRead: true,
    createdAt: '2026-06-10T12:30:00Z',
  },
];

// ---------------------------------------------------------------------------
// Mutable in-memory database — mock handlers mutate these directly
// ---------------------------------------------------------------------------

/** IMPORTANT: All mock endpoint handlers must use this db object.
 *  Never import the seed arrays directly for reads — they are the
 *  initial snapshot only. The db arrays may have been mutated by
 *  earlier mock calls in the same session. */
export const db = {
  users: [] as User[],
  passwords: {} as Record<string, string>,
  properties: [] as Property[],
  bookings: [] as Booking[],
  payments: [] as Payment[],
  agreements: [] as Agreement[],
  tenantPreferences: [] as TenantPreferences[],
  reviews: [] as Review[],
  verifications: [] as Verification[],
  notifications: [] as Notification[],
  payoutMethods: [] as any[],
  paymentMethods: [] as any[],
};

// ---------------------------------------------------------------------------
// AsyncStorage Persistence (Write-through cache) & CSV Database
// ---------------------------------------------------------------------------

import { writeCsvFile, readCsvFile, deleteCsvFile, writeJsonFile, readJsonFile } from './persistence/fileStore';

const STORAGE_KEY = 'rentsure_mock_db_v1';
const USERS_CSV_FILENAME = 'users.csv';
const DB_JSON_FILENAME = 'db.json';

/**
 * Flush users to a local CSV file in the app's document directory.
 */
async function flushUsersToCsv() {
  try {
    const header = 'id,fullName,email,phone,role,isVerifiedEmail,status,createdAt\n';
    const rows = db.users.map(u => 
      `${u.id},${u.fullName},${u.email},${u.phone},${u.role},${u.isVerifiedEmail},${u.status},${u.createdAt}`
    ).join('\n');
    await writeCsvFile(USERS_CSV_FILENAME, header + rows);
  } catch (error) {
    console.error('Failed to write users.csv:', error);
  }
}

/**
 * Load users from the local CSV file.
 */
async function loadUsersFromCsv(): Promise<User[] | null> {
  try {
    const csvStr = await readCsvFile(USERS_CSV_FILENAME);
    if (!csvStr) return null;
    
    const lines = csvStr.split('\n').filter(l => l.trim() !== '');
    if (lines.length <= 1) return null; // Only header or empty
    
    return lines.slice(1).map(line => {
      const [id, fullName, email, phone, role, isVerifiedEmail, status, createdAt] = line.split(',');
      return {
        id,
        fullName,
        email,
        phone,
        role: role as any,
        isVerifiedEmail: isVerifiedEmail === 'true',
        status: status as any,
        createdAt,
      };
    });
  } catch (error) {
    console.error('Failed to read users.csv:', error);
    return null;
  }
}

/**
 * Flush the current in-memory DB to AsyncStorage and Users to CSV.
 * Call this at the end of every mock mutation handler.
 */
export async function flushDb() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    await flushUsersToCsv();
    await writeJsonFile(DB_JSON_FILENAME, db);
  } catch (error) {
    console.error('Failed to flush mock DB:', error);
  }
}

/**
 * Load the DB from AsyncStorage into memory.
 * If empty, seeds it with the initial mock data.
 * Also checks for the local CSV database for users.
 */
export async function initDb() {
  try {
    // 1. Try JSON file first (most robust against Expo resets)
    const jsonDb = await readJsonFile(DB_JSON_FILENAME);
    
    // 2. Fallback to AsyncStorage
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    
    console.log('📦 Local CSV Database Path:', USERS_CSV_FILENAME);
    
    // Attempt to load users from the CSV file (single source of truth for users)
    const csvUsers = await loadUsersFromCsv();
    
    if (jsonDb) {
      Object.assign(db, jsonDb);
      if (csvUsers) {
        db.users = csvUsers;
      }
    } else if (stored) {
      const parsed = JSON.parse(stored);
      Object.assign(db, parsed);
      if (csvUsers) {
        db.users = csvUsers;
      }
    } else {
      // First launch: Seed the database
      db.users = csvUsers || [...seedUsers];
      db.passwords = { ...userPasswords };
      db.properties = [...seedProperties];
      db.bookings = [...seedBookings];
      db.payments = [...seedPayments];
      db.agreements = [...seedAgreements];
      db.reviews = [...seedReviews];
      db.verifications = [...seedVerifications];
      db.notifications = [...seedNotifications];

      db.tenantPreferences = [
        {
          userId: '11111111-1111-1111-1111-111111111111',
          budgetMaxPerYear: 12000,
          preferredCities: ['Accra'],
          preferredAreas: ['East Legon'],
          propertyTypes: ['APARTMENT'],
          minBedrooms: 1,
          requiredAmenities: [],
          niceToHaveAmenities: [],
          updatedAt: new Date().toISOString()
        }
      ];
    }

    // Perform 72h expiry sweep on ACCEPTED bookings
    // This enforces the business rule that prevents landlords from being held hostage
    let needsFlush = !stored || !csvUsers;
    const now = Date.now();
    const SEVENTY_TWO_HOURS = 72 * 60 * 60 * 1000;
    
    for (const booking of db.bookings) {
      // We don't have an "acceptedAt" timestamp, but in this mock layer 
      // we can infer it or just use the last updated time (for simplicity, we'll check requestedAt)
      if (booking.status === 'ACCEPTED') {
        const age = now - new Date(booking.requestedAt).getTime();
        if (age > SEVENTY_TWO_HOURS) {
          booking.status = 'EXPIRED';
          needsFlush = true;
        }
      }
    }

    if (needsFlush) {
      await flushDb();
    }
  } catch (error) {
    console.error('Failed to init mock DB:', error);
  }
}

/**
 * Dev utility: Wipe and re-seed the DB.
 */
export async function resetDb() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    await deleteCsvFile(USERS_CSV_FILENAME);
    // write empty string isn't standard, we'll just overwrite it in initDb or we could add deleteJsonFile
    // let's just write an empty object
    await writeJsonFile(DB_JSON_FILENAME, {});
    await initDb();
  } catch (error) {
    console.error('Failed to reset mock DB:', error);
  }
}

// ---------------------------------------------------------------------------
// Valid booking state transitions — the mock layer enforces these
// to match the real backend's BookingService.transition() logic.
// ---------------------------------------------------------------------------

/**
 * IMPORTANT: This map is the single source of truth for valid booking
 * transitions in the mock layer. The real backend has an identical map
 * in BookingService. If you add a transition here, you MUST add it
 * there too (and vice versa), or the mock and real behavior will diverge.
 */
export const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  REQUESTED: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACCEPTED: ['EXPIRED', 'PAID_ESCROW', 'CANCELLED'],
  REJECTED: [],
  EXPIRED: [],
  PAID_ESCROW: ['MOVED_IN'],
  MOVED_IN: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

/**
 * Refresh token store — maps refresh token string → user ID.
 * In the real backend this would be in Redis or a DB table with expiry.
 */
export const refreshTokens: Record<string, string> = {};

// ---------------------------------------------------------------------------
// Mock Authorization Layer (Session Scoping) & Mutex
// ---------------------------------------------------------------------------
/**
 * IMPORTANT: This mirrors backend authorization — every rule here must exist
 * in the Spring Boot services too, or integration will behave differently
 * than the demo.
 */
import { useAuthStore } from '@/store/auth.store';

export function requireAuth() {
  const user = useAuthStore.getState().user;
  if (!user) return null;
  
  // Return the freshest user from the DB to ensure role changes (e.g. verification) apply
  const dbUser = db.users.find(u => u.id === user.id);
  return dbUser || null;
}

// Simple serialized write queue for Concurrent Safety
let writeQueue: Promise<any> = Promise.resolve();
export function withWriteLock<T>(task: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(task, task);
  writeQueue = result.then(() => {}, () => {});
  return result;
}
