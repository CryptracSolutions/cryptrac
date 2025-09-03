import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/email-utils';
import { cookies } from 'next/headers';
import { validateExtraId } from '@/lib/extra-id-validation';

// GET merchant settings
export async function GET() {
  try {
    // Initialize Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
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
              // Server component context
            }
          },
        },
      }
    );

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get merchant settings
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select(`
        id,
        business_name,
        business_type,
        industry,
        business_description,
        website,
        phone_number,
        timezone,
        business_address,
        auto_convert_enabled,
        preferred_payout_currency,
        wallets,
        payment_config,
        charge_customer_fee,
        email
      `)
      .eq('user_id', user.id)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Get wallet_extra_ids from merchant_settings table
    const { data: merchantSettings } = await supabase
      .from('merchant_settings')
      .select('wallet_extra_ids')
      .eq('merchant_id', merchant.id)
      .single();

    return NextResponse.json({
      success: true,
      settings: {
        business_name: merchant.business_name || '',
        business_type: merchant.business_type || '',
        industry: merchant.industry || '',
        business_description: merchant.business_description || '',
        website: merchant.website || '',
        phone_number: merchant.phone_number || '',
        timezone: merchant.timezone || 'America/New_York',
        email: merchant.email || '',
        business_address: merchant.business_address || {
          street: '',
          city: '',
          state: '',
          zip_code: '',
          country: 'US'
        },
        auto_convert_enabled: merchant.auto_convert_enabled || false,
        preferred_payout_currency: merchant.preferred_payout_currency || null,
        wallets: merchant.wallets || {},
        wallet_extra_ids: merchantSettings?.wallet_extra_ids || {},
        charge_customer_fee: merchant.charge_customer_fee || false,
        payment_config: {
          // Always enable auto_forward for non-custodial compliance
          auto_forward: true,
          fee_percentage: 0.5,
          auto_convert_fee: 1.0,
          ...(merchant.payment_config || {})
        }
      }
    });

  } catch (error) {
    console.error('Error fetching merchant settings:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch settings',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT update merchant settings
export async function PUT(request: NextRequest) {
  try {
    const requestData: {
      business_name?: string;
      business_type?: string;
      industry?: string;
      business_description?: string;
      website?: string;
      phone_number?: string;
      timezone?: string;
      email?: string;
      business_address?: {
        street: string;
        city: string;
        state: string;
        zip_code: string;
        country: string;
      };
      auto_convert_enabled?: boolean;
      preferred_payout_currency?: string | null;
      wallets?: Record<string, string>;
      wallet_extra_ids?: Record<string, string>;
      charge_customer_fee?: boolean;
    } = await request.json();
    
    const {
      business_name,
      business_type,
      industry,
      business_description,
      website,
      phone_number,
      timezone,
      email,
      business_address,
      auto_convert_enabled,
      preferred_payout_currency,
      wallets: rawWallets,
      wallet_extra_ids,
      charge_customer_fee
    } = requestData;
    const wallets = { ...(rawWallets || {}) };


    // Initialize Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
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
              // Server component context
            }
          },
        },
      }
    );

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Validate required fields if auto-conversion is enabled
    if (auto_convert_enabled && !preferred_payout_currency) {
      return NextResponse.json(
        { error: 'Preferred payout currency is required when auto-conversion is enabled' },
        { status: 400 }
      );
    }

    // Validate that payout wallet exists if auto-conversion is enabled
    if (auto_convert_enabled && preferred_payout_currency && wallets) {
      if (!wallets[preferred_payout_currency]) {
        return NextResponse.json(
          { error: `Wallet address for ${preferred_payout_currency.toUpperCase()} is required when auto-conversion is enabled` },
          { status: 400 }
        );
      }
    }

    // Validate extra_ids before saving
    if (wallet_extra_ids) {
      console.log('💾 Validating wallet_extra_ids:', wallet_extra_ids);
      
      for (const [currency, extraId] of Object.entries(wallet_extra_ids)) {
        if (extraId && !validateExtraId(currency, extraId as string)) {
          return NextResponse.json({
            success: false,
            error: `Invalid extra_id for ${currency}: ${extraId}`
          }, { status: 400 });
        }
      }
    }

    // Update merchant settings
    interface PaymentConfig {
      auto_forward: boolean
      fee_percentage: number
      auto_convert_fee: number
    }

    const updateData: {
      updated_at: string;
      business_name?: string;
      business_type?: string;
      industry?: string;
      business_description?: string;
      website?: string;
      phone_number?: string;
      timezone?: string;
      email?: string;
      business_address?: {
        street: string;
        city: string;
        state: string;
        zip_code: string;
        country: string;
      };
      auto_convert_enabled?: boolean;
      preferred_payout_currency?: string | null;
      wallets?: Record<string, string>;
      charge_customer_fee?: boolean;
      payment_config?: PaymentConfig;
    } = {
      updated_at: new Date().toISOString()
    };

    if (business_name !== undefined) {
      updateData.business_name = business_name;
    }

    if (business_type !== undefined) {
      updateData.business_type = business_type;
    }

    if (industry !== undefined) {
      updateData.industry = industry;
    }

    if (business_description !== undefined) {
      updateData.business_description = business_description;
    }

    if (website !== undefined) {
      updateData.website = website;
    }

    if (phone_number !== undefined) {
      updateData.phone_number = phone_number;
    }

    if (timezone !== undefined) {
      updateData.timezone = timezone;
    }

    if (email !== undefined) {
      updateData.email = email;
    }

    if (business_address !== undefined) {
      updateData.business_address = business_address;
    }

    if (typeof auto_convert_enabled === 'boolean') {
      updateData.auto_convert_enabled = auto_convert_enabled;
    }

    if (preferred_payout_currency !== undefined) {
      updateData.preferred_payout_currency = preferred_payout_currency;
    }

    if (wallets) {
      updateData.wallets = wallets;
    }

    if (typeof charge_customer_fee === 'boolean') {
      updateData.charge_customer_fee = charge_customer_fee;
    }

    // Always ensure payment_config has auto_forward: true for non-custodial compliance
    updateData.payment_config = {
      auto_forward: true, // Always enabled for non-custodial compliance
      fee_percentage: 0.5,
      auto_convert_fee: 1.0
    };

    const { data: merchant, error: updateError } = await supabase
      .from('merchants')
      .update(updateData)
      .eq('user_id', user.id)
      .select(`
        id,
        business_name,
        business_type,
        industry,
        business_description,
        website,
        phone_number,
        timezone,
        business_address,
        auto_convert_enabled,
        preferred_payout_currency,
        wallets,
        payment_config,
        charge_customer_fee,
        email
      `)
      .single();

    if (updateError) {
      console.error('Error updating merchant settings:', updateError);
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    // Update wallet_extra_ids in merchant_settings table if provided
    let merchantSettings = null;
    if (wallet_extra_ids !== undefined && merchant) {
      console.log('💾 Saving wallet_extra_ids to merchant_settings');
      
      // First ensure merchant_settings row exists
      const { data: existingSettings } = await supabase
        .from('merchant_settings')
        .select('*')
        .eq('merchant_id', merchant.id)
        .single();

      if (existingSettings) {
        // Update existing row
        const { data: updatedSettings, error: settingsError } = await supabase
          .from('merchant_settings')
          .update({
            wallet_extra_ids,
            updated_at: new Date().toISOString()
          })
          .eq('merchant_id', merchant.id)
          .select('*')
          .single();

        if (settingsError) {
          console.error('❌ Error updating merchant_settings:', settingsError);
        } else {
          merchantSettings = updatedSettings;
        }
      } else {
        // Create new row
        const { data: newSettings, error: createError } = await supabase
          .from('merchant_settings')
          .insert({
            merchant_id: merchant.id,
            wallet_extra_ids,
            email_payment_notifications_enabled: true,
            public_receipts_enabled: true
          })
          .select('*')
          .single();

        if (createError) {
          console.error('❌ Error creating merchant_settings:', createError);
        } else {
          merchantSettings = newSettings;
        }
      }
    } else if (merchant) {
      // Retrieve the latest wallet_extra_ids from merchant_settings if not updating them
      const { data: settings } = await supabase
        .from('merchant_settings')
        .select('wallet_extra_ids')
        .eq('merchant_id', merchant.id)
        .single();
      
      merchantSettings = settings;
    }

    // Update the auth user's email if it has changed
    if (email && email !== user.email) {
      try {
        // Prefer service role admin update for immediate effect without confirmation
        const admin = createServiceClient();
        const { error: adminErr } = await admin.auth.admin.updateUserById(user.id, { email });
        if (adminErr) {
          console.error('Admin email update failed, falling back to user update:', adminErr);
          const { error: clientErr } = await supabase.auth.updateUser({ email });
          if (clientErr) {
            console.error('Client email update also failed:', clientErr);
          }
        }
      } catch (e) {
        console.error('Service client not configured or failed; attempting client update:', e);
        const { error: clientErr } = await supabase.auth.updateUser({ email });
        if (clientErr) {
          console.error('Client email update failed:', clientErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings: {
        business_name: merchant.business_name || '',
        business_type: merchant.business_type || '',
        industry: merchant.industry || '',
        business_description: merchant.business_description || '',
        website: merchant.website || '',
        phone_number: merchant.phone_number || '',
        timezone: merchant.timezone || 'America/New_York',
        email: merchant.email || '',
        business_address: merchant.business_address || {
          street: '',
          city: '',
          state: '',
          zip_code: '',
          country: 'US'
        },
        auto_convert_enabled: merchant.auto_convert_enabled || false,
        preferred_payout_currency: merchant.preferred_payout_currency || null,
        wallets: merchant.wallets || {},
        wallet_extra_ids: merchantSettings?.wallet_extra_ids || {},
        charge_customer_fee: merchant.charge_customer_fee || false,
        payment_config: {
          // Always enable auto_forward for non-custodial compliance
          auto_forward: true,
          fee_percentage: 0.5,
          auto_convert_fee: 1.0,
          ...(merchant.payment_config || {})
        }
      }
    });

  } catch (error) {
    console.error('Error updating merchant settings:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update settings',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
