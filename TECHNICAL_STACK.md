# Stack Technique - Application de Services de Beauté à la Demande

## 🎯 Objectif
Développer une application mobile cross-platform (iOS + Android) avec un **design respecté au pixel près**, basée sur la proximité géographique.

---

## 📱 Stack Technique Recommandée

### Option A : React Native + Expo (RECOMMANDÉE)

#### ✅ Pourquoi React Native + Expo ?

**Avantages pour votre projet :**
1. **Design au pixel près** ✨
   - Styled-components pour une correspondance exacte avec le design
   - Flexbox natif (comme le web)
   - Contrôle total sur chaque pixel
   - React Native Paper ou composants custom

2. **Cross-platform** 📱
   - Un seul code pour iOS et Android
   - 95% de code partagé
   - Rendu natif (pas de WebView)

3. **Écosystème riche** 🚀
   - Milliers de packages NPM
   - Grande communauté
   - Documentation excellente
   - Mises à jour fréquentes

4. **Géolocalisation** 📍
   - Expo Location (intégré)
   - React Native Maps (excellente intégration)
   - Geocoding intégré

5. **Développement rapide** ⚡
   - Hot reload
   - Expo Go pour tester sur device
   - OTA updates (mise à jour sans passer par les stores)
   - Build cloud avec EAS

6. **Performances** 🔥
   - Rendu natif
   - Animations 60fps avec Reanimated
   - Optimisations possibles

---

## 🏗️ Architecture Complète

### Frontend Mobile

```
React Native + Expo
├── TypeScript (typage fort)
├── UI Framework
│   ├── Styled-components (CSS-in-JS)
│   ├── React Native Reanimated (animations)
│   ├── React Native Gesture Handler
│   └── Composants custom (design system)
├── Navigation
│   └── React Navigation v6
│       ├── Bottom Tab Navigator
│       ├── Stack Navigator
│       └── Modal Navigator
├── State Management
│   ├── Zustand (state global léger)
│   └── React Query (data fetching & cache)
├── Forms & Validation
│   ├── React Hook Form
│   └── Zod (validation)
├── Géolocalisation
│   ├── Expo Location
│   ├── React Native Maps
│   └── Google Maps API
├── Notifications
│   └── Expo Notifications
├── Paiement
│   └── Stripe React Native SDK
├── Images
│   ├── Expo Image (optimisé)
│   └── React Native Fast Image
└── Utils
    ├── Date-fns (manipulation dates)
    ├── Axios (HTTP client)
    └── AsyncStorage (stockage local)
```

### Backend (API)

```
Node.js + NestJS
├── TypeScript
├── Architecture
│   ├── NestJS (framework structuré)
│   ├── REST API
│   └── GraphQL (optionnel, pour optimiser les requêtes)
├── Base de données
│   ├── PostgreSQL 15
│   ├── PostGIS (extension géospatiale)
│   └── Prisma ORM
├── Authentification
│   ├── Passport.js
│   ├── JWT (access + refresh tokens)
│   └── OAuth2 (Google, Facebook, Apple)
├── Géolocalisation
│   ├── PostGIS queries
│   ├── Google Maps Geocoding API
│   └── Google Maps Distance Matrix API
├── Temps réel
│   ├── Socket.io (chat)
│   └── WebSockets (notifications live)
├── Paiement
│   ├── Stripe API
│   └── Webhooks Stripe
├── Emails
│   ├── SendGrid ou Resend
│   └── Templates emails
├── Storage
│   ├── AWS S3 ou Cloudinary (images)
│   └── Upload optimisé
└── Sécurité
    ├── Helmet (headers)
    ├── Rate limiting
    ├── CORS
    └── Validation (class-validator)
```

### Infrastructure & Services

