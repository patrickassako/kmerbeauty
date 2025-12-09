-- Function to get nearby therapists
-- Usage: SELECT * FROM get_nearby_therapists(lat, lng, radius_meters, limit_count, offset_count)

CREATE OR REPLACE FUNCTION get_nearby_therapists(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 50000, -- 50km default
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  business_name TEXT,
  bio_fr TEXT,
  bio_en TEXT,
  experience INTEGER,
  is_licensed BOOLEAN,
  is_mobile BOOLEAN,
  travel_radius INTEGER,
  travel_fee DECIMAL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  city TEXT,
  region TEXT,
  country TEXT,
  profile_image TEXT,
  rating DECIMAL,
  review_count INTEGER,
  is_active BOOLEAN,
  distance_meters DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.user_id,
    t.business_name,
    t.bio_fr,
    t.bio_en,
    t.experience,
    t.is_licensed,
    t.is_mobile,
    t.travel_radius,
    t.travel_fee,
    t.latitude,
    t.longitude,
    t.city,
    t.region,
    t.country,
    t.profile_image,
    t.rating,
    t.review_count,
    t.is_active,
    ST_Distance(
      t.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) as distance_meters
  FROM
    therapists t
  WHERE
    t.is_active = true
    AND ST_DWithin(
      t.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_meters
    )
  ORDER BY
    distance_meters ASC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;
