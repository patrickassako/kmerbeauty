# Prompts UX Redesign - KMR-BEAUTY Mobile App

## 📋 Vue d'ensemble du projet

**Application**: KMR-BEAUTY  
**Type**: Application mobile de services de beauté à la demande (React Native + Expo)  
**Marché**: Cameroun (Douala, Yaoundé)  
**Objectif**: Refonte complète du design UX/UI tout en conservant toutes les fonctionnalités existantes

---

## 🎨 CHARTE GRAPHIQUE COMPLÈTE

> [!IMPORTANT]
> Avant de commencer tout travail de design, consultez les fichiers de charte graphique ci-dessous. Tous les designs doivent être strictement conformes à ces spécifications.

### Fichiers de Référence Visuels

````carousel
![Charte d'identité principale - Logo, couleurs, composants UI, applications contextuelles](/Users/apple/.gemini/antigravity/brain/923ae32f-fb80-4014-a3ee-e420829deb21/assets/app_identity_charter.jpg)
<!-- slide -->
![Graphic Charter Part 1 - Logo section, palette de couleurs, typographie](/Users/apple/.gemini/antigravity/brain/923ae32f-fb80-4014-a3ee-e420829deb21/assets/graphic_charter_part1.png)
<!-- slide -->
![Graphic Charter Part 2 - UI components, spacing, iconography, mockups](/Users/apple/.gemini/antigravity/brain/923ae32f-fb80-4014-a3ee-e420829deb21/assets/graphic_charter_part2.png)
<!-- slide -->
![Spécifications locales Cameroun - Paiements, formats, accessibilité](/Users/apple/.gemini/antigravity/brain/923ae32f-fb80-4014-a3ee-e420829deb21/assets/graphic_charter_local_specs.png)
````

### 📂 Structure des Assets

```
assets/
├── app_identity_charter.jpg      # Charte d'identité principale
├── graphic_charter_part1.png     # Logo, couleurs, typographie
├── graphic_charter_part2.png     # UI components, spacing, icons
├── graphic_charter_local_specs.png # Spécifications locales Cameroun
├── design_system.md              # Documentation complète du design system
├── logos/                        # Fichiers logo
├── colors/                       # Swatches couleurs
├── typography/                   # Spécifications fonts
├── icons/                        # Bibliothèque d'icônes
├── components/                   # Composants UI
└── mockups/                      # Maquettes d'écrans
```

---

## 🎨 SPÉCIFICATIONS DU DESIGN SYSTEM

### 1. PALETTE DE COULEURS

#### Couleurs Primaires
| Nom | Hex Code | Usage |
|-----|----------|-------|
| **Black** | `#2D2D2D` | Background principal, texte primaire, navigation |
| **Charcoal** | `#1A1A1A` | Backgrounds dark, headers, overlays |
| **Coral Accent** | `#FF6B6B` | Boutons primaires, CTA, liens actifs, highlights |

#### Échelle de Gris
| Nom | Hex Code | Usage |
|-----|----------|-------|
| **Gray 50** | `#F9F9F9` | Backgrounds très clairs |
| **Gray 100** | `#F5F5F5` | Backgrounds secondaires |
| **Gray 300** | `#E0E0E0` | Borders légères |
| **Gray 500** | `#9E9E9E` | Placeholder text, icônes inactives |
| **Gray 700** | `#616161` | Texte secondaire |
| **Gray 900** | `#121212` | Texte primaire fort |

#### Couleurs Fonctionnelles
| Nom | Hex Code | Usage |
|-----|----------|-------|
| **Success** | `#10B981` | Confirmations, validations |
| **Error** | `#EF4444` | Erreurs, alertes |
| **Warning** | `#F59E0B` | Avertissements |
| **Gold** | `#FFB800` | Notes, étoiles |

---

### 2. TYPOGRAPHIE

#### Familles de Polices
| Police | Usage | Lien |
|--------|-------|------|
| **Poppins** | Titres, headings, brand | [Google Fonts](https://fonts.google.com/specimen/Poppins) |
| **Montserrat** | Titres alternatifs, sous-titres | [Google Fonts](https://fonts.google.com/specimen/Montserrat) |
| **Inter** | Body text, captions, UI | [Google Fonts](https://fonts.google.com/specimen/Inter) |

#### Échelle Typographique
| Niveau | Police | Taille | Poids | Exemple |
|--------|--------|--------|-------|---------|
| **H1** | Poppins | 32px | Bold | "Find Your Look" |
| **H2** | Poppins | 24px | Bold | "Popular Services" |
| **H3** | Poppins/Montserrat | 18px | Bold | "Featured Salons" |
| **Body** | Inter | 16px | Regular | "Book your appointment..." |
| **Caption** | Inter | 14px | Regular | "Terms and conditions apply" |

---

### 3. COMPOSANTS UI

#### Boutons

**Primary Button (Coral)**
```
Background: #FF6B6B
Text: #FFFFFF
Border-radius: 8px
Padding: 12px 24px
Font: Poppins Bold 16px
Shadow: 0 2px 4px rgba(255, 107, 107, 0.3)
```

**Secondary Button (Outline)**
```
Background: Transparent
Border: 1px solid #2D2D2D
Text: #2D2D2D
Border-radius: 8px
Padding: 12px 24px
Font: Poppins Regular 16px
```

**Tertiary Button (Text Link)**
```
Background: Transparent
Text: #FF6B6B ou #2D2D2D
Font: Poppins Regular 14px
Text-decoration: underline on hover
```

#### Cards
```
Background: #FFFFFF
Border-radius: 12px
Shadow: 0 2px 8px rgba(0,0,0,0.1)
Padding: 16px
```

#### Navigation Bar (Bottom)
```
Background: #FFFFFF
Height: 60px + safe area
Icons: 24px (outlined inactive, filled active)
Labels: 11px uppercase
Active: #FF6B6B
Inactive: #757575
```

---

### 4. SPACING SYSTEM (Base: 8px)

| Token | Valeur | Usage |
|-------|--------|-------|
| `xs` | 4px | Micro-espaces, icônes inline |
| `sm` | 8px | Padding interne, petits gaps |
| `md` | 16px | Padding standard, margins |
| `lg` | 24px | Sections, gaps moyens |
| `xl` | 32px | Grandes sections |
| `2xl` | 48px | Headers, footers |

---

### 5. ICONOGRAPHIE

**Style**: Line icons / Outline  
**Stroke width**: 1.5px - 2px  
**Sizes**: 20px, 24px, 32px

#### Navigation Icons
- 🏠 Home | 🔍 Search | 👤 Profile | 📅 Calendar | 🛒 Cart | 💬 Chat

#### Action Icons
- ✏️ Edit | 🗑️ Delete | 📞 Phone | 📷 Camera | ❤️ Heart | ⭐ Star | 📍 Location | 🔔 Notifications

#### Service Icons
- ✂️ Coiffure | 💅 Ongles | 💆 Massage | 💄 Maquillage | 🧴 Soins

---

### 6. MICRO-INTERACTIONS

**Button Press**
```
Duration: 150ms
Transform: scale(0.98)
Transition: ease-out
```

**Loading Spinner**
```
Type: Circular spinner
Color: #FF6B6B
Animation: rotate 360deg, 1s, infinite, linear
```

**Success Animation**
```
Icon: Checkmark
Color: #10B981
Animation: scale + fade in (300ms)
```

---

### 7. SPÉCIFICATIONS LOCALES CAMEROUN 🇨🇲

#### Format Devise
```
Préfixe: XAF
Séparateur: virgule pour milliers
Exemples: XAF 15,000 | XAF 3,500
```

#### Méthodes de Paiement
| Service | Bouton |
|---------|--------|
| **Orange Money** | "Payer avec Orange Money" (orange icon) |
| **MTN Mobile Money** | "Payer avec MTN Mobile Money" (yellow icon) |
| **Flutterwave** | "Payer avec Flutterwave" |

#### Langues
- **Français** (FR): Interface principale
- **English** (EN): Toggle disponible
- **Toggle UI**: `Langue: FR | EN`

#### Localisation
- **Villes**: Douala, Yaoundé
- **Format adresse**: Quartier, Ville (ex: "Quartier Bastos, Yaoundé")
- **Format date**: 15 Janvier 2024
- **Format heure**: 24h (14:30)

---

## 🎯 Objectifs de la Refonte

### Objectif Principal
Moderniser l'expérience utilisateur de l'application KMR-BEAUTY en créant un design premium, intuitif et adapté au marché camerounais, tout en conservant l'intégralité des fonctionnalités actuelles.

### Contraintes à Respecter
- ✅ **Conserver toutes les fonctionnalités existantes** (aucune perte de feature)
- ✅ **Respecter strictement la charte graphique** (couleurs, typographie, composants)
- ✅ **Améliorer l'expérience utilisateur** (navigation fluide, interactions intuitives)
- ✅ **Design premium et moderne** (inspiré des meilleures apps de services)
- ✅ **Adaptation locale** (Cameroun : XAF, Orange Money, MTN, français/anglais)

---

## 📱 Structure de l'Application (Fonctionnalités à Conserver)

### A. Flux Client (User)

#### 1. Authentification
- Inscription (email, téléphone +237, mot de passe)
- Connexion
- Vérification par code (OTP)
- Réinitialisation de mot de passe
- Onboarding (3 slides)

#### 2. Écran d'Accueil (Home)
- Barre de recherche (services, salons, prestataires)
- Localisation utilisateur (carte + adresse)
- Services populaires/recommandés
- Packages promotionnels
- Prestataires à proximité
- Réservations à venir
- Mode liste/carte (toggle)
- Tutoriel guidé (Copilot)

#### 3. Services
- Catégories de services (coiffure, ongles, massage, etc.)
- Liste des services par catégorie
- Détails du service (prix XAF, durée, description, photos)
- Prestataires offrant le service
- Réservation directe

#### 4. Salons/Prestataires
- Liste des salons/prestataires
- Détails (photos, services, horaires, avis, localisation)
- Galerie photos
- Carte interactive
- Contact (téléphone, chat)
- Réservation

#### 5. Réservations (Bookings)
- Liste des réservations (à venir, passées, annulées)
- Détails de réservation
- Statuts (pending, confirmed, in_progress, completed, cancelled)
- Modification/Annulation
- Chat avec le prestataire
- Avis et notes

#### 6. Marketplace
- Parcourir les produits de beauté
- Détails produit (photos, prix XAF, description, stock)
- Panier
- Checkout (adresse, paiement Orange Money/MTN/Flutterwave)
- Commandes (historique, suivi)
- Chat avec le vendeur

#### 7. Conversations
- Liste des conversations
- Chat en temps réel
- Notifications

#### 8. Profil
- Informations personnelles
- Adresses enregistrées
- Paramètres de notification
- Support client (tickets)
- Devenir prestataire
- Déconnexion

### B. Flux Prestataire (Contractor)

#### 1. Dashboard
- Statistiques (revenus XAF, réservations, avis)
- Réservations à venir
- Demandes de réservation

#### 2. Gestion des Réservations
- Liste des rendez-vous
- Accepter/Refuser/Annuler
- Chat avec le client

#### 3. Gestion des Services
- Liste des services offerts
- Ajouter/Modifier/Supprimer
- Prix XAF, durée, description

#### 4. Profil Prestataire
- Informations professionnelles
- Portfolio (photos)
- Horaires de disponibilité
- Localisation (quartier Douala/Yaoundé)

#### 5. Revenus
- Historique des paiements
- Statistiques de revenus
- Demandes de retrait

---

## 🎯 PROMPTS POUR STITCH (UX DESIGNER AI)

---

### 📱 PROMPT 1: ONBOARDING EXPERIENCE

```
CONTEXTE:
Tu es Stitch, un expert UX designer. Tu dois redesigner l'expérience d'onboarding de KMR-BEAUTY, une application mobile de services de beauté à la demande au Cameroun.

CHARTE GRAPHIQUE À RESPECTER:
Consulte les fichiers de référence suivants:
- assets/app_identity_charter.jpg (identité visuelle principale)
- assets/graphic_charter_part1.png (logo, couleurs, typographie)
- assets/graphic_charter_local_specs.png (spécifications locales)

DESIGN SYSTEM:
- Couleurs: Black #2D2D2D, Charcoal #1A1A1A, Coral #FF6B6B, Gray scale
- Typographie: Poppins Bold (H1: 32px), Inter Regular (Body: 16px)
- Buttons: Coral primary, Black outline secondary
- Spacing: Base 8px grid

CONTENU DES SLIDES:
1. "Bienvenue sur KMR-BEAUTY" - Introduction
2. "Réservez Facilement" - Valeur proposition
3. "Profitez des Offres Locales" - Avantages locaux

OBJECTIF:
Créer une expérience d'onboarding moderne, engageante et éducative qui présente les bénéfices clés de l'application en 3-4 écrans maximum.

CONTRAINTES:
- Conserver la structure en slides horizontaux avec swipe
- Utiliser STRICTEMENT la palette de couleurs de la charte
- Logo KMR-BEAUTY avec l'illustration féminine (coral + blanc)
- Backgrounds: images de beauté avec overlay sombre
- Boutons: "Passer" (text link), "Suivant"/"Commencer" (Coral primary)
- Indicateurs de progression: dots blancs

ÉLÉMENTS VISUELS REQUIS:
- Logo KMR-BEAUTY (version principale avec illustration)
- Photos de services de beauté (coiffure, ongles, maquillage)
- Overlay gradient: rgba(0,0,0,0.4) à rgba(26,26,26,0.7)
- Typography: Blanc sur fond sombre

LIVRABLES ATTENDUS:
1. Wireframes des 3 écrans d'onboarding
2. Contenu textuel pour chaque slide (titre + sous-titre en français)
3. Spécifications visuelles (photos, overlays, animations)
4. Micro-interactions (transitions, animations de dots)
5. Composants React Native à utiliser

INSPIRATION:
- Référence: Le mockup "Onboarding Screens" dans graphic_charter_local_specs.png
```

---

### 📱 PROMPT 2: AUTHENTICATION FLOW

```
CONTEXTE:
Tu es Stitch, expert UX designer. Tu dois redesigner le flux d'authentification complet de KMR-BEAUTY (Login, Signup, Code de Vérification, Reset Password).

CHARTE GRAPHIQUE À RESPECTER:
- assets/app_identity_charter.jpg
- assets/graphic_charter_part1.png
- assets/graphic_charter_part2.png (UI components, form fields)
- assets/graphic_charter_local_specs.png (authentication screens mockups)

DESIGN SYSTEM:
- Couleurs: Black #2D2D2D, Coral #FF6B6B, Gray scale
- Typographie: Poppins Bold (headings), Inter Regular (body, inputs)
- Form fields: Height 48px, border-radius 8px, padding 12px 16px
- Primary button: Coral background, white text, full width
- Secondary button: Black outline, transparent background

ÉCRANS REQUIS:

**Login Screen:**
- Logo KMR-BEAUTY centré en haut
- Titre: "Connexion" (H2)
- Champs: Email/Téléphone, Mot de passe (avec toggle visibility)
- Checkbox: "Se souvenir de moi"
- Bouton: "Se connecter" (Coral primary, full width)
- Liens: "Mot de passe oublié?", "Créer un compte"

**Signup Screen:**
- Logo KMR-BEAUTY
- Titre: "Inscription" (H2)
- Champs: Nom complet, Email, Téléphone (+237), Mot de passe, Confirmer
- Indicateur force mot de passe
- Checkbox CGU
- Bouton: "S'inscrire" (Coral primary)
- Lien: "Déjà un compte? Se connecter"

**Code de Vérification:**
- Titre: "Vérification" (H2)
- Sous-titre: Numéro/email masqué
- 6 champs numériques (code OTP)
- Auto-focus entre champs
- Timer de renvoi (60s)
- Bouton: "Vérifier" (Coral primary)
- Lien: "Renvoyer le code"

FORMAT TÉLÉPHONE CAMEROUN:
- Préfixe: +237
- Format: 6XX XXX XXX
- Clavier: Numérique

LIVRABLES ATTENDUS:
1. Wireframes de chaque écran
2. User flow complet (diagramme)
3. Gestion des états (loading, erreur, succès)
4. Messages d'erreur en français
5. Micro-interactions (transitions, feedback visuel)
6. Spécifications techniques (React Hook Form + Zod)

INSPIRATION:
- Référence: Les mockups "Authentication Screens" dans graphic_charter_local_specs.png
```

---

### 📱 PROMPT 3: HOME SCREEN

```
CONTEXTE:
Tu es Stitch, expert UX designer. Tu dois redesigner l'écran d'accueil de KMR-BEAUTY, le point central de l'application.

CHARTE GRAPHIQUE À RESPECTER:
- assets/app_identity_charter.jpg (UI components, navigation)
- assets/graphic_charter_part2.png (cards, spacing, buttons)
- assets/graphic_charter_local_specs.png (Home Screen mockup, color usage)

DESIGN SYSTEM:
- Header: Logo "KMR-BEAUTY" texte + hamburger menu
- Cards: Background blanc, border-radius 12px, shadow légère
- Navigation: Tab bar avec 5 onglets (Home, Search, Profile, Bookings, Marketplace)
- Badges promo: Coral #FF6B6B avec texte blanc
- Prix: Format "XAF X,XXX" en bold

SECTIONS REQUISES (ordre de priorité):

1. **Header**
   - Logo texte "KMR-BEAUTY"
   - Icône notifications (avec badge si non lues)
   - Icône localisation + "Douala" ou "Yaoundé"

2. **Barre de Recherche**
   - Placeholder: "Rechercher un service, salon..."
   - Icône recherche
   - Full width

3. **Services Populaires**
   - Titre: "Services Populaires" (H2)
   - Carrousel horizontal
   - Cards: image + icon overlay + nom + prix départ
   - Bouton "BOOK NOW" (Coral)

4. **Prestataires à Proximité**
   - Titre: "Près de chez vous"
   - Liste ou grille
   - Cards: avatar + nom + spécialité + note + distance

5. **Réservations à Venir** (si existe)
   - Card unique avec prochaine réservation
   - Service, prestataire, date/heure
   - Actions: Annuler, Contacter

6. **Map Preview**
   - Carte mini avec pins des prestataires proches
   - Bouton "Voir sur la carte"

NAVIGATION BAR (Bottom):
- 5 onglets: Home, Explore, Profile (Reference: Identity Charter)
- Active: Coral filled icon
- Inactive: Gray outline icon
- Labels: Uppercase 11px

LIVRABLES ATTENDUS:
1. Wireframe complet (scroll vertical)
2. Hiérarchie visuelle (priorité des sections)
3. Design des cards (service, provider)
4. États vides
5. Pull-to-refresh, skeleton loading
6. Spécifications techniques

INSPIRATION:
- Référence: Le mockup "Home Screen" dans les chartes graphiques
```

---

### 📱 PROMPT 4: SERVICE DISCOVERY & BOOKING FLOW

```
CONTEXTE:
Tu es Stitch, expert UX designer. Tu dois redesigner le parcours complet de découverte et de réservation de services.

CHARTE GRAPHIQUE À RESPECTER:
- assets/graphic_charter_part2.png (cards, buttons, form fields)
- assets/graphic_charter_local_specs.png (Services Screen, Bookings Screen mockups)
- assets/design_system.md (spécifications complètes)

DESIGN SYSTEM:
- Cards service: Image header, titre, description, prix XAF, durée, CTA
- Badges: Coral background pour sélection, Gray pour inactif
- Boutons: "BOOK NOW" Coral, "VIEW DETAILS" Black outline
- Calendar: Style moderne, jour sélectionné en Coral
- Time slots: Badges selectables, Coral when selected

ÉCRANS DU PARCOURS:

1. **Services Screen (Catégories)**
   - Grille de catégories (2 colonnes)
   - Cards: Icône + nom + nombre de services
   - Style: Référence "Services Screen" dans les mockups

2. **Category Services Screen**
   - Header avec titre catégorie
   - Filtres: Prix, Durée, Note
   - Liste de services (cards)
   - Card: Image, Titre, Description courte, "À partir de XAF X,XXX", Durée, Bouton

3. **Service Details Screen**
   - Galerie photos (swipe horizontal)
   - Titre + Description complète
   - Prix: "XAF X,XXX" (bold)
   - Durée: "X min"
   - Section "Prestataires disponibles"
   - Avis clients (étoiles + commentaires)
   - Bouton fixe: "Réserver maintenant" (Coral, full width)

4. **Provider Selection Screen**
   - Liste des prestataires offrant ce service
   - Card: Avatar, Nom, Note, Distance, Prix spécifique
   - Filtre: Distance, Prix, Disponibilité
   - Action: Sélectionner → Booking

5. **Booking Screen**
   - Récapitulatif: Service + Prestataire
   - Sélection date (calendrier mensuel)
   - Sélection heure (créneaux disponibles en badges)
   - Option: Domicile/Salon
   - Notes (textarea)
   - Bouton: "Continuer vers le paiement"

6. **Checkout Screens**
   - Review: Récapitulatif complet
   - Payment: Orange Money, MTN Mobile Money, Flutterwave
   - Confirmation finale

7. **Booking Confirmation**
   - ✓ Icône succès (vert)
   - "Réservation Confirmée"
   - Code de réservation
   - Détails
   - Boutons: "Voir détails", "Retour accueil"

BOUTONS DE PAIEMENT:
- "Payer avec Orange Money" (orange icon)
- "Payer avec MTN Mobile Money" (yellow icon)
- "Payer avec Flutterwave"

LIVRABLES ATTENDUS:
1. User flow complet (diagramme)
2. Wireframes de chaque écran
3. Design des composants (cards, calendar, time picker)
4. Gestion des états (loading, erreur, indisponibilité)
5. Micro-interactions
6. Spécifications techniques
```

---

### 📱 PROMPT 5: BOOKINGS MANAGEMENT

```
CONTEXTE:
Tu es Stitch, expert UX designer. Tu dois redesigner l'écran de gestion des réservations.

CHARTE GRAPHIQUE À RESPECTER:
- assets/graphic_charter_part2.png (cards, badges)
- assets/graphic_charter_local_specs.png (Bookings Screen mockup, color usage)

DESIGN SYSTEM:
- Onglets: "À venir", "Passées", "Annulées"
- Badges de statut:
  - Confirmed: Vert #10B981
  - Pending: Orange #F59E0B
  - Cancelled: Rouge #EF4444
- Cards: Background blanc, shadow légère

ÉCRANS REQUIS:

**Bookings Screen (Liste):**
- Header: "Mes Réservations" (H1)
- Tabs: À venir | Passées | Annulées
- Cards de réservation:
  - Photo prestataire (avatar 48px)
  - Nom du service (H3)
  - Nom du prestataire
  - Date + Heure
  - Badge statut (couleur selon état)
  - Prix "XAF X,XXX"
  - Chevron pour détails

**Booking Details Screen:**
- Photo prestataire (grande, header)
- Section Infos:
  - Service (nom, description, prix, durée)
  - Prestataire (nom, note, téléphone)
  - Date/Heure
  - Lieu (adresse ou "À domicile")
  - Code réservation
- Timeline des statuts
- Actions selon statut:
  - Pending: Annuler
  - Confirmed: Modifier, Annuler, Contacter
  - Completed: Laisser avis, Réserver à nouveau

**Review Screen (après Completed):**
- Photo prestataire
- Nom du service
- Note (5 étoiles interactives)
- Commentaire (textarea)
- Bouton: "Publier l'avis" (Coral)

LIVRABLES ATTENDUS:
1. Wireframes (Liste, Détails, Review)
2. Design des badges de statut
3. Timeline de progression
4. Actions contextuelles
5. États vides
6. Micro-interactions
```

---

### 📱 PROMPT 6: MARKETPLACE

```
CONTEXTE:
Tu es Stitch, expert UX designer. Tu dois redesigner le marketplace de produits de beauté.

CHARTE GRAPHIQUE À RESPECTER:
- assets/graphic_charter_part2.png (cards, buttons)
- assets/graphic_charter_local_specs.png (Marketplace Screen mockup)

DESIGN SYSTEM:
- Prix: "XAF X,XXX" en bold noir
- Product Details visible
- Cards produits: Image, Nom, Prix, Note
- Boutons: "Ajouter au panier" (Coral), "Acheter" (Black outline)

ÉCRANS REQUIS:

**Marketplace Browse:**
- Header: "Marketplace"
- Search bar
- Catégories (chips horizontaux)
- Grille de produits (2 colonnes)
- Cards: Photo, Nom, Prix XAF, Note étoiles

**Product Details:**
- Galerie photos (swipe)
- Nom + Prix (H2 + bold)
- Description
- Stock disponible
- Vendeur (avatar + nom + note)
- Avis clients
- Produits similaires (carrousel)
- Boutons fixe: "Ajouter au panier" + cœur favoris

**Checkout:**
- Récapitulatif panier
- Sous-total + Frais livraison + Total (XAF)
- Adresse livraison
- Paiement: Orange Money, MTN, Flutterwave
- Bouton: "Confirmer la commande"

**Client Orders:**
- Tabs: En cours | Livrées | Annulées
- Liste commandes avec statut

LIVRABLES ATTENDUS:
1. Wireframes tous les écrans
2. Design cards produits
3. Flow checkout
4. Suivi commande
5. Spécifications
```

---

### 📱 PROMPT 7: CONTRACTOR DASHBOARD

```
CONTEXTE:
Tu es Stitch, expert UX designer. Tu dois redesigner l'interface prestataire (contractor).

CHARTE GRAPHIQUE À RESPECTER:
- assets/app_identity_charter.jpg
- assets/graphic_charter_part2.png (components)
- assets/graphic_charter_local_specs.png (Profile Screen mockup)

DESIGN SYSTEM:
- Dashboard cards stats: Revenus XAF, Réservations, Note
- Graphiques: Lignes ou barres, couleur Coral
- Menu latéral ou liste d'options
- Boutons action: Coral primary

ÉCRANS REQUIS:

**Dashboard:**
- Header: Photo profil + Nom + Note
- Stats cards:
  - Revenus du mois: "XAF XX,XXX"
  - Réservations: nombre
  - Note moyenne: étoiles
  - Taux acceptation: %
- Section "À venir" (3-5 prochains RDV)
- Section "Demandes en attente"
- Menu accès rapide (icônes + labels)

**Appointments:**
- Tabs: À venir | En cours | Terminées | Annulées
- Cards RDV avec actions Accepter/Refuser

**Services Management:**
- Liste services offerts
- Card: Photo, Nom, Prix XAF, Durée, Toggle actif
- Bouton "+": Ajouter service

**Profile Edit:**
- Photo profil (upload)
- Infos personnelles
- Infos pro (spécialité, expérience)
- Portfolio
- Localisation (Douala/Yaoundé + quartier)
- Horaires

**Earnings:**
- Revenus totaux/mois/semaine (XAF)
- Graphique revenus (12 mois)
- Historique paiements
- Bouton retrait

LIVRABLES ATTENDUS:
1. Wireframes tous les écrans contractor
2. Design dashboard avec stats
3. Formulaires avec validation
4. Graphiques revenus
5. Notifications et badges
```

---

### 📱 PROMPT 8: PROFILE, SETTINGS & SUPPORT

```
CONTEXTE:
Tu es Stitch, expert UX designer. Tu dois redesigner les écrans profil, paramètres et support.

CHARTE GRAPHIQUE À RESPECTER:
- assets/graphic_charter_part2.png (form fields, buttons)
- assets/graphic_charter_local_specs.png (Profile Screen mockup, accessibility)

DESIGN SYSTEM:
- Menu profile: Liste avec icônes + chevrons
- Form fields: Height 48px, border-radius 8px
- Toggles: Coral when ON, Gray when OFF
- Sections séparées par dividers

ÉCRANS REQUIS:

**Profile Screen:**
- Header: Photo profil + Nom + Email + Téléphone
- Bouton: "Modifier" (icon)
- Stats: Réservations, Avis, Membre depuis
- Menu:
  - Mes adresses
  - Notifications
  - Support
  - Devenir prestataire
  - À propos
  - CGU / Confidentialité
  - Déconnexion (rouge)

**Edit Profile:**
- Photo (upload)
- Nom, Email, Téléphone
- Date naissance, Genre (optionnel)
- Bouton "Enregistrer" (Coral)

**Address Management:**
- Liste adresses (Maison, Bureau, etc.)
- Card: Nom, Adresse, Quartier, Ville, Actions
- Bouton "+": Ajouter adresse
- Format: Quartier, Ville (Yaoundé/Douala)

**Notification Settings:**
- Catégories avec toggles:
  - Réservations ON/OFF
  - Promotions ON/OFF
  - Messages ON/OFF
  - Mises à jour ON/OFF

**Support:**
- Options: Chat, Ticket, FAQ
- Mes tickets (liste avec statuts)
- Formulaire nouveau ticket

**Become Provider:**
- Formulaire candidature
- Infos pré-remplies
- Upload certifications
- Portfolio
- Localisation Douala/Yaoundé
- Bouton "Soumettre"

ACCESSIBILITÉ (référence: accessibility features dans la charte):
- High contrast mode
- Text size: Low/Regular/High
- Touch targets: min 44px
- Voiceover labels
- Colorblind-friendly

LIVRABLES ATTENDUS:
1. Wireframes tous les écrans
2. Design menu profile
3. Formulaires avec validation
4. Settings toggles
5. Interface support
6. Flow candidature prestataire
7. Accessibilité features
```

---

## 🔧 SPÉCIFICATIONS TECHNIQUES

### Stack Technologique
- **Framework**: React Native + Expo (~50.0.0)
- **Langage**: TypeScript (strict mode)
- **Styling**: Styled-components (CSS-in-JS)
- **Navigation**: React Navigation
- **State**: Zustand
- **Data**: React Query
- **Forms**: React Hook Form + Zod
- **Maps**: React Native Maps
- **Payments**: Flutterwave

### Design System Files
- `src/design-system/colors.ts`
- `src/design-system/typography.ts`
- `src/design-system/spacing.ts`
- `src/design-system/radius.ts`
- `src/design-system/shadows.ts`

---

## 📊 LIVRABLES ATTENDUS DE STITCH

Pour chaque prompt:

1. ✅ **Wireframes** (tous les écrans)
2. ✅ **User flows** (diagrammes navigation)
3. ✅ **Design components** (cards, buttons, forms)
4. ✅ **Spécifications interactions** (micro-animations)
5. ✅ **Gestion des états** (loading, error, empty, success)
6. ✅ **Messages FR** (erreurs, confirmations)
7. ✅ **Spécifications techniques** (composants, props)
8. ✅ **Accessibilité** (contraste, touch targets)
9. ✅ **Responsive** (différentes tailles d'écran)

---

## ✅ CRITÈRES DE SUCCÈS

- ✅ Toutes les fonctionnalités conservées
- ✅ Charte graphique strictement respectée
- ✅ Expérience utilisateur améliorée
- ✅ Design premium et moderne
- ✅ Spécifications locales Cameroun appliquées
- ✅ Performances optimales
- ✅ Accessibilité garantie
- ✅ Spécifications claires pour implémentation

---

**Bonne chance à Stitch ! 🎨✨**

**Documentation complète disponible dans:**
- [design_system.md](file:///Users/apple/.gemini/antigravity/brain/923ae32f-fb80-4014-a3ee-e420829deb21/assets/design_system.md)