```
Cloud & DevOps
├── Hosting Backend
│   ├── Railway, Render ou Vercel
│   └── Docker (containerisation)
├── Base de données
│   ├── Supabase (PostgreSQL + PostGIS)
│   └── Ou Neon, Railway
├── Storage Images
│   └── Cloudinary (avec transformations)
├── Build Mobile
│   └── EAS Build (Expo Application Services)
├── CI/CD
│   ├── GitHub Actions
│   └── EAS Submit (déploiement stores)
├── Monitoring
│   ├── Sentry (error tracking)
│   └── Analytics (Mixpanel ou Amplitude)
├── Maps & Géolocalisation
│   ├── Google Maps Platform
│   │   ├── Maps SDK
│   │   ├── Places API
│   │   ├── Geocoding API
│   │   └── Distance Matrix API
│   └── Mapbox (alternative)
├── Notifications Push
│   ├── Expo Push Notifications
│   └── Firebase Cloud Messaging (backup)
├── Paiement
│   └── Stripe
│       ├── Payment Intents
│       ├── Stripe Connect (pour prestataires)
│       └── Webhooks
└── Environment
    ├── Development
    ├── Staging
    └── Production
```

---

## 📦 Packages Principaux

### Mobile (React Native + Expo)

```json
{
  "dependencies": {
    // Core
    "expo": "^50.0.0",
    "react": "18.2.0",
    "react-native": "0.73.0",
    "typescript": "^5.3.0",

    // Navigation
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "@react-navigation/stack": "^6.3.20",
    "react-native-screens": "^3.29.0",
    "react-native-safe-area-context": "^4.8.2",

    // UI & Styling
    "styled-components": "^6.1.8",
    "react-native-reanimated": "^3.6.1",
    "react-native-gesture-handler": "^2.14.1",
    "react-native-svg": "^14.1.0",

    // State Management
    "zustand": "^4.4.7",
    "@tanstack/react-query": "^5.17.0",

    // Forms
    "react-hook-form": "^7.49.3",
    "zod": "^3.22.4",

    // Géolocalisation & Maps
    "expo-location": "^16.5.3",
    "react-native-maps": "^1.10.0",
    "expo-task-manager": "^11.6.0",

    // API & Data
    "axios": "^1.6.5",
    "@react-native-async-storage/async-storage": "^1.21.0",

    // Notifications
    "expo-notifications": "^0.27.6",

    // Paiement
    "@stripe/stripe-react-native": "^0.35.0",

    // Images
    "expo-image": "^1.10.1",
    "expo-image-picker": "^14.7.1",

    // Utils
    "date-fns": "^3.0.6",
    "react-native-mmkv": "^2.11.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.45",
    "@types/react-native": "^0.72.8",
    "eslint": "^8.56.0",
    "prettier": "^3.1.1"
  }
}
```

### Backend (NestJS)

```json
{
  "dependencies": {
    // Core
    "@nestjs/core": "^10.3.0",
    "@nestjs/common": "^10.3.0",
    "@nestjs/platform-express": "^10.3.0",
    "typescript": "^5.3.3",

    // Database
    "@prisma/client": "^5.8.0",
    "prisma": "^5.8.0",

    // Auth
    "@nestjs/passport": "^10.0.3",
    "@nestjs/jwt": "^10.2.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "bcrypt": "^5.1.1",

    // Validation
    "class-validator": "^0.14.1",
    "class-transformer": "^0.5.1",

    // Config
    "@nestjs/config": "^3.1.1",
    "dotenv": "^16.3.1",

    // WebSockets & Real-time
    "@nestjs/websockets": "^10.3.0",
    "@nestjs/platform-socket.io": "^10.3.0",
    "socket.io": "^4.6.0",

    // APIs externes
    "@googlemaps/google-maps-services-js": "^3.3.42",
    "stripe": "^14.10.0",

    // Storage
    "cloudinary": "^1.41.1",

    // Email
    "@sendgrid/mail": "^8.1.0",

    // Utils
    "date-fns": "^3.0.6",
    "axios": "^1.6.5"
  },
  "devDependencies": {
    "@types/node": "^20.10.6",
    "@types/bcrypt": "^5.0.2",
    "@types/passport-jwt": "^4.0.0",
    "eslint": "^8.56.0",
    "prettier": "^3.1.1"
  }
}
```

