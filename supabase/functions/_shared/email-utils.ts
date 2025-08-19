// Standardized Email Utilities for Cryptrac
// Provides consistent error handling, logging, and SendGrid integration

import { createClient } from '@supabase/supabase-js';

export interface EmailLogData {
  email: string;
  type: string;
  status: 'sent' | 'failed' | 'queued';
  error_message?: string;
  metadata?: Record<string, any>;
}

export interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
  fromName?: string;
  replyTo?: string;
}

export interface EmailSendResult {
  success: boolean;
  status: 'sent' | 'failed' | 'queued';
  error?: string;
  logged: boolean;
}

// Standardized email logging function
export async function logEmailToDatabase(
  supabase: any,
  emailData: EmailLogData
): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('email_logs').insert({
      email: emailData.email,
      type: emailData.type,
      status: emailData.status,
      error_message: emailData.error_message || null,
      metadata: emailData.metadata || null,
      created_at: new Date().toISOString()
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

// Standardized SendGrid email sending with retry logic
export async function sendEmailWithRetry(
  config: SendGridConfig,
  emailPayload: any,
  maxRetries: number = 3
): Promise<{ success: boolean; status: 'sent' | 'failed'; error?: string }> {
  let lastError: string | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`📤 Sending email via SendGrid (attempt ${attempt + 1}/${maxRetries})`);
      
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailPayload)
      });

      if (response.ok) {
        console.log('✅ Email sent successfully via SendGrid');
        return { success: true, status: 'sent' };
      } else {
        const errorText = await response.text();
        lastError = `SendGrid error: ${response.status} - ${errorText}`;
        console.error(`❌ SendGrid error (attempt ${attempt + 1}):`, lastError);
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown email error';
      console.error(`❌ Email sending error (attempt ${attempt + 1}):`, error);
    }

    // Wait before retry (exponential backoff)
    if (attempt < maxRetries - 1) {
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return { success: false, status: 'failed', error: lastError };
}

// Create standardized SendGrid email payload
export function createSendGridPayload(
  to: string,
  subject: string,
  textContent: string,
  htmlContent: string,
  config: SendGridConfig,
  categories: string[] = []
): any {
  return {
    personalizations: [{
      to: [{ email: to }],
      subject: subject
    }],
    from: { 
      email: config.fromEmail, 
      name: config.fromName || 'Cryptrac' 
    },
    reply_to: config.replyTo ? { email: config.replyTo } : undefined,
    content: [
      { type: 'text/plain', value: textContent },  // MUST be first
      { type: 'text/html', value: htmlContent }    // MUST be second
    ],
    categories: categories.length > 0 ? categories : undefined,
    tracking_settings: {
      click_tracking: { enable: true },
      open_tracking: { enable: true }
    }
  };
}

// Get email configuration from environment variables
export function getEmailConfig(): SendGridConfig | null {
  const apiKey = process.env.SENDGRID_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ SENDGRID_API_KEY not configured');
    return null;
  }

  return {
    apiKey,
    fromEmail: process.env.CRYPTRAC_RECEIPTS_FROM || 'receipts@cryptrac.com',
    fromName: process.env.CRYPTRAC_FROM_NAME || 'Cryptrac',
    replyTo: process.env.CRYPTRAC_REPLY_TO || 'support@cryptrac.com'
  };
}

// Get notifications email configuration
export function getNotificationsEmailConfig(): SendGridConfig | null {
  const apiKey = process.env.SENDGRID_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ SENDGRID_API_KEY not configured');
    return null;
  }

  return {
    apiKey,
    fromEmail: process.env.CRYPTRAC_NOTIFICATIONS_FROM || 'notifications@cryptrac.com',
    fromName: process.env.CRYPTRAC_FROM_NAME || 'Cryptrac',
    replyTo: process.env.CRYPTRAC_REPLY_TO || 'support@cryptrac.com'
  };
}

// Comprehensive email sending function with logging
export async function sendEmailWithLogging(
  supabase: any,
  to: string,
  subject: string,
  textContent: string,
  htmlContent: string,
  emailType: string,
  config: SendGridConfig,
  metadata: Record<string, any> = {},
  categories: string[] = []
): Promise<EmailSendResult> {
  let emailStatus: 'sent' | 'failed' | 'queued' = 'queued';
  let errorMessage: string | undefined;
  let logged = false;

  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      throw new Error('Invalid email format');
    }

    // Create SendGrid payload
    const payload = createSendGridPayload(to, subject, textContent, htmlContent, config, categories);

    // Send email with retry logic
    const sendResult = await sendEmailWithRetry(config, payload);
    emailStatus = sendResult.status;
    errorMessage = sendResult.error;

    // Log to database
    logged = await logEmailToDatabase(supabase, {
      email: to,
      type: emailType,
      status: emailStatus,
      error_message: errorMessage,
      metadata: {
        ...metadata,
        subject,
        template_used: 'unified',
        categories: categories.join(',')
      }
    });

    return {
      success: emailStatus === 'sent',
      status: emailStatus,
      error: errorMessage,
      logged
    };

  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Unknown error';
    emailStatus = 'failed';

    // Still try to log the failure
    logged = await logEmailToDatabase(supabase, {
      email: to,
      type: emailType,
      status: emailStatus,
      error_message: errorMessage,
      metadata: {
        ...metadata,
        subject,
        template_used: 'unified'
      }
    });

    return {
      success: false,
      status: emailStatus,
      error: errorMessage,
      logged
    };
  }
}

// Create Supabase service client
export function createServiceClient(): any {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceKey || !supabaseUrl) {
    throw new Error('Supabase configuration missing');
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

// Validate email configuration
export function validateEmailConfig(config: SendGridConfig | null): string | null {
  if (!config) {
    return 'Email service not configured - missing SendGrid API key';
  }

  if (!config.fromEmail) {
    return 'Email service not configured - missing from email address';
  }

  return null;
}

