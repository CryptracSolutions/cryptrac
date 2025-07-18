

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
  usage INT;
BEGIN
  SELECT usage_count INTO usage FROM merchants WHERE id = merchant_id;
  -- Proration logic: full refund if usage=0, else reduce by usage % (adjust per Bible Appendix A)
  IF usage = 0 THEN
    RETURN full_fee;
  ELSE
    RETURN full_fee * (1 - (usage / 100.0));
  END IF;
END;
$$;


ALTER FUNCTION "public"."calculate_proration"("merchant_id" "uuid", "full_fee" numeric) OWNER TO "postgres";


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
    "currency" "text",
    "pay_currency" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "tx_hash" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."merchant_payments" OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "public"."upgrade_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "merchant_id" "uuid",
    "amount_paid" numeric(18,2),
    "stripe_id" "text",
    "timestamp" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."upgrade_history" OWNER TO "postgres";


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



ALTER TABLE ONLY "public"."monthly_bonus_log"
    ADD CONSTRAINT "monthly_bonus_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partners"
    ADD CONSTRAINT "partners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partners"
    ADD CONSTRAINT "partners_referral_code_key" UNIQUE ("referral_code");



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



ALTER TABLE ONLY "public"."upgrade_history"
    ADD CONSTRAINT "upgrade_history_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_audit_logs_user_id" ON "public"."audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_fiat_payouts_user_id" ON "public"."fiat_payouts" USING "btree" ("user_id");



CREATE INDEX "idx_merchant_payments_merchant_id" ON "public"."merchant_payments" USING "btree" ("merchant_id");



CREATE INDEX "idx_merchants_user_id" ON "public"."merchants" USING "btree" ("user_id");



CREATE INDEX "idx_monthly_bonus_log_rep_id" ON "public"."monthly_bonus_log" USING "btree" ("rep_id");



CREATE INDEX "idx_partners_user_id" ON "public"."partners" USING "btree" ("user_id");



CREATE INDEX "idx_rep_sales_merchant_id" ON "public"."rep_sales" USING "btree" ("merchant_id");



CREATE INDEX "idx_rep_sales_rep_id" ON "public"."rep_sales" USING "btree" ("rep_id");



CREATE INDEX "idx_reps_user_id" ON "public"."reps" USING "btree" ("user_id");



CREATE INDEX "idx_support_messages_user_id" ON "public"."support_messages" USING "btree" ("user_id");



CREATE INDEX "idx_upgrade_history_merchant_id" ON "public"."upgrade_history" USING "btree" ("merchant_id");



CREATE OR REPLACE TRIGGER "after_rep_sales_update" AFTER UPDATE ON "public"."rep_sales" FOR EACH ROW WHEN ((("old"."validated" IS DISTINCT FROM "new"."validated") AND ("new"."validated" = true))) EXECUTE FUNCTION "public"."handle_monthly_bonus"();



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."fiat_payouts"
    ADD CONSTRAINT "fiat_payouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."merchant_payments"
    ADD CONSTRAINT "merchant_payments_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."merchants"
    ADD CONSTRAINT "merchants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."monthly_bonus_log"
    ADD CONSTRAINT "monthly_bonus_log_rep_id_fkey" FOREIGN KEY ("rep_id") REFERENCES "public"."reps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."partners"
    ADD CONSTRAINT "partners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



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



CREATE POLICY "Audit logs view admin" ON "public"."audit_logs" FOR SELECT USING (("auth"."email"() = 'admin@cryptrac.com'::"text"));



CREATE POLICY "Fiat payouts view" ON "public"."fiat_payouts" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("auth"."email"() = 'admin@cryptrac.com'::"text")));



CREATE POLICY "Merchant payments view own" ON "public"."merchant_payments" FOR SELECT USING ((("merchant_id" = ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."user_id" = "auth"."uid"()))) OR ("auth"."email"() = 'admin@cryptrac.com'::"text")));



CREATE POLICY "Merchants update own" ON "public"."merchants" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR ("auth"."email"() = 'admin@cryptrac.com'::"text")));



CREATE POLICY "Merchants view own" ON "public"."merchants" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("auth"."email"() = 'admin@cryptrac.com'::"text")));



CREATE POLICY "Monthly bonus log view" ON "public"."monthly_bonus_log" FOR SELECT USING ((("rep_id" = ( SELECT "reps"."id"
   FROM "public"."reps"
  WHERE ("reps"."user_id" = "auth"."uid"()))) OR ("auth"."email"() = 'admin@cryptrac.com'::"text")));



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



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."automation_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fiat_payouts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."merchant_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."merchants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."monthly_bonus_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."partners" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rep_sales" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."upgrade_history" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_proration"("merchant_id" "uuid", "full_fee" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_proration"("merchant_id" "uuid", "full_fee" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_proration"("merchant_id" "uuid", "full_fee" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_monthly_bonus"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_monthly_bonus"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_monthly_bonus"() TO "service_role";



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



GRANT ALL ON TABLE "public"."upgrade_history" TO "anon";
GRANT ALL ON TABLE "public"."upgrade_history" TO "authenticated";
GRANT ALL ON TABLE "public"."upgrade_history" TO "service_role";



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
