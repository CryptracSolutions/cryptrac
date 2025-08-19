// Shared Email Templates and Utilities for Cryptrac
// This eliminates code duplication across email endpoints

export interface ReceiptData {
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

export interface MerchantData {
  business_name: string;
  logo_url?: string;
}

export interface MerchantNotificationData {
  merchantName: string;
  amount: number;
  currency: string;
  payment_type: string;
  customer_email?: string;
  tx_hash?: string;
  pay_currency?: string;
  amount_received?: number;
  receiptUrl?: string;
  dashboardUrl?: string;
}

export interface SubscriptionEmailData {
  merchantName: string;
  customerName?: string;
  customerEmail?: string;
  subscriptionTitle: string;
  amount?: number;
  currency?: string;
  paymentUrl?: string;
  nextBillingDate?: string;
  cycleCount?: number;
  maxCycles?: number;
  // For receipt-style subscription emails
  tx_hash?: string;
  payin_hash?: string;
  payout_hash?: string;
  pay_currency?: string;
  amount_received?: number;
  order_id?: string;
  transaction_id?: string;
  created_at?: string;
  receiptUrl?: string;
}

export interface InvoiceEmailData {
  merchantName: string;
  customerName?: string;
  subscriptionTitle: string;
  amount: number;
  currency: string;
  paymentUrl: string;
  dueDate?: string;
  isPastDue?: boolean;
  daysPastDue?: number;
}

export type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

// Base HTML template structure
function getBaseTemplate(
  title: string,
  icon: string,
  iconColor: string,
  merchantName: string,
  content: string
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
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
        .icon {
            font-size: 48px;
            margin-bottom: 10px;
            color: ${iconColor};
        }
        .receipt-details, .details {
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
        }
        .detail-label {
            font-weight: 600;
            color: #495057;
        }
        .detail-value {
            color: #212529;
        }
        .amount-highlight {
            font-weight: bold;
            font-size: 18px;
            color: #28a745;
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
        .view-button, .button {
            display: inline-block;
            background: #007bff;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }
        .button.success {
            background: #28a745;
        }
        .button.warning {
            background: #ffc107;
            color: #212529;
        }
        .button.danger {
            background: #dc3545;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
        }
        .alert {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .alert.danger {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
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
            <div class="icon">${icon}</div>
            <h1>${title}</h1>
            <div class="merchant-name">From ${merchantName}</div>
        </div>
        
        ${content}
        
        <div class="footer">
            <p>This is an automated email from Cryptrac.</p>
            <p>If you have any questions, please contact ${merchantName}.</p>
        </div>
    </div>
</body>
</html>
  `.trim();
}

// Unified Receipt Email Template for all payment confirmations
export function generateUnifiedReceiptTemplate(
  receiptData: ReceiptData,
  merchantData: MerchantData,
  receiptUrl: string
): EmailTemplate {
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

  const content = `
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
                <span class="detail-value amount-highlight">${formattedAmount}${receivedAmountText}</span>
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

        <p>Thank you for your payment!</p>
        <p>This is an automated receipt. Please keep this for your records.</p>
  `;

  const html = getBaseTemplate('Payment Received', '✓', '#28a745', merchantName, content);

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

// Merchant Payment Notification Email
export function generateMerchantNotificationEmail(data: MerchantNotificationData): EmailTemplate {
  const { 
    amount, 
    currency, 
    payment_type, 
    customer_email, 
    tx_hash, 
    pay_currency, 
    amount_received, 
    receiptUrl, 
    dashboardUrl, 
    merchantName 
  } = data;

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD'
  }).format(amount);

  let receivedAmountText = '';
  if (amount_received && pay_currency) {
    const formattedReceived = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(amount_received);
    receivedAmountText = ` (${formattedReceived} ${pay_currency.toUpperCase()})`;
  }

  // Format current time with proper timezone handling
  const currentTime = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const subject = `Payment received • ${formattedAmount}`;

  const content = `
        <p>Hello ${merchantName},</p>
        <p>You've received a new payment.</p>
        
        <div class="details">
            <div class="detail-row">
                <span class="detail-label">Amount:</span>
                <span class="detail-value amount-highlight">${formattedAmount}${receivedAmountText}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Type:</span>
                <span class="detail-value">${payment_type}</span>
            </div>
            ${customer_email ? `
            <div class="detail-row">
                <span class="detail-label">Customer:</span>
                <span class="detail-value">${customer_email}</span>
            </div>
            ` : ''}
            <div class="detail-row">
                <span class="detail-label">Paid at:</span>
                <span class="detail-value">${currentTime}</span>
            </div>
        </div>

        ${tx_hash ? `
        <div class="hash-section">
            <div class="hash-label">Transaction Hash:</div>
            <div class="transaction-hash">${tx_hash}</div>
        </div>
        ` : ''}

        <div style="text-align: center;">
            ${receiptUrl ? `<a href="${receiptUrl}" class="button">View Receipt</a>` : ''}
            ${dashboardUrl ? `<a href="${dashboardUrl}" class="button">View in Dashboard</a>` : ''}
        </div>
        
        <p>Best regards,<br>The Cryptrac Team</p>
  `;

  const html = getBaseTemplate('Payment Received', '💰', '#28a745', 'Cryptrac', content);

  const text = `
Payment Received

Hello ${merchantName},

You've received a new payment.

Amount: ${formattedAmount}${receivedAmountText}
Type: ${payment_type}
${customer_email ? `Customer: ${customer_email}\n` : ''}Paid at: ${currentTime}

${tx_hash ? `Transaction Hash: ${tx_hash}\n` : ''}${receiptUrl ? `View receipt: ${receiptUrl}\n` : ''}${dashboardUrl ? `View in dashboard: ${dashboardUrl}\n` : ''}

Best regards,
The Cryptrac Team

---
This is an automated notification.
`;

  return { subject, html, text };
}

// Subscription Welcome Email
export function generateSubscriptionWelcomeEmail(data: SubscriptionEmailData): EmailTemplate {
  const { merchantName, customerName, subscriptionTitle, amount, currency, nextBillingDate } = data;

  const formattedAmount = amount && currency ? 
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount) : '';

  const subject = `Welcome to ${subscriptionTitle}`;

  const content = `
        <p>Hello${customerName ? ` ${customerName}` : ''},</p>
        <p>Welcome to your new subscription!</p>
        
        <div class="details">
            <div class="detail-row">
                <span class="detail-label">Subscription:</span>
                <span class="detail-value">${subscriptionTitle}</span>
            </div>
            ${formattedAmount ? `
            <div class="detail-row">
                <span class="detail-label">Amount:</span>
                <span class="detail-value amount-highlight">${formattedAmount}</span>
            </div>
            ` : ''}
            ${nextBillingDate ? `
            <div class="detail-row">
                <span class="detail-label">Next Billing:</span>
                <span class="detail-value">${new Date(nextBillingDate).toLocaleDateString('en-US', { 
                  year: 'numeric', month: 'long', day: 'numeric' 
                })}</span>
            </div>
            ` : ''}
        </div>
        
        <p>Thank you for subscribing! You'll receive invoices before each billing cycle.</p>
        <p>Best regards,<br>The ${merchantName} Team</p>
  `;

  const html = getBaseTemplate('Subscription Welcome', '🎉', '#28a745', merchantName, content);

  const text = `
Subscription Welcome

Hello${customerName ? ` ${customerName}` : ''},

Welcome to your new subscription!

Subscription: ${subscriptionTitle}
${formattedAmount ? `Amount: ${formattedAmount}\n` : ''}${nextBillingDate ? `Next Billing: ${new Date(nextBillingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n` : ''}

Thank you for subscribing! You'll receive invoices before each billing cycle.

Best regards,
The ${merchantName} Team
`;

  return { subject, html, text };
}

// Subscription Invoice Email
export function generateSubscriptionInvoiceEmail(data: InvoiceEmailData): EmailTemplate {
  const { merchantName, customerName, subscriptionTitle, amount, currency, paymentUrl, dueDate } = data;

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD'
  }).format(amount);

  const formattedDueDate = dueDate ? 
    new Date(dueDate).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    }) : '';

  const subject = `Invoice for ${subscriptionTitle} - ${formattedAmount}`;

  const content = `
        <p>Hello${customerName ? ` ${customerName}` : ''},</p>
        <p>Your subscription invoice is ready.</p>
        
        <div class="details">
            <div class="detail-row">
                <span class="detail-label">Subscription:</span>
                <span class="detail-value">${subscriptionTitle}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Amount Due:</span>
                <span class="detail-value amount-highlight">${formattedAmount}</span>
            </div>
            ${formattedDueDate ? `
            <div class="detail-row">
                <span class="detail-label">Due Date:</span>
                <span class="detail-value">${formattedDueDate}</span>
            </div>
            ` : ''}
        </div>

        <div style="text-align: center;">
            <a href="${paymentUrl}" class="button success">Pay Now</a>
        </div>
        
        <p>Please complete your payment to continue your subscription.</p>
        <p>Best regards,<br>The ${merchantName} Team</p>
  `;

  const html = getBaseTemplate('Subscription Invoice', '📄', '#007bff', merchantName, content);

  const text = `
Subscription Invoice

Hello${customerName ? ` ${customerName}` : ''},

Your subscription invoice is ready.

Subscription: ${subscriptionTitle}
Amount Due: ${formattedAmount}
${formattedDueDate ? `Due Date: ${formattedDueDate}\n` : ''}

Pay now: ${paymentUrl}

Please complete your payment to continue your subscription.

Best regards,
The ${merchantName} Team
`;

  return { subject, html, text };
}

// Subscription Dunning Email (Past Due)
export function generateSubscriptionDunningEmail(data: InvoiceEmailData): EmailTemplate {
  const { merchantName, customerName, subscriptionTitle, amount, currency, paymentUrl, daysPastDue } = data;

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD'
  }).format(amount);

  const subject = `Payment Past Due - ${subscriptionTitle}`;

  const content = `
        <div class="alert danger">
            <strong>Payment Past Due</strong><br>
            Your subscription payment is ${daysPastDue} day${daysPastDue !== 1 ? 's' : ''} overdue.
        </div>

        <p>Hello${customerName ? ` ${customerName}` : ''},</p>
        <p>Your subscription payment is past due. Please complete your payment to avoid service interruption.</p>
        
        <div class="details">
            <div class="detail-row">
                <span class="detail-label">Subscription:</span>
                <span class="detail-value">${subscriptionTitle}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Amount Due:</span>
                <span class="detail-value amount-highlight">${formattedAmount}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Days Past Due:</span>
                <span class="detail-value">${daysPastDue}</span>
            </div>
        </div>

        <div style="text-align: center;">
            <a href="${paymentUrl}" class="button danger">Pay Now to Avoid Suspension</a>
        </div>
        
        <p><strong>Action Required:</strong> Please complete your payment immediately to continue your subscription.</p>
        <p>Best regards,<br>The ${merchantName} Team</p>
  `;

  const html = getBaseTemplate('Payment Past Due', '⚠️', '#dc3545', merchantName, content);

  const text = `
Payment Past Due

Hello${customerName ? ` ${customerName}` : ''},

Your subscription payment is ${daysPastDue} day${daysPastDue !== 1 ? 's' : ''} overdue.

Subscription: ${subscriptionTitle}
Amount Due: ${formattedAmount}
Days Past Due: ${daysPastDue}

Pay now: ${paymentUrl}

Action Required: Please complete your payment immediately to continue your subscription.

Best regards,
The ${merchantName} Team
`;

  return { subject, html, text };
}

// Subscription Paused Email
export function generateSubscriptionPausedEmail(data: SubscriptionEmailData): EmailTemplate {
  const { merchantName, customerName, subscriptionTitle, paymentUrl } = data;

  const subject = `Subscription Paused - ${subscriptionTitle}`;

  const content = `
        <div class="alert danger">
            <strong>Subscription Paused</strong><br>
            Your subscription has been paused due to missed payments.
        </div>

        <p>Hello${customerName ? ` ${customerName}` : ''},</p>
        <p>Your subscription has been temporarily paused due to missed payments.</p>
        
        <div class="details">
            <div class="detail-row">
                <span class="detail-label">Subscription:</span>
                <span class="detail-value">${subscriptionTitle}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">Paused</span>
            </div>
        </div>

        ${paymentUrl ? `
        <div style="text-align: center;">
            <a href="${paymentUrl}" class="button success">Reactivate Subscription</a>
        </div>
        ` : ''}
        
        <p>To reactivate your subscription, please complete your outstanding payment.</p>
        <p>Best regards,<br>The ${merchantName} Team</p>
  `;

  const html = getBaseTemplate('Subscription Paused', '⏸️', '#ffc107', merchantName, content);

  const text = `
Subscription Paused

Hello${customerName ? ` ${customerName}` : ''},

Your subscription has been temporarily paused due to missed payments.

Subscription: ${subscriptionTitle}
Status: Paused

${paymentUrl ? `Reactivate: ${paymentUrl}\n` : ''}

To reactivate your subscription, please complete your outstanding payment.

Best regards,
The ${merchantName} Team
`;

  return { subject, html, text };
}

// Subscription Completion Email
export function generateSubscriptionCompletionEmail(data: SubscriptionEmailData): EmailTemplate {
  const { merchantName, customerName, subscriptionTitle, cycleCount, maxCycles } = data;

  const subject = `Subscription Complete - ${subscriptionTitle}`;

  const content = `
        <p>Hello${customerName ? ` ${customerName}` : ''},</p>
        <p>Your subscription has been completed successfully!</p>
        
        <div class="details">
            <div class="detail-row">
                <span class="detail-label">Subscription:</span>
                <span class="detail-value">${subscriptionTitle}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">Completed</span>
            </div>
            ${cycleCount && maxCycles ? `
            <div class="detail-row">
                <span class="detail-label">Cycles Completed:</span>
                <span class="detail-value">${cycleCount} of ${maxCycles}</span>
            </div>
            ` : ''}
        </div>
        
        <p>Thank you for your subscription! We hope you enjoyed our service.</p>
        <p>Best regards,<br>The ${merchantName} Team</p>
  `;

  const html = getBaseTemplate('Subscription Complete', '✅', '#28a745', merchantName, content);

  const text = `
Subscription Complete

Hello${customerName ? ` ${customerName}` : ''},

Your subscription has been completed successfully!

Subscription: ${subscriptionTitle}
Status: Completed
${cycleCount && maxCycles ? `Cycles Completed: ${cycleCount} of ${maxCycles}\n` : ''}

Thank you for your subscription! We hope you enjoyed our service.

Best regards,
The ${merchantName} Team
`;

  return { subject, html, text };
}

// Helper function to determine payment method label based on source
export function getPaymentMethodLabel(source: string, created_at?: string): string {
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

