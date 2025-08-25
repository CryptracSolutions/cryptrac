import { env } from '@/lib/env';
import {
  generateUnifiedReceiptTemplate,
  getPaymentMethodLabel,
  type ReceiptData,
  type MerchantData
} from '@/lib/email-templates';
import {
  sendEmailWithLogging,
  createServiceClient,
  getEmailConfig,
  validateEmailConfig
} from '@/lib/email-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    // Create service client
    const service = createServiceClient();

    // Enhanced URL generation logic with multiple fallback strategies
    let paymentUrl = '';
    let receipt_data: Record<string, unknown> | null = null;
    let merchant_data: Record<string, unknown> | null = null;
    let payment_link_data: Record<string, unknown> | null = null;
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
      
      if (paymentLink?.merchants && !('error' in paymentLink.merchants)) {
        merchant_data = paymentLink.merchants as Record<string, unknown>;
      }
    }

    const merchantName = merchant_data?.business_name || 'Cryptrac Merchant';

    // Prepare receipt data for unified template
    const receiptDataForTemplate: ReceiptData = {
      amount: (receipt_data?.amount as number) || 0,
      currency: (receipt_data?.currency as string) || 'USD',
      payment_method: getPaymentMethodLabel(
        (payment_link_data?.source as string) || 'payment_link',
        receipt_data?.created_at as string
      ),
      title: (payment_link_data?.title as string) || 'Payment',
      tx_hash: receipt_data?.tx_hash as string | undefined,
      payin_hash: receipt_data?.payin_hash as string | undefined,
      payout_hash: receipt_data?.payout_hash as string | undefined,
      pay_currency: receipt_data?.pay_currency as string | undefined,
      amount_received: receipt_data?.amount_received as number | undefined,
      status: 'confirmed', // Always show as confirmed in receipt emails
      created_at: receipt_data?.created_at as string | undefined,
      order_id: receipt_data?.order_id as string | undefined,
      transaction_id: (receipt_data?.id as string) || transaction_id || payment_id
    };

    const merchantDataForTemplate: MerchantData = {
      business_name: merchantName as string
    };

    // Generate email template using shared unified template
    const emailTemplate = generateUnifiedReceiptTemplate(
      receiptDataForTemplate,
      merchantDataForTemplate,
      paymentUrl
    );

    // Get email configuration
    const emailConfig = getEmailConfig();
    const configError = validateEmailConfig(emailConfig);
    
    if (configError) {
      console.error('❌ Email configuration error:', configError);
      return Response.json({ success: false, error: configError }, { status: 500 });
    }

    // Send email using standardized utility
    const result = await sendEmailWithLogging(
      service,
      email,
      emailTemplate.subject,
      emailTemplate.text,
      emailTemplate.html,
      'customer_receipt',
      emailConfig!,
      {
        url_type: urlType,
        payment_url: paymentUrl,
        merchant_id: receipt_data?.merchant_id || payment_link_data?.merchant_id || null,
        payment_link_id: receipt_data?.payment_link_id || payment_link_id || null,
        transaction_id: receipt_data?.id || transaction_id || payment_id || null,
        payment_method: receiptDataForTemplate.payment_method
      },
      ['receipt', 'customer']
    );

    if (!result.success) {
      return Response.json({ 
        success: false, 
        error: result.error || 'Failed to send email. Please try again.' 
      }, { status: 500 });
    }

    console.log('✅ Customer receipt email sent successfully to:', email);

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

