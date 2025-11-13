-- ============================================
-- KmerServices - Database Seed Script
-- ============================================
-- Ce script crée toutes les données de test pour l'application
-- Exécuter dans Supabase SQL Editor ou psql

-- IDs des utilisateurs existants (créés manuellement)
-- Client 1: 56811604-9372-479f-a3ee-35056e5812dd
-- Client 2: fcbfa0f5-eef4-45d7-821e-ac4117e50d0c
-- Provider Therapist 1: 62d8e317-e626-42c0-9dc2-982ba55539a4

-- Nettoyage (optionnel - décommenter si vous voulez recommencer à zéro)
-- DELETE FROM chat_messages;
-- DELETE FROM chats;
-- DELETE FROM booking_items;
-- DELETE FROM payments;
-- DELETE FROM bookings;
-- DELETE FROM reviews;
-- DELETE FROM favorites;
-- DELETE FROM availability;
-- DELETE FROM education;
-- DELETE FROM therapist_services;
-- DELETE FROM salon_services;
-- DELETE FROM services;
-- DELETE FROM therapists;
-- DELETE FROM salons;
-- DELETE FROM addresses;
-- DELETE FROM users;

-- ============================================
-- 1. CRÉER LES UTILISATEURS DANS LA TABLE USERS
-- ============================================

