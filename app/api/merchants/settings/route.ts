import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
    } = await request.json();
    
    const { 
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
      wallets: rawWallets, 
      charge_customer_fee 
    } = requestData;
    const wallets = { ...(rawWallets || {}) };
    if (wallets.ETH && !wallets.ETHBASE) {
      wallets.ETHBASE = wallets.ETH;
    }

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

