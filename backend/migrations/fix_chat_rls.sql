-- Enable RLS (idempotent)
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 1. CHATS Table Policies

-- Allow users to view chats where they are either the client or the provider
DROP POLICY IF EXISTS "Users can view their own chats" ON chats;
CREATE POLICY "Users can view their own chats" ON chats
  FOR SELECT USING (
    auth.uid() = client_id OR auth.uid() = provider_id
  );

-- Allow clients to create a NEW chat (initiate conversation)
-- Must ensure they are setting themselves as the client_id
DROP POLICY IF EXISTS "Clients can create chats" ON chats;
CREATE POLICY "Clients can create chats" ON chats
  FOR INSERT WITH CHECK (
    auth.uid() = client_id
  );

-- 2. CHAT_MESSAGES Table Policies

-- Allow users to view messages if they belong to the parent chat
DROP POLICY IF EXISTS "Users can view messages of their chats" ON chat_messages;
CREATE POLICY "Users can view messages of their chats" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_messages.chat_id
      AND (chats.client_id = auth.uid() OR chats.provider_id = auth.uid())
    )
  );

-- Allow users to insert messages if they are the sender AND belong to the chat
DROP POLICY IF EXISTS "Users can send messages to their chats" ON chat_messages;
CREATE POLICY "Users can send messages to their chats" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_messages.chat_id
      AND (chats.client_id = auth.uid() OR chats.provider_id = auth.uid())
    )
  );

-- Optional: Enable Realtime for these tables to support live chat
ALTER PUBLICATION supabase_realtime ADD TABLE chats;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
