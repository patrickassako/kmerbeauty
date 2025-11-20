# 🔔 Configuration des Push Notifications

Guide complet pour configurer les notifications push avec Firebase Cloud Messaging et Supabase Edge Functions.

## 📋 Prérequis

- ✅ Projet Firebase créé
- ✅ Projet Supabase actif
- ✅ Extension `pg_net` activée dans Supabase (pour les requêtes HTTP)

---

## 🚀 Étape 1 : Configuration Firebase

### 1.1 Télécharger les fichiers de configuration

#### Pour Android :
1. Aller dans [Firebase Console](https://console.firebase.google.com)
2. Sélectionner votre projet
3. Aller dans **Project Settings** (⚙️) → **General**
4. Sous "Your apps", cliquer sur l'icône Android
5. Télécharger `google-services.json`
6. **Copier le fichier** dans `/mobile/` (remplacer `google-services.json.template`)

#### Pour iOS :
1. Dans Firebase Console, même section
2. Cliquer sur l'icône iOS
3. Télécharger `GoogleService-Info.plist`
4. **Copier le fichier** dans `/mobile/` (remplacer `GoogleService-Info.plist.template`)

### 1.2 Récupérer la clé serveur FCM

1. Dans Firebase Console → **Project Settings** → **Cloud Messaging**
2. Sous "Project credentials", copier la **Server key** (Legacy)
3. **Sauvegarder cette clé**, nous l'utiliserons plus tard

---

## 🗄️ Étape 2 : Configuration Base de Données

### 2.1 Ajouter la colonne fcm_token

Exécuter le script SQL dans Supabase SQL Editor :

```bash
# Copier le contenu de ce fichier dans l'éditeur SQL Supabase
/database/migrations/add_fcm_token.sql
```

OU via la ligne de commande :
```bash
psql "postgresql://postgres:[VOTRE_MOT_DE_PASSE]@[VOTRE_HOST]:5432/postgres" < database/migrations/add_fcm_token.sql
```

### 2.2 Activer l'extension pg_net

Dans Supabase SQL Editor, exécuter :
```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### 2.3 Configurer les variables d'environnement

Remplacer les valeurs par les vôtres :
```sql
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://VOTRE_PROJECT.supabase.co';
ALTER DATABASE postgres SET app.settings.service_role_key = 'VOTRE_SERVICE_ROLE_KEY';
```

**IMPORTANT:**
- `VOTRE_SERVICE_ROLE_KEY` se trouve dans Supabase Dashboard → Settings → API → service_role key (secret)
- ⚠️ Ne JAMAIS exposer cette clé côté client !

---

## ⚡ Étape 3 : Déployer les Edge Functions

### 3.1 Installer Supabase CLI

```bash
npm install -g supabase
```

### 3.2 Login Supabase

```bash
supabase login
```

### 3.3 Lier votre projet

```bash
cd /home/user/kmerservices
supabase link --project-ref VOTRE_PROJECT_REF
```

Votre `PROJECT_REF` se trouve dans Supabase Dashboard → Settings → General → Reference ID

### 3.4 Déployer l'Edge Function

```bash
supabase functions deploy send-push-notification
```

### 3.5 Configurer les secrets

```bash
supabase secrets set SUPABASE_URL=https://VOTRE_PROJECT.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=VOTRE_SERVICE_ROLE_KEY
```

---

## 🔧 Étape 4 : Créer les Triggers SQL

Exécuter le script de triggers dans Supabase SQL Editor :

```bash
# Copier le contenu de ce fichier
/database/migrations/create_notification_triggers.sql
```

Cela va créer automatiquement les triggers pour :
- ✅ Nouvelle commande → Notifier le prestataire
- ✅ Commande confirmée → Notifier le client
- ✅ Commande en cours → Notifier le client
- ✅ Commande terminée → Notifier le client
- ✅ Commande annulée → Notifier les deux parties
- ✅ Nouveau message → Notifier le destinataire

---

## 📱 Étape 5 : Configuration Mobile

### 5.1 Mettre à jour firebase.config.ts

Éditer `/mobile/src/config/firebase.config.ts` avec vos vraies valeurs Firebase.

### 5.2 Rebuild l'application

```bash
cd mobile
npx expo prebuild
npx expo run:android   # Pour Android
npx expo run:ios       # Pour iOS
```

**Note:** `expo prebuild` est nécessaire pour intégrer les fichiers `google-services.json` et `GoogleService-Info.plist` dans les projets natifs.

---

## ✅ Étape 6 : Tester les Notifications

### Test 1 : Vérifier l'enregistrement du token

1. Lancer l'app sur un appareil physique (pas simulateur)
2. Se connecter avec un compte
3. Vérifier les logs :
   ```
   📱 Expo Push Token: ExponentPushToken[...]
   💾 Enregistrement du token pour l'utilisateur: [UUID]
   ✅ Token FCM enregistré avec succès
   ```
4. Vérifier dans Supabase → Table Editor → users que la colonne `fcm_token` est remplie

### Test 2 : Notification de commande

1. Créer une nouvelle commande depuis l'app client
2. Le prestataire devrait recevoir une notification : "🔔 Nouvelle commande !"
3. Confirmer la commande côté prestataire
4. Le client devrait recevoir : "✅ Commande confirmée"

### Test 3 : Notification de message

1. Envoyer un message dans un chat
2. L'autre personne devrait recevoir une notification avec le contenu du message

### Test Manuel : Envoyer une notification de test

Via Supabase SQL Editor :
```sql
SELECT send_push_notification(
  'USER_ID_A_REMPLACER'::uuid,
  'Test Notification',
  'Ceci est un test',
  '{"type": "admin"}'::jsonb
);
```

---

## 🐛 Troubleshooting

### Problème : "No FCM token for this user"
**Solution :** L'utilisateur n'a pas donné la permission ou l'app n'est pas sur un appareil physique.

### Problème : "Failed to send notification"
**Solutions :**
1. Vérifier que le token Expo est valide (pas expiré)
2. Vérifier que l'app est bien buildée avec `expo prebuild`
3. Vérifier les logs de l'Edge Function : `supabase functions logs send-push-notification`

### Problème : Les triggers ne s'exécutent pas
**Solutions :**
1. Vérifier que `pg_net` est activé : `SELECT * FROM pg_extension WHERE extname = 'pg_net';`
2. Vérifier les variables : `SHOW app.settings.supabase_url;`
3. Regarder les logs Supabase pour voir les erreurs

### Problème : Permission de notification refusée
**Solution :**
1. Demander à nouveau la permission via les paramètres de l'app
2. Sur iOS : Settings → Notifications → KmerServices
3. Sur Android : Settings → Apps → KmerServices → Permissions → Notifications

---

## 📊 Monitoring

### Voir les logs des Edge Functions

```bash
supabase functions logs send-push-notification --tail
```

### Voir les notifications envoyées

Créer une vue dans Supabase :
```sql
-- Optionnel : table d'historique des notifications
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  title TEXT,
  body TEXT,
  data JSONB,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎉 C'est terminé !

Vos notifications push sont maintenant configurées et fonctionnelles !

### Ce qui est automatisé :
- ✅ Enregistrement du token au login
- ✅ Notifications pour tous les événements de commande
- ✅ Notifications pour les nouveaux messages
- ✅ Navigation automatique lors du tap sur une notification

### À faire manuellement pour les notifications admin :
Appeler l'Edge Function ou le trigger SQL selon vos besoins.

---

## 📚 Documentation Supplémentaire

- [Expo Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [pg_net Extension](https://supabase.com/docs/guides/database/extensions/pg_net)
