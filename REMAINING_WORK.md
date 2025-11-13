# Travail Restant - KmerServices

## ✅ Complété (8e2fccc)

### 1. Images
- ✅ Les images s'affichent partout (services, salons, prestataires)
- ✅ Header images dans ProviderDetailsScreen
- ✅ Service cards avec images
- ✅ Fallback vers placeholders si pas d'image

### 2. Nombre de prestataires
- ✅ Backend compte les vrais prestataires (therapists + salons)
- ✅ Affichage du nombre sur les cartes de service

### 3. Synchronisation données
- ✅ Cache désactivé (headers + timestamp)
- ✅ Pull-to-refresh fonctionne
- ✅ Changements BDD visibles immédiatement

### 4. Page d'accueil meublée
- ✅ Services par catégorie (Massage, Soins visage, Coiffure, etc.)
- ✅ Sections scrollables horizontalement
- ✅ Support multi-langue pour les catégories

### 5. Navigation services
- ✅ Erreur lors du clic sur service corrigée
- ✅ Navigation vers ServiceProviders fonctionne
- ✅ Navigation vers ProviderDetails fonctionne

## 🔄 À Compléter

### 1. ServiceDetailsScreen - Page détails d'un service

**Fichier**: `mobile/src/screens/main/ServiceDetailsScreen.tsx`

**État actuel**: Page existe mais utilise données mockées

**À faire**:

1. Importer les hooks:
```typescript
import { useI18n } from '../../i18n/I18nContext';
import { useService } from '../../hooks/useServices';
import { useTherapists } from '../../hooks/useTherapists';
import { useSalons } from '../../hooks/useSalons';
```

2. Charger les données réelles:
```typescript
const { language } = useI18n();
const { service: serviceData, loading } = useService(service.id);
const { therapists } = useTherapists({ serviceId: service.id });
const { salons } = useSalons({ serviceId: service.id });
```

3. Afficher les données:
- Nom du service: `language === 'fr' ? service.name_fr : service.name_en`
- Description: `language === 'fr' ? service.description_fr : service.description_en`
- Images du service: `service.images` (galerie)
- Purpose: `service.purpose_fr / purpose_en`
- Ideal for: `service.ideal_for_fr / ideal_for_en`
- Liste des prestataires (therapists + salons)
- Prix: `service.base_price` (ou prix spécifique du prestataire)

4. Ajouter RefreshControl et loading state

5. Implémenter navigation vers booking

---

### 2. SalonDetailsScreen - Page détails d'un salon

**Fichier**: `mobile/src/screens/main/SalonDetailsScreen.tsx`

**État actuel**: Page existe probablement avec données mockées

**À faire**:

1. Connecter aux hooks:
```typescript
const { salon, loading } = useSalon(salonId);
const { services: salonServices } = useSalonServices(salonId);
const { therapists: salonTherapists } = useSalonTherapists(salonId);
```

2. Afficher les vraies données:
- Nom: `salon.name_fr / name_en`
- Description: `salon.description_fr / description_en`
- Images: `salon.cover_image`, `salon.ambiance_images`
- Localisation: `salon.city`, `salon.quarter`, `salon.landmark`
- Features: `salon.features`
- Opening hours: `salon.opening_hours`
- Services offerts par le salon
- Thérapeutes travaillant au salon

3. Ajouter image gallery pour ambiance_images

4. Section features (si applicable)

5. Navigation vers booking

---

### 3. BookingScreen - Fonctionnalité complète

**Fichiers potentiels**:
- `mobile/src/screens/booking/BookingScreen.tsx`
- Ou créer un nouveau screen

**À implémenter**:

#### A. Sélection de la date et l'heure

1. Créer/utiliser un endpoint backend pour récupérer les disponibilités:
```typescript
// backend/src/availability/availability.controller.ts
@Get('therapist/:therapistId')
async getTherapistAvailability(
  @Param('therapistId') therapistId: string,
  @Query('date') date: string,
) {
  // Retourner les créneaux disponibles pour cette date
}
```

2. Afficher un calendrier dans le mobile:
```typescript
const { availability } = useAvailability(providerId, selectedDate);
```

3. Permettre la sélection d'un créneau horaire

#### B. Récapitulatif et confirmation

