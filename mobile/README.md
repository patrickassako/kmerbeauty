# KmerServices Mobile

Application mobile React Native (Expo) pour services de beauté à la demande au Cameroun.

## 🚀 Stack Technique

- **React Native** + **Expo** (~50.0.0)
- **TypeScript**
- **Styled-components** (CSS-in-JS pour design au pixel près)
- **React Navigation** (navigation)
- **Zustand** (state management)
- **React Query** (data fetching & cache)
- **React Hook Form** + **Zod** (forms & validation)
- **Expo Location** + **React Native Maps** (géolocalisation)
- **Flutterwave** (paiements Orange Money & MTN Mobile Money)
- **Supabase** (backend)

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
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxxxx
EXPO_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxxxx
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=xxxxx
```

## 🏃‍♂️ Lancer l'Application

```bash
# Démarrer le serveur de développement
npm start

# Lancer sur iOS
npm run ios

# Lancer sur Android
npm run android

# Lancer sur Web
npm run web
```

## 📱 Tester sur Device

1. Installer **Expo Go** sur votre téléphone
2. Scanner le QR code affiché dans le terminal
3. L'app se lancera dans Expo Go

## 🏗️ Structure du Projet

```
mobile/
├── src/
│   ├── design-system/        # Design tokens (colors, typography, etc.)
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   ├── radius.ts
│   │   ├── shadows.ts
│   │   ├── theme.ts
│   │   └── index.ts
│   │
│   ├── components/            # Composants réutilisables
│   │   ├── atoms/            # Composants de base
│   │   │   ├── Button/
│   │   │   ├── Text/
│   │   │   ├── Input/
│   │   │   ├── Badge/
│   │   │   └── ...
│   │   ├── molecules/        # Composants moyens
│   │   ├── organisms/        # Composants complexes
│   │   └── templates/        # Templates de pages
│   │
│   ├── screens/              # Écrans de l'application
│   │   ├── auth/            # Authentification
│   │   ├── home/            # Accueil
│   │   ├── search/          # Recherche
│   │   ├── service/         # Services
│   │   ├── salon/           # Salons
│   │   ├── booking/         # Réservations
│   │   ├── profile/         # Profil
│   │   └── therapist/       # Thérapeutes
│   │
│   ├── navigation/           # Configuration navigation
│   ├── hooks/                # Custom hooks
│   ├── store/                # State management (Zustand)
│   ├── api/                  # API calls
│   ├── utils/                # Fonctions utilitaires
│   ├── types/                # TypeScript types
│   └── assets/               # Images, icons, fonts
│
├── App.tsx                   # Point d'entrée
├── app.json                  # Configuration Expo
├── package.json
├── tsconfig.json
└── babel.config.js
```

## 🎨 Design System

Le design system est basé sur l'analyse du design SIMONE avec des adaptations pour le marché camerounais.

### Couleurs

- **Primaire** : Noir/Charcoal (#2D2D2D, #1A1A1A)
- **Accent** : Corail (#FF6B6B)
- **Neutrals** : Gris (50-900)

### Typographie

- Font family : System (iOS) / Roboto (Android)
- Tailles : 10px à 40px
- Weights : Regular (400), Medium (500), Semibold (600), Bold (700)

### Spacing

- Scale : 0, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64, 80, 96px

### Components de Base Disponibles

- ✅ **PrimaryButton** : Bouton principal noir
- ✅ **SecondaryButton** : Bouton secondaire outline
- ✅ **StyledText** : Texte avec variants (h1-h6, body, caption, etc.)
- ✅ **TextInput** : Champ de saisie avec label et erreur

## 🇨🇲 Spécificités Cameroun

- **Devise** : XAF (Franc CFA)
- **Paiement** : Orange Money, MTN Mobile Money
- **Langues** : Français (primaire), Anglais (secondaire)
- **Villes** : Douala, Yaoundé (prioritaires)
- **Format téléphone** : +237 6XX XXX XXX

## 📝 Conventions de Code

- **TypeScript** strict mode activé
- **ESLint** + **Prettier** pour le formatage
- **Styled-components** pour tous les styles
- **Atomic Design** pour l'organisation des composants
- **React Hook Form** + **Zod** pour les formulaires

## 🧪 Tests

```bash
# Type checking
npm run type-check

# Linting
npm run lint
```

## 📦 Build Production

```bash
# Build iOS
eas build --platform ios

# Build Android
eas build --platform android

# Build All
eas build --platform all
```

## 🚢 Déploiement

### Configuration EAS

1. Installer EAS CLI :
```bash
npm install -g eas-cli
```

2. Login :
```bash
eas login
```

3. Configurer le projet :
```bash
eas build:configure
```

4. Lancer un build :
```bash
eas build --profile production --platform all
```

## 📖 Documentation

- [React Native](https://reactnative.dev/)
- [Expo](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Styled-components](https://styled-components.com/)
- [Flutterwave React Native](https://developer.flutterwave.com/docs/flutterwave-react-native)

## 🤝 Contribution

1. Créer une branche : `git checkout -b feature/ma-feature`
2. Commit : `git commit -m "Add: ma feature"`
3. Push : `git push origin feature/ma-feature`
4. Créer une Pull Request

## 📄 License

Propriétaire - KmerServices © 2025
