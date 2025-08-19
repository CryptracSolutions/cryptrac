import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import {
  generateMerchantNotificationEmail,
  type MerchantNotificationData
} from '@/lib/email-templates';
import {
  sendEmailWithLogging,
  createServiceClient,
  getNotificationsEmailConfig,
  validateEmailConfig
} from '@/lib/email-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface PaymentNotificationData {
  merchant_id: string;
  payment_id: string;
  payment_link_id?: string;
  amount: number;
  currency: string;
  payment_type: 'POS Sale' | 'Payment Link' | 'Subscription';
  customer_email?: string;
  tx_hash?: string;
  pay_currency?: string;
  amount_received?: number;
  public_receipt_id?: string;
}

export async function POST(request: Request) {
  try {
    // Create service client
    const supabase = createServiceClient();

    const appOrigin = env.APP_ORIGIN || process.env.NEXT_PUBLIC_APP_URL || 'https://www.cryptrac.com';

    // Get email configuration
    const emailConfig = getNotificationsEmailConfig();
    const configError = validateEmailConfig(emailConfig);

    if (configError) {
      console.warn('⚠️ Email service not configured - notification will be logged but not sent');
    }

    const notificationData: PaymentNotificationData = await request.json();
    console.log('📧 Processing merchant notification:', notificationData);

    // Get merchant information including email
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id, business_name, email')
      .eq('id', notificationData.merchant_id)
      .single();

    if (merchantError || !merchant) {
      console.error('❌ Merchant not found for notification:', notificationData.merchant_id, merchantError);
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Check merchant notification preferences
    const { data: settings } = await supabase
      .from('merchant_settings')
      .select('email_payment_notifications_enabled')
      .eq('merchant_id', merchant.id)
      .single();

    if (settings?.email_payment_notifications_enabled === false) {
      return NextResponse.json({ success: false, message: 'Notifications disabled' });
    }

    if (!merchant.email) {
      console.warn('⚠️ Merchant has no email address for notifications:', merchant.id);
      
      // Log the attempt but don't fail
      await sendEmailWithLogging(
        supabase,
        'no-email@merchant.local',
        'Merchant Notification (No Email)',
        'Merchant email not configured',
        '<p>Merchant email not configured</p>',
        'merchant_notification',
        emailConfig || { apiKey: '', fromEmail: '', fromName: '' },
        {
          merchant_id: merchant.id,
          payment_id: notificationData.payment_id,
          reason: 'no_email_address'
        }
      );

      return NextResponse.json({
        success: false,
        message: 'Merchant email not configured',
        logged: true
      });
    }

    const receiptUrl = notificationData.public_receipt_id
      ? `${appOrigin}/r/${notificationData.public_receipt_id}`
      : appOrigin;
    const dashboardUrl = notificationData.payment_link_id
      ? `${appOrigin}/merchant/dashboard/payments/${notificationData.payment_link_id}`
      : `${appOrigin}/merchant/dashboard/payments`;

    // Prepare data for unified template
    const templateData: MerchantNotificationData = {
      merchantName: merchant.business_name,
      amount: notificationData.amount,
      currency: notificationData.currency,
      payment_type: notificationData.payment_type,
      customer_email: notificationData.customer_email,
      tx_hash: notificationData.tx_hash,
      pay_currency: notificationData.pay_currency,
      amount_received: notificationData.amount_received,
      receiptUrl: receiptUrl,
      dashboardUrl: dashboardUrl
    };

    // Generate email using shared unified template
    const template = generateMerchantNotificationEmail(templateData);

    let result: { success: boolean; status: 'sent' | 'failed' | 'queued'; error?: string } = { 
      success: false, 
      status: 'queued', 
      error: 'Email service not configured' 
    };

    if (emailConfig && !configError) {
      // Send email using standardized utility
      result = await sendEmailWithLogging(
        supabase,
        merchant.email,
        template.subject,
        template.text,
        template.html,
        'merchant_notification',
        emailConfig,
        {
          merchant_id: merchant.id,
          payment_id: notificationData.payment_id,
          payment_type: notificationData.payment_type,
          amount: notificationData.amount,
          currency: notificationData.currency
        },
        ['merchant-payment', 'notification']
      );
    } else {
      // Still log even if email service not configured
      await sendEmailWithLogging(
        supabase,
        merchant.email,
        template.subject,
        template.text,
        template.html,
        'merchant_notification',
        { apiKey: '', fromEmail: '', fromName: '' },
        {
          merchant_id: merchant.id,
          payment_id: notificationData.payment_id,
          payment_type: notificationData.payment_type,
          amount: notificationData.amount,
          currency: notificationData.currency,
          reason: 'email_service_not_configured'
        }
      );
    }

    return NextResponse.json({
      success: result.success,
      status: result.status,
      message: result.success 
        ? 'Merchant notification sent successfully'
        : result.status === 'queued'
        ? 'Merchant notification queued (email service not configured)'
        : 'Failed to send merchant notification',
      merchant_email: merchant.email,
      error: result.error
    });

  } catch (error) {
    console.error('💥 Merchant notification API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

