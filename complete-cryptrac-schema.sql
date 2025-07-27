

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."calculate_monthly_leaderboard"("target_month" "date" DEFAULT "date_trunc"('month'::"text", ("now"() - '1 mon'::interval))) RETURNS TABLE("rep_id" "uuid", "sales_count" integer, "rank" integer, "bonus_amount" numeric, "tie_count" integer)
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
    RETURN QUERY
    WITH monthly_sales AS (
        SELECT 
            rs.rep_id,
            COUNT(*) as sales
        FROM rep_sales rs
        WHERE rs.validated = TRUE
        AND date_trunc('month', rs.date) = target_month
        GROUP BY rs.rep_id
        HAVING COUNT(*) >= 5  -- Minimum 5 sales to qualify (Bible Section 7.6)
    ),
    ranked_sales AS (
        SELECT 
            rep_id,
            sales::INT,
            DENSE_RANK() OVER (ORDER BY sales DESC) as rank,
            COUNT(*) OVER (PARTITION BY sales) as tie_count
        FROM monthly_sales
    ),
    bonus_calculation AS (
        SELECT 
            rs.*,
            CASE 
                WHEN rs.rank = 1 THEN 300.0 / rs.tie_count  -- 1st place: $300 split among ties
                WHEN rs.rank = 2 THEN 200.0 / rs.tie_count  -- 2nd place: $200 split among ties  
                WHEN rs.rank = 3 THEN 100.0 / rs.tie_count  -- 3rd place: $100 split among ties
                ELSE 0.0
            END as bonus
        FROM ranked_sales rs
        WHERE rs.rank <= 3
    )
    SELECT 
        bc.rep_id,
        bc.sales,
        bc.rank,
        bc.bonus,
        bc.tie_count
    FROM bonus_calculation bc;
END;
$_$;


