import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

interface OnboardingData {
  businessInfo: {
    businessName: string;
    businessType?: string;
    website?: string;
    description?: string;
    industry?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    email?: string; // ADDED: Email field for merchant notifications
    businessAddress?: {
      street: string;
      city: string;
      state: string;
      zip_code: string;
      country: string;
    };
    timezone?: string;
  };
  walletConfig: {
    wallets: Record<string, string>;
    wallet_extra_ids?: Record<string, string>;
    wallet_generation_method: string;
    walletType: string;
    selectedCurrencies?: string[];
  };
  paymentConfig: {
    chargeCustomerFee: boolean;
    acceptedCryptos: string[];
    autoConvert: boolean;
    payoutCurrency?: string;
    preferredPayoutCurrency?: string; // Handle both naming conventions
    autoForward?: boolean;
    // Tax configuration
    taxEnabled?: boolean;
    taxStrategy?: 'origin' | 'destination' | 'custom';
    salesType?: 'local' | 'online' | 'both';
    taxRates?: Array<{
      id: string;
      label: string;
      percentage: string;
    }>;
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
      console.error('❌ Authentication error in onboarding:', authError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated for onboarding:', user.id);

    const onboardingData: OnboardingData = await request.json();
    console.log('📨 Received onboarding data:', JSON.stringify(onboardingData, null, 2));

    // Extract and validate wallet data
    const walletData = { ...(onboardingData.walletConfig?.wallets || {}) };

    console.log('💰 Wallet data to save:', JSON.stringify(walletData, null, 2));
    const walletExtraIds = { ...(onboardingData.walletConfig?.wallet_extra_ids || {}) };
    console.log('🏷️ Wallet extra IDs to save:', JSON.stringify(walletExtraIds, null, 2));
    console.log('💰 Number of wallets to save:', Object.keys(walletData).length);

    // Handle both naming conventions for payout currency
    const payoutCurrency = onboardingData.paymentConfig?.payoutCurrency || 
                          onboardingData.paymentConfig?.preferredPayoutCurrency || 
                          null;

    // Use the actual industry provided during onboarding
    const industry = onboardingData.businessInfo?.industry || '';

    // ADDED: Extract merchant email for notifications
    const merchantEmail = onboardingData.businessInfo?.email || user.email || null;

    console.log('🏢 Business industry:', industry);
    console.log('💱 Payout currency:', payoutCurrency);
    console.log('📧 Merchant email:', merchantEmail); // ADDED: Log merchant email
    console.log('💳 Charge customer fee:', onboardingData.paymentConfig?.chargeCustomerFee);
    console.log('🔄 Auto convert:', onboardingData.paymentConfig?.autoConvert);

    // First, check if merchant record exists
    const { data: existingMerchant, error: checkError } = await supabase
      .from('merchants')
      .select('id, user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking existing merchant:', checkError);
      return NextResponse.json(
        { error: 'Failed to check merchant record', details: checkError.message },
        { status: 500 }
      );
    }

    console.log('🔍 Existing merchant check:', existingMerchant ? 'Found' : 'Not found');

    // Prepare the merchant data
    const merchantData = {
      user_id: user.id,
      business_name: onboardingData.businessInfo.businessName,
      industry: industry,
      website: onboardingData.businessInfo.website || null,
      business_description: onboardingData.businessInfo.description || null,
      business_type: onboardingData.businessInfo.businessType || null,
      first_name: onboardingData.businessInfo.firstName || null,
      last_name: onboardingData.businessInfo.lastName || null,
      phone_number: onboardingData.businessInfo.phoneNumber || null,
      email: merchantEmail, // ADDED: Store merchant email for notifications
      business_address: onboardingData.businessInfo.businessAddress || null,
      timezone: onboardingData.businessInfo.timezone || 'America/New_York',
      wallets: walletData,
      charge_customer_fee: onboardingData.paymentConfig.chargeCustomerFee || false,
      payment_config: {
        auto_forward: true, // Always enabled for non-custodial compliance
        auto_convert: onboardingData.paymentConfig.autoConvert || false,
        payout_currency: payoutCurrency,
        auto_convert_fee: 1.0
      },
      auto_convert_enabled: onboardingData.paymentConfig.autoConvert || false,
      preferred_payout_currency: payoutCurrency,
      // Store tax configuration in onboarding_data for later use
      onboarding_data: {
        tax_enabled: onboardingData.paymentConfig.taxEnabled || false,
        tax_strategy: onboardingData.paymentConfig.taxStrategy || 'origin',
        sales_type: onboardingData.paymentConfig.salesType || 'local',
        tax_rates: onboardingData.paymentConfig.taxRates || []
      },
      onboarding_completed: true,
      onboarded: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📝 Merchant data to save:', JSON.stringify(merchantData, null, 2));

    let savedMerchant;

    if (existingMerchant) {
      // Update existing merchant
      console.log('🔄 Updating existing merchant:', existingMerchant.id);
      
      const { data: updatedMerchant, error: updateError } = await supabase
        .from('merchants')
        .update({
          business_name: merchantData.business_name,
          business_type: merchantData.business_type,
          industry: merchantData.industry,
          website: merchantData.website,
          business_description: merchantData.business_description,
          first_name: merchantData.first_name,
          last_name: merchantData.last_name,
          phone_number: merchantData.phone_number,
          email: merchantData.email,
          business_address: merchantData.business_address,
          timezone: merchantData.timezone,
          wallets: merchantData.wallets,
          charge_customer_fee: merchantData.charge_customer_fee,
          payment_config: merchantData.payment_config,
          auto_convert_enabled: merchantData.auto_convert_enabled,
          preferred_payout_currency: merchantData.preferred_payout_currency,
          onboarding_data: merchantData.onboarding_data,
          onboarding_completed: merchantData.onboarding_completed,
          onboarded: merchantData.onboarded,
          updated_at: merchantData.updated_at
        })
        .eq('user_id', user.id)
        .select('id, wallets, charge_customer_fee, auto_convert_enabled, preferred_payout_currency, business_name, first_name, last_name, email, business_type, industry, phone_number, business_address, timezone, onboarding_data')
        .single();

      if (updateError) {
        console.error('❌ Error updating existing merchant:', updateError);
        return NextResponse.json(
          { error: 'Failed to update merchant', details: updateError.message },
          { status: 500 }
        );
      }

      savedMerchant = updatedMerchant;
      console.log('✅ Existing merchant updated successfully');

    } else {
      // Create new merchant
      console.log('➕ Creating new merchant record');
      
      const { data: newMerchant, error: insertError } = await supabase
        .from('merchants')
        .insert(merchantData)
        .select('id, wallets, charge_customer_fee, auto_convert_enabled, preferred_payout_currency, business_name, first_name, last_name, email, business_type, industry, phone_number, business_address, timezone, onboarding_data')
        .single();

      if (insertError) {
        console.error('❌ Error creating new merchant:', insertError);
        return NextResponse.json(
          { error: 'Failed to create merchant', details: insertError.message },
          { status: 500 }
        );
      }

      savedMerchant = newMerchant;
      console.log('✅ New merchant created successfully');
    }

    console.log('💾 Saved merchant data:', savedMerchant);
    console.log('💰 Saved wallets in database:', JSON.stringify(savedMerchant.wallets, null, 2));
    console.log('💰 Saved wallets count:', Object.keys(savedMerchant.wallets || {}).length);
    console.log('📧 Saved merchant email:', savedMerchant.email); // ADDED: Log saved email

    // Create or update merchant_settings record with default values and wallet_extra_ids
    console.log('⚙️ Creating merchant settings record...');
    const { data: merchantSettings, error: settingsError } = await supabase
      .from('merchant_settings')
      .upsert({
        merchant_id: savedMerchant.id,
        email_payment_notifications_enabled: true,
        public_receipts_enabled: true,
        wallet_extra_ids: walletExtraIds,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'merchant_id'
      })
      .select('*')
      .single();

    if (settingsError) {
      console.error('❌ Error creating merchant settings:', settingsError);
      // Don't fail the onboarding for this, just log the error
    } else {
      console.log('✅ Merchant settings created successfully:', merchantSettings);
    }

    // Verify the data was saved correctly
    const { data: verifyMerchant, error: verifyError } = await supabase
      .from('merchants')
      .select('id, wallets, charge_customer_fee, auto_convert_enabled, preferred_payout_currency, business_name, first_name, last_name, email, business_type, industry, phone_number, business_address, timezone')
      .eq('user_id', user.id)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying saved data:', verifyError);
    } else {
      console.log('🔍 VERIFICATION - Data in database after save:');
      console.log('🔍 Business name:', verifyMerchant.business_name);
      console.log('🔍 Business type:', verifyMerchant.business_type);
      console.log('🔍 Industry:', verifyMerchant.industry);
      console.log('🔍 First name:', verifyMerchant.first_name);
      console.log('🔍 Last name:', verifyMerchant.last_name);
      console.log('🔍 Phone number:', verifyMerchant.phone_number);
      console.log('🔍 Email:', verifyMerchant.email);
      console.log('🔍 Business address:', JSON.stringify(verifyMerchant.business_address, null, 2));
      console.log('🔍 Timezone:', verifyMerchant.timezone);
      console.log('🔍 Wallets:', JSON.stringify(verifyMerchant.wallets, null, 2));
      console.log('🔍 Wallets count:', Object.keys(verifyMerchant.wallets || {}).length);
      console.log('🔍 Charge customer fee:', verifyMerchant.charge_customer_fee);
      console.log('🔍 Auto convert enabled:', verifyMerchant.auto_convert_enabled);
      console.log('🔍 Preferred payout currency:', verifyMerchant.preferred_payout_currency);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Onboarding completed successfully',
      debug: {
        operation: existingMerchant ? 'update' : 'create',
        walletsReceived: Object.keys(walletData).length,
        walletsSaved: Object.keys(savedMerchant.wallets || {}).length,
        walletsVerified: Object.keys(verifyMerchant?.wallets || {}).length,
        emailSaved: savedMerchant.email, // ADDED: Include email in debug info
        savedData: {
          business_name: savedMerchant.business_name,
          email: savedMerchant.email, // ADDED: Include email in saved data
          wallets: savedMerchant.wallets,
          charge_customer_fee: savedMerchant.charge_customer_fee,
          auto_convert_enabled: savedMerchant.auto_convert_enabled,
          preferred_payout_currency: savedMerchant.preferred_payout_currency
        }
      }
    });

  } catch (error) {
    console.error('💥 Onboarding API error:', error);
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
