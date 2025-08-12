import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import crypto from 'crypto'

// Rate limiting for webhook endpoints
const webhookAttempts = new Map<string, { count: number; lastAttempt: number }>()
const WEBHOOK_RATE_LIMIT = 100 // Max 100 requests per minute per IP
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const attempts = webhookAttempts.get(ip)
  
  if (!attempts) {
    webhookAttempts.set(ip, { count: 1, lastAttempt: now })
    return true
  }
  
  // Reset counter if window has passed
  if (now - attempts.lastAttempt > RATE_LIMIT_WINDOW) {
    webhookAttempts.set(ip, { count: 1, lastAttempt: now })
    return true
  }
  
  // Check if limit exceeded
  if (attempts.count >= WEBHOOK_RATE_LIMIT) {
    return false
  }
  
  // Increment counter
  attempts.count++
  attempts.lastAttempt = now
  return true
}

function verifyNOWPaymentsSignature(body: string, signature: string, secret: string): boolean {
  try {
    // NOWPayments uses HMAC-SHA512 for signature verification
    const expectedSignature = crypto
      .createHmac('sha512', secret)
      .update(body)
      .digest('hex')
    
    // Compare signatures using timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  } catch (error) {
    console.error('❌ Signature verification error:', error)
    return false
  }
}

