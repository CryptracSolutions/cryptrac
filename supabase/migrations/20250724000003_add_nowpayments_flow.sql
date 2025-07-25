ALTER TABLE public.merchants
ADD COLUMN IF NOT EXISTS auto_convert_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS preferred_payout_currency text;
