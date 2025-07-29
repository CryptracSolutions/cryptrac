import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

interface OnboardingData {
  businessInfo: {
    businessName: string;
    businessType: string;
    website?: string;
    description?: string;
  };
  walletConfig: {
    wallets: Record<string, string>;
    wallet_generation_method: string;
    walletType: string;
    selectedCurrencies?: string[];
  };
  paymentConfig: {
    chargeCustomerFee: boolean;
    acceptedCryptos: string[];
    autoConvert: boolean;
    payoutCurrency?: string;
    feePercentage: number;
  };
}

export async function POST(request: NextRequest) {
  try {
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
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
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

    const onboardingData: OnboardingData = await request.json();

    // Update merchant record with onboarding data - only use existing columns
    const { error: updateError } = await supabase
      .from('merchants')
      .update({
        business_name: onboardingData.businessInfo.businessName,
        industry: onboardingData.businessInfo.businessType,
        website: onboardingData.businessInfo.website,
        business_description: onboardingData.businessInfo.description, // This column exists
        wallets: onboardingData.walletConfig.wallets,
        charge_customer_fee: onboardingData.paymentConfig.chargeCustomerFee,
        payment_config: {
          auto_forward: true, // Always enabled for non-custodial compliance
          fee_percentage: onboardingData.paymentConfig.feePercentage,
          auto_convert: onboardingData.paymentConfig.autoConvert,
          payout_currency: onboardingData.paymentConfig.payoutCurrency,
          auto_convert_fee: 1.0
        },
        auto_convert_enabled: onboardingData.paymentConfig.autoConvert,
        preferred_payout_currency: onboardingData.paymentConfig.payoutCurrency,
        onboarding_completed: true,
        onboarded: true, // Set both onboarding flags
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating merchant:', updateError);
      return NextResponse.json(
        { error: 'Failed to complete onboarding' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Onboarding completed successfully'
    });

  } catch (error) {
    console.error('Onboarding API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

