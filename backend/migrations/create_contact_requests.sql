-- Migration: Create contact_requests table for public contact form
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS "contact_requests" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "email" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT DEFAULT 'NEW' CHECK (status IN ('NEW', 'READ', 'REPLIED', 'CLOSED')),
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS but allow public inserts
ALTER TABLE "contact_requests" ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public form)
CREATE POLICY "Anyone can submit contact request" ON "contact_requests"
    FOR INSERT WITH CHECK (true);

-- Only admins can view/update
CREATE POLICY "Admins can view contact requests" ON "contact_requests"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can update contact requests" ON "contact_requests"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'ADMIN'
        )
    );

-- Index for faster queries
CREATE INDEX idx_contact_requests_status ON contact_requests(status);
CREATE INDEX idx_contact_requests_created_at ON contact_requests(created_at DESC);
