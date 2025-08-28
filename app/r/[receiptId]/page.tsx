import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import PrintButton from '@/components/PrintButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

function ReceiptNotAvailable() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="shadow-medium">
          <CardContent className="p-8 text-center">
            <h1 className="font-phonic text-5xl font-normal text-gray-900 mb-2">Receipt not available</h1>
            <p className="font-capsule text-base font-normal text-gray-600">This receipt could not be found.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const explorers: Record<string, string> = {
  BTC: 'https://www.blockchain.com/btc/tx/',
  ETH: 'https://etherscan.io/tx/',
  TRX: 'https://tronscan.org/#/transaction/',
  LTC: 'https://blockchair.com/litecoin/transaction/',
  XLM: 'https://stellar.expert/explorer/public/tx/',
  XRP: 'https://livenet.xrpl.org/transactions/'
};

export default async function ReceiptPage({ params }: { params: Promise<{ receiptId: string }> }) {
  const { receiptId } = await params;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // FIXED: Modified query to handle cases where payment_link_id might be null
  // This fixes the issue where smart terminal/POS payments don't have associated payment links
  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .select(`
      public_receipt_id,
      merchant_id,
      payment_link_id,
      created_at,
      currency,
      settlement_currency,
      asset,
      network,
      tax_label,
      tax_amount,
      subtotal_with_tax,
      gateway_fee_amount,
      conversion_fee_amount,
      network_fee_amount,
      total_paid,
      tx_hash,
      nowpayments_payment_id,
      amount,
      base_amount,
      total_amount_paid,
      pay_currency,
      amount_received,
      status
    `)
    .eq('public_receipt_id', receiptId)
    .single();

  if (txError || !tx) {
    console.error('Receipt lookup error:', txError);
    return <ReceiptNotAvailable />;
  }

  // FIXED: Separate queries for merchant and payment link data to avoid JOIN failures
  const { data: merchant } = await supabase
    .from('merchants')
    .select('business_name, logo_url')
    .eq('id', tx.merchant_id)
    .single();

  // Only query payment link if payment_link_id exists
  let paymentLink = null;
  if (tx.payment_link_id) {
    const { data: linkData } = await supabase
      .from('payment_links')
      .select('title')
      .eq('id', tx.payment_link_id)
      .single();
    paymentLink = linkData;
  }

  const { data: settings } = await supabase
    .from('merchant_settings')
    .select('public_receipts_enabled')
    .eq('merchant_id', tx.merchant_id)
    .single();

  if (settings?.public_receipts_enabled === false) {
    return <ReceiptNotAvailable />;
  }

  const format = (amount: number | null | undefined, currency: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount || 0));

  // FIXED: Correct amount calculation - use base_amount directly, not subtract tax
  const baseAmount = Number(tx.base_amount || tx.amount || 0);
  const totalPaid = Number(tx.total_paid || tx.total_amount_paid || tx.amount || 0);
  
  const explorerBase = tx.network ? explorers[tx.network.toUpperCase()] : undefined;
  const txLink = explorerBase && tx.tx_hash ? `${explorerBase}${tx.tx_hash}` : null;

  // ENHANCED: Format cryptocurrency payment information
  const formatCryptoAmount = (amount: number | null | undefined, currency: string) => {
    if (!amount || !currency) return null;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(amount) + ' ' + currency.toUpperCase();
  };

  const cryptoPaymentInfo = tx.amount_received && tx.pay_currency 
    ? formatCryptoAmount(tx.amount_received, tx.pay_currency)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="shadow-medium">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center space-y-4 mb-8">
              {merchant?.logo_url && (
                <div className="flex justify-center">
                  <Image 
                    src={merchant.logo_url} 
                    alt={merchant.business_name || 'Merchant'} 
                    width={80} 
                    height={80}
                    className="rounded-lg shadow-sm"
                  />
                </div>
              )}
              <div>
                <h1 className="font-phonic text-3xl font-normal tracking-tight text-gray-900 mb-4">
                  {merchant?.business_name || 'Business Name Not Available'}
                </h1>
                {paymentLink?.title && (
                  <p className="font-capsule text-base font-normal text-gray-600">{paymentLink.title}</p>
                )}
              </div>
              
              {/* Status Badge */}
              {tx.status && (
                <div className="flex justify-center">
                  <Badge 
                    variant={tx.status === 'confirmed' ? 'default' : 'secondary'}
                    className="font-phonic text-sm font-normal"
                  >
                    {tx.status === 'confirmed' ? 'Payment Confirmed' : tx.status}
                  </Badge>
                </div>
              )}
            </div>

            <Separator className="my-6" />

            {/* Payment Details */}
            <div className="space-y-4">
              <h2 className="font-phonic text-3xl font-normal text-gray-900">Payment Details</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-capsule text-base font-normal text-gray-600">Base Amount</span>
                  <span className="font-phonic text-base font-normal">{format(baseAmount, tx.currency)}</span>
                </div>
                
                {Number(tx.tax_amount || 0) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="font-capsule text-base font-normal text-gray-600">{tx.tax_label || 'Tax'}</span>
                    <span className="font-phonic text-base font-normal text-green-700">
                      +{format(tx.tax_amount, tx.currency)}
                    </span>
                  </div>
                )}
                
                {Number(tx.tax_amount || 0) > 0 && (
                  <div className="flex justify-between items-center border-t pt-3">
                    <span className="font-phonic text-base font-normal">Subtotal with Tax</span>
                    <span className="font-phonic text-base font-normal">
                      {format(tx.subtotal_with_tax || baseAmount + Number(tx.tax_amount || 0), tx.currency)}
                    </span>
                  </div>
                )}
                
                {Number(tx.gateway_fee_amount || 0) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="font-capsule text-base font-normal text-gray-600">Gateway Fee</span>
                    <span className="font-phonic text-base font-normal text-blue-700">
                      +{format(tx.gateway_fee_amount, tx.currency)}
                    </span>
                  </div>
                )}
                
                {Number(tx.conversion_fee_amount || 0) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="font-capsule text-base font-normal text-gray-600">Conversion Fee</span>
                    <span className="font-phonic text-base font-normal text-blue-700">
                      +{format(tx.conversion_fee_amount, tx.currency)}
                    </span>
                  </div>
                )}
                
                {Number(tx.network_fee_amount || 0) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="font-capsule text-base font-normal text-gray-600">Network Fee</span>
                    <span className="font-phonic text-base font-normal text-blue-700">
                      +{format(tx.network_fee_amount, tx.currency)}
                    </span>
                  </div>
                )}
                
                <Separator className="my-4" />
                
                <div className="flex justify-between items-center">
                  <span className="font-phonic text-3xl font-normal text-gray-900">Total Paid</span>
                  <span className="font-phonic text-3xl font-normal text-primary">
                    {format(totalPaid, tx.currency)}
                  </span>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Transaction Information */}
            <div className="space-y-4">
              <h2 className="font-phonic text-3xl font-normal text-gray-900">Transaction Information</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-capsule text-sm font-normal text-gray-600">Payment Date</span>
                  <span className="font-phonic text-sm font-normal">
                    {new Date(tx.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                
                {tx.nowpayments_payment_id && (
                  <div className="flex justify-between">
                    <span className="font-capsule text-sm font-normal text-gray-600">Payment ID</span>
                    <span className="font-mono text-xs font-normal">{tx.nowpayments_payment_id}</span>
                  </div>
                )}
                
                {cryptoPaymentInfo && (
                  <div className="flex justify-between">
                    <span className="font-capsule text-sm font-normal text-gray-600">Payment Method</span>
                    <span className="font-phonic text-sm font-normal">{cryptoPaymentInfo}</span>
                  </div>
                )}
                
                {tx.asset && tx.network && (
                  <div className="flex justify-between">
                    <span className="font-capsule text-sm font-normal text-gray-600">Network</span>
                    <span className="font-phonic text-sm font-normal">{tx.asset} on {tx.network}</span>
                  </div>
                )}
                
                {tx.tx_hash && (
                  <div className="flex justify-between">
                    <span className="font-capsule text-sm font-normal text-gray-600">Transaction Hash</span>
                    <span className="font-mono text-xs">
                      {txLink ? (
                        <a 
                          href={txLink} 
                          className="text-primary hover:text-primary-600 transition-colors" 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {tx.tx_hash.slice(0, 8)}...{tx.tx_hash.slice(-8)}
                        </a>
                      ) : (
                        <span className="font-phonic text-sm font-normal">
                          {tx.tx_hash.slice(0, 8)}...{tx.tx_hash.slice(-8)}
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Separator className="my-6" />

            {/* Print Button */}
            <div className="flex justify-center">
              <PrintButton />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

