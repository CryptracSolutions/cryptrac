import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Separator } from '@/app/components/ui/separator'
import { Info, DollarSign, Network, CreditCard, Coins, CheckCircle } from 'lucide-react'
function formatUsd(n: number | null | undefined) {
  if (n == null || !isFinite(n)) return '—'
  if (n < 0.01) return `<$0.01`
  return `$${n.toFixed(n < 1 ? 2 : n < 10 ? 2 : 2)}`
}

function NetworkFeeEstimator() {
  const [fees, setFees] = useState<{ btc?: number|null; eth?: number|null; sol?: number|null; xrp?: number|null; base?: number|null; trx?: number|null; bnb?: number|null; sui?: number|null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/network-fees', { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (mounted) {
          setFees(data)
        }
      } catch {
        if (mounted) setError('Unavailable')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const item = (label: string, value?: number | null) => (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-800">{label}</span>
      <span className="font-bold text-[#7f5efd]">{formatUsd(value ?? null)}</span>
    </div>
  )

  return (
    <div className="bg-gray-100 p-3 rounded border border-gray-200">
      <div className="text-sm font-medium text-gray-800 mb-2">Live average network fee (USD)</div>
      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {!loading && error && <div className="text-sm text-gray-500">{error}</div>}
      {!loading && !error && fees && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {item('Bitcoin', fees.btc)}
          {item('Ethereum', fees.eth)}
          {item('Solana', fees.sol)}
          {item('XRP', fees.xrp)}
          {item('Sui', fees.sui)}
          {item('Base', fees.base)}
          {item('Tron', fees.trx)}
          {item('BNB', fees.bnb)}
        </div>
      )}
    </div>
  )
}


interface FeeDocumentationProps {
  variant?: 'full' | 'compact' | 'tooltip'
  showComparison?: boolean
  showNetworkFees?: boolean
  showGatewayFees?: boolean
  /**
   * Color variant controls the palette. "landing" uses only white/gray/black and Cryptrac Purple.
   */
  colorVariant?: 'default' | 'landing'
  /**
   * Optional content to render above the dynamic fee estimator inside the Network Fees card.
   * Provided by the caller so copy can live outside this component.
   */
  networkFeesNote?: React.ReactNode
}

