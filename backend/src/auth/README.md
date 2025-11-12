# Module d'Authentification KmerServices

Module d'authentification complet pour l'API backend avec Supabase.

## 📋 Endpoints disponibles

### 1. **Inscription**
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "client@example.cm",
  "phone": "+237690000001",
  "password": "motdepasse123",
  "firstName": "Jean",
  "lastName": "Dupont",
  "role": "CLIENT",
  "language": "FRENCH",
  "city": "Douala",
  "region": "Littoral"
}
```

**Réponse** :
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "user": {
    "id": "uuid",
    "email": "client@example.cm",
    "phone": "+237690000001",
    "firstName": "Jean",
    "lastName": "Dupont",
    "role": "CLIENT",
    "language": "FRENCH"
  }
}
```

---

### 2. **Connexion**
```http
POST /auth/signin
Content-Type: application/json

{
  "emailOrPhone": "client@example.cm", // OU "+237690000001"
  "password": "motdepasse123"
}
```

**Réponse** : Identique à l'inscription

---

### 3. **Rafraîchir le token**
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGci..."
}
```

**Réponse** :
```json
{
  "accessToken": "nouveau_token..."
}
```

---

### 4. **Déconnexion**
```http
POST /auth/signout
Authorization: Bearer eyJhbGci...
```

---

### 5. **Obtenir le profil actuel**
```http
GET /auth/me
Authorization: Bearer eyJhbGci...
```

**Réponse** :
```json
{
  "id": "uuid",
  "email": "client@example.cm",
  "phone": "+237690000001",
  "firstName": "Jean",
  "lastName": "Dupont",
  "role": "CLIENT",
  "language": "FRENCH",
  "avatar": null,
  "city": "Douala",
  "region": "Littoral",
  "isVerified": false
}
```

## 🛡️ Utilisation du AuthGuard

Pour protéger une route, utilisez le `@UseGuards(AuthGuard)` :

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth/guards/auth.guard';

@Controller('protected')
export class ProtectedController {
  @Get()
  @UseGuards(AuthGuard)
  async getProtectedData(@Req() req: any) {
    // req.user contient les infos de l'utilisateur authentifié
    console.log(req.user.id);
    console.log(req.user.role);
    return { message: 'Accès autorisé' };
  }
}
```

## 📱 Exemple depuis le mobile (React Native)

```typescript
import { supabase } from './lib/supabase';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Inscription
async function signUp(data) {
  const response = await axios.post(`${API_URL}/auth/signup`, data);
  const { accessToken, refreshToken, user } = response.data;

  // Sauvegarder les tokens
  await AsyncStorage.setItem('accessToken', accessToken);
  await AsyncStorage.setItem('refreshToken', refreshToken);

  return user;
}

// Connexion
async function signIn(emailOrPhone, password) {
  const response = await axios.post(`${API_URL}/auth/signin`, {
    emailOrPhone,
    password,
  });

  const { accessToken, refreshToken, user } = response.data;
  await AsyncStorage.setItem('accessToken', accessToken);
  await AsyncStorage.setItem('refreshToken', refreshToken);

  return user;
}

// Appel API protégé
async function getProfile() {
  const token = await AsyncStorage.getItem('accessToken');

  const response = await axios.get(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}
```

## 🔐 Sécurité

### Validation des données
- Email : Format valide
- Téléphone : Format camerounais `+237XXXXXXXXX`
- Mot de passe : Minimum 8 caractères
- Hachage : bcrypt avec salt de 10

### Tokens JWT
- Access Token : Validité courte (configurable dans Supabase)
- Refresh Token : Validité longue (7-30 jours)
- Stockage sécurisé recommandé : `expo-secure-store` sur mobile

### Row Level Security (RLS)
Les policies Supabase sont activées pour protéger les données.

## ⚙️ Configuration requise

### Variables d'environnement (.env)

```env
SUPABASE_URL=https://yogfmkyfpfucbozlvwja.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
```

## 🧪 Tester l'API

### Avec cURL

```bash
# Inscription
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.cm",
    "phone": "+237690000001",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "role": "CLIENT"
  }'

# Connexion
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrPhone": "test@example.cm",
    "password": "password123"
  }'

# Profil (avec le token reçu)
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Avec Postman / Insomnia

1. Créer une collection "KmerServices Auth"
2. Ajouter les 5 endpoints ci-dessus
3. Utiliser la variable `{{baseUrl}}` = `http://localhost:3000`
4. Pour les routes protégées, ajouter le header `Authorization: Bearer {{token}}`

## 🚨 Gestion des erreurs

### Erreurs courantes

| Code | Message | Cause |
|------|---------|-------|
| 409 | Email déjà utilisé | Email existe dans la base |
| 409 | Téléphone déjà utilisé | Téléphone existe dans la base |
| 401 | Identifiants incorrects | Email/téléphone ou mot de passe erroné |
| 401 | Compte désactivé | `is_active = false` |
| 401 | Token invalide | Token expiré ou corrompu |
| 401 | Token manquant | Header Authorization absent |

### Format des erreurs

```json
{
  "statusCode": 401,
  "message": "Identifiants incorrects",
  "error": "Unauthorized"
}
```

## 📊 Rôles disponibles

```typescript
enum UserRole {
  CLIENT = 'CLIENT',      // Client qui réserve des services
  PROVIDER = 'PROVIDER',  // Thérapeute ou propriétaire de salon
  ADMIN = 'ADMIN',        // Administrateur de la plateforme
}
```

## 🌍 Langues supportées

```typescript
enum Language {
  FRENCH = 'FRENCH',   // Français
  ENGLISH = 'ENGLISH', // Anglais
}
```

La langue par défaut est le français.

## 🔄 Workflow complet

```
1. Inscription → GET accessToken + refreshToken
2. Stocker les tokens (AsyncStorage ou SecureStore)
3. Utiliser accessToken pour les requêtes API
4. Quand accessToken expire → Utiliser refreshToken pour en obtenir un nouveau
5. À la déconnexion → Supprimer les tokens stockés
```

## 📝 Notes importantes

- ✅ Le téléphone est **obligatoire** au Cameroun
- ✅ Format téléphone : `+237` suivi de 9 chiffres
- ✅ La connexion accepte **email OU téléphone**
- ✅ Les mots de passe sont hachés avec bcrypt
- ✅ Supabase gère automatiquement l'expiration des tokens

## 🔗 Ressources

- [Documentation NestJS](https://docs.nestjs.com)
- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth)
- [Bcrypt](https://www.npmjs.com/package/bcrypt)
