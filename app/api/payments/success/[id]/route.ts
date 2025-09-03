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
      
      // First try to find confirmed transactions
      let result = await supabase
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
      
      // If no confirmed transaction found, try 'finished' status
      if (result.error && result.error.code === 'PGRST116') {
        console.log('🔍 No confirmed transaction found, trying finished status')
        result = await supabase
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
          .eq('status', 'finished')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
      }
      
      // If still no transaction found, try any transaction for this payment link
      if (result.error && result.error.code === 'PGRST116') {
        console.log('🔍 No finished transaction found, trying any transaction for this payment link')
        result = await supabase
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
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
      }
      
      payment = result.data
      error = result.error
      
      if (payment) {
        console.log('✅ Transaction found:', {
          id: payment.id,
          status: payment.status,
          payment_link_id: payment.payment_link_id,
          nowpayments_payment_id: payment.nowpayments_payment_id
        })
      } else {
        // If no transaction found by payment link ID, try NOWPayments payment ID as fallback
        console.log('🔍 No transaction found by payment link ID, trying NOWPayments payment ID as fallback:', id)
        const fallbackResult = await supabase
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
        
        if (fallbackResult.data) {
          payment = fallbackResult.data
          error = null
          console.log('✅ Transaction found by NOWPayments payment ID fallback:', {
            id: payment.id,
            status: payment.status,
            payment_link_id: payment.payment_link_id,
            nowpayments_payment_id: payment.nowpayments_payment_id
          })
        } else {
          error = fallbackResult.error
        }
      }
    } else {
      // Try to find payment link by link_id first, then look for transactions
      console.log('🔍 Looking up by link_id first:', id)
      
      // First, try to find the payment link by link_id
      const { data: paymentLink, error: linkError } = await supabase
        .from('payment_links')
        .select('id')
        .eq('link_id', id)
        .single()
      
      if (linkError || !paymentLink) {
        // If no payment link found by link_id, try NOWPayments payment ID lookup
        console.log('🔍 No payment link found by link_id, trying NOWPayments payment ID:', id)
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
        
        if (payment) {
          console.log('✅ Transaction found by NOWPayments payment ID:', {
            id: payment.id,
            status: payment.status,
            payment_link_id: payment.payment_link_id,
            nowpayments_payment_id: payment.nowpayments_payment_id
          })
        }
      } else {
        // Found payment link by link_id, now look for transactions
        console.log('🔍 Found payment link by link_id, looking for transactions with payment_link_id:', paymentLink.id)
        
        // First try to find confirmed transactions
        let result = await supabase
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
          .eq('payment_link_id', paymentLink.id)
          .eq('status', 'confirmed')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        // If no confirmed transaction found, try 'finished' status
        if (result.error && result.error.code === 'PGRST116') {
          console.log('🔍 No confirmed transaction found, trying finished status')
          result = await supabase
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
            .eq('payment_link_id', paymentLink.id)
            .eq('status', 'finished')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
        }
        
        // If still no transaction found, try any transaction for this payment link
        if (result.error && result.error.code === 'PGRST116') {
          console.log('🔍 No finished transaction found, trying any transaction for this payment link')
          result = await supabase
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
            .eq('payment_link_id', paymentLink.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
        }
        
        payment = result.data
        error = result.error
        
        if (payment) {
          console.log('✅ Transaction found by payment link ID:', {
            id: payment.id,
            status: payment.status,
            payment_link_id: payment.payment_link_id,
            nowpayments_payment_id: payment.nowpayments_payment_id
          })
        }
      }
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

    // Only return confirmed or finished payments on success page
    if (payment.status !== 'confirmed' && payment.status !== 'finished') {
      console.log('❌ Payment status not suitable for success page:', payment.status)
      return NextResponse.json(
        { success: false, message: 'Payment not confirmed' },
        { status: 400 }
      )
    }

    // Ensure hash fields are populated for confirmed payments
    if (
      payment.nowpayments_payment_id &&
      (!payment.payin_hash || !payment.payout_hash || !payment.tx_hash)
    ) {
      try {
        const npResponse = await fetch(
          `https://api.nowpayments.io/v1/payment/${payment.nowpayments_payment_id}`,
          {
            headers: {
              'x-api-key': process.env.NOWPAYMENTS_API_KEY!,
            },
          }
        )

        if (npResponse.ok) {
          const npData = await npResponse.json()
          const updateData: Record<string, unknown> = {}

          const payinHash = npData.payin_hash || npData.hash
          const payoutHash = npData.payout_hash || npData.outcome?.hash

          if (!payment.payin_hash && payinHash) {
            updateData.payin_hash = payinHash
          }

          if (!payment.payout_hash && payoutHash) {
            updateData.payout_hash = payoutHash
          }

          // Determine primary tx_hash
          if (!payment.tx_hash) {
            if (payoutHash) {
              updateData.tx_hash = payoutHash
            } else if (payinHash) {
              updateData.tx_hash = payinHash
            }
          }

          if (npData.actually_paid && !payment.amount_received) {
            updateData.amount_received = npData.actually_paid
          }

          if (npData.outcome_amount && !payment.merchant_receives) {
            updateData.merchant_receives = npData.outcome_amount
          }

          if (npData.outcome_currency && !payment.payout_currency) {
            updateData.payout_currency = npData.outcome_currency.toUpperCase()
          }

          if (Object.keys(updateData).length > 0) {
            updateData.updated_at = new Date().toISOString()
            const { error: updateError } = await supabase
              .from('transactions')
              .update(updateData)
              .eq('id', payment.id)

            if (!updateError) {
              Object.assign(payment, updateData)
              console.log('✅ Payment hashes updated from NOWPayments:', {
                payin_hash: updateData.payin_hash,
                payout_hash: updateData.payout_hash,
                tx_hash: updateData.tx_hash,
              })
            } else {
              console.warn('⚠️ Failed to update payment hashes:', updateError)
            }
          }
        } else {
          console.warn('⚠️ Failed to fetch payment from NOWPayments:', npResponse.status)
        }
      } catch (hashError) {
        console.warn('⚠️ Error fetching hashes from NOWPayments:', hashError)
      }
    }

    console.log('✅ Payment success data found:', {
      id: payment.id,
      status: payment.status,
      amount: payment.pay_amount,
      currency: payment.pay_currency,
      lookup_method: isUUID ? 'payment_link_id' : 'nowpayments_payment_id',
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
      payin_extra_id: payment.payin_extra_id, // Include destination tag/memo
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