export function FeeDocumentation({ 
  variant = 'full', 
  showComparison = true,
  showNetworkFees = true,
  showGatewayFees = true,
  colorVariant = 'default',
  networkFeesNote
}: FeeDocumentationProps) {
  const isLanding = colorVariant === 'landing'
  
  if (variant === 'tooltip') {
    return (
      <div className="max-w-sm space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <Network className={"h-4 w-4 " + (isLanding ? 'text-[#7f5efd]' : 'text-blue-500')} />
          <span className="font-medium">Network Fees</span>
        </div>
        <p className="text-gray-600">
          Charged by blockchain networks (not Cryptrac). Varies by coin type, network congestion, and transaction size.
        </p>
        
        <div className="flex items-center gap-2 mt-3">
          <CreditCard className={"h-4 w-4 " + (isLanding ? 'text-[#7f5efd]' : 'text-green-500')} />
          <span className="font-medium">Gateway Fees</span>
        </div>
        <p className="text-gray-600">
          0.5% (direct) or 1% (auto-convert). You choose who pays: customer or merchant.
        </p>
        
        <div className={(isLanding ? 'bg-gray-50' : 'bg-blue-50') + " p-2 rounded mt-3 " + (isLanding ? '' : '')}>
          <p className={"text-xs " + (isLanding ? 'text-gray-700' : 'text-blue-700')}>
              <strong>Note:</strong> Cryptrac doesn&apos;t earn from these fees. Our revenue is the $19/month subscription.
          </p>
        </div>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <Card className={isLanding ? 'border-gray-200 bg-white' : 'border-blue-100 bg-blue-50/50'}>
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Info className={"h-5 w-5 " + (isLanding ? 'text-[#7f5efd]' : 'text-blue-600')} />
              <h4 className={"font-semibold " + (isLanding ? 'text-gray-900' : 'text-blue-900')}>Understanding Payment Fees</h4>
            </div>
            
            <div className="grid gap-3 md:grid-cols-2">
              {showNetworkFees && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Network className={"h-4 w-4 " + (isLanding ? 'text-[#7f5efd]' : 'text-blue-500')} />
                    <span className="font-medium text-sm">Network Fees</span>
                    <Badge variant="outline" className={"text-xs " + (isLanding ? 'border-gray-300 text-gray-700' : '')}>Variable</Badge>
                  </div>
                  <p className="text-xs text-gray-600">
                    Paid to blockchain miners/validators. Varies by network congestion and coin type.
                  </p>
                </div>
              )}
              
              {showGatewayFees && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className={"h-4 w-4 " + (isLanding ? 'text-[#7f5efd]' : 'text-green-500')} />
                    <span className="font-medium text-sm">Gateway Fees</span>
                    <Badge variant="outline" className={"text-xs " + (isLanding ? 'border-[#7f5efd] text-[#7f5efd] bg-[#7f5efd]/10' : '')}>0.5% - 1%</Badge>
                  </div>
                  <p className="text-xs text-gray-600">
                    Gateway fee. You choose whether the customer or merchant pays.
                  </p>
                </div>
              )}
            </div>
            
            <div className={"bg-white p-2 rounded border " + (isLanding ? 'border-gray-200' : 'border-blue-200')}>
              <p className={"text-xs " + (isLanding ? 'text-gray-700' : 'text-blue-700')}>
                <CheckCircle className={"h-3 w-3 inline mr-1 " + (isLanding ? 'text-[#7f5efd]' : '')} />
                  <strong>Cryptrac Revenue:</strong> Only the $19/month subscription. We don&apos;t earn from transaction fees.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Full documentation
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isLanding ? null : (
              <DollarSign className="h-6 w-6 text-blue-600" />
            )}
            {isLanding ? 'Crypto vs. Traditional Processors' : 'Understanding Payment Fees: Crypto vs. Traditional Processors'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Introduction */}
          {!isLanding && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Key Principle</h3>
              <p className="text-blue-800">
                Every payment processor charges a &quot;per-transaction fee.&quot; With crypto payments, there are two separate fees:
                <strong> network fees</strong> (paid to blockchain) and <strong>gateway fees</strong> (paid to payment processor).
              </p>
            </div>
          )}

          {/* Traditional Processors Comparison */}
          {showComparison && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CreditCard className={"h-5 w-5 " + (isLanding ? 'text-[#7f5efd]' : '')} />
                Traditional Payment Processors
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-3">
                  Companies like <strong>Stripe, PayPal, and Square</strong> process card payments and apply their own fees—typically 
                  <strong> 2.9% + $0.30 per transaction</strong>. These are not fees from the credit card companies (Visa/Mastercard), 
                  but from the payment processors who handle the transaction, manage risk, and send you your money.
                </p>
                <div className="grid gap-2 md:grid-cols-3">
                  <div className="text-center p-2 bg-white rounded border">
                    <div className={"font-semibold " + (isLanding ? 'text-gray-800' : 'text-red-600')}>Stripe</div>
                    <div className="text-sm text-gray-600">2.9% + $0.30</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded border">
                    <div className={"font-semibold " + (isLanding ? 'text-gray-800' : 'text-blue-600')}>PayPal</div>
                    <div className="text-sm text-gray-600">2.9% + $0.30</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded border">
                    <div className={"font-semibold " + (isLanding ? 'text-gray-800' : 'text-gray-600')}>Square</div>
                    <div className="text-sm text-gray-600">2.6% + $0.10</div>
                  </div>
                  {isLanding && (
                    <div className="text-center p-2 bg-white rounded border md:col-span-3">
                      <div className="font-semibold text-[#7f5efd]">Cryptrac</div>
                      <div className="text-sm font-medium text-[#7f5efd]">0.5% - 1%</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Crypto Payment Fees */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Coins className={"h-5 w-5 " + (isLanding ? 'text-[#7f5efd]' : '')} />
              {isLanding ? 'Crypto Payments with Cryptrac' : 'Crypto Payment Fees'}
            </h3>
            <p className="text-gray-700 mb-4">
              With crypto payments, a similar concept applies but with two separate fee components:
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Network Fees */}
              {showNetworkFees && (
                <Card className={isLanding ? 'border-gray-200 bg-white' : 'border-orange-200 bg-orange-50/50'}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Network className={"h-5 w-5 " + (isLanding ? 'text-[#7f5efd]' : 'text-orange-600')} />
                      Network Fees
                      <Badge variant="outline" className={isLanding ? 'border-[#7f5efd] text-[#7f5efd] bg-[#7f5efd]/10' : 'bg-orange-100 text-orange-700'}>Variable</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-gray-700">
                        Charged by the <strong>blockchain network</strong> (not by Cryptrac). This pays the &quot;miners&quot; or &quot;validators&quot;
                      who process transactions on the blockchain.
                    </p>
                    
                    {!isLanding && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">Network Fee Factors:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• <strong>Coin/Network Type:</strong> Bitcoin & Ethereum = higher, Solana & Tron = lower</li>
                          <li>• <strong>Transaction Size:</strong> Larger amounts may have higher fees</li>
                          <li>• <strong>Network Congestion:</strong> Busy networks = higher fees</li>
                          <li>• <strong>Gateway Routing:</strong> Internal processing choices</li>
                          <li>• <strong>Auto-Convert Setting:</strong> Additional conversion fees</li>
                        </ul>
                      </div>
                    )}

                    {isLanding ? (
                      <>
                        {networkFeesNote && (
                          <div className="mb-2">
                            {networkFeesNote}
                          </div>
                        )}
                        <NetworkFeeEstimator />
                      </>
                    ) : (
                      <div className="bg-orange-100 p-3 rounded border border-orange-200">
                        <p className="text-sm text-orange-800">
                          <strong>Example:</strong> Some networks like Bitcoin and Ethereum have higher fees, 
                          while others like Solana, XRP, Tron, Base, or BNB are much lower.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Gateway Fees */}
              {showGatewayFees && (
                <Card className={isLanding ? 'border-gray-200 bg-white' : 'border-green-200 bg-green-50/50'}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className={"h-5 w-5 " + (isLanding ? 'text-[#7f5efd]' : 'text-green-600')} />
                      Gateway Fees
                      <Badge variant="outline" className={isLanding ? 'border-[#7f5efd] text-[#7f5efd] bg-[#7f5efd]/10' : 'bg-green-100 text-green-700'}>0.5% - 1%</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-gray-700">
                      Gateway fee charged by the payment gateway for handling the transaction,
                      managing risk, and forwarding funds to your wallet.
                    </p>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Gateway Fee Structure:</h4>
                      <div className="grid gap-2">
                        <div className="flex justify-between items-center p-2 bg-white rounded border">
                          <span className="text-sm">Direct Payments</span>
                          <span className={isLanding ? 'font-bold text-[#7f5efd]' : 'font-bold text-green-700'}>0.5%</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white rounded border">
                          <span className="text-sm">Auto-Convert Payments</span>
                          <span className={isLanding ? 'font-bold text-[#7f5efd]' : 'font-bold text-green-700'}>1.0%</span>
                        </div>
                      </div>
                    </div>

                    <div className={(isLanding ? 'bg-gray-100 border border-gray-200' : 'bg-green-100 border border-green-200') + ' p-3 rounded'}>
                      <p className={"text-sm " + (isLanding ? 'text-gray-800' : 'text-green-800')}>
                        <strong className={isLanding ? 'text-[#7f5efd]' : ''}>Your Choice:</strong> You decide whether the customer pays this fee 
                        (added at checkout) or you absorb it (deducted from payout).
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <Separator />



          {/* Cryptrac Revenue Transparency */}
          <div className={(isLanding ? 'bg-gray-50 border border-gray-200' : 'bg-blue-50 border border-blue-200') + ' p-4 rounded-lg'}>
            <h3 className={"font-semibold mb-2 flex items-center gap-2 " + (isLanding ? 'text-gray-900' : 'text-blue-900')}>
              <CheckCircle className={"h-5 w-5 " + (isLanding ? 'text-[#7f5efd]' : '')} />
              {isLanding ? 'Revenue Transparency' : 'Cryptrac Revenue Transparency'}
            </h3>
            <p className={isLanding ? 'text-gray-800' : 'text-blue-800'}>
              <strong>Cryptrac does not earn any revenue from transaction fees.</strong> Neither the gateway fee nor the network fee 
              goes to Cryptrac. Our only revenue is the <span className={isLanding ? 'text-[#7f5efd] font-semibold' : ''}>$19/month</span> subscription for platform access.
            </p>
          </div>


        </CardContent>
      </Card>
    </div>
  )
}

export default FeeDocumentation