1. Afficher:
- Service sélectionné
- Prestataire sélectionné
- Date et heure
- Prix total
- Durée

2. Formulaire de contact (si nécessaire):
- Téléphone
- Notes spéciales

#### C. Création de la réservation

1. Créer endpoint backend:
```typescript
// backend/src/bookings/bookings.controller.ts
@Post()
async create(@Body() createBookingDto: CreateBookingDto) {
  return this.bookingsService.create(createBookingDto);
}
```

2. Appel API depuis mobile:
```typescript
const { createBooking, loading } = useCreateBooking();

const handleConfirm = async () => {
  await createBooking({
    client_id: user.id,
    therapist_id: provider.type === 'therapist' ? provider.id : undefined,
    salon_id: provider.type === 'salon' ? provider.id : undefined,
    service_id: service.id,
    scheduled_at: selectedDateTime,
    duration: service.duration,
    total_price: calculatedPrice,
  });

  // Navigate to confirmation screen
};
```

#### D. Gestion du paiement

**Options**:

1. **Paiement sur place** (le plus simple):
- Juste créer la réservation avec `payment_status = 'PENDING'`
- Paiement lors du rendez-vous

2. **Mobile Money** (Orange Money, MTN MoMo):
- Intégrer l'API de paiement mobile
- Demander le numéro de téléphone
- Initier la transaction
- Confirmer le paiement

3. **Carte bancaire** (plus complexe):
- Intégrer Stripe ou autre processeur
- Ajouter formulaire de carte
- Processus de paiement sécurisé

**Recommandation**: Commencer avec "Paiement sur place" puis ajouter Mobile Money

---

## 📊 Résumé de Progression

### Complété: 5/8 (62.5%)
1. ✅ Images affichées
2. ✅ Nombre de prestataires
3. ✅ Sync données / cache
4. ✅ Page accueil meublée
5. ✅ Navigation services

### En attente: 3/8 (37.5%)
6. ⏳ ServiceDetailsScreen
7. ⏳ SalonDetailsScreen
8. ⏳ BookingScreen fonctionnel

---

## 🎯 Ordre Recommandé

1. **ServiceDetailsScreen** (1-2h)
   - Impact: Élevé (page importante)
   - Difficulté: Moyenne
   - Utilise hooks existants

2. **SalonDetailsScreen** (1-2h)
   - Impact: Moyen
   - Difficulté: Moyenne
   - Similaire à ServiceDetailsScreen

3. **BookingScreen - Phase 1** (2-3h)
   - Sélection date/heure
   - Récapitulatif
   - Création réservation
   - Paiement sur place uniquement

4. **BookingScreen - Phase 2** (3-4h) - Optionnel
   - Intégration Mobile Money
   - Gestion des paiements avancée

---

## 💡 Notes Techniques

### Hooks disponibles
- ✅ `useService(id)` - Charger un service
- ✅ `useTherapist(id)` - Charger un thérapeute
- ✅ `useSalon(id)` - Charger un salon
- ✅ `useTherapistServices(id)` - Services d'un thérapeute
- ✅ `useSalonServices(id)` - Services d'un salon
- ⏳ `useAvailability(id, date)` - À créer
- ⏳ `useCreateBooking()` - À créer

### API Endpoints disponibles
- ✅ GET `/services` - Liste services
- ✅ GET `/services/:id` - Détails service
- ✅ GET `/therapists` - Liste thérapeutes
- ✅ GET `/therapists/:id` - Détails thérapeute
- ✅ GET `/therapists/:id/services` - Services thérapeute
- ✅ GET `/salons` - Liste salons
- ✅ GET `/salons/:id` - Détails salon
- ✅ GET `/salons/:id/services` - Services salon
- ⏳ GET `/availability/:providerId` - À créer
- ⏳ POST `/bookings` - À créer

---

## 🔗 Prochaines Étapes

Pour continuer le développement:

1. Lire `CONNECTING_REAL_DATA.md` pour comprendre l'architecture
2. Lire `DEBUGGING_PROVIDERS.md` si problèmes avec les données
3. Commencer par ServiceDetailsScreen (le plus facile)
4. Tester chaque écran après implémentation
5. Créer les endpoints d'availability et bookings au backend

Tous les hooks et patterns sont déjà établis, il suffit de les réutiliser! 🚀
