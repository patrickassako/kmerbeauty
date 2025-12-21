-- Table for beta testers registration
CREATE TABLE IF NOT EXISTS beta_testers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    city TEXT,
    profile_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    invited_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for email lookup
CREATE INDEX IF NOT EXISTS idx_beta_testers_email ON beta_testers(email);
CREATE INDEX IF NOT EXISTS idx_beta_testers_status ON beta_testers(status);

COMMENT ON TABLE beta_testers IS 'Stores beta testers for Play Store closed testing';