INSERT INTO users (id, email, phone, password, first_name, last_name, role, language, city, region, is_verified, is_active, created_at, updated_at)
VALUES
  -- Client 1
  ('56811604-9372-479f-a3ee-35056e5812dd', 'elyna.dessui@email.com', '+237699123456', '$2b$10$dummyHashedPassword123456789012345678901234567890', 'Elyna', 'Des Sui', 'CLIENT', 'FRENCH', 'Douala', 'Littoral', true, true, NOW(), NOW()),

  -- Client 2
  ('fcbfa0f5-eef4-45d7-821e-ac4117e50d0c', 'marie.dubois@email.com', '+237698765432', '$2b$10$dummyHashedPassword123456789012345678901234567890', 'Marie', 'Dubois', 'CLIENT', 'FRENCH', 'Yaoundé', 'Centre', true, true, NOW(), NOW()),

  -- Provider Therapist 1
  ('62d8e317-e626-42c0-9dc2-982ba55539a4', 'sophie.ndongo@email.com', '+237677111222', '$2b$10$dummyHashedPassword123456789012345678901234567890', 'Sophie', 'Ndongo', 'PROVIDER', 'FRENCH', 'Douala', 'Littoral', true, true, NOW(), NOW()),

  -- Provider Therapist 2
  ('a1b2c3d4-e5f6-4789-a012-3456789abcde', 'alice.tchoumi@email.com', '+237677333444', '$2b$10$dummyHashedPassword123456789012345678901234567890', 'Alice', 'Tchoumi', 'PROVIDER', 'FRENCH', 'Douala', 'Littoral', true, true, NOW(), NOW()),

  -- Provider Salon Owner
  ('f1e2d3c4-b5a6-4987-8012-fedcba987654', 'salon@beaumondeesthetique.cm', '+237677555666', '$2b$10$dummyHashedPassword123456789012345678901234567890', 'Sophie', 'Laurent', 'PROVIDER', 'FRENCH', 'Douala', 'Littoral', true, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. CRÉER LES ADRESSES
-- ============================================

INSERT INTO addresses (id, user_id, label, quarter, street, landmark, city, region, country, location, latitude, longitude, instructions, is_primary, created_at, updated_at)
VALUES
  -- Adresse 1 - Client 1 Domicile
  (gen_random_uuid(), '56811604-9372-479f-a3ee-35056e5812dd', 'Domicile', 'Akwa', 'Rue de la République', 'Près de la pharmacie du rond-point', 'Douala', 'Littoral', 'Cameroun', ST_GeomFromText('POINT(9.7679 4.0511)', 4326), 4.0511, 9.7679, 'Bâtiment bleu, 2ème étage', true, NOW(), NOW()),

  -- Adresse 2 - Client 1 Bureau
  (gen_random_uuid(), '56811604-9372-479f-a3ee-35056e5812dd', 'Bureau', 'Bonanjo', NULL, 'En face du marché central', 'Douala', 'Littoral', 'Cameroun', ST_GeomFromText('POINT(9.7042 4.0483)', 4326), 4.0483, 9.7042, NULL, false, NOW(), NOW()),

  -- Adresse 3 - Client 2 Domicile
  (gen_random_uuid(), 'fcbfa0f5-eef4-45d7-821e-ac4117e50d0c', 'Domicile', 'Bastos', NULL, 'Près de l''ambassade', 'Yaoundé', 'Centre', 'Cameroun', ST_GeomFromText('POINT(11.5167 3.8667)', 4326), 3.8667, 11.5167, NULL, true, NOW(), NOW());

-- ============================================
-- 3. CRÉER LES SERVICES
-- ============================================

INSERT INTO services (id, name_fr, name_en, description_fr, description_en, category, images, duration, base_price, purpose_fr, purpose_en, ideal_for_fr, ideal_for_en, created_at, updated_at)
VALUES
  -- Service 1: Deep Tissue Massage
  (
    'd1e2f3a4-b5c6-4d78-9e01-234567890abc',
    'Massage Deep Tissue',
    'Deep Tissue Massage',
    'Massage profond pour soulager les tensions musculaires',
    'Deep massage to relieve muscle tension',
    'WELLNESS_MASSAGE',
    ARRAY['https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800'],
    60,
    25000,
    'Soulager les douleurs musculaires profondes',
    'Relieve deep muscle pain',
    'Personnes souffrant de tensions chroniques',
    'People suffering from chronic tension',
    NOW(),
    NOW()
  ),

  -- Service 2: Swedish Massage
  (
    'e2f3a4b5-c6d7-4e89-0f12-34567890abcd',
    'Massage Suédois',
    'Swedish Massage',
    'Massage relaxant suédois classique',
    'Classic relaxing Swedish massage',
    'WELLNESS_MASSAGE',
    ARRAY['https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800'],
    45,
    20000,
    'Relaxation et bien-être général',
    'General relaxation and well-being',
    'Tous types de clients recherchant la détente',
    'All types of clients seeking relaxation',
    NOW(),
    NOW()
  ),

  -- Service 3: Hot Stone Therapy
  (
    'f3a4b5c6-d7e8-4f90-1234-567890abcdef',
    'Massage aux Pierres Chaudes',
    'Hot Stone Therapy',
    'Massage aux pierres chaudes',
    'Hot stone massage therapy',
    'WELLNESS_MASSAGE',
    ARRAY['https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800'],
    90,
    30000,
    'Relaxation profonde et amélioration de la circulation',
    'Deep relaxation and improved circulation',
    'Personnes recherchant une détente maximale',
    'People seeking maximum relaxation',
    NOW(),
    NOW()
  ),

  -- Service 4: Coupe de Cheveux Femme
  (
    'a4b5c6d7-e8f9-4012-3456-7890abcdef12',
    'Coupe de Cheveux Femme',
    'Women''s Haircut',
    'Coupe et brushing professionnel',
    'Professional cut and blow-dry',
    'HAIRDRESSING',
    ARRAY['https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800'],
    60,
    15000,
    NULL,
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
  ),

  -- Service 5: Manucure Complète
  (
    'b5c6d7e8-f901-4234-5678-90abcdef1234',
    'Manucure Complète',
    'Full Manicure',
    'Soins complets des ongles et des mains',
    'Complete nail and hand care',
    'NAIL_CARE',
    ARRAY['https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800'],
    45,
    12000,
    NULL,
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
  ),

  -- Service 6: Soin du Visage
  (
    'c6d7e8f9-0123-4456-7890-abcdef123456',
    'Soin du Visage',
    'Facial Treatment',
    'Nettoyage en profondeur et hydratation',
    'Deep cleansing and hydration',
    'FACIAL',
    ARRAY['https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800'],
    75,
    30000,
    NULL,
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
  ),

  -- Service 7: Maquillage Professionnel
  (
    'd7e8f901-2345-4678-90ab-cdef12345678',
    'Maquillage Professionnel',
    'Professional Makeup',
    'Maquillage pour événements spéciaux',
    'Makeup for special events',
    'MAKEUP',
    ARRAY['https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800'],
    90,
    35000,
    NULL,
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
  );

-- ============================================
-- 4. CRÉER LE SALON
-- ============================================

INSERT INTO salons (
  id, user_id, name_fr, name_en, description_fr, description_en,
  quarter, street, landmark, city, region, country,
  location, latitude, longitude, logo, cover_image, ambiance_images,
  established_year, features, opening_hours, rating, review_count, service_count,
  is_active, is_verified, created_at, updated_at
)
VALUES (
  '12345678-9abc-4def-0123-456789abcdef',
  'f1e2d3c4-b5a6-4987-8012-fedcba987654',
  'Beau Monde Esthétique',
  'Beau Monde Aesthetics',
  'Salon de beauté haut de gamme offrant des services personnalisés dans une ambiance relaxante',
  'High-end beauty salon offering personalized services in a relaxing atmosphere',
  'Akwa',
  'Boulevard de la Liberté',
  'À côté du centre commercial Akwa Palace',
  'Douala',
  'Littoral',
  'Cameroun',
  ST_GeomFromText('POINT(9.7085 4.0511)', 4326),
  4.0511,
  9.7085,
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
  'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=1200',
  ARRAY['https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=800', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800'],
  2018,
  '[
    {"fr": "Priorité à l''individu", "en": "Priority to Individual"},
    {"fr": "Produits bio", "en": "Organic-based services"},
    {"fr": "Équipe professionnelle", "en": "Professional Team"},
    {"fr": "Équipement moderne", "en": "Modern Equipment"}
  ]'::jsonb,
  '{"monday": {"open": "09:00", "close": "19:00"}, "tuesday": {"open": "09:00", "close": "19:00"}, "wednesday": {"open": "09:00", "close": "19:00"}, "thursday": {"open": "09:00", "close": "19:00"}, "friday": {"open": "09:00", "close": "20:00"}, "saturday": {"open": "10:00", "close": "18:00"}, "sunday": {"open": "closed", "close": "closed"}}'::jsonb,
  0,
  0,
  6,
  true,
  true,
  NOW(),
  NOW()
);

-- ============================================
-- 5. CRÉER LES THÉRAPEUTES
-- ============================================

-- Therapist 1 (Sophie Ndongo) - Affiliée au salon
INSERT INTO therapists (
  id, user_id, bio_fr, bio_en, experience, is_licensed, license_number,
  is_mobile, travel_radius, travel_fee, location, latitude, longitude,
  city, region, portfolio_images, salon_id, rating, review_count,
  booking_count, is_active, created_at, updated_at
)
VALUES (
  '23456789-abcd-4ef0-1234-56789abcdef0',
  '62d8e317-e626-42c0-9dc2-982ba55539a4',
  'Thérapeute certifiée avec 8 ans d''expérience en massage thérapeutique et bien-être. Spécialisée dans le massage deep tissue et suédois.',
  'Certified therapist with 8 years of experience in therapeutic massage and wellness. Specialized in deep tissue and Swedish massage.',
  8,
  true,
  'CMR-MASSAGE-2016-001234',
  true,
  15,
  3000,
  ST_GeomFromText('POINT(9.7085 4.0511)', 4326),
  4.0511,
  9.7085,
  'Douala',
  'Littoral',
  ARRAY['https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800'],
  '12345678-9abc-4def-0123-456789abcdef',
  0,
  0,
  432,
  true,
  NOW(),
  NOW()
);

-- Therapist 2 (Alice Tchoumi) - Indépendante
INSERT INTO therapists (
  id, user_id, bio_fr, bio_en, experience, is_licensed, license_number,
  is_mobile, travel_radius, travel_fee, location, latitude, longitude,
  city, region, portfolio_images, rating, review_count,
  booking_count, is_active, created_at, updated_at
)
VALUES (
  '3456789a-bcde-4f01-2345-6789abcdef01',
  'a1b2c3d4-e5f6-4789-a012-3456789abcde',
  'Esthéticienne professionnelle spécialisée dans les soins du visage et la manucure. Formée à Paris avec 6 ans d''expérience.',
  'Professional esthetician specialized in facial care and manicure. Trained in Paris with 6 years of experience.',
  6,
  true,
  'CMR-ESTH-2018-005678',
  true,
  10,
  2500,
  ST_GeomFromText('POINT(9.7042 4.0483)', 4326),
  4.0483,
  9.7042,
  'Douala',
  'Littoral',
  ARRAY['https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800', 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800'],
  0,
  0,
  267,
  true,
  NOW(),
  NOW()
);

-- ============================================
-- 6. CRÉER LES FORMATIONS (EDUCATION)
-- ============================================

INSERT INTO education (id, therapist_id, title, institution, year, created_at)
VALUES
  -- Therapist 1 Education
  (gen_random_uuid(), '23456789-abcd-4ef0-1234-56789abcdef0', 'Certified Massage Therapist', 'Institut de Formation en Massage Thérapeutique, Paris', 2016, NOW()),
  (gen_random_uuid(), '23456789-abcd-4ef0-1234-56789abcdef0', 'Deep Tissue Massage Specialist', 'Centre de Formation Professionnelle, Douala', 2018, NOW()),

  -- Therapist 2 Education
  (gen_random_uuid(), '3456789a-bcde-4f01-2345-6789abcdef01', 'Diplôme d''Esthétique', 'École Supérieure d''Esthétique, Paris', 2018, NOW()),
  (gen_random_uuid(), '3456789a-bcde-4f01-2345-6789abcdef01', 'Advanced Facial Treatments', 'Beauty Academy, Yaoundé', 2020, NOW());

-- ============================================
-- 7. CRÉER LES RELATIONS THERAPIST-SERVICE
-- ============================================

INSERT INTO therapist_services (id, therapist_id, service_id, price, duration, is_active)
VALUES
  -- Therapist 1 (Sophie) - Massages
  (gen_random_uuid(), '23456789-abcd-4ef0-1234-56789abcdef0', 'd1e2f3a4-b5c6-4d78-9e01-234567890abc', 25000, 60, true),  -- Deep Tissue
  (gen_random_uuid(), '23456789-abcd-4ef0-1234-56789abcdef0', 'e2f3a4b5-c6d7-4e89-0f12-34567890abcd', 20000, 45, true),  -- Swedish
  (gen_random_uuid(), '23456789-abcd-4ef0-1234-56789abcdef0', 'f3a4b5c6-d7e8-4f90-1234-567890abcdef', 30000, 90, true),  -- Hot Stone

  -- Therapist 2 (Alice) - Soins visage et manucure
  (gen_random_uuid(), '3456789a-bcde-4f01-2345-6789abcdef01', 'c6d7e8f9-0123-4456-7890-abcdef123456', 30000, 75, true),  -- Soin visage
  (gen_random_uuid(), '3456789a-bcde-4f01-2345-6789abcdef01', 'b5c6d7e8-f901-4234-5678-90abcdef1234', 12000, 45, true);  -- Manucure

-- ============================================
-- 8. CRÉER LES RELATIONS SALON-SERVICE
-- ============================================

INSERT INTO salon_services (id, salon_id, service_id, price, duration, is_active)
VALUES
  -- Beau Monde Esthétique - Tous les services
  (gen_random_uuid(), '12345678-9abc-4def-0123-456789abcdef', 'a4b5c6d7-e8f9-4012-3456-7890abcdef12', 15000, 60, true),   -- Coupe cheveux
  (gen_random_uuid(), '12345678-9abc-4def-0123-456789abcdef', 'b5c6d7e8-f901-4234-5678-90abcdef1234', 12000, 45, true),   -- Manucure
  (gen_random_uuid(), '12345678-9abc-4def-0123-456789abcdef', 'c6d7e8f9-0123-4456-7890-abcdef123456', 35000, 75, true),   -- Soin visage
  (gen_random_uuid(), '12345678-9abc-4def-0123-456789abcdef', 'd7e8f901-2345-4678-90ab-cdef12345678', 40000, 90, true),   -- Maquillage
  (gen_random_uuid(), '12345678-9abc-4def-0123-456789abcdef', 'd1e2f3a4-b5c6-4d78-9e01-234567890abc', 28000, 60, true),   -- Deep Tissue
  (gen_random_uuid(), '12345678-9abc-4def-0123-456789abcdef', 'e2f3a4b5-c6d7-4e89-0f12-34567890abcd', 22000, 45, true);   -- Swedish

-- ============================================
-- 9. CRÉER LES DISPONIBILITÉS
-- ============================================

-- Therapist 1 (Sophie) - Lundi à Vendredi 9h-18h
INSERT INTO availability (id, therapist_id, day_of_week, start_time, end_time, is_active)
VALUES
  (gen_random_uuid(), '23456789-abcd-4ef0-1234-56789abcdef0', 1, '09:00:00', '18:00:00', true),  -- Lundi
  (gen_random_uuid(), '23456789-abcd-4ef0-1234-56789abcdef0', 2, '09:00:00', '18:00:00', true),  -- Mardi
  (gen_random_uuid(), '23456789-abcd-4ef0-1234-56789abcdef0', 3, '09:00:00', '18:00:00', true),  -- Mercredi
  (gen_random_uuid(), '23456789-abcd-4ef0-1234-56789abcdef0', 4, '09:00:00', '18:00:00', true),  -- Jeudi
  (gen_random_uuid(), '23456789-abcd-4ef0-1234-56789abcdef0', 5, '09:00:00', '18:00:00', true),  -- Vendredi
  (gen_random_uuid(), '23456789-abcd-4ef0-1234-56789abcdef0', 6, '10:00:00', '16:00:00', true);  -- Samedi

-- Therapist 2 (Alice) - Mardi à Samedi 10h-19h
INSERT INTO availability (id, therapist_id, day_of_week, start_time, end_time, is_active)
VALUES
  (gen_random_uuid(), '3456789a-bcde-4f01-2345-6789abcdef01', 2, '10:00:00', '19:00:00', true),  -- Mardi
  (gen_random_uuid(), '3456789a-bcde-4f01-2345-6789abcdef01', 3, '10:00:00', '19:00:00', true),  -- Mercredi
  (gen_random_uuid(), '3456789a-bcde-4f01-2345-6789abcdef01', 4, '10:00:00', '19:00:00', true),  -- Jeudi
  (gen_random_uuid(), '3456789a-bcde-4f01-2345-6789abcdef01', 5, '10:00:00', '19:00:00', true),  -- Vendredi
  (gen_random_uuid(), '3456789a-bcde-4f01-2345-6789abcdef01', 6, '10:00:00', '19:00:00', true);  -- Samedi

-- ============================================
-- 10. CRÉER DES RÉSERVATIONS D'EXEMPLE
-- ============================================

-- Booking 1 - Client 1 avec Therapist 1 (à domicile)
INSERT INTO bookings (
  id, user_id, therapist_id, scheduled_at, duration, location_type,
  quarter, street, landmark, city, region, latitude, longitude, instructions,
  subtotal, travel_fee, tip, total, status, created_at, updated_at
)
VALUES (
  '456789ab-cdef-4012-3456-789abcdef012',
  '56811604-9372-479f-a3ee-35056e5812dd',
  '23456789-abcd-4ef0-1234-56789abcdef0',
  '2025-11-15 14:00:00+00',
  60,
  'HOME',
  'Akwa',
  'Rue de la République',
  'Près de la pharmacie du rond-point',
  'Douala',
  'Littoral',
  4.0511,
  9.7679,
  'Bâtiment bleu, 2ème étage',
  25000,
  3000,
  2000,
  30000,
  'CONFIRMED',
  NOW(),
  NOW()
);

-- Booking Item 1
INSERT INTO booking_items (id, booking_id, service_name, price, duration, created_at)
VALUES (
  gen_random_uuid(),
  '456789ab-cdef-4012-3456-789abcdef012',
  'Deep Tissue Massage',
  25000,
  60,
  NOW()
);

-- Booking 2 - Client 2 avec Salon (en salon)
INSERT INTO bookings (
  id, user_id, salon_id, scheduled_at, duration, location_type,
  quarter, landmark, city, region, subtotal, total, status, created_at, updated_at
)
VALUES (
  '56789abc-def0-4123-4567-89abcdef0123',
  'fcbfa0f5-eef4-45d7-821e-ac4117e50d0c',
  '12345678-9abc-4def-0123-456789abcdef',
  '2025-11-16 10:00:00+00',
  60,
  'SALON',
  'Akwa',
  'Beau Monde Esthétique',
  'Douala',
  'Littoral',
  15000,
  15000,
  'PENDING',
  NOW(),
  NOW()
);

-- Booking Item 2
INSERT INTO booking_items (id, booking_id, service_name, price, duration, created_at)
VALUES (
  gen_random_uuid(),
  '56789abc-def0-4123-4567-89abcdef0123',
  'Coupe de Cheveux Femme',
  15000,
  60,
  NOW()
);

-- ============================================
-- 11. CRÉER DES AVIS
-- ============================================

-- Reviews pour Therapist 1 (Sophie Ndongo)
INSERT INTO reviews (id, user_id, therapist_id, rating, comment, cleanliness, professionalism, value, created_at, updated_at)
VALUES
  (
    gen_random_uuid(),
    '56811604-9372-479f-a3ee-35056e5812dd',
    '23456789-abcd-4ef0-1234-56789abcdef0',
    5,
    'Excellente expérience ! Sophie est très professionnelle et attentive. Le massage était exactement ce dont j''avais besoin.',
    5,
    5,
    5,
    NOW() - INTERVAL '2 weeks',
    NOW() - INTERVAL '2 weeks'
  ),
  (
    gen_random_uuid(),
    'fcbfa0f5-eef4-45d7-821e-ac4117e50d0c',
    '23456789-abcd-4ef0-1234-56789abcdef0',
    4,
    'Très bon massage, Sophie connaît bien son métier. L''ambiance était relaxante.',
    4,
    5,
    4,
    NOW() - INTERVAL '1 month',
    NOW() - INTERVAL '1 month'
  ),
  (
    gen_random_uuid(),
    '56811604-9372-479f-a3ee-35056e5812dd',
    '23456789-abcd-4ef0-1234-56789abcdef0',
    5,
    'Je recommande vivement ! Le massage deep tissue était parfait pour mes tensions musculaires.',
    5,
    5,
    5,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
  );

-- Reviews pour Therapist 2 (Alice Tchoumi)
INSERT INTO reviews (id, user_id, therapist_id, rating, comment, cleanliness, professionalism, value, created_at, updated_at)
VALUES
  (
    gen_random_uuid(),
    'fcbfa0f5-eef4-45d7-821e-ac4117e50d0c',
    '3456789a-bcde-4f01-2345-6789abcdef01',
    5,
    'Alice est une esthéticienne incroyable ! Ma peau n''a jamais été aussi belle.',
    5,
    5,
    5,
    NOW() - INTERVAL '1 week',
    NOW() - INTERVAL '1 week'
  ),
  (
    gen_random_uuid(),
    '56811604-9372-479f-a3ee-35056e5812dd',
    '3456789a-bcde-4f01-2345-6789abcdef01',
    4,
    'Très professionnelle et minutieuse dans son travail. La manucure était impeccable.',
    4,
    5,
    4,
    NOW() - INTERVAL '2 weeks',
    NOW() - INTERVAL '2 weeks'
  );

-- Reviews pour le Salon (Beau Monde Esthétique)
INSERT INTO reviews (id, user_id, salon_id, rating, comment, cleanliness, professionalism, value, created_at, updated_at)
VALUES
  (
    gen_random_uuid(),
    'fcbfa0f5-eef4-45d7-821e-ac4117e50d0c',
    '12345678-9abc-4def-0123-456789abcdef',
    5,
    'Salon magnifique avec une équipe très accueillante. Services de qualité et ambiance relaxante.',
    5,
    5,
    4,
    NOW() - INTERVAL '1 week',
    NOW() - INTERVAL '1 week'
  ),
  (
    gen_random_uuid(),
    '56811604-9372-479f-a3ee-35056e5812dd',
    '12345678-9abc-4def-0123-456789abcdef',
    4,
    'Très bel établissement, personnel accueillant. Les services sont un peu chers mais de qualité.',
    4,
    5,
    3,
    NOW() - INTERVAL '3 weeks',
    NOW() - INTERVAL '3 weeks'
  ),
  (
    gen_random_uuid(),
    'fcbfa0f5-eef4-45d7-821e-ac4117e50d0c',
    '12345678-9abc-4def-0123-456789abcdef',
    5,
    'Mon salon préféré à Douala ! Toujours satisfaite de mes visites.',
    5,
    5,
    5,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days'
  );

-- ============================================
-- 12. CRÉER DES FAVORIS
-- ============================================

INSERT INTO favorites (id, user_id, therapist_id, created_at)
VALUES
  (gen_random_uuid(), '56811604-9372-479f-a3ee-35056e5812dd', '23456789-abcd-4ef0-1234-56789abcdef0', NOW());

INSERT INTO favorites (id, user_id, salon_id, created_at)
VALUES
  (gen_random_uuid(), 'fcbfa0f5-eef4-45d7-821e-ac4117e50d0c', '12345678-9abc-4def-0123-456789abcdef', NOW());

-- ============================================
-- 13. CALCULER ET METTRE À JOUR LES RATINGS
-- ============================================

-- Mettre à jour les ratings et review_count pour les thérapeutes
UPDATE therapists t
SET
  rating = (
    SELECT ROUND(AVG(rating)::numeric, 2)
    FROM reviews r
    WHERE r.therapist_id = t.id
  ),
  review_count = (
    SELECT COUNT(*)
    FROM reviews r
    WHERE r.therapist_id = t.id
  )
WHERE EXISTS (
  SELECT 1 FROM reviews r WHERE r.therapist_id = t.id
);

-- Mettre à jour les ratings et review_count pour les salons
UPDATE salons s
SET
  rating = (
    SELECT ROUND(AVG(rating)::numeric, 2)
    FROM reviews r
    WHERE r.salon_id = s.id
  ),
  review_count = (
    SELECT COUNT(*)
    FROM reviews r
    WHERE r.salon_id = s.id
  )
WHERE EXISTS (
  SELECT 1 FROM reviews r WHERE r.salon_id = s.id
);

-- ============================================
-- ✅ SCRIPT TERMINÉ
-- ============================================

-- Vérification rapide
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Addresses', COUNT(*) FROM addresses
UNION ALL
SELECT 'Services', COUNT(*) FROM services
UNION ALL
SELECT 'Salons', COUNT(*) FROM salons
UNION ALL
SELECT 'Therapists', COUNT(*) FROM therapists
UNION ALL
SELECT 'Education', COUNT(*) FROM education
UNION ALL
SELECT 'Therapist Services', COUNT(*) FROM therapist_services
UNION ALL
SELECT 'Salon Services', COUNT(*) FROM salon_services
UNION ALL
SELECT 'Availability', COUNT(*) FROM availability
UNION ALL
SELECT 'Bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'Reviews', COUNT(*) FROM reviews
UNION ALL
SELECT 'Favorites', COUNT(*) FROM favorites;
