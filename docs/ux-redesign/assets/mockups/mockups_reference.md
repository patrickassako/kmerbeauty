# KMR-BEAUTY Screen Mockups Reference

## Vue d'ensemble

Ce document référence tous les mockups d'écrans présents dans la charte graphique.
Les images sources sont dans le dossier parent `assets/`.

---

## Flux Onboarding

### Écrans disponibles:
1. **Bienvenue sur KMR-BEAUTY** - Introduction avec background image
2. **Réservez Facilement** - Valeur proposition
3. **Profitez des Offres Locales** - Avantages locaux

**Référence**: `graphic_charter_local_specs.png` - Section "Onboarding Screens"

**Spécifications**:
- Background: Photo plein écran avec overlay sombre
- Logo: Centré en haut
- Texte: Blanc, centré
- Navigation: Dots en bas + boutons Skip/Next

---

## Flux Authentification

### Écrans disponibles:
1. **Login** - Formulaire de connexion
2. **Signup** - Formulaire d'inscription
3. **Code de Vérification** - OTP 6 digits

**Référence**: `graphic_charter_local_specs.png` - Section "Authentication Screens"

**Spécifications**:
- Background: Blanc
- Champs: Height 48px, border-radius 8px
- Bouton principal: Coral full-width
- Liens: Texte noir avec underline

---

## Écran Principal (Home)

**Référence**: `graphic_charter_local_specs.png` - "Home Screen" mockup

**Sections**:
1. Header: Logo + localisation + notifications
2. Search bar: Full width
3. Services populaires: Carrousel horizontal
4. Prestataires proches: Liste/grille
5. Réservations à venir: Card

**Navigation Tab Bar**:
- 5 onglets: Home, Search, Profile, Bookings, Marketplace
- Icons: 24px outlined/filled
- Labels: 11px uppercase

---

## Écran Services

**Référence**: `graphic_charter_local_specs.png` - "Services Screen"

**Spécifications**:
- Grille de catégories
- Cards: Fond blanc, icône + label
- Badge sélection: Coral (#FF6B6B)
- Badge non sélectionné: Gris clair

---

## Écran Salons/Prestataires

**Référence**: `graphic_charter_local_specs.png` - "Salons/Providers Screen"

**Spécifications**:
- Cards horizontales avec image
- Badges promo: Pourcentage (-20%, etc.)
- Rating: Étoiles dorées
- Prix: XAF en bold

---

## Écran Réservations (Bookings)

**Référence**: `graphic_charter_local_specs.png` - "Bookings Screen"

**Spécifications**:
- Tabs: À venir / Passées / Annulées
- Cards avec avatar prestataire
- Badges de statut colorés:
  - Confirmed: Vert
  - Pending: Orange
  - Cancelled: Rouge

---

## Écran Marketplace

**Référence**: `graphic_charter_local_specs.png` - "Marketplace Screen"

**Spécifications**:
- Grille de produits (2 colonnes)
- Cards: Image + Nom + Prix XAF
- Prix format: "XAF X,XXX"
- Bouton panier

---

## Écran Conversations

**Référence**: `graphic_charter_local_specs.png` - "Conversations Screen"

**Spécifications**:
- Liste de conversations
- Avatar + Nom + Dernier message + Heure
- Badge unread (pastille coral)

---

## Écran Profil

**Référence**: `graphic_charter_local_specs.png` - "Profile Screen"

**Spécifications**:
- Header: Grande photo + Nom + Stats
- Menu liste avec icônes + chevrons
- Sections: Compte, Préférences, Support, Légal

---

## Écran Confirmation Réservation

**Référence**: `graphic_charter_part2.png` - "Booking Confirmation" mockup

**Spécifications**:
- Icône succès: Checkmark vert
- Titre: "Réservation Confirmée"
- Détails: Service, prestataire, date, heure
- Boutons: Voir détails, Retour accueil

---

## Composants UI Reference

**Référence**: `graphic_charter_part2.png` - Section "10. App Context Examples"

Mockups des:
- Home screen complet
- Service listing
- Booking confirmation
- Profile screen

---

## Fichiers Source

| Fichier | Contenu |
|---------|---------|
| `app_identity_charter.jpg` | Logo, couleurs, boutons, navigation, applications |
| `graphic_charter_part1.png` | Logo variations, palette complète, typographie |
| `graphic_charter_part2.png` | Components, spacing, icons, mockups contextuels |
| `graphic_charter_local_specs.png` | Tous les écrans app, spécifications Cameroun |

---

## Extraction des Mockups

Pour extraire les mockups individuels des fichiers PNG, utilisez un outil d'édition d'image pour:

1. Ouvrir `graphic_charter_local_specs.png`
2. Sélectionner chaque mockup d'écran
3. Exporter en PNG individuel avec naming:
   - `screen_onboarding_1.png`
   - `screen_login.png`
   - `screen_home.png`
   - etc.
