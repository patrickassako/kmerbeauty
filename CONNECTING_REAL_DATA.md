# Connexion des vraies données à l'application

Ce guide explique comment connecter l'application mobile aux données réelles de la base de données via le backend.

## 📋 Table des matières

1. [Configuration du backend](#configuration-du-backend)
2. [Configuration du mobile](#configuration-du-mobile)
3. [Utilisation des hooks](#utilisation-des-hooks)
4. [Exemple d'intégration](#exemple-dintégration)
5. [API Endpoints disponibles](#api-endpoints-disponibles)

## 🔧 Configuration du backend

### 1. Installer les dépendances

```bash
cd backend
npm install
```

### 2. Configurer les variables d'environnement

Créez un fichier `.env` dans le dossier `backend/` avec vos credentials Supabase:

```env
DATABASE_URL="postgresql://..."
SUPABASE_URL="https://xxxxx.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_KEY="your-service-key"
JWT_SECRET="your-jwt-secret"
```

### 3. Exécuter le seed de la base de données

Si ce n'est pas déjà fait, exécutez le seed SQL dans Supabase SQL Editor:

```bash
# Le fichier seed se trouve à: backend/prisma/seed.sql
```

### 4. Démarrer le serveur backend

```bash
npm run start:dev
```

Le serveur démarre sur `http://localhost:3000`

## 📱 Configuration du mobile

### 1. Configurer l'URL de l'API

Créez un fichier `.env` dans le dossier `mobile/`:

```bash
cp .env.example .env
```

Modifiez le fichier `.env`:

```env
# Pour le développement local (Android Emulator)
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000

# Pour le développement local (iOS Simulator)
EXPO_PUBLIC_API_URL=http://localhost:3000

# Pour le développement local (Physical Device - remplacez par votre IP)
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000

# Pour la production
EXPO_PUBLIC_API_URL=https://your-backend-url.com
```

### 2. Installer les dépendances

```bash
cd mobile
npm install
```

## 🎣 Utilisation des hooks

L'application inclut des hooks React personnalisés pour charger les données facilement.

### Hook: `useServices`

Récupère la liste des services avec un filtre optionnel par catégorie.

```typescript
import { useServices } from '../hooks/useServices';

const MyComponent = () => {
  const { services, loading, error, refetch } = useServices('HAIRDRESSING');

  if (loading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <FlatList
      data={services}
      renderItem={({ item }) => (
        <Text>{item.name_fr}</Text>
      )}
    />
  );
};
```

### Hook: `useTherapists`

Récupère la liste des thérapeutes avec des filtres optionnels.

```typescript
import { useTherapists } from '../hooks/useTherapists';

const MyComponent = () => {
  const { therapists, loading, error } = useTherapists({
    city: 'Douala',
    serviceId: 'service-id-here'
  });

  return (
    <FlatList
      data={therapists}
      renderItem={({ item }) => (
        <View>
          <Text>{item.user?.first_name} {item.user?.last_name}</Text>
          <Text>Rating: {item.rating} ⭐</Text>
        </View>
      )}
    />
  );
};
```

### Hook: `useTherapist`

Récupère les détails d'un thérapeute spécifique.

```typescript
import { useTherapist } from '../hooks/useTherapists';

const TherapistDetails = ({ therapistId }: { therapistId: string }) => {
  const { therapist, loading, error } = useTherapist(therapistId);

  if (!therapist) return null;

  return (
    <View>
      <Text>{therapist.user?.first_name}</Text>
      <Text>{therapist.bio_fr}</Text>
      <Text>Expérience: {therapist.experience} ans</Text>
    </View>
  );
};
```

### Hook: `useTherapistServices`

Récupère les services offerts par un thérapeute.

```typescript
import { useTherapistServices } from '../hooks/useTherapists';

const TherapistServices = ({ therapistId }: { therapistId: string }) => {
  const { services, loading } = useTherapistServices(therapistId);

  return (
    <FlatList
      data={services}
      renderItem={({ item }) => (
        <View>
          <Text>{item.service.name_fr}</Text>
          <Text>Prix: {item.price} XAF</Text>
          <Text>Durée: {item.duration} min</Text>
        </View>
      )}
    />
  );
};
```

### Hook: `useSalons`

Récupère la liste des salons.

```typescript
import { useSalons } from '../hooks/useSalons';

const MyComponent = () => {
  const { salons, loading, error } = useSalons({ city: 'Douala' });

  return (
    <FlatList
      data={salons}
      renderItem={({ item }) => (
        <View>
          <Text>{item.name_fr}</Text>
          <Text>Rating: {item.rating} ⭐ ({item.review_count} avis)</Text>
        </View>
      )}
    />
  );
};
```

### Hook: `useSalonServices`

Récupère les services offerts par un salon.

```typescript
import { useSalonServices } from '../hooks/useSalons';

const SalonServices = ({ salonId }: { salonId: string }) => {
  const { services, loading } = useSalonServices(salonId);

  return (
    <FlatList
      data={services}
      renderItem={({ item }) => (
        <View>
          <Text>{item.service.name_fr}</Text>
          <Text>Prix: {item.price} XAF</Text>
        </View>
      )}
    />
  );
};
```

## 💡 Exemple d'intégration

Voici un exemple complet d'intégration dans un écran:

```typescript
import React from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useServices } from '../hooks/useServices';
import { useTherapists } from '../hooks/useTherapists';
import { useI18n } from '../i18n/I18nContext';

const ServiceProvidersScreen = ({ route }) => {
  const { serviceId } = route.params;
  const { language } = useI18n();

  // Charger le service
  const { service, loading: loadingService } = useService(serviceId);

  // Charger les thérapeutes qui offrent ce service
  const { therapists, loading: loadingTherapists, refetch } = useTherapists({
    serviceId: serviceId
  });

  if (loadingService || loadingTherapists) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <View>
      <Text>
        {language === 'fr' ? service?.name_fr : service?.name_en}
      </Text>

      <FlatList
        data={therapists}
        onRefresh={refetch}
        refreshing={loadingTherapists}
        renderItem={({ item }) => (
          <TouchableOpacity>
            <Text>{item.user?.first_name} {item.user?.last_name}</Text>
            <Text>⭐ {item.rating} ({item.review_count} avis)</Text>
            <Text>📍 {item.city}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};
```

## 📡 API Endpoints disponibles

### Services

- `GET /services` - Liste tous les services
  - Query params: `?category=HAIRDRESSING`
- `GET /services/:id` - Détails d'un service

### Therapists

- `GET /therapists` - Liste tous les thérapeutes
  - Query params: `?city=Douala&serviceId=xxx`
- `GET /therapists/:id` - Détails d'un thérapeute
- `GET /therapists/:id/services` - Services d'un thérapeute

### Salons

- `GET /salons` - Liste tous les salons
  - Query params: `?city=Douala&serviceId=xxx`
- `GET /salons/:id` - Détails d'un salon
- `GET /salons/:id/services` - Services d'un salon
- `GET /salons/:id/therapists` - Thérapeutes d'un salon

## 🔒 Authentification

Pour ajouter l'authentification à vos requêtes, modifiez le fichier `mobile/src/services/api.ts`:

```typescript
api.interceptors.request.use(
  (config) => {
    const token = getTokenFromStorage(); // Implémentez cette fonction
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
```

## 🐛 Débogage

### Vérifier que le backend fonctionne

```bash
curl http://localhost:3000/services
```

### Vérifier la connectivité depuis le mobile

Dans votre composant React:

```typescript
useEffect(() => {
  console.log('API_URL:', process.env.EXPO_PUBLIC_API_URL);
}, []);
```

### Erreurs communes

1. **"Network Error"**: Vérifiez que le backend est démarré et que l'URL est correcte
2. **"404 Not Found"**: Vérifiez que le endpoint existe
3. **"Cannot connect to localhost"**: Sur Android Emulator, utilisez `10.0.2.2` au lieu de `localhost`

## 📝 Notes importantes

- Les données sont en **multi-langues** (FR/EN). Utilisez `name_fr` ou `name_en` selon la langue de l'utilisateur
- Les **prix** sont en **XAF** (Francs CFA)
- Les **coordonnées GPS** sont stockées avec PostGIS (latitude/longitude)
- Les **images** sont stockées comme URLs (intégration Cloudinary recommandée)

## 🚀 Prochaines étapes

1. Implémenter l'authentification JWT
2. Ajouter les endpoints pour les bookings
3. Intégrer Flutterwave pour les paiements
4. Ajouter la géolocalisation avec Google Maps
5. Implémenter le chat en temps réel avec Socket.io

---

Pour toute question, consultez la documentation backend dans `backend/README.md`.
