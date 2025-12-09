-- Relax constraints on public.users table to support Auth V2 (Phone/Email decoupling)
-- and remove security risk of storing passwords in public table.

-- 1. Make password nullable (or unused)
ALTER TABLE public.users ALTER COLUMN password DROP NOT NULL;

-- 2. Make email nullable (for phone-only signups)
ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;

-- 3. Make phone nullable (for email-only signups)
ALTER TABLE public.users ALTER COLUMN phone DROP NOT NULL;

-- Note: We keep the UNIQUE indexes, so if a value IS provided, it must be unique. 
-- NULLs are ignored by unique constraints in Postgres (mostly).
