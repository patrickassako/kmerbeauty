# Guide de Débogage - Prestataires ne s'affichent pas

## Problème
Lorsqu'on clique sur un service, 0 prestataires s'affichent alors que des prestataires offrent ce service.

## Vérifications à faire

### 1. Vérifier que la base de données contient les données

```bash
# Se connecter à Supabase et exécuter ces requêtes SQL

-- Vérifier les services
SELECT id, name_fr, name_en FROM services LIMIT 5;

-- Vérifier les thérapeutes
SELECT id, user_id, city FROM therapists WHERE is_active = true LIMIT 5;

-- Vérifier les salons
SELECT id, name_fr, name_en, city FROM salons WHERE is_active = true LIMIT 5;

-- Vérifier les relations therapist_services
SELECT ts.id, t.id as therapist_id, s.name_fr as service_name
FROM therapist_services ts
JOIN therapists t ON t.id = ts.therapist_id
JOIN services s ON s.id = ts.service_id
WHERE ts.is_active = true
LIMIT 10;

-- Vérifier les relations salon_services
SELECT ss.id, sa.name_fr as salon_name, s.name_fr as service_name
FROM salon_services ss
JOIN salons sa ON sa.id = ss.salon_id
JOIN services s ON s.id = ss.service_id
WHERE ss.is_active = true
LIMIT 10;
```

### 2. Tester l'API Backend directement

```bash
# Récupérer tous les thérapeutes
curl http://localhost:3000/therapists

# Récupérer tous les salons
curl http://localhost:3000/salons

# Récupérer tous les services
curl http://localhost:3000/services

# Tester le filtrage par service (remplacer SERVICE_ID par un vrai ID)
curl "http://localhost:3000/therapists?serviceId=d1e2f3a4-b5c6-4d78-9e01-234567890abc"

curl "http://localhost:3000/salons?serviceId=d1e2f3a4-b5c6-4d78-9e01-234567890abc"
```

### 3. Ajouter des logs pour déboguer

#### Dans mobile/src/screens/main/ServiceProvidersScreen.tsx

Ajoutez après la ligne 40:

```typescript
// Debug logs
useEffect(() => {
  console.log('ServiceProvidersScreen - service.id:', service.id);
  console.log('Therapists loaded:', therapists.length);
  console.log('Salons loaded:', salons.length);
  console.log('Providers:', providers.length);
}, [therapists, salons, providers]);
```

#### Dans backend/src/therapists/therapists.service.ts

Ajoutez dans la fonction `findAll` après la ligne 34:

```typescript
console.log('Filtering therapists by serviceId:', serviceId);
console.log('Found therapists before filter:', data?.length);

// Filter by service if provided
if (serviceId) {
  const therapistIds = data.map((t) => t.id);
  console.log('Therapist IDs to check:', therapistIds);

  const { data: therapistServices, error: tsError } = await supabase
    .from('therapist_services')
    .select('therapist_id')
    .eq('service_id', serviceId)
    .in('therapist_id', therapistIds);

  console.log('Therapist services found:', therapistServices?.length);
  console.log('Error:', tsError);

  const filteredIds = therapistServices?.map((ts) => ts.therapist_id) || [];
  console.log('Filtered therapist IDs:', filteredIds);

  return data.filter((t) => filteredIds.includes(t.id));
}
```

### 4. Vérifier l'URL de l'API

Dans `mobile/.env`:
```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Si vous testez sur un appareil physique ou émulateur, utilisez l'adresse IP de votre machine:
```
EXPO_PUBLIC_API_URL=http://192.168.1.X:3000
```

### 5. Cas possibles

#### Cas 1: Base de données vide
**Solution**: Exécuter le script seed
```bash
# Depuis Supabase SQL Editor
# Copier tout le contenu de backend/prisma/seed.sql et l'exécuter
```

#### Cas 2: Backend non démarré
**Solution**: Démarrer le backend
```bash
cd backend
npm run start:dev
```

#### Cas 3: Problème de CORS
**Symptôme**: Erreur CORS dans la console du navigateur

**Solution**: Vérifier que le backend a CORS configuré dans `backend/src/main.ts`:
```typescript
app.enableCors({
  origin: '*', // En développement
  credentials: true,
});
```

#### Cas 4: Les IDs ne correspondent pas
**Solution**: Vérifier que les IDs dans la base correspondent aux IDs dans les relations

```sql
-- Trouver les services qui ont des prestataires
SELECT DISTINCT s.id, s.name_fr, COUNT(*) as provider_count
FROM services s
LEFT JOIN therapist_services ts ON ts.service_id = s.id
WHERE ts.is_active = true
GROUP BY s.id, s.name_fr;

-- Même chose pour les salons
SELECT DISTINCT s.id, s.name_fr, COUNT(*) as salon_count
FROM services s
LEFT JOIN salon_services ss ON ss.service_id = s.id
WHERE ss.is_active = true
GROUP BY s.id, s.name_fr;
```

#### Cas 5: Problème de typage TypeScript
Dans le backend, assurez-vous que les types correspondent:
- `serviceId` (camelCase) côté frontend
- `service_id` (snake_case) en base de données
- La conversion est faite automatiquement par Supabase

### 6. Test complet bout en bout

1. Démarrer le backend: `cd backend && npm run start:dev`
2. Vérifier qu'il tourne sur http://localhost:3000
3. Tester manuellement: `curl http://localhost:3000/services`
4. Copier un ID de service depuis la réponse
5. Tester le filtrage: `curl "http://localhost:3000/therapists?serviceId=<ID>"`
6. Si ça retourne des données, le backend fonctionne
7. Démarrer le mobile: `cd mobile && npm start`
8. Vérifier la console pour les logs
9. Cliquer sur un service et vérifier les logs réseau

### 7. Solution temporaire de contournement

Si le problème persiste, modifiez temporairement `ServiceProvidersScreen.tsx` pour afficher TOUS les prestataires sans filtre:

```typescript
// Temporaire: retirer le serviceId pour tester
const { therapists } = useTherapists(); // Sans params
const { salons } = useSalons(); // Sans params
```

Cela permettra de vérifier si le problème vient du filtrage ou de la récupération des données en général.
