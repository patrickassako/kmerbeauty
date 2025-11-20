-- Migration: Créer les triggers pour les notifications push automatiques
-- Date: 2025-11-20

-- ============================================================================
-- Fonction utilitaire pour appeler l'Edge Function de notification
-- ============================================================================

CREATE OR REPLACE FUNCTION send_push_notification(
  p_user_id UUID,
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_supabase_url TEXT;
  v_service_role_key TEXT;
BEGIN
  -- Récupérer l'URL Supabase depuis les variables d'environnement
  -- NOTE: Ces valeurs doivent être configurées dans le dashboard Supabase
  v_supabase_url := current_setting('app.settings.supabase_url', true);
  v_service_role_key := current_setting('app.settings.service_role_key', true);

  IF v_supabase_url IS NULL OR v_service_role_key IS NULL THEN
    RAISE NOTICE 'Configuration Supabase manquante, notification non envoyée';
    RETURN;
  END IF;

  -- Appeler l'Edge Function via HTTP
  PERFORM net.http_post(
    url := v_supabase_url || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_role_key
    ),
    body := jsonb_build_object(
      'userId', p_user_id,
      'title', p_title,
      'body', p_body,
      'data', p_data
    )
  );

  RAISE NOTICE 'Notification envoyée à %', p_user_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Log l'erreur mais ne fait pas échouer la transaction
    RAISE NOTICE 'Erreur lors de l''envoi de la notification: %', SQLERRM;
END;
$$;

-- ============================================================================
-- TRIGGERS POUR LES COMMANDES (BOOKINGS)
-- ============================================================================

-- Trigger: Nouvelle commande reçue (notifier le prestataire)
CREATE OR REPLACE FUNCTION notify_provider_new_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_provider_user_id UUID;
  v_client_name TEXT;
