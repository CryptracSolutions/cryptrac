-- Migration: Add Public Access RLS Policies for Customer Payment Pages
-- Date: July 24, 2025
-- Phase: 5 - NOWPayments Integration
-- Purpose: Enable public access to payment links and merchant business names for customer payment pages

-- Create RLS policy to allow public read access to active payment links
CREATE POLICY "Allow public read access to active payment links" 
ON payment_links 
FOR SELECT 
USING (status = 'active');

-- Make sure RLS is enabled on payment_links table
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;

-- Also allow public read access to merchants table for business names
CREATE POLICY "Allow public read access to merchant business names" 
ON merchants 
FOR SELECT 
USING (true);

-- Make sure RLS is enabled on merchants table
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