ALTER FUNCTION "public"."calculate_monthly_leaderboard"("target_month" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_monthly_leaderboard_secure"("target_month" "date" DEFAULT "date_trunc"('month'::"text", ("now"() - '1 mon'::interval))) RETURNS TABLE("rep_id" "uuid", "sales_count" integer, "rank" integer, "bonus_amount" numeric, "tie_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Check if user is rep or admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('rep', 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied: Only reps and admins can view leaderboard';
    END IF;
    
    -- Return the leaderboard data
    RETURN QUERY SELECT * FROM calculate_monthly_leaderboard(target_month);
END;
$$;


ALTER FUNCTION "public"."calculate_monthly_leaderboard_secure"("target_month" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_payment_link_status"("p_current_status" "text", "p_usage_count" integer, "p_max_uses" integer, "p_expires_at" timestamp with time zone) RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- If manually completed, keep it completed
    IF p_current_status = 'completed' THEN
        RETURN 'completed';
    END IF;

    -- If manually paused, keep it paused
    IF p_current_status = 'paused' THEN
        RETURN 'paused';
    END IF;

    -- Check if expired
    IF p_expires_at IS NOT NULL AND p_expires_at < NOW() THEN
        RETURN 'expired';
    END IF;

    -- Check if max uses reached (including single-use links with max_uses=1)
    IF p_max_uses IS NOT NULL AND p_usage_count >= p_max_uses THEN
        RETURN 'completed';
    END IF;

    -- Otherwise, it's active
    RETURN 'active';
END;
$$;


ALTER FUNCTION "public"."calculate_payment_link_status"("p_current_status" "text", "p_usage_count" integer, "p_max_uses" integer, "p_expires_at" timestamp with time zone) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_payment_link_status"("p_current_status" "text", "p_usage_count" integer, "p_max_uses" integer, "p_expires_at" timestamp with time zone) IS 'Calculates the correct status for a payment link based on business rules';



CREATE OR REPLACE FUNCTION "public"."calculate_rep_tier"("rep_id" "uuid", "target_month" "date" DEFAULT "date_trunc"('month'::"text", ("now"() - '1 mon'::interval))) RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    prev_month_sales INT;
    new_tier INT;
BEGIN
    -- Count validated sales from previous month
    SELECT COUNT(*) INTO prev_month_sales
    FROM rep_sales rs
    WHERE rs.rep_id = calculate_rep_tier.rep_id
    AND rs.validated = TRUE
    AND date_trunc('month', rs.date) = target_month;
    
    -- Determine tier based on Bible Section 7.3.1
    IF prev_month_sales >= 8 THEN
        new_tier := 3;  -- 100% commission
    ELSIF prev_month_sales >= 4 THEN
        new_tier := 2;  -- 80% commission
    ELSE
        new_tier := 1;  -- 60% commission
    END IF;
    
    RETURN new_tier;
END;
$$;


ALTER FUNCTION "public"."calculate_rep_tier"("rep_id" "uuid", "target_month" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_subscription_proration"("merchant_id" "uuid", "subscription_amount" numeric, "days_used" integer, "total_days" integer) RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- This function is for admin use only for subscription refunds
    -- Bible: "Manual for subscription, and prorated based on usage at our discretion"
    
    -- Simple proration based on time used
    IF days_used >= total_days THEN
        RETURN 0;  -- No refund if full period used
    END IF;
    
    -- Return prorated amount based on unused days
    RETURN subscription_amount * ((total_days - days_used)::NUMERIC / total_days);
END;
$$;


ALTER FUNCTION "public"."calculate_subscription_proration"("merchant_id" "uuid", "subscription_amount" numeric, "days_used" integer, "total_days" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_subscription_proration"("merchant_id" "uuid", "subscription_amount" numeric, "days_used" integer, "total_days" integer) IS 'Admin-only function for manual subscription proration. Bible: No automatic refunds, admin discretion only.';



CREATE OR REPLACE FUNCTION "public"."clean_expired_cache"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    DELETE FROM "public"."nowpayments_cache" 
    WHERE "expires_at" < NOW();
END;
$$;


ALTER FUNCTION "public"."clean_expired_cache"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."clean_expired_cache"() IS 'Removes expired cache entries from nowpayments_cache table';



CREATE OR REPLACE FUNCTION "public"."create_merchant_for_user"("p_user_id" "uuid", "p_business_name" "text" DEFAULT 'My Business'::"text") RETURNS TABLE("id" "uuid", "user_id" "uuid", "business_name" "text", "onboarding_completed" boolean, "onboarding_step" integer, "setup_paid" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."create_merchant_for_user"("p_user_id" "uuid", "p_business_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_merchant_for_user"("p_user_id" "uuid", "p_business_name" "text") IS 'Securely creates or returns merchant record for a user, bypassing RLS';



CREATE OR REPLACE FUNCTION "public"."get_current_merchant_id"() RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    merchant_uuid UUID;
BEGIN
    SELECT id INTO merchant_uuid
    FROM merchants
    WHERE user_id = auth.uid();
    
    RETURN merchant_uuid;
END;
$$;


ALTER FUNCTION "public"."get_current_merchant_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_merchant_supported_currencies"("merchant_id" "uuid") RETURNS TABLE("code" character varying, "name" character varying, "symbol" character varying, "network" character varying, "is_token" boolean, "parent_currency" character varying, "trust_wallet_compatible" boolean, "address_format" character varying, "has_wallet" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.code,
        sc.name,
        sc.symbol,
        sc.network,
        sc.is_token,
        sc.parent_currency,
        sc.trust_wallet_compatible,
        sc.address_format,
        (m.wallets ? sc.code) as has_wallet
    FROM "public"."supported_currencies" sc
    CROSS JOIN "public"."merchants" m
    WHERE m.id = merchant_id
    AND sc.enabled = true
    AND (
        array_length(m.supported_currencies, 1) IS NULL 
        OR sc.code = ANY(m.supported_currencies)
    )
    ORDER BY 
        CASE sc.code 
            WHEN 'BTC' THEN 1
            WHEN 'ETH' THEN 2
            WHEN 'USDT' THEN 3
            WHEN 'USDC' THEN 4
            WHEN 'LTC' THEN 5
            ELSE 99
        END,
        sc.name;
END;
$$;


ALTER FUNCTION "public"."get_merchant_supported_currencies"("merchant_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_merchant_supported_currencies"("merchant_id" "uuid") IS 'Returns supported currencies for a merchant with wallet status';



CREATE OR REPLACE FUNCTION "public"."get_payment_link_statistics"("p_merchant_id" "uuid") RETURNS TABLE("total_links" integer, "active_links" integer, "completed_links" integer, "expired_links" integer, "paused_links" integer, "single_use_links" integer, "total_payments" integer, "total_revenue" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    WITH link_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE calculate_payment_link_status(status, usage_count, max_uses, expires_at) = 'active') as active,
            COUNT(*) FILTER (WHERE calculate_payment_link_status(status, usage_count, max_uses, expires_at) = 'completed') as completed,
            COUNT(*) FILTER (WHERE calculate_payment_link_status(status, usage_count, max_uses, expires_at) = 'expired') as expired,
            COUNT(*) FILTER (WHERE calculate_payment_link_status(status, usage_count, max_uses, expires_at) = 'paused') as paused,
            COUNT(*) FILTER (WHERE max_uses = 1) as single_use
        FROM payment_links
        WHERE merchant_id = p_merchant_id
    ),
    payment_stats AS (
        SELECT 
            COUNT(*) as payments,
            COALESCE(SUM(amount), 0) as revenue
        FROM merchant_payments
        WHERE merchant_id = p_merchant_id
        AND status IN ('confirmed', 'finished')
    )
    SELECT 
        link_stats.total::INTEGER,
        link_stats.active::INTEGER,
        link_stats.completed::INTEGER,
        link_stats.expired::INTEGER,
        link_stats.paused::INTEGER,
        link_stats.single_use::INTEGER,
        payment_stats.payments::INTEGER,
        payment_stats.revenue::NUMERIC
    FROM link_stats, payment_stats;
END;
$$;


ALTER FUNCTION "public"."get_payment_link_statistics"("p_merchant_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_payment_link_statistics"("p_merchant_id" "uuid") IS 'Returns comprehensive statistics for merchant payment links with real-time status calculation';



CREATE OR REPLACE FUNCTION "public"."handle_monthly_bonus"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
    current_sales INT;
    tier_percentage INT;
    setup_commission NUMERIC;
    bonus_amount NUMERIC := 0;
BEGIN
    -- Only process when a sale becomes validated
    IF NEW.validated = TRUE AND (OLD.validated IS NULL OR OLD.validated = FALSE) THEN
        
        -- Get current rep info
        SELECT total_sales + 1, tier INTO current_sales, tier_percentage
        FROM reps WHERE id = NEW.rep_id FOR UPDATE;
        
        -- Update total sales count
        UPDATE reps SET total_sales = current_sales WHERE id = NEW.rep_id;
        
        -- Calculate tiered commission on $99 setup fee (Bible Section 7.3.1)
        setup_commission := CASE tier_percentage
            WHEN 1 THEN 99 * 0.60  -- Tier 1: 60%
            WHEN 2 THEN 99 * 0.80  -- Tier 2: 80%
            WHEN 3 THEN 99 * 1.00  -- Tier 3: 100%
            ELSE 99 * 0.60         -- Default to Tier 1
        END;
        
        -- Add setup fee commission
        UPDATE reps SET total_commission = total_commission + setup_commission WHERE id = NEW.rep_id;
        
        -- $100 bonus every 3 validated sales (Bible Section 7)
        IF current_sales % 3 = 0 THEN
            bonus_amount := 100;
            UPDATE reps SET total_commission = total_commission + bonus_amount WHERE id = NEW.rep_id;
            
            -- Log the bonus
            INSERT INTO monthly_bonus_log (rep_id, month, sales_count, bonus_amount, paid, original_bonus, split_bonus) 
            VALUES (NEW.rep_id, date_trunc('month', NOW()), current_sales, bonus_amount, FALSE, bonus_amount, bonus_amount);
        END IF;
        
    END IF;
    
    RETURN NEW;
END;
$_$;


ALTER FUNCTION "public"."handle_monthly_bonus"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_partner_referral"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
BEGIN
    -- When merchant becomes onboarded and setup is paid, validate partner referral
    IF NEW.onboarded = TRUE AND NEW.setup_paid = TRUE AND 
       (OLD.onboarded = FALSE OR OLD.setup_paid = FALSE) AND
       NEW.referred_by_partner IS NOT NULL THEN
        
        -- Insert or update partner referral record
        INSERT INTO partner_referrals (partner_id, merchant_id, validated, validated_at)
        VALUES (NEW.referred_by_partner, NEW.id, TRUE, NOW())
        ON CONFLICT (partner_id, merchant_id) 
        DO UPDATE SET validated = TRUE, validated_at = NOW();
        
        -- Update partner totals ($50 per validated referral - Bible Section 8)
        UPDATE partners 
        SET total_referrals = total_referrals + 1,
            total_bonus = total_bonus + 50
        WHERE id = NEW.referred_by_partner;
        
    END IF;
    
    RETURN NEW;
END;
$_$;


ALTER FUNCTION "public"."handle_partner_referral"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_expired_payment_links"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    -- Update all payment links that have expired but are still active or paused
    UPDATE payment_links
    SET 
        status = 'expired',
        updated_at = NOW()
    WHERE 
        expires_at IS NOT NULL 
        AND expires_at < NOW() 
        AND status IN ('active', 'paused');
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    -- Log the batch update
    IF updated_count > 0 THEN
        INSERT INTO audit_logs (action, details)
        VALUES (
            'batch_expire_payment_links',
            jsonb_build_object(
                'updated_count', updated_count,
                'timestamp', NOW()
            )
        );
    END IF;
    
    RETURN updated_count;
END;
$$;


ALTER FUNCTION "public"."update_expired_payment_links"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_expired_payment_links"() IS 'Batch function to update expired payment links (for cron jobs)';



CREATE OR REPLACE FUNCTION "public"."update_payment_link_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    new_status TEXT;
BEGIN
    -- Calculate the new status
    new_status := calculate_payment_link_status(
        NEW.status,
        NEW.usage_count,
        NEW.max_uses,
        NEW.expires_at
    );

    -- Update the status if it has changed
    IF new_status != NEW.status THEN
        NEW.status := new_status;
        NEW.updated_at := NOW();
        
        -- Log the automatic status change
        INSERT INTO audit_logs (action, affected_id, details)
        VALUES (
            'payment_link_auto_status_update',
            NEW.id,
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', new_status,
                'reason', 'automatic_calculation',
                'usage_count', NEW.usage_count,
                'max_uses', NEW.max_uses,
                'expires_at', NEW.expires_at
            )
        );
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_payment_link_status"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_payment_link_status"() IS 'Trigger function to automatically update payment link status';



CREATE OR REPLACE FUNCTION "public"."update_payment_link_usage"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update usage count when a payment is confirmed
    IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
        UPDATE payment_links 
        SET 
            usage_count = COALESCE(usage_count, 0) + 1,
            last_payment_at = NOW()
        WHERE id = NEW.payment_link_id;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_payment_link_usage"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "action" "text" NOT NULL,
    "user_id" "uuid",
    "affected_id" "uuid",
    "details" "jsonb",
    "timestamp" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."automation_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "task" "text" NOT NULL,
    "success" boolean NOT NULL,
    "error" "text",
    "timestamp" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."automation_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "email" "text" NOT NULL,
    "type" "text" NOT NULL,
    "status" "text" DEFAULT 'sent'::"text",
    "timestamp" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."email_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fiat_payouts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" numeric(18,2) NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "timestamp" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."fiat_payouts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."merchant_payments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "merchant_id" "uuid",
    "invoice_id" "text",
    "amount" numeric(18,2),
    "currency" character varying(20),
    "pay_currency" character varying(20),
    "status" "text" DEFAULT 'pending'::"text",
    "tx_hash" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "nowpayments_invoice_id" character varying(100),
    "payment_link_id" "uuid",
    "order_id" character varying(255),
    "amount_received" numeric(18,8) DEFAULT 0,
    "currency_received" character varying(10),
    "pay_address" "text",
    "pay_amount" numeric(18,8),
    "cryptrac_fee" numeric(18,8) DEFAULT 0,
    "gateway_fee" numeric(18,8) DEFAULT 0,
    "merchant_receives" numeric(18,8) DEFAULT 0,
    "customer_email" character varying(255),
    "payment_data" "jsonb" DEFAULT '{}'::"jsonb",
    "expires_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "payout_currency" character varying(20)
);


ALTER TABLE "public"."merchant_payments" OWNER TO "postgres";


COMMENT ON TABLE "public"."merchant_payments" IS 'Updated for Phase 5 NOWPayments integration - all required columns added';



CREATE TABLE IF NOT EXISTS "public"."merchants" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "business_name" "text" NOT NULL,
    "website" "text",
    "industry" "text",
    "wallets" "jsonb" DEFAULT '{}'::"jsonb",
    "trial_end" timestamp with time zone,
    "onboarded" boolean DEFAULT false,
    "country" "text" DEFAULT 'US'::"text",
    "plan" "text" DEFAULT 'cryptrac'::"text",
    "subscription_id" "text",
    "usage_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "preferred_currency" "text" DEFAULT 'USD'::"text",
    "onboarding_step" integer DEFAULT 0,
    "onboarding_completed" boolean DEFAULT false,
    "onboarding_data" "jsonb" DEFAULT '{}'::"jsonb",
    "business_website" character varying(500),
    "business_industry" character varying(100),
    "business_description" "text",
    "preferred_currencies" "jsonb" DEFAULT '["BTC", "ETH", "LTC"]'::"jsonb",
    "payment_config" "jsonb" DEFAULT '{"auto_forward": true, "fee_percentage": 0.5, "auto_convert_fee": 1.0}'::"jsonb",
    "setup_paid" boolean DEFAULT false,
    "setup_fee_amount" numeric(10,2) DEFAULT 99.00,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "auto_convert_enabled" boolean DEFAULT false,
    "preferred_payout_currency" "text",
    "subscription_plan" "text",
    "subscription_status" "text" DEFAULT 'active'::"text",
    "monthly_subscription_id" "text",
    "yearly_subscription_id" "text",
    "last_subscription_payment" timestamp with time zone,
    "referred_by_rep" "uuid",
    "referred_by_partner" "uuid",
    "wallet_generation_method" character varying(20) DEFAULT 'manual'::character varying,
    "supported_currencies" "text"[] DEFAULT '{}'::"text"[],
    CONSTRAINT "check_trial_end" CHECK (("trial_end" > "created_at")),
    CONSTRAINT "merchants_subscription_plan_check" CHECK (("subscription_plan" = ANY (ARRAY['monthly'::"text", 'yearly'::"text"]))),
    CONSTRAINT "merchants_subscription_status_check" CHECK (("subscription_status" = ANY (ARRAY['active'::"text", 'cancelled'::"text", 'past_due'::"text"])))
);


ALTER TABLE "public"."merchants" OWNER TO "postgres";


COMMENT ON COLUMN "public"."merchants"."payment_config" IS 'Payment processing configuration including fees and forwarding settings';



COMMENT ON COLUMN "public"."merchants"."auto_convert_enabled" IS 'Whether merchant has auto-conversion to fiat enabled (1% fee vs 0.5%)';



COMMENT ON COLUMN "public"."merchants"."preferred_payout_currency" IS 'Preferred currency for auto-conversion payouts';



COMMENT ON COLUMN "public"."merchants"."subscription_plan" IS 'Monthly ($19) or yearly ($199) subscription plan';



COMMENT ON COLUMN "public"."merchants"."referred_by_rep" IS 'Rep who referred this merchant for commission tracking';



COMMENT ON COLUMN "public"."merchants"."referred_by_partner" IS 'Partner who referred this merchant for $50 bonus';



COMMENT ON COLUMN "public"."merchants"."wallet_generation_method" IS 'How wallets were created: manual, generated, or trust_wallet';



COMMENT ON COLUMN "public"."merchants"."supported_currencies" IS 'Array of currency codes this merchant accepts';



CREATE TABLE IF NOT EXISTS "public"."monthly_bonus_log" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "rep_id" "uuid",
    "month" "date" NOT NULL,
    "sales_count" integer,
    "rank" integer,
    "bonus_amount" numeric(18,2),
    "paid" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tie_count" integer DEFAULT 1,
    "original_bonus" numeric(18,2),
    "split_bonus" numeric(18,2)
);


ALTER TABLE "public"."monthly_bonus_log" OWNER TO "postgres";


COMMENT ON COLUMN "public"."monthly_bonus_log"."tie_count" IS 'Number of reps tied at this rank for bonus splitting';



COMMENT ON COLUMN "public"."monthly_bonus_log"."original_bonus" IS 'Original bonus amount before tie splitting';



COMMENT ON COLUMN "public"."monthly_bonus_log"."split_bonus" IS 'Actual bonus amount after tie splitting';



CREATE TABLE IF NOT EXISTS "public"."nowpayments_cache" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "cache_key" character varying(255) NOT NULL,
    "cache_data" "jsonb" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."nowpayments_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partner_referrals" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "partner_id" "uuid" NOT NULL,
    "merchant_id" "uuid" NOT NULL,
    "validated" boolean DEFAULT false,
    "bonus_paid" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "validated_at" timestamp with time zone
);


ALTER TABLE "public"."partner_referrals" OWNER TO "postgres";


COMMENT ON TABLE "public"."partner_referrals" IS 'Tracks partner referrals similar to rep_sales, with $50 bonus per validated referral';



CREATE TABLE IF NOT EXISTS "public"."partners" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "full_name" "text" NOT NULL,
    "total_referrals" integer DEFAULT 0,
    "total_bonus" numeric(18,2) DEFAULT 0,
    "w9_submitted" boolean DEFAULT false,
    "pending" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "preferred_currency" "text" DEFAULT 'USD'::"text",
    "referral_code" "text",
    "internal_notes" "text"
);


ALTER TABLE "public"."partners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_links" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "merchant_id" "uuid" NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text",
    "amount" numeric(18,8) NOT NULL,
    "currency" character varying(20) DEFAULT 'USD'::character varying NOT NULL,
    "accepted_cryptos" "jsonb" DEFAULT '["BTC", "ETH", "LTC"]'::"jsonb",
    "link_id" character varying(50) NOT NULL,
    "qr_code_data" "text",
    "status" character varying(20) DEFAULT 'active'::character varying,
    "expires_at" timestamp with time zone,
    "max_uses" integer,
    "current_uses" integer DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "usage_count" integer DEFAULT 0,
    "last_payment_at" timestamp with time zone,
    "auto_convert_enabled" boolean DEFAULT false,
    "preferred_payout_currency" character varying(20),
    "fee_percentage" numeric(5,3) DEFAULT 0.005
);


ALTER TABLE "public"."payment_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'merchant'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['merchant'::"text", 'rep'::"text", 'partner'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rep_sales" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "rep_id" "uuid",
    "merchant_id" "uuid",
    "validated" boolean DEFAULT false,
    "date" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rep_sales" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reps" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "full_name" "text" NOT NULL,
    "total_sales" integer DEFAULT 0,
    "tier" integer DEFAULT 1,
    "total_commission" numeric(18,2) DEFAULT 0,
    "w9_submitted" boolean DEFAULT false,
    "pending" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "preferred_currency" "text" DEFAULT 'USD'::"text",
    "referral_code" "text",
    "internal_notes" "text",
    "last_tier_update" timestamp with time zone DEFAULT "now"(),
    "previous_month_sales" integer DEFAULT 0,
    CONSTRAINT "check_tier" CHECK ((("tier" >= 1) AND ("tier" <= 3)))
);


ALTER TABLE "public"."reps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "merchant_id" "uuid" NOT NULL,
    "subscription_type" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "stripe_subscription_id" "text",
    "stripe_invoice_id" "text",
    "period_start" timestamp with time zone NOT NULL,
    "period_end" timestamp with time zone NOT NULL,
    "status" "text" DEFAULT 'paid'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "subscription_history_status_check" CHECK (("status" = ANY (ARRAY['paid'::"text", 'failed'::"text", 'refunded'::"text"]))),
    CONSTRAINT "subscription_history_subscription_type_check" CHECK (("subscription_type" = ANY (ARRAY['monthly'::"text", 'yearly'::"text"])))
);


