import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { env } from '@/lib/env'

// Function to trigger real-time notifications for payment status updates
async function broadcastPaymentUpdate(
  supabase: any,
  paymentId: string,
  updateData: Record<string, unknown>
) {
  try {
    console.log(`📡 Broadcasting real-time update for payment: ${paymentId}`)
    
    // Trigger a real-time notification by sending a message to the payment channel
    // This supplements the automatic database update notifications
    const { error: channelError } = await supabase
      .channel(`payment-${paymentId}`)
      .send({
        type: 'broadcast',
        event: 'payment_status_update',
        payload: {
          payment_id: paymentId,
          status: updateData.status,
          tx_hash: updateData.tx_hash,
          payin_hash: updateData.payin_hash,
          payout_hash: updateData.payout_hash,
          amount_received: updateData.amount_received,
          currency_received: updateData.currency_received,
          merchant_receives: updateData.merchant_receives,
          payout_currency: updateData.payout_currency,
          timestamp: new Date().toISOString()
        }
      })

    if (channelError) {
      console.warn('⚠️ Error broadcasting payment update:', channelError)
    } else {
      console.log('✅ Real-time broadcast sent successfully')
    }
  } catch (error) {
    console.error('❌ Error in broadcastPaymentUpdate:', error)
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
  const validStatuses = ['waiting', 'confirming', 'confirmed', 'finished', 'failed', 'refunded', 'expired', 'sending', 'partially_paid']
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
  order_id?: string
  payment_status?: string
  pay_amount?: string | number
  price_amount?: string | number
  parent_payment_id?: string
}

// FIXED: Enhanced function to send customer email receipts with proper logging
async function sendCustomerReceipts(
  payment: Record<string, unknown>,
  paymentData: Record<string, unknown>
) {
  try {
    console.log('📧 Sending customer email receipts for payment:', payment.id);
    
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      console.error('❌ Service key not available for customer receipts');
      return;
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      {
        cookies: {
          getAll() { return [] },
          setAll() { /* no-op */ },
        },
      }
    );

    // Get payment link details to extract customer contact info
    const { data: paymentLink } = await supabase
      .from('payment_links')
      .select('metadata, title, source')
      .eq('id', payment.payment_link_id)
      .single();

    if (!paymentLink) {
      console.log('ℹ️ No payment link found for customer receipt sending');
      return;
    }

    // Get merchant details for email branding
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id, business_name')
      .eq('id', payment.merchant_id)
      .single();

    if (!merchant) {
      console.error('❌ Merchant not found for receipt email');
      return;
    }

    // Extract customer email information from metadata
    const metadata = (paymentLink.metadata || {}) as {
      customer_email?: string
      send_receipt?: boolean
    }

    const paymentMetadata = payment.metadata as {
      customer_email?: string
    } | undefined

    const customerEmail = metadata.customer_email || paymentMetadata?.customer_email
    const sendReceipt = metadata.send_receipt !== false // Default to true unless explicitly disabled

    if (!sendReceipt) {
      console.log('ℹ️ Customer receipt sending disabled for this payment');
      return;
    }

    if (!customerEmail) {
      console.log('ℹ️ No customer email available for receipt sending');
      return;
    }

    // Prepare receipt data
    const receiptData = {
      payment_id: payment.id,
      payment_link_id: payment.payment_link_id,
      amount: payment.amount,
      currency: payment.currency,
      payment_type: paymentLink.source === 'pos' ? 'POS Sale' :
                   paymentLink.source === 'subscription' ? 'Subscription' : 'Payment Link',
      tx_hash: paymentData.tx_hash || payment.tx_hash,
      pay_currency: paymentData.currency_received || payment.currency_received,
      amount_received: paymentData.amount_received || payment.amount_received,
      title: paymentLink.title || 'Payment',
      public_receipt_id: payment.public_receipt_id,
      status: 'confirmed' // Always show as confirmed in receipt emails
    };

    // FIXED: Send receipt email directly instead of calling API to avoid auth issues
    const sendgridKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.CRYPTRAC_RECEIPTS_FROM;
    const appOrigin = process.env.NEXT_PUBLIC_APP_URL || env.APP_ORIGIN;

    if (!sendgridKey || !fromEmail || !appOrigin) {
      console.warn('⚠️ Email service not fully configured - skipping receipt email');
      return;
    }

    // Generate receipt URL
    const paymentUrl = `${appOrigin}/r/${payment.public_receipt_id}`;

    // Generate email template
    const emailTemplate = generateReceiptEmailTemplate(receiptData, merchant.business_name || 'Cryptrac', paymentUrl);

    // Send email via SendGrid
    let emailStatus = 'queued';
    let errorMessage: string | null = null;

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ 
            to: [{ email: customerEmail }], 
            subject: emailTemplate.subject 
          }],
          from: {
            email: fromEmail,
            name: `${merchant.business_name || 'Cryptrac'} Receipts`
          },
          content: [
            { type: 'text/html', value: emailTemplate.html },
            { type: 'text/plain', value: emailTemplate.text }
          ],
          categories: ['receipt'],
          tracking_settings: {
            click_tracking: { enable: true },
            open_tracking: { enable: true }
          }
        })
      });

      if (response.ok) {
        emailStatus = 'sent';
        console.log('✅ Customer email receipt sent successfully to:', customerEmail);
      } else {
        const errorText = await response.text();
        emailStatus = 'failed';
        errorMessage = `SendGrid error: ${response.status} ${errorText}`;
        console.error('❌ SendGrid error:', errorMessage);
      }
    } catch (err) {
      console.error('❌ Email receipt error:', err);
      emailStatus = 'failed';
      errorMessage = err instanceof Error ? err.message : 'Unknown email error';
    }

    // FIXED: Log email to database with proper error handling
    try {
      const { error: logError } = await supabase.from('email_logs').insert({ 
        email: customerEmail, 
        type: 'receipt', 
        status: emailStatus,
        error_message: errorMessage,
        metadata: {
          merchant_id: merchant.id,
          payment_link_id: payment.payment_link_id,
          transaction_id: payment.id,
          has_receipt_data: true,
          template_used: 'enhanced',
          url_used: paymentUrl,
          url_type: 'receipt'
        }
      });

      if (logError) {
        console.error('❌ Failed to log email to database:', logError);
      } else {
        console.log('✅ Email receipt logged to database successfully');
      }
    } catch (logErr) {
      console.error('❌ Error logging email to database:', logErr);
    }

  } catch (error) {
    console.error('❌ Error in customer receipt sending:', error);
  }
}

