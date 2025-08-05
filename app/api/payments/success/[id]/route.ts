import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔍 Fetching payment success data for ID:', id)

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

    let payment = null
    let error = null

    // Check if ID is a UUID (payment link ID) or nowpayments payment ID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    if (isUUID) {
      // Payment link ID lookup - find the most recent confirmed payment for this link
      console.log('🔍 Looking up by payment link ID (UUID):', id)
      const result = await supabase
        .from('transactions')
        .select(`
          *,
          payment_link:payment_links!inner(
            title,
            description,
            link_id,
            merchant:merchants(
              business_name
            )
          )
        `)
        .eq('payment_link_id', id)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      payment = result.data
      error = result.error
    } else {
      // NOWPayments payment ID lookup
      console.log('🔍 Looking up by NOWPayments payment ID:', id)
      const result = await supabase
        .from('transactions')
        .select(`
          *,
          payment_link:payment_links(
            title,
            description,
            merchant:merchants(
              business_name
            )
          )
        `)
        .eq('nowpayments_payment_id', id)
        .single()
      
      payment = result.data
      error = result.error
    }

    if (error) {
      console.error('❌ Error fetching payment:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, message: 'Payment not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { success: false, message: 'Failed to fetch payment' },
        { status: 500 }
      )
    }

    if (!payment) {
      return NextResponse.json(
        { success: false, message: 'Payment not found' },
        { status: 404 }
      )
    }

    // Only return confirmed payments on success page
    if (payment.status !== 'confirmed') {
      return NextResponse.json(
        { success: false, message: 'Payment not confirmed' },
        { status: 400 }
      )
    }

    console.log('✅ Payment success data found:', {
      id: payment.id,
      status: payment.status,
      amount: payment.pay_amount,
      currency: payment.pay_currency,
      lookup_method: isUUID ? 'payment_link_id' : 'nowpayments_payment_id'
    })

    // Prepare response data with CORRECT column names
    const responsePayment = {
      id: payment.id,
      nowpayments_payment_id: payment.nowpayments_payment_id, // FIXED: Use correct column name
      order_id: payment.order_id,
      status: payment.status,
      pay_currency: payment.pay_currency,
      pay_amount: payment.pay_amount,
      pay_address: payment.pay_address,
      price_amount: payment.amount,
      price_currency: payment.currency,
      payout_currency: payment.currency_received || payment.pay_currency,
      payout_amount: payment.merchant_receives,
      created_at: payment.created_at,
      updated_at: payment.updated_at,
      tx_hash: payment.tx_hash,
      payin_hash: payment.payin_hash,
      payout_hash: payment.payout_hash,
      is_fee_paid_by_user: payment.gateway_fee > 0,
      gateway_fee: payment.gateway_fee,
      merchant_receives: payment.merchant_receives,
      amount_received: payment.amount_received,
      currency_received: payment.currency_received,
      payment_link: payment.payment_link,
    }

    return NextResponse.json({
      success: true,
      payment: responsePayment,
    })

  } catch (error) {
    console.error('❌ Error in payment success API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

