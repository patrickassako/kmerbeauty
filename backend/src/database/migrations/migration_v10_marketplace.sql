-- Migration V10: Marketplace Tables
-- Description: Create tables for marketplace functionality (products, orders, comments, reviews, messages)
-- Author: KmerServices Team
-- Date: 2025-11-27

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Table: marketplace_products
-- Description: Product catalog with images, video, pricing, stock
-- =============================================
CREATE TABLE IF NOT EXISTS marketplace_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  
  -- Product information
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- 'equipment', 'beauty_product', 'accessory', 'other'
  
  -- Pricing and stock
  price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
  currency VARCHAR(10) DEFAULT 'XAF',
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
  
  -- Media
  images JSONB DEFAULT '[]', -- Array of image URLs
  video_url TEXT, -- URL of product presentation video
  
  -- Location
  city VARCHAR(100), -- City of seller/product
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false, -- Admin approval required
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  
  -- Metadata
  views_count INTEGER DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for marketplace_products
CREATE INDEX idx_marketplace_products_seller ON marketplace_products(seller_id);
CREATE INDEX idx_marketplace_products_category ON marketplace_products(category);
CREATE INDEX idx_marketplace_products_city ON marketplace_products(city);
CREATE INDEX idx_marketplace_products_active ON marketplace_products(is_active);
CREATE INDEX idx_marketplace_products_approved ON marketplace_products(is_approved);

-- =============================================
-- Table: marketplace_orders
-- Description: Purchase orders with payment/delivery tracking
-- =============================================
CREATE TABLE IF NOT EXISTS marketplace_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES marketplace_products(id),
  buyer_id UUID NOT NULL REFERENCES users(id),
  seller_id UUID NOT NULL REFERENCES therapists(id),
  
  -- Order details
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'ready_for_pickup', 'delivered', 'cancelled'
  
  -- Payment
  payment_method VARCHAR(50) DEFAULT 'cash_on_delivery', -- 'cash_on_delivery', 'cash_on_pickup'
  payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid'
  paid_at TIMESTAMP,
  
  -- Delivery
  delivery_method VARCHAR(50), -- 'delivery' or 'pickup'
  delivery_address TEXT,
  delivery_phone VARCHAR(20),
  delivery_notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for marketplace_orders
CREATE INDEX idx_marketplace_orders_buyer ON marketplace_orders(buyer_id);
CREATE INDEX idx_marketplace_orders_seller ON marketplace_orders(seller_id);
CREATE INDEX idx_marketplace_orders_product ON marketplace_orders(product_id);
CREATE INDEX idx_marketplace_orders_status ON marketplace_orders(status);

-- =============================================
-- Table: marketplace_comments
-- Description: Public comments/questions (accessible to all users)
-- =============================================
CREATE TABLE IF NOT EXISTS marketplace_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Content (free comment, accessible to all)
  comment TEXT NOT NULL,
  
  -- Seller reply
  seller_reply TEXT,
  seller_reply_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for marketplace_comments
CREATE INDEX idx_marketplace_comments_product ON marketplace_comments(product_id);
CREATE INDEX idx_marketplace_comments_user ON marketplace_comments(user_id);

-- =============================================
-- Table: marketplace_reviews
-- Description: Verified reviews with ratings (buyers only, after purchase)
-- =============================================
CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  order_id UUID NOT NULL REFERENCES marketplace_orders(id), -- Proof of purchase REQUIRED
  
  -- Rating (only after purchase)
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  
  -- Seller reply
  seller_reply TEXT,
  seller_reply_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraint: One review per order
  UNIQUE(order_id, product_id)
);

-- Indexes for marketplace_reviews
CREATE INDEX idx_marketplace_reviews_product ON marketplace_reviews(product_id);
CREATE INDEX idx_marketplace_reviews_user ON marketplace_reviews(user_id);
CREATE INDEX idx_marketplace_reviews_order ON marketplace_reviews(order_id);