---

## 🎨 Design System Implementation

### Structure des fichiers

```
src/
├── design-system/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   ├── shadows.ts
│   ├── radius.ts
│   └── theme.ts
├── components/
│   ├── atoms/
│   │   ├── Button/
│   │   │   ├── PrimaryButton.tsx
│   │   │   ├── SecondaryButton.tsx
│   │   │   └── styles.ts
│   │   ├── Input/
│   │   ├── Badge/
│   │   ├── Avatar/
│   │   └── Icon/
│   ├── molecules/
│   │   ├── SearchBar/
│   │   ├── ServiceCard/
│   │   ├── SalonCard/
│   │   ├── TherapistCard/
│   │   └── BookingCard/
│   ├── organisms/
│   │   ├── Header/
│   │   ├── BottomNav/
│   │   ├── FilterModal/
│   │   ├── ServiceList/
│   │   └── SalonList/
│   └── templates/
│       ├── HomeTemplate/
│       ├── SearchTemplate/
│       └── BookingTemplate/
```

### Exemple de Design Tokens

```typescript
// design-system/colors.ts
export const colors = {
  // Primary
  black: '#2D2D2D',
  charcoal: '#1A1A1A',
  white: '#FFFFFF',

  // Accent
  coral: '#FF6B6B',
  coralLight: '#FF8B8B',

  // Neutrals
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray400: '#6B6B6B',
  gray600: '#4A4A4A',

  // Functional
  gold: '#FFB800',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',

  // Backgrounds
  background: '#FFFFFF',
  backgroundSecondary: '#F5F5F5',
} as const;

// design-system/typography.ts
export const typography = {
  // Font Family
  fontFamily: {
    regular: 'System', // Ou une custom font
    medium: 'System-Medium',
    semibold: 'System-Semibold',
    bold: 'System-Bold',
  },

  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 24,
    '2xl': 32,
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6,
  },

  // Font Weights
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

// design-system/spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const;

// design-system/radius.ts
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 24,
  full: 9999,
} as const;

// design-system/shadows.ts
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;
```

### Exemple de Composant au Pixel Près

```typescript
// components/atoms/Button/PrimaryButton.tsx
import styled from 'styled-components/native';
import { colors, spacing, radius, shadows, typography } from '@/design-system';

export const PrimaryButton = styled.TouchableOpacity<{ disabled?: boolean }>`
  background-color: ${({ disabled }) =>
    disabled ? colors.gray400 : colors.charcoal};
  height: 56px;
  border-radius: ${radius.pill}px;
  padding: 0 ${spacing['2xl']}px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  ${shadows.sm}

  ${({ disabled }) => disabled && `
    opacity: 0.5;
  `}
`;

export const ButtonText = styled.Text`
  color: ${colors.white};
  font-size: ${typography.fontSize.base}px;
  font-weight: ${typography.fontWeight.semibold};
  font-family: ${typography.fontFamily.semibold};
  margin-left: ${spacing.md}px;
`;

export const IconWrapper = styled.View`
  width: 32px;
  height: 32px;
  border-radius: ${radius.full}px;
  background-color: ${colors.white}20;
  align-items: center;
  justify-content: center;
`;
```

---

## 🗂️ Structure du Projet

