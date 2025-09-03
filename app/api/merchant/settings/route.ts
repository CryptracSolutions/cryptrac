import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { validateExtraId } from '@/lib/extra-id-validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper to get authenticated merchant and service client
async function getMerchantAndService() {
  const cookieStore = await cookies();
  const anon = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // ignore
          }
        }
      }
    }
  );

  const { data: { user }, error } = await anon.auth.getUser();
  if (error || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
  }

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: merchant } = await service
    .from('merchants')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!merchant) {
    return { error: NextResponse.json({ error: 'Merchant not found' }, { status: 404 }) };
  }

  return { service, merchant };
}

export async function GET() {
  const result = await getMerchantAndService();
  if ('error' in result) return result.error;
  const { service, merchant } = result;

  // Ensure settings row exists
  let { data: settings } = await service
    .from('merchant_settings')
    .select('*')
    .eq('merchant_id', merchant.id)
    .single();

  if (!settings) {
    const { data: inserted } = await service
      .from('merchant_settings')
      .insert({ merchant_id: merchant.id })
      .select('*')
      .single();
    settings = inserted!;
  }

  return NextResponse.json(settings);
}

export async function PATCH(req: Request) {
  const result = await getMerchantAndService();
  if ('error' in result) return result.error;
  const { service, merchant } = result;

  const body = await req.json() as {
    email_payment_notifications_enabled?: boolean;
    public_receipts_enabled?: boolean;
    last_seen_payments_at?: string;
    wallets?: Record<string, string>;
    wallet_extra_ids?: Record<string, string>;
  };
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body.email_payment_notifications_enabled === 'boolean') {
    update.email_payment_notifications_enabled = body.email_payment_notifications_enabled;
  }
  if (typeof body.public_receipts_enabled === 'boolean') {
    update.public_receipts_enabled = body.public_receipts_enabled;
  }
  if (body.last_seen_payments_at) {
    update.last_seen_payments_at = body.last_seen_payments_at;
  }

  // Handle wallets update
  if (body.wallets) {
    update.wallets = body.wallets;
  }

  // Handle wallet_extra_ids update with validation
  if (body.wallet_extra_ids) {
    // Validate extra_ids before saving
    for (const [currency, extraId] of Object.entries(body.wallet_extra_ids)) {
      if (extraId && !validateExtraId(currency, extraId as string)) {
        return NextResponse.json({
          error: `Invalid extra_id for ${currency}: ${extraId}`
        }, { status: 400 });
      }
    }
    update.wallet_extra_ids = body.wallet_extra_ids;
  }

  const { data, error } = await service
    .from('merchant_settings')
    .update(update)
    .eq('merchant_id', merchant.id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

