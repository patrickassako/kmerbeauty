-- VERSION 9: FIX FILTERING LOGIC FOR PROVIDERS DISPLAY
-- Corrects the WHERE clause to ensure results are returned even when:
-- 1. client_city is provided but no matching providers in that city
-- 2. Coordinates are not available
-- This ensures providers from nearby cities or nationwide are still shown as fallback

DROP FUNCTION IF EXISTS get_nearby_providers(double precision, double precision, integer, text, text, uuid);

CREATE OR REPLACE FUNCTION get_nearby_providers(
  lat DOUBLE PRECISION DEFAULT NULL,
  lng DOUBLE PRECISION DEFAULT NULL,
  radius_meters INTEGER DEFAULT 30000,
  client_city TEXT DEFAULT NULL,
  client_district TEXT DEFAULT NULL,
  filter_service_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  type TEXT, -- 'therapist' or 'salon'
  name VARCHAR,
  bio TEXT,
  rating NUMERIC,
  review_count INTEGER,
  distance_meters DOUBLE PRECISION,
  image TEXT,
  city VARCHAR,
  is_mobile BOOLEAN,
  is_active BOOLEAN,
  latitude NUMERIC,
  longitude NUMERIC,
  service_price NUMERIC,
  match_type TEXT,
  match_score INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  has_postgis_therapists BOOLEAN;
  has_postgis_salons BOOLEAN;
  has_coordinates BOOLEAN;
BEGIN
  -- Vérifications PostGIS
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapists' AND column_name = 'location') INTO has_postgis_therapists;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salons' AND column_name = 'location') INTO has_postgis_salons;
  
  has_coordinates := (lat IS NOT NULL AND lng IS NOT NULL);

  RETURN QUERY
  WITH 
  -- 1. THERAPISTS MATCHES
  therapist_matches AS (
    SELECT DISTINCT ON (t.id)
      t.id as candidate_id,
      'therapist'::TEXT as candidate_type,
      COALESCE(t.business_name, TRIM(CONCAT(u.first_name, ' ', u.last_name))) as candidate_name,
      COALESCE(t.bio_fr, t.bio_en) as candidate_bio,
      t.rating as candidate_rating,
      t.review_count as candidate_review_count,
      COALESCE(t.profile_image, (t.portfolio_images)[1], u.avatar) as candidate_image,
      COALESCE(s.city, t.city) as candidate_city,
      t.is_mobile as candidate_is_mobile,
      t.is_active as candidate_is_active,
      COALESCE(s.latitude, t.latitude) as candidate_latitude,
      COALESCE(s.longitude, t.longitude) as candidate_longitude,
      ts.price as candidate_service_price,
      COALESCE(t.service_zones, '[]'::jsonb) as candidate_service_zones,
      s.id as salon_id,
      s.quarter as salon_quarter,
      s.location as salon_location,
      t.location as therapist_location
    FROM therapists t
    JOIN users u ON t.user_id = u.id
    LEFT JOIN salons s ON t.salon_id = s.id
    JOIN therapist_services ts ON t.id = ts.therapist_id
    WHERE t.is_active = true
      AND (t.is_online IS TRUE OR t.is_online IS NULL) -- Respect is_online
      AND ts.is_active = true
      AND (filter_service_id IS NULL OR ts.service_id = filter_service_id)
    ORDER BY t.id, ts.price ASC
  ),
  
  -- 2. SALONS MATCHES
  salon_matches AS (
    SELECT DISTINCT ON (s.id)
      s.id as candidate_id,
      'salon'::TEXT as candidate_type,
      COALESCE(s.name_fr, s.name_en) as candidate_name,
      COALESCE(s.description_fr, s.description_en) as candidate_bio,
      s.rating as candidate_rating,
      s.review_count as candidate_review_count,
      COALESCE(s.logo, s.cover_image) as candidate_image,
      s.city as candidate_city,
      false as candidate_is_mobile,
      s.is_active as candidate_is_active,
      s.latitude as candidate_latitude,
      s.longitude as candidate_longitude,
      ss.price as candidate_service_price,
      '[]'::jsonb as candidate_service_zones,
      s.id as salon_id_ref,
      s.quarter as salon_quarter,
      s.location as salon_location,
      NULL::geometry as therapist_location
    FROM salons s
    JOIN salon_services ss ON s.id = ss.salon_id
    WHERE s.is_active = true
      AND ss.is_active = true
      AND (filter_service_id IS NULL OR ss.service_id = filter_service_id)
    ORDER BY s.id, ss.price ASC
  ),

  -- 3. COMBINE & CALCULATE SCORES
  all_candidates AS (
    SELECT * FROM therapist_matches
    UNION ALL
    SELECT * FROM salon_matches
  ),
  
  scored_candidates AS (
    SELECT
      c.*,
      -- Distance Calculation
      CASE
        WHEN has_coordinates THEN
          CASE
            WHEN c.candidate_type = 'therapist' AND c.salon_id IS NOT NULL AND has_postgis_salons AND c.salon_location IS NOT NULL THEN
              ST_Distance(c.salon_location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography)
            WHEN c.candidate_type = 'therapist' AND has_postgis_therapists AND c.therapist_location IS NOT NULL THEN
              ST_Distance(c.therapist_location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography)
            WHEN c.candidate_type = 'salon' AND has_postgis_salons AND c.salon_location IS NOT NULL THEN
              ST_Distance(c.salon_location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography)
            WHEN c.candidate_latitude IS NOT NULL AND c.candidate_longitude IS NOT NULL THEN
               (6371000 * acos(LEAST(1.0, GREATEST(-1.0, 
                  cos(radians(lat)) * cos(radians(c.candidate_latitude::float)) * 
                  cos(radians(c.candidate_longitude::float) - radians(lng)) + 
                  sin(radians(lat)) * sin(radians(c.candidate_latitude::float))
                ))))::DOUBLE PRECISION
            ELSE 999999::DOUBLE PRECISION
          END
        ELSE 999999::DOUBLE PRECISION
      END as dist,

      -- Match Score Calculation
      (
        -- 1. MATCH QUARTIER (30 pts)
        CASE 
          WHEN c.candidate_is_mobile IS TRUE AND client_district IS NOT NULL 
               AND c.candidate_service_zones @> jsonb_build_array(jsonb_build_object('city', client_city, 'district', client_district)) THEN 30
          WHEN c.salon_quarter IS NOT NULL AND client_district IS NOT NULL AND c.salon_quarter ILIKE client_district THEN 30
          ELSE 0
        END
        +
        -- 2. MATCH VILLE (20 pts)
        CASE
          WHEN c.candidate_is_mobile IS TRUE AND client_city IS NOT NULL 
               AND EXISTS (SELECT 1 FROM jsonb_array_elements(c.candidate_service_zones) z WHERE z->>'city' ILIKE client_city) THEN 20
          WHEN c.candidate_city IS NOT NULL AND client_city IS NOT NULL AND c.candidate_city ILIKE client_city THEN 20
          ELSE 0
        END
      ) as base_score
    FROM all_candidates c
  )

  SELECT
    candidate_id as id,
    candidate_type as type,
    candidate_name as name,
    candidate_bio as bio,
    candidate_rating as rating,
    candidate_review_count as review_count,
    dist as distance_meters,
    candidate_image as image,
    candidate_city as city,
    candidate_is_mobile as is_mobile,
    candidate_is_active as is_active,
    candidate_latitude::numeric as latitude,
    candidate_longitude::numeric as longitude,
    candidate_service_price::numeric as service_price,
    CASE
      WHEN base_score >= 30 THEN 'district_match'
      WHEN base_score >= 20 THEN 'city_match'
      ELSE 'proximity_or_fallback'
    END::text as match_type,
    (
      base_score +
      CASE
        WHEN dist < 2000 THEN 10
        WHEN dist < 5000 THEN 5
        WHEN dist < 10000 THEN 2
        ELSE 0
      END
    )::INTEGER as match_score
  FROM scored_candidates
  -- FIXED FILTERING LOGIC: Always return all matching providers for the service
  -- Priority is handled via ORDER BY, not exclusion
  -- This ensures at least some results are always shown
  ORDER BY
    base_score DESC,        -- Prioritize local matches first
    dist ASC,               -- Then by proximity
    rating DESC NULLS LAST  -- Then by rating
  LIMIT 50;
END;
$$;

COMMENT ON FUNCTION get_nearby_providers IS 'Recherche unifiée (Thérapeutes + Salons) par Service ID - V9 avec logique de fallback améliorée';
