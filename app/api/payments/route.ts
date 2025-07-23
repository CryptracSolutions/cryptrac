import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    console.log('=== PAYMENTS LIST API START ===');
    
    const cookieStore = await cookies();
    console.log('Cookie store created');
    
    // Use EXACT same Supabase client creation as working create API
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

    console.log('Supabase client created');

    // Get the current user - EXACT same method as working create API
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('Authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Authenticated user:', user.id);

    // Get merchant record - same as create API
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (merchantError || !merchant) {
      console.log('Merchant not found:', merchantError);
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
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

    // Build query using merchant_id (same as create API uses)
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

    console.log('Returning success response');

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