ALTER TABLE "public"."subscription_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."subscription_history" IS 'Tracks monthly ($19) and yearly ($199) subscription payments';



CREATE TABLE IF NOT EXISTS "public"."support_messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "ticket_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"(),
    "role" "text",
    "user_id" "uuid",
    "email" "text",
    "subject" "text",
    "message" "text" NOT NULL,
    "resolved" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."support_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."supported_currencies" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "code" character varying(20) NOT NULL,
    "name" character varying(100) NOT NULL,
    "symbol" character varying(20),
    "enabled" boolean DEFAULT true,
    "min_amount" numeric(18,8) DEFAULT 0.00000001,
    "max_amount" numeric(18,8),
    "decimals" integer DEFAULT 8,
    "icon_url" character varying(500),
    "nowpayments_code" character varying(20),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "network" character varying(50),
    "contract_address" character varying(100),
    "is_token" boolean DEFAULT false,
    "parent_currency" character varying(20),
    "trust_wallet_compatible" boolean DEFAULT true,
    "address_format" character varying(50),
    "derivation_path" character varying(100)
);


ALTER TABLE "public"."supported_currencies" OWNER TO "postgres";


COMMENT ON TABLE "public"."supported_currencies" IS 'Column sizes updated for Phase 5 NOWPayments integration - supports longer currency codes';



