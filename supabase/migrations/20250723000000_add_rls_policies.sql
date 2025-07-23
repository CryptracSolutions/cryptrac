-- Migration: Add RLS Policies and Functions
-- Date: 2025-07-23
-- Description: Adds missing INSERT policies for merchants and payment_links tables, and creates secure merchant creation function

-- Drop existing function if it exists (to handle return type changes)
DROP FUNCTION IF EXISTS create_merchant_for_user(uuid, text);

-- RLS Policy: Allow users to INSERT their own merchant records
CREATE POLICY "Merchants can create own records" ON "public"."merchants"
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (
  (auth.uid() = user_id) OR (auth.email() = 'admin@cryptrac.com'::text)
);

-- RLS Policy: Allow merchants to INSERT their own payment links
CREATE POLICY "Merchants can create payment links" ON "public"."payment_links"
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (
  (merchant_id IN ( 
    SELECT merchants.id
    FROM merchants
    WHERE (merchants.user_id = auth.uid())
  )) OR (auth.email() = 'admin@cryptrac.com'::text)
);

-- Function to create merchant records that bypasses RLS
CREATE OR REPLACE FUNCTION create_merchant_for_user(
  p_user_id uuid,
  p_business_name text DEFAULT 'My Business'
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  business_name text,
  onboarding_completed boolean,
  onboarding_step integer,
  setup_paid boolean
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if merchant already exists
  IF EXISTS (SELECT 1 FROM merchants WHERE merchants.user_id = p_user_id) THEN
    -- Return existing merchant
    RETURN QUERY 
    SELECT m.id, m.user_id, m.business_name, m.onboarding_completed, m.onboarding_step, m.setup_paid
    FROM merchants m 
    WHERE m.user_id = p_user_id;
  ELSE
    -- Create new merchant
    RETURN QUERY
    INSERT INTO merchants (user_id, business_name, onboarding_completed, onboarding_step, setup_paid)
    VALUES (p_user_id, p_business_name, true, 5, true)
    RETURNING merchants.id, merchants.user_id, merchants.business_name, merchants.onboarding_completed, merchants.onboarding_step, merchants.setup_paid;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_merchant_for_user(uuid, text) TO authenticated;

-- Comments for documentation
COMMENT ON POLICY "Merchants can create own records" ON "public"."merchants" IS 'Allows users to create merchant records for themselves';
COMMENT ON POLICY "Merchants can create payment links" ON "public"."payment_links" IS 'Allows merchants to create payment links for their own merchant account';
COMMENT ON FUNCTION create_merchant_for_user(uuid, text) IS 'Securely creates or returns merchant record for a user, bypassing RLS';

