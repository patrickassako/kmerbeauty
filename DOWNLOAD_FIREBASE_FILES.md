# 🔥 Guide : Télécharger les fichiers Firebase corrects

## Étape 1 : Ouvrir Firebase Console

1. Aller sur : https://console.firebase.google.com
2. Cliquer sur votre projet : **kmerservice-d178f**

## Étape 2 : Aller dans Project Settings

1. Cliquer sur l'icône ⚙️ en haut à gauche
2. Cliquer sur **"Project settings"**

## Étape 3 : Section "Your apps"

Vous devriez voir une section qui dit "Your apps" avec 3 icônes :
- 🤖 Android
- 🍎 iOS
- 🌐 Web

### Pour ANDROID :

1. Si vous voyez déjà une app Android avec le package `com.kmerservices.app` :
   - Cliquer dessus
   - Descendre et cliquer sur **"Download google-services.json"**

2. Si vous NE voyez PAS d'app Android :
   - Cliquer sur l'icône Android 🤖
   - **Android package name** : `com.kmerservices.app`
   - **App nickname** (optionnel) : KmerServices
   - Cliquer sur **"Register app"**
   - Télécharger **google-services.json** quand proposé
   - Continuer jusqu'à la fin (vous pouvez skip les autres étapes)

3. Une fois téléchargé :
   ```bash
   # Copier le fichier dans votre projet
   cp ~/Downloads/google-services.json /home/user/kmerservices/mobile/
   ```

### Pour iOS :

1. Si vous voyez déjà une app iOS avec le bundle ID `com.kmerservices.app` :
   - Cliquer dessus
   - Descendre et cliquer sur **"Download GoogleService-Info.plist"**

2. Si vous NE voyez PAS d'app iOS :
   - Cliquer sur l'icône iOS 🍎
   - **iOS bundle ID** : `com.kmerservices.app`
   - **App nickname** (optionnel) : KmerServices
   - Cliquer sur **"Register app"**
   - Télécharger **GoogleService-Info.plist** quand proposé
   - Continuer jusqu'à la fin (vous pouvez skip les autres étapes)

3. Une fois téléchargé :
   ```bash
   # Copier le fichier dans votre projet
   cp ~/Downloads/GoogleService-Info.plist /home/user/kmerservices/mobile/
   ```

## ✅ Vérification

À la fin, vous devriez avoir :
- ✅ `/home/user/kmerservices/mobile/google-services.json`
- ✅ `/home/user/kmerservices/mobile/GoogleService-Info.plist`

Ces deux fichiers sont référencés dans votre `app.json` :
- Ligne 18 : `"googleServicesFile": "./GoogleService-Info.plist"`
- Ligne 26 : `"googleServicesFile": "./google-services.json"`

## ⚠️ IMPORTANT

Le fichier **service_account.json** que vous m'avez montré :
- ❌ N'est PAS utilisé dans notre implémentation
- ❌ Ne le mettez PAS dans le projet mobile
- ⚠️ Gardez-le secret (ne le commitez jamais sur Git)

## 🚀 Prochaine étape

Une fois que vous avez les deux fichiers, passez à la configuration Supabase.