COMMENT ON COLUMN "public"."supported_currencies"."network" IS 'Blockchain network (ethereum, bitcoin, tron, polygon, bsc, solana)';



COMMENT ON COLUMN "public"."supported_currencies"."contract_address" IS 'Token contract address for ERC-20, TRC-20, BEP-20 tokens';



COMMENT ON COLUMN "public"."supported_currencies"."is_token" IS 'True if this is a token (USDT, USDC), false for native currencies (BTC, ETH)';



COMMENT ON COLUMN "public"."supported_currencies"."parent_currency" IS 'Parent currency for tokens (ETH for ERC-20, TRX for TRC-20)';



COMMENT ON COLUMN "public"."supported_currencies"."trust_wallet_compatible" IS 'Whether this currency is supported by Trust Wallet';



COMMENT ON COLUMN "public"."supported_currencies"."address_format" IS 'Address format validation pattern';



COMMENT ON COLUMN "public"."supported_currencies"."derivation_path" IS 'HD wallet derivation path for address generation';



CREATE TABLE IF NOT EXISTS "public"."tier_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "rep_id" "uuid" NOT NULL,
    "month" "date" NOT NULL,
    "previous_month_sales" integer NOT NULL,
    "old_tier" integer,
    "new_tier" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "tier_history_new_tier_check" CHECK (("new_tier" = ANY (ARRAY[1, 2, 3])))
);


