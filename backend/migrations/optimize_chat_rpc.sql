-- Function to get enriched user chats efficiently
-- VERSION 3: Bulletproof Type Casting and Permissions
DROP FUNCTION IF EXISTS get_user_chats(UUID);
DROP FUNCTION IF EXISTS get_user_chats(TEXT);

CREATE OR REPLACE FUNCTION get_user_chats(current_user_id TEXT)
RETURNS TABLE (
    id TEXT,
    last_message TEXT,
    last_message_at TIMESTAMPTZ,
    booking_id TEXT,
    client_id TEXT,
    provider_id TEXT,
    unread_count BIGINT,
    other_user JSONB,
    other_user_type TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id::TEXT,
        c.last_message,
        c.last_message_at,
        c.booking_id::TEXT,
        c.client_id::TEXT,
        c.provider_id::TEXT,
        (
            SELECT COUNT(*)::BIGINT
            FROM chat_messages m 
            WHERE m.chat_id::TEXT = c.id::TEXT 
            AND m.is_read = false 
            AND m.sender_id::TEXT != current_user_id
        ) as unread_count,
        CASE 
            WHEN c.client_id::TEXT = current_user_id THEN 
                -- Current user is client, fetch provider details
                jsonb_build_object(
                    'id', pu.id::TEXT,
                    'first_name', pu.first_name,
                    'last_name', pu.last_name,
                    'avatar', COALESCE(t.profile_image, s.logo, pu.avatar),
                    'business_name', s.name 
                )
            ELSE 
                -- Current user is provider, fetch client details
                jsonb_build_object(
                    'id', cu.id::TEXT,
                    'first_name', cu.first_name,
                    'last_name', cu.last_name,
                    'avatar', cu.avatar
                )
        END as other_user,
        CASE 
            WHEN c.client_id::TEXT = current_user_id THEN 'provider'
            ELSE 'client'
        END as other_user_type
    FROM chats c
    LEFT JOIN users cu ON c.client_id::TEXT = cu.id::TEXT
    LEFT JOIN users pu ON c.provider_id::TEXT = pu.id::TEXT
    LEFT JOIN therapists t ON t.user_id::TEXT = pu.id::TEXT
    LEFT JOIN salons s ON s.user_id::TEXT = pu.id::TEXT
    WHERE (c.client_id::TEXT = current_user_id OR c.provider_id::TEXT = current_user_id)
    AND c.is_active = true
    ORDER BY c.last_message_at DESC NULLS LAST;
END;
$$;

-- Grant permissions to ensure API can access it
GRANT EXECUTE ON FUNCTION get_user_chats(TEXT) TO postgres, anon, authenticated, service_role;
