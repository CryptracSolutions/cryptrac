import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function getServiceAndMerchant(request: NextRequest) {
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

// ENHANCED: Function to generate professional HTML email template
function generateEmailTemplate(receiptData: any, merchantName: string, paymentUrl: string): { subject: string; html: string; text: string } {
  const {
    amount,
    currency = 'USD',
    payment_type = 'Payment',
    title = 'Payment',
    tx_hash,
    pay_currency,
    amount_received
  } = receiptData;

  // Format amounts
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);

  let receivedAmountText = '';
  if (amount_received && pay_currency) {
    const formattedReceived = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(amount_received);
    receivedAmountText = ` (${formattedReceived} ${pay_currency.toUpperCase()})`;
  }

  const subject = `Receipt for ${title} - ${formattedAmount}`;

  // Professional HTML template
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
                <span class="detail-label">Payment Type:</span>
                <span class="detail-value">${payment_type}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Description:</span>
                <span class="detail-value">${title}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
            </div>
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
        <div>
            <strong>Transaction Hash:</strong>
            <div class="transaction-hash">${tx_hash}</div>
        </div>
        ` : ''}

        <div style="text-align: center;">
            <a href="${paymentUrl}" class="view-button">View Full Receipt</a>
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
• Type: ${payment_type}
• Description: ${title}
• Date: ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}
${receivedAmountText ? `• Amount Paid: ${receivedAmountText.trim()}\n` : ''}• Total Amount: ${formattedAmount}${receivedAmountText}

${tx_hash ? `Transaction Hash: ${tx_hash}\n` : ''}
View full receipt: ${paymentUrl}

Thank you for your payment!
This is an automated receipt. Please keep this for your records.
If you have any questions, please contact ${merchantName}.
  `.trim();

  return { subject, html, text };
}

export async function POST(request: NextRequest) {
  const auth = await getServiceAndMerchant(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  const { service, merchant } = auth;
  const sendgridKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.CRYPTRAC_RECEIPTS_FROM || process.env.SENDGRID_FROM_EMAIL;
  const appOrigin = process.env.APP_ORIGIN || process.env.NEXT_PUBLIC_APP_URL;
  
  const requestBody = await request.json();
  const { email, payment_link_id, receipt_data } = requestBody;
  
  if (!email || !payment_link_id) {
    return NextResponse.json({ error: 'Missing required fields: email and payment_link_id' }, { status: 400 });
  }

  const { data: link } = await service
    .from('payment_links')
    .select('link_id, title')
    .eq('id', payment_link_id)
    .eq('merchant_id', merchant.id)
    .single();
    
  if (!link) {
    return NextResponse.json({ error: 'Payment link not found' }, { status: 404 });
  }

  const paymentUrl = `${appOrigin}/pay/${link.link_id}`;
  
  let status = 'queued';
  let errorMessage = null;

  if (sendgridKey && fromEmail && appOrigin) {
    try {
      // ENHANCED: Use professional email template if receipt_data is provided
      let emailContent;
      let subject;

      if (receipt_data) {
        // Use enhanced template with receipt data
        const template = generateEmailTemplate(receipt_data, merchant.business_name || 'Cryptrac', paymentUrl);
        subject = template.subject;
        emailContent = [
          { type: 'text/html', value: template.html },
          { type: 'text/plain', value: template.text }
        ];
      } else {
        // Fallback to simple template
        subject = `Your receipt - ${link.title || 'Payment'}`;
        emailContent = [
          { type: 'text/plain', value: `Thank you for your payment!\n\nView your receipt: ${paymentUrl}\n\nBest regards,\n${merchant.business_name || 'Cryptrac'}` }
        ];
      }

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ 
            to: [{ email }], 
            subject: subject 
          }],
          from: { 
            email: fromEmail, 
            name: merchant.business_name || 'Cryptrac'
          },
          content: emailContent,
          // Add tracking and branding
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

  // Enhanced logging with more details
  await service.from('email_logs').insert({ 
    email, 
    type: 'receipt', 
    status,
    error_message: errorMessage,
    metadata: {
      merchant_id: merchant.id,
      payment_link_id,
      has_receipt_data: !!receipt_data,
      template_used: receipt_data ? 'enhanced' : 'basic'
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
    error: errorMessage
  });
}

