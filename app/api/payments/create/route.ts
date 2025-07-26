import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('=== PAYMENT CREATE API START ===');
    
    // Get Authorization header
    const authHeader = request.headers.get('Authorization');
    console.log('Authorization header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid Authorization header');
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('Token extracted from Authorization header');

    // Create regular Supabase client for authentication
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get the current user using the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('Authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Authenticated user:', user.id);

    // Parse request body
    const body = await request.json();
    const {
      title,
      description,
      amount,
      currency = 'USD',
      accepted_cryptos = ['BTC', 'ETH', 'LTC'],
      expires_at,
      max_uses,
      redirect_url
    } = body;

    console.log('Request body parsed:', { title, amount, currency });

    // Validate required fields
    if (!title || !amount) {
      return NextResponse.json(
        { error: 'Title and amount are required' },
        { status: 400 }
      );
    }

    // Validate amount
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    // Generate unique link ID
    const linkId = generateLinkId();
    console.log('Generated link ID:', linkId);

    // Create service role client for all database operations (bypasses RLS)
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check if merchant exists and get auto-conversion settings using service role (bypasses RLS)
    const { data: initialMerchant, error: merchantError } = await serviceSupabase
      .from('merchants')
      .select('id, business_name, user_id, auto_convert_enabled, preferred_payout_currency')
      .eq('user_id', user.id)
      .single();

    let merchant = initialMerchant;

    if (merchantError && merchantError.code === 'PGRST116') {
      console.log('Merchant not found, creating new merchant record...');
      
      // Create merchant record with service role
      const { data: newMerchant, error: createError } = await serviceSupabase
        .from('merchants')
        .insert({
          user_id: user.id,
          business_name: user.email || 'My Business',
          onboarding_completed: true,
          onboarding_step: 5,
          setup_paid: true,
          preferred_currencies: accepted_cryptos,
          auto_convert_enabled: false,
          preferred_payout_currency: null
        })
        .select('id, business_name, user_id, auto_convert_enabled, preferred_payout_currency')
        .single();

      if (createError) {
        console.error('Failed to create merchant:', createError);
        return NextResponse.json(
          { error: 'Failed to create merchant account' },
          { status: 500 }
        );
      }

      merchant = newMerchant;
      console.log('Created new merchant:', newMerchant?.id);
    } else if (merchantError) {
      console.log('Merchant lookup error:', merchantError);
      return NextResponse.json(
        { error: 'Failed to lookup merchant' },
        { status: 500 }
      );
    }

    // Ensure merchant exists at this point
    if (!merchant) {
      console.error('Merchant is null after lookup/creation');
      return NextResponse.json(
        { error: 'Failed to get merchant information' },
        { status: 500 }
      );
    }

    console.log('Found/created merchant:', merchant.id);

    // Get merchant's current auto-conversion settings
    const autoConvertEnabled = merchant.auto_convert_enabled || false;
    const preferredPayoutCurrency = merchant.preferred_payout_currency;

    // Calculate fees based on auto-conversion setting
    const amountNum = parseFloat(amount);
    const feePercentage = autoConvertEnabled ? 0.01 : 0.005; // 1% or 0.5%
    const feeAmount = amountNum * feePercentage;
    const merchantReceives = amountNum - feeAmount;

    console.log('Fee calculation:', {
      autoConvertEnabled,
      feePercentage: feePercentage * 100 + '%',
      feeAmount,
      merchantReceives
    });

    // Generate payment URL
    const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${linkId}`;

    // Create payment link using service role (bypasses RLS) with auto-conversion settings
    const { data: paymentLink, error: insertError } = await serviceSupabase
      .from('payment_links')
      .insert({
        merchant_id: merchant.id,
        title,
        description,
        amount: amountNum,
        currency,
        accepted_cryptos,
        link_id: linkId,
        qr_code_data: paymentUrl,
        expires_at: expires_at ? new Date(expires_at).toISOString() : null,
        max_uses: max_uses || null,
        status: 'active',
        auto_convert_enabled: autoConvertEnabled,
        preferred_payout_currency: preferredPayoutCurrency,
        fee_percentage: feePercentage,
        metadata: {
          redirect_url: redirect_url || null,
          fee_breakdown: {
            fee_percentage: feePercentage * 100,
            fee_amount: feeAmount,
            merchant_receives: merchantReceives,
            auto_convert_enabled: autoConvertEnabled,
            preferred_payout_currency: preferredPayoutCurrency
          }
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create payment link' },
        { status: 500 }
      );
    }

    console.log('Payment link created successfully:', paymentLink.id);

    // Return success response
    return NextResponse.json({
      success: true,
      payment_link: {
        ...paymentLink,
        payment_url: paymentUrl,
        qr_code_data: paymentUrl,
        metadata: {
          ...paymentLink.metadata,
          fee_amount: feeAmount,
          fee_percentage: feePercentage * 100
        }
      }
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Generate a unique link ID
function generateLinkId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'pl_';
  for (let i = 0; i < 9; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

