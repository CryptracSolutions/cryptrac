"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { ArrowRight, ArrowLeft, Settings, DollarSign, Shield } from 'lucide-react'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { Badge } from '@/app/components/ui/badge'

interface PaymentConfigData {
  acceptedCryptos: string[]
  feePercentage: number
  autoForward: boolean
}

interface PaymentConfigStepProps {
  data: PaymentConfigData
  onComplete: (data: PaymentConfigData) => void
  onPrevious: () => void
}

const SUPPORTED_CRYPTOS = [
  { code: 'BTC', name: 'Bitcoin', symbol: '₿', popular: true },
  { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', popular: true },
  { code: 'LTC', name: 'Litecoin', symbol: 'Ł', popular: true },
  { code: 'USDT', name: 'Tether', symbol: '₮', popular: false },
  { code: 'USDC', name: 'USD Coin', symbol: '$', popular: false }
]

export default function PaymentConfigStep({ data, onComplete, onPrevious }: PaymentConfigStepProps) {
  const [formData, setFormData] = useState<PaymentConfigData>(data)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCryptoToggle = (crypto: string) => {
    setFormData(prev => ({
      ...prev,
      acceptedCryptos: prev.acceptedCryptos.includes(crypto)
        ? prev.acceptedCryptos.filter(c => c !== crypto)
        : [...prev.acceptedCryptos, crypto]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    onComplete(formData)
    setIsSubmitting(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#7f5efd] to-[#9f7aea] rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
            Configure your payments
          </CardTitle>
          <p className="text-gray-600">
            Choose which cryptocurrencies to accept and review your payment settings.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Accepted Cryptocurrencies */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Accepted Cryptocurrencies
              </h3>
              <p className="text-sm text-gray-600">
                Select which cryptocurrencies you want to accept from customers.
              </p>

              <div className="grid grid-cols-1 gap-3">
                {SUPPORTED_CRYPTOS.map((crypto) => {
                  const isSelected = formData.acceptedCryptos.includes(crypto.code)
                  return (
                    <div
                      key={crypto.code}
                      onClick={() => handleCryptoToggle(crypto.code)}
                      className={`
                        p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                        ${isSelected 
                          ? 'border-[#7f5efd] bg-[#7f5efd]/5' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold
                            ${isSelected ? 'bg-[#7f5efd] text-white' : 'bg-gray-100 text-gray-600'}
                          `}>
                            {crypto.symbol}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-gray-900">
                                {crypto.name}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {crypto.code}
                              </Badge>
                              {crypto.popular && (
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  Popular
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={`
                          w-5 h-5 rounded-full border-2 flex items-center justify-center
                          ${isSelected ? 'border-[#7f5efd] bg-[#7f5efd]' : 'border-gray-300'}
                        `}>
                          {isSelected && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {formData.acceptedCryptos.length === 0 && (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertDescription className="text-amber-800">
                    Please select at least one cryptocurrency to accept.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Fee Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Transaction Fees
              </h3>
              
              <div className="bg-gradient-to-r from-[#7f5efd]/5 to-blue-50 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#7f5efd] rounded-full flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Simple, Transparent Pricing
                    </h4>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex justify-between items-center">
                        <span>Gateway Fee:</span>
                        <span className="font-semibold text-[#7f5efd]">Cryptrac Gateway Fee: 0.5% (no conversion), 1% (auto-convert enabled)</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        • Gateway Fee is automatically deducted per transaction<br/>
                        • Cryptrac does not charge transaction fees<br/>
                        • No hidden fees, $19/month or $199/year subscription
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Flow */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                How Payments Work
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-sm font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Customer Pays</h4>
                    <p className="text-sm text-gray-600">
                      Customer sends cryptocurrency to the payment address
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 text-sm font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Fee Deduction</h4>
                    <p className="text-sm text-gray-600">
                      Gateway Fee is automatically deducted; Cryptrac does not hold or touch any funds.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-[#7f5efd]/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-[#7f5efd] text-sm font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Direct to Your Wallet</h4>
                    <p className="text-sm text-gray-600">
                      Remaining funds are immediately forwarded to your wallet
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <Alert className="border-green-200 bg-green-50">
              <Shield className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Non-Custodial Security:</strong> Cryptrac never holds your funds. 
                All payments go directly to your wallets after fee deduction.
              </AlertDescription>
            </Alert>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onPrevious}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting || formData.acceptedCryptos.length === 0}
                className="bg-[#7f5efd] hover:bg-[#7f5efd]/90 text-white flex items-center"
              >
                {isSubmitting ? 'Saving...' : 'Continue'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