// Email template generation function
function generateReceiptEmailTemplate(
  receiptData: Record<string, unknown>,
  merchantName: string,
  paymentUrl: string
): { subject: string; html: string; text: string } {
  const {
    amount,
    currency = 'USD',
    payment_type = 'Payment',
    title = 'Payment',
    tx_hash,
    pay_currency,
    amount_received
  } = receiptData as Record<string, unknown>;

  // Format amounts
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency as string
  }).format(amount as number);

  let receivedAmountText = '';
  if (typeof amount_received === 'number' && typeof pay_currency === 'string') {
    const formattedReceived = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(amount_received);
    receivedAmountText = ` (${formattedReceived} ${pay_currency.toUpperCase()})`;
  }

  const subject = `Receipt for ${title} - ${formattedAmount}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Receipt</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #2c3e50;
            margin: 0;
            font-size: 28px;
        }
        .merchant-name {
            color: #6c757d;
            font-size: 16px;
            margin-top: 5px;
        }
        .receipt-details {
            background: #f8f9fa;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .detail-row:last-child {
            border-bottom: none;
            font-weight: bold;
            font-size: 18px;
            color: #28a745;
        }
        .view-button {
            display: inline-block;
            background: #007bff;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
        }
        .success-icon {
            color: #28a745;
            font-size: 48px;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="success-icon">✓</div>
            <h1>Payment Received</h1>
            <div class="merchant-name">From ${merchantName}</div>
        </div>
        
        <div class="receipt-details">
            <div class="detail-row">
                <span>Payment Type:</span>
                <span>${payment_type}</span>
            </div>
            <div class="detail-row">
                <span>Description:</span>
                <span>${title}</span>
            </div>
            <div class="detail-row">
                <span>Date:</span>
                <span>${new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
            </div>
            <div class="detail-row">
                <span>Status:</span>
                <span>Confirmed</span>
            </div>
            ${receivedAmountText ? `
            <div class="detail-row">
                <span>Amount Paid:</span>
                <span>${receivedAmountText.trim()}</span>
            </div>
            ` : ''}
            <div class="detail-row">
                <span>Total Amount:</span>
                <span>${formattedAmount}${receivedAmountText}</span>
            </div>
        </div>

        ${tx_hash ? `
        <div>
            <strong>Transaction Hash:</strong>
            <div style="background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px; word-break: break-all; margin: 15px 0;">${tx_hash}</div>
        </div>
        ` : ''}

        <div style="text-align: center;">
            <a href="${paymentUrl}" class="view-button">View Your Receipt</a>
        </div>

        <div class="footer">
            <p>Thank you for your payment!</p>
            <p>This is an automated receipt. Please keep this for your records.</p>
            <p>If you have any questions, please contact ${merchantName}.</p>
        </div>
    </div>
</body>
</html>
  `.trim();

  const text = `
Payment Receipt

✓ Payment Received from ${merchantName}

Payment Details:
• Type: ${payment_type}
• Description: ${title}
• Date: ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}
• Status: Confirmed
${receivedAmountText ? `• Amount Paid: ${receivedAmountText.trim()}\n` : ''}• Total Amount: ${formattedAmount}${receivedAmountText}

${tx_hash ? `Transaction Hash: ${tx_hash}\n` : ''}
View your receipt: ${paymentUrl}

Thank you for your payment!
This is an automated receipt. Please keep this for your records.
If you have any questions, please contact ${merchantName}.
  `.trim();

  return { subject, html, text };
}

