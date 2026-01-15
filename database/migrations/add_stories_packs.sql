-- ============================================
-- Migration: Add Stories and Promotional Packs
-- Date: 2026-01-15
-- ============================================

-- 1. Create Story Media Type Enum (IMAGE, VIDEO, or TEXT)
CREATE TYPE "StoryMediaType" AS ENUM ('IMAGE', 'VIDEO', 'TEXT');

-- 2. Create Discount Type Enum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- 3. Create Stories Table
CREATE TABLE "stories" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Owner (either therapist OR salon)
    "therapistId" UUID REFERENCES "therapists"("id") ON DELETE CASCADE,
    "salonId" UUID REFERENCES "salons"("id") ON DELETE CASCADE,
    
    -- Content
    "mediaType" "StoryMediaType" NOT NULL,
    "mediaUrl" TEXT,  -- Optional for TEXT type stories
    "thumbnailUrl" TEXT,
    "caption" TEXT,
    
    -- Text-only story fields
    "textContent" TEXT,  -- Main text for TEXT type stories
    "backgroundColor" TEXT DEFAULT '#000000',  -- Background color (hex)
    "textColor" TEXT DEFAULT '#FFFFFF',  -- Text color (hex)
    
    -- Visibility
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    
    -- Auto-delete after 24h
    "expiresAt" TIMESTAMP(3) NOT NULL,
    
    -- Stats
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint: Must have either therapist OR salon
    CONSTRAINT "story_owner_check" CHECK (
        ("therapistId" IS NOT NULL AND "salonId" IS NULL) OR
        ("therapistId" IS NULL AND "salonId" IS NOT NULL)
    )
);

-- 4. Create Story Views Table
CREATE TABLE "story_views" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    "storyId" UUID NOT NULL REFERENCES "stories"("id") ON DELETE CASCADE,
    "userId" UUID NOT NULL,
    
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint: one view per user per story
    CONSTRAINT "story_views_storyId_userId_key" UNIQUE ("storyId", "userId")
);

-- 5. Create Promotional Packs Table
CREATE TABLE "promotional_packs" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Owner
    "therapistId" UUID REFERENCES "therapists"("id") ON DELETE CASCADE,
    "salonId" UUID REFERENCES "salons"("id") ON DELETE CASCADE,
    
    -- Content
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    
    -- Badge (e.g., "Offre Spéciale", "Nouveauté", "-20%")
    "badge" TEXT,
    
    -- CTA
    "ctaText" TEXT NOT NULL DEFAULT 'Réserver',
    "ctaLink" TEXT,
    
    -- Linked service (optional)
    "serviceId" UUID,
    
    -- Discount
    "discountType" "DiscountType",
    "discountValue" DOUBLE PRECISION,
    
    -- Validity
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    
    -- Targeting (empty array = all cities)
    "targetCities" TEXT[] NOT NULL DEFAULT '{}',
    
    -- Stats
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint: Must have either therapist OR salon
    CONSTRAINT "pack_owner_check" CHECK (
        ("therapistId" IS NOT NULL AND "salonId" IS NULL) OR
        ("therapistId" IS NULL AND "salonId" IS NOT NULL) OR
        ("therapistId" IS NULL AND "salonId" IS NULL)  -- Allow admin/system packs
    )
);

-- ============================================
-- Indexes for Performance
-- ============================================

-- Stories indexes
CREATE INDEX "stories_therapistId_idx" ON "stories"("therapistId");
CREATE INDEX "stories_salonId_idx" ON "stories"("salonId");
CREATE INDEX "stories_expiresAt_idx" ON "stories"("expiresAt");
CREATE INDEX "stories_isActive_idx" ON "stories"("isActive");

-- Story views indexes
CREATE INDEX "story_views_storyId_idx" ON "story_views"("storyId");
CREATE INDEX "story_views_userId_idx" ON "story_views"("userId");

-- Promotional packs indexes
CREATE INDEX "promotional_packs_therapistId_idx" ON "promotional_packs"("therapistId");
CREATE INDEX "promotional_packs_salonId_idx" ON "promotional_packs"("salonId");
CREATE INDEX "promotional_packs_isActive_idx" ON "promotional_packs"("isActive");
CREATE INDEX "promotional_packs_startDate_endDate_idx" ON "promotional_packs"("startDate", "endDate");

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE "stories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "story_views" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "promotional_packs" ENABLE ROW LEVEL SECURITY;

-- Stories: Anyone can read active stories
CREATE POLICY "stories_select_policy" ON "stories"
    FOR SELECT USING (
        "isActive" = true AND "expiresAt" > NOW()
    );

-- Stories: Providers can insert their own stories
CREATE POLICY "stories_insert_policy" ON "stories"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM "therapists" t WHERE t."id" = "therapistId" AND t."userId" = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM "salons" s WHERE s."id" = "salonId" AND s."userId" = auth.uid()
        )
    );

-- Stories: Providers can delete their own stories
CREATE POLICY "stories_delete_policy" ON "stories"
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM "therapists" t WHERE t."id" = "therapistId" AND t."userId" = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM "salons" s WHERE s."id" = "salonId" AND s."userId" = auth.uid()
        )
    );

-- Story Views: Users can insert their own views
CREATE POLICY "story_views_insert_policy" ON "story_views"
    FOR INSERT WITH CHECK ("userId" = auth.uid());

-- Story Views: Users can read their own views
CREATE POLICY "story_views_select_policy" ON "story_views"
    FOR SELECT USING ("userId" = auth.uid());

-- Promotional Packs: Anyone can read active packs
CREATE POLICY "packs_select_policy" ON "promotional_packs"
    FOR SELECT USING (
        "isActive" = true 
        AND "startDate" <= NOW() 
        AND ("endDate" IS NULL OR "endDate" >= NOW())
    );

-- Promotional Packs: Providers can manage their own packs
CREATE POLICY "packs_insert_policy" ON "promotional_packs"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM "therapists" t WHERE t."id" = "therapistId" AND t."userId" = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM "salons" s WHERE s."id" = "salonId" AND s."userId" = auth.uid()
        )
    );

CREATE POLICY "packs_update_policy" ON "promotional_packs"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "therapists" t WHERE t."id" = "therapistId" AND t."userId" = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM "salons" s WHERE s."id" = "salonId" AND s."userId" = auth.uid()
        )
    );

CREATE POLICY "packs_delete_policy" ON "promotional_packs"
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM "therapists" t WHERE t."id" = "therapistId" AND t."userId" = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM "salons" s WHERE s."id" = "salonId" AND s."userId" = auth.uid()
        )
    );

-- ============================================
-- Function: Auto-delete expired stories (Cron)
-- ============================================

CREATE OR REPLACE FUNCTION delete_expired_stories()
RETURNS void AS $$
BEGIN
    DELETE FROM "stories" WHERE "expiresAt" < NOW();
END;
$$ LANGUAGE plpgsql;

-- Note: To schedule this function, use Supabase's pg_cron extension:
-- SELECT cron.schedule('delete-expired-stories', '0 * * * *', 'SELECT delete_expired_stories();');

-- ============================================
-- Done!
-- ============================================
