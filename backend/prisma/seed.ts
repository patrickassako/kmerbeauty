import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean database
  console.log('🧹 Cleaning database...');
  await prisma.message.deleteMany();
  await prisma.bookingItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.review.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.education.deleteMany();
  await prisma.therapistService.deleteMany();
  await prisma.salonService.deleteMany();
  await prisma.service.deleteMany();
  await prisma.therapist.deleteMany();
  await prisma.salon.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  // Hash password
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // Create Users
  console.log('👤 Creating users...');
  const client1 = await prisma.user.create({
    data: {
      email: 'elyna.dessui@email.com',
      phone: '+237699123456',
      password: hashedPassword,
      firstName: 'Elyna',
      lastName: 'Des Sui',
      role: 'CLIENT',
      language: 'FRENCH',
      city: 'Douala',
      region: 'Littoral',
      isVerified: true,
    },
  });

  const client2 = await prisma.user.create({
    data: {
      email: 'marie.dubois@email.com',
      phone: '+237698765432',
      password: hashedPassword,
      firstName: 'Marie',
      lastName: 'Dubois',
      role: 'CLIENT',
      language: 'FRENCH',
      city: 'Yaoundé',
      region: 'Centre',
      isVerified: true,
    },
  });

  // Create Provider Users
  const provider1User = await prisma.user.create({
    data: {
      email: 'sophie.ndongo@email.com',
      phone: '+237677111222',
      password: hashedPassword,
      firstName: 'Sophie',
      lastName: 'Ndongo',
      role: 'PROVIDER',
      language: 'FRENCH',
      city: 'Douala',
      region: 'Littoral',
      isVerified: true,
    },
  });

  const provider2User = await prisma.user.create({
    data: {
      email: 'alice.tchoumi@email.com',
      phone: '+237677333444',
      password: hashedPassword,
      firstName: 'Alice',
      lastName: 'Tchoumi',
      role: 'PROVIDER',
      language: 'FRENCH',
      city: 'Douala',
      region: 'Littoral',
      isVerified: true,
    },
  });

  const salonOwnerUser = await prisma.user.create({
    data: {
      email: 'salon@beaumondeesthetique.cm',
      phone: '+237677555666',
      password: hashedPassword,
      firstName: 'Sophie',
      lastName: 'Laurent',
      role: 'PROVIDER',
      language: 'FRENCH',
      city: 'Douala',
      region: 'Littoral',
      isVerified: true,
    },
  });

  // Create Addresses using raw SQL (for PostGIS geometry)
  console.log('📍 Creating addresses...');

  await prisma.$executeRaw`
    INSERT INTO addresses (id, "userId", label, quarter, street, landmark, city, region, country, location, latitude, longitude, instructions, "isPrimary", "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid(),
      ${client1.id}::uuid,
      'Domicile',
      'Akwa',
      'Rue de la République',
      'Près de la pharmacie du rond-point',
      'Douala',
      'Littoral',
      'Cameroun',
      ST_GeomFromText('POINT(9.7679 4.0511)', 4326),
      4.0511,
      9.7679,
      'Bâtiment bleu, 2ème étage',
      true,
      NOW(),
      NOW()
    )
  `;

  await prisma.$executeRaw`
    INSERT INTO addresses (id, "userId", label, quarter, landmark, city, region, country, location, latitude, longitude, "isPrimary", "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid(),
      ${client1.id}::uuid,
      'Bureau',
      'Bonanjo',
      'En face du marché central',
      'Douala',
      'Littoral',
      'Cameroun',
      ST_GeomFromText('POINT(9.7042 4.0483)', 4326),
      4.0483,
      9.7042,
      false,
      NOW(),
      NOW()
    )
  `;

  await prisma.$executeRaw`
    INSERT INTO addresses (id, "userId", label, quarter, landmark, city, region, country, location, latitude, longitude, "isPrimary", "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid(),
      ${client2.id}::uuid,
      'Domicile',
      'Bastos',
      'Près de l''ambassade',
      'Yaoundé',
      'Centre',
      'Cameroun',
      ST_GeomFromText('POINT(11.5167 3.8667)', 4326),
      3.8667,
      11.5167,
      true,
      NOW(),
      NOW()
    )
  `;

  // Create Services
  console.log('💆 Creating services...');
  const deepTissueMassage = await prisma.service.create({
    data: {
      name: 'Deep Tissue Massage',
      description: 'Massage profond pour soulager les tensions musculaires',
      category: 'WELLNESS_MASSAGE',
      images: [
        'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800',
      ],
      duration: 60,
      basePrice: 25000,
      purpose: 'Soulager les douleurs musculaires profondes',
      idealFor: 'Personnes souffrant de tensions chroniques',
    },
  });

  const swedishMassage = await prisma.service.create({
    data: {
      name: 'Swedish Massage',
      description: 'Massage relaxant suédois classique',
      category: 'WELLNESS_MASSAGE',
      images: [
        'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800',
      ],
      duration: 45,
      basePrice: 20000,
      purpose: 'Relaxation et bien-être général',
      idealFor: 'Tous types de clients recherchant la détente',
    },
  });

  const haircut = await prisma.service.create({
    data: {
      name: 'Coupe de Cheveux Femme',
      description: 'Coupe et brushing professionnel',
      category: 'HAIRDRESSING',
      images: [
        'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800',
      ],
      duration: 60,
      basePrice: 15000,
    },
  });

  const manicure = await prisma.service.create({
    data: {
      name: 'Manucure Complète',
      description: 'Soins complets des ongles et des mains',
      category: 'NAIL_CARE',
      images: [
        'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800',
      ],
      duration: 45,
      basePrice: 12000,
    },
  });

  const facial = await prisma.service.create({
    data: {
      name: 'Soin du Visage',
      description: 'Nettoyage en profondeur et hydratation',
      category: 'FACIAL',
      images: [
        'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800',
      ],
      duration: 75,
      basePrice: 30000,
    },
  });

  const makeup = await prisma.service.create({
    data: {
      name: 'Maquillage Professionnel',
      description: 'Maquillage pour événements spéciaux',
      category: 'MAKEUP',
      images: [
        'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800',
      ],
      duration: 90,
      basePrice: 35000,
    },
  });

  const hotStone = await prisma.service.create({
    data: {
      name: 'Hot Stone Therapy',
      description: 'Massage aux pierres chaudes',
      category: 'WELLNESS_MASSAGE',
      images: [
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
      ],
      duration: 90,
      basePrice: 30000,
    },
  });

  // Create Salon using raw SQL (for PostGIS geometry)
  console.log('🏪 Creating salon...');

  const salonResult = await prisma.$queryRaw<{ id: string }[]>`
    INSERT INTO salons (
      id, "userId", name, description, quarter, street, landmark, city, region, country,
      location, latitude, longitude, logo, "coverImage", "ambianceImages",
      "establishedYear", features, "openingHours", rating, "reviewCount", "serviceCount",
      "isActive", "isVerified", "createdAt", "updatedAt"
    )
    VALUES (
      gen_random_uuid(),
      ${salonOwnerUser.id}::uuid,
      'Beau Monde Esthétique',
      'Salon de beauté haut de gamme offrant des services personnalisés dans une ambiance relaxante',
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
      ARRAY['Priority to Individual', 'Organic-based services', 'Professional Team', 'Modern Equipment'],
      '{"monday": {"open": "09h00", "close": "19h00"}, "tuesday": {"open": "09h00", "close": "19h00"}, "wednesday": {"open": "09h00", "close": "19h00"}, "thursday": {"open": "09h00", "close": "19h00"}, "friday": {"open": "09h00", "close": "20h00"}, "saturday": {"open": "10h00", "close": "18h00"}, "sunday": {"open": "closed", "close": "closed"}}'::jsonb,
      4.8,
      2340,
      6,
      true,
      true,
      NOW(),
      NOW()
    )
    RETURNING id
  `;

  const salonId = salonResult[0].id;

  // Create Therapists using raw SQL (for PostGIS geometry)
  console.log('👩‍⚕️ Creating therapists...');

  const therapist1Result = await prisma.$queryRaw<{ id: string }[]>`
    INSERT INTO therapists (
      id, "userId", bio, experience, "isLicensed", "licenseNumber",
      "isMobile", "travelRadius", "travelFee", location, latitude, longitude,
      city, region, "portfolioImages", "salonId", rating, "reviewCount",
      "bookingCount", "isActive", "createdAt", "updatedAt"
    )
    VALUES (
      gen_random_uuid(),
      ${provider1User.id}::uuid,
      'Thérapeute certifiée avec 8 ans d''expérience en massage thérapeutique et bien-être. Spécialisée dans le massage deep tissue et suédois.',
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
      ${salonId}::uuid,
      4.9,
      156,
      432,
      true,
      NOW(),
      NOW()
    )
    RETURNING id
  `;

  const therapist1Id = therapist1Result[0].id;

  const therapist2Result = await prisma.$queryRaw<{ id: string }[]>`
    INSERT INTO therapists (
      id, "userId", bio, experience, "isLicensed", "licenseNumber",
      "isMobile", "travelRadius", "travelFee", location, latitude, longitude,
      city, region, "portfolioImages", rating, "reviewCount",
      "bookingCount", "isActive", "createdAt", "updatedAt"
    )
    VALUES (
      gen_random_uuid(),
      ${provider2User.id}::uuid,
      'Esthéticienne professionnelle spécialisée dans les soins du visage et la manucure. Formée à Paris avec 6 ans d''expérience.',
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
      4.7,
      89,
      267,
      true,
      NOW(),
      NOW()
    )
    RETURNING id
  `;

  const therapist2Id = therapist2Result[0].id;

  // Create Education records
  console.log('🎓 Creating education records...');
  await prisma.education.create({
    data: {
      therapistId: therapist1Id,
      title: 'Certified Massage Therapist',
      institution: 'Institut de Formation en Massage Thérapeutique, Paris',
      year: 2016,
    },
  });

  await prisma.education.create({
    data: {
      therapistId: therapist1Id,
      title: 'Deep Tissue Massage Specialist',
      institution: 'Centre de Formation Professionnelle, Douala',
      year: 2018,
    },
  });

  await prisma.education.create({
    data: {
      therapistId: therapist2Id,
      title: 'Diplôme d\'Esthétique',
      institution: 'École Supérieure d\'Esthétique, Paris',
      year: 2018,
    },
  });

  await prisma.education.create({
    data: {
      therapistId: therapist2Id,
      title: 'Advanced Facial Treatments',
      institution: 'Beauty Academy, Yaoundé',
      year: 2020,
    },
  });

  // Create TherapistService relationships
  console.log('🔗 Creating therapist-service relationships...');
  await prisma.therapistService.createMany({
    data: [
      {
        therapistId: therapist1Id,
        serviceId: deepTissueMassage.id,
        price: 25000,
        duration: 60,
      },
      {
        therapistId: therapist1Id,
        serviceId: swedishMassage.id,
        price: 20000,
        duration: 45,
      },
      {
        therapistId: therapist1Id,
        serviceId: hotStone.id,
        price: 30000,
        duration: 90,
      },
      {
        therapistId: therapist2Id,
        serviceId: facial.id,
        price: 30000,
        duration: 75,
      },
      {
        therapistId: therapist2Id,
        serviceId: manicure.id,
        price: 12000,
        duration: 45,
      },
    ],
  });

  // Create SalonService relationships
  console.log('🔗 Creating salon-service relationships...');
  await prisma.salonService.createMany({
    data: [
      {
        salonId: salonId,
        serviceId: haircut.id,
        price: 15000,
        duration: 60,
      },
      {
        salonId: salonId,
        serviceId: manicure.id,
        price: 12000,
        duration: 45,
      },
      {
        salonId: salonId,
        serviceId: facial.id,
        price: 35000,
        duration: 75,
      },
      {
        salonId: salonId,
        serviceId: makeup.id,
        price: 40000,
        duration: 90,
      },
      {
        salonId: salonId,
        serviceId: deepTissueMassage.id,
        price: 28000,
        duration: 60,
      },
      {
        salonId: salonId,
        serviceId: swedishMassage.id,
        price: 22000,
        duration: 45,
      },
    ],
  });

  // Create Availability schedules
  console.log('📅 Creating availability schedules...');

  // Therapist 1 availability (Monday to Friday, 9h-18h)
  for (let day = 1; day <= 5; day++) {
    await prisma.availability.create({
      data: {
        therapistId: therapist1Id,
        dayOfWeek: day,
        startTime: '09h00',
        endTime: '18h00',
      },
    });
  }

  // Therapist 1 Saturday (10h-16h)
  await prisma.availability.create({
    data: {
      therapistId: therapist1Id,
      dayOfWeek: 6,
      startTime: '10h00',
      endTime: '16h00',
    },
  });

  // Therapist 2 availability (Tuesday to Saturday, 10h-19h)
  for (let day = 2; day <= 6; day++) {
    await prisma.availability.create({
      data: {
        therapistId: therapist2Id,
        dayOfWeek: day,
        startTime: '10h00',
        endTime: '19h00',
      },
    });
  }

  // Create sample bookings
  console.log('📅 Creating sample bookings...');

  const booking1 = await prisma.booking.create({
    data: {
      userId: client1.id,
      therapistId: therapist1Id,
      scheduledAt: new Date('2025-11-15T14:00:00Z'),
      duration: 60,
      locationType: 'HOME',
      quarter: 'Akwa',
      street: 'Rue de la République',
      landmark: 'Près de la pharmacie du rond-point',
      city: 'Douala',
      region: 'Littoral',
      latitude: 4.0511,
      longitude: 9.7679,
      instructions: 'Bâtiment bleu, 2ème étage',
      subtotal: 25000,
      travelFee: 3000,
      tip: 2000,
      total: 30000,
      status: 'CONFIRMED',
    },
  });

  await prisma.bookingItem.create({
    data: {
      bookingId: booking1.id,
      serviceName: 'Deep Tissue Massage',
      price: 25000,
      duration: 60,
    },
  });

  const booking2 = await prisma.booking.create({
    data: {
      userId: client2.id,
      salonId: salonId,
      scheduledAt: new Date('2025-11-16T10:00:00Z'),
      duration: 60,
      locationType: 'SALON',
      quarter: 'Akwa',
      landmark: 'Beau Monde Esthétique',
      city: 'Douala',
      region: 'Littoral',
      subtotal: 15000,
      total: 15000,
      status: 'PENDING',
    },
  });

  await prisma.bookingItem.create({
    data: {
      bookingId: booking2.id,
      serviceName: 'Coupe de Cheveux Femme',
      price: 15000,
      duration: 60,
    },
  });

  // Create reviews
  console.log('⭐ Creating reviews...');
  await prisma.review.create({
    data: {
      userId: client1.id,
      therapistId: therapist1Id,
      rating: 5,
      comment:
        'Excellente expérience ! Sophie est très professionnelle et attentive. Le massage était exactement ce dont j\'avais besoin.',
      cleanliness: 5,
      professionalism: 5,
      value: 5,
    },
  });

  await prisma.review.create({
    data: {
      userId: client2.id,
      salonId: salonId,
      rating: 5,
      comment:
        'Salon magnifique avec une équipe très accueillante. Services de qualité et ambiance relaxante.',
      cleanliness: 5,
      professionalism: 5,
      value: 4,
    },
  });

  // Create favorites
  console.log('❤️ Creating favorites...');
  await prisma.favorite.create({
    data: {
      userId: client1.id,
      therapistId: therapist1Id,
    },
  });

  await prisma.favorite.create({
    data: {
      userId: client2.id,
      salonId: salonId,
    },
  });

  console.log('✅ Database seeding completed!');
  console.log('\n📋 Test Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Client 1:');
  console.log('  Email: elyna.dessui@email.com');
  console.log('  Password: Password123!');
  console.log('');
  console.log('Client 2:');
  console.log('  Email: marie.dubois@email.com');
  console.log('  Password: Password123!');
  console.log('');
  console.log('Provider (Salon):');
  console.log('  Email: salon@beaumondeesthetique.cm');
  console.log('  Password: Password123!');
  console.log('');
  console.log('Provider (Therapist 1):');
  console.log('  Email: sophie.ndongo@email.com');
  console.log('  Password: Password123!');
  console.log('');
  console.log('Provider (Therapist 2):');
  console.log('  Email: alice.tchoumi@email.com');
  console.log('  Password: Password123!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
