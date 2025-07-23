import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getNOWPaymentsClient, calculateCryptracFees } from '@/lib/nowpayments';

export async function POST(request: NextRequest) {
  try {
    // Get Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Create Supabase client with the token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Get the current user using the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Authenticated user:', user.id);

    // Get the merchant record for this user (should exist after running the SQL migration)
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (merchantError || !merchant) {
      console.error('Merchant not found for user:', user.id, merchantError);
      return NextResponse.json({ 
        error: 'Merchant account not found. Please run the database migration first.' 
      }, { status: 404 });
    }

    console.log('Found merchant:', merchant.id);

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

    // Validate required fields
    if (!title || !amount) {
      return NextResponse.json(
        { error: 'Title and amount are required' },
        { status: 400 }
      );
    }

    // Generate unique link ID
    const linkId = `pl_${Math.random().toString(36).substr(2, 9)}`;

    // Calculate fees
    const fees = calculateCryptracFees(parseFloat(amount));

    // Create the payment URL
    const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pay/${linkId}`;

    // Create payment link in database
    const { data: paymentLink, error: insertError } = await supabase
      .from('payment_links')
      .insert({
        merchant_id: merchant.id,
        link_id: linkId,
        title,
        description,
        amount: parseFloat(amount),
        currency,
        accepted_cryptos,
        expires_at: expires_at || null,
        max_uses: max_uses ? parseInt(max_uses) : null,
        status: 'active',
        metadata: {
          redirect_url: redirect_url || null,
          payment_url: paymentUrl,
          fees: fees
        },
        created_at: new Date().toISOString()
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

    // Return the payment link with the URL included
    const responsePaymentLink = {
      ...paymentLink,
      payment_url: paymentUrl
    };

    return NextResponse.json({
      success: true,
      payment_link: responsePaymentLink,
      fees: fees
    });

  } catch (error) {
    console.error('Payment link creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

