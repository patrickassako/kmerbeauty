# Adaptations pour le Marché Camerounais

## 🇨🇲 Spécificités Cameroun

### Paiement Mobile avec Flutterwave

#### Moyens de Paiement Supportés
- **Orange Money** (Orange Cameroun)
- **MTN Mobile Money** (MTN Cameroun)
- Cartes bancaires (Visa, Mastercard)

#### Intégration Flutterwave
```typescript
// Package à utiliser
"flutterwave-react-native": "^1.3.0"

// Configuration
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxxxx
FLUTTERWAVE_SECRET_KEY=FLWSECK-xxxxx
FLUTTERWAVE_ENCRYPTION_KEY=xxxxx
```

### Devise
- **XAF (Franc CFA)** - Devise officielle
- Pas de centimes (arrondir les montants)
- Exemple : 25 000 XAF au lieu de €38

### Villes Principales (Lancement)
1. **Douala** - Capitale économique
2. **Yaoundé** - Capitale politique
3. **Bafoussam**
4. **Garoua**
5. **Bamenda**

### Langues
- Français (officiel)
- Anglais (officiel - régions anglophones)
- App en Français d'abord, Anglais plus tard

### Indicatifs Téléphoniques
- Code pays : +237
- Format : +237 6XX XXX XXX (9 chiffres)
- Opérateurs :
  - MTN : 67X, 68X, 65X
  - Orange : 69X, 65X

---

## 💰 Intégration Flutterwave

