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

    // Create service client
    const service = createServiceClient();

    let receipt_data: Record<string, unknown> | null = null;
    let merchant: Record<string, unknown> | null = null;
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

      if (paymentLink && paymentLink.merchants && !('error' in paymentLink.merchants)) {
        merchant = paymentLink.merchants as Record<string, unknown>;
        
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
            payment_method: getPaymentMethodLabel(paymentLink.source as string, transaction.created_at as string)
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

        if (paymentLink?.merchants && !('error' in paymentLink.merchants)) {
          const appOrigin = env.APP_ORIGIN || process.env.NEXT_PUBLIC_APP_URL || 'https://www.cryptrac.com';
          paymentUrl = `${appOrigin}/r/${transaction.public_receipt_id}`;
          merchant = paymentLink.merchants as Record<string, unknown>;
          receipt_data = {
            ...transaction,
            title: paymentLink.title,
            payment_method: getPaymentMethodLabel(paymentLink.source as string, transaction.created_at as string)
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
      amount: (receipt_data.amount as number) || 0,
      currency: (receipt_data.currency as string) || 'USD',
      payment_method: receipt_data.payment_method as string,
      title: (receipt_data.title as string) || 'Payment',
      tx_hash: receipt_data.tx_hash as string | undefined,
      payin_hash: receipt_data.payin_hash as string | undefined,
      payout_hash: receipt_data.payout_hash as string | undefined,
      pay_currency: receipt_data.pay_currency as string | undefined,
      amount_received: receipt_data.amount_received as number | undefined,
      status: 'confirmed',
      created_at: receipt_data.created_at as string | undefined,
      order_id: receipt_data.order_id as string | undefined,
      transaction_id: (receipt_data.id as string) || transaction_id
    };

    const merchantDataForTemplate: MerchantData = {
      business_name: (merchant.business_name as string) || 'Cryptrac Merchant'
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
      'receipt',
      emailConfig!,
      {
        merchant_id: merchant.id || null,
        payment_link_id,
        transaction_id: receipt_data.id || transaction_id || null,
        has_receipt_data: !!receipt_data,
        url_used: paymentUrl,
        payment_method: receipt_data.payment_method
      },
      ['receipt', 'customer']
    );

    if (!result.success) {
      return Response.json({ 
        success: false, 
        error: result.error || 'Failed to send email. Please try again.' 
      }, { status: 500 });
    }

    console.log('✅ Receipt email sent successfully to:', email);

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

