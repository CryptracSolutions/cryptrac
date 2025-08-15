import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getServiceAndMerchant(request: Request) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return { error: 'Unauthorized' };
  const token = auth.substring(7);
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data: { user } } = await anon.auth.getUser(token);
  if (!user) return { error: 'Unauthorized' };
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
  const service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: merchant } = await service.from('merchants').select('id, business_name').eq('user_id', user.id).single();
  if (!merchant) return { error: 'Merchant not found' };
  return { service, merchant };
}

// ENHANCED: Function to generate professional SMS message
function generateSMSMessage(
  receiptData: Record<string, unknown>,
  merchantName: string,
  paymentUrl: string
): string {
  const {
    amount: rawAmount,
    currency: rawCurrency,
    payment_type: rawPaymentType,
    title: rawTitle,
    pay_currency,
    amount_received
  } = receiptData as Record<string, unknown>;

  const amount = typeof rawAmount === 'number' ? rawAmount : 0;
  const currency = typeof rawCurrency === 'string' ? rawCurrency : 'USD';
  const payment_type = typeof rawPaymentType === 'string' ? rawPaymentType : 'Payment';
  const title = typeof rawTitle === 'string' ? rawTitle : 'Payment';

  // Format amounts
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);

  let receivedAmountText = '';
  if (typeof amount_received === 'number' && typeof pay_currency === 'string') {
    const formattedReceived = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(amount_received);
    receivedAmountText = ` (${formattedReceived} ${pay_currency.toUpperCase()})`;
  }

  // Create professional SMS message (keeping under 160 characters when possible)
  const shortMessage = `✓ Payment confirmed! ${formattedAmount}${receivedAmountText} received by ${merchantName}. View receipt: ${paymentUrl}`;
  
  // If short message is under SMS limit, use it
  if (shortMessage.length <= 160) {
    return shortMessage;
  }

  // Otherwise, create a longer but more detailed message
  const detailedMessage = `✓ Payment Received
${merchantName}

Amount: ${formattedAmount}${receivedAmountText}
Type: ${payment_type}
${title ? `Item: ${title}` : ''}

Receipt: ${paymentUrl}

Thank you for your payment!`;

  return detailedMessage;
}

export async function POST(request: Request) {
  const auth = await getServiceAndMerchant(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  const { service, merchant } = auth;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_FROM_NUMBER;
  const appOrigin = env.APP_ORIGIN;
  
  const { phone, payment_link_id, receipt_data, transaction_id } = await request.json() as {
    phone?: string;
    payment_link_id?: string;
    receipt_data?: Record<string, unknown>;
    transaction_id?: string;
  };
  
  if (!phone) {
    return NextResponse.json({ error: 'Missing required field: phone' }, { status: 400 });
  }

  // FIXED: Enhanced logic to always use receipt URL when possible (same as email API)
  let paymentUrl = '';
  let linkTitle = 'Payment';

  // First priority: Use public_receipt_id from receipt_data if available
  if (receipt_data?.public_receipt_id) {
    paymentUrl = `${appOrigin}/r/${receipt_data.public_receipt_id}`;
    linkTitle = (receipt_data.title as string) || 'Payment';
  }
  // Second priority: Look up public_receipt_id from transaction_id
  else if (transaction_id) {
    const { data: transaction } = await service
      .from('transactions')
      .select('public_receipt_id')
      .eq('id', transaction_id)
      .single();
    
    if (transaction?.public_receipt_id) {
      paymentUrl = `${appOrigin}/r/${transaction.public_receipt_id}`;
    }
  }
  // Third priority: Look up public_receipt_id from payment_link_id
  else if (payment_link_id) {
    // Get the most recent transaction for this payment link to get the receipt ID
    const { data: transaction } = await service
      .from('transactions')
      .select('public_receipt_id')
      .eq('payment_link_id', payment_link_id)
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (transaction?.public_receipt_id) {
      paymentUrl = `${appOrigin}/r/${transaction.public_receipt_id}`;
    }
  }

  // Fallback: If no receipt URL could be generated and we have a payment_link_id, use payment link
  if (!paymentUrl && payment_link_id) {
    const { data: link } = await service
      .from('payment_links')
      .select('link_id, title')
      .eq('id', payment_link_id)
      .eq('merchant_id', merchant.id)
      .single();
      
    if (link) {
      paymentUrl = `${appOrigin}/pay/${link.link_id}`;
      linkTitle = link.title || 'Payment';
      console.warn('⚠️ Using payment link URL as fallback - receipt URL not available');
    }
  }

  // Final fallback: If still no URL, return error
  if (!paymentUrl) {
    return NextResponse.json({ 
      error: 'Unable to generate receipt URL - no payment link or transaction found' 
    }, { status: 404 });
  }
  
  let message: string;
  let status = 'queued';
  let errorMessage = null;

  // ENHANCED: Generate professional SMS message
  if (receipt_data) {
    // Use enhanced message with receipt data
    message = generateSMSMessage(receipt_data, merchant.business_name || 'Cryptrac', paymentUrl);
  } else {
    // Fallback to simple message
    message = `✓ Payment received! View your receipt: ${paymentUrl} - ${merchant.business_name || 'Cryptrac'}`;
  }

  if (twilioSid && twilioToken && twilioFrom && appOrigin) {
    try {
      const creds = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
      
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: { 
          'Authorization': `Basic ${creds}`, 
          'Content-Type': 'application/x-www-form-urlencoded' 
        },
        body: new URLSearchParams({ 
          From: twilioFrom, 
          To: phone, 
          Body: message
        })
      });

      if (response.ok) {
        status = 'sent';
        console.log('✅ SMS receipt sent successfully to:', phone);
      } else {
        const errorText = await response.text();
        status = 'failed';
        errorMessage = `Twilio error: ${response.status} ${errorText}`;
        console.error('❌ Twilio error:', errorMessage);
      }
    } catch (err) {
      console.error('❌ SMS receipt error:', err);
      status = 'failed';
      errorMessage = err instanceof Error ? err.message : 'Unknown SMS error';
    }
  } else {
    console.warn('⚠️ SMS service not fully configured - receipt will be queued');
  }

  // Enhanced logging with more details
  await service.from('sms_logs').insert({ 
    merchant_id: merchant.id, 
    phone, 
    type: 'receipt', 
    status,
    error_message: errorMessage,
    payload: { 
      message, 
      link_id: payment_link_id,
      transaction_id,
      message_length: message.length,
      has_receipt_data: !!receipt_data,
      template_used: receipt_data ? 'enhanced' : 'basic',
      url_used: paymentUrl,
      url_type: paymentUrl.includes('/r/') ? 'receipt' : 'payment_link'
    }
  });

  return NextResponse.json({ 
    success: status === 'sent', 
    status,
    queued: status !== 'sent',
    message: status === 'sent' 
      ? 'SMS receipt sent successfully'
      : status === 'queued'
      ? 'SMS receipt queued (service not configured)'
      : 'Failed to send SMS receipt',
    error: errorMessage,
    sms_length: message.length,
    url_used: paymentUrl,
    url_type: paymentUrl.includes('/r/') ? 'receipt' : 'payment_link'
  });
}

