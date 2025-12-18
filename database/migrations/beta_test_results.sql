-- Beta Test Results Table
-- Stores test results from beta testers for admin reporting

-- Create beta_test_results table
CREATE TABLE IF NOT EXISTS beta_test_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('client', 'provider')),
    test_id VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'working', 'broken')),
    comment TEXT,
    device_info TEXT,
    tested_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: one result per user per test
    UNIQUE(user_id, test_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_beta_test_results_user_id ON beta_test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_beta_test_results_user_type ON beta_test_results(user_type);
CREATE INDEX IF NOT EXISTS idx_beta_test_results_status ON beta_test_results(status);
CREATE INDEX IF NOT EXISTS idx_beta_test_results_tested_at ON beta_test_results(tested_at);

-- Enable RLS
ALTER TABLE beta_test_results ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own test results
CREATE POLICY "Users can view own test results" ON beta_test_results
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own test results" ON beta_test_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own test results" ON beta_test_results
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own test results" ON beta_test_results
    FOR DELETE USING (auth.uid() = user_id);

-- Admin can view all test results (for reporting)
-- Note: You need to create an admin role or use service key for admin access
CREATE POLICY "Service role can access all" ON beta_test_results
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_beta_test_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_beta_test_results_updated_at
    BEFORE UPDATE ON beta_test_results
    FOR EACH ROW
    EXECUTE FUNCTION update_beta_test_results_updated_at();

-- Create a view for admin reporting
CREATE OR REPLACE VIEW beta_test_summary AS
SELECT 
    u.id as user_id,
    u.raw_user_meta_data->>'first_name' as first_name,
    u.raw_user_meta_data->>'last_name' as last_name,
    u.email,
    btr.user_type,
    COUNT(*) FILTER (WHERE btr.status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE btr.status = 'working') as working_count,
    COUNT(*) FILTER (WHERE btr.status = 'broken') as broken_count,
    COUNT(*) as total_tests,
    ROUND((COUNT(*) FILTER (WHERE btr.status != 'pending')::numeric / NULLIF(COUNT(*), 0)) * 100, 1) as completion_rate,
    MAX(btr.tested_at) as last_tested_at
FROM auth.users u
JOIN beta_test_results btr ON u.id = btr.user_id
GROUP BY u.id, u.email, u.raw_user_meta_data, btr.user_type;

-- Grant select on view to authenticated users (admin will filter)
GRANT SELECT ON beta_test_summary TO authenticated;

COMMENT ON TABLE beta_test_results IS 'Stores beta tester test results for feature validation and admin reporting';
COMMENT ON COLUMN beta_test_results.user_type IS 'client or provider - determines which test suite was shown';
COMMENT ON COLUMN beta_test_results.test_id IS 'Unique identifier for the test item';
COMMENT ON COLUMN beta_test_results.status IS 'pending = not tested, working = feature works, broken = feature has issues';