// Function to send merchant notification email
async function sendMerchantNotification(
  payment: Record<string, unknown>,
  paymentData: Record<string, unknown>
) {
  try {
    console.log('📧 Sending merchant notification for payment:', payment.id);
    
    // Get payment link details to determine payment type
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      console.error('❌ Service key not available for merchant notification');
      return;
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      {
        cookies: {
          getAll() { return [] },
          setAll() { /* no-op */ },
        },
      }
    );

    // Get payment link details
    const { data: paymentLink } = await supabase
      .from('payment_links')
      .select('title, source, metadata')
      .eq('id', payment.payment_link_id)
      .single();

    // Determine payment type
    let paymentType = 'Payment Link';
    if (paymentLink?.source === 'pos') {
      paymentType = 'POS Sale';
    } else if (paymentLink?.source === 'subscription') {
      paymentType = 'Subscription';
    }

    // Extract customer email from metadata if available
    const customerEmail = paymentLink?.metadata?.customer_email ||
      (payment.metadata as { customer_email?: string } | null | undefined)?.customer_email ||
      null;

    // Prepare notification data
    const notificationData = {
      merchant_id: payment.merchant_id,
      payment_id: payment.id,
      payment_link_id: payment.payment_link_id,
      amount: payment.total_paid || payment.amount || 0,
      currency: payment.currency || 'USD',
      payment_type: paymentType,
      customer_email: customerEmail,
      tx_hash: paymentData.tx_hash || payment.tx_hash,
      pay_currency: paymentData.currency_received || payment.currency_received,
      amount_received: paymentData.amount_received || payment.amount_received,
      public_receipt_id: payment.public_receipt_id
    };

    // Call the merchant notification API
    fetch(`${env.APP_ORIGIN}/api/merchants/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(notificationData)
    })
      .then(async (res) => {
        if (res.ok) {
          const result = await res.json();
          console.log('✅ Merchant notification sent:', result);
        } else {
          const error = await res.text();
          console.error('❌ Failed to send merchant notification:', error);
        }
      })
      .catch(err => console.error('❌ Error sending merchant notification:', err));

  } catch (error) {
    console.error('❌ Error sending merchant notification:', error);
  }
}

export async function POST(request: Request) {
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
      // Relationship fields used by NOWPayments when the customer pays
      // with a different coin than requested (crypto2crypto flow)
      parent_payment_id,
      purchase_id,

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
      parent_payment_id?: string | number
      purchase_id?: string | number
    }

    console.log('🔍 Processing webhook for payment ID:', payment_id)

    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return [] },
          setAll() { /* no-op */ },
        },
      }
    )

    // Find the payment record, with fallbacks for crypto2crypto flows
    let paymentLookupReason = 'by nowpayments_payment_id';
    let { data: payment, error: paymentError } = await supabase
      .from('transactions')
      .select('*')
      .eq('nowpayments_payment_id', String(payment_id))
      .single()

    if (paymentError || !payment) {
      console.warn('⚠️ No transaction matched webhook payment_id. Trying parent_payment_id/order_id fallbacks', {
        payment_id,
        parent_payment_id,
      })

      // Fallback 1: match original (parent) NOWPayments payment id
      if (parent_payment_id) {
        const res = await supabase
          .from('transactions')
          .select('*')
          .eq('nowpayments_payment_id', String(parent_payment_id))
          .single()
        payment = res.data as Record<string, unknown> | null
        paymentError = res.error
        if (payment && !paymentError) {
          paymentLookupReason = 'by parent_payment_id';
        }
      }

      // Fallback 2: match by order_id
      if ((!payment || paymentError) && body.order_id) {
        const res = await supabase
          .from('transactions')
          .select('*')
          .eq('order_id', String(body.order_id))
          .single()
        payment = res.data as Record<string, unknown> | null
        paymentError = res.error
        if (payment && !paymentError) {
          paymentLookupReason = 'by order_id';
        }
      }

      if (paymentError || !payment) {
        console.error('❌ Payment not found after fallbacks', {
          payment_id,
          parent_payment_id,
          order_id: body.order_id,
          error: paymentError
        })
        return NextResponse.json(
          { success: false, message: 'Payment not found' },
          { status: 404 }
        )
      }
    }

    console.log('✅ Payment found:', {
      id: payment.id,
      current_status: payment.status,
      webhook_status: payment_status,
      lookup: paymentLookupReason
    })

    // Map NOWPayments status to our internal status
    let newStatus: string
    switch (payment_status) {
      case 'finished':
      case 'confirmed':
        newStatus = 'confirmed'
        break
      case 'confirming':
      case 'sending':
        newStatus = 'confirming'
        break
      case 'waiting':
        newStatus = 'pending'
        break
      case 'partially_paid':
        newStatus = 'confirming' // Treat partial payment as confirming
        break
      case 'failed':
        newStatus = 'failed'
        break
      case 'refunded':
        newStatus = 'refunded'
        break
      case 'expired':
        newStatus = 'expired'
        break
      default:
        console.warn('⚠️ Unknown payment status:', payment_status)
        newStatus = payment_status
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
      // Persist identifiers to help with future investigations
      payment_data: {
        ...(payment.payment_data || {}),
        now_webhook_payment_id: String(payment_id),
        now_parent_payment_id: parent_payment_id ? String(parent_payment_id) : undefined,
        now_purchase_id: purchase_id ? String(purchase_id) : undefined,
      },
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

    // Broadcast real-time update to connected clients
    await broadcastPaymentUpdate(supabase, payment_id, updateData)

    // If payment is confirmed, trigger post-confirmation actions
    if (newStatus === 'confirmed' && payment.status !== 'confirmed') {
      console.log('🎉 Payment confirmed! Triggering post-confirmation actions...')
      
      // FIXED: Send customer email receipts with proper logging
      await sendCustomerReceipts(payment as unknown as Record<string, unknown>, updateData as Record<string, unknown>);
      
      // Send merchant notification email (fire and forget)
      sendMerchantNotification(payment as unknown as Record<string, unknown>, updateData as Record<string, unknown>);
      
      // Update payment link usage statistics
      // DISABLED: This is now handled by the database trigger on transactions table
      // to prevent double-incrementing usage_count
      /*
      try {
        const { error: incrementError } = await supabase.rpc('increment_payment_link_usage', {
          p_link_id: payment.payment_link_id
        })
        
        if (incrementError) {
          console.warn('⚠️ Failed to increment payment link usage:', incrementError)
        } else {
          console.log('✅ Payment link usage incremented')
        }
      } catch (incrementErr) {
        console.warn('⚠️ Exception incrementing payment link usage:', incrementErr)
      }
      */
      console.log('✅ Payment link usage will be incremented by database trigger')

      // Handle subscription auto-resume if applicable
      if (payment.payment_link_id) {
        try {
          const { data: paymentLink } = await supabase
            .from('payment_links')
            .select('source, subscription_id')
            .eq('id', payment.payment_link_id)
            .single()

          if (paymentLink?.source === 'subscription' && paymentLink.subscription_id) {
            console.log('🔄 Checking subscription auto-resume for:', paymentLink.subscription_id)
            
            const { data: subscription } = await supabase
              .from('subscriptions')
              .select('status, auto_resume_on_payment')
              .eq('id', paymentLink.subscription_id)
              .single()

            if (subscription?.status === 'paused' && subscription.auto_resume_on_payment) {
              console.log('🔄 Auto-resuming paused subscription:', paymentLink.subscription_id)
              
              const { error: resumeError } = await supabase
                .from('subscriptions')
                .update({ 
                  status: 'active',
                  updated_at: new Date().toISOString()
                })
                .eq('id', paymentLink.subscription_id)

              if (resumeError) {
                console.error('❌ Failed to auto-resume subscription:', resumeError)
              } else {
                console.log('✅ Subscription auto-resumed successfully')
              }
            }
          }
        } catch (resumeErr) {
          console.warn('⚠️ Error handling subscription auto-resume:', resumeErr)
        }
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      payment_id: payment.id,
      status: newStatus,
      processing_time_ms: Date.now() - startTime
    })

  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
