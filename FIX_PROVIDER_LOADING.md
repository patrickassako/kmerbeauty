# Fix: Les prestataires ne se chargent pas

## Problème
Lorsque vous cliquez sur un service, la page "ServiceProvidersScreen" ne charge aucun prestataire (thérapeutes ou salons).

## Cause
Les tables de liaison `therapist_services` et `salon_services` n'existent pas dans la base de données. Ces tables sont nécessaires pour associer les services aux prestataires qui les offrent.

## Solution

### Étape 1: Exécuter le script SQL

1. **Ouvrez Supabase Dashboard**
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet

2. **Ouvrez SQL Editor**
   - Dans le menu de gauche, cliquez sur "SQL Editor"

3. **Exécutez le script**
   - Ouvrez le fichier `backend/scripts/create-provider-service-links.sql`
   - Copiez tout le contenu du fichier
   - Collez-le dans le SQL Editor
   - Cliquez sur le bouton "Run" (en bas à droite)

4. **Vérifiez les résultats**
   - Le script affichera un tableau de vérification montrant:
     - Nombre total de liens créés pour therapist_services
     - Nombre total de liens créés pour salon_services
     - Nombre de thérapeutes uniques
     - Nombre de salons uniques
     - Nombre de services uniques

### Étape 2: Redémarrer le backend

```bash
cd backend
npm run start:dev
```

### Étape 3: Tester l'application

1. Ouvrez l'application mobile
2. Cliquez sur n'importe quel service
3. Vous devriez maintenant voir la liste des prestataires qui offrent ce service

## Ce que fait le script

Le script SQL:

1. **Crée deux tables de liaison:**
   - `therapist_services`: associe chaque thérapeute aux services qu'il offre
   - `salon_services`: associe chaque salon aux services qu'il offre

2. **Peuple automatiquement les tables:**
   - Tous les thérapeutes actifs sont liés à tous les services actifs
   - Tous les salons actifs sont liés à tous les services actifs
   - Utilise le `base_price` et `duration` de chaque service par défaut

3. **Ajoute des index pour les performances:**
   - Index sur `therapist_id`, `service_id`, `is_active`
   - Index sur `salon_id`, `service_id`, `is_active`

4. **Configure Row Level Security (RLS):**
   - Tout le monde peut voir les services des prestataires
   - Seuls les propriétaires peuvent modifier leurs propres services

## Personnalisation ultérieure

Après avoir exécuté le script, vous pouvez:

1. **Modifier les prix spécifiques** pour chaque prestataire:
```sql
UPDATE therapist_services
SET price = 35000
WHERE therapist_id = 'xxx' AND service_id = 'yyy';
```

2. **Désactiver certains services** pour un prestataire:
```sql
UPDATE therapist_services
SET is_active = false
WHERE therapist_id = 'xxx' AND service_id = 'yyy';
```

3. **Ajouter de nouveaux services** à un prestataire:
```sql
INSERT INTO therapist_services (therapist_id, service_id, price, duration)
VALUES ('therapist-uuid', 'service-uuid', 50000, 90);
```

## Fichiers modifiés

### Backend
- `backend/src/therapists/therapists.service.ts` - Ajout de vérifications null
- `backend/src/salons/salons.service.ts` - Ajout de vérifications null
- `backend/supabase/migrations/003_create_provider_service_links.sql` - Migration
- `backend/scripts/create-provider-service-links.sql` - Script manuel

## Vérification

Pour vérifier que tout fonctionne:

```sql
-- Vérifier combien de services chaque thérapeute offre
SELECT
  t.id,
  u.first_name,
  u.last_name,
  COUNT(ts.service_id) as service_count
FROM therapists t
JOIN users u ON t.user_id = u.id
LEFT JOIN therapist_services ts ON t.id = ts.therapist_id AND ts.is_active = true
GROUP BY t.id, u.first_name, u.last_name
ORDER BY service_count DESC;

-- Vérifier combien de prestataires offrent chaque service
SELECT
  s.name_fr,
  s.name_en,
  COUNT(DISTINCT ts.therapist_id) as therapist_count,
  COUNT(DISTINCT ss.salon_id) as salon_count,
  COUNT(DISTINCT ts.therapist_id) + COUNT(DISTINCT ss.salon_id) as total_providers
FROM services s
LEFT JOIN therapist_services ts ON s.id = ts.service_id AND ts.is_active = true
LEFT JOIN salon_services ss ON s.id = ss.service_id AND ss.is_active = true
GROUP BY s.id, s.name_fr, s.name_en
ORDER BY total_providers DESC;
```
