import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First, get the merchant ID for this user
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Try to find payment link by UUID first, then by link_id
    let paymentLink = null;
    let linkError = null;

    // First try by UUID (id field)
    const { data: linkById, error: errorById } = await supabase
      .from('payment_links')
      .select(`
        *,
        merchant:merchants(business_name)
      `)
      .eq('id', id)
      .eq('merchant_id', merchant.id)
      .single();

    if (linkById) {
      paymentLink = linkById;
    } else {
      // If not found by UUID, try by link_id
      const { data: linkByLinkId, error: errorByLinkId } = await supabase
        .from('payment_links')
        .select(`
          *,
          merchant:merchants(business_name)
        `)
        .eq('link_id', id)
        .eq('merchant_id', merchant.id)
        .single();

      if (linkByLinkId) {
        paymentLink = linkByLinkId;
      } else {
        linkError = errorByLinkId;
      }
    }

    if (linkError || !paymentLink) {
      return NextResponse.json(
        { error: 'Payment link not found' },
        { status: 404 }
      );
    }

    // Get payment statistics
    const { data: payments, error: paymentsError } = await supabase
      .from('merchant_payments')
      .select('*')
      .eq('payment_link_id', paymentLink.id);

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
    }

    // Calculate statistics
    const totalPayments = payments?.length || 0;
    const totalReceived = payments?.reduce((sum, payment) => {
      return sum + (payment.status === 'confirmed' ? parseFloat(payment.amount_received || '0') : 0);
    }, 0) || 0;

    const successfulPayments = payments?.filter(p => p.status === 'confirmed').length || 0;
    const pendingPayments = payments?.filter(p => p.status === 'pending').length || 0;

    // Generate payment URL
    const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${paymentLink.link_id}`;

    // Return payment link with statistics
    return NextResponse.json({
      success: true,
      data: {
        ...paymentLink,
        payment_url: paymentUrl,
        statistics: {
          total_payments: totalPayments,
          total_received: totalReceived,
          successful_payments: successfulPayments,
          pending_payments: pendingPayments,
          conversion_rate: totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0
        }
      },
      recent_payments: payments?.slice(-10) || []
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
    const { id } = await params;
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
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the merchant ID for this user
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const {
      title,
      description,
      amount,
      currency,
      accepted_cryptos,
      expires_at,
      max_uses,
      redirect_url,
      status
    } = body;

    // Update payment link
    const { data: updatedLink, error: updateError } = await supabase
      .from('payment_links')
      .update({
        title,
        description,
        amount: amount ? parseFloat(amount) : undefined,
        currency,
        accepted_cryptos,
        expires_at: expires_at ? new Date(expires_at).toISOString() : null,
        max_uses: max_uses || null,
        redirect_url: redirect_url || null,
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
      payment_link: updatedLink
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
    const { id } = await params;
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
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the merchant ID for this user
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (merchantError || !merchant) {
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

