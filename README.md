# KmerServices

**Application mobile de services de beauté à la demande** basée sur la proximité géographique.

🇨🇲 **Marché** : Cameroun (Douala, Yaoundé)
💰 **Devise** : XAF (Franc CFA)
📱 **Paiements** : Orange Money & MTN Mobile Money (Flutterwave)

---

## 📋 Description

KmerServices est une application mobile permettant de réserver des services de beauté à la demande au Cameroun. L'application met en relation les clients avec deux types de prestataires :

1. **Indépendants mobiles** : Se déplacent au domicile du client
2. **Salons & Instituts** : Services sur place

Le système est basé sur la **géolocalisation** avec recherche par proximité optimisée via PostGIS.

---

## 🎨 Design

Le design est inspiré du projet **SIMONE - Private Beauty Service** avec :
- Palette minimaliste : Noir/Blanc + Accent Corail (#FF6B6B)
- Typographie épurée
- Design au pixel près avec Styled-components
- Focus sur la proximité géographique

📄 **Documentation design** : `DESIGN_ANALYSIS.md`

---

## 🏗️ Architecture

### Mobile
- **React Native** + **Expo** (~50.0.0)
- **TypeScript**
- **Styled-components** (design system complet)
- **Zustand** + **React Query**
- **React Navigation**
- **Expo Location** + **React Native Maps**
- **Flutterwave React Native**

📂 `mobile/` - [Voir README](./mobile/README.md)

### Backend
- **NestJS** 10.x
- **PostgreSQL** + **PostGIS** (Supabase)
- **Prisma** ORM
- **Passport** + **JWT**
- **Socket.io** (chat temps réel)
- **Flutterwave Node SDK**

📂 `backend/` - [Voir README](./backend/README.md)

---

## 📊 Schéma de Base de Données

### Modèles Principaux

```
User ─┬─> Address (multi-adresses)
      ├─> Booking
      ├─> Review
      └─> Favorite

Therapist ─┬─> TherapistService
           ├─> Availability
           ├─> Education
           ├─> Booking
           └─> Review

Salon ─┬─> SalonService
       ├─> Therapist (équipe)
       ├─> Booking
       └─> Review

Booking ─┬─> BookingItem
         ├─> Payment (Flutterwave)
         └─> Message (chat)

Service ─┬─> TherapistService
         └─> SalonService
```

### Spécificités Cameroun

- **Adresses** : Quartier + Point de repère (landmark)
- **Géolocalisation** : PostGIS avec index Gist
- **Téléphone** : Format +237 (obligatoire)
- **Devise** : XAF (tous les prix)
- **Paiement** : Orange Money, MTN Mobile Money, Carte

📄 **Voir schéma complet** : `backend/prisma/schema.prisma`

---

## 🚀 Stack Technique Complète

### Frontend Mobile
| Tech | Usage |
|------|-------|
| React Native + Expo | Framework mobile cross-platform |
| TypeScript | Typage fort |
| Styled-components | CSS-in-JS (design au pixel près) |
| React Navigation | Navigation |
| Zustand | State management |
| React Query | Data fetching & cache |
| React Hook Form + Zod | Forms & validation |
| Expo Location | Géolocalisation |
| React Native Maps | Cartes interactives |
| Flutterwave RN | Paiements mobile money |

### Backend API
| Tech | Usage |
|------|-------|
| NestJS | Framework Node.js |
| Prisma | ORM type-safe |
| PostgreSQL + PostGIS | Database + géospatial |
| Passport + JWT | Authentification |
| Socket.io | Chat temps réel |
| Flutterwave Node | Paiements API |
| Cloudinary | Stockage images |
| SendGrid | Emails |
| Twilio | SMS (Cameroun) |

### Infrastructure
| Service | Usage |
|---------|-------|
| Supabase | PostgreSQL + PostGIS hosting |
| Cloudinary | CDN images |
| Railway/Render | Backend hosting |
| EAS Build | Builds mobile (iOS/Android) |
| Google Maps API | Cartes + Places + Distance Matrix |

📄 **Documentation technique complète** : `TECHNICAL_STACK.md`

---

## 🇨🇲 Adaptations Cameroun

### Paiements Mobile Money
- **Orange Money** via Flutterwave
- **MTN Mobile Money** via Flutterwave
- Cartes bancaires (Visa/Mastercard)

### Format Données
- **Téléphone** : +237 6XX XXX XXX
- **Devise** : XAF (pas de centimes)
- **Prix** : 25 000 XAF, 5 000 XAF, etc.
- **Heures** : Format 24h (09h00 - 18h00)

### Géolocalisation
- Villes : Douala, Yaoundé, Bafoussam, Garoua, etc.
- Adresses : Quartier + Point de repère (obligatoire)
- Distance : Calcul optimisé avec PostGIS

### Notifications
- **Push** : Expo Push Notifications
- **SMS** : Twilio (important au Cameroun)
- **WhatsApp** : Support client (prévu)

📄 **Documentation complète** : `CAMEROON_ADAPTATIONS.md`

---

## 📦 Installation et Setup

### 1. Cloner le Repository

```bash
git clone https://github.com/patrickassako/kmerservices.git
cd kmerservices
```

### 2. Setup Mobile

```bash
cd mobile
npm install
cp .env.example .env
# Éditer .env avec vos clés API
npm start
```

📱 Scanner le QR code avec **Expo Go** sur votre téléphone

### 3. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Éditer .env avec votre DATABASE_URL Supabase
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

🚀 API disponible sur `http://localhost:3000`

### 4. Setup Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Activer PostGIS :
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
3. Copier la connection string dans `backend/.env`

---

## 📁 Structure du Projet

```
kmerservices/
├── mobile/                    # Application React Native
│   ├── src/
│   │   ├── design-system/    # Design tokens (colors, typography...)
│   │   ├── components/       # Composants réutilisables (atoms, molecules...)
│   │   ├── screens/          # Écrans (auth, home, search, booking...)
│   │   ├── navigation/       # Configuration navigation
│   │   ├── hooks/            # Custom hooks
│   │   ├── store/            # State management (Zustand)
│   │   ├── api/              # API calls
│   │   └── utils/            # Utilitaires
│   ├── App.tsx
│   ├── package.json
│   └── README.md
│
├── backend/                   # API NestJS
│   ├── src/
│   │   ├── auth/             # Authentification
│   │   ├── users/            # Utilisateurs
│   │   ├── therapists/       # Thérapeutes
│   │   ├── salons/           # Salons
│   │   ├── services/         # Services
│   │   ├── bookings/         # Réservations
│   │   ├── payments/         # Paiements Flutterwave
│   │   ├── chat/             # Chat temps réel
│   │   ├── notifications/    # Notifications
│   │   └── prisma/           # Prisma service
│   ├── prisma/
│   │   └── schema.prisma     # Schéma database
│   ├── package.json
│   └── README.md
│
├── UI design/                 # Maquettes Figma (PNG)
│
├── DESIGN_ANALYSIS.md         # Analyse du design SIMONE
├── TECHNICAL_STACK.md         # Stack technique détaillée
├── CAMEROON_ADAPTATIONS.md    # Spécificités Cameroun
└── README.md                  # Ce fichier
```

---

## 🎯 Fonctionnalités Principales

### Pour les Clients

- ✅ Authentification (Email, Google, Facebook, Apple)
- ✅ Recherche de services par proximité
- ✅ Filtrage (prix, distance, rating, catégorie)
- ✅ Vue liste ET carte interactive
- ✅ Réservation en ligne
- ✅ Paiement Orange Money / MTN Mobile Money
- ✅ Chat avec le prestataire
- ✅ Historique des réservations
- ✅ Avis et notations
- ✅ Favoris
- ✅ Multi-adresses (domicile, bureau)

### Pour les Prestataires

#### Indépendants Mobiles
- Zone de déplacement configurable
- Frais de déplacement
- Portfolio de travaux
- Calendrier de disponibilité
- Gestion des réservations

#### Salons & Instituts
- Profil établissement complet
- Galerie photos (ambiance)
- Équipe de thérapeutes
- Horaires d'ouverture
- Services proposés
- Localisation fixe

---

## 🚀 Roadmap

### Phase 1 : MVP (3 mois)
- ✅ Setup projet (mobile + backend)
- 🔄 Authentification complète
- 🔄 Profils utilisateurs
- 🔄 Catalogue de services
- 🔄 Recherche géolocalisée
- 🔄 Réservation basique
- 🔄 Paiement Flutterwave
- 🔄 Notifications push + SMS

### Phase 2 : Features Avancées (2 mois)
- Chat temps réel
- Avis et notations
- Favoris
- Historique
- Calendrier disponibilité
- Statistiques prestataires

### Phase 3 : Optimisation (1 mois)
- Tests unitaires + E2E
- Performance optimization
- SEO
- Analytics (Mixpanel)
- A/B Testing

### Phase 4 : Lancement (1 mois)
- Beta testing (Douala + Yaoundé)
- Marketing
- Support client
- Déploiement production
- App stores (iOS + Android)

---

## 💰 Estimation Coûts Mensuels

| Service | Coût/mois |
|---------|-----------|
| Supabase (DB) | $25 |
| Railway (Backend) | $20 |
| Cloudinary (Images) | $0-89 |
| Google Maps API | $0-50 |
| Flutterwave | 1.4% + 250 XAF par transaction |
| EAS Build | $29 |
| Sentry (Errors) | $26 |
| SendGrid (Emails) | $0-15 |
| Twilio (SMS) | ~$0.05/SMS |
| **TOTAL** | **~$100-250/mois** |

---

## 📖 Documentation

- [Analyse Design](./DESIGN_ANALYSIS.md) - Design system et UI/UX
- [Stack Technique](./TECHNICAL_STACK.md) - Architecture complète
- [Adaptations Cameroun](./CAMEROON_ADAPTATIONS.md) - Spécificités locales
- [Mobile README](./mobile/README.md) - App React Native
- [Backend README](./backend/README.md) - API NestJS

---

## 🤝 Contribution

1. Fork le projet
2. Créer une branche : `git checkout -b feature/ma-feature`
3. Commit : `git commit -m "Add: ma feature"`
4. Push : `git push origin feature/ma-feature`
5. Créer une Pull Request

---

## 📄 License

Propriétaire - KmerServices © 2025

---

## 👥 Équipe

**Développement** : Patrick Assako
**Design** : Inspiré de SIMONE (Behance)
**Marché** : Cameroun 🇨🇲

---

## 📞 Contact

- **Email** : support@kmerservices.com
- **WhatsApp** : +237 XXX XXX XXX
- **GitHub** : [github.com/patrickassako/kmerservices](https://github.com/patrickassako/kmerservices)

---

**Made with ❤️ for Cameroon** 🇨🇲
