# Module Supabase pour KmerServices Backend

Ce module fournit l'intégration avec Supabase pour le backend NestJS.

## Configuration

Les variables d'environnement suivantes sont requises dans `.env`:

```env
SUPABASE_URL=https://yogfmkyfpfucbozlvwja.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Utilisation

Le `SupabaseModule` est global, vous pouvez donc injecter `SupabaseService` dans n'importe quel service:

```typescript
import { Injectable } from '@nestjs/common';
import { SupabaseService } from './supabase/supabase.service';

@Injectable()
export class UsersService {
  constructor(private supabase: SupabaseService) {}

  async findAll() {
    const { data, error } = await this.supabase
      .from('users')
      .select('*');

    if (error) throw error;
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(userData: any) {
    const { data, error } = await this.supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, userData: any) {
    const { data, error } = await this.supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async remove(id: string) {
    const { error } = await this.supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
```

## Fonctionnalités disponibles

### 1. Opérations de base de données

```typescript
// SELECT
await this.supabase.from('users').select('*');

// INSERT
await this.supabase.from('users').insert({ name: 'John' });

// UPDATE
await this.supabase.from('users').update({ name: 'Jane' }).eq('id', '123');

// DELETE
await this.supabase.from('users').delete().eq('id', '123');
```

### 2. Authentification

```typescript
// Créer un utilisateur
await this.supabase.auth.admin.createUser({
  email: 'user@example.com',
  password: 'password',
});

// Obtenir un utilisateur
await this.supabase.auth.admin.getUserById(userId);
```

### 3. Storage

```typescript
// Upload un fichier
await this.supabase.storage
  .from('avatars')
  .upload('public/avatar.png', file);

// Obtenir l'URL publique
const { data } = this.supabase.storage
  .from('avatars')
  .getPublicUrl('public/avatar.png');
```

### 4. Fonctions RPC (PostgreSQL)

```typescript
// Appeler une fonction PostgreSQL
await this.supabase.rpc('calculate_distance', {
  lat1: 3.8480,
  lng1: 11.5021,
  lat2: 4.0511,
  lng2: 9.7679,
});
```

## Avantages par rapport à Prisma

- ✅ Pas besoin de DATABASE_URL complexe
- ✅ Authentification intégrée
- ✅ Row Level Security (RLS) automatique
- ✅ Realtime subscriptions
- ✅ Storage pour les fichiers
- ✅ Pas de migrations manuelles (utiliser le dashboard Supabase)
