
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


  -- Listing 1
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '3 Bedroom Luxurious House in Tarkwa', 'This is a highly sought-after 3 bedroom luxurious house in tarkwa. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Tarkwa.', 'HOUSE', 'Western', 'Tarkwa', 'Dzorwulu',
    10443, 4, 1, '["Security", "Water Tank"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '16 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 2
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '4 Bedroom Modern House in Cape Coast', 'This is a highly sought-after 4 bedroom modern house in cape coast. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Cape Coast.', 'HOUSE', 'Central', 'Cape Coast', 'Osu',
    17052, 5, 5, '["Parking", "Gym", "Security", "Pool"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '14 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 3
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '2 Bedroom Beautiful Apartment in Airport Residential', 'This is a highly sought-after 2 bedroom beautiful apartment in airport residential. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Accra.', 'APARTMENT', 'Greater Accra', 'Accra', 'Airport Residential',
    21522, 4, 3, '["Parking", "WiFi", "Pool", "Gym", "Security", "Water Tank"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '11 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 4
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '1 Bedroom Newly Renovated Apartment in Airport Residential', 'This is a highly sought-after 1 bedroom newly renovated apartment in airport residential. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Takoradi.', 'APARTMENT', 'Western', 'Takoradi', 'Airport Residential',
    6380, 2, 1, '["Gym", "Security", "Balcony", "Backup Generator", "Water Tank"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '27 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 5
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Spacious Single Room in Ridge', 'This is a highly sought-after spacious single room in ridge. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Cape Coast.', 'SINGLE_ROOM', 'Central', 'Cape Coast', 'Ridge',
    2269, 1, 0, '["Security", "Water Tank", "Backup Generator", "Pool"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '24 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb65?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 6
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '4 Bedroom Modern House in Tema', 'This is a highly sought-after 4 bedroom modern house in tema. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Tema.', 'HOUSE', 'Greater Accra', 'Tema', 'Cantonments',
    22360, 1, 1, '["WiFi", "Security", "Water Tank", "Balcony", "Parking"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '24 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 7
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '3 Bedroom Spacious House in Madina', 'This is a highly sought-after 3 bedroom spacious house in madina. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Madina.', 'HOUSE', 'Greater Accra', 'Madina', 'Airport Residential',
    4593, 3, 2, '["Water Tank", "WiFi", "Air Conditioning", "Pool"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '7 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 8
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '3 Bedroom Newly Renovated Apartment in East Legon', 'This is a highly sought-after 3 bedroom newly renovated apartment in east legon. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Kasoa.', 'APARTMENT', 'Central', 'Kasoa', 'East Legon',
    13135, 3, 2, '["WiFi", "Air Conditioning", "Backup Generator", "Gym"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '12 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 9
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Stunning Self-Contained in Osu', 'This is a highly sought-after stunning self-contained in osu. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Obuasi.', 'SELF_CONTAINED', 'Ashanti', 'Obuasi', 'Osu',
    5753, 1, 1, '["Balcony", "Water Tank"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '6 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb65?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 10
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Affordable Single Room in Dansoman', 'This is a highly sought-after affordable single room in dansoman. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Madina.', 'SINGLE_ROOM', 'Greater Accra', 'Madina', 'Dansoman',
    12144, 1, 0, '["Gym", "Pool", "Balcony", "Air Conditioning"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '15 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 11
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '4 Bedroom Newly Renovated House in Cape Coast', 'This is a highly sought-after 4 bedroom newly renovated house in cape coast. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Cape Coast.', 'HOUSE', 'Central', 'Cape Coast', 'Cantonments',
    6986, 1, 1, '["Parking", "Security", "Gym"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '9 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 12
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Affordable Self-Contained in Dansoman', 'This is a highly sought-after affordable self-contained in dansoman. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Cape Coast.', 'SELF_CONTAINED', 'Central', 'Cape Coast', 'Dansoman',
    5861, 1, 1, '["WiFi", "Gym", "Security", "Parking", "Water Tank"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '14 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 13
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '3 Bedroom Affordable House in Kumasi', 'This is a highly sought-after 3 bedroom affordable house in kumasi. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Kumasi.', 'HOUSE', 'Ashanti', 'Kumasi', 'Dansoman',
    22040, 2, 2, '["Pool", "Gym", "Air Conditioning", "Parking"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '28 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 14
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Spacious Self-Contained in Ridge', 'This is a highly sought-after spacious self-contained in ridge. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Tarkwa.', 'SELF_CONTAINED', 'Western', 'Tarkwa', 'Ridge',
    4979, 1, 1, '["Backup Generator", "Gym", "Pool", "Air Conditioning"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '4 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 15
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Modern Single Room in Ridge', 'This is a highly sought-after modern single room in ridge. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Kasoa.', 'SINGLE_ROOM', 'Central', 'Kasoa', 'Ridge',
    22234, 1, 0, '["Water Tank", "Air Conditioning", "Gym", "Balcony"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '10 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 16
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '4 Bedroom Prime House in Obuasi', 'This is a highly sought-after 4 bedroom prime house in obuasi. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Obuasi.', 'HOUSE', 'Ashanti', 'Obuasi', 'East Legon',
    7419, 2, 2, '["Gym", "Water Tank", "Security", "Pool"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '23 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 17
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '1 Bedroom Newly Renovated Apartment in East Legon', 'This is a highly sought-after 1 bedroom newly renovated apartment in east legon. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Cape Coast.', 'APARTMENT', 'Central', 'Cape Coast', 'East Legon',
    18647, 3, 1, '["Backup Generator", "Parking"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '25 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 18
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '4 Bedroom Modern House in Cape Coast', 'This is a highly sought-after 4 bedroom modern house in cape coast. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Cape Coast.', 'HOUSE', 'Central', 'Cape Coast', 'Dzorwulu',
    12939, 1, 1, '["Security", "Air Conditioning", "Pool", "Gym"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '21 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 19
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Beautiful Self-Contained in Cantonments', 'This is a highly sought-after beautiful self-contained in cantonments. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Obuasi.', 'SELF_CONTAINED', 'Ashanti', 'Obuasi', 'Cantonments',
    22921, 1, 1, '["Backup Generator", "Gym", "Water Tank", "Air Conditioning", "WiFi", "Security"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '23 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 20
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Stunning Single Room in Cantonments', 'This is a highly sought-after stunning single room in cantonments. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Tema.', 'SINGLE_ROOM', 'Greater Accra', 'Tema', 'Cantonments',
    11624, 1, 0, '["WiFi", "Parking", "Gym", "Security", "Backup Generator"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '28 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 21
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '1 Bedroom Spacious Apartment in Airport Residential', 'This is a highly sought-after 1 bedroom spacious apartment in airport residential. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Kasoa.', 'APARTMENT', 'Central', 'Kasoa', 'Airport Residential',
    2203, 1, 1, '["Gym", "Pool", "Air Conditioning", "Backup Generator", "Parking"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '21 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 22
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Luxurious Single Room in Dansoman', 'This is a highly sought-after luxurious single room in dansoman. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Tarkwa.', 'SINGLE_ROOM', 'Western', 'Tarkwa', 'Dansoman',
    6176, 1, 0, '["WiFi", "Backup Generator", "Air Conditioning"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '4 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 23
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '5 Bedroom Luxurious House in Cape Coast', 'This is a highly sought-after 5 bedroom luxurious house in cape coast. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Cape Coast.', 'HOUSE', 'Central', 'Cape Coast', 'Airport Residential',
    3715, 2, 2, '["Backup Generator", "Water Tank", "Pool", "Balcony"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '27 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 24
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '3 Bedroom Beautiful House in Takoradi', 'This is a highly sought-after 3 bedroom beautiful house in takoradi. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Takoradi.', 'HOUSE', 'Western', 'Takoradi', 'Cantonments',
    15916, 1, 1, '["Air Conditioning", "Water Tank", "Pool"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '14 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 25
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '5 Bedroom Affordable House in Takoradi', 'This is a highly sought-after 5 bedroom affordable house in takoradi. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Takoradi.', 'HOUSE', 'Western', 'Takoradi', 'Dansoman',
    7606, 1, 1, '["Security", "Balcony", "Parking", "WiFi", "Air Conditioning"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '10 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 26
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Beautiful Self-Contained in Airport Residential', 'This is a highly sought-after beautiful self-contained in airport residential. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Obuasi.', 'SELF_CONTAINED', 'Ashanti', 'Obuasi', 'Airport Residential',
    1623, 1, 1, '["Backup Generator", "Gym", "Pool", "Parking", "WiFi"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '24 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 27
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '3 Bedroom Stunning House in Takoradi', 'This is a highly sought-after 3 bedroom stunning house in takoradi. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Takoradi.', 'HOUSE', 'Western', 'Takoradi', 'Airport Residential',
    17762, 5, 2, '["WiFi", "Balcony", "Air Conditioning", "Security", "Backup Generator"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '13 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 28
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '1 Bedroom Stunning Apartment in East Legon', 'This is a highly sought-after 1 bedroom stunning apartment in east legon. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Tarkwa.', 'APARTMENT', 'Western', 'Tarkwa', 'East Legon',
    23860, 1, 1, '["Gym", "Air Conditioning", "Balcony", "WiFi"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '4 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 29
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '5 Bedroom Stunning House in Obuasi', 'This is a highly sought-after 5 bedroom stunning house in obuasi. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Obuasi.', 'HOUSE', 'Ashanti', 'Obuasi', 'East Legon',
    21766, 2, 1, '["Gym", "Pool", "Security"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '9 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 30
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Cozy Self-Contained in Cantonments', 'This is a highly sought-after cozy self-contained in cantonments. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Tarkwa.', 'SELF_CONTAINED', 'Western', 'Tarkwa', 'Cantonments',
    6591, 1, 1, '["WiFi", "Security", "Balcony", "Air Conditioning"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '10 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 31
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '1 Bedroom Luxurious Apartment in Airport Residential', 'This is a highly sought-after 1 bedroom luxurious apartment in airport residential. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Kumasi.', 'APARTMENT', 'Ashanti', 'Kumasi', 'Airport Residential',
    11758, 3, 3, '["Backup Generator", "Security"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '5 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb65?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 32
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '3 Bedroom Modern Apartment in East Legon', 'This is a highly sought-after 3 bedroom modern apartment in east legon. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Tarkwa.', 'APARTMENT', 'Western', 'Tarkwa', 'East Legon',
    3516, 4, 4, '["Balcony", "Gym"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '25 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 33
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Modern Single Room in Airport Residential', 'This is a highly sought-after modern single room in airport residential. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Obuasi.', 'SINGLE_ROOM', 'Ashanti', 'Obuasi', 'Airport Residential',
    7729, 1, 0, '["Gym", "Backup Generator"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '22 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 34
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '5 Bedroom Cozy House in Cape Coast', 'This is a highly sought-after 5 bedroom cozy house in cape coast. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Cape Coast.', 'HOUSE', 'Central', 'Cape Coast', 'Dansoman',
    21627, 2, 2, '["Water Tank", "Balcony", "Air Conditioning", "Pool", "Gym"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '21 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 35
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Newly Renovated Self-Contained in Cantonments', 'This is a highly sought-after newly renovated self-contained in cantonments. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Tarkwa.', 'SELF_CONTAINED', 'Western', 'Tarkwa', 'Cantonments',
    3132, 1, 1, '["Backup Generator", "WiFi", "Air Conditioning"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '16 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 36
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Elegant Single Room in East Legon', 'This is a highly sought-after elegant single room in east legon. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Accra.', 'SINGLE_ROOM', 'Greater Accra', 'Accra', 'East Legon',
    6537, 1, 0, '["Pool", "Air Conditioning", "WiFi", "Gym"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '26 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 37
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '3 Bedroom Beautiful Apartment in Osu', 'This is a highly sought-after 3 bedroom beautiful apartment in osu. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Accra.', 'APARTMENT', 'Greater Accra', 'Accra', 'Osu',
    3629, 5, 5, '["Pool", "Security"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '17 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 38
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Stunning Single Room in Osu', 'This is a highly sought-after stunning single room in osu. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Tarkwa.', 'SINGLE_ROOM', 'Western', 'Tarkwa', 'Osu',
    12667, 1, 0, '["Backup Generator", "WiFi", "Air Conditioning"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '30 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 39
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Newly Renovated Single Room in Dansoman', 'This is a highly sought-after newly renovated single room in dansoman. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Kumasi.', 'SINGLE_ROOM', 'Ashanti', 'Kumasi', 'Dansoman',
    10336, 1, 0, '["WiFi", "Gym"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '21 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 40
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '4 Bedroom Modern House in Cape Coast', 'This is a highly sought-after 4 bedroom modern house in cape coast. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Cape Coast.', 'HOUSE', 'Central', 'Cape Coast', 'East Legon',
    24149, 1, 1, '["Balcony", "Water Tank"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '6 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb65?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 41
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Luxurious Self-Contained in Cantonments', 'This is a highly sought-after luxurious self-contained in cantonments. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Tarkwa.', 'SELF_CONTAINED', 'Western', 'Tarkwa', 'Cantonments',
    10949, 1, 1, '["Security", "Water Tank", "Gym"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '29 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 42
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Cozy Self-Contained in Osu', 'This is a highly sought-after cozy self-contained in osu. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Accra.', 'SELF_CONTAINED', 'Greater Accra', 'Accra', 'Osu',
    13708, 1, 1, '["Balcony", "Pool", "Air Conditioning", "Security", "Water Tank", "WiFi"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '8 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 43
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Luxurious Self-Contained in Ridge', 'This is a highly sought-after luxurious self-contained in ridge. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Cape Coast.', 'SELF_CONTAINED', 'Central', 'Cape Coast', 'Ridge',
    10074, 1, 1, '["Parking", "Water Tank", "Pool"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '17 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 44
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Cozy Self-Contained in Spintex', 'This is a highly sought-after cozy self-contained in spintex. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Tarkwa.', 'SELF_CONTAINED', 'Western', 'Tarkwa', 'Spintex',
    22498, 1, 1, '["Water Tank", "Gym", "Air Conditioning", "Security", "WiFi"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '19 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 45
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Newly Renovated Single Room in Airport Residential', 'This is a highly sought-after newly renovated single room in airport residential. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Accra.', 'SINGLE_ROOM', 'Greater Accra', 'Accra', 'Airport Residential',
    17006, 1, 0, '["WiFi", "Backup Generator", "Pool"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '16 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 46
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Luxurious Single Room in Dansoman', 'This is a highly sought-after luxurious single room in dansoman. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Madina.', 'SINGLE_ROOM', 'Greater Accra', 'Madina', 'Dansoman',
    13702, 1, 0, '["Gym", "Pool"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '8 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 47
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '5 Bedroom Modern House in Kasoa', 'This is a highly sought-after 5 bedroom modern house in kasoa. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Kasoa.', 'HOUSE', 'Central', 'Kasoa', 'Spintex',
    4333, 3, 1, '["Backup Generator", "Pool"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '21 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 48
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Luxurious Self-Contained in Osu', 'This is a highly sought-after luxurious self-contained in osu. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Madina.', 'SELF_CONTAINED', 'Greater Accra', 'Madina', 'Osu',
    17022, 1, 1, '["Water Tank", "WiFi", "Parking", "Air Conditioning", "Balcony"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '14 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 49
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '3 Bedroom Stunning Apartment in East Legon', 'This is a highly sought-after 3 bedroom stunning apartment in east legon. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Obuasi.', 'APARTMENT', 'Ashanti', 'Obuasi', 'East Legon',
    19412, 3, 1, '["Gym", "Parking"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '29 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb65?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 50
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Luxurious Single Room in Airport Residential', 'This is a highly sought-after luxurious single room in airport residential. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Cape Coast.', 'SINGLE_ROOM', 'Central', 'Cape Coast', 'Airport Residential',
    14791, 1, 0, '["Security", "Parking", "Gym", "Water Tank", "Pool"]'::jsonb, true, 'AVAILABLE', NOW() - INTERVAL '16 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 2);

END $$;
