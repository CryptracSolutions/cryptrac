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

  // Format date
  const formattedDate = created_at ? 
    new Date(created_at).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 
    new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  // Status display
  const displayStatus = status === 'confirmed' ? 'Confirmed' : 
                       status === 'confirming' ? 'Confirming' :
                       typeof status === 'string' ? status.charAt(0).toUpperCase() + status.slice(1) : 'Confirmed';

  const subject = `Receipt for ${title} - ${formattedAmount}`;

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

        ${tx_hash ? `
        <div class="hash-section">
            <div class="hash-label">Transaction Hash:</div>
            <div class="transaction-hash">${tx_hash}</div>
        </div>
        ` : ''}

        ${payin_hash ? `
        <div class="hash-section">
            <div class="hash-label">Payin Hash (Customer Transaction):</div>
            <div class="transaction-hash">${payin_hash}</div>
        </div>
        ` : ''}

        ${payout_hash ? `
        <div class="hash-section">
            <div class="hash-label">Payout Hash (Merchant Transaction):</div>
            <div class="transaction-hash">${payout_hash}</div>
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

${tx_hash ? `Transaction Hash: ${tx_hash}\n` : ''}${payin_hash ? `Payin Hash (Customer Transaction): ${payin_hash}\n` : ''}${payout_hash ? `Payout Hash (Merchant Transaction): ${payout_hash}\n` : ''}
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
    const { payment_id, email, transaction_id, payment_link_id } = body;

    console.log('📧 Customer receipt request:', { payment_id, email, transaction_id, payment_link_id });

    if (!email) {
      return Response.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json({ success: false, error: 'Invalid email format' }, { status: 400 });
    }

    // Use service role key for database access (no authentication required for customers)
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

    // Enhanced URL generation logic with multiple fallback strategies
    let paymentUrl = '';
    let receipt_data: any = null;
    let merchant_data: any = null;
    let payment_link_data: any = null;
    let urlType = 'unknown';

    // Strategy 1: Use public_receipt_id from receipt_data if available
    if (body.receipt_data?.public_receipt_id) {
      const appOrigin = env.APP_ORIGIN || process.env.NEXT_PUBLIC_APP_URL || 'https://www.cryptrac.com';
      paymentUrl = `${appOrigin}/r/${body.receipt_data.public_receipt_id}`;
      receipt_data = body.receipt_data;
      urlType = 'receipt';
      console.log('✅ Using receipt_data.public_receipt_id for URL generation');
    }
    // Strategy 2: Look up public_receipt_id from transaction_id if provided
    else if (transaction_id) {
      console.log('🔍 Looking up public_receipt_id from transaction_id:', transaction_id);
      const { data: transaction } = await service
        .from('transactions')
        .select('public_receipt_id, payment_link_id, merchant_id, amount, currency, status, created_at, order_id, tx_hash, payin_hash, payout_hash, pay_currency, amount_received')
        .eq('id', transaction_id)
        .single();

      if (transaction?.public_receipt_id) {
        const appOrigin = env.APP_ORIGIN || process.env.NEXT_PUBLIC_APP_URL || 'https://www.cryptrac.com';
        paymentUrl = `${appOrigin}/r/${transaction.public_receipt_id}`;
        receipt_data = transaction;
        urlType = 'receipt';
        console.log('✅ Found public_receipt_id from transaction_id');
      }
    }
    // Strategy 3: Query database for most recent transaction with payment_link_id to get public_receipt_id
    else if (payment_link_id) {
      console.log('🔍 Looking up public_receipt_id from payment_link_id:', payment_link_id);
      
      // Get payment link data first
      const { data: link } = await service
        .from('payment_links')
        .select('link_id, title, source, merchant_id')
        .eq('id', payment_link_id)
        .single();
      
      if (link) {
        payment_link_data = link;
      }

      const { data: transaction } = await service
        .from('transactions')
        .select('public_receipt_id, payment_link_id, merchant_id, amount, currency, status, created_at, order_id, tx_hash, payin_hash, payout_hash, pay_currency, amount_received')
        .eq('payment_link_id', payment_link_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (transaction?.public_receipt_id) {
        const appOrigin = env.APP_ORIGIN || process.env.NEXT_PUBLIC_APP_URL || 'https://www.cryptrac.com';
        paymentUrl = `${appOrigin}/r/${transaction.public_receipt_id}`;
        receipt_data = transaction;
        urlType = 'receipt';
        console.log('✅ Found public_receipt_id from payment_link_id');
      }
    }
    // Strategy 4: Look up public_receipt_id from payment_id if provided
    else if (payment_id) {
      console.log('🔍 Looking up public_receipt_id from payment_id:', payment_id);
      const { data: transaction } = await service
        .from('transactions')
        .select('public_receipt_id, payment_link_id, merchant_id, amount, currency, status, created_at, order_id, tx_hash, payin_hash, payout_hash, pay_currency, amount_received')
        .eq('id', payment_id)
        .single();

      if (transaction?.public_receipt_id) {
        const appOrigin = env.APP_ORIGIN || process.env.NEXT_PUBLIC_APP_URL || 'https://www.cryptrac.com';
        paymentUrl = `${appOrigin}/r/${transaction.public_receipt_id}`;
        receipt_data = transaction;
        urlType = 'receipt';
        console.log('✅ Found public_receipt_id from payment_id');
      }
    }

    // If no receipt URL could be generated, return error
    if (!paymentUrl) {
      console.error('❌ Could not generate receipt URL - no valid identifiers provided');
      return Response.json({ 
        success: false, 
        error: 'Could not generate receipt URL. Please contact support.' 
      }, { status: 400 });
    }

    // Get merchant information if we have receipt_data
    if (receipt_data?.merchant_id) {
      const { data: merchant } = await service
        .from('merchants')
        .select('business_name, logo_url')
        .eq('id', receipt_data.merchant_id)
        .single();
      
      merchant_data = merchant;
    } else if (payment_link_data?.merchant_id) {
      const { data: merchant } = await service
        .from('merchants')
        .select('business_name, logo_url')
        .eq('id', payment_link_data.merchant_id)
        .single();
      
      merchant_data = merchant;
    } else if (receipt_data?.payment_link_id) {
      // Get merchant info through payment link
      const { data: paymentLink } = await service
        .from('payment_links')
        .select('merchant_id, merchants(business_name, logo_url)')
        .eq('id', receipt_data.payment_link_id)
        .single();
      
      if (paymentLink?.merchants) {
        merchant_data = paymentLink.merchants;
      }
    }

    const merchantName = merchant_data?.business_name || 'Cryptrac Merchant';

    // Prepare receipt data for unified template
    const receiptDataForTemplate: ReceiptData = {
      amount: receipt_data?.amount || 0,
      currency: receipt_data?.currency || 'USD',
      payment_method: getPaymentMethodLabel(
        payment_link_data?.source || 'payment_link',
        receipt_data?.created_at
      ),
      title: payment_link_data?.title || 'Payment',
      tx_hash: receipt_data?.tx_hash,
      payin_hash: receipt_data?.payin_hash,
      payout_hash: receipt_data?.payout_hash,
      pay_currency: receipt_data?.pay_currency,
      amount_received: receipt_data?.amount_received,
      status: 'confirmed', // Always show as confirmed in receipt emails
      created_at: receipt_data?.created_at,
      order_id: receipt_data?.order_id,
      transaction_id: receipt_data?.id || transaction_id || payment_id
    };

    const merchantDataForTemplate: MerchantData = {
      business_name: merchantName
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
        { type: 'text/plain', value: emailTemplate.text },
        { type: 'text/html', value: emailTemplate.html }
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

    let emailStatus: 'sent' | 'failed' = 'sent';
    let errorMessage: string | null = null;

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('❌ SendGrid error:', emailResponse.status, errorText);
      emailStatus = 'failed';
      errorMessage = `SendGrid error: ${emailResponse.status} - ${errorText}`;
      return Response.json({ 
        success: false, 
        error: 'Failed to send email. Please try again.' 
      }, { status: 500 });
    }

    console.log('✅ Email sent successfully to:', email);

    // Log email to database - ALWAYS log to email_logs table
    await logEmailToDatabase(service, {
      email: email,
      type: 'customer_receipt',
      status: emailStatus,
      error_message: errorMessage || undefined,
      metadata: {
        url_type: urlType,
        payment_url: paymentUrl,
        merchant_id: receipt_data?.merchant_id || payment_link_data?.merchant_id || null,
        payment_link_id: receipt_data?.payment_link_id || payment_link_id || null,
        transaction_id: receipt_data?.id || transaction_id || payment_id || null,
        template_used: 'unified',
        payment_method: receiptDataForTemplate.payment_method
      }
    });

    return Response.json({ 
      success: true, 
      message: 'Receipt sent successfully',
      url_type: urlType,
      payment_url: paymentUrl
    });

  } catch (error) {
    console.error('❌ Customer receipt email error:', error);
    return Response.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

