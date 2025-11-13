# Configuration Supabase Storage pour KmerServices

## Buckets à créer dans Supabase Dashboard

Pour que les fonctionnalités de chat avancées (images, messages vocaux) fonctionnent, vous devez créer les buckets de stockage suivants dans votre dashboard Supabase:

### 1. Bucket: `chat-attachments`

**Configuration:**
- **Public**: Oui (pour permettre l'accès aux URLs publiques)
- **File size limit**: 10 MB
- **Allowed MIME types**:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
  - `audio/mpeg`
  - `audio/mp4`
  - `audio/m4a`
  - `audio/wav`

**Structure des dossiers:**
```
chat-attachments/
├── chat-images/
│   └── {chat_id}/
│       └── {timestamp}.jpg
└── chat-audio/
    └── {chat_id}/
        └── {timestamp}.m4a
```

### 2. Policies RLS (Row Level Security)

Pour le bucket `chat-attachments`, créez les policies suivantes:

#### Policy 1: Allow authenticated users to upload
```sql
CREATE POLICY "Allow authenticated uploads to chat-attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-attachments');
```

#### Policy 2: Allow public read access
```sql
CREATE POLICY "Allow public read access to chat-attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-attachments');
```

#### Policy 3: Allow users to delete their own uploads (optional)
```sql
CREATE POLICY "Allow users to delete their uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-attachments' AND auth.uid() = owner);
```

## Instructions de création via Dashboard

1. Allez dans **Storage** dans votre dashboard Supabase
2. Cliquez sur **New bucket**
3. Entrez `chat-attachments` comme nom
4. Cochez **Public bucket**
5. Cliquez sur **Create bucket**
6. Allez dans **Policies** pour le bucket créé
7. Ajoutez les 3 policies ci-dessus

## Alternative: Création via SQL

Vous pouvez aussi exécuter ce SQL dans le SQL Editor de Supabase:

```sql
-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true);

-- Create policies
CREATE POLICY "Allow authenticated uploads to chat-attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-attachments');

CREATE POLICY "Allow public read access to chat-attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-attachments');

CREATE POLICY "Allow users to delete their uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-attachments' AND auth.uid() = owner);
```

## Vérification

Pour vérifier que tout fonctionne:

1. Testez l'upload d'une image depuis le chat
2. Vérifiez que l'image s'affiche correctement
3. Testez l'enregistrement et l'envoi d'un message vocal
4. Vérifiez que l'audio se lit correctement

## Nettoyage automatique (optionnel)

Pour éviter que le stockage ne se remplisse trop, vous pouvez créer une fonction Edge qui supprime les fichiers anciens:

```sql
-- Fonction pour supprimer les fichiers de plus de 90 jours
CREATE OR REPLACE FUNCTION cleanup_old_chat_attachments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM storage.objects
  WHERE bucket_id = 'chat-attachments'
  AND created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- Créer un cron job pour exécuter cette fonction chaque jour
SELECT cron.schedule(
  'cleanup-chat-attachments',
  '0 2 * * *', -- Tous les jours à 2h du matin
  $$ SELECT cleanup_old_chat_attachments(); $$
);
```

## Limits et Quotas

- **Maximum file size**: 10 MB par fichier
- **Total storage**: Dépend de votre plan Supabase
- **Bandwidth**: Vérifiez votre plan Supabase pour les limites

## Sécurité

- Les fichiers sont stockés avec des noms uniques (timestamp)
- Les URLs publiques sont générées automatiquement
- Les fichiers ne sont accessibles qu'aux utilisateurs authentifiés lors de l'upload
- Les fichiers sont lisibles publiquement une fois uploadés (nécessaire pour afficher dans le chat)

## Support

Si vous rencontrez des problèmes:
1. Vérifiez que le bucket existe et est public
2. Vérifiez que les policies RLS sont correctement configurées
3. Vérifiez les logs dans le dashboard Supabase
4. Vérifiez les permissions de votre clé API Supabase