```
kmerservices/
├── mobile/                          # Application React Native
│   ├── src/
│   │   ├── design-system/          # Tokens de design
│   │   ├── components/             # Composants réutilisables
│   │   ├── screens/                # Écrans de l'app
│   │   │   ├── auth/
│   │   │   │   ├── SplashScreen.tsx
│   │   │   │   ├── OnboardingScreen.tsx
│   │   │   │   ├── LoginScreen.tsx
│   │   │   │   └── SignUpScreen.tsx
│   │   │   ├── home/
│   │   │   │   └── HomeScreen.tsx
│   │   │   ├── search/
│   │   │   │   ├── SearchScreen.tsx
│   │   │   │   └── FilterModal.tsx
│   │   │   ├── service/
│   │   │   │   ├── ServiceListScreen.tsx
│   │   │   │   └── ServiceDetailScreen.tsx
│   │   │   ├── salon/
│   │   │   │   ├── SalonListScreen.tsx
│   │   │   │   └── SalonDetailScreen.tsx
│   │   │   ├── booking/
│   │   │   │   ├── BookingScreen.tsx
│   │   │   │   ├── CheckoutScreen.tsx
│   │   │   │   └── BookingListScreen.tsx
│   │   │   ├── profile/
│   │   │   │   └── ProfileScreen.tsx
│   │   │   └── therapist/
│   │   │       └── TherapistDetailScreen.tsx
│   │   ├── navigation/             # Configuration navigation
│   │   ├── hooks/                  # Custom hooks
│   │   ├── store/                  # State management (Zustand)
│   │   ├── api/                    # API calls
│   │   ├── utils/                  # Fonctions utilitaires
│   │   ├── types/                  # TypeScript types
│   │   ├── assets/                 # Images, fonts, icons
│   │   └── App.tsx
│   ├── app.json
│   ├── package.json
│   ├── tsconfig.json
│   └── eas.json
│
├── backend/                         # API NestJS
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── services/
│   │   ├── salons/
│   │   ├── therapists/
│   │   ├── bookings/
│   │   ├── payments/
│   │   ├── chat/
│   │   ├── notifications/
│   │   ├── geolocation/
│   │   ├── reviews/
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── package.json
│   ├── tsconfig.json
│   └── nest-cli.json
│
├── shared/                          # Code partagé (types, utils)
│   └── types/
│
├── docs/                           # Documentation
│   ├── DESIGN_ANALYSIS.md
│   ├── TECHNICAL_STACK.md
│   └── API_DOCUMENTATION.md
│
├── .github/
│   └── workflows/
│       ├── mobile-ci.yml
│       └── backend-ci.yml
│
└── README.md
```

---

## 🗄️ Schéma de Base de Données

### Prisma Schema (avec PostGIS)

