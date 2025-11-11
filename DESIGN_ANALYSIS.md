# Analyse du Design - Application de Services de Beauté à la Demande

## 📋 Table des Matières
1. [Vue d'ensemble](#vue-densemble)
2. [Identité Visuelle et Design System](#identité-visuelle-et-design-system)
3. [Architecture de l'Information](#architecture-de-linformation)
4. [Flux Utilisateur et Fonctionnalités](#flux-utilisateur-et-fonctionnalités)
5. [Composants UI et Patterns](#composants-ui-et-patterns)
6. [Recommandations pour Votre Application](#recommandations-pour-votre-application)

---

## 🎨 Vue d'ensemble

### Nom de l'Application Analysée
**SIMONE - Private Beauty Service**

### Concept Principal
Application mobile de réservation de services de beauté à la demande avec un design minimaliste, élégant et centré sur l'expérience utilisateur.

### Proposition de Valeur
"Your Beauty. Your Way. On Demand" - Services de beauté personnalisés accessibles à la demande avec une expérience premium.

---

## 🎨 Identité Visuelle et Design System

### Palette de Couleurs

#### Couleurs Principales
- **Noir/Charbon (#2D2D2D - #1A1A1A)** : Couleur primaire pour les boutons CTA, textes importants et éléments de navigation
- **Blanc (#FFFFFF)** : Fond principal, cartes et zones de contenu
- **Gris Clair (#F5F5F5 - #FAFAFA)** : Fonds secondaires, zones de saisie

#### Couleurs d'Accent
- **Rouge Corail/Saumon (#FF6B6B - #FF8B8B)** :
  - Prix et informations tarifaires
  - Icônes d'action (recherche, filtres)
  - Badges et notifications
  - Éléments de mise en évidence

#### Couleurs Fonctionnelles
- **Étoiles/Ratings** : Orange doré (#FFB800)
- **Textes secondaires** : Gris moyen (#6B6B6B)
- **Indicateurs de succès** : Check marks avec fond noir

### Typographie

#### Hiérarchie des Textes
- **Titres Principaux** : Grande taille, poids bold/semi-bold, noir
- **Sous-titres** : Taille moyenne, poids regular/medium
- **Corps de texte** : Taille standard, poids regular
- **Textes secondaires** : Petite taille, gris moyen
- **Prix** : Rouge corail, poids medium/semi-bold

#### Style
- Police moderne et épurée (probablement une sans-serif comme SF Pro, Inter ou similaire)
- Excellente lisibilité avec espacement généreux
- Capitales utilisées avec parcimonie (logo, catégories)

### Principes de Design

1. **Minimalisme** : Espaces blancs généreux, interface épurée
2. **Hiérarchie visuelle claire** : Informations importantes mises en évidence
3. **Contraste élevé** : Noir sur blanc pour une lecture facile
4. **Photographie de qualité** : Images professionnelles en pleine largeur
5. **Coins arrondis** : 12-16px pour les cartes, 8-12px pour les boutons
6. **Ombres subtiles** : Élévation légère pour les cartes

---

## 📱 Architecture de l'Information

### Navigation Principale (Bottom Navigation)

5 sections principales accessibles via une barre de navigation inférieure :

1. **HOME** (Icône maison)
   - Écran d'accueil personnalisé
   - Services recommandés
   - Catégories
   - Packages populaires

2. **SERVICE** (Icône service)
   - Catalogue complet des services
   - Filtrage par catégorie
   - Recherche avancée

3. **SALON** (Icône institut)
   - Liste des salons/instituts
   - Tri par proximité ("Near Me")
   - Salons populaires par catégorie
   - Centres de bien-être

4. **BOOKINGS** (Icône calendrier)
   - Réservations à venir
   - Historique des réservations
   - Gestion des rendez-vous

5. **PROFILE** (Icône profil)
   - Informations personnelles
   - Paramètres du compte
   - Historique et avis
   - Support et aide

### Navigation Secondaire

#### Header
- **Logo** : Positionné en haut à gauche (SIMONE)
- **Localisation** : Affichage de la localisation actuelle
- **Profil utilisateur** : Avatar cliquable (top right)
- **Notifications** : Badge avec nombre de notifications

#### Système de Tabs
- **Home / Institute** : Toggle pour basculer entre services à domicile et en institut
- Sélection visuelle claire (fond noir pour l'option active, fond blanc pour inactive)

---

## 🔄 Flux Utilisateur et Fonctionnalités

### 1. Onboarding et Authentification

#### Splash Screen
- Logo SIMONE centré
- Tagline "PRIVATE BEAUTY SERVICE"
- Message accrocheur : "Your Beauty, Your Way. On Demand"
- Bouton CTA "Discover Simone"
- Image de fond professionnelle en plein écran

#### Onboarding (3 écrans)
- **Écran 1-3** : "Captures the essence of Simone"
- Images plein écran de haute qualité
- Indicateurs de progression (dots)
- Navigation par swipe

#### Connexion / Inscription

**Log In**
- Email + Password
- Checkbox "Remember Me"
- Lien "Forgot Password?"
- Bouton CTA principal noir avec icône flèche
- Options d'authentification sociale :
  - Google
  - Facebook
  - Apple
- Lien "Or Register with"

**Sign Up**
- Email
- Password (masqué)
- Confirm Password (masqué)
- Bouton CTA "Sign Up"
- Options sociales identiques
- Icônes "eye" pour afficher/masquer les mots de passe

### 2. Écran d'Accueil (Home)

#### État Non Connecté
- Toggle "Home / Institute"
- Barre de recherche "Search services"
- Section "Recommended"
- Section "Categories" (horizontal scroll)
- Section "Service Packages"
- Section "Eye Care"
- Section "Available deals"
- Section "Gift Cards"
- Section "Wellness Massage"
- Section "Upcoming Services"

#### État Connecté
- Affichage de la localisation : "Sacré-Cœur Basilica"
- Profil utilisateur visible
- Section "Upcoming Bookings" (cartes horizontales avec logo salon)
- Section "Recommended" personnalisée
- Section "Categories"
- Section "Service Packages"
- Section "Available deals"
- Section "Gift Cards"

#### Éléments des Cartes de Service
- **Image** : Visuel du service
- **Prix** : En rouge, bien visible
- **Titre** : Nom du service
- **Établissement** : Nom du salon/prestataire
- **Rating** : Étoiles + nombre d'avis entre parenthèses
- **Durée** : Icône horloge + temps
- **Distance** : Pour services à domicile (ex: "1km away")

### 3. Recherche et Filtrage

#### Barre de Recherche
- Placeholder : "Search services"
- Icône loupe (rouge corail)
- Icône filtres (en haut à droite)

#### Résultats de Recherche
- **Header** : "12k+ results found" avec badge info
- **Toggle de vue** : Liste / Grille
- **Filtres actifs** : Chips affichant les filtres appliqués
  - "Low to High"
  - "Hair"
  - "Within 1km"
  - "4.0" (rating minimum) avec étoile
- Possibilité de supprimer les filtres individuellement

#### Modes d'Affichage
- **Liste** : Vue détaillée avec toutes les infos
- **Grille** : Vue en cartes 2 colonnes

#### Filtres Disponibles
- **Tri par prix** : Low to High / High to Low
- **Catégorie** : Hairdressing, Eye care, Wellness, etc.
- **Proximité** : Within 1km, 5km, 10km
- **Rating minimum** : 3.0, 4.0, 4.5, 5.0
- **Type de service** : Home / Institute

### 4. Pages Prestataires

#### A. Profil Thérapeute/Coiffeur Indépendant

**Header**
- Photo professionnelle plein écran
- Bouton retour (top left)
- Bouton fermer (top right)

**Informations Principales**
- **Nom** : Claire Smith
- **Établissement affilié** : Luxembourg Gardens Salon
- **Rating** : 5.0 ⭐ (36 avis)
- **Statut** : Licensed (badge)
- **Expérience** : 10 Years Experience

**Description**
- Biographie professionnelle détaillée
- Mise en avant des compétences

**Sections Dépliables (Accordéons)**
- **Education** : Diplômes et certifications
  - Diploma in Esthetics from Paris Cosmetology School
  - Certified in Advanced Facial Techniques
  - Licensed Massage Therapist...

- **Portfolio** : Galerie de travaux (dépliable)

- **Review** : Avis clients (dépliable)

**Actions**
- **View Shop** : Bouton secondaire (outline)
- **Services** : Bouton primaire noir

#### B. Page Détails Salon/Institut

**Header**
- Images en carrousel (miniatures en haut)
- Nom de l'établissement : "Beau Monde Esthétique"
- Localisation avec distance : "Est. April 1987 • (17k+)"
- Description de l'établissement

**Sections**

1. **Ambiance**
   - Galerie de photos de l'intérieur (4 images)

2. **Features** (Caractéristiques)
   - Grille 2x2 avec icônes :
     - Priority to Individual
     - Organic-based services
     - Hygienic Practices
     - Skilled Professionals
     - Advanced Technology
     - Relaxing Atmosphere

3. **Therapist** (Équipe)
   - Liste avec photos
   - "See all" pour voir toute l'équipe
   - Chaque profil avec nom et titre

4. **Services** (par catégorie)
   - **Hairdressings** : Liste avec images, prix, durée, rating
   - **Eye Care** : Liste avec images, prix, durée, rating
   - **Wellness Massage** : Liste avec images, prix, durée, rating

5. **Upcoming Services**
   - Services planifiés
   - Dates et "Join Waitlist" button

**Actions**
- **Book Service** : Bouton fixe en bas
- **View Shop** : Option secondaire

### 5. Détails d'un Service

**Header Image**
- Grande image du service
- Galerie miniatures (4 images)
- Bouton retour et fermer

**Informations Principales**
- **Prix** : $1245 (rouge, grande taille)
- **Rating** : ⭐ (3.9k+)
- **Titre** : Deep Tissue French Massage
- **Établissement** : Beau Monde Esthétique (avec icône)
- **Durée** : 2h

**Description**
- Texte explicatif du service
- Bénéfices et objectifs

**Sections Dépliables**
1. **Components** : Détails des étapes du service
   - "Skin Analysis: The treatment begins with..."

2. **Purpose** : Objectif du traitement

3. **Ideal Candidates** : Pour qui est ce service

**Therapist**
- Section avec 4 thérapeutes disponibles
- Photos en rond + nom + titre
- Lien "View Profile" (rouge)

**Actions**
- **View Shop** : Bouton secondaire
- **Check Availability** : Bouton CTA principal (noir)

### 6. Processus de Réservation

#### Étape 1 : Check Availability

**Informations du service**
- Image miniature
- Nom du service
- Prix + Durée + Rating
- Établissement

**Select Therapist**
- Dropdown avec sélection
- Photo + Nom + Rating
- Badge "Licensed" + "10 Years Experience"
- Lien "View Profile"

**Time & Date**
- Sélecteur de date (calendrier)
- Vue semaine avec jours sélectionnables
- Date sélectionnée mise en évidence (noir)

**Available Slots**
- Tabs : Morning / Afternoon / Evening
- Grille de créneaux horaires (30 min intervals)
- Créneau sélectionné avec outline

**Location**
- Affichage de l'adresse complète
- Distance indiquée
- Icône edit pour modifier

**Actions**
- **View Shop** : Bouton secondaire
- **Continue** : Bouton CTA (noir avec flèche)

#### Étape 2 : Checkout - Service

**Progress Indicator**
- 3 étapes : Service ✓ | Payment | Checkout
- Étape active indiquée

**Review Service**
- Service principal affiché avec image, prix, nom

**Additional Services**
- Liste de services complémentaires
- Checkboxes pour sélectionner
- Chaque service avec :
  - Image
  - Nom
  - Prix
  - Durée
  - Établissement
  - Rating

**Subtotal**
- Calcul automatique
- Affichage en gros (exemple: $1965.00)

**Action**
- **Continue** : Bouton CTA

#### Étape 3 : Checkout - Payment

**Progress Indicator**
- Service ✓ | Payment ✓ | Checkout

**Choose a payment method**
- Radio buttons pour sélection :
  - **Card** (Mastercard, Visa logos)
  - **Pay with Stripe** (PayPal logo)
  - **Pay with Apple Pay** (Apple Pay logo)

**Card Payment Form**
- Cardholder Name
- Card Number
- Expiration (2 champs)
- CVV
- Postal Code

**Action**
- **Continue** : Bouton CTA

#### Étape 4 : Checkout - Final Review

**Progress Indicator**
- Service ✓ | Payment ✓ | Checkout ✓

**Review Service**
- Liste finale des services sélectionnés
- Prix individuels affichés
- Durée pour chaque service
- Icône edit pour modifier

**Subtotal**
- Total final bien visible

**Action**
- **Continue** : Validation finale

#### Étape 5 : Confirmation et Chat

**Order Summary**
- Carte noire avec détails :
  - Services réservés
  - Prix de chaque service
  - Durée
  - Rating
  - Établissement + adresse

**Chat intégré**
- Badge du salon "L'Essence du Visage Ches - Online"
- Interface de chat pour communiquer
- Messages du salon
- Suggestions de services complémentaires affichées dans le chat
- Cartes de packages avec images

**Navigation**
- Bottom nav toujours présente

### 7. Gestion des Réservations

#### Écran Bookings
- Liste chronologique des réservations
- Chaque réservation affiche :
  - Image du service
  - Nom du service
  - Prix
  - Date (calendrier) + Heure
  - Établissement
  - Rating

#### Informations affichées
- Date complète : "23 Aug, 2024"
- Heure : "10am"
- Possibilité de voir plus de détails

### 8. Profil Utilisateur

#### Header du Profil
- Photo de profil
- Nom de l'utilisateur : "Elyna Des Sui"
- Adresse : "251 Rue Saint, Paris"
- Icône notification (top right)
- Liens sociaux : Facebook, Twitter, Instagram
- **Bouton "Switch to Seller"** : Pour basculer en mode prestataire

#### Upcoming Bookings
- Cartes horizontales avec logo salon
- Affichage de la prochaine réservation
- Lien "See all"

#### Menu du Profil
- My Account
- Chat
- Payment Method
- Reviews
- History
- Settings
- Referral
- Invite Friends
- Support
- Log Out

---

## 🧩 Composants UI et Patterns

### 1. Boutons

#### Bouton Primaire (CTA)
- Fond noir (#2D2D2D)
- Texte blanc
- Coins arrondis (24-28px pour un look pill)
- Icône flèche ronde à gauche du texte
- Hauteur généreuse (48-56px)
- Ombre subtile

#### Bouton Secondaire
- Fond blanc / transparent
- Bordure noire ou grise
- Texte noir
- Coins arrondis
- Icône possible (ex: "View Shop" avec icône store)

#### Bouton Social Auth
- Fond blanc
- Bordure légère grise
- Icône de la plateforme (colorée)
- Coins arrondis
- Format carré ou légèrement rectangulaire

### 2. Cartes (Cards)

#### Card Service (Large)
- Image en haut plein largeur
- Overlay avec informations :
  - Distance (badge avec pin icon)
- Prix (rouge, bold)
- Titre du service
- Établissement
- Rating (étoiles + nombre)
- Durée (icône horloge)
- Coins arrondis (12-16px)
- Ombre douce

#### Card Service (Liste)
- Image carrée à gauche (80x80px environ)
- Informations à droite :
  - Prix en haut (rouge)
  - Titre
  - Établissement
  - Rating
  - Durée
- Diviseur subtil entre les items

#### Card Salon (Near Me)
- Image plein largeur avec overlay gradient
- Nom du salon en blanc sur overlay
- Nombre de services
- Rating avec nombre d'avis
- Coins arrondis

#### Card Package
- Image plein largeur
- Badge "Includes X services"
- Titre du package
- Prix + Durée + Rating en bas
- Format rectangulaire vertical

#### Card Booking (Upcoming)
- Fond noir
- Logo du salon (carré avec fond blanc)
- Nom du salon en blanc
- Icône horloge + heure
- Icône calendrier + date
- Format rectangulaire horizontal

### 3. Inputs et Forms

#### Input Field
- Fond gris très clair (#F5F5F5)
- Bordure subtile ou sans bordure
- Label au-dessus
- Placeholder en gris moyen
- Padding généreux
- Coins arrondis (8-12px)
- Icône optionnelle à droite (ex: eye icon pour password)

#### Search Bar
- Fond blanc ou gris très clair
- Icône loupe à droite (rouge corail)
- Placeholder "Search services"
- Bordure subtile
- Coins arrondis
- Pleine largeur

### 4. Navigation et Tabs

#### Bottom Navigation
- Fond blanc
- 5 icônes espacées équitablement
- Item actif : Icône noire + indicateur (ligne grise dessous)
- Items inactifs : Icône grise
- Labels sous les icônes
- Hauteur ~60-70px

#### Toggle Switch (Home/Institute)
- 2 options côte à côte
- Option active : Fond noir, texte blanc
- Option inactive : Fond blanc/transparent, texte noir
- Coins arrondis (pill shape)
- Animation de transition

### 5. Badges et Tags

#### Badge Prix
- Texte rouge corail (#FF6B6B)
- Taille medium/large
- Poids semi-bold
- Symbole $ collé au prix

#### Badge Rating
- Étoile orange/dorée
- Nombre en noir
- Nombre d'avis entre parenthèses en gris
- Format : ⭐ 5.0 (2.3k+)

#### Badge Distance
- Icône pin
- Texte avec distance
- Fond semi-transparent sur image
- Coins arrondis
- Petite taille

#### Badge Status
- "Licensed" avec icône
- Fond blanc ou gris clair
- Texte noir
- Bordure subtile
- Petit format

#### Filter Chips
- Fond blanc
- Bordure grise
- Texte noir
- Icône X pour supprimer
- Coins arrondis (pill)
- Espacement entre chips

### 6. Listes et Accordéons

#### Accordion
- Header cliquable avec titre
- Icône chevron (up/down)
- Contenu dépliable
- Diviseur entre sections
- Animation d'ouverture/fermeture

#### Liste de Services
- Items séparés par diviseurs subtils
- Chaque item cliquable
- Hover/press state

### 7. Calendrier et Time Picker

#### Calendrier
- Vue semaine en ligne horizontale
- Jours affichés avec numéros
- Jour sélectionné : Fond noir, texte blanc, format rond
- Jours non sélectionnés : Fond blanc, texte noir
- Navigation mois avec flèches

#### Time Slots
- Grille de créneaux
- Créneau sélectionné : Bordure noire, fond blanc
- Créneaux disponibles : Fond blanc, bordure grise claire
- Créneaux indisponibles : Grisés
- Format pill (coins arrondis)

### 8. Images et Galeries

#### Image principale
- Plein écran ou pleine largeur
- Ratio 16:9 ou personnalisé
- Coins arrondis en haut pour modals

#### Miniatures
- Ligne horizontale scrollable
- 4-5 miniatures visibles
- Bordure pour l'image active
- Format carré ou 4:3

#### Gallery Grid
- Grille 2x2 ou 2x3
- Espacement égal
- Coins arrondis
- Toutes les images même taille

### 9. Modals et Overlays

#### Modal
- Fond blanc
- Header avec titre centré
- Bouton retour (left) et fermer (right)
- Contenu scrollable
- Boutons d'action fixes en bas
- Corners arrondis en haut
- Overlay sombre derrière

#### Bottom Sheet
- Monte depuis le bas
- Handle de drag en haut
- Fond blanc
- Contenu scrollable
- Semi-modal

### 10. États et Feedback

#### Loading States
- Probablement skeleton screens (non visible dans les captures)
- Ou spinners simples

#### Empty States
- (Non visible dans les captures analysées)

#### Success States
- Checkmarks avec fond noir
- Check circle pour étapes complétées

---

## 💡 Recommandations pour Votre Application

### Adaptations pour la Proximité Géographique

Votre application se concentre sur la proximité entre client et prestataire. Voici comment adapter le design :

#### 1. Mise en Avant de la Localisation

**Header Persistant**
```
- Afficher TOUJOURS la localisation actuelle de l'utilisateur
- Badge distance visible sur TOUTES les cartes de service
- Icône pin + distance (ex: "1.2 km" ou "À proximité")
- Possibilité de changer de zone de recherche facilement
```

**Filtre par Défaut**
```
- Tri par défaut : "Proximité" (et non par prix)
- Option "Dans un rayon de X km" bien visible
- Sélecteur de rayon : 1km, 3km, 5km, 10km, 20km
- Afficher sur une carte (vue optionnelle)
```

#### 2. Différenciation des Types de Prestataires

Votre app a 2 types de prestataires distincts :

**A. Indépendants Mobiles (se déplacent)**
```
Badges/Indicateurs spécifiques :
- Badge "Mobile" ou "Se déplace"
- Icône voiture ou pin avec flèches
- Zone de déplacement : "Se déplace dans un rayon de 5km"
- Frais de déplacement affichés si applicable
- Note : "Vient chez vous"

Informations supplémentaires :
- Équipement apporté
- Durée incluant déplacement
- Zones de déplacement préférées
```

**B. Salons/Instituts Fixes**
```
Badges/Indicateurs spécifiques :
- Badge "Salon" ou "Institut"
- Icône storefront
- Adresse physique bien visible
- Photos de l'établissement (ambiance)
- Itinéraire Google Maps intégré
- Horaires d'ouverture

Informations supplémentaires :
- Nombre de cabines
- Parking disponible
- Accessibilité PMR
```

#### 3. Toggle Home/Salon Amélioré

**Amélioration du Toggle**
```
Au lieu de "Home / Institute", utilisez :
- "À domicile" / "En salon"
- Icônes claires : 🏠 pour domicile, 🏪 pour salon
- Couleur d'accent différente pour chaque type (optionnel)
```

**Vue Hybride**
```
Possibilité d'afficher les deux types ensemble :
- Filtre "Tous" + "À domicile" + "En salon"
- Dans les résultats mixtes, badge clair sur chaque carte
```

#### 4. Carte Interactive (Nouvelle Fonctionnalité)

**Vue Carte**
```
Ajouter une vue carte (en plus de liste/grille) :
- Pins pour les salons fixes
- Pins avec icône mobile pour les indépendants
- Clusters pour zones denses
- Clic sur pin = aperçu rapide (card)
- Rayon de recherche visualisé sur la carte
```

**Intégration dans la Navigation**
```
Ajouter un toggle "Liste/Carte" :
- Icône liste 📋
- Icône carte 🗺️
- Permet de visualiser la proximité géographique
```

#### 5. Recherche Optimisée pour la Proximité

**Recherche Intelligente**
```
- Suggestion de prestataires proches en premier
- Autocomplete avec distance
  Exemple : "Coiffure (3 salons à moins de 2km)"
- Recherche par quartier/arrondissement
- "Disponible maintenant près de chez vous"
```

**Quick Filters**
```
Chips de filtres rapides :
- "À moins de 1km" (activé par défaut)
- "Disponible aujourd'hui"
- "Accepte les rendez-vous immédiats"
- "Se déplace"
- "Bien noté" (4★+)
```

#### 6. Page Prestataire Adaptée

**Pour Indépendants Mobiles**
```
Sections spécifiques :
✓ Zone de déplacement (carte)
✓ Frais de déplacement (si applicable)
✓ Équipement personnel (liste)
✓ "Travaille de X à Y" (horaires flexibles)
✓ Avis sur le professionnalisme et ponctualité
✓ Portfolio mobile (photos avant/après)
✓ Services réalisables à domicile uniquement
```

**Pour Salons/Instituts**
```
Sections spécifiques :
✓ Ambiance (galerie photos du lieu)
✓ Équipe complète (tous les thérapeutes)
✓ Équipement du salon
✓ Horaires d'ouverture détaillés
✓ Adresse + itinéraire
✓ Services disponibles sur place
✓ Politique d'annulation
✓ Parking et accès
```

#### 7. Système de Réservation Adapté

**Pour Services à Domicile**
```
Étapes supplémentaires :
1. Sélection du service + thérapeute
2. Choix de la date et heure
3. **Confirmation de l'adresse**
   - Adresse enregistrée
   - Nouvelle adresse
   - Instructions d'accès (code, étage, etc.)
   - Zone de stationnement
4. Paiement
5. Confirmation

Badge : "Le thérapeute se rendra à [adresse]"
```

**Pour Services en Salon**
```
Étapes :
1. Sélection du service + thérapeute
2. Choix de la date et heure
3. Sélection de cabine (optionnel)
4. Paiement
5. Confirmation

Badge : "Rendez-vous à [nom du salon], [adresse]"
Bouton : "Obtenir l'itinéraire"
```

#### 8. Proximité dans les Recommandations

**Algorithme de Recommandation**
```
Pondération :
- Distance : 40%
- Rating : 30%
- Prix : 15%
- Disponibilité : 15%

Sections :
- "Près de chez vous" (< 2km)
- "Dans votre quartier" (< 5km)
- "Valent le détour" (services exceptionnels même si plus loin)
```

**Notifications Push**
```
- "Un nouveau salon a ouvert à 500m de chez vous !"
- "Votre coiffeuse préférée se déplace maintenant à domicile"
- "Créneaux disponibles aujourd'hui près de chez vous"
```

#### 9. Fonctionnalités Spécifiques à Ajouter

**A. Gestion Multi-Adresses**
```
Permettre de sauvegarder plusieurs adresses :
- 🏠 Domicile
- 🏢 Bureau
- ❤️ Adresses favorites
- 📍 Position actuelle (GPS)

Switch rapide entre adresses pour recalculer proximité
```

**B. Disponibilité Immédiate**
```
Section "Disponible maintenant" :
- Prestataires mobiles libres dans l'heure
- Salons avec créneaux dans les 2h
- Badge "🔴 LIVE" ou "⚡ Dispo immédiatement"
- Filtre "Urgent" dans la recherche
```

**C. Historique et Favoris Géolocalisés**
```
- "Vos prestataires habituels"
- Notification quand un favori est proche
- "Reprendre votre dernier service"
- Itinéraires vers favoris
```

#### 10. Design System Adapté

**Codes Couleurs par Type**
```
Option 1 : Couleurs subtiles
- Indépendants mobiles : Accent vert doux
- Salons : Accent bleu doux
- Mixte : Dégradé

Option 2 : Badges uniquement
- Conserver le rouge corail pour tous
- Différencier par icônes et badges uniquement (plus cohérent avec le design épuré)
```

**Icônes Personnalisées**
```
Créer des icônes claires :
- 🚗 Pour "Se déplace"
- 🏪 Pour "En salon"
- 📍 Pour "Proximité"
- ⚡ Pour "Disponible immédiatement"
- ⭐ Pour "Favoris"
```

#### 11. Nouvelle Architecture de Navigation

**Bottom Navigation Adaptée**
```
Option A (5 tabs) :
1. HOME 🏠
2. À DOMICILE 🚗 (liste des indépendants)
3. SALONS 🏪 (liste des instituts)
4. BOOKINGS 📅
5. PROFILE 👤

Option B (5 tabs) :
1. EXPLORE 🔍 (recherche unifiée)
2. CARTE 🗺️ (vue géographique)
3. SERVICES 💅 (catalogue)
4. BOOKINGS 📅
5. PROFILE 👤
```

**Top Navigation**
```
Header fixe :
- Logo (left)
- Localisation actuelle cliquable (center)
  → "Sacré-Cœur, Paris" avec icône pin
  → Clic = changement de zone
- Notifications + Profile (right)
```

#### 12. Améliorations UX Proximité

**Feedback Visuel Distance**
```
Code couleur distance (optionnel) :
- Vert : < 1km (très proche)
- Orange : 1-5km (proche)
- Gris : > 5km (éloigné)

Ou simplement :
- "À 500m" (très visible)
- Icône walking/car avec temps estimé
```

**Tri Intelligent**
```
Tri par défaut personnalisé :
- Matin : Disponibles maintenant + proximité
- Midi : Proximité bureau (si adresse bureau configurée)
- Soir : Proximité domicile
- Weekend : Selon dernière position connue
```

**Rayon de Recherche Dynamique**
```
- Si < 5 résultats dans 1km → suggérer d'élargir à 3km
- Si > 100 résultats → suggérer de réduire ou d'affiner
- Badge : "12 résultats dans un rayon de 2km"
```

### Composants UI Spécifiques à Créer

#### 1. Card Prestataire Mobile
```
┌─────────────────────────────────┐
│  [Photo]  Nom du Prestataire    │
│           Badge "Mobile" 🚗     │
│           ⭐ 4.8 (127)          │
│           📍 1.2 km             │
│           Se déplace jusqu'à 5km│
│           Prix à partir de 45€  │
│                                 │
│  [Réserver]                     │
└─────────────────────────────────┘
```

#### 2. Card Salon Proche
```
┌─────────────────────────────────┐
│  [Photo du salon]               │
│  [Overlay gradient]             │
│  Nom du Salon                   │
│  Badge "Salon" 🏪               │
│  ⭐ 4.9 (2.3k)  📍 800m        │
│  12 services • Ouvert jusqu'à   │
│  19h                            │
│                                 │
│  [Voir] [Réserver]              │
└─────────────────────────────────┘
```

#### 3. Map Marker Popup
```
┌────────────────────┐
│ [Mini photo]       │
│ Nom                │
│ ⭐ 4.8  📍 1.2km  │
│ Badge type         │
│ [→ Voir détails]  │
└────────────────────┘
```

#### 4. Filtre Proximité
```
┌─────────────────────────────────┐
│ Rayon de recherche              │
│                                 │
│ ○───●─────────○ (slider)       │
│ 1km  [5km]  20km               │
│                                 │
│ ✓ Se déplace à domicile         │
│ ✓ Salon/Institut                │
│                                 │
│ [Appliquer]                     │
└─────────────────────────────────┘
```

---

## 🎯 Résumé des Éléments Clés du Design

### Points Forts à Conserver
1. ✅ **Minimalisme et élégance** - Design épuré et professionnel
2. ✅ **Hiérarchie visuelle claire** - Informations importantes bien mises en avant
3. ✅ **Photos de qualité** - Visuels professionnels et attractifs
4. ✅ **Navigation intuitive** - Bottom navigation + tabs clairs
5. ✅ **Palette de couleurs cohérente** - Noir/Blanc/Rouge corail
6. ✅ **Process de réservation fluide** - Étapes claires et progressives
7. ✅ **Informations complètes** - Prix, durée, ratings, distance
8. ✅ **Profils détaillés** - Prestataires et salons bien présentés

### Éléments à Adapter pour Votre Contexte
1. 🔄 **Emphase sur la proximité** - Distance plus visible partout
2. 🔄 **Différenciation claire** - Mobiles vs Salons
3. 🔄 **Vue carte** - Ajouter une visualisation géographique
4. 🔄 **Filtres géolocalisés** - Rayon de recherche, disponibilité
5. 🔄 **Badges types** - Identifier rapidement le type de prestataire
6. 🔄 **Adresses multiples** - Domicile, bureau, autres
7. 🔄 **Disponibilité immédiate** - "Dispo maintenant près de vous"

---

## 📐 Spécifications Techniques Recommandées

### Mobile
- Design pour iOS et Android
- Breakpoints : 375px (min) - 428px (max)
- Bottom navigation : 60-70px
- Header : 60px
- Cards : padding 16px, margin 12px
- Boutons CTA : height 48-56px

### Espacements
- Margin externe : 16-20px
- Margin entre sections : 24-32px
- Padding cards : 16px
- Gap entre éléments : 8-12px

### Typographie
- Échelle : 12px, 14px, 16px, 18px, 24px, 32px
- Line-height : 1.4-1.6
- Font-weight : 400 (regular), 500 (medium), 600 (semi-bold), 700 (bold)

### Coins Arrondis
- Cards : 12-16px
- Boutons primaires : 24-28px (pill)
- Boutons secondaires : 8-12px
- Inputs : 8-12px
- Badges : 16-20px (pill)

### Ombres
- Card elevation : 0px 2px 8px rgba(0,0,0,0.08)
- Button hover : 0px 4px 12px rgba(0,0,0,0.12)
- Modal : 0px 8px 24px rgba(0,0,0,0.16)

---

## 🚀 Prochaines Étapes

### Phase 1 : Design System
1. Créer la palette de couleurs complète
2. Définir la typographie
3. Créer les composants UI de base
4. Créer les icônes personnalisées

### Phase 2 : Wireframes
1. Flux utilisateur complet
2. Écrans principaux
3. Interactions et transitions
4. Prototypage interactif

### Phase 3 : UI Design
1. Écrans haute-fidélité
2. Variantes (mobile vs salons)
3. États (loading, empty, error)
4. Animations et micro-interactions

### Phase 4 : Développement
1. Stack technique (React Native, Flutter, ou natif)
2. Architecture backend
3. API géolocalisation
4. Système de paiement
5. Notifications push

---

**Document créé le** : 11 novembre 2025
**Basé sur** : Design Behance "On-demand Beauty Service Mobile App redesign"
**Pour** : Application de services de beauté à la demande basée sur proximité
