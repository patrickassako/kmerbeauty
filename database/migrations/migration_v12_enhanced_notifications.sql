-- Migration: Enhanced Notifications System
-- Date: 2025-12-18
-- Description: Add new notification preferences, admin announcements, and scheduled notifications

-- ============================================================================
-- 1. Update notification preferences default values
-- ============================================================================

-- Add web_push_token column if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS web_push_token TEXT;

-- Update notification_preferences to include new categories
UPDATE users 
SET notification_preferences = jsonb_build_object(
    'bookings', COALESCE((notification_preferences->>'bookings')::boolean, true),
    'messages', COALESCE((notification_preferences->>'messages')::boolean, true),
    'marketplace', COALESCE((notification_preferences->>'marketplace')::boolean, true),
    'reminders', true,
    'credits', true,
    'announcements', true,
    'promotions', true
)
WHERE notification_preferences IS NULL 
   OR notification_preferences = '{}'::jsonb
   OR NOT notification_preferences ? 'reminders';

-- ============================================================================
-- 2. Create admin_announcements table
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'providers', 'clients')),
    sent_count INTEGER DEFAULT 0,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying recent announcements
CREATE INDEX IF NOT EXISTS idx_admin_announcements_created ON admin_announcements(created_at DESC);

COMMENT ON TABLE admin_announcements IS 'Stores admin announcements sent to users';

-- ============================================================================
-- 3. Create scheduled_notifications table for reminders
-- ============================================================================

CREATE TABLE IF NOT EXISTS scheduled_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    reference_id UUID, -- Optional: booking_id, order_id, etc.
    reference_type TEXT, -- Optional: 'booking', 'order', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_pending 
    ON scheduled_notifications(scheduled_for) 
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user 
    ON scheduled_notifications(user_id, status);

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_reference 
    ON scheduled_notifications(reference_id, reference_type);

COMMENT ON TABLE scheduled_notifications IS 'Stores scheduled notifications like booking reminders';

-- ============================================================================
-- 4. Create notification_logs for debugging
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    notification_type TEXT NOT NULL,
    title TEXT,
    body TEXT,
    data JSONB,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'blocked')),
    blocked_reason TEXT, -- If blocked due to preferences
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_user ON notification_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(notification_type, created_at DESC);

COMMENT ON TABLE notification_logs IS 'Logs all notification attempts for debugging';

-- ============================================================================
-- 5. Add trigger for booking reminders (24h before)
-- ============================================================================

CREATE OR REPLACE FUNCTION schedule_booking_reminder()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_reminder_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Only schedule reminder for confirmed bookings
    IF NEW.status = 'CONFIRMED' AND (OLD IS NULL OR OLD.status != 'CONFIRMED') THEN
        -- Schedule reminder for 24 hours before the booking
        v_reminder_time := NEW.date AT TIME ZONE 'Africa/Douala' - INTERVAL '24 hours';
        
        -- Only schedule if the reminder time is in the future
        IF v_reminder_time > NOW() THEN
            INSERT INTO scheduled_notifications (
                user_id,
                notification_type,
                title,
                body,
                data,
                scheduled_for,
                reference_id,
                reference_type
            ) VALUES (
                NEW.user_id,
                'reminders',
                '⏰ Rappel de rendez-vous',
                'Votre rendez-vous est prévu demain. N''oubliez pas !',
                jsonb_build_object(
                    'type', 'booking_reminder',
                    'bookingId', NEW.id
                ),
                v_reminder_time,
                NEW.id,
                'booking'
            );
        END IF;
    END IF;
    
    -- Cancel reminder if booking is cancelled
    IF NEW.status = 'CANCELLED' AND OLD.status != 'CANCELLED' THEN
        UPDATE scheduled_notifications 
        SET status = 'cancelled'
        WHERE reference_id = NEW.id 
          AND reference_type = 'booking'
          AND status = 'pending';
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_schedule_booking_reminder ON bookings;
CREATE TRIGGER trigger_schedule_booking_reminder
    AFTER INSERT OR UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION schedule_booking_reminder();

-- ============================================================================
-- 6. Add trigger for welcome notification on user signup
-- ============================================================================

CREATE OR REPLACE FUNCTION send_welcome_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Schedule welcome notification 5 minutes after signup
    INSERT INTO scheduled_notifications (
        user_id,
        notification_type,
        title,
        body,
        data,
        scheduled_for
    ) VALUES (
        NEW.id,
        'announcements',
        '🎉 Bienvenue sur KmerBeauty !',
        'Découvrez les meilleurs professionnels de beauté près de chez vous.',
        jsonb_build_object('type', 'welcome'),
        NOW() + INTERVAL '5 minutes'
    );
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_send_welcome_notification ON users;
CREATE TRIGGER trigger_send_welcome_notification
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION send_welcome_notification();

-- ============================================================================
-- 7. Add trigger for credit purchase notification
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_credit_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    IF NEW.payment_status = 'completed' AND (OLD IS NULL OR OLD.payment_status != 'completed') THEN
        -- Get user_id from provider
        SELECT user_id INTO v_user_id
        FROM (
            SELECT user_id FROM therapists WHERE id = NEW.provider_id
            UNION
            SELECT user_id FROM salons WHERE id = NEW.provider_id
        ) AS providers
        LIMIT 1;
        
        IF v_user_id IS NOT NULL THEN
            PERFORM send_push_notification(
                v_user_id,
                '💰 Crédits ajoutés !',
                NEW.credits_amount || ' crédits ont été ajoutés à votre compte',
                jsonb_build_object(
                    'type', 'credits',
                    'credits', NEW.credits_amount,
                    'amount', NEW.price_paid
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_credit_purchase ON credit_purchases;
CREATE TRIGGER trigger_notify_credit_purchase
    AFTER UPDATE ON credit_purchases
    FOR EACH ROW
    EXECUTE FUNCTION notify_credit_purchase();

-- ============================================================================
-- 8. Comments
-- ============================================================================

COMMENT ON COLUMN users.web_push_token IS 'Token for web push notifications (browser)';
COMMENT ON FUNCTION schedule_booking_reminder IS 'Schedules a reminder notification 24h before a confirmed booking';
COMMENT ON FUNCTION send_welcome_notification IS 'Schedules a welcome notification 5 minutes after user signup';
COMMENT ON FUNCTION notify_credit_purchase IS 'Sends notification when credit purchase is completed';