### Documentation Officielle
- [Flutterwave React Native](https://developer.flutterwave.com/docs/flutterwave-react-native)
- [Mobile Money API](https://developer.flutterwave.com/docs/collecting-payments/mobile-money)

### Flow de Paiement

```typescript
import { FlutterwaveButton } from 'flutterwave-react-native';

const paymentConfig = {
  tx_ref: generateTransactionRef(),
  authorization: FLUTTERWAVE_PUBLIC_KEY,
  amount: booking.total,
  currency: 'XAF',
  payment_options: 'mobilemoneycameroon',
  customer: {
    email: user.email,
    phonenumber: user.phone,
    name: `${user.firstName} ${user.lastName}`,
  },
  customizations: {
    title: 'KmerServices',
    description: 'Paiement pour service de beauté',
    logo: 'https://yourapp.com/logo.png',
  },
};

// Gestion des callbacks
const handleOnRedirect = (data) => {
  if (data.status === 'successful') {
    // Confirmer le paiement côté backend
    verifyPayment(data.transaction_id);
  }
};
```

### Méthodes de Paiement Disponibles

#### 1. Orange Money
```typescript
payment_options: 'mobilemoneycameroon'
payment_type: 'orange_money_cameroon'
```

#### 2. MTN Mobile Money
```typescript
payment_options: 'mobilemoneycameroon'
payment_type: 'mtn_mobile_money_cameroon'
```

#### 3. Carte Bancaire
```typescript
payment_options: 'card'
```

### Webhooks Flutterwave

```typescript
// Backend - NestJS
@Post('flutterwave/webhook')
async handleFlutterwaveWebhook(@Body() payload: any) {
  // Vérifier le secret hash
  const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
  const signature = req.headers['verif-hash'];

  if (signature !== secretHash) {
    throw new UnauthorizedException();
  }

  // Traiter l'événement
  if (payload.event === 'charge.completed') {
    await this.updatePaymentStatus(payload.data.tx_ref, 'SUCCEEDED');
  }
}
```

### Vérification de Paiement

```typescript
// Backend
import Flutterwave from 'flutterwave-node-v3';

const flw = new Flutterwave(
  process.env.FLUTTERWAVE_PUBLIC_KEY,
  process.env.FLUTTERWAVE_SECRET_KEY
);

async verifyPayment(transactionId: string) {
  const response = await flw.Transaction.verify({ id: transactionId });

  if (
    response.data.status === "successful" &&
    response.data.amount === expectedAmount &&
    response.data.currency === "XAF"
  ) {
    // Confirmer la réservation
    await this.confirmBooking(response.data.tx_ref);
  }
}
```

---

## 📍 Géolocalisation au Cameroun

### Configuration Google Maps

```typescript
// Centrer sur le Cameroun par défaut
const DEFAULT_REGION = {
  latitude: 3.848, // Yaoundé
  longitude: 11.5021,
  latitudeDelta: 5,
  longitudeDelta: 5,
};

const DOUALA_COORDS = {
  latitude: 4.0511,
  longitude: 9.7679,
};
```

### Villes Principales (Coordonnées)

```typescript
export const CAMEROON_CITIES = {
  DOUALA: { lat: 4.0511, lng: 9.7679, name: 'Douala' },
  YAOUNDE: { lat: 3.848, lng: 11.5021, name: 'Yaoundé' },
  BAFOUSSAM: { lat: 5.4781, lng: 10.4178, name: 'Bafoussam' },
  GAROUA: { lat: 9.3015, lng: 13.3969, name: 'Garoua' },
  BAMENDA: { lat: 5.9597, lng: 10.1463, name: 'Bamenda' },
  MAROUA: { lat: 10.5912, lng: 14.3159, name: 'Maroua' },
  NGAOUNDERE: { lat: 7.3167, lng: 13.5833, name: 'Ngaoundéré' },
  BERTOUA: { lat: 4.5775, lng: 13.6844, name: 'Bertoua' },
  LIMBE: { lat: 4.0233, lng: 9.2056, name: 'Limbé' },
  KRIBI: { lat: 2.9386, lng: 9.9083, name: 'Kribi' },
};
```

### Adresses au Cameroun

```typescript
// Format d'adresse camerounaise
interface CameroonAddress {
  quarter: string;      // Quartier (ex: "Akwa", "Bonanjo", "Bastos")
  street?: string;      // Rue (optionnel)
  landmark: string;     // Point de repère (très important!)
  city: string;         // Ville
  region: string;       // Région
  phone: string;        // Téléphone (essentiel pour trouver)
}

// Exemple
{
  quarter: "Akwa",
  landmark: "Près de la pharmacie du rond-point",
  city: "Douala",
  region: "Littoral",
  phone: "+237 699 123 456"
}
```

---

## 🔔 Notifications SMS (Alternative à Push)

### Pourquoi SMS au Cameroun ?
- Connexion internet parfois instable
- Couverture réseau mobile excellente
- SMS très utilisé pour confirmations

### Service SMS Recommandé
**Twilio** ou **Africa's Talking**

```typescript
// Intégration Twilio pour SMS
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async sendBookingConfirmation(phone: string, booking: Booking) {
  await client.messages.create({
    body: `Votre rendez-vous est confirmé pour le ${formatDate(booking.scheduledAt)}. Montant: ${booking.total} XAF`,
    from: '+237XXXXXXXXX', // Numéro Twilio
    to: phone
  });
}
```

---

## 🎨 Adaptations UI

### Format de Prix
```typescript
// Fonction pour formater les prix en XAF
export const formatPrice = (amount: number): string => {
  // Arrondir (pas de centimes)
  const rounded = Math.round(amount);

  // Format avec espaces (lisibilité)
  return `${rounded.toLocaleString('fr-FR')} XAF`;
};

// Exemples
formatPrice(25000);  // "25 000 XAF"
formatPrice(150000); // "150 000 XAF"
```

### Affichage des Numéros de Téléphone
```typescript
export const formatPhoneCameroon = (phone: string): string => {
  // +237 6XX XXX XXX
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('237')) {
    const number = cleaned.slice(3);
    return `+237 ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
  }

  return `+237 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
};

// Exemple
formatPhoneCameroon('699123456'); // "+237 699 123 456"
```

### Heures d'Ouverture (Format Local)
```typescript
// Format 24h préféré au Cameroun
"09h00 - 18h00" // ✅
"9 AM - 6 PM"   // ❌ (moins familier)
```

---

## 📱 Backend - Schéma Prisma Adapté

```prisma
model User {
  // ... autres champs

  // Numéro de téléphone OBLIGATOIRE au Cameroun
  phone         String    @unique // Format: +237XXXXXXXXX

  // Langue préférée
  language      Language  @default(FRENCH)

  // Ville de résidence
  city          String?
  region        String?   // Région du Cameroun
}

enum Language {
  FRENCH
  ENGLISH
}

model Payment {
  // ... autres champs

  amount            Float
  currency          String        @default("XAF")

  method            PaymentMethod

  // Flutterwave
  flutterwaveId     String?       @unique
  flutterwaveTxRef  String?       @unique

  // Mobile Money details
  mobileOperator    MobileOperator?
  mobileNumber      String?
}

enum PaymentMethod {
  ORANGE_MONEY
  MTN_MOBILE_MONEY
  CARD
}

enum MobileOperator {
  ORANGE
  MTN
}
```

---

## 🚀 Variables d'Environnement

```env
# Flutterwave
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxxxx
FLUTTERWAVE_SECRET_KEY=FLWSECK-xxxxx
FLUTTERWAVE_ENCRYPTION_KEY=xxxxx
FLUTTERWAVE_SECRET_HASH=xxxxx

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_KEY=xxxxx

# Google Maps (Cameroun)
GOOGLE_MAPS_API_KEY=xxxxx

# SMS (Twilio ou Africa's Talking)
TWILIO_ACCOUNT_SID=xxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+237XXXXXXXXX

# App Config
DEFAULT_COUNTRY=CM
DEFAULT_CURRENCY=XAF
DEFAULT_LANGUAGE=fr
DEFAULT_CITY=Douala
```

---

## 📊 Packages Additionnels

### Mobile
```json
{
  "dependencies": {
    // Flutterwave
    "flutterwave-react-native": "^1.3.0",

    // Formatage devise XAF
    "currency.js": "^2.0.4",

    // Numéros de téléphone
    "libphonenumber-js": "^1.10.51"
  }
}
```

### Backend
```json
{
  "dependencies": {
    // Flutterwave
    "flutterwave-node-v3": "^1.0.11",

    // SMS
    "twilio": "^4.19.0"
    // OU
    "africastalking": "^0.6.0"
  }
}
```

---

## 🎯 MVP Features pour le Cameroun

### Phase 1 (Lancement - Douala & Yaoundé)
- ✅ Authentification par téléphone (+237)
- ✅ Paiement Orange Money + MTN Mobile Money
- ✅ Géolocalisation quartiers principaux
- ✅ SMS confirmations
- ✅ Interface en Français
- ✅ Prix en XAF
- ✅ Services à domicile prioritaires (trafic intense)

### Phase 2 (Expansion)
- Ajout d'autres villes (Bafoussam, Bamenda, Garoua)
- Interface bilingue (FR/EN)
- Programme de fidélité
- Paiement par carte bancaire
- Avis et notations

### Phase 3 (Avancé)
- Abonnements mensuels
- Services d'entreprise
- API pour salons partenaires
- Analytics avancées

---

## 🔐 Conformité et Réglementations

### Protection des Données
- Respecter la réglementation camerounaise
- Stockage des données sensibles chiffré
- Consentement explicite pour collecte de données

### Paiement Mobile
- Conformité avec les règles Orange Money et MTN Mobile Money
- Conservation des reçus de transaction
- Politique de remboursement claire

---

## 📞 Support Client

### Canaux Préférés au Cameroun
1. **WhatsApp** (très utilisé)
2. **Appel téléphonique**
3. **SMS**
4. Chat in-app (secondaire)

### Numéro de Support
- Format : +237 6XX XXX XXX
- Disponible : Lun-Sam 8h-20h
- Langue : Français et Anglais

---

## 🎨 Contenu Localisé

### Catégories Populaires au Cameroun
- Coiffure (Tresses, Tissage, Locks)
- Manucure & Pédicure
- Maquillage (événements)
- Soins de peau
- Massage
- Barber (hommes)

### Services Tendance
- Tresses africaines
- Pose de tissage
- Ongles en gel
- Maquillage mariée
- Gommage corporel
- Manucure française

---

## 💡 Tips Marketing Cameroun

### Stratégie de Lancement
1. **Partenariats** avec salons établis
2. **Influenceurs** beauté locaux
3. **Promos** Orange Money / MTN Money
4. **Bouche-à-oreille** (très efficace)
5. **WhatsApp Business** pour communication

### Prix Attractifs (Estimation)
- Tresses : 3 000 - 15 000 XAF
- Manucure : 2 000 - 5 000 XAF
- Maquillage : 5 000 - 25 000 XAF
- Coupe homme : 1 500 - 5 000 XAF
- Massage : 8 000 - 20 000 XAF

---

**Document créé le** : 11 novembre 2025
**Marché cible** : Cameroun (Douala, Yaoundé en priorité)
**Devise** : XAF (Franc CFA)
**Paiement** : Flutterwave (Orange Money + MTN Mobile Money)