ALTER TABLE "public"."tier_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."tier_history" IS 'Tracks rep tier changes based on previous month sales for commission calculation';



CREATE TABLE IF NOT EXISTS "public"."upgrade_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "merchant_id" "uuid",
    "amount_paid" numeric(18,2),
    "stripe_id" "text",
    "timestamp" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."upgrade_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wallet_generation_log" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "merchant_id" "uuid" NOT NULL,
    "generation_method" character varying(20) NOT NULL,
    "currencies_generated" "text"[] NOT NULL,
    "client_ip" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wallet_generation_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhook_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "source" character varying(50) NOT NULL,
    "event_type" character varying(100) NOT NULL,
    "request_headers" "jsonb",
    "request_payload" "jsonb" NOT NULL,
    "request_signature" character varying(500),
    "processed" boolean DEFAULT false,
    "processing_error" "text",
    "merchant_id" "uuid",
    "payment_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "processed_at" timestamp with time zone,
    "provider" character varying(50) DEFAULT 'nowpayments'::character varying,
    "status" character varying(50),
    "raw_data" "jsonb" DEFAULT '{}'::"jsonb",
    "error_message" "text"
);


ALTER TABLE "public"."webhook_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."webhook_logs" IS 'Updated for Phase 5 NOWPayments webhook handling';



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automation_logs"
    ADD CONSTRAINT "automation_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_logs"
    ADD CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fiat_payouts"
    ADD CONSTRAINT "fiat_payouts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."merchant_payments"
    ADD CONSTRAINT "merchant_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."merchants"
    ADD CONSTRAINT "merchants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."merchants"
    ADD CONSTRAINT "merchants_user_id_unique" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."monthly_bonus_log"
    ADD CONSTRAINT "monthly_bonus_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nowpayments_cache"
    ADD CONSTRAINT "nowpayments_cache_cache_key_key" UNIQUE ("cache_key");



ALTER TABLE ONLY "public"."nowpayments_cache"
    ADD CONSTRAINT "nowpayments_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partner_referrals"
    ADD CONSTRAINT "partner_referrals_partner_id_merchant_id_key" UNIQUE ("partner_id", "merchant_id");



ALTER TABLE ONLY "public"."partner_referrals"
    ADD CONSTRAINT "partner_referrals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partners"
    ADD CONSTRAINT "partners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partners"
    ADD CONSTRAINT "partners_referral_code_key" UNIQUE ("referral_code");



ALTER TABLE ONLY "public"."payment_links"
    ADD CONSTRAINT "payment_links_link_id_key" UNIQUE ("link_id");



ALTER TABLE ONLY "public"."payment_links"
    ADD CONSTRAINT "payment_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rep_sales"
    ADD CONSTRAINT "rep_sales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reps"
    ADD CONSTRAINT "reps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reps"
    ADD CONSTRAINT "reps_referral_code_key" UNIQUE ("referral_code");



ALTER TABLE ONLY "public"."subscription_history"
    ADD CONSTRAINT "subscription_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_messages"
    ADD CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."supported_currencies"
    ADD CONSTRAINT "supported_currencies_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."supported_currencies"
    ADD CONSTRAINT "supported_currencies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tier_history"
    ADD CONSTRAINT "tier_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."upgrade_history"
    ADD CONSTRAINT "upgrade_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wallet_generation_log"
    ADD CONSTRAINT "wallet_generation_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhook_logs"
    ADD CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_audit_logs_user_id" ON "public"."audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_fiat_payouts_user_id" ON "public"."fiat_payouts" USING "btree" ("user_id");



CREATE INDEX "idx_merchant_payments_created_at" ON "public"."merchant_payments" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_merchant_payments_merchant_id" ON "public"."merchant_payments" USING "btree" ("merchant_id");



CREATE INDEX "idx_merchant_payments_nowpayments_invoice_id" ON "public"."merchant_payments" USING "btree" ("nowpayments_invoice_id");



CREATE INDEX "idx_merchant_payments_order_id" ON "public"."merchant_payments" USING "btree" ("order_id");



CREATE INDEX "idx_merchant_payments_payment_link_id" ON "public"."merchant_payments" USING "btree" ("payment_link_id");



CREATE INDEX "idx_merchant_payments_status" ON "public"."merchant_payments" USING "btree" ("status");



CREATE INDEX "idx_merchants_referred_by_partner" ON "public"."merchants" USING "btree" ("referred_by_partner");



CREATE INDEX "idx_merchants_referred_by_rep" ON "public"."merchants" USING "btree" ("referred_by_rep");



CREATE INDEX "idx_merchants_subscription_status" ON "public"."merchants" USING "btree" ("subscription_status");



CREATE INDEX "idx_merchants_user_id" ON "public"."merchants" USING "btree" ("user_id");



CREATE INDEX "idx_merchants_user_id_unique" ON "public"."merchants" USING "btree" ("user_id");



CREATE INDEX "idx_monthly_bonus_log_rep_id" ON "public"."monthly_bonus_log" USING "btree" ("rep_id");



CREATE INDEX "idx_nowpayments_cache_key_expires" ON "public"."nowpayments_cache" USING "btree" ("cache_key", "expires_at");



CREATE INDEX "idx_partner_referrals_merchant_id" ON "public"."partner_referrals" USING "btree" ("merchant_id");



CREATE INDEX "idx_partner_referrals_partner_id" ON "public"."partner_referrals" USING "btree" ("partner_id");



CREATE INDEX "idx_partner_referrals_validated" ON "public"."partner_referrals" USING "btree" ("validated");



CREATE INDEX "idx_partners_user_id" ON "public"."partners" USING "btree" ("user_id");



