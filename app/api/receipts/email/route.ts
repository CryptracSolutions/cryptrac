import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Unified Receipt Email Template for Cryptrac
interface ReceiptData {
  amount: number;
  currency: string;
  payment_method: string;
  title: string;
  tx_hash?: string;
  payin_hash?: string;
  payout_hash?: string;
  pay_currency?: string;
  amount_received?: number;
  status: string;
  created_at?: string;
  order_id?: string;
  transaction_id?: string;
}

interface MerchantData {
  business_name: string;
  logo_url?: string;
}

function generateUnifiedReceiptTemplate(
  receiptData: ReceiptData,
  merchantData: MerchantData,
  receiptUrl: string
): { subject: string; html: string; text: string } {
  const {
    amount,
    currency = 'USD',
    payment_method,
    title,
    tx_hash,
    payin_hash,
    payout_hash,
    pay_currency,
    amount_received,
    status = 'confirmed',
    created_at,
    order_id,
    transaction_id
  } = receiptData;

  const merchantName = merchantData.business_name || 'Cryptrac Merchant';

  // Format amounts
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);

  let receivedAmountText = '';
  if (typeof amount_received === 'number' && typeof pay_currency === 'string') {
    const formattedReceived = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(amount_received);
    receivedAmountText = ` (${formattedReceived} ${pay_currency.toUpperCase()})`;
  }

  // Format date with proper timezone handling
  const formattedDate = created_at ? 
    new Date(created_at).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }) : 
    new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

  // Status display
  const displayStatus = status === 'confirmed' ? 'Confirmed' : 
                       status === 'confirming' ? 'Confirming' :
                       typeof status === 'string' ? status.charAt(0).toUpperCase() + status.slice(1) : 'Confirmed';

  const subject = `Receipt for ${title} - ${formattedAmount}`;

  // Determine which hash to show - prioritize tx_hash, then payin_hash for customer receipts
  let displayHash = '';
  let hashLabel = '';
  
  if (tx_hash) {
    displayHash = tx_hash;
    hashLabel = 'Transaction Hash';
  } else if (payin_hash) {
    displayHash = payin_hash;
    hashLabel = 'Transaction Hash';
  }

  // Unified HTML template
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
        .success-icon {
            color: #28a745;
            font-size: 48px;
            margin-bottom: 10px;
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
        .detail-label {
            font-weight: 600;
            color: #495057;
        }
        .detail-value {
            color: #212529;
        }
        .transaction-hash {
            background: #e9ecef;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            word-break: break-all;
            margin: 15px 0;
        }
        .hash-section {
            margin: 15px 0;
        }
        .hash-label {
            font-weight: 600;
            color: #495057;
            margin-bottom: 5px;
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
        @media (max-width: 600px) {
            .detail-row {
                flex-direction: column;
                align-items: flex-start;
            }
            .detail-value {
                margin-top: 4px;
            }
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
                <span class="detail-label">Payment Method:</span>
                <span class="detail-value">${payment_method}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Description:</span>
                <span class="detail-value">${title}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${formattedDate}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">${displayStatus}</span>
            </div>
            ${order_id ? `
            <div class="detail-row">
                <span class="detail-label">Order ID:</span>
                <span class="detail-value">${order_id}</span>
            </div>
            ` : ''}
            ${transaction_id ? `
            <div class="detail-row">
                <span class="detail-label">Transaction ID:</span>
                <span class="detail-value">${transaction_id}</span>
            </div>
            ` : ''}
            ${receivedAmountText ? `
            <div class="detail-row">
                <span class="detail-label">Amount Paid:</span>
                <span class="detail-value">${receivedAmountText.trim()}</span>
            </div>
            ` : ''}
            <div class="detail-row">
                <span class="detail-label">Total Amount:</span>
                <span class="detail-value">${formattedAmount}${receivedAmountText}</span>
            </div>
        </div>

        ${displayHash ? `
        <div class="hash-section">
            <div class="hash-label">${hashLabel}:</div>
            <div class="transaction-hash">${displayHash}</div>
        </div>
        ` : ''}

        <div style="text-align: center;">
            <a href="${receiptUrl}" class="view-button">View Your Receipt</a>
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

  // Plain text version
  const text = `
Payment Receipt

✓ Payment Received from ${merchantName}

Payment Details:
• Method: ${payment_method}
• Description: ${title}
• Date: ${formattedDate}
• Status: ${displayStatus}
${order_id ? `• Order ID: ${order_id}\n` : ''}${transaction_id ? `• Transaction ID: ${transaction_id}\n` : ''}${receivedAmountText ? `• Amount Paid: ${receivedAmountText.trim()}\n` : ''}• Total Amount: ${formattedAmount}${receivedAmountText}

${displayHash ? `${hashLabel}: ${displayHash}\n` : ''}
View your receipt: ${receiptUrl}

Thank you for your payment!
This is an automated receipt. Please keep this for your records.
If you have any questions, please contact ${merchantName}.
  `.trim();

  return { subject, html, text };
}

// Helper function to determine payment method label based on source
function getPaymentMethodLabel(source: string, created_at?: string): string {
  const currentDate = created_at ? new Date(created_at) : new Date();
  const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  switch (source?.toLowerCase()) {
    case 'subscription':
    case 'subscriptions':
      return `Invoice ${dateString}`;
    case 'pos':
    case 'terminal':
    case 'smart-terminal':
      return 'POS Sale';
    case 'payment-link':
    case 'payment_link':
    case 'link':
    default:
      return 'Payment Link';
  }
}

// Helper function to log email to database
async function logEmailToDatabase(
  supabase: any,
  emailData: {
    email: string;
    type: string;
    status: 'sent' | 'failed' | 'queued';
    error_message?: string;
    metadata?: Record<string, any>;
  }
) {
  try {
    const { data, error } = await supabase.from('email_logs').insert({
      email: emailData.email,
      type: emailData.type,
      status: emailData.status,
      error_message: emailData.error_message || undefined,
      metadata: emailData.metadata || undefined
    });

    if (error) {
      console.error('❌ Failed to log email to database:', error);
      return false;
    }

    console.log('✅ Email logged to database successfully');
    return true;
  } catch (error) {
    console.error('❌ Error logging email to database:', error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, payment_link_id, transaction_id } = body;

    console.log('📧 Receipt email request:', { email, payment_link_id, transaction_id });

    if (!email) {
      return Response.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json({ success: false, error: 'Invalid email format' }, { status: 400 });
    }

    // Use service role key for database access
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required');
      return Response.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    const service = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    let receipt_data: any = null;
    let merchant: any = null;
    let paymentUrl = '';

    // Strategy 1: Get data from payment_link_id
    if (payment_link_id) {
      console.log('🔍 Looking up data from payment_link_id:', payment_link_id);
      
      // Get payment link data
      const { data: paymentLink } = await service
        .from('payment_links')
        .select('link_id, title, source, merchant_id, merchants!inner(business_name)')
        .eq('id', payment_link_id)
        .single();

      if (paymentLink) {
        merchant = paymentLink.merchants;
        
        // Get most recent transaction for this payment link
        const { data: transaction } = await service
          .from('transactions')
          .select('public_receipt_id, amount, currency, status, created_at, order_id, tx_hash, payin_hash, payout_hash, pay_currency, amount_received, id')
          .eq('payment_link_id', payment_link_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (transaction?.public_receipt_id) {
          const appOrigin = env.APP_ORIGIN || process.env.NEXT_PUBLIC_APP_URL || 'https://www.cryptrac.com';
          paymentUrl = `${appOrigin}/r/${transaction.public_receipt_id}`;
          receipt_data = {
            ...transaction,
            title: paymentLink.title,
            payment_method: getPaymentMethodLabel(paymentLink.source, transaction.created_at)
          };
          console.log('✅ Found transaction data from payment_link_id');
        }
      }
    }

    // Strategy 2: Get data from transaction_id
    if (!receipt_data && transaction_id) {
      console.log('🔍 Looking up data from transaction_id:', transaction_id);
      
      const { data: transaction } = await service
        .from('transactions')
        .select(`
          public_receipt_id, amount, currency, status, created_at, order_id, 
          tx_hash, payin_hash, payout_hash, pay_currency, amount_received, id,
          payment_link_id
        `)
        .eq('id', transaction_id)
        .single();

      if (transaction?.public_receipt_id && transaction.payment_link_id) {
        // Get payment link and merchant data separately
        const { data: paymentLink } = await service
          .from('payment_links')
          .select('title, source, merchant_id, merchants!inner(business_name)')
          .eq('id', transaction.payment_link_id)
          .single();

        if (paymentLink?.merchants) {
          const appOrigin = env.APP_ORIGIN || process.env.NEXT_PUBLIC_APP_URL || 'https://www.cryptrac.com';
          paymentUrl = `${appOrigin}/r/${transaction.public_receipt_id}`;
          merchant = paymentLink.merchants;
          receipt_data = {
            ...transaction,
            title: paymentLink.title,
            payment_method: getPaymentMethodLabel(paymentLink.source, transaction.created_at)
          };
          console.log('✅ Found transaction data from transaction_id');
        }
      }
    }

    if (!receipt_data || !merchant || !paymentUrl) {
      console.error('❌ Could not find transaction data or merchant information');
      return Response.json({ 
        success: false, 
        error: 'Could not generate receipt. Please contact support.' 
      }, { status: 400 });
    }

    // Prepare receipt data for unified template
    const receiptDataForTemplate: ReceiptData = {
      amount: receipt_data.amount || 0,
      currency: receipt_data.currency || 'USD',
      payment_method: receipt_data.payment_method,
      title: receipt_data.title || 'Payment',
      tx_hash: receipt_data.tx_hash,
      payin_hash: receipt_data.payin_hash,
      payout_hash: receipt_data.payout_hash,
      pay_currency: receipt_data.pay_currency,
      amount_received: receipt_data.amount_received,
      status: 'confirmed',
      created_at: receipt_data.created_at,
      order_id: receipt_data.order_id,
      transaction_id: receipt_data.id || transaction_id
    };

    const merchantDataForTemplate: MerchantData = {
      business_name: merchant.business_name || 'Cryptrac Merchant'
    };

    // Generate email template using unified template
    const emailTemplate = generateUnifiedReceiptTemplate(
      receiptDataForTemplate,
      merchantDataForTemplate,
      paymentUrl
    );

    // Send email via SendGrid
    const sendgridKey = process.env.SENDGRID_API_KEY;
    if (!sendgridKey) {
      console.error('❌ SENDGRID_API_KEY is required');
      return Response.json({ success: false, error: 'Email service not configured' }, { status: 500 });
    }

    // FIXED: Correct SendGrid content order - text/plain MUST come first
    const emailPayload = {
      personalizations: [
        {
          to: [{ email: email }],
          subject: emailTemplate.subject
        }
      ],
      from: { 
        email: 'receipts@cryptrac.com',
        name: 'Cryptrac Receipts'
      },
      content: [
        { type: 'text/plain', value: emailTemplate.text },  // MUST be first
        { type: 'text/html', value: emailTemplate.html }    // MUST be second
      ],
      categories: ['receipt'],
      tracking_settings: {
        click_tracking: { enable: true },
        open_tracking: { enable: true }
      }
    };

    console.log('📤 Sending email via SendGrid to:', email);
    const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    let status: 'sent' | 'failed' | 'queued' = 'queued';
    let errorMessage: string | undefined = undefined;

    if (emailResponse.ok) {
      status = 'sent';
      console.log('✅ Email sent successfully to:', email);
    } else {
      const errorText = await emailResponse.text();
      console.error('❌ SendGrid error:', emailResponse.status, errorText);
      status = 'failed';
      errorMessage = `SendGrid error: ${emailResponse.status} - ${errorText}`;
      return Response.json({ 
        success: false, 
        error: 'Failed to send email. Please try again.' 
      }, { status: 500 });
    }

    // Enhanced logging with more details - ALWAYS log to email_logs table
    await logEmailToDatabase(service, {
      email,
      type: 'receipt',
      status: status,
      error_message: errorMessage,
      metadata: {
        merchant_id: merchant.id || null,
        payment_link_id,
        transaction_id: receipt_data.id || transaction_id || null,
        has_receipt_data: !!receipt_data,
        template_used: 'unified',
        url_used: paymentUrl,
        payment_method: receipt_data.payment_method
      }
    });

    return Response.json({ 
      success: true, 
      message: 'Receipt sent successfully',
      payment_url: paymentUrl
    });

  } catch (error) {
    console.error('❌ Receipt email error:', error);
    return Response.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