BEGIN
  -- Récupérer l'user_id du prestataire
  IF NEW.contractor_id IS NOT NULL THEN
    SELECT user_id INTO v_provider_user_id
    FROM contractor_profiles
    WHERE id = NEW.contractor_id;
  ELSIF NEW.therapist_id IS NOT NULL THEN
    SELECT user_id INTO v_provider_user_id
    FROM therapists
    WHERE id = NEW.therapist_id;
  ELSIF NEW.salon_id IS NOT NULL THEN
    SELECT user_id INTO v_provider_user_id
    FROM salons
    WHERE id = NEW.salon_id;
  END IF;

  -- Récupérer le nom du client
  SELECT CONCAT(first_name, ' ', last_name) INTO v_client_name
  FROM users
  WHERE id = NEW.user_id;

  -- Envoyer la notification
  IF v_provider_user_id IS NOT NULL THEN
    PERFORM send_push_notification(
      v_provider_user_id,
      '🔔 Nouvelle commande !',
      v_client_name || ' vient de passer une commande',
      jsonb_build_object(
        'type', 'booking',
        'bookingId', NEW.id,
        'isProvider', true,
        'status', NEW.status
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_provider_new_booking ON bookings;
CREATE TRIGGER trigger_notify_provider_new_booking
  AFTER INSERT ON bookings
  FOR EACH ROW
  WHEN (NEW.status = 'PENDING')
  EXECUTE FUNCTION notify_provider_new_booking();

-- Trigger: Commande confirmée (notifier le client)
CREATE OR REPLACE FUNCTION notify_client_booking_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'CONFIRMED' AND OLD.status != 'CONFIRMED' THEN
    PERFORM send_push_notification(
      NEW.user_id,
      '✅ Commande confirmée',
      'Votre commande a été confirmée par le prestataire',
      jsonb_build_object(
        'type', 'booking',
        'bookingId', NEW.id,
        'isProvider', false,
        'status', NEW.status
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_client_booking_confirmed ON bookings;
CREATE TRIGGER trigger_notify_client_booking_confirmed
  AFTER UPDATE ON bookings
  FOR EACH ROW
  WHEN (NEW.status = 'CONFIRMED' AND OLD.status != 'CONFIRMED')
  EXECUTE FUNCTION notify_client_booking_confirmed();

-- Trigger: Commande en cours (notifier le client)
CREATE OR REPLACE FUNCTION notify_client_booking_in_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'IN_PROGRESS' AND OLD.status != 'IN_PROGRESS' THEN
    PERFORM send_push_notification(
      NEW.user_id,
      '🚀 Service en cours',
      'Le prestataire a démarré votre service',
      jsonb_build_object(
        'type', 'booking',
        'bookingId', NEW.id,
        'isProvider', false,
        'status', NEW.status
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_client_booking_in_progress ON bookings;
CREATE TRIGGER trigger_notify_client_booking_in_progress
  AFTER UPDATE ON bookings
  FOR EACH ROW
  WHEN (NEW.status = 'IN_PROGRESS' AND OLD.status != 'IN_PROGRESS')
  EXECUTE FUNCTION notify_client_booking_in_progress();

-- Trigger: Commande terminée (notifier le client)
CREATE OR REPLACE FUNCTION notify_client_booking_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
    PERFORM send_push_notification(
      NEW.user_id,
      '🎉 Service terminé',
      'Votre service est terminé. Laissez un avis !',
      jsonb_build_object(
        'type', 'booking',
        'bookingId', NEW.id,
        'isProvider', false,
        'status', NEW.status
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_client_booking_completed ON bookings;
CREATE TRIGGER trigger_notify_client_booking_completed
  AFTER UPDATE ON bookings
  FOR EACH ROW
  WHEN (NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED')
  EXECUTE FUNCTION notify_client_booking_completed();

-- Trigger: Commande annulée (notifier le client et le prestataire)
CREATE OR REPLACE FUNCTION notify_booking_cancelled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_provider_user_id UUID;
BEGIN
  IF NEW.status = 'CANCELLED' AND OLD.status != 'CANCELLED' THEN
    -- Notifier le client
    PERFORM send_push_notification(
      NEW.user_id,
      '❌ Commande annulée',
      'Votre commande a été annulée',
      jsonb_build_object(
        'type', 'booking',
        'bookingId', NEW.id,
        'isProvider', false,
        'status', NEW.status
      )
    );

    -- Notifier le prestataire
    IF NEW.contractor_id IS NOT NULL THEN
      SELECT user_id INTO v_provider_user_id
      FROM contractor_profiles
      WHERE id = NEW.contractor_id;
    ELSIF NEW.therapist_id IS NOT NULL THEN
      SELECT user_id INTO v_provider_user_id
      FROM therapists
      WHERE id = NEW.therapist_id;
    ELSIF NEW.salon_id IS NOT NULL THEN
      SELECT user_id INTO v_provider_user_id
      FROM salons
      WHERE id = NEW.salon_id;
    END IF;

    IF v_provider_user_id IS NOT NULL THEN
      PERFORM send_push_notification(
        v_provider_user_id,
        '❌ Commande annulée',
        'Une commande a été annulée',
        jsonb_build_object(
          'type', 'booking',
          'bookingId', NEW.id,
          'isProvider', true,
          'status', NEW.status
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_booking_cancelled ON bookings;
CREATE TRIGGER trigger_notify_booking_cancelled
  AFTER UPDATE ON bookings
  FOR EACH ROW
  WHEN (NEW.status = 'CANCELLED' AND OLD.status != 'CANCELLED')
  EXECUTE FUNCTION notify_booking_cancelled();

-- ============================================================================
-- TRIGGERS POUR LES MESSAGES (CHAT)
-- ============================================================================

-- Trigger: Nouveau message reçu
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recipient_id UUID;
  v_chat RECORD;
  v_sender_name TEXT;
BEGIN
  -- Récupérer les infos du chat
  SELECT * INTO v_chat
  FROM chats
  WHERE id = NEW.chat_id;

  -- Récupérer le nom de l'expéditeur
  SELECT CONCAT(first_name, ' ', last_name) INTO v_sender_name
  FROM users
  WHERE id = NEW.sender_id;

  -- Déterminer le destinataire
  IF NEW.sender_id = v_chat.client_id THEN
    v_recipient_id := v_chat.provider_id;
  ELSE
    v_recipient_id := v_chat.client_id;
  END IF;

  -- Envoyer la notification
  IF v_recipient_id IS NOT NULL THEN
    PERFORM send_push_notification(
      v_recipient_id,
      '💬 ' || v_sender_name,
      LEFT(NEW.content, 100),  -- Limiter à 100 caractères
      jsonb_build_object(
        'type', 'message',
        'chatId', NEW.chat_id,
        'messageId', NEW.id,
        'senderId', NEW.sender_id,
        'senderName', v_sender_name
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_new_message ON chat_messages;
CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  WHEN (NEW.type = 'TEXT' OR NEW.type = 'IMAGE' OR NEW.type = 'VOICE')
  EXECUTE FUNCTION notify_new_message();

-- ============================================================================
-- CONFIGURATION REQUISE
-- ============================================================================

-- NOTE IMPORTANTE: Pour que les triggers fonctionnent, vous devez configurer
-- les variables d'environnement dans le dashboard Supabase:
--
-- 1. Aller dans Settings > API
-- 2. Copier votre URL Supabase et Service Role Key
-- 3. Aller dans Database > Extensions et activer 'pg_net' si ce n'est pas déjà fait
-- 4. Exécuter ces commandes SQL pour configurer les variables:
--
-- ALTER DATABASE postgres SET app.settings.supabase_url = 'https://votre-project.supabase.co';
-- ALTER DATABASE postgres SET app.settings.service_role_key = 'votre-service-role-key';

COMMENT ON FUNCTION send_push_notification IS 'Fonction pour envoyer des push notifications via l''Edge Function Supabase';
COMMENT ON FUNCTION notify_provider_new_booking IS 'Notifie le prestataire lors d''une nouvelle commande';
COMMENT ON FUNCTION notify_client_booking_confirmed IS 'Notifie le client quand sa commande est confirmée';
COMMENT ON FUNCTION notify_client_booking_completed IS 'Notifie le client quand sa commande est terminée';
COMMENT ON FUNCTION notify_booking_cancelled IS 'Notifie les deux parties quand une commande est annulée';
COMMENT ON FUNCTION notify_new_message IS 'Notifie le destinataire lors d''un nouveau message';