CREATE INDEX "idx_payment_links_link_id" ON "public"."payment_links" USING "btree" ("link_id");



CREATE INDEX "idx_payment_links_merchant_id" ON "public"."payment_links" USING "btree" ("merchant_id");



CREATE INDEX "idx_payment_links_merchant_status" ON "public"."payment_links" USING "btree" ("merchant_id", "status");



CREATE INDEX "idx_payment_links_status" ON "public"."payment_links" USING "btree" ("status");



CREATE INDEX "idx_payment_links_status_expires" ON "public"."payment_links" USING "btree" ("status", "expires_at") WHERE ("expires_at" IS NOT NULL);



CREATE INDEX "idx_payment_links_usage" ON "public"."payment_links" USING "btree" ("usage_count", "max_uses") WHERE ("max_uses" IS NOT NULL);



CREATE INDEX "idx_rep_sales_merchant_id" ON "public"."rep_sales" USING "btree" ("merchant_id");



CREATE INDEX "idx_rep_sales_rep_id" ON "public"."rep_sales" USING "btree" ("rep_id");



CREATE INDEX "idx_reps_user_id" ON "public"."reps" USING "btree" ("user_id");



CREATE INDEX "idx_subscription_history_merchant_id" ON "public"."subscription_history" USING "btree" ("merchant_id");



CREATE INDEX "idx_support_messages_user_id" ON "public"."support_messages" USING "btree" ("user_id");



CREATE INDEX "idx_tier_history_month" ON "public"."tier_history" USING "btree" ("month");



CREATE INDEX "idx_tier_history_rep_id" ON "public"."tier_history" USING "btree" ("rep_id");



CREATE INDEX "idx_upgrade_history_merchant_id" ON "public"."upgrade_history" USING "btree" ("merchant_id");



CREATE INDEX "idx_wallet_generation_log_merchant_id" ON "public"."wallet_generation_log" USING "btree" ("merchant_id");



CREATE INDEX "idx_webhook_logs_created_at" ON "public"."webhook_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_webhook_logs_payment_id" ON "public"."webhook_logs" USING "btree" ("payment_id");



CREATE INDEX "idx_webhook_logs_processed" ON "public"."webhook_logs" USING "btree" ("processed");



CREATE INDEX "idx_webhook_logs_provider" ON "public"."webhook_logs" USING "btree" ("provider");



CREATE INDEX "idx_webhook_logs_source" ON "public"."webhook_logs" USING "btree" ("source");



CREATE OR REPLACE TRIGGER "after_rep_sales_update" AFTER UPDATE ON "public"."rep_sales" FOR EACH ROW WHEN ((("old"."validated" IS DISTINCT FROM "new"."validated") AND ("new"."validated" = true))) EXECUTE FUNCTION "public"."handle_monthly_bonus"();



CREATE OR REPLACE TRIGGER "merchant_partner_referral_trigger" AFTER UPDATE ON "public"."merchants" FOR EACH ROW EXECUTE FUNCTION "public"."handle_partner_referral"();



CREATE OR REPLACE TRIGGER "trigger_update_payment_link_status" BEFORE UPDATE ON "public"."payment_links" FOR EACH ROW EXECUTE FUNCTION "public"."update_payment_link_status"();



CREATE OR REPLACE TRIGGER "trigger_update_payment_link_usage" AFTER INSERT OR UPDATE ON "public"."merchant_payments" FOR EACH ROW EXECUTE FUNCTION "public"."update_payment_link_usage"();



CREATE OR REPLACE TRIGGER "update_merchant_payments_updated_at" BEFORE UPDATE ON "public"."merchant_payments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_merchants_updated_at" BEFORE UPDATE ON "public"."merchants" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_nowpayments_cache_updated_at" BEFORE UPDATE ON "public"."nowpayments_cache" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_payment_links_updated_at" BEFORE UPDATE ON "public"."payment_links" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_supported_currencies_updated_at" BEFORE UPDATE ON "public"."supported_currencies" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."fiat_payouts"
    ADD CONSTRAINT "fiat_payouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."merchant_payments"
    ADD CONSTRAINT "merchant_payments_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."merchant_payments"
    ADD CONSTRAINT "merchant_payments_payment_link_id_fkey" FOREIGN KEY ("payment_link_id") REFERENCES "public"."payment_links"("id");



ALTER TABLE ONLY "public"."merchants"
    ADD CONSTRAINT "merchants_referred_by_partner_fkey" FOREIGN KEY ("referred_by_partner") REFERENCES "public"."partners"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."merchants"
    ADD CONSTRAINT "merchants_referred_by_rep_fkey" FOREIGN KEY ("referred_by_rep") REFERENCES "public"."reps"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."merchants"
    ADD CONSTRAINT "merchants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."monthly_bonus_log"
    ADD CONSTRAINT "monthly_bonus_log_rep_id_fkey" FOREIGN KEY ("rep_id") REFERENCES "public"."reps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."partner_referrals"
    ADD CONSTRAINT "partner_referrals_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."partner_referrals"
    ADD CONSTRAINT "partner_referrals_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."partners"
    ADD CONSTRAINT "partners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_links"
    ADD CONSTRAINT "payment_links_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rep_sales"
    ADD CONSTRAINT "rep_sales_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rep_sales"
    ADD CONSTRAINT "rep_sales_rep_id_fkey" FOREIGN KEY ("rep_id") REFERENCES "public"."reps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reps"
    ADD CONSTRAINT "reps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscription_history"
    ADD CONSTRAINT "subscription_history_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_messages"
    ADD CONSTRAINT "support_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tier_history"
    ADD CONSTRAINT "tier_history_rep_id_fkey" FOREIGN KEY ("rep_id") REFERENCES "public"."reps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."upgrade_history"
    ADD CONSTRAINT "upgrade_history_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wallet_generation_log"
    ADD CONSTRAINT "wallet_generation_log_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."webhook_logs"
    ADD CONSTRAINT "webhook_logs_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id");



ALTER TABLE ONLY "public"."webhook_logs"
    ADD CONSTRAINT "webhook_logs_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."merchant_payments"("id");



CREATE POLICY "Admin can insert any merchant record" ON "public"."merchants" FOR INSERT WITH CHECK (("auth"."email"() = 'admin@cryptrac.com'::"text"));



CREATE POLICY "Admin can insert any payment link" ON "public"."payment_links" FOR INSERT WITH CHECK (("auth"."email"() = 'admin@cryptrac.com'::"text"));



