import { createClient } from '@supabase/supabase-js';
import PrintButton from '@/components/PrintButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { requiresExtraId, getExtraIdLabel } from '@/lib/extra-id-validation';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

function ReceiptNotAvailable() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="shadow-medium">
          <CardContent className="p-8 text-center">
            <h1 className="font-phonic text-5xl font-normal text-gray-900 mb-2">Receipt not available</h1>
            <p className="font-phonic text-base font-normal text-gray-600">This receipt could not be found.</p>
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
      status,
      receipt_metadata
    `)
    .eq('public_receipt_id', receiptId)
    .single();

  if (txError || !tx) {
    console.error('Receipt lookup error:', txError);
    return <ReceiptNotAvailable />;
  }

  // Use embedded receipt metadata for merchant info
  const merchant = tx.receipt_metadata as { business_name?: string; logo_url?: string } | null;

  // Only query payment link if payment_link_id exists
  let paymentLink = null;
  if (tx.payment_link_id) {
    const { data: linkData } = await supabase
      .from('payment_links')
      .select('title, link_id')
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
    <div className="min-h-screen bg-background py-12">
      <div className="container-narrow">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 bg-white">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center space-y-4 mb-8">
              
              <div>
                <h1 className="font-phonic text-3xl font-normal tracking-tight text-gray-900 mb-4">
                  {merchant?.business_name || 'Business Name Not Available'}
                </h1>
                {paymentLink?.title && (
                  <p className="font-phonic text-base font-normal text-gray-600">{paymentLink.title}</p>
                )}
              </div>
              
              {/* Status Badge */}
              {tx.status && (
                <div className="flex justify-center">
                  <Badge 
                    variant={tx.status === 'confirmed' ? 'default' : 'secondary'}
                    className={tx.status === 'confirmed' ? "font-phonic text-sm font-normal bg-[#7f5efd] text-white" : "font-phonic text-sm font-normal"}
                  >
                    {tx.status === 'confirmed' ? 'Payment Confirmed' : tx.status}
                  </Badge>
                </div>
              )}
            </div>

            <Separator className="my-6" />

            {/* Payment Details */}
            <div className="space-y-4">
              <h2 className="font-phonic text-2xl font-normal text-gray-900">Payment Details</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-phonic text-base font-normal text-gray-600">Base Amount</span>
                  <span className="font-phonic text-base font-normal">{format(baseAmount, tx.currency)}</span>
                </div>
                
                {Number(tx.tax_amount || 0) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="font-phonic text-base font-normal text-gray-600">{tx.tax_label || 'Tax'}</span>
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
                    <span className="font-phonic text-base font-normal text-gray-600">Gateway Fee</span>
                    <span className="font-phonic text-base font-normal text-blue-700">
                      +{format(tx.gateway_fee_amount, tx.currency)}
                    </span>
                  </div>
                )}
                
                {Number(tx.conversion_fee_amount || 0) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="font-phonic text-base font-normal text-gray-600">Conversion Fee</span>
                    <span className="font-phonic text-base font-normal text-blue-700">
                      +{format(tx.conversion_fee_amount, tx.currency)}
                    </span>
                  </div>
                )}
                
                {Number(tx.network_fee_amount || 0) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="font-phonic text-base font-normal text-gray-600">Network Fee</span>
                    <span className="font-phonic text-base font-normal text-blue-700">
                      +{format(tx.network_fee_amount, tx.currency)}
                    </span>
                  </div>
                )}
                
                <Separator className="my-4" />
                
                <div className="flex justify-between items-center">
                  <span className="font-phonic text-xl font-medium text-gray-900">Total Paid</span>
                  <span className="font-phonic text-xl font-medium text-[#7f5efd]">
                    {format(totalPaid, tx.currency)}
                  </span>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Transaction Information */}
            <div className="bg-white border-2 border-gray-200 rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-[#7f5efd] to-[#7c3aed] rounded-xl shadow-lg">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0-1.125.504-1.125 1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-phonic text-2xl font-normal text-gray-900">Transaction Information</h2>
                  <p className="font-phonic text-sm font-normal text-gray-600">Payment details and transaction data</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="font-phonic text-sm font-normal text-gray-600">Payment Date</span>
                    <span className="font-phonic text-sm font-medium text-gray-900">
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
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="font-phonic text-sm font-normal text-gray-600">Payment ID</span>
                      <span className="font-mono text-xs font-medium bg-gray-100 px-2 py-1 rounded">{tx.nowpayments_payment_id}</span>
                    </div>
                  )}
                  
                  {paymentLink?.link_id && (
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="font-phonic text-sm font-normal text-gray-600">Link ID</span>
                      <span className="font-mono text-xs font-medium bg-[#7f5efd]/10 text-[#7f5efd] px-2 py-1 rounded">{paymentLink.link_id}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {cryptoPaymentInfo && (
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="font-phonic text-sm font-normal text-gray-600">Payment Method</span>
                      <span className="font-phonic text-sm font-medium text-gray-900">{cryptoPaymentInfo}</span>
                    </div>
                  )}
                  
                  {tx.asset && tx.network && (
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="font-phonic text-sm font-normal text-gray-600">Network</span>
                      <span className="font-phonic text-sm font-medium text-gray-900">{tx.asset} on {tx.network}</span>
                    </div>
                  )}
                  
                  {/* Note: payin_extra_id is not stored in transactions; omit display */}
                  
                  {tx.tx_hash && (
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="font-phonic text-sm font-normal text-gray-600">Transaction Hash</span>
                      <span className="font-mono text-xs">
                        {txLink ? (
                          <a 
                            href={txLink} 
                            className="text-[#7f5efd] hover:text-[#7c3aed] transition-colors bg-[#7f5efd]/10 px-2 py-1 rounded inline-block" 
                            target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {tx.tx_hash.slice(0, 8)}...{tx.tx_hash.slice(-8)}
                        </a>
                        ) : (
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            {tx.tx_hash.slice(0, 8)}...{tx.tx_hash.slice(-8)}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
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
