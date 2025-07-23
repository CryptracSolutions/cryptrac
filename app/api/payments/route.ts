import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('=== PAYMENTS LIST API START ===');
    
    // Get Authorization header (same as working APIs)
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('Token extracted from Authorization header');

    // Create Supabase client with the token (same as working APIs)
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

    console.log('Supabase client created with Authorization header');

    // Get the current user using the token (same as working APIs)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Authenticated user:', user.id);

    // Get the merchant record for this user (same as working APIs)
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (merchantError || !merchant) {
      console.error('Merchant not found for user:', user.id, merchantError);
      return NextResponse.json({ 
        error: 'Merchant account not found' 
      }, { status: 404 });
    }

    console.log('Found merchant:', merchant.id);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    console.log('Query params:', { search, status, page, limit });

    // Build query using merchant_id
    let query = supabase
      .from('payment_links')
      .select('*', { count: 'exact' })
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    console.log('Executing query...');

    const { data: paymentLinks, error: linksError, count } = await query;

    if (linksError) {
      console.error('Error fetching payment links:', linksError);
      return NextResponse.json(
        { error: 'Failed to fetch payment links' },
        { status: 500 }
      );
    }

    console.log('Found payment links:', paymentLinks?.length || 0);

    // Transform data to match frontend expectations
    const transformedLinks = (paymentLinks || []).map((link) => ({
      ...link,
      payment_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pay/${link.link_id}`,
      statistics: {
        total_payments: 0,
        successful_payments: 0,
        total_received: 0
      }
    }));

    // Calculate overall statistics
    const overallStats = {
      total_links: count || 0,
      active_links: paymentLinks?.filter(link => link.status === 'active').length || 0,
      total_payments: 0,
      total_received: 0
    };

    console.log('Returning success response with', transformedLinks.length, 'payment links');

    // Return data in the structure expected by frontend
    return NextResponse.json({
      success: true,
      data: {
        payment_links: transformedLinks,
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        },
        statistics: overallStats
      }
    });

  } catch (error) {
    console.error('Payment links fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

