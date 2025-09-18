import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface PaymentLink {
  id: string;
  status: string;
  usage_count: number;
  max_uses: number | null;
  expires_at: string | null;
  current_uses: number;
  confirmed_payment_count?: number; // Added dynamically in API
}

function calculatePaymentLinkStatus(link: PaymentLink): string {
  // If manually completed, keep it completed
  if (link.status === 'completed') {
    return 'completed';
  }

  // If manually paused, keep it paused
  if (link.status === 'paused') {
    return 'paused';
  }

  // Check if expired
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return 'expired';
  }

  // Only mark as completed when confirmed uses reach max uses
  if (link.max_uses && link.current_uses >= link.max_uses) {
    return 'completed';
  }

  // Otherwise, it's active
  return 'active';
}

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
    const dateRange = searchParams.get('date_range') || '';

    console.log('Query params:', { search, status, page, limit, dateRange });

    // Build query using service role (bypasses RLS)
    let query = serviceSupabase
      .from('payment_links')
      .select(`
        *,
        subscription_invoices!left(
          invoice_number,
          status,
          due_date,
          cycle_start_at
        )
      `)
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false });

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply date range filter
    if (dateRange) {
      const now = new Date();
      let startDate: Date | null = null;
      let endDate: Date | null = new Date();

      if (dateRange === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (dateRange === '7d') {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
      } else if (dateRange === '30d') {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
      } else if (dateRange === 'this_month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (dateRange === 'last_month') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lt('created_at', endDate.toISOString());
      }
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    console.log('Executing query...');

    // Execute query
    const { data: rawPaymentLinks, error: queryError } = await query;

    if (queryError) {
      console.error('Query error:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch payment links' },
        { status: 500 }
      );
    }

    console.log('Found payment links:', rawPaymentLinks?.length || 0);

    // Calculate real-time status for each payment link and apply status filter
    const paymentLinksWithStatus = (rawPaymentLinks || []).map(link => {
      const linkWithCount = {
        ...link,
        confirmed_payment_count: link.current_uses
      };

      const calculatedStatus = calculatePaymentLinkStatus(linkWithCount);
      return {
        ...linkWithCount,
        status: calculatedStatus,
        // Add helpful metadata for debugging
        _status_info: {
          stored_status: link.status,
          calculated_status: calculatedStatus,
          is_single_use: link.max_uses === 1,
          usage_vs_max: `${link.usage_count}/${link.max_uses || 'unlimited'}`,
          confirmed_vs_max: `${linkWithCount.confirmed_payment_count}/${link.max_uses || 'unlimited'}`,
          is_expired: link.expires_at && new Date(link.expires_at) < new Date()
        }
      };
    });

    // Apply status filter after calculating real-time status
    const paymentLinks = status 
      ? paymentLinksWithStatus.filter(link => link.status === status)
      : paymentLinksWithStatus;

    // Get total count for pagination using service role
    let countQuery = serviceSupabase
      .from('payment_links')
      .select(`
        *,
        subscription_invoices!left(
          invoice_number,
          status,
          due_date,
          cycle_start_at
        )
      `)
      .eq('merchant_id', merchant.id);

    // Apply same date range to count query
    if (dateRange) {
      const now = new Date();
      let startDate: Date | null = null;
      let endDate: Date | null = new Date();

      if (dateRange === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (dateRange === '7d') {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
      } else if (dateRange === '30d') {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
      } else if (dateRange === 'this_month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (dateRange === 'last_month') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      if (startDate) {
        countQuery = countQuery.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        countQuery = countQuery.lt('created_at', endDate.toISOString());
      }
    }

    const { data: allLinks, error: countError } = await countQuery;

    if (countError) {
      console.error('Count error:', countError);
    }

    // Calculate statistics with real-time status
    const allLinksWithStatus = (allLinks || []).map(link => ({
      ...link,
      status: calculatePaymentLinkStatus(link as PaymentLink)
    }));

    // Apply search filter to all links for accurate count
    const filteredAllLinks = search 
      ? allLinksWithStatus.filter(link => 
          link.title?.toLowerCase().includes(search.toLowerCase()) ||
          link.description?.toLowerCase().includes(search.toLowerCase())
        )
      : allLinksWithStatus;

    // Apply status filter to all links for accurate count
    const finalFilteredLinks = status
      ? filteredAllLinks.filter(link => link.status === status)
      : filteredAllLinks;

    const totalCount = finalFilteredLinks.length;

    const statistics = {
      total_links: allLinksWithStatus.length,
      active_links: allLinksWithStatus.filter(link => link.status === 'active').length,
      completed_links: allLinksWithStatus.filter(link => link.status === 'completed').length,
      expired_links: allLinksWithStatus.filter(link => link.status === 'expired').length,
      paused_links: allLinksWithStatus.filter(link => link.status === 'paused').length,
      single_use_links: allLinksWithStatus.filter(link => link.max_uses === 1).length,
      total_payments: 0,
      total_revenue: 0
    };

    // Calculate payment statistics
    const { data: payments, error: paymentsError } = await serviceSupabase
      .from('transactions')
      .select('status, amount, currency, created_at')
      .eq('merchant_id', merchant.id)
      .in('status', ['confirmed', 'finished']);

    if (!paymentsError && payments) {
      let filteredPayments = payments;
      if (dateRange) {
        const now = new Date();
        let startDate: Date | null = null;
        let endDate: Date | null = new Date();

        if (dateRange === 'today') {
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (dateRange === '7d') {
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
        } else if (dateRange === '30d') {
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
        } else if (dateRange === 'this_month') {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (dateRange === 'last_month') {
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        filteredPayments = payments.filter(p => {
          const createdAt = p.created_at ? new Date(p.created_at) : null;
          if (!createdAt) return false;
          const afterStart = startDate ? createdAt >= startDate : true;
          const beforeEnd = endDate ? createdAt < endDate : true;
          return afterStart && beforeEnd;
        });
      }

      statistics.total_payments = filteredPayments.length;
      statistics.total_revenue = filteredPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    }

    console.log('Calculated statistics:', statistics);
    console.log('Returning success response with', paymentLinks.length, 'payment links');

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        payment_links: paymentLinks,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
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

