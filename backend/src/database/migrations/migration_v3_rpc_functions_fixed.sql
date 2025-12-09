-- Fonction simplifiée pour récupérer les prestataires proches
-- Compatible avec la structure actuelle de la table therapists

DROP FUNCTION IF EXISTS get_nearby_therapists(double precision, double precision, integer, integer, integer);

CREATE OR REPLACE FUNCTION get_nearby_therapists(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 50000,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  business_name TEXT,
  bio_fr TEXT,
  bio_en TEXT,
  rating DECIMAL,
  review_count INTEGER,
  distance_meters DOUBLE PRECISION,
  profile_image TEXT,
  city TEXT,
  is_mobile BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Vérifier si la colonne location existe (PostGIS)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'therapists' AND column_name = 'location'
  ) THEN
    -- Si PostGIS est configuré
    RETURN QUERY
    SELECT
      t.id,
      t.user_id,
      COALESCE(t.business_name, '') as business_name,
      COALESCE(t.bio_fr, '') as bio_fr,
      COALESCE(t.bio_en, '') as bio_en,
      COALESCE(t.rating, 0) as rating,
      COALESCE(t.review_count, 0) as review_count,
      ST_Distance(
        t.location,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
      ) as distance_meters,
      t.profile_image,
      COALESCE(t.city, '') as city,
      COALESCE(t.is_mobile, false) as is_mobile
    FROM therapists t
    WHERE t.is_active = true
      AND t.location IS NOT NULL
      AND ST_DWithin(
        t.location,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
        radius_meters
      )
    ORDER BY distance_meters ASC
    LIMIT limit_count
    OFFSET offset_count;
  ELSE
    -- Fallback si PostGIS n'est pas encore configuré
    RETURN QUERY
    SELECT
      t.id,
      t.user_id,
      COALESCE(t.business_name, '') as business_name,
      COALESCE(t.bio_fr, '') as bio_fr,
      COALESCE(t.bio_en, '') as bio_en,
      COALESCE(t.rating, 0) as rating,
      COALESCE(t.review_count, 0) as review_count,
      0::DOUBLE PRECISION as distance_meters,
      t.profile_image,
      COALESCE(t.city, '') as city,
      COALESCE(t.is_mobile, false) as is_mobile
    FROM therapists t
    WHERE t.is_active = true
    LIMIT limit_count
    OFFSET offset_count;
  END IF;
END;
$$;
