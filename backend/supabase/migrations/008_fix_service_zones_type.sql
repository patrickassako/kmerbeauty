-- Migration: Fix service_zones to accept both string arrays and location objects
-- Description: Makes service_zones more flexible to accept either simple neighborhood names or detailed location objects

-- service_zones can now be either:
-- 1. Array of strings: ["Akwa", "Bonanjo", "Deido"]
-- 2. Array of location objects: [{"location": {"lat": 4.05, "lng": 9.7, "address": "Akwa"}, "radius": 10}]

COMMENT ON COLUMN contractor_profiles.service_zones IS 'Service zones - can be array of neighborhood names (strings) or array of location objects with coordinates';
