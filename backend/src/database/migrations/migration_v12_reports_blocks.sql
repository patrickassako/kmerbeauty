-- =============================================
-- Migration V12: User Reports and Blocks
-- Feature: Allow users to report and block each other
-- =============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Table: user_reports (Signalements)
-- =============================================
CREATE TABLE IF NOT EXISTS user_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Report details
    reason VARCHAR(50) NOT NULL CHECK (reason IN (
        'harassment',
        'spam', 
        'inappropriate',
        'scam',
        'suspicious',
        'other'
    )),
    description TEXT,
    screenshot_url TEXT,
    
    -- Context (optional - what interaction triggered the report)
    context_type VARCHAR(20), -- 'chat', 'booking', 'profile'
    context_id UUID, -- chat_id or booking_id
    
    -- Admin review
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending',
        'reviewed', 
        'resolved',
        'dismissed'
    )),
    admin_notes TEXT,
    reviewed_at TIMESTAMP,
    reviewed_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Prevent duplicate reports from same user for same target
    CONSTRAINT unique_active_report UNIQUE (reporter_id, reported_id, status)
);

-- =============================================
-- Table: user_blocks (Blocages)
-- =============================================
CREATE TABLE IF NOT EXISTS user_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Optional reason
    reason VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Prevent duplicate blocks
    CONSTRAINT unique_block UNIQUE (blocker_id, blocked_id),
    
    -- Prevent self-blocking
    CONSTRAINT no_self_block CHECK (blocker_id != blocked_id)
);

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX idx_user_reports_reporter ON user_reports(reporter_id);
CREATE INDEX idx_user_reports_reported ON user_reports(reported_id);
CREATE INDEX idx_user_reports_status ON user_reports(status);
CREATE INDEX idx_user_reports_created ON user_reports(created_at DESC);

CREATE INDEX idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX idx_user_blocks_blocked ON user_blocks(blocked_id);

-- =============================================
-- Row Level Security (RLS)
-- =============================================
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

-- Reports: Users can create reports, admins can view all
CREATE POLICY "Users can create reports"
    ON user_reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports"
    ON user_reports FOR SELECT
    USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
    ON user_reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can update reports"
    ON user_reports FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'ADMIN'
        )
    );

-- Blocks: Users can manage their own blocks
CREATE POLICY "Users can create blocks"
    ON user_blocks FOR INSERT
    WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can view their blocks"
    ON user_blocks FOR SELECT
    USING (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their blocks"
    ON user_blocks FOR DELETE
    USING (auth.uid() = blocker_id);

-- =============================================
-- Trigger for updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_user_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_reports_updated_at
    BEFORE UPDATE ON user_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_user_reports_updated_at();

-- =============================================
-- Helper function: Check if user is blocked
-- =============================================
CREATE OR REPLACE FUNCTION is_user_blocked(
    p_user_id UUID,
    p_target_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_blocks
        WHERE blocker_id = p_user_id AND blocked_id = p_target_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Helper function: Check mutual block
-- =============================================
CREATE OR REPLACE FUNCTION is_mutually_blocked(
    p_user1_id UUID,
    p_user2_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_blocks
        WHERE (blocker_id = p_user1_id AND blocked_id = p_user2_id)
           OR (blocker_id = p_user2_id AND blocked_id = p_user1_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Success Message
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Migration V12 completed: User Reports & Blocks tables created';
END $$;
