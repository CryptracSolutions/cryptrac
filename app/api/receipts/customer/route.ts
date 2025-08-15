import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ENHANCED: Function to generate professional HTML email template
function generateEmailTemplate(
  receiptData: Record<string, unknown>,
  merchantName: string,
  paymentUrl: string
): { subject: string; html: string; text: string } {
  const {
    amount,
    currency,
    payment_method,
    transaction_id,
    order_id,
    created_at,
    status,
    customer_email,
    tx_hash,
    payin_hash,
    payout_hash
  } = receiptData;

  const formattedDate = created_at ? new Date(created_at as string).toLocaleString() : 'N/A';
  const formattedAmount = amount && currency ? `${amount} ${(currency as string).toUpperCase()}` : 'N/A';

  const subject = `Receipt from ${merchantName} - ${formattedAmount}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Receipt</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 16px; }
        .content { padding: 30px; }
        .receipt-details { background: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #495057; }
        .detail-value { color: #212529; font-family: 'SF Mono', Monaco, monospace; }
        .amount-highlight { background: #e8f5e8; color: #2d5a2d; padding: 15px; border-radius: 6px; text-align: center; font-size: 18px; font-weight: 700; margin: 20px 0; }
        .view-receipt-btn { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; margin: 20px 0; text-align: center; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #6c757d; border-top: 1px solid #e9ecef; }
        .hash-value { word-break: break-all; font-size: 12px; }
        @media (max-width: 600px) {
            .container { margin: 10px; border-radius: 0; }
            .header, .content { padding: 20px; }
            .detail-row { flex-direction: column; align-items: flex-start; }
            .detail-value { margin-top: 4px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Payment Receipt</h1>
            <p>Thank you for your payment to ${merchantName}</p>
        </div>
        
        <div class="content">
            <div class="amount-highlight">
                Payment Amount: ${formattedAmount}
            </div>
            
            <div class="receipt-details">
                <div class="detail-row">
                    <span class="detail-label">Merchant:</span>
                    <span class="detail-value">${merchantName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Amount:</span>
                    <span class="detail-value">${formattedAmount}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Payment Method:</span>
                    <span class="detail-value">${payment_method || 'Cryptocurrency'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value">${status || 'Completed'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date:</span>
                    <span class="detail-value">${formattedDate}</span>
                </div>
                ${transaction_id ? `
                <div class="detail-row">
                    <span class="detail-label">Transaction ID:</span>
                    <span class="detail-value">${transaction_id}</span>
                </div>
                ` : ''}
                ${order_id ? `
                <div class="detail-row">
                    <span class="detail-label">Order ID:</span>
                    <span class="detail-value">${order_id}</span>
                </div>
                ` : ''}
                ${tx_hash ? `
                <div class="detail-row">
                    <span class="detail-label">Transaction Hash:</span>
                    <span class="detail-value hash-value">${tx_hash}</span>
                </div>
                ` : ''}
                ${payin_hash ? `
                <div class="detail-row">
                    <span class="detail-label">Payin Hash:</span>
                    <span class="detail-value hash-value">${payin_hash}</span>
                </div>
                ` : ''}
                ${payout_hash ? `
                <div class="detail-row">
                    <span class="detail-label">Payout Hash:</span>
                    <span class="detail-value hash-value">${payout_hash}</span>
                </div>
                ` : ''}
            </div>
            
            <div style="text-align: center;">
                <a href="${paymentUrl}" class="view-receipt-btn">View Full Receipt</a>
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #6c757d;">
                This receipt confirms your payment has been processed successfully. 
                Keep this email for your records.
            </p>
        </div>
        
        <div class="footer">
            <p>This is an automated receipt from ${merchantName} via Cryptrac</p>
            <p>If you have any questions about this payment, please contact the merchant directly.</p>
        </div>
    </div>
</body>
</html>`;

  const text = `
Payment Receipt - ${merchantName}

Thank you for your payment!

Payment Details:
- Merchant: ${merchantName}
- Amount: ${formattedAmount}
- Payment Method: ${payment_method || 'Cryptocurrency'}
- Status: ${status || 'Completed'}
- Date: ${formattedDate}
${transaction_id ? `- Transaction ID: ${transaction_id}` : ''}
${order_id ? `- Order ID: ${order_id}` : ''}
${tx_hash ? `- Transaction Hash: ${tx_hash}` : ''}
${payin_hash ? `- Payin Hash: ${payin_hash}` : ''}
${payout_hash ? `- Payout Hash: ${payout_hash}` : ''}

View full receipt: ${paymentUrl}

This receipt confirms your payment has been processed successfully.
Keep this email for your records.

---
This is an automated receipt from ${merchantName} via Cryptrac
If you have any questions about this payment, please contact the merchant directly.
`;

  return { subject, html, text };
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
        .select('public_receipt_id, payment_link_id, merchant_id, amount, currency, status, created_at, order_id, tx_hash, payin_hash, payout_hash')
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
      const { data: transaction } = await service
        .from('transactions')
        .select('public_receipt_id, payment_link_id, merchant_id, amount, currency, status, created_at, order_id, tx_hash, payin_hash, payout_hash')
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
        .select('public_receipt_id, payment_link_id, merchant_id, amount, currency, status, created_at, order_id, tx_hash, payin_hash, payout_hash')
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

    // Generate email template
    const emailTemplate = generateEmailTemplate(receipt_data || {}, merchantName, paymentUrl);

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
      ]
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

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('❌ SendGrid error:', emailResponse.status, errorText);
      return Response.json({ 
        success: false, 
        error: 'Failed to send email. Please try again.' 
      }, { status: 500 });
    }

    console.log('✅ Email sent successfully to:', email);

    // Log email to database
    try {
      await service.from('email_logs').insert({
        email: email,
        type: 'customer_receipt',
        status: 'sent',
        url_type: urlType,
        payment_url: paymentUrl,
        merchant_id: receipt_data?.merchant_id || null,
        payment_link_id: receipt_data?.payment_link_id || payment_link_id || null,
        transaction_id: receipt_data?.id || transaction_id || payment_id || null
      });
      console.log('✅ Email logged to database');
    } catch (logError) {
      console.error('⚠️ Failed to log email to database:', logError);
      // Don't fail the request if logging fails
    }

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

