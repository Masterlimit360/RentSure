const fs = require('fs');
const path = require('path');

const NUM_LISTINGS = 50;

const REGIONS = ['Greater Accra', 'Ashanti', 'Central', 'Western'];
const CITIES = {
  'Greater Accra': ['Accra', 'Tema', 'Madina'],
  'Ashanti': ['Kumasi', 'Obuasi'],
  'Central': ['Cape Coast', 'Kasoa'],
  'Western': ['Takoradi', 'Tarkwa']
};
const AREAS = ['East Legon', 'Cantonments', 'Osu', 'Dansoman', 'Spintex', 'Airport Residential', 'Dzorwulu', 'Ridge'];
const TYPES = ['SINGLE_ROOM', 'SELF_CONTAINED', 'APARTMENT', 'HOUSE'];

const HOUSE_IMAGES = [
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb65?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80'
];

const INTERIOR_IMAGES = [
  'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', // kitchen
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', // bedroom
  'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', // living
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80'  // bathroom
];

const AMENITIES = ['WiFi', 'Air Conditioning', 'Pool', 'Gym', 'Parking', 'Security', 'Backup Generator', 'Water Tank', 'Balcony'];

const ADJECTIVES = ['Beautiful', 'Spacious', 'Modern', 'Cozy', 'Luxurious', 'Affordable', 'Newly Renovated', 'Prime', 'Stunning', 'Elegant'];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randAmenities = () => {
  const count = randInt(2, 6);
  const shuffled = [...AMENITIES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

let sql = `
-- Migration to seed 50 listings for tenant@rentsure.com
-- Promotes the account to LANDLORD and sets is_verified = true.

DO $$
DECLARE
  target_user_id UUID;
  new_prop_id UUID;
  i INTEGER;
BEGIN
  -- 1. Get the user ID for tenant@rentsure.com
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'tenant@rentsure.com' LIMIT 1;
  
  -- If the user doesn't exist, exit gracefully
  IF target_user_id IS NULL THEN
    RAISE NOTICE 'User tenant@rentsure.com not found. Skipping seed.';
    RETURN;
  END IF;

  -- 2. Update their profile to be a verified landlord
  UPDATE public.profiles 
  SET role = 'LANDLORD', is_verified = true 
  WHERE id = target_user_id;

`;

for (let i = 0; i < NUM_LISTINGS; i++) {
  const type = rand(TYPES);
  const region = rand(REGIONS);
  const city = rand(CITIES[region]);
  const area = rand(AREAS);
  
  let title = '';
  if (type === 'SINGLE_ROOM') title = `${rand(ADJECTIVES)} Single Room in ${area}`;
  if (type === 'SELF_CONTAINED') title = `${rand(ADJECTIVES)} Self-Contained in ${area}`;
  if (type === 'APARTMENT') title = `${randInt(1, 3)} Bedroom ${rand(ADJECTIVES)} Apartment in ${area}`;
  if (type === 'HOUSE') title = `${randInt(3, 5)} Bedroom ${rand(ADJECTIVES)} House in ${city}`;

  const price = randInt(1500, 25000);
  const beds = type === 'SINGLE_ROOM' ? 1 : type === 'SELF_CONTAINED' ? 1 : randInt(1, 5);
  const baths = type === 'SINGLE_ROOM' ? 0 : randInt(1, beds);
  const description = `This is a highly sought-after ${title.toLowerCase()}. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in ${city}.`;

  const amenitiesSql = `'[${randAmenities().map(a => `"${a}"`).join(', ')}]'::jsonb`;

  const exteriorImg = rand(HOUSE_IMAGES);
  const interiorImg1 = rand(INTERIOR_IMAGES);
  const interiorImg2 = rand(INTERIOR_IMAGES);

  sql += `
  -- Listing ${i + 1}
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '${title.replace(/'/g, "''")}', '${description.replace(/'/g, "''")}', '${type}', '${region}', '${city}', '${area}',
    ${price}, ${beds}, ${baths}, ${amenitiesSql}, true, 'AVAILABLE', NOW() - INTERVAL '${randInt(1, 30)} days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', '${exteriorImg}', 0),
    (new_prop_id, 'PHOTO', '${interiorImg1}', 1),
    (new_prop_id, 'PHOTO', '${interiorImg2}', 2);
`;
}

sql += `
END $$;
`;

const dest = path.join(__dirname, '../supabase/migrations/20260712000009_seed_50_listings.sql');
fs.writeFileSync(dest, sql);
console.log('Seed migration created at ' + dest);