```prisma
// prisma/schema.prisma

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [postgis]
}

// ============ USERS ============

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  phone         String?   @unique
  password      String
  firstName     String
  lastName      String
  avatar        String?
  role          UserRole  @default(CLIENT)

  // Adresses multiples
  addresses     Address[]

  // Relations
  bookings      Booking[]
  reviews       Review[]
  favorites     Favorite[]

  // Prestataire info (si role = PROVIDER)
  therapist     Therapist?
  salon         Salon?

  // Social Auth
  googleId      String?   @unique
  facebookId    String?   @unique
  appleId       String?   @unique

  // Metadata
  isVerified    Boolean   @default(false)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("users")
}

enum UserRole {
  CLIENT
  PROVIDER
  ADMIN
}

model Address {
  id            String    @id @default(uuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  label         String    // "Domicile", "Bureau", etc.
  street        String
  city          String
  postalCode    String
  country       String    @default("France")

  // Géolocalisation (PostGIS)
  location      Unsupported("geometry(Point, 4326)")
  latitude      Float
  longitude     Float

  // Instructions
  instructions  String?   // Code porte, étage, etc.

  isPrimary     Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([location], type: Gist)
  @@map("addresses")
}

// ============ THERAPISTS (Indépendants) ============

model Therapist {
  id                String    @id @default(uuid())
  userId            String    @unique
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Info professionnelle
  bio               String?
  experience        Int       // Années d'expérience
  isLicensed        Boolean   @default(false)
  licenseNumber     String?

  // Mobilité
  isMobile          Boolean   @default(true)
  travelRadius      Int       // En km
  travelFee         Float?    // Frais de déplacement

  // Location de base (domicile du thérapeute)
  location          Unsupported("geometry(Point, 4326)")
  latitude          Float
  longitude         Float
  city              String

  // Portfolio
  portfolioImages   String[]

  // Salon affilié (optionnel)
  salonId           String?
  salon             Salon?    @relation(fields: [salonId], references: [id])

  // Services proposés
  services          TherapistService[]

  // Disponibilité
  availability      Availability[]

  // Relations
  bookings          Booking[]
  reviews           Review[]
  education         Education[]

  // Stats
  rating            Float     @default(0)
  reviewCount       Int       @default(0)
  bookingCount      Int       @default(0)

  isActive          Boolean   @default(true)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([location], type: Gist)
  @@index([isMobile])
  @@index([isActive])
  @@map("therapists")
}

model Education {
  id            String    @id @default(uuid())
  therapistId   String
  therapist     Therapist @relation(fields: [therapistId], references: [id], onDelete: Cascade)

  title         String    // "Diploma in Esthetics from Paris..."
  institution   String?
  year          Int?

  createdAt     DateTime  @default(now())

  @@map("education")
}

// ============ SALONS ============

model Salon {
  id                String    @id @default(uuid())
  userId            String    @unique
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  name              String
  description       String?

  // Location
  street            String
  city              String
  postalCode        String
  country           String    @default("France")
  location          Unsupported("geometry(Point, 4326)")
  latitude          Float
  longitude         Float

  // Images
  logo              String?
  coverImage        String?
  ambianceImages    String[]  // Photos de l'intérieur

  // Informations
  establishedYear   Int?
  features          String[]  // ["Priority to Individual", "Organic-based services", ...]

  // Horaires
  openingHours      Json      // { "monday": { "open": "09:00", "close": "19:00" }, ... }

  // Équipe
  therapists        Therapist[]

  // Services
  services          SalonService[]

  // Relations
  bookings          Booking[]
  reviews           Review[]

  // Stats
  rating            Float     @default(0)
  reviewCount       Int       @default(0)
  serviceCount      Int       @default(0)

  // Metadata
  isActive          Boolean   @default(true)
  isVerified        Boolean   @default(false)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([location], type: Gist)
  @@index([isActive])
  @@map("salons")
}

// ============ SERVICES ============

model Service {
  id            String    @id @default(uuid())

  name          String
  description   String?
  category      Category

  // Images
  images        String[]

  // Détails
  components    Json?     // Description détaillée des étapes
  purpose       String?
  idealFor      String?   // Candidats idéaux

  duration      Int       // En minutes
  basePrice     Float

  // Relations
  therapistServices TherapistService[]
  salonServices     SalonService[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("services")
}

enum Category {
  HAIRDRESSING
  EYE_CARE
  WELLNESS_MASSAGE
  FACIAL
  NAIL_CARE
  MAKEUP
  WAXING
  OTHER
}

// Table de liaison : Thérapeute <-> Service
model TherapistService {
  id            String    @id @default(uuid())

  therapistId   String
  therapist     Therapist @relation(fields: [therapistId], references: [id], onDelete: Cascade)

  serviceId     String
  service       Service   @relation(fields: [serviceId], references: [id], onDelete: Cascade)

  // Prix personnalisé (override basePrice si défini)
  price         Float?
  duration      Int?      // Override duration si différent

  isActive      Boolean   @default(true)

  @@unique([therapistId, serviceId])
  @@map("therapist_services")
}

// Table de liaison : Salon <-> Service
model SalonService {
  id            String    @id @default(uuid())

  salonId       String
  salon         Salon     @relation(fields: [salonId], references: [id], onDelete: Cascade)

  serviceId     String
  service       Service   @relation(fields: [serviceId], references: [id], onDelete: Cascade)

  price         Float?
  duration      Int?

  isActive      Boolean   @default(true)

  @@unique([salonId, serviceId])
  @@map("salon_services")
}

// ============ BOOKINGS ============

model Booking {
  id            String        @id @default(uuid())

  // Client
  userId        String
  user          User          @relation(fields: [userId], references: [id])

  // Prestataire (soit therapist, soit salon)
  therapistId   String?
  therapist     Therapist?    @relation(fields: [therapistId], references: [id])

  salonId       String?
  salon         Salon?        @relation(fields: [salonId], references: [id])

  // Service(s)
  items         BookingItem[]

  // Date & heure
  scheduledAt   DateTime
  duration      Int           // Total en minutes

  // Location
  locationType  LocationType
  address       String?       // Si à domicile
  location      Unsupported("geometry(Point, 4326)")?
  latitude      Float?
  longitude     Float?

  // Prix
  subtotal      Float
  travelFee     Float         @default(0)
  tip           Float         @default(0)
  total         Float

  // Statut
  status        BookingStatus @default(PENDING)

  // Paiement
  paymentId     String?
  payment       Payment?

  // Chat
  messages      Message[]

  // Annulation
  cancelledAt   DateTime?
  cancelReason  String?

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([userId])
  @@index([therapistId])
  @@index([salonId])
  @@index([scheduledAt])
  @@index([status])
  @@map("bookings")
}

enum LocationType {
  HOME      // À domicile
  SALON     // En salon
}

enum BookingStatus {
  PENDING
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
}

model BookingItem {
  id            String    @id @default(uuid())

  bookingId     String
  booking       Booking   @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  serviceName   String    // Snapshot du nom
  price         Float
  duration      Int

  createdAt     DateTime  @default(now())

  @@map("booking_items")
}

// ============ PAYMENTS ============

model Payment {
  id                String        @id @default(uuid())

  bookingId         String        @unique
  booking           Booking       @relation(fields: [bookingId], references: [id])

  amount            Float
  currency          String        @default("EUR")

  method            PaymentMethod
  status            PaymentStatus @default(PENDING)

  // Stripe
  stripePaymentId   String?       @unique
  stripeCustomerId  String?

  // Metadata
  metadata          Json?

  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  @@map("payments")
}

enum PaymentMethod {
  CARD
  APPLE_PAY
  GOOGLE_PAY
  PAYPAL
}

enum PaymentStatus {
  PENDING
  PROCESSING
  SUCCEEDED
  FAILED
  REFUNDED
}

// ============ REVIEWS ============

model Review {
  id            String    @id @default(uuid())

  userId        String
  user          User      @relation(fields: [userId], references: [id])

  // Review pour thérapeute OU salon
  therapistId   String?
  therapist     Therapist? @relation(fields: [therapistId], references: [id])

  salonId       String?
  salon         Salon?     @relation(fields: [salonId], references: [id])

  rating        Int       // 1-5
  comment       String?

  // Criteria (optionnel)
  cleanliness   Int?
  professionalism Int?
  value         Int?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([therapistId])
  @@index([salonId])
  @@index([rating])
  @@map("reviews")
}

// ============ FAVORITES ============

model Favorite {
  id            String    @id @default(uuid())

  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  therapistId   String?
  salonId       String?

  createdAt     DateTime  @default(now())

  @@unique([userId, therapistId])
  @@unique([userId, salonId])
  @@map("favorites")
}

// ============ AVAILABILITY ============

model Availability {
  id            String    @id @default(uuid())

  therapistId   String
  therapist     Therapist @relation(fields: [therapistId], references: [id], onDelete: Cascade)

  dayOfWeek     Int       // 0 = Dimanche, 6 = Samedi
  startTime     String    // "09:00"
  endTime       String    // "18:00"

  isActive      Boolean   @default(true)

  @@map("availability")
}

// ============ CHAT ============

model Message {
  id            String    @id @default(uuid())

  bookingId     String
  booking       Booking   @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  senderId      String
  content       String
  type          MessageType @default(TEXT)

  // Attachments
  attachments   String[]

  isRead        Boolean   @default(false)

  createdAt     DateTime  @default(now())

  @@index([bookingId])
  @@index([createdAt])
  @@map("messages")
}

enum MessageType {
  TEXT
  IMAGE
  SERVICE_SUGGESTION
  SYSTEM
}
```

