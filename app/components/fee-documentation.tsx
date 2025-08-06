import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Separator } from '@/app/components/ui/separator'
import { Info, DollarSign, Network, CreditCard, Coins, AlertTriangle, CheckCircle } from 'lucide-react'

interface FeeDocumentationProps {
  variant?: 'full' | 'compact' | 'tooltip'
  showComparison?: boolean
  showNetworkFees?: boolean
  showGatewayFees?: boolean
}

export function FeeDocumentation({ 
  variant = 'full', 
  showComparison = true,
  showNetworkFees = true,
  showGatewayFees = true 
}: FeeDocumentationProps) {
  
  if (variant === 'tooltip') {
    return (
      <div className="max-w-sm space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-blue-500" />
          <span className="font-medium">Network Fees</span>
        </div>
        <p className="text-gray-600">
          Charged by blockchain networks (not Cryptrac). Varies by coin type, network congestion, and transaction size.
        </p>
        
        <div className="flex items-center gap-2 mt-3">
          <CreditCard className="h-4 w-4 text-green-500" />
          <span className="font-medium">Gateway Fees</span>
        </div>
        <p className="text-gray-600">
          0.5% (direct) or 1% (auto-convert). You choose who pays: customer or merchant.
        </p>
        
        <div className="bg-blue-50 p-2 rounded mt-3">
          <p className="text-xs text-blue-700">
              <strong>Note:</strong> Cryptrac doesn&apos;t earn from these fees. Our revenue is the $19/month subscription.
          </p>
        </div>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <Card className="border-blue-100 bg-blue-50/50">
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900">Understanding Payment Fees</h4>
            </div>
            
            <div className="grid gap-3 md:grid-cols-2">
              {showNetworkFees && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Network className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-sm">Network Fees</span>
                    <Badge variant="outline" className="text-xs">Variable</Badge>
                  </div>
                  <p className="text-xs text-gray-600">
                    Paid to blockchain miners/validators. Varies by network congestion and coin type.
                  </p>
                </div>
              )}
              
              {showGatewayFees && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-sm">Gateway Fees</span>
                    <Badge variant="outline" className="text-xs">0.5% - 1%</Badge>
                  </div>
                  <p className="text-xs text-gray-600">
                    Processing fee. You choose if customer or merchant pays.
                  </p>
                </div>
              )}
            </div>
            
            <div className="bg-white p-2 rounded border border-blue-200">
              <p className="text-xs text-blue-700">
                <CheckCircle className="h-3 w-3 inline mr-1" />
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
            <DollarSign className="h-6 w-6 text-blue-600" />
            Understanding Payment Fees: Crypto vs. Traditional Processors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Introduction */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Key Principle</h3>
            <p className="text-blue-800">
              Every payment processor charges a &quot;per-transaction fee.&quot; With crypto payments, there are two separate fees:
              <strong> network fees</strong> (paid to blockchain) and <strong>gateway fees</strong> (paid to payment processor).
            </p>
          </div>

          {/* Traditional Processors Comparison */}
          {showComparison && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
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
                    <div className="font-semibold text-red-600">Stripe</div>
                    <div className="text-sm text-gray-600">2.9% + $0.30</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded border">
                    <div className="font-semibold text-blue-600">PayPal</div>
                    <div className="text-sm text-gray-600">2.9% + $0.30</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded border">
                    <div className="font-semibold text-gray-600">Square</div>
                    <div className="text-sm text-gray-600">2.6% + $0.10</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Crypto Payment Fees */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Crypto Payment Fees
            </h3>
            <p className="text-gray-700 mb-4">
              With crypto payments, a similar concept applies but with two separate fee components:
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Network Fees */}
              {showNetworkFees && (
                <Card className="border-orange-200 bg-orange-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Network className="h-5 w-5 text-orange-600" />
                      Network Fees
                      <Badge variant="outline" className="bg-orange-100 text-orange-700">Variable</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-gray-700">
                        Charged by the <strong>blockchain network</strong> (not by Cryptrac). This pays the &quot;miners&quot; or &quot;validators&quot;
                      who process transactions on the blockchain.
                    </p>
                    
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

                    <div className="bg-orange-100 p-3 rounded border border-orange-200">
                      <p className="text-sm text-orange-800">
                        <strong>Example:</strong> Some networks like Bitcoin and Ethereum have higher fees, 
                        while others like Solana, XRP, Tron, Base, or BNB are much lower.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Gateway Fees */}
              {showGatewayFees && (
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-green-600" />
                      Gateway Fees
                      <Badge variant="outline" className="bg-green-100 text-green-700">0.5% - 1%</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-gray-700">
                      Processing fee charged by the payment gateway for handling the transaction, 
                      managing risk, and forwarding funds to your wallet.
                    </p>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Gateway Fee Structure:</h4>
                      <div className="grid gap-2">
                        <div className="flex justify-between items-center p-2 bg-white rounded border">
                          <span className="text-sm">Direct Payments</span>
                          <Badge className="bg-green-100 text-green-700">0.5%</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white rounded border">
                          <span className="text-sm">Auto-Convert Payments</span>
                          <Badge className="bg-green-100 text-green-700">1.0%</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-100 p-3 rounded border border-green-200">
                      <p className="text-sm text-green-800">
                        <strong>Your Choice:</strong> You decide whether the customer pays this fee 
                        (added at checkout) or you absorb it (deducted from payout).
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <Separator />

          {/* Impact on Small Payments */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Why This Matters for Small Payments
            </h3>
            <p className="text-yellow-800 mb-3">
              Both processor fees ($0.30 fixed per transaction) and crypto network fees have a bigger impact on small sales. 
              For example, a $0.30 processor fee is 6% of a $5 sale.
            </p>
            <p className="text-yellow-800">
              <strong>Recommendation:</strong> Set a minimum payment amount for both card and crypto payments to maintain profitability.
            </p>
          </div>

          {/* Cryptrac Revenue Transparency */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Cryptrac Revenue Transparency
            </h3>
            <p className="text-blue-800">
              <strong>Cryptrac does not earn any revenue from transaction fees.</strong> Neither the gateway fee nor the network fee 
              goes to Cryptrac. Our only revenue is the <strong>$19/month subscription</strong> for platform access.
            </p>
          </div>

          {/* Bottom Line */}
          {showComparison && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900 mb-2">The Bottom Line</h3>
              <p className="text-green-800 text-lg">
                <strong>99% of the time, it will be cheaper for merchants to accept crypto payments vs. card payments.</strong>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default FeeDocumentation

