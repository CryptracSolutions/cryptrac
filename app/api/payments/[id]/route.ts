import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔍 Fetching payment link for ID:', id)

    // Create Supabase client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    // Check if the ID is a UUID (database ID) or a link_id
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    // Fetch payment link by either database ID or link_id
    const { data: paymentLink, error } = await supabase
      .from('payment_links')
      .select(`
        id,
        link_id,
        title,
        description,
        amount,
        base_amount,
        currency,
        status,
        accepted_cryptos,
        expires_at,
        max_uses,
        current_uses,
        charge_customer_fee,
        auto_convert_enabled,
        fee_percentage,
        tax_enabled,
        tax_rates,
        tax_amount,
        subtotal_with_tax,
        metadata,
        created_at,
        updated_at,
        merchant:merchants(
          id,
          business_name,
          charge_customer_fee,
          auto_convert_enabled
        )
      `)
      .eq(isUUID ? 'id' : 'link_id', id)
      .eq('status', 'active')
      .single()

    if (error) {
      console.error('Error fetching payment link:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, message: 'Payment link not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { success: false, message: 'Failed to fetch payment link' },
        { status: 500 }
      )
    }

    if (!paymentLink) {
      return NextResponse.json(
        { success: false, message: 'Payment link not found' },
        { status: 404 }
      )
    }

    console.log('✅ Payment link found:', paymentLink.id)

    // Construct the payment URL
    const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pay/${paymentLink.link_id}`;

    // Return with consistent structure (using 'data' field to match frontend expectations)
    return NextResponse.json({
      success: true,
      data: {
        ...paymentLink,
        payment_url: paymentUrl,
        qr_code_data: paymentUrl
      }
    })

  } catch (error) {
    console.error('Error in payment link API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

