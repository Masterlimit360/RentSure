
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
    new_prop_id, target_user_id, '3 Bedroom Stunning Apartment in Dzorwulu', 'This is a highly sought-after 3 bedroom stunning apartment in dzorwulu. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Cape Coast.', 'APARTMENT', 'Central', 'Cape Coast', 'Dzorwulu',
    7251, 5, 5, ARRAY['Security', 'WiFi', 'Gym', 'Pool', 'Backup Generator'], true, 'AVAILABLE', NOW() - INTERVAL '3 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 2
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '3 Bedroom Stunning Apartment in Dzorwulu', 'This is a highly sought-after 3 bedroom stunning apartment in dzorwulu. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Takoradi.', 'APARTMENT', 'Western', 'Takoradi', 'Dzorwulu',
    5733, 4, 4, ARRAY['WiFi', 'Security', 'Air Conditioning', 'Pool'], true, 'AVAILABLE', NOW() - INTERVAL '26 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 3
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Modern Self-Contained in Dzorwulu', 'This is a highly sought-after modern self-contained in dzorwulu. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Kumasi.', 'SELF_CONTAINED', 'Ashanti', 'Kumasi', 'Dzorwulu',
    4369, 1, 1, ARRAY['WiFi', 'Air Conditioning', 'Backup Generator', 'Water Tank', 'Security'], true, 'AVAILABLE', NOW() - INTERVAL '16 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 4
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '5 Bedroom Affordable House in Madina', 'This is a highly sought-after 5 bedroom affordable house in madina. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Madina.', 'HOUSE', 'Greater Accra', 'Madina', 'Osu',
    11942, 2, 2, ARRAY['WiFi', 'Water Tank', 'Air Conditioning', 'Pool', 'Backup Generator'], true, 'AVAILABLE', NOW() - INTERVAL '21 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 5
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Modern Self-Contained in Ridge', 'This is a highly sought-after modern self-contained in ridge. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Kasoa.', 'SELF_CONTAINED', 'Central', 'Kasoa', 'Ridge',
    12640, 1, 1, ARRAY['Air Conditioning', 'WiFi', 'Security', 'Parking', 'Balcony', 'Water Tank'], true, 'AVAILABLE', NOW() - INTERVAL '26 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 6
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '1 Bedroom Modern Apartment in Cantonments', 'This is a highly sought-after 1 bedroom modern apartment in cantonments. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Obuasi.', 'APARTMENT', 'Ashanti', 'Obuasi', 'Cantonments',
    2901, 2, 2, ARRAY['Water Tank', 'Backup Generator', 'WiFi', 'Air Conditioning'], true, 'AVAILABLE', NOW() - INTERVAL '7 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 7
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Prime Single Room in Cantonments', 'This is a highly sought-after prime single room in cantonments. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Takoradi.', 'SINGLE_ROOM', 'Western', 'Takoradi', 'Cantonments',
    5816, 1, 0, ARRAY['Pool', 'Air Conditioning', 'Security', 'WiFi'], true, 'AVAILABLE', NOW() - INTERVAL '6 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 8
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '2 Bedroom Spacious Apartment in Dansoman', 'This is a highly sought-after 2 bedroom spacious apartment in dansoman. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Cape Coast.', 'APARTMENT', 'Central', 'Cape Coast', 'Dansoman',
    13199, 3, 2, ARRAY['Water Tank', 'Security', 'Backup Generator', 'Parking', 'Pool'], true, 'AVAILABLE', NOW() - INTERVAL '20 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 9
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Affordable Single Room in Osu', 'This is a highly sought-after affordable single room in osu. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Madina.', 'SINGLE_ROOM', 'Greater Accra', 'Madina', 'Osu',
    6643, 1, 0, ARRAY['Water Tank', 'Security', 'WiFi', 'Parking', 'Air Conditioning', 'Pool'], true, 'AVAILABLE', NOW() - INTERVAL '27 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 10
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '4 Bedroom Cozy House in Kumasi', 'This is a highly sought-after 4 bedroom cozy house in kumasi. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Kumasi.', 'HOUSE', 'Ashanti', 'Kumasi', 'Dzorwulu',
    21991, 4, 1, ARRAY['Parking', 'WiFi', 'Air Conditioning'], true, 'AVAILABLE', NOW() - INTERVAL '3 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 11
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '2 Bedroom Elegant Apartment in East Legon', 'This is a highly sought-after 2 bedroom elegant apartment in east legon. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Obuasi.', 'APARTMENT', 'Ashanti', 'Obuasi', 'East Legon',
    18862, 1, 1, ARRAY['Air Conditioning', 'Gym', 'WiFi'], true, 'AVAILABLE', NOW() - INTERVAL '1 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 12
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '3 Bedroom Stunning House in Kumasi', 'This is a highly sought-after 3 bedroom stunning house in kumasi. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Kumasi.', 'HOUSE', 'Ashanti', 'Kumasi', 'Dzorwulu',
    15804, 4, 4, ARRAY['Parking', 'Gym', 'Pool', 'Air Conditioning'], true, 'AVAILABLE', NOW() - INTERVAL '22 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 13
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '3 Bedroom Luxurious Apartment in East Legon', 'This is a highly sought-after 3 bedroom luxurious apartment in east legon. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Tema.', 'APARTMENT', 'Greater Accra', 'Tema', 'East Legon',
    21977, 3, 3, ARRAY['WiFi', 'Air Conditioning', 'Water Tank', 'Pool', 'Gym'], true, 'AVAILABLE', NOW() - INTERVAL '10 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 14
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Cozy Self-Contained in Osu', 'This is a highly sought-after cozy self-contained in osu. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Kasoa.', 'SELF_CONTAINED', 'Central', 'Kasoa', 'Osu',
    4409, 1, 1, ARRAY['Security', 'Parking', 'WiFi', 'Balcony'], true, 'AVAILABLE', NOW() - INTERVAL '7 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 15
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Affordable Self-Contained in Spintex', 'This is a highly sought-after affordable self-contained in spintex. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Kasoa.', 'SELF_CONTAINED', 'Central', 'Kasoa', 'Spintex',
    12950, 1, 1, ARRAY['Water Tank', 'Security', 'WiFi', 'Pool'], true, 'AVAILABLE', NOW() - INTERVAL '22 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 16
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '4 Bedroom Cozy House in Obuasi', 'This is a highly sought-after 4 bedroom cozy house in obuasi. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Obuasi.', 'HOUSE', 'Ashanti', 'Obuasi', 'Airport Residential',
    3400, 4, 4, ARRAY['Balcony', 'Water Tank'], true, 'AVAILABLE', NOW() - INTERVAL '11 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb65?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 17
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '3 Bedroom Modern House in Accra', 'This is a highly sought-after 3 bedroom modern house in accra. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Accra.', 'HOUSE', 'Greater Accra', 'Accra', 'Dansoman',
    18354, 3, 2, ARRAY['Backup Generator', 'Balcony', 'Water Tank', 'Pool', 'Gym'], true, 'AVAILABLE', NOW() - INTERVAL '2 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 18
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Modern Self-Contained in Dansoman', 'This is a highly sought-after modern self-contained in dansoman. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Obuasi.', 'SELF_CONTAINED', 'Ashanti', 'Obuasi', 'Dansoman',
    15174, 1, 1, ARRAY['Backup Generator', 'Pool', 'Water Tank'], true, 'AVAILABLE', NOW() - INTERVAL '17 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 19
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Spacious Self-Contained in Dansoman', 'This is a highly sought-after spacious self-contained in dansoman. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Kumasi.', 'SELF_CONTAINED', 'Ashanti', 'Kumasi', 'Dansoman',
    6734, 1, 1, ARRAY['WiFi', 'Air Conditioning'], true, 'AVAILABLE', NOW() - INTERVAL '18 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 20
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '2 Bedroom Affordable Apartment in Airport Residential', 'This is a highly sought-after 2 bedroom affordable apartment in airport residential. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Madina.', 'APARTMENT', 'Greater Accra', 'Madina', 'Airport Residential',
    17100, 2, 2, ARRAY['Gym', 'Water Tank', 'Security'], true, 'AVAILABLE', NOW() - INTERVAL '1 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 21
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Affordable Single Room in Ridge', 'This is a highly sought-after affordable single room in ridge. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Takoradi.', 'SINGLE_ROOM', 'Western', 'Takoradi', 'Ridge',
    14307, 1, 0, ARRAY['WiFi', 'Air Conditioning'], true, 'AVAILABLE', NOW() - INTERVAL '20 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 22
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '1 Bedroom Elegant Apartment in Airport Residential', 'This is a highly sought-after 1 bedroom elegant apartment in airport residential. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Obuasi.', 'APARTMENT', 'Ashanti', 'Obuasi', 'Airport Residential',
    2441, 2, 2, ARRAY['Balcony', 'Security', 'WiFi'], true, 'AVAILABLE', NOW() - INTERVAL '2 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 23
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '5 Bedroom Beautiful House in Takoradi', 'This is a highly sought-after 5 bedroom beautiful house in takoradi. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Takoradi.', 'HOUSE', 'Western', 'Takoradi', 'Spintex',
    20167, 4, 3, ARRAY['Parking', 'WiFi', 'Water Tank', 'Air Conditioning', 'Backup Generator'], true, 'AVAILABLE', NOW() - INTERVAL '18 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 24
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Prime Single Room in Ridge', 'This is a highly sought-after prime single room in ridge. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Accra.', 'SINGLE_ROOM', 'Greater Accra', 'Accra', 'Ridge',
    5105, 1, 0, ARRAY['Gym', 'WiFi', 'Security', 'Parking', 'Air Conditioning', 'Water Tank'], true, 'AVAILABLE', NOW() - INTERVAL '2 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 25
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '2 Bedroom Prime Apartment in Cantonments', 'This is a highly sought-after 2 bedroom prime apartment in cantonments. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Kumasi.', 'APARTMENT', 'Ashanti', 'Kumasi', 'Cantonments',
    10689, 4, 3, ARRAY['Security', 'Balcony', 'Pool'], true, 'AVAILABLE', NOW() - INTERVAL '21 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 26
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '3 Bedroom Beautiful House in Kumasi', 'This is a highly sought-after 3 bedroom beautiful house in kumasi. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Kumasi.', 'HOUSE', 'Ashanti', 'Kumasi', 'Osu',
    3149, 1, 1, ARRAY['Security', 'WiFi', 'Balcony', 'Air Conditioning', 'Water Tank', 'Pool'], true, 'AVAILABLE', NOW() - INTERVAL '4 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 27
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '2 Bedroom Elegant Apartment in Osu', 'This is a highly sought-after 2 bedroom elegant apartment in osu. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Cape Coast.', 'APARTMENT', 'Central', 'Cape Coast', 'Osu',
    19975, 2, 2, ARRAY['Water Tank', 'WiFi', 'Air Conditioning'], true, 'AVAILABLE', NOW() - INTERVAL '3 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 28
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Prime Single Room in Airport Residential', 'This is a highly sought-after prime single room in airport residential. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Obuasi.', 'SINGLE_ROOM', 'Ashanti', 'Obuasi', 'Airport Residential',
    22590, 1, 0, ARRAY['Pool', 'Water Tank', 'WiFi'], true, 'AVAILABLE', NOW() - INTERVAL '4 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 29
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '2 Bedroom Elegant Apartment in Dansoman', 'This is a highly sought-after 2 bedroom elegant apartment in dansoman. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Obuasi.', 'APARTMENT', 'Ashanti', 'Obuasi', 'Dansoman',
    24359, 2, 2, ARRAY['Balcony', 'Backup Generator', 'Pool', 'Security'], true, 'AVAILABLE', NOW() - INTERVAL '4 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 30
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '2 Bedroom Modern Apartment in Dzorwulu', 'This is a highly sought-after 2 bedroom modern apartment in dzorwulu. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Accra.', 'APARTMENT', 'Greater Accra', 'Accra', 'Dzorwulu',
    11161, 3, 3, ARRAY['Gym', 'Backup Generator', 'Balcony', 'Pool'], true, 'AVAILABLE', NOW() - INTERVAL '21 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 31
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Beautiful Self-Contained in Dansoman', 'This is a highly sought-after beautiful self-contained in dansoman. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Kumasi.', 'SELF_CONTAINED', 'Ashanti', 'Kumasi', 'Dansoman',
    9732, 1, 1, ARRAY['Gym', 'WiFi', 'Water Tank', 'Pool'], true, 'AVAILABLE', NOW() - INTERVAL '2 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 32
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Cozy Single Room in Osu', 'This is a highly sought-after cozy single room in osu. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Takoradi.', 'SINGLE_ROOM', 'Western', 'Takoradi', 'Osu',
    23246, 1, 0, ARRAY['WiFi', 'Pool', 'Security', 'Parking', 'Water Tank'], true, 'AVAILABLE', NOW() - INTERVAL '16 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 33
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Stunning Self-Contained in Airport Residential', 'This is a highly sought-after stunning self-contained in airport residential. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Kumasi.', 'SELF_CONTAINED', 'Ashanti', 'Kumasi', 'Airport Residential',
    10562, 1, 1, ARRAY['WiFi', 'Backup Generator', 'Balcony'], true, 'AVAILABLE', NOW() - INTERVAL '18 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 34
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '3 Bedroom Beautiful Apartment in Spintex', 'This is a highly sought-after 3 bedroom beautiful apartment in spintex. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Kasoa.', 'APARTMENT', 'Central', 'Kasoa', 'Spintex',
    11979, 1, 1, ARRAY['Security', 'Pool'], true, 'AVAILABLE', NOW() - INTERVAL '29 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb65?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 35
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '2 Bedroom Cozy Apartment in Ridge', 'This is a highly sought-after 2 bedroom cozy apartment in ridge. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Madina.', 'APARTMENT', 'Greater Accra', 'Madina', 'Ridge',
    6968, 4, 4, ARRAY['Security', 'Water Tank'], true, 'AVAILABLE', NOW() - INTERVAL '15 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 36
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Spacious Single Room in Ridge', 'This is a highly sought-after spacious single room in ridge. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Takoradi.', 'SINGLE_ROOM', 'Western', 'Takoradi', 'Ridge',
    22263, 1, 0, ARRAY['Gym', 'Parking', 'Water Tank', 'Security', 'Pool'], true, 'AVAILABLE', NOW() - INTERVAL '12 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb65?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 37
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Newly Renovated Self-Contained in East Legon', 'This is a highly sought-after newly renovated self-contained in east legon. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Tarkwa.', 'SELF_CONTAINED', 'Western', 'Tarkwa', 'East Legon',
    17900, 1, 1, ARRAY['Gym', 'Pool', 'Security', 'Air Conditioning', 'Balcony'], true, 'AVAILABLE', NOW() - INTERVAL '9 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 38
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Spacious Self-Contained in Spintex', 'This is a highly sought-after spacious self-contained in spintex. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Kumasi.', 'SELF_CONTAINED', 'Ashanti', 'Kumasi', 'Spintex',
    12162, 1, 1, ARRAY['Gym', 'Security', 'Pool'], true, 'AVAILABLE', NOW() - INTERVAL '18 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 39
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Newly Renovated Single Room in Ridge', 'This is a highly sought-after newly renovated single room in ridge. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Obuasi.', 'SINGLE_ROOM', 'Ashanti', 'Obuasi', 'Ridge',
    19140, 1, 0, ARRAY['Water Tank', 'WiFi', 'Air Conditioning', 'Backup Generator', 'Balcony'], true, 'AVAILABLE', NOW() - INTERVAL '13 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 40
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Spacious Self-Contained in East Legon', 'This is a highly sought-after spacious self-contained in east legon. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Cape Coast.', 'SELF_CONTAINED', 'Central', 'Cape Coast', 'East Legon',
    10374, 1, 1, ARRAY['WiFi', 'Gym', 'Air Conditioning'], true, 'AVAILABLE', NOW() - INTERVAL '14 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 41
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Modern Self-Contained in Osu', 'This is a highly sought-after modern self-contained in osu. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Takoradi.', 'SELF_CONTAINED', 'Western', 'Takoradi', 'Osu',
    12749, 1, 1, ARRAY['Air Conditioning', 'Parking', 'WiFi'], true, 'AVAILABLE', NOW() - INTERVAL '27 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 42
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Cozy Single Room in Ridge', 'This is a highly sought-after cozy single room in ridge. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Takoradi.', 'SINGLE_ROOM', 'Western', 'Takoradi', 'Ridge',
    23583, 1, 0, ARRAY['Pool', 'Gym', 'Air Conditioning', 'WiFi', 'Water Tank'], true, 'AVAILABLE', NOW() - INTERVAL '22 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb65?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 43
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Prime Single Room in Airport Residential', 'This is a highly sought-after prime single room in airport residential. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Obuasi.', 'SINGLE_ROOM', 'Ashanti', 'Obuasi', 'Airport Residential',
    13451, 1, 0, ARRAY['Water Tank', 'Backup Generator'], true, 'AVAILABLE', NOW() - INTERVAL '27 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 44
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '4 Bedroom Luxurious House in Obuasi', 'This is a highly sought-after 4 bedroom luxurious house in obuasi. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Obuasi.', 'HOUSE', 'Ashanti', 'Obuasi', 'Osu',
    9995, 2, 2, ARRAY['WiFi', 'Air Conditioning', 'Parking', 'Pool', 'Security'], true, 'AVAILABLE', NOW() - INTERVAL '8 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 45
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '3 Bedroom Prime Apartment in Cantonments', 'This is a highly sought-after 3 bedroom prime apartment in cantonments. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Accra.', 'APARTMENT', 'Greater Accra', 'Accra', 'Cantonments',
    7325, 4, 2, ARRAY['WiFi', 'Water Tank', 'Air Conditioning', 'Pool'], true, 'AVAILABLE', NOW() - INTERVAL '27 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 46
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Cozy Self-Contained in Ridge', 'This is a highly sought-after cozy self-contained in ridge. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Kumasi.', 'SELF_CONTAINED', 'Ashanti', 'Kumasi', 'Ridge',
    5380, 1, 1, ARRAY['Parking', 'Backup Generator', 'WiFi'], true, 'AVAILABLE', NOW() - INTERVAL '13 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 47
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Cozy Self-Contained in Cantonments', 'This is a highly sought-after cozy self-contained in cantonments. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Tema.', 'SELF_CONTAINED', 'Greater Accra', 'Tema', 'Cantonments',
    22932, 1, 1, ARRAY['WiFi', 'Air Conditioning', 'Security', 'Gym', 'Balcony'], true, 'AVAILABLE', NOW() - INTERVAL '17 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 48
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '2 Bedroom Beautiful Apartment in Spintex', 'This is a highly sought-after 2 bedroom beautiful apartment in spintex. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Tema.', 'APARTMENT', 'Greater Accra', 'Tema', 'Spintex',
    22309, 1, 1, ARRAY['Water Tank', 'Backup Generator'], true, 'AVAILABLE', NOW() - INTERVAL '25 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 49
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, 'Spacious Self-Contained in Ridge', 'This is a highly sought-after spacious self-contained in ridge. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Kasoa.', 'SELF_CONTAINED', 'Central', 'Kasoa', 'Ridge',
    12909, 1, 1, ARRAY['Air Conditioning', 'WiFi', 'Parking', 'Gym', 'Balcony', 'Water Tank'], true, 'AVAILABLE', NOW() - INTERVAL '11 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1505691938895-1758d7def51a?auto=format&fit=crop&w=800&q=80', 2);

  -- Listing 50
  new_prop_id := gen_random_uuid();
  
  INSERT INTO public.properties (
    id, landlord_id, title, description, property_type, region, city, area,
    price_per_year, bedrooms, bathrooms, amenities, is_verified, status, created_at
  ) VALUES (
    new_prop_id, target_user_id, '3 Bedroom Elegant House in Accra', 'This is a highly sought-after 3 bedroom elegant house in accra. It features excellent amenities, a great neighborhood, and easy access to local transportation. Perfect for anyone looking to live comfortably in Accra.', 'HOUSE', 'Greater Accra', 'Accra', 'Dzorwulu',
    23533, 1, 1, ARRAY['WiFi', 'Gym', 'Security', 'Air Conditioning', 'Parking'], true, 'AVAILABLE', NOW() - INTERVAL '9 days'
  );

  INSERT INTO public.property_media (property_id, media_type, url, sort_order)
  VALUES 
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', 0),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80', 1),
    (new_prop_id, 'PHOTO', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 2);

END $$;
