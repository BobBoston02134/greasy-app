-- Greasy Database Schema for Supabase PostgreSQL
-- Run this in both dev and prod Supabase projects
-- Last updated: 2026-03-01

-- ============================================
-- USERS TABLE
-- Managed by NextAuth, stores profile data
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT, -- bcrypt hash for credential auth
  stripe_customer_id TEXT UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);

-- ============================================
-- CHARITIES TABLE
-- Admin-curated list of recipient organizations
-- ============================================
CREATE TABLE charities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL, -- e.g., 'sundai_club', 'mit_alumni'
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  stripe_destination_account TEXT, -- for future Stripe Connect payouts
  is_anti_charity BOOLEAN DEFAULT FALSE, -- can be used as anti-charity
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_charities_slug ON charities(slug);
CREATE INDEX idx_charities_active ON charities(active);

-- ============================================
-- DONATIONS TABLE
-- Core donation records with anti-charity tracking
-- ============================================
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Amount in cents
  amount_cents INTEGER NOT NULL,
  fee_cents INTEGER DEFAULT 0, -- 2.5% platform fee
  cover_fees BOOLEAN DEFAULT FALSE, -- donor opted to cover fees

  -- Recipients
  charity_id UUID REFERENCES charities(id) NOT NULL,
  anti_charity_id UUID REFERENCES charities(id), -- null if no motivation selected

  -- Timeframe
  timeframe TEXT NOT NULL, -- 'immediate', '5pm', '10pm', 'midnight', etc.
  capture_at TIMESTAMPTZ, -- when to capture deferred payment

  -- Stripe payment tracking
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,

  -- Status workflow
  status TEXT NOT NULL DEFAULT 'pending',
  -- pending: created, awaiting payment confirmation
  -- authorized: payment authorized, awaiting capture (deferred)
  -- captured: payment captured successfully
  -- failed: payment failed
  -- refunded: payment refunded
  -- redirected: funds sent to anti-charity (commitment failed)

  -- Commitment tracking (for anti-charity feature)
  commitment_verified BOOLEAN DEFAULT NULL, -- null = not yet checked, true = honored, false = failed
  commitment_verified_at TIMESTAMPTZ,

  -- Metadata
  donor_email TEXT, -- for guest donations
  donor_name TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_donations_user_id ON donations(user_id);
CREATE INDEX idx_donations_charity_id ON donations(charity_id);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_stripe_payment_intent_id ON donations(stripe_payment_intent_id);
CREATE INDEX idx_donations_capture_at ON donations(capture_at) WHERE status = 'authorized';
CREATE INDEX idx_donations_created_at ON donations(created_at);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- Recurring donation subscriptions
-- ============================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  charity_id UUID REFERENCES charities(id) NOT NULL,

  -- Stripe IDs
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_price_id TEXT NOT NULL,

  -- Amount
  amount_cents INTEGER NOT NULL,
  fee_cents INTEGER DEFAULT 0,
  cover_fees BOOLEAN DEFAULT FALSE,

  -- Schedule
  interval TEXT NOT NULL, -- 'week' or 'month'

  -- Status
  status TEXT NOT NULL DEFAULT 'incomplete',
  -- incomplete: awaiting first payment
  -- active: subscription is active
  -- past_due: payment failed, retrying
  -- canceled: subscription canceled
  -- paused: subscription paused

  canceled_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- ============================================
-- CHARITY REQUESTS TABLE
-- User-submitted requests for new charities
-- (Already exists in Prisma, migrating to Supabase)
-- ============================================
CREATE TABLE charity_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charity_name TEXT NOT NULL,
  website TEXT,
  reason TEXT,
  email TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_charity_requests_status ON charity_requests(status);

-- ============================================
-- CONTACT SUBMISSIONS TABLE
-- For contact form (currently broken)
-- ============================================
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new', -- new, read, replied
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contact_submissions_status ON contact_submissions(status);

-- ============================================
-- WEBHOOK EVENTS TABLE
-- Log Stripe webhook events for debugging
-- ============================================
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_webhook_events_stripe_event_id ON webhook_events(stripe_event_id);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);

-- ============================================
-- SEED DATA: Initial Charities
-- ============================================
INSERT INTO charities (slug, name, description, is_anti_charity) VALUES
  ('sundai_club', 'Sundai Club', 'Supporting innovation and entrepreneurship', FALSE),
  ('mit_alumni', 'MIT Alumni Association', 'MIT Alumni community and programs', FALSE),
  ('harvard_alumni', 'Harvard Alumni Association', 'Harvard Alumni community and programs', FALSE),
  ('stanford_alumni', 'Stanford Alumni Association', 'Stanford Alumni community and programs', FALSE),
  ('mit_sloan', 'MIT Sloan Annual Fund', 'MIT Sloan School of Management', FALSE),
  ('usna_alumni', 'US Naval Academy Alumni Fund', 'US Naval Academy Alumni Association', FALSE),
  ('west_point', 'West Point Association of Graduates', 'West Point Alumni community', FALSE);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable after tables are created
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE charity_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Users can view their own donations
CREATE POLICY "Users can view own donations" ON donations
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Anyone can view active charities
CREATE POLICY "Anyone can view active charities" ON charities
  FOR SELECT USING (active = TRUE);

-- Anyone can create charity requests
CREATE POLICY "Anyone can create charity requests" ON charity_requests
  FOR INSERT WITH CHECK (TRUE);

-- Anyone can create contact submissions
CREATE POLICY "Anyone can create contact submissions" ON contact_submissions
  FOR INSERT WITH CHECK (TRUE);

-- Service role can do everything (for API routes)
-- Note: Use service_role key in API routes for full access

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_charities_updated_at
  BEFORE UPDATE ON charities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_donations_updated_at
  BEFORE UPDATE ON donations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
