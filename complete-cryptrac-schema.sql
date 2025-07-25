

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



CREATE OR REPLACE FUNCTION "public"."calculate_proration"("merchant_id" "uuid", "full_fee" numeric) RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    usage INTEGER;
    days_used INTEGER;
    total_days INTEGER := 14; -- 14-day refund window
BEGIN
    -- Get usage count and calculate days since setup
    SELECT 
        COALESCE(usage_count, 0),
        GREATEST(0, EXTRACT(days FROM NOW() - created_at)::INTEGER)
    INTO usage, days_used
    FROM merchants 
    WHERE id = merchant_id;
    
    -- Full refund if no usage and within 14 days
    IF usage = 0 AND days_used <= total_days THEN
        RETURN full_fee;
    END IF;
    
    -- Prorated refund based on usage and time
    IF days_used <= total_days THEN
        RETURN full_fee * (1 - (usage::NUMERIC / 100.0)) * (1 - (days_used::NUMERIC / total_days));
    END IF;
    
    -- No refund after 14 days
    RETURN 0;
END;
$$;


ALTER FUNCTION "public"."calculate_proration"("merchant_id" "uuid", "full_fee" numeric) OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."handle_monthly_bonus"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
BEGIN
  -- Per Bible: On validation, increment sales, check for $100 every 3, add tiered commission on setup fee
  -- (Full leaderboard ties in monthly cron per Section 11)
  -- Assume setup_fee = 99, tier from reps table
  DECLARE
    current_sales INT;
    tier_percentage INT;
    commission NUMERIC;
  BEGIN
    current_sales := (SELECT total_sales + 1 FROM reps WHERE id = NEW.rep_id FOR UPDATE);
    UPDATE reps SET total_sales = current_sales WHERE id = NEW.rep_id;
    
    -- $100 every 3 validated sales
    IF current_sales % 3 = 0 THEN
      UPDATE reps SET total_commission = total_commission + 100 WHERE id = NEW.rep_id;
      INSERT INTO monthly_bonus_log (rep_id, month, sales_count, bonus_amount, paid) 
      VALUES (NEW.rep_id, date_trunc('month', NOW()), current_sales, 100, false);
    END IF;
    
    -- Tiered commission on $99 setup (per Bible Section 7.3.1)
    SELECT CASE tier WHEN 1 THEN 50 WHEN 2 THEN 75 WHEN 3 THEN 100 END INTO tier_percentage FROM reps WHERE id = NEW.rep_id;
    commission := 99 * (tier_percentage / 100.0);
    UPDATE reps SET total_commission = total_commission + commission WHERE id = NEW.rep_id;
    
    RETURN NEW;
  END;
END;
$_$;


ALTER FUNCTION "public"."handle_monthly_bonus"() OWNER TO "postgres";


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
    "updated_at" timestamp with time zone DEFAULT "now"()
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
    "payment_config" "jsonb" DEFAULT '{"auto_forward": true, "fee_percentage": 2.9}'::"jsonb",
    "setup_paid" boolean DEFAULT false,
    "setup_fee_amount" numeric(10,2) DEFAULT 99.00,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "check_trial_end" CHECK (("trial_end" > "created_at"))
);


ALTER TABLE "public"."merchants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."monthly_bonus_log" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "rep_id" "uuid",
    "month" "date" NOT NULL,
    "sales_count" integer,
    "rank" integer,
    "bonus_amount" numeric(18,2),
    "paid" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."monthly_bonus_log" OWNER TO "postgres";


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
    "referral_code" "text"
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
    "last_payment_at" timestamp with time zone
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
    CONSTRAINT "check_tier" CHECK ((("tier" >= 1) AND ("tier" <= 3)))
);


ALTER TABLE "public"."reps" OWNER TO "postgres";


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
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."supported_currencies" OWNER TO "postgres";


COMMENT ON TABLE "public"."supported_currencies" IS 'Column sizes updated for Phase 5 NOWPayments integration - supports longer currency codes';



CREATE TABLE IF NOT EXISTS "public"."upgrade_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "merchant_id" "uuid",
    "amount_paid" numeric(18,2),
    "stripe_id" "text",
    "timestamp" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."upgrade_history" OWNER TO "postgres";


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



ALTER TABLE ONLY "public"."support_messages"
    ADD CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."supported_currencies"
    ADD CONSTRAINT "supported_currencies_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."supported_currencies"
    ADD CONSTRAINT "supported_currencies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."upgrade_history"
    ADD CONSTRAINT "upgrade_history_pkey" PRIMARY KEY ("id");



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



CREATE INDEX "idx_merchants_user_id" ON "public"."merchants" USING "btree" ("user_id");



CREATE INDEX "idx_merchants_user_id_unique" ON "public"."merchants" USING "btree" ("user_id");



CREATE INDEX "idx_monthly_bonus_log_rep_id" ON "public"."monthly_bonus_log" USING "btree" ("rep_id");



CREATE INDEX "idx_partners_user_id" ON "public"."partners" USING "btree" ("user_id");



CREATE INDEX "idx_payment_links_link_id" ON "public"."payment_links" USING "btree" ("link_id");



CREATE INDEX "idx_payment_links_merchant_id" ON "public"."payment_links" USING "btree" ("merchant_id");



CREATE INDEX "idx_payment_links_status" ON "public"."payment_links" USING "btree" ("status");



CREATE INDEX "idx_rep_sales_merchant_id" ON "public"."rep_sales" USING "btree" ("merchant_id");



CREATE INDEX "idx_rep_sales_rep_id" ON "public"."rep_sales" USING "btree" ("rep_id");