CREATE POLICY "Admins bypass all partner_referrals" ON "public"."partner_referrals" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins bypass all subscription_history" ON "public"."subscription_history" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins bypass all tier_history" ON "public"."tier_history" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can update partner referrals" ON "public"."partner_referrals" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can update subscription history" ON "public"."subscription_history" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all partner referrals" ON "public"."partner_referrals" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all subscription history" ON "public"."subscription_history" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all tier history" ON "public"."tier_history" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Allow public read access to active payment links" ON "public"."payment_links" FOR SELECT USING ((("status")::"text" = 'active'::"text"));



CREATE POLICY "Allow public read access to merchant business names" ON "public"."merchants" FOR SELECT USING (true);



CREATE POLICY "Allow webhook logging" ON "public"."webhook_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Audit logs view admin" ON "public"."audit_logs" FOR SELECT USING (("auth"."email"() = 'admin@cryptrac.com'::"text"));



CREATE POLICY "Fiat payouts view" ON "public"."fiat_payouts" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("auth"."email"() = 'admin@cryptrac.com'::"text")));



CREATE POLICY "Merchant payments view own" ON "public"."merchant_payments" FOR SELECT USING ((("merchant_id" = ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."user_id" = "auth"."uid"()))) OR ("auth"."email"() = 'admin@cryptrac.com'::"text")));



CREATE POLICY "Merchants can create own records" ON "public"."merchants" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") OR ("auth"."email"() = 'admin@cryptrac.com'::"text")));



COMMENT ON POLICY "Merchants can create own records" ON "public"."merchants" IS 'Allows users to create merchant records for themselves';



CREATE POLICY "Merchants can create payment links" ON "public"."payment_links" FOR INSERT WITH CHECK ((("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."user_id" = "auth"."uid"()))) OR ("auth"."email"() = 'admin@cryptrac.com'::"text")));



COMMENT ON POLICY "Merchants can create payment links" ON "public"."payment_links" IS 'Allows merchants to create payment links for their own merchant account';



CREATE POLICY "Merchants can insert own" ON "public"."merchants" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") OR ("auth"."email"() = 'admin@cryptrac.com'::"text")));



CREATE POLICY "Merchants can insert their own payment links" ON "public"."payment_links" FOR INSERT WITH CHECK (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."user_id" = "auth"."uid"()))));



CREATE POLICY "Merchants can manage their own payment links" ON "public"."payment_links" USING (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."user_id" = "auth"."uid"()))));



CREATE POLICY "Merchants can manage their own payments" ON "public"."merchant_payments" USING (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."user_id" = "auth"."uid"()))));



CREATE POLICY "Merchants can view own subscription history" ON "public"."subscription_history" FOR SELECT USING (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."user_id" = "auth"."uid"()))));



CREATE POLICY "Merchants can view their payment data" ON "public"."merchant_payments" FOR SELECT USING ((("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."user_id" = "auth"."uid"()))) OR ("auth"."email"() = 'admin@cryptrac.com'::"text")));



CREATE POLICY "Merchants update own" ON "public"."merchants" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR ("auth"."email"() = 'admin@cryptrac.com'::"text")));



CREATE POLICY "Merchants view own" ON "public"."merchants" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("auth"."email"() = 'admin@cryptrac.com'::"text")));



CREATE POLICY "Monthly bonus log view" ON "public"."monthly_bonus_log" FOR SELECT USING ((("rep_id" = ( SELECT "reps"."id"
   FROM "public"."reps"
  WHERE ("reps"."user_id" = "auth"."uid"()))) OR ("auth"."email"() = 'admin@cryptrac.com'::"text")));



CREATE POLICY "Only admins can view webhook logs" ON "public"."webhook_logs" FOR SELECT USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."role" = 'admin'::"text"))));



CREATE POLICY "Partners can insert own referrals" ON "public"."partner_referrals" FOR INSERT WITH CHECK (("partner_id" IN ( SELECT "partners"."id"
   FROM "public"."partners"
  WHERE ("partners"."user_id" = "auth"."uid"()))));



CREATE POLICY "Partners can update own notes" ON "public"."partners" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Partners can view own referrals" ON "public"."partner_referrals" FOR SELECT USING (("partner_id" IN ( SELECT "partners"."id"
   FROM "public"."partners"
  WHERE ("partners"."user_id" = "auth"."uid"()))));



CREATE POLICY "Partners update own" ON "public"."partners" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR ("auth"."email"() = 'admin@cryptrac.com'::"text")));



CREATE POLICY "Partners view own" ON "public"."partners" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("auth"."email"() = 'admin@cryptrac.com'::"text")));



CREATE POLICY "Profiles update own" ON "public"."profiles" FOR UPDATE USING ((("auth"."uid"() = "id") OR ("auth"."email"() = 'admin@cryptrac.com'::"text")));



CREATE POLICY "Profiles view own" ON "public"."profiles" FOR SELECT USING ((("auth"."uid"() = "id") OR ("auth"."email"() = 'admin@cryptrac.com'::"text")));



CREATE POLICY "Rep sales view own" ON "public"."rep_sales" FOR SELECT USING ((("rep_id" = ( SELECT "reps"."id"
   FROM "public"."reps"
  WHERE ("reps"."user_id" = "auth"."uid"()))) OR ("auth"."email"() = 'admin@cryptrac.com'::"text")));



CREATE POLICY "Reps can update own notes" ON "public"."reps" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Reps can view own tier history" ON "public"."tier_history" FOR SELECT USING (("rep_id" IN ( SELECT "reps"."id"
   FROM "public"."reps"
  WHERE ("reps"."user_id" = "auth"."uid"()))));



CREATE POLICY "Reps update own" ON "public"."reps" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR ("auth"."email"() = 'admin@cryptrac.com'::"text")));



CREATE POLICY "Reps view own" ON "public"."reps" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("auth"."email"() = 'admin@cryptrac.com'::"text")));



CREATE POLICY "Support messages view" ON "public"."support_messages" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("auth"."email"() = 'admin@cryptrac.com'::"text")));



CREATE POLICY "System can insert payment data" ON "public"."merchant_payments" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert subscription history" ON "public"."subscription_history" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert tier history" ON "public"."tier_history" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can update payment data" ON "public"."merchant_payments" FOR UPDATE USING (true);



