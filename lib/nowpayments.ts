// NOWPayments API Client for Cryptrac
// Based on NOWPayments v1 API documentation

export interface NOWPaymentsConfig {
  apiKey: string;
  baseUrl?: string;
  ipnSecret?: string;
}

export interface CreatePaymentRequest {
  price_amount: number;
  price_currency: string;
  pay_currency?: string;
  ipn_callback_url?: string;
  order_id: string;
  order_description: string;
  success_url?: string;
  cancel_url?: string;
}

export interface PaymentResponse {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  ipn_callback_url?: string;
  created_at: string;
  updated_at: string;
  payment_url?: string;
}

export interface Currency {
  currency: string;
  name: string;
  logo_url: string;
  min_amount: number;
  max_amount: number;
}

export interface EstimateRequest {
  amount: number;
  currency_from: string;
  currency_to: string;
}

export interface EstimateResponse {
  currency_from: string;
  amount_from: number;
  currency_to: string;
  estimated_amount: number;
}

export class NOWPaymentsClient {
  private config: NOWPaymentsConfig;

  constructor(config: NOWPaymentsConfig) {
    this.config = {
      baseUrl: 'https://api.nowpayments.io/v1',
      ...config
    };
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'x-api-key': this.config.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NOWPayments API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // Get available currencies
  async getCurrencies(): Promise<Currency[]> {
    return this.makeRequest<Currency[]>('/currencies');
  }

  // Get estimate for currency conversion
  async getEstimate(request: EstimateRequest): Promise<EstimateResponse> {
    const params = new URLSearchParams({
      amount: request.amount.toString(),
      currency_from: request.currency_from,
      currency_to: request.currency_to,
    });

    return this.makeRequest<EstimateResponse>(`/estimate?${params}`);
  }

  // Create a payment
  async createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
    return this.makeRequest<PaymentResponse>('/payment', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Get payment status
  async getPaymentStatus(paymentId: string): Promise<PaymentResponse> {
    return this.makeRequest<PaymentResponse>(`/payment/${paymentId}`);
  }

  // Verify IPN signature
  verifyIpnSignature(payload: string, signature: string): boolean {
    if (!this.config.ipnSecret) {
      throw new Error('IPN secret not configured');
    }

    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha512', this.config.ipnSecret)
      .update(payload)
      .digest('hex');

    return expectedSignature === signature;
  }
}

// Create a singleton instance
let nowPaymentsClient: NOWPaymentsClient | null = null;

export function getNOWPaymentsClient(): NOWPaymentsClient {
  if (!nowPaymentsClient) {
    const apiKey = process.env.NOWPAYMENTS_API_KEY;
    const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;

    if (!apiKey) {
      throw new Error('NOWPAYMENTS_API_KEY environment variable is required');
    }

    nowPaymentsClient = new NOWPaymentsClient({
      apiKey,
      ipnSecret,
    });
  }

  return nowPaymentsClient;
}

// Fee calculation utilities
export function calculateCryptracFees(amount: number): {
  cryptracFee: number;
  nowPaymentsFee: number;
  totalFees: number;
  merchantReceives: number;
} {
  // 2.9% total fee structure: 1.9% Cryptrac + up to 1% NOWPayments
  const cryptracFeeRate = 0.019; // 1.9%
  const nowPaymentsFeeRate = 0.01; // 1% (max)
  
  const cryptracFee = amount * cryptracFeeRate;
  const nowPaymentsFee = amount * nowPaymentsFeeRate;
  const totalFees = cryptracFee + nowPaymentsFee;
  const merchantReceives = amount - totalFees;

  return {
    cryptracFee,
    nowPaymentsFee,
    totalFees,
    merchantReceives,
  };
}

// Payment status helpers
export const PaymentStatus = {
  WAITING: 'waiting',
  CONFIRMING: 'confirming',
  CONFIRMED: 'confirmed',
  SENDING: 'sending',
  PARTIALLY_PAID: 'partially_paid',
  FINISHED: 'finished',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  EXPIRED: 'expired',
} as const;

export type PaymentStatusType = typeof PaymentStatus[keyof typeof PaymentStatus];

export function isPaymentComplete(status: string): boolean {
  return status === 'confirmed' || status === 'finished';
}

export function isPaymentFailed(status: string): boolean {
  return status === 'failed' || status === 'refunded' || status === 'expired';
}

export function isPaymentPending(status: string): boolean {
  return status === 'waiting' || status === 'confirming' || status === 'sending' || status === 'partially_paid';
}

