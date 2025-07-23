import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params for Next.js 15 compatibility
    const { id } = await params;

    // Get Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

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
      console.error('Authentication error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Authenticated user:', user.id);

    // Find the merchant record for this user
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (merchantError || !merchant) {
      console.error('Merchant not found for user:', user.id, merchantError);
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    console.log('Found merchant:', merchant.id);

    // Get the payment link
    const { data: paymentLink, error: linkError } = await supabase
      .from('payment_links')
      .select('*')
      .eq('id', id)
      .eq('merchant_id', merchant.id)
      .single();

    if (linkError || !paymentLink) {
      console.error('Payment link not found:', linkError);
      return NextResponse.json({ error: 'Payment link not found' }, { status: 404 });
    }

    // For now, return simplified data without merchant_payments join
    // This can be enhanced later with separate queries if needed
    const linkWithStats = {
      ...paymentLink,
      merchant_payments: [], // Empty array for compatibility
      statistics: {
        totalPayments: 0,
        successfulPayments: 0,
        totalAmount: 0,
        successRate: 0,
        averageAmount: 0,
        lastPayment: null,
        daysActive: Math.ceil((Date.now() - new Date(paymentLink.created_at).getTime()) / (1000 * 60 * 60 * 24))
      }
    };

    return NextResponse.json({
      success: true,
      data: linkWithStats
    });

  } catch (error) {
    console.error('Payment link fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params for Next.js 15 compatibility
    const { id } = await params;

    // Get Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

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
      console.error('Authentication error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the merchant record for this user
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (merchantError || !merchant) {
      console.error('Merchant not found for user:', user.id, merchantError);
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { title, description, amount, currency, status } = body;

    // Update payment link
    const { data: updatedLink, error: updateError } = await supabase
      .from('payment_links')
      .update({
        title,
        description,
        amount,
        currency,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('merchant_id', merchant.id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update payment link' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedLink
    });

  } catch (error) {
    console.error('Payment link update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params for Next.js 15 compatibility
    const { id } = await params;

    // Get Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

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
      console.error('Authentication error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the merchant record for this user
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (merchantError || !merchant) {
      console.error('Merchant not found for user:', user.id, merchantError);
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Delete payment link
    const { error: deleteError } = await supabase
      .from('payment_links')
      .delete()
      .eq('id', id)
      .eq('merchant_id', merchant.id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete payment link' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment link deleted successfully'
    });

  } catch (error) {
    console.error('Payment link delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