CREATE POLICY "Users can insert their own merchant records" ON "public"."merchants" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own merchant records" ON "public"."merchants" USING ((("auth"."uid"() = "user_id") OR ("auth"."email"() = 'admin@cryptrac.com'::"text")));



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."automation_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fiat_payouts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."merchant_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."merchants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."monthly_bonus_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."partner_referrals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."partners" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rep_sales" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tier_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."upgrade_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."webhook_logs" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_monthly_leaderboard"("target_month" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_monthly_leaderboard"("target_month" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_monthly_leaderboard"("target_month" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_monthly_leaderboard_secure"("target_month" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_monthly_leaderboard_secure"("target_month" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_monthly_leaderboard_secure"("target_month" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_payment_link_status"("p_current_status" "text", "p_usage_count" integer, "p_max_uses" integer, "p_expires_at" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_payment_link_status"("p_current_status" "text", "p_usage_count" integer, "p_max_uses" integer, "p_expires_at" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_payment_link_status"("p_current_status" "text", "p_usage_count" integer, "p_max_uses" integer, "p_expires_at" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_rep_tier"("rep_id" "uuid", "target_month" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_rep_tier"("rep_id" "uuid", "target_month" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_rep_tier"("rep_id" "uuid", "target_month" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_subscription_proration"("merchant_id" "uuid", "subscription_amount" numeric, "days_used" integer, "total_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_subscription_proration"("merchant_id" "uuid", "subscription_amount" numeric, "days_used" integer, "total_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_subscription_proration"("merchant_id" "uuid", "subscription_amount" numeric, "days_used" integer, "total_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."clean_expired_cache"() TO "anon";
GRANT ALL ON FUNCTION "public"."clean_expired_cache"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."clean_expired_cache"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_merchant_for_user"("p_user_id" "uuid", "p_business_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_merchant_for_user"("p_user_id" "uuid", "p_business_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_merchant_for_user"("p_user_id" "uuid", "p_business_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_merchant_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_merchant_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_merchant_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_merchant_supported_currencies"("merchant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_merchant_supported_currencies"("merchant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_merchant_supported_currencies"("merchant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_payment_link_statistics"("p_merchant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_payment_link_statistics"("p_merchant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_payment_link_statistics"("p_merchant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_monthly_bonus"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_monthly_bonus"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_monthly_bonus"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_partner_referral"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_partner_referral"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_partner_referral"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_expired_payment_links"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_expired_payment_links"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_expired_payment_links"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_payment_link_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_payment_link_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_payment_link_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_payment_link_usage"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_payment_link_usage"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_payment_link_usage"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."automation_logs" TO "anon";
GRANT ALL ON TABLE "public"."automation_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."automation_logs" TO "service_role";



GRANT ALL ON TABLE "public"."email_logs" TO "anon";
GRANT ALL ON TABLE "public"."email_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."email_logs" TO "service_role";



GRANT ALL ON TABLE "public"."fiat_payouts" TO "anon";
GRANT ALL ON TABLE "public"."fiat_payouts" TO "authenticated";
GRANT ALL ON TABLE "public"."fiat_payouts" TO "service_role";



GRANT ALL ON TABLE "public"."merchant_payments" TO "anon";
GRANT ALL ON TABLE "public"."merchant_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."merchant_payments" TO "service_role";



GRANT ALL ON TABLE "public"."merchants" TO "anon";
GRANT ALL ON TABLE "public"."merchants" TO "authenticated";
GRANT ALL ON TABLE "public"."merchants" TO "service_role";



GRANT ALL ON TABLE "public"."monthly_bonus_log" TO "anon";
GRANT ALL ON TABLE "public"."monthly_bonus_log" TO "authenticated";
GRANT ALL ON TABLE "public"."monthly_bonus_log" TO "service_role";



GRANT ALL ON TABLE "public"."nowpayments_cache" TO "anon";
GRANT ALL ON TABLE "public"."nowpayments_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."nowpayments_cache" TO "service_role";



GRANT ALL ON TABLE "public"."partner_referrals" TO "anon";
GRANT ALL ON TABLE "public"."partner_referrals" TO "authenticated";
GRANT ALL ON TABLE "public"."partner_referrals" TO "service_role";



GRANT ALL ON TABLE "public"."partners" TO "anon";
GRANT ALL ON TABLE "public"."partners" TO "authenticated";
GRANT ALL ON TABLE "public"."partners" TO "service_role";



GRANT ALL ON TABLE "public"."payment_links" TO "anon";
GRANT ALL ON TABLE "public"."payment_links" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_links" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."rep_sales" TO "anon";
GRANT ALL ON TABLE "public"."rep_sales" TO "authenticated";
GRANT ALL ON TABLE "public"."rep_sales" TO "service_role";



GRANT ALL ON TABLE "public"."reps" TO "anon";
GRANT ALL ON TABLE "public"."reps" TO "authenticated";
GRANT ALL ON TABLE "public"."reps" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_history" TO "anon";
GRANT ALL ON TABLE "public"."subscription_history" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_history" TO "service_role";



GRANT ALL ON TABLE "public"."support_messages" TO "anon";
GRANT ALL ON TABLE "public"."support_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."support_messages" TO "service_role";



GRANT ALL ON TABLE "public"."supported_currencies" TO "anon";
GRANT ALL ON TABLE "public"."supported_currencies" TO "authenticated";
GRANT ALL ON TABLE "public"."supported_currencies" TO "service_role";



GRANT ALL ON TABLE "public"."tier_history" TO "anon";
GRANT ALL ON TABLE "public"."tier_history" TO "authenticated";
GRANT ALL ON TABLE "public"."tier_history" TO "service_role";



GRANT ALL ON TABLE "public"."upgrade_history" TO "anon";
GRANT ALL ON TABLE "public"."upgrade_history" TO "authenticated";
GRANT ALL ON TABLE "public"."upgrade_history" TO "service_role";



GRANT ALL ON TABLE "public"."wallet_generation_log" TO "anon";
GRANT ALL ON TABLE "public"."wallet_generation_log" TO "authenticated";
GRANT ALL ON TABLE "public"."wallet_generation_log" TO "service_role";



GRANT ALL ON TABLE "public"."webhook_logs" TO "anon";
GRANT ALL ON TABLE "public"."webhook_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_logs" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






RESET ALL;



-- Create buckets
select storage.create_bucket('w9-uploads', public := false);
select storage.create_bucket('promo-kits', public := true);

-- Enable Row Level Security on storage.objects (required for policies)
alter table storage.objects enable row level security;

-- RLS Policy: Allow public SELECT on 'promo-kits' bucket
create policy "Public read for promo kits"
on storage.objects
for select
to public
using (
  bucket_id = 'promo-kits'
);

-- RLS Policy: Allow public INSERT to 'w9-uploads' if user is the owner
create policy "User can upload to own W9"
on storage.objects
for insert
to public
with check (
  bucket_id = 'w9-uploads' AND auth.uid() = owner
);