function validateWebhookPayload(body: Record<string, unknown>): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Required fields validation
  if (!body.payment_id) {
    errors.push('Missing payment_id')
  }
  
  if (!body.order_id) {
    errors.push('Missing order_id')
  }
  
  if (!body.payment_status) {
    errors.push('Missing payment_status')
  }
  
  // Validate payment_status is a known value
  const validStatuses = ['waiting', 'confirming', 'confirmed', 'finished', 'failed', 'refunded', 'expired', 'sending']
  if (body.payment_status && !validStatuses.includes(body.payment_status as string)) {
    errors.push(`Invalid payment_status: ${body.payment_status}`)
  }
  
  // Validate numeric fields
  if (body.pay_amount && (isNaN(parseFloat(body.pay_amount as string)) || parseFloat(body.pay_amount as string) < 0)) {
    errors.push('Invalid pay_amount')
  }
  
  if (body.price_amount && (isNaN(parseFloat(body.price_amount as string)) || parseFloat(body.price_amount as string) < 0)) {
    errors.push('Invalid price_amount')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

interface NOWPaymentsWebhookBody extends Record<string, unknown> {
  event_id?: string
  payment_id?: string
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!checkRateLimit(ip)) {
      console.warn(`⚠️ Rate limit exceeded for IP: ${ip}`)
      return NextResponse.json(
        { success: false, message: 'Rate limit exceeded' },
        { status: 429 }
      )
    }
    
    // Get raw body for signature verification
    const rawBody = await request.text()
    let body: NOWPaymentsWebhookBody

    try {
      body = JSON.parse(rawBody) as NOWPaymentsWebhookBody
    } catch {
      console.error('❌ Invalid JSON in webhook payload')
      return NextResponse.json(
        { success: false, message: 'Invalid JSON payload' },
        { status: 400 }
      )
    }
    
    // Enhanced logging to see exactly what NOWPayments sends
    console.log('🔔 NOWPayments webhook received - FULL PAYLOAD:')
    console.log('📋 Raw webhook body:', JSON.stringify(body, null, 2))
    console.log('📋 Webhook headers:', Object.fromEntries(request.headers.entries()))

    // Enhanced signature verification
    const signature = request.headers.get('x-nowpayments-sig')
    const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET
    
    if (!ipnSecret) {
      console.error('❌ NOWPAYMENTS_IPN_SECRET not configured')
      return NextResponse.json(
        { success: false, message: 'Webhook secret not configured' },
        { status: 500 }
      )
    }
    
    if (!signature) {
      console.warn('⚠️ Webhook received without signature - this may be a security risk')
      // In production, you might want to reject unsigned webhooks
      // return NextResponse.json({ success: false, message: 'Missing signature' }, { status: 401 })
    } else {
      // Verify signature
      const isValidSignature = verifyNOWPaymentsSignature(rawBody, signature, ipnSecret)
      if (!isValidSignature) {
        console.error('❌ Invalid webhook signature')
        return NextResponse.json(
          { success: false, message: 'Invalid signature' },
          { status: 401 }
        )
      }
      console.log('✅ Webhook signature verified')
    }

    // Validate payload structure
    const validation = validateWebhookPayload(body as Record<string, unknown>)
    if (!validation.isValid) {
      console.error('❌ Invalid webhook payload:', validation.errors)
      return NextResponse.json(
        { success: false, message: 'Invalid payload', errors: validation.errors },
        { status: 400 }
      )
    }

    // Extract payment data from webhook with detailed logging
    const {
      payment_id,
      payment_status,
      pay_currency,
      actually_paid,
      price_amount,
      price_currency,
      payout_currency,
      payout_amount,
      outcome,
      // Additional hash fields from NOWPayments
      payin_hash,
      payout_hash,
      type,
      // Check for other possible hash field names
      hash,
      tx_hash,
      transaction_hash,
      payin_extra_id,
      payout_extra_id
    } = body as {
      payment_id: string
      payment_status: string
      pay_currency?: string
      actually_paid?: number
      price_amount?: number
      price_currency?: string
      payout_currency?: string
      payout_amount?: number
        outcome?: { hash?: string }
      payin_hash?: string
      payout_hash?: string
      type?: string
      hash?: string
      tx_hash?: string
      transaction_hash?: string
      payin_extra_id?: string
      payout_extra_id?: string
    }

    // Log all hash-related fields we found
    console.log('🔗 Hash fields analysis:')
    console.log('  - outcome:', outcome)
    console.log('  - payin_hash:', payin_hash)
    console.log('  - payout_hash:', payout_hash)
    console.log('  - hash:', hash)
    console.log('  - tx_hash:', tx_hash)
    console.log('  - transaction_hash:', transaction_hash)
    console.log('  - payin_extra_id:', payin_extra_id)
    console.log('  - payout_extra_id:', payout_extra_id)
    console.log('  - type:', type)
    console.log('  - payment_status:', payment_status)

    // Create Supabase client (use service role for webhooks)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
    }
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      {
        cookies: {
          getAll() {
            return []
          },
          setAll() {
            // No-op for webhooks
          },
        },
      }
    )

    // Find the payment record using the updated column name
    const { data: payment, error: findError } = await supabase
      .from('transactions')
      .select('*')
      .eq('nowpayments_payment_id', payment_id) // UPDATED: Use correct column name
      .single()

    if (findError || !payment) {
      console.error('❌ Payment not found for webhook:', payment_id, findError)
      return NextResponse.json(
        { success: false, message: 'Payment not found' },
        { status: 404 }
      )
    }

    console.log('✅ Payment found for webhook:', {
      id: payment.id,
      current_status: payment.status,
      new_status: payment_status,
    })

    // Prevent duplicate processing
    if (payment.status === 'confirmed' && payment_status === 'confirmed') {
      console.log('ℹ️ Payment already confirmed, skipping duplicate webhook')
      return NextResponse.json({
        success: true,
        message: 'Payment already processed',
        payment_id: payment.id
      })
    }

    // Map NOWPayments status to our status
    let newStatus = payment.status
    switch (payment_status) {
      case 'waiting':
        newStatus = 'waiting'
        break
      case 'confirming':
        newStatus = 'confirming'
        break
      case 'confirmed':
      case 'finished':
        newStatus = 'confirmed'
        break
      case 'failed':
      case 'refunded':
        newStatus = 'failed'
        break
      case 'expired':
        newStatus = 'expired'
        break
      case 'sending':
        newStatus = 'confirming' // Map 'sending' to 'confirming' for our UI
        break
      default:
        console.warn('⚠️ Unknown payment status:', payment_status)
        newStatus = payment_status
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }

    // Enhanced transaction hash logging with all possible sources
    console.log('🔗 Processing transaction hashes from all sources:')
    
    const capturedHashes: {
      payin_hash: string | null
      payout_hash: string | null
      tx_hash: string | null
      source: string
    } = {
      payin_hash: null,
      payout_hash: null,
      tx_hash: null,
      source: 'none'
    }

    // Try to capture payin hash from multiple possible fields
    if (payin_hash) {
      updateData.payin_hash = payin_hash
      capturedHashes.payin_hash = payin_hash
      capturedHashes.source = 'direct_payin_hash'
      console.log('✅ Payin hash captured from payin_hash field:', payin_hash)
    } else if (type === 'payin' && (hash || tx_hash || transaction_hash)) {
      const payinHashValue = (hash || tx_hash || transaction_hash) as string
      updateData.payin_hash = payinHashValue
      capturedHashes.payin_hash = payinHashValue
      capturedHashes.source = 'type_payin_with_hash'
      console.log('✅ Payin hash captured from type=payin with hash:', payinHashValue)
    } else if (outcome && outcome.hash && payment_status === 'confirming') {
      updateData.payin_hash = outcome.hash
      capturedHashes.payin_hash = outcome.hash
      capturedHashes.source = 'outcome_hash_confirming'
      console.log('✅ Payin hash captured from outcome.hash (confirming status):', outcome.hash)
    }

    // Try to capture payout hash from multiple possible fields
    if (payout_hash) {
      updateData.payout_hash = payout_hash
      capturedHashes.payout_hash = payout_hash
      capturedHashes.source = capturedHashes.source + '_direct_payout_hash'
      console.log('✅ Payout hash captured from payout_hash field:', payout_hash)
    } else if (type === 'payout' && (hash || tx_hash || transaction_hash)) {
      const payoutHashValue = (hash || tx_hash || transaction_hash) as string
      updateData.payout_hash = payoutHashValue
      capturedHashes.payout_hash = payoutHashValue
      capturedHashes.source = capturedHashes.source + '_type_payout_with_hash'
      console.log('✅ Payout hash captured from type=payout with hash:', payoutHashValue)
    } else if (outcome && outcome.hash && payment_status === 'confirmed') {
      updateData.payout_hash = outcome.hash
      capturedHashes.payout_hash = outcome.hash
      capturedHashes.source = capturedHashes.source + '_outcome_hash_confirmed'
      console.log('✅ Payout hash captured from outcome.hash (confirmed status):', outcome.hash)
    }

    // Legacy support: if outcome.hash exists, always capture it
    if (outcome && outcome.hash) {
      if (!updateData.payin_hash && !updateData.payout_hash) {
        // If no specific hashes, use outcome.hash as tx_hash
        updateData.tx_hash = outcome.hash
        capturedHashes.tx_hash = outcome.hash
        capturedHashes.source = capturedHashes.source + '_outcome_as_tx_hash'
        console.log('✅ Legacy tx_hash captured from outcome:', outcome.hash)
      } else {
        // If we have specific hashes, use outcome.hash as tx_hash for backward compatibility
        updateData.tx_hash = outcome.hash
        capturedHashes.tx_hash = outcome.hash
        capturedHashes.source = capturedHashes.source + '_outcome_as_primary'
        console.log('✅ Primary tx_hash captured from outcome:', outcome.hash)
      }
    }

    // Determine primary tx_hash based on payment status and available hashes
    if (!updateData.tx_hash) {
      if (newStatus === 'confirmed' && updateData.payout_hash) {
        // For confirmed payments, prefer payout hash as primary
        updateData.tx_hash = updateData.payout_hash
        capturedHashes.tx_hash = updateData.payout_hash as string
        capturedHashes.source = capturedHashes.source + '_payout_as_primary'
        console.log('✅ Using payout_hash as primary tx_hash for confirmed payment')
      } else if (updateData.payin_hash) {
        // For other statuses, use payin hash as primary
        updateData.tx_hash = updateData.payin_hash
        capturedHashes.tx_hash = updateData.payin_hash as string
        capturedHashes.source = capturedHashes.source + '_payin_as_primary'
        console.log('✅ Using payin_hash as primary tx_hash')
      }
    }

    // Log final hash capture summary
    console.log('📊 Final hash capture summary:', capturedHashes)

    // Update received amounts if payment is confirmed
    if (newStatus === 'confirmed' && actually_paid) {
      updateData.amount_received = actually_paid
      updateData.currency_received = pay_currency?.toUpperCase()
      console.log('💰 Payment confirmed - updating received amounts:', {
        amount_received: actually_paid,
        currency_received: pay_currency?.toUpperCase()
      })
    }

    // Update payout information if available
    if (payout_amount && payout_currency) {
      updateData.merchant_receives = payout_amount
      updateData.payout_currency = payout_currency.toUpperCase()
      console.log('💸 Payout information updated:', {
        merchant_receives: payout_amount,
        payout_currency: payout_currency.toUpperCase()
      })
    }

    // Calculate gateway fee if we have the data
    if (price_amount && actually_paid && pay_currency === price_currency) {
      const gatewayFee = Math.max(0, actually_paid - price_amount)
      if (gatewayFee > 0) {
        updateData.gateway_fee = gatewayFee
        console.log('💳 Gateway fee calculated:', gatewayFee)
      }
    }

    // Log what we're about to update in the database
    console.log('💾 Database update data:', updateData)

    // Update the payment record with retry logic
    let updateError: unknown = null
    let retryCount = 0
    const maxRetries = 3
    
    while (retryCount < maxRetries) {
      const { error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', payment.id)
      
      if (!error) {
        updateError = null
        break
      }
      
      updateError = error
      retryCount++
      console.warn(`⚠️ Database update attempt ${retryCount} failed:`, error)
      
      if (retryCount < maxRetries) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
      }
    }

    if (updateError) {
      console.error('❌ Error updating payment from webhook after retries:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to update payment' },
        { status: 500 }
      )
    }

    console.log('✅ Payment updated from webhook:', {
      payment_id: payment.id,
      old_status: payment.status,
      new_status: newStatus,
      tx_hash: updateData.tx_hash,
      payin_hash: updateData.payin_hash,
      payout_hash: updateData.payout_hash,
      amount_received: updateData.amount_received,
      merchant_receives: updateData.merchant_receives,
      hash_source: capturedHashes.source,
      processing_time_ms: Date.now() - startTime
    })

    // If payment is confirmed, trigger post-confirmation actions
    if (newStatus === 'confirmed' && payment.status !== 'confirmed') {
      console.log('🎉 Payment confirmed! Triggering post-confirmation actions...')
      
      // Update payment link usage statistics
      try {
        const { error: incrementError } = await supabase.rpc('increment_payment_link_usage', {
          p_link_id: payment.payment_link_id
        })

        if (incrementError) {
          console.warn('⚠️ Failed to update payment link usage via function:', incrementError)
          // Try alternative approach
          const { data: currentLink } = await supabase
            .from('payment_links')
            .select('current_uses')
            .eq('id', payment.payment_link_id)
            .single()

          if (currentLink) {
            await supabase
              .from('payment_links')
              .update({
                current_uses: (currentLink.current_uses || 0) + 1,
                last_payment_at: new Date().toISOString(),
              })
              .eq('id', payment.payment_link_id)
            console.log('✅ Payment link usage updated via direct query')
          }
        } else {
          console.log('✅ Payment link usage updated via function')
        }
      } catch (linkUpdateError) {
        console.warn('⚠️ Error updating payment link usage:', linkUpdateError)
      }

      // If payment link is tied to a subscription invoice, mark it paid
      try {
        const { data: link } = await supabase
          .from('payment_links')
          .select('id, subscription_id')
          .eq('id', payment.payment_link_id)
          .single()

        if (link && link.subscription_id) {
          const { data: updatedInvoice } = await supabase
            .from('subscription_invoices')
            .update({ status: 'paid', paid_at: new Date().toISOString() })
            .eq('payment_link_id', link.id)
            .neq('status', 'paid')
            .select('id')

          if (updatedInvoice && updatedInvoice.length > 0) {
            const { data: sub } = await supabase
              .from('subscriptions')
              .select('total_cycles')
              .eq('id', link.subscription_id)
              .single()

            await supabase
              .from('subscriptions')
              .update({ total_cycles: (sub?.total_cycles || 0) + 1 })
              .eq('id', link.subscription_id)
          }
        }
      } catch (subError) {
        console.warn('⚠️ Error updating subscription invoice:', subError)
      }
    }

    const eventId = body?.event_id || body?.payment_id || crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex')
    const { data: existingLog } = await supabase
      .from('webhook_logs')
      .select('id, attempts')
      .eq('provider', 'nowpayments')
      .eq('event_id', eventId)
      .maybeSingle()
    if (existingLog) {
      await supabase
        .from('webhook_logs')
        .update({ attempts: (existingLog.attempts || 0) + 1, processed_at: new Date().toISOString() })
        .eq('id', existingLog.id)
    } else {
      await supabase
        .from('webhook_logs')
        .insert({ provider: 'nowpayments', event_id: eventId, attempts: 1, processed_at: new Date().toISOString() })
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      payment_id: payment.id,
      status: newStatus,
      processing_time_ms: Date.now() - startTime,
      hashes_captured: {
        tx_hash: !!updateData.tx_hash,
        payin_hash: !!updateData.payin_hash,
        payout_hash: !!updateData.payout_hash,
        source: capturedHashes.source
      },
      debug_info: {
        webhook_type: type,
        payment_status: payment_status,
        outcome_present: !!outcome,
        outcome_hash: outcome?.hash,
        signature_verified: !!signature,
        raw_hashes: {
          payin_hash,
          payout_hash,
          hash,
          tx_hash,
          transaction_hash
        }
      }
    })

  } catch (error) {
    console.error('❌ Error processing NOWPayments webhook:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Webhook processing failed',
        processing_time_ms: Date.now() - startTime
      },
      { status: 500 }
    )
  }
}

// Handle GET requests (for webhook verification)
export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get('challenge')
  
  if (challenge) {
    console.log('🔍 Webhook verification challenge received')
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  return NextResponse.json({
    success: true,
    message: 'NOWPayments webhook endpoint is active',
    timestamp: new Date().toISOString(),
    security_features: [
      'HMAC-SHA512 signature verification',
      'Rate limiting (100 req/min per IP)',
      'Payload validation',
      'Duplicate processing prevention',
      'Retry logic for database updates'
    ]
  })
}

