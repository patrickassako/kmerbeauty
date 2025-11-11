# KmerServices Backend

Backend API NestJS pour l'application de services de beauté à la demande au Cameroun.

## 🚀 Stack Technique

- **NestJS** 10.x (Framework Node.js)
- **TypeScript**
- **PostgreSQL** avec **PostGIS** (via Supabase)
- **Prisma** ORM
- **Passport** + **JWT** (authentification)
- **Socket.io** (chat temps réel)
- **Flutterwave** (paiements Orange Money & MTN Mobile Money)
- **Cloudinary** (stockage images)
- **SendGrid** (emails)
- **Twilio** (SMS)

## 📦 Installation

```bash
# Installer les dépendances
npm install

# ou
yarn install
```

## 🔑 Configuration

1. Copier `.env.example` vers `.env`
2. Remplir les variables d'environnement :

```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"

# JWT
JWT_SECRET=your-secret-key

# Flutterwave
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxxxx
FLUTTERWAVE_SECRET_KEY=FLWSECK-xxxxx

# Cloudinary
CLOUDINARY_CLOUD_NAME=xxxxx
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx
```

## 🗄️ Database Setup

### 1. Créer une base de données Supabase

1. Aller sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet
3. Activer l'extension PostGIS :
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
4. Copier la connection string dans `DATABASE_URL`

### 2. Générer le client Prisma

```bash
npm run prisma:generate
```

### 3. Créer les tables

```bash
npm run prisma:migrate
```

### 4. (Optionnel) Seed la base de données

```bash
npm run prisma:seed
```

### 5. Ouvrir Prisma Studio

```bash
npm run prisma:studio
```

## 🏃‍♂️ Lancer l'Application

```bash
# Développement (avec hot reload)
npm run start:dev

# Production
npm run build
npm run start:prod
```

L'API sera disponible sur `http://localhost:3000`

## 📁 Structure du Projet

```
backend/
├── prisma/
│   ├── schema.prisma          # Schéma de base de données
│   ├── migrations/            # Migrations SQL
│   └── seed.ts                # Données de test
│
├── src/
│   ├── auth/                  # Authentification (JWT, OAuth)
│   ├── users/                 # Gestion utilisateurs
│   ├── therapists/            # Gestion thérapeutes
│   ├── salons/                # Gestion salons
│   ├── services/              # Gestion services
│   ├── bookings/              # Gestion réservations
│   ├── payments/              # Paiements Flutterwave
│   ├── chat/                  # Chat temps réel
│   ├── notifications/         # Notifications push & SMS
│   ├── geolocation/           # Recherche géolocalisée
│   ├── reviews/               # Avis et notations
│   ├── prisma/                # Prisma service (global)
│   ├── app.module.ts          # Module principal
│   └── main.ts                # Point d'entrée
│
├── test/                      # Tests E2E
├── .env.example              # Template variables d'environnement
├── nest-cli.json             # Configuration NestJS
├── tsconfig.json             # Configuration TypeScript
└── package.json
```

## 🛠️ Scripts Disponibles

```bash
# Développement
npm run start:dev          # Démarrer en mode dev avec hot reload
npm run start:debug        # Démarrer en mode debug

# Production
npm run build              # Build l'application
npm run start:prod         # Démarrer en production

# Database
npm run prisma:generate    # Générer le client Prisma
npm run prisma:migrate     # Créer/appliquer migrations
npm run prisma:studio      # Ouvrir Prisma Studio (GUI)
npm run prisma:seed        # Seed la base de données

# Quality
npm run lint               # Linter le code
npm run format             # Formatter le code (Prettier)
npm run test               # Lancer les tests
npm run test:cov           # Coverage des tests
```

## 🇨🇲 Spécificités Cameroun

### Devise
- **XAF** (Franc CFA) - tous les montants sont en XAF
- Pas de centimes (arrondir les montants)

### Paiements
- **Orange Money** (Orange Cameroun)
- **MTN Mobile Money** (MTN Cameroun)
- Cartes bancaires (Visa/Mastercard)

### Géolocalisation
- Format d'adresse camerounais avec **quartier** et **point de repère**
- Villes principales : Douala, Yaoundé, Bafoussam, etc.
- PostGIS pour recherches géospatiales optimisées

### Téléphone
- Format : **+237 6XX XXX XXX**
- Obligatoire pour tous les utilisateurs

### Langues
- Français (par défaut)
- Anglais (optionnel)

## 📡 Endpoints API

### Authentification
- `POST /api/v1/auth/register` - Inscription
- `POST /api/v1/auth/login` - Connexion
- `POST /api/v1/auth/refresh` - Refresh token

### Users
- `GET /api/v1/users/me` - Profil actuel
- `PATCH /api/v1/users/me` - Modifier profil
- `POST /api/v1/users/addresses` - Ajouter une adresse

### Services
- `GET /api/v1/services` - Liste des services
- `GET /api/v1/services/:id` - Détails d'un service

### Therapists
- `GET /api/v1/therapists` - Liste des thérapeutes
- `GET /api/v1/therapists/nearby?lat=4.0511&lng=9.7679&radius=5` - Près de moi

### Salons
- `GET /api/v1/salons` - Liste des salons
- `GET /api/v1/salons/nearby?lat=4.0511&lng=9.7679&radius=5` - Près de moi

### Bookings
- `POST /api/v1/bookings` - Créer une réservation
- `GET /api/v1/bookings` - Mes réservations
- `GET /api/v1/bookings/:id` - Détails réservation
- `PATCH /api/v1/bookings/:id/cancel` - Annuler

### Payments
- `POST /api/v1/payments/flutterwave/initiate` - Initier paiement
- `POST /api/v1/payments/flutterwave/verify` - Vérifier paiement
- `POST /api/v1/payments/flutterwave/webhook` - Webhook Flutterwave

### Chat
- WebSocket sur `/chat`
- `GET /api/v1/bookings/:id/messages` - Historique messages

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests E2E
npm run test:e2e

# Coverage
npm run test:cov
```

## 🚢 Déploiement

### Option 1 : Railway

```bash
# Installer Railway CLI
npm install -g railway

# Login
railway login

# Créer un projet
railway init

# Déployer
railway up
```

### Option 2 : Render

1. Créer un nouveau Web Service sur [render.com](https://render.com)
2. Connecter le repository GitHub
3. Configurer les variables d'environnement
4. Déployer

### Option 3 : Vercel (Serverless)

```bash
# Installer Vercel CLI
npm install -g vercel

# Déployer
vercel
```

## 📊 Monitoring

- **Sentry** : Error tracking
- **Prisma Studio** : Database GUI
- **Logs** : Console logs (dev) ou service externe (prod)

## 🔐 Sécurité

- ✅ Validation des données (class-validator)
- ✅ JWT avec refresh tokens
- ✅ Rate limiting
- ✅ CORS configuré
- ✅ Helmet headers
- ✅ Sanitization des inputs

## 📖 Documentation

- [NestJS](https://docs.nestjs.com/)
- [Prisma](https://www.prisma.io/docs/)
- [PostgreSQL + PostGIS](https://postgis.net/)
- [Flutterwave](https://developer.flutterwave.com/)
- [Supabase](https://supabase.com/docs)

## 🤝 Contribution

1. Créer une branche : `git checkout -b feature/ma-feature`
2. Commit : `git commit -m "Add: ma feature"`
3. Push : `git push origin feature/ma-feature`
4. Créer une Pull Request

## 📄 License

Propriétaire - KmerServices © 2025