-- =============================================
-- Table: marketplace_messages
-- Description: Product-specific chat conversations
-- =============================================
CREATE TABLE IF NOT EXISTS marketplace_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES marketplace_products(id),
  sender_id UUID NOT NULL REFERENCES users(id),
  receiver_id UUID NOT NULL REFERENCES users(id),
  
  -- Content
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for marketplace_messages
CREATE INDEX idx_marketplace_messages_product ON marketplace_messages(product_id);
CREATE INDEX idx_marketplace_messages_sender ON marketplace_messages(sender_id);
CREATE INDEX idx_marketplace_messages_receiver ON marketplace_messages(receiver_id);
CREATE INDEX idx_marketplace_messages_unread ON marketplace_messages(is_read) WHERE is_read = false;

-- =============================================
-- Triggers for updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_marketplace_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_marketplace_products_updated_at
  BEFORE UPDATE ON marketplace_products
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_updated_at();

CREATE TRIGGER trigger_marketplace_orders_updated_at
  BEFORE UPDATE ON marketplace_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_updated_at();

CREATE TRIGGER trigger_marketplace_comments_updated_at
  BEFORE UPDATE ON marketplace_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_updated_at();

CREATE TRIGGER trigger_marketplace_reviews_updated_at
  BEFORE UPDATE ON marketplace_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_updated_at();

-- =============================================
-- RLS Policies (Row Level Security)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_messages ENABLE ROW LEVEL SECURITY;

-- Products: Everyone can read approved products, only seller can modify
CREATE POLICY "Anyone can view approved products"
  ON marketplace_products FOR SELECT
  USING (is_approved = true AND is_active = true);

CREATE POLICY "Sellers can view their own products"
  ON marketplace_products FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM therapists WHERE id = seller_id));

CREATE POLICY "Sellers can insert products"
  ON marketplace_products FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM therapists WHERE id = seller_id));

CREATE POLICY "Sellers can update their own products"
  ON marketplace_products FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM therapists WHERE id = seller_id));

CREATE POLICY "Sellers can delete their own products"
  ON marketplace_products FOR DELETE
  USING (auth.uid() IN (SELECT user_id FROM therapists WHERE id = seller_id));

-- Orders: Buyers and sellers can view their orders
CREATE POLICY "Buyers can view their orders"
  ON marketplace_orders FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers can view their orders"
  ON marketplace_orders FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM therapists WHERE id = seller_id));

CREATE POLICY "Anyone can create orders"
  ON marketplace_orders FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Sellers can update their orders"
  ON marketplace_orders FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM therapists WHERE id = seller_id));

-- Comments: Everyone can read, authenticated users can post
CREATE POLICY "Anyone can view comments"
  ON marketplace_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can post comments"
  ON marketplace_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sellers can reply to comments"
  ON marketplace_comments FOR UPDATE
  USING (auth.uid() IN (
    SELECT t.user_id FROM therapists t
    JOIN marketplace_products p ON p.seller_id = t.id
    WHERE p.id = product_id
  ));

-- Reviews: Everyone can read, only buyers can post
CREATE POLICY "Anyone can view reviews"
  ON marketplace_reviews FOR SELECT
  USING (true);

CREATE POLICY "Buyers can post reviews"
  ON marketplace_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM marketplace_orders WHERE id = order_id AND buyer_id = auth.uid())
  );

CREATE POLICY "Sellers can reply to reviews"
  ON marketplace_reviews FOR UPDATE
  USING (auth.uid() IN (
    SELECT t.user_id FROM therapists t
    JOIN marketplace_products p ON p.seller_id = t.id
    WHERE p.id = product_id
  ));

-- Messages: Sender and receiver can view
CREATE POLICY "Users can view their messages"
  ON marketplace_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON marketplace_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receivers can mark messages as read"
  ON marketplace_messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- =============================================
-- Success Message
-- =============================================
DO $$
BEGIN
  RAISE NOTICE 'Migration V10 completed successfully!';
  RAISE NOTICE 'Created tables: marketplace_products, marketplace_orders, marketplace_comments, marketplace_reviews, marketplace_messages';
  RAISE NOTICE 'RLS policies enabled for all marketplace tables';
END $$;
