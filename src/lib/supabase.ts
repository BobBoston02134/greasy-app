import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

// Lazy-initialize Supabase client
export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase environment variables. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  _supabase = createClient(supabaseUrl, supabaseServiceKey);
  return _supabase;
}

// For backwards compatibility - getter that lazy-loads
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return getSupabase()[prop as keyof SupabaseClient];
  },
});

// Types for database tables
export interface User {
  id: string;
  email: string;
  name: string | null;
  password_hash: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Charity {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  stripe_destination_account: string | null;
  is_anti_charity: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Donation {
  id: string;
  user_id: string | null;
  amount_cents: number;
  fee_cents: number;
  cover_fees: boolean;
  charity_id: string;
  anti_charity_id: string | null;
  timeframe: string;
  capture_at: string | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  status: 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded' | 'redirected';
  commitment_verified: boolean | null;
  commitment_verified_at: string | null;
  donor_email: string | null;
  donor_name: string | null;
  notes: string | null;
  checkin_email_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface CharityRequest {
  id: string;
  charity_name: string;
  website: string | null;
  reason: string | null;
  email: string | null;
  status: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
}

export interface WebhookEvent {
  id: string;
  stripe_event_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  processed: boolean;
  error: string | null;
  created_at: string;
  processed_at: string | null;
}