CREATE INDEX "idx_reps_user_id" ON "public"."reps" USING "btree" ("user_id");



CREATE INDEX "idx_support_messages_user_id" ON "public"."support_messages" USING "btree" ("user_id");



CREATE INDEX "idx_upgrade_history_merchant_id" ON "public"."upgrade_history" USING "btree" ("merchant_id");



CREATE INDEX "idx_webhook_logs_created_at" ON "public"."webhook_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_webhook_logs_payment_id" ON "public"."webhook_logs" USING "btree" ("payment_id");



CREATE INDEX "idx_webhook_logs_processed" ON "public"."webhook_logs" USING "btree" ("processed");



CREATE INDEX "idx_webhook_logs_provider" ON "public"."webhook_logs" USING "btree" ("provider");



CREATE INDEX "idx_webhook_logs_source" ON "public"."webhook_logs" USING "btree" ("source");



CREATE OR REPLACE TRIGGER "after_rep_sales_update" AFTER UPDATE ON "public"."rep_sales" FOR EACH ROW WHEN ((("old"."validated" IS DISTINCT FROM "new"."validated") AND ("new"."validated" = true))) EXECUTE FUNCTION "public"."handle_monthly_bonus"();



CREATE OR REPLACE TRIGGER "trigger_update_payment_link_usage" AFTER INSERT OR UPDATE ON "public"."merchant_payments" FOR EACH ROW EXECUTE FUNCTION "public"."update_payment_link_usage"();



CREATE OR REPLACE TRIGGER "update_merchant_payments_updated_at" BEFORE UPDATE ON "public"."merchant_payments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_merchants_updated_at" BEFORE UPDATE ON "public"."merchants" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



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
    ADD CONSTRAINT "merchants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."monthly_bonus_log"
    ADD CONSTRAINT "monthly_bonus_log_rep_id_fkey" FOREIGN KEY ("rep_id") REFERENCES "public"."reps"("id") ON DELETE CASCADE;



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



ALTER TABLE ONLY "public"."support_messages"
    ADD CONSTRAINT "support_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."upgrade_history"
    ADD CONSTRAINT "upgrade_history_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."webhook_logs"
    ADD CONSTRAINT "webhook_logs_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id");



ALTER TABLE ONLY "public"."webhook_logs"
    ADD CONSTRAINT "webhook_logs_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."merchant_payments"("id");



CREATE POLICY "Admin can insert any merchant record" ON "public"."merchants" FOR INSERT WITH CHECK (("auth"."email"() = 'admin@cryptrac.com'::"text"));



CREATE POLICY "Admin can insert any payment link" ON "public"."payment_links" FOR INSERT WITH CHECK (("auth"."email"() = 'admin@cryptrac.com'::"text"));



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



CREATE POLICY "Partners update own" ON "public"."partners" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR ("auth"."email"() = 'admin@cryptrac.com'::"text")));



CREATE POLICY "Partners view own" ON "public"."partners" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("auth"."email"() = 'admin@cryptrac.com'::"text")));



CREATE POLICY "Profiles update own" ON "public"."profiles" FOR UPDATE USING ((("auth"."uid"() = "id") OR ("auth"."email"() = 'admin@cryptrac.com'::"text")));



CREATE POLICY "Profiles view own" ON "public"."profiles" FOR SELECT USING ((("auth"."uid"() = "id") OR ("auth"."email"() = 'admin@cryptrac.com'::"text")));



CREATE POLICY "Rep sales view own" ON "public"."rep_sales" FOR SELECT USING ((("rep_id" = ( SELECT "reps"."id"
   FROM "public"."reps"
  WHERE ("reps"."user_id" = "auth"."uid"()))) OR ("auth"."email"() = 'admin@cryptrac.com'::"text")));



CREATE POLICY "Reps update own" ON "public"."reps" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR ("auth"."email"() = 'admin@cryptrac.com'::"text")));



CREATE POLICY "Reps view own" ON "public"."reps" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("auth"."email"() = 'admin@cryptrac.com'::"text")));



CREATE POLICY "Support messages view" ON "public"."support_messages" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("auth"."email"() = 'admin@cryptrac.com'::"text")));



CREATE POLICY "System can insert payment data" ON "public"."merchant_payments" FOR INSERT WITH CHECK (true);



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


ALTER TABLE "public"."partners" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rep_sales" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."upgrade_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."webhook_logs" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_proration"("merchant_id" "uuid", "full_fee" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_proration"("merchant_id" "uuid", "full_fee" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_proration"("merchant_id" "uuid", "full_fee" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_merchant_for_user"("p_user_id" "uuid", "p_business_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_merchant_for_user"("p_user_id" "uuid", "p_business_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_merchant_for_user"("p_user_id" "uuid", "p_business_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_merchant_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_merchant_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_merchant_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_monthly_bonus"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_monthly_bonus"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_monthly_bonus"() TO "service_role";



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



GRANT ALL ON TABLE "public"."support_messages" TO "anon";
GRANT ALL ON TABLE "public"."support_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."support_messages" TO "service_role";



GRANT ALL ON TABLE "public"."supported_currencies" TO "anon";
GRANT ALL ON TABLE "public"."supported_currencies" TO "authenticated";
GRANT ALL ON TABLE "public"."supported_currencies" TO "service_role";



GRANT ALL ON TABLE "public"."upgrade_history" TO "anon";
GRANT ALL ON TABLE "public"."upgrade_history" TO "authenticated";
GRANT ALL ON TABLE "public"."upgrade_history" TO "service_role";



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
