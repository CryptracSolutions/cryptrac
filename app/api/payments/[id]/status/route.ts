import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  context: RouteParams
) {
  try {
    console.log('=== PAYMENT LINK STATUS UPDATE API START ===');
    
    // Await the params in Next.js 15
    const { id } = await context.params;
    
    // Get Authorization header
    const authHeader = request.headers.get('Authorization');
    console.log('Authorization header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid Authorization header');
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const { status, reason } = await request.json();

    // Validate status
    const validStatuses = ['active', 'paused', 'completed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be one of: active, paused, completed' 
      }, { status: 400 });
    }

    console.log('Status update request:', { id, status, reason });

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

    // Create service role client for database operations (bypasses RLS)
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

    // Get merchant using service role (bypasses RLS)
    const { data: merchant, error: merchantError } = await serviceSupabase
      .from('merchants')
      .select('id, business_name, user_id')
      .eq('user_id', user.id)
      .single();

    if (merchantError || !merchant) {
      console.log('Merchant lookup error:', merchantError);
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Find the payment link and verify ownership
    const { data: paymentLink, error: linkError } = await serviceSupabase
      .from('payment_links')
      .select('*')
      .eq('id', id)
      .eq('merchant_id', merchant.id)
      .single();

    if (linkError || !paymentLink) {
      console.log('Payment link not found:', linkError);
      return NextResponse.json({ error: 'Payment link not found' }, { status: 404 });
    }

    console.log('Found payment link:', {
      id: paymentLink.id,
      title: paymentLink.title,
      current_status: paymentLink.status,
      usage_count: paymentLink.usage_count,
      max_uses: paymentLink.max_uses
    });

    // Prevent certain status changes
    if (paymentLink.status === 'expired' && status !== 'active') {
      return NextResponse.json({ 
        error: 'Cannot change status of expired payment link (except to reactivate)' 
      }, { status: 400 });
    }

    // Update the payment link status
    const { data: updatedLink, error: updateError } = await serviceSupabase
      .from('payment_links')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('merchant_id', merchant.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating payment link status:', updateError);
      return NextResponse.json({ error: 'Failed to update payment link status' }, { status: 500 });
    }

    // Log the status change
    await serviceSupabase.from('audit_logs').insert({
      action: 'payment_link_status_update',
      user_id: user.id,
      affected_id: id,
      details: {
        old_status: paymentLink.status,
        new_status: status,
        reason: reason || 'Manual update',
        payment_link_title: paymentLink.title
      }
    });

    console.log('✅ Payment link status updated:', {
      id: id,
      old_status: paymentLink.status,
      new_status: status
    });

    return NextResponse.json({
      success: true,
      message: `Payment link status updated to ${status}`,
      data: {
        payment_link: updatedLink,
        old_status: paymentLink.status,
        new_status: status
      }
    });

  } catch (error) {
    console.error('Payment link status update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

