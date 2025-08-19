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
  const auth = await getServiceAndMerchant(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  const { service, merchant } = auth;
  const sendgridKey = env.SENDGRID_API_KEY;
  const fromEmail = env.CRYPTRAC_RECEIPTS_FROM;
  const appOrigin = env.APP_ORIGIN;
  
  const { email, payment_link_id, receipt_data, transaction_id } = await request.json() as {
    email?: string;
    payment_link_id?: string;
    receipt_data?: Record<string, unknown>;
    transaction_id?: string;
  };
  
  if (!email) {
    return NextResponse.json({ error: 'Missing required field: email' }, { status: 400 });
  }

  // Enhanced logic to get transaction data and receipt URL
  let paymentUrl = '';
  let linkTitle = 'Payment';
  let transactionData: any = null;
  let paymentLinkData: any = null;

  // First priority: Use public_receipt_id from receipt_data if available
  if (receipt_data?.public_receipt_id) {
    paymentUrl = `${appOrigin}/r/${receipt_data.public_receipt_id}`;
    linkTitle = (receipt_data.title as string) || 'Payment';
    transactionData = receipt_data;
  }
  // Second priority: Look up public_receipt_id from transaction_id
  else if (transaction_id) {
    const { data: transaction } = await service
      .from('transactions')
      .select('public_receipt_id, payment_link_id, amount, currency, status, created_at, order_id, tx_hash, payin_hash, payout_hash, pay_currency, amount_received')
      .eq('id', transaction_id)
      .single();
    
    if (transaction?.public_receipt_id) {
      paymentUrl = `${appOrigin}/r/${transaction.public_receipt_id}`;
      transactionData = transaction;
    }
  }
  // Third priority: Look up public_receipt_id from payment_link_id
  else if (payment_link_id) {
    // Get payment link data first
    const { data: link } = await service
      .from('payment_links')
      .select('link_id, title, source')
      .eq('id', payment_link_id)
      .eq('merchant_id', merchant.id)
      .single();
    
    if (link) {
      paymentLinkData = link;
      linkTitle = link.title || 'Payment';
    }

    // Get the most recent transaction for this payment link to get the receipt ID
    const { data: transaction } = await service
      .from('transactions')
      .select('public_receipt_id, amount, currency, status, created_at, order_id, tx_hash, payin_hash, payout_hash, pay_currency, amount_received')
      .eq('payment_link_id', payment_link_id)
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (transaction?.public_receipt_id) {
      paymentUrl = `${appOrigin}/r/${transaction.public_receipt_id}`;
      transactionData = transaction;
    }
  }

  // Fallback: If no receipt URL could be generated and we have a payment_link_id, use payment link
  if (!paymentUrl && payment_link_id && paymentLinkData) {
    paymentUrl = `${appOrigin}/pay/${paymentLinkData.link_id}`;
    console.warn('⚠️ Using payment link URL as fallback - receipt URL not available');
  }

  // Final fallback: If still no URL, return error
  if (!paymentUrl) {
    return NextResponse.json({ 
      error: 'Unable to generate receipt URL - no payment link or transaction found' 
    }, { status: 404 });
  }
  
  let status = 'queued';
  let errorMessage = null;

  if (sendgridKey && fromEmail && appOrigin) {
    try {
      // Prepare receipt data for unified template
      const receiptDataForTemplate: ReceiptData = {
        amount: transactionData?.amount || receipt_data?.amount || 0,
        currency: transactionData?.currency || receipt_data?.currency || 'USD',
        payment_method: getPaymentMethodLabel(
          paymentLinkData?.source || receipt_data?.source || 'payment_link',
          transactionData?.created_at || receipt_data?.created_at
        ),
        title: linkTitle,
        tx_hash: transactionData?.tx_hash || receipt_data?.tx_hash,
        payin_hash: transactionData?.payin_hash || receipt_data?.payin_hash,
        payout_hash: transactionData?.payout_hash || receipt_data?.payout_hash,
        pay_currency: transactionData?.pay_currency || receipt_data?.pay_currency,
        amount_received: transactionData?.amount_received || receipt_data?.amount_received,
        status: 'confirmed', // Always show as confirmed in receipt emails
        created_at: transactionData?.created_at || receipt_data?.created_at,
        order_id: transactionData?.order_id || receipt_data?.order_id,
        transaction_id: transaction_id
      };

      const merchantDataForTemplate: MerchantData = {
        business_name: merchant.business_name || 'Cryptrac'
      };

      // Use unified template
      const template = generateUnifiedReceiptTemplate(
        receiptDataForTemplate,
        merchantDataForTemplate,
        paymentUrl
      );

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ 
            to: [{ email }], 
            subject: template.subject 
          }],
          from: {
            email: fromEmail,
            name: `${merchant.business_name || 'Cryptrac'} Receipts`
          },
          content: [
            { type: 'text/html', value: template.html },
            { type: 'text/plain', value: template.text }
          ],
          categories: ['receipt'],
          tracking_settings: {
            click_tracking: { enable: true },
            open_tracking: { enable: true }
          },
          mail_settings: {
            footer: {
              enable: true,
              text: `\n\nSent by ${merchant.business_name || 'Cryptrac'}`
            }
          }
        })
      });

      if (response.ok) {
        status = 'sent';
        console.log('✅ Email receipt sent successfully to:', email);
      } else {
        const errorText = await response.text();
        status = 'failed';
        errorMessage = `SendGrid error: ${response.status} ${errorText}`;
        console.error('❌ SendGrid error:', errorMessage);
      }
    } catch (err) {
      console.error('❌ Email receipt error:', err);
      status = 'failed';
      errorMessage = err instanceof Error ? err.message : 'Unknown email error';
    }
  } else {
    console.warn('⚠️ Email service not fully configured - receipt will be queued');
  }

  // Enhanced logging with more details - ALWAYS log to email_logs table
  await logEmailToDatabase(service, {
    email,
    type: 'receipt',
    status: status as 'sent' | 'failed' | 'queued',
    error_message: errorMessage || undefined,
    metadata: {
      merchant_id: merchant.id,
      payment_link_id,
      transaction_id,
      has_receipt_data: !!receipt_data,
      template_used: 'unified',
      url_used: paymentUrl,
      url_type: paymentUrl.includes('/r/') ? 'receipt' : 'payment_link',
      payment_method: getPaymentMethodLabel(
        paymentLinkData?.source || receipt_data?.source || 'payment_link',
        transactionData?.created_at || receipt_data?.created_at
      )
    }
  });

  return NextResponse.json({ 
    success: status === 'sent', 
    status,
    queued: status !== 'sent',
    message: status === 'sent' 
      ? 'Email receipt sent successfully'
      : status === 'queued'
      ? 'Email receipt queued (service not configured)'
      : 'Failed to send email receipt',
    error: errorMessage,
    url_used: paymentUrl,
    url_type: paymentUrl.includes('/r/') ? 'receipt' : 'payment_link'
  });
}

