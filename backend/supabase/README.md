# Configuration Supabase pour KmerServices

## 📋 Tables créées

### Utilisateurs & Authentification
- **users** - Utilisateurs (clients + prestataires)
- **addresses** - Adresses multiples avec géolocalisation

### Prestataires
- **therapists** - Thérapeutes indépendants
- **education** - Formations des thérapeutes
- **salons** - Salons de beauté
- **availability** - Disponibilités des thérapeutes

### Services
- **services** - Catalogue de services
- **therapist_services** - Services proposés par les thérapeutes
- **salon_services** - Services proposés par les salons

### Réservations
- **bookings** - Réservations
- **booking_items** - Détails des services réservés

### Paiements & Transactions
- **payments** - Paiements (Flutterwave, Mobile Money)
- **transactions** - Historique financier complet

### Communication
- **chats** - Conversations liées aux réservations
- **chat_messages** - Messages du chat

### Social
- **reviews** - Avis et notes
- **favorites** - Favoris des utilisateurs

## 🚀 Installation

### 1. Exécuter le schéma SQL

1. Allez sur votre projet Supabase: https://supabase.com/dashboard/project/yogfmkyfpfucbozlvwja
2. Cliquez sur **SQL Editor** dans le menu gauche
3. Cliquez sur **New query**
4. Copiez tout le contenu de `schema.sql`
5. Collez-le dans l'éditeur
6. Cliquez sur **Run** (ou Ctrl/Cmd + Enter)

⏱️ L'exécution prend environ 30 secondes.

### 2. Vérifier l'installation

```sql
-- Vérifier que toutes les tables sont créées
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Vous devriez voir 21 tables.

## 🔐 Row Level Security (RLS)

Le RLS est activé avec des policies de base. Vous devrez peut-être les ajuster selon vos besoins.

### Policies actuelles:
- **users**: Chacun voit/modifie son propre profil
- **bookings**: Clients et prestataires voient leurs réservations
- **chats**: Les participants voient les conversations
- **services**: Tout le monde peut lire (authentifié)

### Modifier les policies:

```sql
-- Exemple: Permettre aux admins de tout voir
CREATE POLICY admin_all_access ON users
  FOR ALL
  TO authenticated
  USING (
    auth.uid()::text IN (
      SELECT id::text FROM users WHERE role = 'ADMIN'
    )
  );
```

## 📊 Données de test

### Créer un utilisateur client

```sql
INSERT INTO users (email, phone, password, first_name, last_name, role)
VALUES (
  'client@test.cm',
  '+237690000001',
  'hashed_password_here', -- Utilisez bcrypt dans votre backend
  'Jean',
  'Dupont',
  'CLIENT'
);
```

### Créer un service

```sql
INSERT INTO services (name, description, category, duration, base_price, images)
VALUES (
  'Coiffure Femme',
  'Coiffure complète avec shampooing et brushing',
  'HAIRDRESSING',
  90,
  15000,
  ARRAY['https://example.com/image1.jpg']
);
```

## 🗺️ Géolocalisation

Le schéma utilise PostGIS pour la géolocalisation.

### Rechercher les thérapeutes près d'un point:

```sql
SELECT
  t.*,
  ST_Distance(
    t.location::geography,
    ST_SetSRID(ST_MakePoint(9.7679, 4.0511), 4326)::geography
  ) / 1000 AS distance_km
FROM therapists t
WHERE ST_DWithin(
  t.location::geography,
  ST_SetSRID(ST_MakePoint(9.7679, 4.0511), 4326)::geography,
  10000 -- 10km
)
ORDER BY distance_km;
```

## 🔄 Migrations futures

Pour ajouter des colonnes ou modifier le schéma:

1. Créez un fichier `migrations/001_nom_migration.sql`
2. Exécutez-le dans le SQL Editor
3. Documentez les changements

## 📱 Connexion depuis le backend

Le backend NestJS est déjà configuré avec le `SupabaseService`.

### Exemple d'utilisation:

```typescript
// Dans un service
const { data, error } = await this.supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();
```

## 🛠️ Maintenance

### Sauvegardes

Supabase fait des sauvegardes automatiques quotidiennes (plan gratuit: 7 jours de rétention).

### Surveillance

- Dashboard Supabase: https://supabase.com/dashboard/project/yogfmkyfpfucbozlvwja
- Logs API: Project Settings > API
- Database: Database > Logs

## 🔗 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
