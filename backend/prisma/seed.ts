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
      email: 'claire.smith@email.com',
      phone: '+237677111222',
      password: hashedPassword,
      firstName: 'Claire',
      lastName: 'Smith',
      role: 'PROVIDER',
      language: 'FRENCH',
      city: 'Douala',
      region: 'Littoral',
      isVerified: true,
    },
  });

  const provider2User = await prisma.user.create({
    data: {
      email: 'jean.martin@email.com',
      phone: '+237677333444',
      password: hashedPassword,
      firstName: 'Jean',
      lastName: 'Martin',
      role: 'PROVIDER',
      language: 'FRENCH',
      city: 'Douala',
      region: 'Littoral',
      isVerified: true,
    },
  });

  const salonOwnerUser = await prisma.user.create({
    data: {
      email: 'salon.beaumonde@email.com',
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

  // Create Addresses
  console.log('📍 Creating addresses...');
  await prisma.address.createMany({
    data: [
      {
        userId: client1.id,
        label: 'Domicile',
        quarter: 'Akwa',
        street: 'Rue de la République',
        landmark: 'Près de la pharmacie du rond-point',
        city: 'Douala',
        region: 'Littoral',
        latitude: 4.0511,
        longitude: 9.7679,
        instructions: 'Bâtiment bleu, 2ème étage',
        isPrimary: true,
      },
      {
        userId: client1.id,
        label: 'Bureau',
        quarter: 'Bonanjo',
        landmark: 'En face du marché central',
        city: 'Douala',
        region: 'Littoral',
        latitude: 4.0483,
        longitude: 9.7042,
        isPrimary: false,
      },
      {
        userId: client2.id,
        label: 'Domicile',
        quarter: 'Bastos',
        landmark: 'Près de l\'ambassade',
        city: 'Yaoundé',
        region: 'Centre',
        latitude: 3.8667,
        longitude: 11.5167,
        isPrimary: true,
      },
    ],
  });

  // Create Services
  console.log('💅 Creating services...');
  const deepTissueMassage = await prisma.service.create({
    data: {
      name: 'Deep Tissue French Massage',
      description: 'Massage profond des tissus pour relâcher les tensions musculaires',
      category: 'WELLNESS_MASSAGE',
      images: [
        'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400',
        'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400',
      ],
      duration: 120,
      basePrice: 25000,
      components: {
        steps: [
          'Consultation initiale',
          'Préparation avec huiles essentielles',
          'Massage des zones ciblées',
          'Relaxation finale',
        ],
      },
      purpose: 'Soulager les douleurs musculaires et améliorer la circulation',
      idealFor: 'Personnes avec tensions musculaires chroniques',
    },
  });

  const haircut = await prisma.service.create({
    data: {
      name: 'Coupe de cheveux professionnelle',
      description: 'Coupe de cheveux avec consultation style',
      category: 'HAIRDRESSING',
      images: [
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
      ],
      duration: 60,
      basePrice: 5000,
    },
  });

  const manicure = await prisma.service.create({
    data: {
      name: 'Manucure complète',
      description: 'Soin complet des ongles avec vernis',
      category: 'NAIL_CARE',
      images: [
        'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400',
      ],
      duration: 45,
      basePrice: 3000,
    },
  });

  const facial = await prisma.service.create({
    data: {
      name: 'Soin du visage complet',
      description: 'Nettoyage profond, gommage et masque',
      category: 'FACIAL',
      images: [
        'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400',
      ],
      duration: 90,
      basePrice: 15000,
    },
  });

  const makeup = await prisma.service.create({
    data: {
      name: 'Maquillage professionnel',
      description: 'Maquillage pour événement',
      category: 'MAKEUP',
      images: [
        'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400',
      ],
      duration: 60,
      basePrice: 10000,
    },
  });

  const swedishMassage = await prisma.service.create({
    data: {
      name: 'Swedish Massage',
      description: 'Massage suédois relaxant',
      category: 'WELLNESS_MASSAGE',
      images: [
        'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=400',
      ],
      duration: 60,
      basePrice: 20000,
    },
  });

  const hotStone = await prisma.service.create({
    data: {
      name: 'Hot Stone Therapy',
      description: 'Thérapie aux pierres chaudes',
      category: 'WELLNESS_MASSAGE',
      images: [
        'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400',
      ],
      duration: 90,
      basePrice: 30000,
    },
  });

  // Create Salon
  console.log('🏪 Creating salons...');
  const salon = await prisma.salon.create({
    data: {
      userId: salonOwnerUser.id,
      name: 'Beau Monde Esthétique',
      description: 'Salon de beauté premium à Douala',
      quarter: 'Akwa',
      street: 'Avenue de la Liberté',
      landmark: 'À côté de la station Total',
      city: 'Douala',
      region: 'Littoral',
      latitude: 4.0511,
      longitude: 9.7679,
      logo: 'https://ui-avatars.com/api/?name=Beau+Monde&background=FF6B6B&color=fff',
      coverImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
      ambianceImages: [
        'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=400',
        'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=400',
      ],
      establishedYear: 1987,
      features: [
        'Priority to Individual',
        'Organic-based services',
        'Hygienic Practices',
        'Skilled Professionals',
        'Advanced Technology',
        'Relaxing Atmosphere',
      ],
      openingHours: {
        monday: { open: '09h00', close: '19h00' },
        tuesday: { open: '09h00', close: '19h00' },
        wednesday: { open: '09h00', close: '19h00' },
        thursday: { open: '09h00', close: '19h00' },
        friday: { open: '09h00', close: '20h00' },
        saturday: { open: '08h00', close: '20h00' },
        sunday: { open: '10h00', close: '16h00' },
      },
      rating: 4.8,
      reviewCount: 2340,
      serviceCount: 12,
      isVerified: true,
    },
  });

  // Create Therapists
  console.log('💆 Creating therapists...');
  const therapist1 = await prisma.therapist.create({
    data: {
      userId: provider1User.id,
      bio: 'Experte en massages thérapeutiques avec plus de 10 ans d\'expérience. Spécialisée dans les techniques de massage suédois et deep tissue.',
      experience: 10,
      isLicensed: true,
      licenseNumber: 'MT-CM-2014-00123',
      isMobile: true,
      travelRadius: 10,
      travelFee: 2000,
      latitude: 4.0511,
      longitude: 9.7679,
      city: 'Douala',
      region: 'Littoral',
      portfolioImages: [
        'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400',
        'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400',
      ],
      salonId: salon.id,
      rating: 4.9,
      reviewCount: 156,
      bookingCount: 342,
    },
  });

  const therapist2 = await prisma.therapist.create({
    data: {
      userId: provider2User.id,
      bio: 'Coiffeur professionnel passionné par les coupes modernes et les soins capillaires.',
      experience: 8,
      isLicensed: true,
      licenseNumber: 'HC-CM-2016-00456',
      isMobile: true,
      travelRadius: 5,
      travelFee: 1500,
      latitude: 4.0483,
      longitude: 9.7042,
      city: 'Douala',
      region: 'Littoral',
      portfolioImages: [
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
      ],
      rating: 4.7,
      reviewCount: 89,
      bookingCount: 187,
    },
  });

  // Create Education records
  console.log('🎓 Creating education records...');
  await prisma.education.createMany({
    data: [
      {
        therapistId: therapist1.id,
        title: 'Diploma in Esthetics from Paris Cosmetology School',
        institution: 'Paris Cosmetology School',
        year: 2014,
      },
      {
        therapistId: therapist1.id,
        title: 'Certified in Advanced Facial Techniques',
        institution: 'International Beauty Academy',
        year: 2016,
      },
      {
        therapistId: therapist1.id,
        title: 'Licensed Massage Therapist with specialization in Swedish and Deep Tissue Massage',
        institution: 'Cameroon Massage Therapy Institute',
        year: 2013,
      },
      {
        therapistId: therapist2.id,
        title: 'Professional Hairdressing Certificate',
        institution: 'Douala Beauty School',
        year: 2016,
      },
    ],
  });

  // Link Therapists to Services
  console.log('🔗 Linking therapists to services...');
  await prisma.therapistService.createMany({
    data: [
      // Therapist 1 - Massage specialist
      {
        therapistId: therapist1.id,
        serviceId: deepTissueMassage.id,
        price: 25000,
        duration: 120,
      },
      {
        therapistId: therapist1.id,
        serviceId: swedishMassage.id,
        price: 20000,
        duration: 60,
      },
      {
        therapistId: therapist1.id,
        serviceId: hotStone.id,
        price: 30000,
        duration: 90,
      },
      // Therapist 2 - Hairdresser
      {
        therapistId: therapist2.id,
        serviceId: haircut.id,
        price: 5000,
        duration: 60,
      },
    ],
  });

  // Link Salon to Services
  console.log('🔗 Linking salon to services...');
  await prisma.salonService.createMany({
    data: [
      {
        salonId: salon.id,
        serviceId: deepTissueMassage.id,
        price: 25000,
        duration: 120,
      },
      {
        salonId: salon.id,
        serviceId: haircut.id,
        price: 6000,
        duration: 60,
      },
      {
        salonId: salon.id,
        serviceId: manicure.id,
        price: 3500,
        duration: 45,
      },
      {
        salonId: salon.id,
        serviceId: facial.id,
        price: 15000,
        duration: 90,
      },
      {
        salonId: salon.id,
        serviceId: makeup.id,
        price: 12000,
        duration: 60,
      },
      {
        salonId: salon.id,
        serviceId: swedishMassage.id,
        price: 20000,
        duration: 60,
      },
    ],
  });

  // Create Availability for Therapists
  console.log('📅 Creating availability schedules...');
  const weekDays = [1, 2, 3, 4, 5]; // Monday to Friday
  const saturday = 6;

  for (const day of weekDays) {
    await prisma.availability.create({
      data: {
        therapistId: therapist1.id,
        dayOfWeek: day,
        startTime: '09h00',
        endTime: '18h00',
      },
    });

    await prisma.availability.create({
      data: {
        therapistId: therapist2.id,
        dayOfWeek: day,
        startTime: '08h00',
        endTime: '19h00',
      },
    });
  }

  // Saturday hours
  await prisma.availability.createMany({
    data: [
      {
        therapistId: therapist1.id,
        dayOfWeek: saturday,
        startTime: '10h00',
        endTime: '16h00',
      },
      {
        therapistId: therapist2.id,
        dayOfWeek: saturday,
        startTime: '08h00',
        endTime: '20h00',
      },
    ],
  });

  // Create Bookings
  console.log('📅 Creating bookings...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const booking1 = await prisma.booking.create({
    data: {
      userId: client1.id,
      therapistId: therapist1.id,
      scheduledAt: tomorrow,
      duration: 120,
      locationType: 'HOME',
      quarter: 'Akwa',
      landmark: 'Près de la pharmacie du rond-point',
      city: 'Douala',
      region: 'Littoral',
      latitude: 4.0511,
      longitude: 9.7679,
      instructions: 'Bâtiment bleu, 2ème étage',
      subtotal: 25000,
      travelFee: 2000,
      total: 27000,
      status: 'CONFIRMED',
    },
  });

  await prisma.bookingItem.create({
    data: {
      bookingId: booking1.id,
      serviceName: 'Deep Tissue French Massage',
      price: 25000,
      duration: 120,
    },
  });

  // Create Reviews
  console.log('⭐ Creating reviews...');
  await prisma.review.createMany({
    data: [
      {
        userId: client1.id,
        therapistId: therapist1.id,
        rating: 5,
        comment: 'Excellent service! Very professional and the results were amazing.',
        cleanliness: 5,
        professionalism: 5,
        value: 5,
      },
      {
        userId: client2.id,
        therapistId: therapist1.id,
        rating: 5,
        comment: 'Best massage I\'ve ever had. Will definitely come back!',
        cleanliness: 5,
        professionalism: 5,
        value: 4,
      },
      {
        userId: client1.id,
        salonId: salon.id,
        rating: 5,
        comment: 'Beautiful salon with great ambiance. Highly recommend!',
        cleanliness: 5,
        professionalism: 5,
        value: 4,
      },
    ],
  });

  // Create Favorites
  console.log('❤️ Creating favorites...');
  await prisma.favorite.createMany({
    data: [
      {
        userId: client1.id,
        therapistId: therapist1.id,
      },
      {
        userId: client1.id,
        salonId: salon.id,
      },
    ],
  });

  console.log('✅ Database seeding completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`- Users: ${await prisma.user.count()}`);
  console.log(`- Therapists: ${await prisma.therapist.count()}`);
  console.log(`- Salons: ${await prisma.salon.count()}`);
  console.log(`- Services: ${await prisma.service.count()}`);
  console.log(`- Bookings: ${await prisma.booking.count()}`);
  console.log(`- Reviews: ${await prisma.review.count()}`);
  console.log('');
  console.log('🔑 Test Credentials:');
  console.log('Email: elyna.dessui@email.com');
  console.log('Password: Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
