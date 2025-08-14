import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface PaymentNotificationData {
  merchant_id: string;
  payment_id: string;
  amount: number;
  currency: string;
  payment_type: 'POS Sale' | 'Payment Link' | 'Subscription';
  customer_email?: string;
  tx_hash?: string;
  pay_currency?: string;
  amount_received?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Use service role key for internal API calls
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const sendgridKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.CRYPTRAC_NOTIFICATIONS_FROM || process.env.SENDGRID_FROM_EMAIL;
    const appOrigin = process.env.NEXT_PUBLIC_APP_URL;

    if (!sendgridKey || !fromEmail || !appOrigin) {
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

    if (!merchant.email) {
      console.warn('⚠️ Merchant has no email address for notifications:', merchant.id);
      // Log the attempt but don't fail
      await supabase.from('email_logs').insert({
        email: 'no-email@merchant.local',
        type: 'merchant_notification',
        status: 'failed',
        error_message: 'Merchant email not configured',
        metadata: {
          merchant_id: merchant.id,
          payment_id: notificationData.payment_id,
          reason: 'no_email_address'
        }
      });

      return NextResponse.json({
        success: false,
        message: 'Merchant email not configured',
        logged: true
      });
    }

    // Format the payment amount
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: notificationData.currency || 'USD'
    }).format(notificationData.amount);

    // Format received amount if different
    let receivedAmountText = '';
    if (notificationData.amount_received && notificationData.pay_currency) {
      const formattedReceived = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8
      }).format(notificationData.amount_received);
      receivedAmountText = ` (${formattedReceived} ${notificationData.pay_currency.toUpperCase()})`;
    }

    // Create email content
    const subject = `Payment Received - ${formattedAmount}`;
    const emailContent = `
Hello ${merchant.business_name},

Great news! You've received a new payment.

Payment Details:
• Amount: ${formattedAmount}${receivedAmountText}
• Type: ${notificationData.payment_type}
• Payment ID: ${notificationData.payment_id}
${notificationData.tx_hash ? `• Transaction Hash: ${notificationData.tx_hash}` : ''}
${notificationData.customer_email ? `• Customer Email: ${notificationData.customer_email}` : ''}

You can view this payment and all your transactions in your merchant dashboard:
${appOrigin}/merchant/dashboard/payments

Best regards,
The Cryptrac Team

---
This is an automated notification. Please do not reply to this email.
    `.trim();

    let emailStatus = 'queued';
    let errorMessage = null;

    // Send email if service is configured
    if (sendgridKey && fromEmail && appOrigin) {
      try {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sendgridKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: merchant.email }],
              subject: subject
            }],
            from: { email: fromEmail, name: 'Cryptrac' },
            reply_to: { email: 'support@cryptrac.com' },
            content: [{
              type: 'text/plain',
              value: emailContent
            }]
          })
        });

        if (response.ok) {
          emailStatus = 'sent';
          console.log('✅ Merchant notification email sent successfully to:', merchant.email);
        } else {
          const errorText = await response.text();
          emailStatus = 'failed';
          errorMessage = `SendGrid error: ${response.status} ${errorText}`;
          console.error('❌ SendGrid error:', errorMessage);
        }
      } catch (error) {
        emailStatus = 'failed';
        errorMessage = error instanceof Error ? error.message : 'Unknown email error';
        console.error('❌ Email sending error:', error);
      }
    }

    // Log the email attempt
    await supabase.from('email_logs').insert({
      email: merchant.email,
      type: 'merchant_notification',
      status: emailStatus,
      error_message: errorMessage,
      metadata: {
        merchant_id: merchant.id,
        payment_id: notificationData.payment_id,
        payment_type: notificationData.payment_type,
        amount: notificationData.amount,
        currency: notificationData.currency,
        subject: subject
      }
    });

    return NextResponse.json({
      success: emailStatus === 'sent',
      status: emailStatus,
      message: emailStatus === 'sent' 
        ? 'Merchant notification sent successfully'
        : emailStatus === 'queued'
        ? 'Merchant notification queued (email service not configured)'
        : 'Failed to send merchant notification',
      merchant_email: merchant.email,
      error: errorMessage
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

