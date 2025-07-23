import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('=== PAYMENTS LIST API START ===');
    
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

    if (merchantError) {
      console.log('Merchant lookup error:', merchantError);
      return NextResponse.json(
        { error: 'Failed to lookup merchant' },
        { status: 500 }
      );
    }

    if (!merchant) {
      console.log('No merchant found for user:', user.id);
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    console.log('Found merchant:', merchant.id);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    console.log('Query params:', { search, status, page, limit });

    // Build query using service role (bypasses RLS)
    let query = serviceSupabase
      .from('payment_links')
      .select('*')
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
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    console.log('Executing query...');

    // Execute query
    const { data: paymentLinks, error: queryError, count } = await query;

    if (queryError) {
      console.error('Query error:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch payment links' },
        { status: 500 }
      );
    }

    console.log('Found payment links:', paymentLinks?.length || 0);

    // Get total count for pagination using service role
    const { count: totalCount, error: countError } = await serviceSupabase
      .from('payment_links')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchant.id);

    if (countError) {
      console.error('Count error:', countError);
    }

    // Calculate statistics using service role
    const { data: stats, error: statsError } = await serviceSupabase
      .from('payment_links')
      .select('status, amount')
      .eq('merchant_id', merchant.id);

    let statistics = {
      total_links: totalCount || 0,
      active_links: 0,
      total_payments: 0,
      total_revenue: 0
    };

    if (!statsError && stats) {
      statistics.active_links = stats.filter(link => link.status === 'active').length;
      statistics.total_payments = stats.filter(link => link.status === 'completed').length;
      statistics.total_revenue = stats
        .filter(link => link.status === 'completed')
        .reduce((sum, link) => sum + (link.amount || 0), 0);
    }

    console.log('Returning success response with', paymentLinks?.length || 0, 'payment links');

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        payment_links: paymentLinks || [],
        pagination: {
          page,
          limit,
          total: totalCount || 0,
          pages: Math.ceil((totalCount || 0) / limit)
        },
        statistics
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