---

## 🚀 Plan de Développement

### Phase 1 : Setup & Infrastructure (Semaine 1)

**Mobile**
- [ ] Initialiser projet Expo
- [ ] Configurer TypeScript
- [ ] Installer dépendances principales
- [ ] Créer design system (tokens)
- [ ] Configurer navigation (React Navigation)
- [ ] Setup ESLint + Prettier

**Backend**
- [ ] Initialiser projet NestJS
- [ ] Configurer PostgreSQL + PostGIS
- [ ] Setup Prisma
- [ ] Créer schéma DB
- [ ] Migrations initiales
- [ ] Setup Auth (JWT)

**DevOps**
- [ ] Setup GitHub repository
- [ ] Configuration CI/CD
- [ ] Environment variables
- [ ] Setup Supabase (DB)

### Phase 2 : Design System & Composants de Base (Semaine 2)

- [ ] Créer tous les atoms (Button, Input, Badge, etc.)
- [ ] Créer molecules (Cards, SearchBar, etc.)
- [ ] Créer organisms (Header, BottomNav, etc.)
- [ ] Tests visuels avec Storybook (optionnel)
- [ ] Animations de base

### Phase 3 : Authentification (Semaine 3)

**Mobile**
- [ ] Splash Screen
- [ ] Onboarding (3 écrans)
- [ ] Login Screen
- [ ] Sign Up Screen
- [ ] Forgot Password
- [ ] Social Auth (Google, Facebook, Apple)

