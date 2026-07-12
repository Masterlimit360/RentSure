import { test } from 'node:test';
import assert from 'node:assert';
import { computeCompatibility } from '../src/utils/compatibility';
import { TenantPreferences, Property } from '../src/types';

// Mock Defaults
const defaultPrefs: TenantPreferences = {
  userId: 'tenant-1',
  budgetMaxPerYear: 15000,
  preferredCities: ['Accra'],
  preferredAreas: ['East Legon'],
  propertyTypes: ['APARTMENT'],
  minBedrooms: 2,
  requiredAmenities: ['Running Water'],
  niceToHaveAmenities: ['WiFi', 'AC'],
  updatedAt: new Date().toISOString()
};

const defaultProperty: Property = {
  id: 'prop-1',
  landlordId: 'll-1',
  title: 'Luxury Apartment',
  description: 'Nice place',
  propertyType: 'APARTMENT',
  region: 'Greater Accra',
  city: 'Accra',
  area: 'East Legon',
  pricePerYear: 12000, // 80% of 15000
  bedrooms: 2,
  bathrooms: 2,
  amenities: ['Running Water', 'WiFi', 'AC'],
  isVerified: true,
  status: 'AVAILABLE',
  media: [],
  createdAt: new Date().toISOString()
};

test('1. Perfect match (100)', () => {
  const score = computeCompatibility(defaultPrefs, defaultProperty);
  assert.strictEqual(score.total, 100);
  assert.strictEqual(score.factors.find(f => f.key === 'BUDGET')?.score, 30);
  assert.strictEqual(score.factors.find(f => f.key === 'LOCATION')?.score, 25);
  assert.strictEqual(score.factors.find(f => f.key === 'TYPE')?.score, 15);
  assert.strictEqual(score.factors.find(f => f.key === 'ROOMS')?.score, 10);
  assert.strictEqual(score.factors.find(f => f.key === 'AMENITIES')?.score, 20);
});

test('2. Dealbreaker cap (Missing running water → ≤ 40)', () => {
  const propertyMissingReq = { ...defaultProperty, amenities: ['WiFi', 'AC'] };
  const score = computeCompatibility(defaultPrefs, propertyMissingReq);
  assert.strictEqual(score.total, 40, `Expected capped score of 40, got ${score.total}`);
  const amFactor = score.factors.find(f => f.key === 'AMENITIES');
  assert.strictEqual(amFactor?.score, 0);
  assert.match(amFactor?.detail || '', /Missing: Running Water/);
});

test('3. Empty preferences redistribution (Sums to 100)', () => {
  const emptyLocPrefs: TenantPreferences = {
    ...defaultPrefs,
    preferredCities: [],
    preferredAreas: []
  };
  const score = computeCompatibility(emptyLocPrefs, defaultProperty);
  assert.strictEqual(score.total, 100);
  // Active sum = 30 + 15 + 10 + 20 = 75
  // Multiplier = 100 / 75 = 1.3333333333
  // Budget Max = 30 * 1.33 = 40
  assert.strictEqual(score.factors.find(f => f.key === 'BUDGET')?.maxScore, 40);
  assert.strictEqual(score.factors.find(f => f.key === 'LOCATION'), undefined);
});

test('4. Over-budget curve scaling (Linear drop-off)', () => {
  // Budget = 15000. 100% (15000) -> 20.
  const prop15k = { ...defaultProperty, pricePerYear: 15000 };
  const score1 = computeCompatibility(defaultPrefs, prop15k);
  assert.strictEqual(score1.factors.find(f => f.key === 'BUDGET')?.score, 20);

  // 115% (17250) -> 5
  const prop17k = { ...defaultProperty, pricePerYear: 17250 };
  const score2 = computeCompatibility(defaultPrefs, prop17k);
  assert.strictEqual(score2.factors.find(f => f.key === 'BUDGET')?.score, 5);

  // 120% (18000) -> 0
  const prop18k = { ...defaultProperty, pricePerYear: 18000 };
  const score3 = computeCompatibility(defaultPrefs, prop18k);
  assert.strictEqual(score3.factors.find(f => f.key === 'BUDGET')?.score, 0);
});

test('5. Missing property amenity data (No penalty, scores 0 un-capped)', () => {
  const propNoAmenities = { ...defaultProperty, amenities: [] };
  const score = computeCompatibility(defaultPrefs, propNoAmenities);
  const amFactor = score.factors.find(f => f.key === 'AMENITIES');
  assert.strictEqual(amFactor?.score, 0);
  assert.strictEqual(amFactor?.detail, 'No data from landlord');
  // It should not cap at 40
  assert.ok(score.total > 40, `Score was capped: ${score.total}`);
});

test('6. Demo tenant scenario (East Legon property manual check)', () => {
  // Budget: 30, Loc: 25, Type: 15, Rooms: 10, Am: 20
  const demoPrefs: TenantPreferences = {
    userId: 'tenant-1',
    budgetMaxPerYear: 12000,
    preferredCities: ['Accra'],
    preferredAreas: ['East Legon'],
    propertyTypes: ['APARTMENT'],
    minBedrooms: 1,
    requiredAmenities: [],
    niceToHaveAmenities: [],
    updatedAt: new Date().toISOString()
  };
  const demoProp: Property = {
    id: '99999999-9999-9999-9999-999999999999',
    landlordId: '22222222-2222-2222-2222-222222222222',
    title: 'Luxury Studio in East Legon',
    description: 'A beautiful studio apartment in the heart of East Legon.',
    propertyType: 'APARTMENT',
    region: 'Greater Accra',
    city: 'Accra',
    area: 'East Legon',
    pricePerYear: 12000,
    bedrooms: 1,
    bathrooms: 1,
    amenities: [],
    status: 'AVAILABLE',
    isVerified: true,
    media: [],
    createdAt: new Date().toISOString()
  };
  
  const score = computeCompatibility(demoPrefs, demoProp);
  // Budget: 12k / 12k = 100% -> 20 points
  // Loc: East Legon match -> 25 points
  // Type: APARTMENT match -> 15 points
  // Rooms: 1 >= 1 -> 10 points
  // Amenities: No requirements, property has none, base becomes 20 -> 20 points
  // Total: 20 + 25 + 15 + 10 + 20 = 90
  assert.strictEqual(score.total, 90);
});
