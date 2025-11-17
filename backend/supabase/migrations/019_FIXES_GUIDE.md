# Guide de Corrections - Prestataires et Réservations

## 🔧 Problèmes Résolus

### 1. ✅ Dashboard Prestataire - EN-TÊTE DÉJÀ CORRIGÉ

**Statut:** Déjà corrigé dans les commits précédents

Le dashboard prestataire affiche maintenant les **vraies données** :
- Logo: `K-B` (au lieu de `S`)
- Localisation: Données réelles de `user?.city, user?.region` (au lieu de "Notre-Dame - 754 Paris, France")
- Nom: Données réelles de `user?.first_name, user?.last_name` (au lieu de "Claire Smith")

**Fichier:** `mobile/src/screens/contractor/ContractorDashboardScreen.tsx`
- Ligne 99: Logo "K-B"
- Ligne 103: Localisation réelle
- Ligne 126: Nom réel de l'utilisateur

**Action requise:** Redémarrez l'application mobile pour voir les changements.

### 2. 🔍 Proposals Prestataire - VÉRIFICATION REQUISE

**Statut:** Code semble correct, nécessite test

**Backend:**
- Endpoint: `GET /api/v1/proposals/contractor/:contractorId`
- Controller: `backend/src/proposal/proposal.controller.ts:40`
- Service: `backend/src/proposal/proposal.service.ts:85`

Le code backend récupère correctement :
```typescript
supabase
  .from('proposals')
  .select(`
    *,
    client:users!proposals_client_id_fkey(id, first_name, last_name, email, phone, avatar)
  `)
  .eq('contractor_id', contractorId)
```

**Mobile:**
- Screen: `mobile/src/screens/contractor/ContractorProposalsScreen.tsx`
- Flux:
  1. Charge le profil contractor via `contractorApi.getProfileByUserId(user?.id)`
  2. Récupère les proposals via `proposalApi.getForContractor(profile.id)`

**Tests à effectuer:**
1. Connectez-vous avec un compte prestataire
2. Allez dans l'onglet "Proposals"
3. Vérifiez si les propositions s'affichent
4. Vérifiez les logs backend pour voir si l'endpoint est appelé

**Si ça ne fonctionne pas:**
- Vérifiez les logs backend pour voir les erreurs
- Vérifiez que le `contractor_id` est bien récupéré
- Vérifiez que des proposals existent dans la DB pour ce contractor

### 3. ❌ Réservations (Bookings) - ERREUR RLS CORRIGÉE

**Problème:**
```
Failed to create booking: new row violates row-level security policy for table "bookings"
```

**Cause:** La table `bookings` avait RLS activé mais **seulement une policy SELECT**.
Il manquait les policies INSERT/UPDATE/DELETE.

**Solution:** Migration 019 créée

**Migration:** `019_fix_bookings_rls_policies.sql`

Cette migration ajoute :
- ✅ **INSERT policy** : Les clients peuvent créer des réservations
- ✅ **UPDATE policy** : Les clients et prestataires peuvent modifier
- ✅ **DELETE policy** : Les clients peuvent supprimer leurs réservations

## 📝 Comment Appliquer la Migration 019

### Option 1: Supabase Dashboard SQL Editor (Recommandé)

1. Allez sur votre dashboard Supabase
2. Ouvrez **SQL Editor**
3. Copiez le contenu de `019_fix_bookings_rls_policies.sql`
4. Collez et exécutez
5. Vérifiez les messages de succès

### Option 2: Supabase CLI

```bash
cd backend
npx supabase db push
```

## ✅ Vérification Post-Migration

Après avoir appliqué la migration 019:

### Test Backend (via logs):
```bash
# Dans les logs backend, vous devriez voir :
[Nest] POST /api/v1/bookings - 200ms ✅
```

### Test Mobile:
1. Connectez-vous en tant que client
2. Sélectionnez un service
3. Choisissez un prestataire
4. Remplissez les détails de réservation
5. Cliquez sur "Book"
6. ✅ La réservation devrait se créer sans erreur

### Requête SQL de Vérification:

```sql
-- Vérifier les policies RLS pour bookings
SELECT
  schemaname,
  tablename,
  policyname,
  CASE cmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    ELSE cmd
  END as operation
FROM pg_policies
WHERE tablename = 'bookings'
ORDER BY policyname;
```

**Résultat attendu:**
```
policyname                | operation
--------------------------|----------
bookings_delete_own       | DELETE
bookings_insert_client    | INSERT
bookings_select_own       | SELECT
bookings_update_own       | UPDATE
```

## 🚀 Checklist Complète

- [x] Dashboard prestataire corrigé (logo K-B, données réelles)
- [ ] Tester proposals prestataire
- [x] Migration RLS bookings créée
- [ ] Migration 019 appliquée dans Supabase
- [ ] Test création de réservation réussie

## 📞 Support

Si après avoir appliqué la migration, vous rencontrez toujours des problèmes:

1. **Vérifier les logs backend** : Recherchez les erreurs détaillées
2. **Vérifier l'authentification** : Assurez-vous que `auth.uid()` retourne bien l'ID utilisateur
3. **Vérifier les données** : Consultez la table bookings pour voir si l'insertion a fonctionné

## 🔄 Rollback (si nécessaire)

Si vous devez annuler la migration 019:

```sql
-- Supprimer les policies ajoutées
DROP POLICY IF EXISTS bookings_insert_client ON bookings;
DROP POLICY IF EXISTS bookings_update_own ON bookings;
DROP POLICY IF EXISTS bookings_delete_own ON bookings;
```

**Note:** Ne faites cela que si absolument nécessaire, car cela empêchera à nouveau les réservations de fonctionner.