**Backend**
- [ ] Auth module (JWT)
- [ ] OAuth2 integration
- [ ] Password reset flow
- [ ] Email verification

### Phase 4 : Écrans Principaux (Semaines 4-6)

**Home**
- [ ] Home Screen (logged in / logged out)
- [ ] Tabs Home/Institute
- [ ] Sections (Recommended, Categories, Packages, etc.)
- [ ] Upcoming Bookings widget

**Search & Filters**
- [ ] Search Bar avec autocomplete
- [ ] Filter Modal
- [ ] Results List/Grid
- [ ] Sorting options

**Service Screens**
- [ ] Service List (par catégorie)
- [ ] Service Detail
- [ ] Service Components (accordions)

**Salon Screens**
- [ ] Salon List (Near Me, Popular, etc.)
- [ ] Salon Detail
- [ ] Ambiance gallery
- [ ] Features grid
- [ ] Therapist list

**Therapist Screens**
- [ ] Therapist Detail
- [ ] Education (accordion)
- [ ] Portfolio (accordion)
- [ ] Reviews (accordion)

### Phase 5 : Géolocalisation (Semaine 7)

**Mobile**
- [ ] Location permissions
- [ ] Get current location
- [ ] Map view (React Native Maps)
- [ ] Markers (salons, therapists)
- [ ] Distance calculation
- [ ] Address autocomplete (Google Places)

**Backend**
- [ ] PostGIS queries (nearby search)
- [ ] Distance Matrix API integration
- [ ] Geocoding endpoints

### Phase 6 : Booking Flow (Semaines 8-9)

**Mobile**
- [ ] Check Availability Screen
- [ ] Select Therapist
- [ ] Time & Date picker
- [ ] Location selection
- [ ] Checkout Step 1 (Review Service)
- [ ] Checkout Step 2 (Payment)
- [ ] Checkout Step 3 (Confirmation)
- [ ] Order Complete

**Backend**
- [ ] Booking creation
- [ ] Availability check
- [ ] Slot management
- [ ] Notification triggers

### Phase 7 : Paiement (Semaine 10)

**Mobile**
- [ ] Stripe integration
- [ ] Card input
- [ ] Apple Pay
- [ ] Payment confirmation

**Backend**
- [ ] Stripe API setup
- [ ] Payment intents
- [ ] Webhooks
- [ ] Refund handling

### Phase 8 : Chat & Real-time (Semaine 11)

**Mobile**
- [ ] Chat UI
- [ ] Message input
- [ ] Service suggestions in chat
- [ ] Real-time updates

**Backend**
- [ ] Socket.io setup
- [ ] Chat rooms
- [ ] Message storage
- [ ] Push notifications

### Phase 9 : Profil & Bookings (Semaine 12)

**Mobile**
- [ ] Profile Screen
- [ ] Edit Profile
- [ ] Switch to Seller mode
- [ ] Bookings List
- [ ] Booking Detail
- [ ] Cancel booking

