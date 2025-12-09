-- Migration V11: Marketplace Notifications
-- Description: Add triggers for push notifications on marketplace events
-- Author: KmerServices Team
-- Date: 2025-11-27

-- ============================================================================
-- TRIGGERS POUR LES COMMANDES MARKETPLACE (MARKETPLACE_ORDERS)
-- ============================================================================

-- Trigger: Nouvelle commande reçue (notifier le vendeur)
CREATE OR REPLACE FUNCTION notify_marketplace_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seller_user_id UUID;
  v_buyer_name TEXT;
  v_product_name TEXT;
BEGIN
  -- Récupérer l'user_id du vendeur (seller_id est une FK vers therapists)
  SELECT user_id INTO v_seller_user_id
  FROM therapists
  WHERE id = NEW.seller_id;

  -- Récupérer le nom de l'acheteur
  SELECT CONCAT(first_name, ' ', last_name) INTO v_buyer_name
  FROM users
  WHERE id = NEW.buyer_id;

  -- Récupérer le nom du produit
  SELECT name INTO v_product_name
  FROM marketplace_products
  WHERE id = NEW.product_id;

  -- Envoyer la notification
  IF v_seller_user_id IS NOT NULL THEN
    PERFORM send_push_notification(
      v_seller_user_id,
      '🛍️ Nouvelle commande !',
      v_buyer_name || ' a commandé ' || v_product_name,
      jsonb_build_object(
        'type', 'marketplace_order',
        'orderId', NEW.id,
        'isSeller', true,
        'status', NEW.status
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_marketplace_new_order ON marketplace_orders;
CREATE TRIGGER trigger_notify_marketplace_new_order
  AFTER INSERT ON marketplace_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_marketplace_new_order();

-- Trigger: Changement de statut commande (notifier l'acheteur)
CREATE OR REPLACE FUNCTION notify_marketplace_order_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_name TEXT;
  v_title TEXT;
  v_body TEXT;
BEGIN
  -- Ne rien faire si le statut n'a pas changé
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  -- Récupérer le nom du produit
  SELECT name INTO v_product_name
  FROM marketplace_products
  WHERE id = NEW.product_id;

  -- Définir le message selon le statut
  IF NEW.status = 'confirmed' THEN
    v_title := '✅ Commande confirmée';
    v_body := 'Votre commande pour ' || v_product_name || ' a été confirmée.';
  ELSIF NEW.status = 'ready_for_pickup' THEN
    v_title := '📦 Prêt à récupérer';
    v_body := 'Votre commande ' || v_product_name || ' est prête.';
  ELSIF NEW.status = 'delivered' THEN
    v_title := '🎉 Commande livrée';
    v_body := 'Votre commande ' || v_product_name || ' a été livrée. Merci !';
  ELSIF NEW.status = 'cancelled' THEN
    v_title := '❌ Commande annulée';
    v_body := 'Votre commande pour ' || v_product_name || ' a été annulée.';
  ELSE
    RETURN NEW; -- Autres statuts ignorés
  END IF;

  -- Envoyer la notification à l'acheteur
  PERFORM send_push_notification(
    NEW.buyer_id,
    v_title,
    v_body,
    jsonb_build_object(
      'type', 'marketplace_order',
      'orderId', NEW.id,
      'isSeller', false,
      'status', NEW.status
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_marketplace_order_status ON marketplace_orders;
CREATE TRIGGER trigger_notify_marketplace_order_status
  AFTER UPDATE ON marketplace_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_marketplace_order_status();

-- ============================================================================
-- TRIGGERS POUR LES MESSAGES MARKETPLACE (MARKETPLACE_MESSAGES)
-- ============================================================================

-- Trigger: Nouveau message reçu
CREATE OR REPLACE FUNCTION notify_marketplace_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_name TEXT;
  v_product_name TEXT;
BEGIN
  -- Récupérer le nom de l'expéditeur
  SELECT CONCAT(first_name, ' ', last_name) INTO v_sender_name
  FROM users
  WHERE id = NEW.sender_id;

  -- Récupérer le nom du produit
  SELECT name INTO v_product_name
  FROM marketplace_products
  WHERE id = NEW.product_id;

  -- Envoyer la notification au destinataire
  PERFORM send_push_notification(
    NEW.receiver_id,
    '💬 Message: ' || v_product_name,
    v_sender_name || ': ' || LEFT(NEW.message, 100),
    jsonb_build_object(
      'type', 'marketplace_message',
      'productId', NEW.product_id,
      'senderId', NEW.sender_id
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_marketplace_new_message ON marketplace_messages;
CREATE TRIGGER trigger_notify_marketplace_new_message
  AFTER INSERT ON marketplace_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_marketplace_new_message();

-- Success Message
DO $$
BEGIN
  RAISE NOTICE 'Migration V11 (Marketplace Notifications) completed successfully!';
END $$;
