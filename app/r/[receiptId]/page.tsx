import { createClient } from '@supabase/supabase-js';
import PrintButton from '@/components/PrintButton';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { Logo } from '@/app/components/ui/logo';
import { formatFullDateTime } from '@/lib/utils/date-utils';

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

  // Get merchant timezone for date formatting
  const { data: merchantData } = await supabase
    .from('merchants')
    .select('timezone')
    .eq('id', tx.merchant_id)
    .single();

  const merchantTimezone = merchantData?.timezone || 'America/New_York';

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
    <div className="min-h-screen bg-gradient-to-br from-[#f6f3ff] via-white to-[#eef2ff] py-12">
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body, html {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            .min-h-screen {
              min-height: auto !important;
              padding: 0 !important;
              margin: 0 !important;
              background: white !important;
            }

            .max-w-4xl {
              max-width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
            }

            .shadow-xl, .backdrop-blur {
              box-shadow: none !important;
              backdrop-filter: none !important;
            }

            .print-hide {
              display: none !important;
            }

            .print-compact {
              margin: 0.25rem 0 !important;
            }

            .CardContent {
              padding: 0.75rem !important;
            }

            /* More compact heading sizes */
            h1 { font-size: 1.25rem !important; line-height: 1.3 !important; }
            h2 { font-size: 1.125rem !important; line-height: 1.3 !important; }
            h3 { font-size: 1rem !important; line-height: 1.3 !important; }

            /* Tighter spacing throughout */
            .space-y-6 > * + * {
              margin-top: 0.75rem !important;
            }

            .space-y-4 > * + * {
              margin-top: 0.5rem !important;
            }

            .space-y-2 > * + * {
              margin-top: 0.25rem !important;
            }

            /* Compact gaps */
            .gap-4 {
              gap: 0.5rem !important;
            }

            .gap-6 {
              gap: 0.75rem !important;
            }

            /* Compact padding */
            .p-8 {
              padding: 0.75rem !important;
            }

            .p-6 {
              padding: 0.5rem !important;
            }

            .px-8, .py-8 {
              padding-left: 0.75rem !important;
              padding-right: 0.75rem !important;
              padding-top: 0.75rem !important;
              padding-bottom: 0.75rem !important;
            }

            .px-6, .py-6 {
              padding-left: 0.5rem !important;
              padding-right: 0.5rem !important;
              padding-top: 0.5rem !important;
              padding-bottom: 0.5rem !important;
            }

            /* Compact margins */
            .my-10 {
              margin-top: 0.5rem !important;
              margin-bottom: 0.5rem !important;
            }

            .mb-6, .mt-6 {
              margin-bottom: 0.5rem !important;
              margin-top: 0.5rem !important;
            }

            .mb-4, .mt-4 {
              margin-bottom: 0.25rem !important;
              margin-top: 0.25rem !important;
            }

            /* Smaller text sizes for better fit */
            .text-3xl, .text-4xl {
              font-size: 1.25rem !important;
            }

            .text-2xl {
              font-size: 1.125rem !important;
            }

            .text-xl {
              font-size: 1rem !important;
            }

            .text-lg {
              font-size: 0.9rem !important;
            }

            .text-base {
              font-size: 0.85rem !important;
            }

            .text-sm {
              font-size: 0.75rem !important;
            }

            .text-xs {
              font-size: 0.65rem !important;
            }
          }
        `
      }} />
      <div className="mx-auto w-full max-w-4xl px-4">
        <Card className="border border-white/60 bg-white/90 shadow-xl backdrop-blur">
          <CardContent className="p-8 md:p-12">
            {/* Header */}
            <div className="flex flex-col items-center gap-4 text-center">
              <Logo size="xl" showText={false} emblemClassName="bg-transparent" />

              <div className="space-y-2">
                <p className="font-phonic text-sm uppercase tracking-[0.3em] text-[#7f5efd]">Customer Receipt</p>
                <h1 className="font-phonic text-3xl font-normal tracking-tight text-gray-900 md:text-4xl">
                  {merchant?.business_name || 'Business Name Not Available'}
                </h1>
                {paymentLink?.title && (
                  <p className="font-phonic text-base font-normal text-gray-600">{paymentLink.title}</p>
                )}
              </div>

              <div className="flex flex-col items-center">
                {tx.status && (
                  <Badge
                    variant={tx.status === 'confirmed' ? 'default' : 'secondary'}
                    className={tx.status === 'confirmed' ? 'font-phonic text-xs font-medium uppercase tracking-wide bg-[#7f5efd] text-white' : 'font-phonic text-xs font-medium uppercase tracking-wide bg-gray-900/5 text-gray-700'}
                  >
                    {tx.status === 'confirmed' ? 'Payment Confirmed' : tx.status}
                  </Badge>
                )}
              </div>
            </div>

            <Separator className="my-8 print-compact" />

            {/* Payment Details */}
            <div className="space-y-6 print-compact">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-[#7f5efd]/10 p-3 text-[#7f5efd]">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25l1.5 1.5 6-6" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l1.5 1.5 6-6" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l1.5 1.5 6-6" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 9h6" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 12.75h6" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 16.5H18" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-phonic text-2xl font-normal text-gray-900">Payment Summary</h2>
                  <p className="font-phonic text-sm text-gray-600">All amounts in {tx.currency}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-[#7f5efd]/10 bg-[#7f5efd]/5 p-8">
                <div className="grid gap-6 text-sm text-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="font-phonic text-base text-gray-600">Base Amount</span>
                    <span className="font-phonic text-base text-gray-900">{format(baseAmount, tx.currency)}</span>
                  </div>

                  {Number(tx.tax_amount || 0) > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="font-phonic text-base text-gray-600">{tx.tax_label || 'Tax'}</span>
                      <span className="font-phonic text-base text-green-700">+{format(tx.tax_amount, tx.currency)}</span>
                    </div>
                  )}

                  {Number(tx.tax_amount || 0) > 0 && (
                    <div className="flex items-center justify-between border-t border-white/40 pt-6">
                      <span className="font-phonic text-base text-gray-600">Subtotal with Tax</span>
                      <span className="font-phonic text-base text-gray-900">
                        {format(tx.subtotal_with_tax || baseAmount + Number(tx.tax_amount || 0), tx.currency)}
                      </span>
                    </div>
                  )}

                  {/* Only show gateway fee if customer paid it (total_paid includes gateway fee) */}
                  {Number(tx.gateway_fee_amount || 0) > 0 && totalPaid > (Number(tx.subtotal_with_tax || baseAmount + Number(tx.tax_amount || 0)) + Number(tx.conversion_fee_amount || 0) + Number(tx.network_fee_amount || 0)) && (
                    <div className="flex items-center justify-between">
                      <span className="font-phonic text-base text-gray-600">Gateway Fee</span>
                      <span className="font-phonic text-base text-[#7f5efd]">+{format(tx.gateway_fee_amount, tx.currency)}</span>
                    </div>
                  )}

                  {Number(tx.conversion_fee_amount || 0) > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="font-phonic text-base text-gray-600">Conversion Fee</span>
                      <span className="font-phonic text-base text-[#7f5efd]">+{format(tx.conversion_fee_amount, tx.currency)}</span>
                    </div>
                  )}

                  {Number(tx.network_fee_amount || 0) > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="font-phonic text-base text-gray-600">Network Fee</span>
                      <span className="font-phonic text-base text-[#7f5efd]">+{format(tx.network_fee_amount, tx.currency)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between rounded-2xl bg-white px-6 py-4 shadow-sm">
                    <span className="font-phonic text-lg text-gray-900">Total Paid</span>
                    <span className="font-phonic text-lg text-[#7f5efd]">{format(totalPaid, tx.currency)}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-8 print-compact" />

            {/* Transaction Information */}
            <div className="space-y-6 print-compact">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-[#7f5efd]/10 p-3 text-[#7f5efd]">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125.504 1.125 1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-phonic text-2xl font-normal text-gray-900">Transaction Details</h2>
                  <p className="font-phonic text-sm text-gray-600">Secure blockchain record of your payment</p>
                </div>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-dashed border-gray-200 pb-3">
                    <span className="font-phonic text-sm text-gray-600">Payment Date</span>
                    <span className="font-phonic text-sm text-gray-900">
                      {formatFullDateTime(tx.created_at, merchantTimezone)}
                    </span>
                  </div>

                  {/* Link ID only */}
                  {paymentLink?.link_id && (
                    <div className="flex items-center justify-between border-b border-dashed border-gray-200 pb-3">
                      <span className="font-phonic text-sm text-gray-600">Link ID</span>
                      <span className="font-mono text-xs font-medium text-[#7f5efd]">{paymentLink.link_id}</span>
                    </div>
                  )}

                  {cryptoPaymentInfo && (
                    <div className="flex items-center justify-between border-b border-dashed border-gray-200 pb-3">
                      <span className="font-phonic text-sm text-gray-600">Payment Method</span>
                      <span className="font-phonic text-sm text-gray-900">{cryptoPaymentInfo}</span>
                    </div>
                  )}

                  {tx.asset && tx.network && (
                    <div className="flex items-center justify-between border-b border-dashed border-gray-200 pb-3">
                      <span className="font-phonic text-sm text-gray-600">Network</span>
                      <span className="font-phonic text-sm text-gray-900">{tx.asset} on {tx.network}</span>
                    </div>
                  )}
                </div>

                {tx.tx_hash && (
                  <div className="mt-6 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="font-phonic text-sm text-gray-600">Transaction Hash</span>
                      {txLink && (
                        <a
                          href={txLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-[#7f5efd] bg-[#7f5efd] px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#7c3aed] hover:border-[#7c3aed] shadow-sm"
                        >
                          Verify on Blockchain
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H19.5V12" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 6L10.5 15" />
                          </svg>
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {txLink ? (
                        <a
                          href={txLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 rounded-2xl bg-gray-900/90 px-4 py-3 text-xs text-white shadow-inner font-mono hover:bg-gray-800/90 transition-colors block"
                          title="Click to view on blockchain explorer"
                        >
                          {tx.tx_hash}
                        </a>
                      ) : (
                        <code className="flex-1 block rounded-2xl bg-gray-900/90 px-4 py-3 text-xs text-white shadow-inner font-mono">
                          {tx.tx_hash}
                        </code>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator className="my-8 print-compact" />

            {/* Customer Support Notice */}
            {paymentLink?.link_id && (
              <>
                <div className="rounded-3xl border border-[#7f5efd]/20 bg-gradient-to-br from-[#7f5efd]/5 to-[#7c3aed]/5 p-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-[#7f5efd]/10 p-3 text-[#7f5efd]">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-phonic text-lg font-normal text-gray-900 mb-2">Need Help?</h3>
                      <p className="font-phonic text-sm text-gray-700 leading-relaxed mb-3">
                        If you have any issues with your purchase or order, please contact the merchant directly and reference your <strong>Link ID</strong>:
                      </p>
                      <div className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 border border-[#7f5efd]/30">
                        <code className="font-mono text-sm font-medium text-[#7f5efd]">{paymentLink.link_id}</code>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-8 print-compact" />
              </>
            )}

            {/* Print Button */}
            <div className="flex justify-center print-hide">
              <PrintButton />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