**Backend**
- [ ] User profile CRUD
- [ ] Booking history
- [ ] Cancellation logic

### Phase 10 : Reviews & Favorites (Semaine 13)

**Mobile**
- [ ] Review creation
- [ ] Review display
- [ ] Favorites management
- [ ] Rating system

**Backend**
- [ ] Review CRUD
- [ ] Rating calculation
- [ ] Favorites endpoints

### Phase 11 : Notifications (Semaine 14)

- [ ] Expo Push Notifications setup
- [ ] Local notifications
- [ ] Remote notifications
- [ ] Notification preferences

### Phase 12 : Polish & Testing (Semaines 15-16)

- [ ] Error handling
- [ ] Loading states
- [ ] Empty states
- [ ] Animations polish
- [ ] Performance optimization
- [ ] E2E tests
- [ ] Bug fixing

### Phase 13 : Déploiement (Semaine 17)

**Mobile**
- [ ] EAS Build configuration
- [ ] iOS build
- [ ] Android build
- [ ] TestFlight (iOS)
- [ ] Google Play Internal Testing

**Backend**
- [ ] Production deployment (Railway/Render)
- [ ] Database migration
- [ ] Environment configuration
- [ ] Monitoring setup

---

## 💰 Estimation des Coûts (Mensuel)

### Services Cloud

| Service | Usage | Coût/mois |
|---------|-------|-----------|
| **Supabase** (PostgreSQL + PostGIS) | Starter | $25 |
| **Cloudinary** (Images) | Free tier → Paid | $0-89 |
| **Railway/Render** (Backend hosting) | Starter | $20 |
| **Google Maps API** | ~10k requests | $0-50 |
| **Stripe** | Transaction fees | 1.4% + 0.25€ |
| **Expo EAS** (Builds) | Production | $29 |
| **Sentry** (Error tracking) | Developer | $26 |
| **SendGrid** (Emails) | Free tier | $0-15 |
| **Total estimé** | | **~$100-250/mois** |

---

## ✅ Checklist de Démarrage

### Prérequis
- [ ] Node.js 18+ installé
- [ ] npm ou yarn installé
- [ ] Expo CLI installé (`npm install -g expo-cli`)
- [ ] Compte Expo créé
- [ ] PostgreSQL installé (local) ou compte Supabase
- [ ] Compte Stripe (mode test)
- [ ] Google Cloud Platform account (Maps API)
- [ ] Git configuré

### Comptes à créer
- [ ] Expo Account
- [ ] Supabase Account
- [ ] Railway/Render Account
- [ ] Cloudinary Account
- [ ] Stripe Account
- [ ] Google Cloud Platform Account
- [ ] SendGrid Account
- [ ] Sentry Account

### API Keys nécessaires
- [ ] Google Maps API Key
- [ ] Stripe Public & Secret Keys
- [ ] Cloudinary API credentials
- [ ] SendGrid API Key
- [ ] Expo Push Notification token

---

## 📚 Documentation & Ressources

### Official Docs
- [React Native](https://reactnative.dev/)
- [Expo](https://docs.expo.dev/)
- [NestJS](https://docs.nestjs.com/)
- [Prisma](https://www.prisma.io/docs/)
- [React Navigation](https://reactnavigation.org/)
- [Stripe React Native](https://stripe.com/docs/mobile/react-native)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)

### Tutorials
- Expo + TypeScript Setup
- React Navigation Setup
- Styled-components in React Native
- PostGIS with Prisma
- Stripe Payment Integration
- Socket.io Real-time Chat

---

## 🎯 Prochaine Étape

**Je suis prêt à initialiser le projet maintenant !**

Voulez-vous que je :
1. ✅ **Initialise le projet mobile (Expo + TypeScript)** ?
2. ✅ **Crée le design system complet** ?
3. ✅ **Initialise le backend (NestJS + Prisma)** ?
4. ✅ **Crée les premiers composants** ?

Ou préférez-vous commencer par une étape spécifique ?
