# Migrations Supabase

Ce dossier contient toutes les migrations de la base de données pour KmerServices.

## Comment appliquer les migrations

### Option 1 : Via psql (PostgreSQL)

```bash
# Se connecter à votre base de données
psql -U postgres -d kmerservices

# Appliquer chaque migration dans l'ordre
\i 001_add_users_insert_policy.sql
\i 002_restructure_for_client_provider_flow.sql
\i 003_add_reviews_triggers.sql
```

### Option 2 : Via ligne de commande directe

```bash
# Appliquer une migration spécifique
psql -U postgres -d kmerservices -f backend/supabase/migrations/003_add_reviews_triggers.sql
```

### Option 3 : Via Supabase CLI (si configuré)

```bash
supabase migration up
```

## Liste des migrations

### 001_add_users_insert_policy.sql
Ajoute les politiques RLS pour permettre aux utilisateurs de créer leurs propres comptes.

### 002_restructure_for_client_provider_flow.sql
Restructuration majeure du schéma pour séparer les flux client et prestataire.

### 003_add_reviews_triggers.sql ⭐ **NOUVEAU**
**Calcul automatique des ratings et review_count**

Cette migration ajoute des triggers PostgreSQL qui mettent à jour automatiquement :
- `therapists.rating` et `therapists.review_count`
- `salons.rating` et `salons.review_count`

Les triggers se déclenchent automatiquement lors :
- ✅ **INSERT** - Ajout d'une nouvelle review
- ✅ **UPDATE** - Modification d'une review existante
- ✅ **DELETE** - Suppression d'une review

**Important** : Cette migration rend obsolète la mise à jour manuelle des stats dans le code. Les ratings se calculent maintenant automatiquement côté base de données !

## Vérifier les triggers actifs

```sql
-- Liste tous les triggers sur la table reviews
SELECT
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'reviews';
```

## Tester les triggers

```sql
-- Insérer une nouvelle review pour un thérapeute
INSERT INTO reviews (id, user_id, therapist_id, rating, comment, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '56811604-9372-479f-a3ee-35056e5812dd',
  '23456789-abcd-4ef0-1234-56789abcdef0',
  5,
  'Test automatique des triggers',
  NOW(),
  NOW()
);

-- Vérifier que le rating s'est mis à jour automatiquement
SELECT id, rating, review_count FROM therapists
WHERE id = '23456789-abcd-4ef0-1234-56789abcdef0';

-- Supprimer la review de test
DELETE FROM reviews WHERE comment = 'Test automatique des triggers';

-- Vérifier que le rating s'est recalculé
SELECT id, rating, review_count FROM therapists
WHERE id = '23456789-abcd-4ef0-1234-56789abcdef0';
```

## Notes importantes

- Les migrations doivent être appliquées **dans l'ordre** (001, 002, 003, etc.)
- Toujours faire un backup avant d'appliquer une migration en production
- Les triggers sont automatiquement activés après leur création
- Les triggers fonctionnent même si les reviews sont ajoutées directement en SQL
