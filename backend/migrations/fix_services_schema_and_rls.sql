-- Ensure images column is text[]
-- We use a safe cast if it's currently text
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'services' 
        AND column_name = 'images' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE services ALTER COLUMN images TYPE text[] USING CASE WHEN images IS NULL THEN '{}' ELSE ARRAY[images] END;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public read access" ON services;
CREATE POLICY "Public read access" ON services FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated full access" ON services;
CREATE POLICY "Authenticated full access" ON services FOR ALL USING (auth.role() = 'authenticated');
