"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { CheckCircle, ArrowRight, Wallet, Building2, Settings, Sparkles } from 'lucide-react'
import { LoadingSpinner } from '@/app/components/ui/loading-spinner'

interface OnboardingData {
  businessInfo: {
    businessName: string
    website: string
    industry: string
    description: string
  }
  walletConfig: {
    walletType: 'generate' | 'existing'
    wallets: Record<string, string>
    mnemonic?: string
  }
  paymentConfig: {
    acceptedCryptos: string[]
    feePercentage: number
    autoForward: boolean
  }
}

interface SuccessStepProps {
  onboardingData: OnboardingData
  onFinish: () => void
  isLoading: boolean
}

export default function SuccessStep({ onboardingData, onFinish, isLoading }: SuccessStepProps) {
  const { businessInfo, walletConfig, paymentConfig } = onboardingData

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg border-0 bg-white relative overflow-hidden">

        <CardHeader className="text-center pb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
            Congratulations!
          </CardTitle>
          <p className="text-lg text-gray-600">
            Your Cryptrac account is ready to accept cryptocurrency payments!
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Setup Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-[#7f5efd]" />
              Your Setup Summary
            </h3>

            {/* Business Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Building2 className="w-5 h-5 text-[#7f5efd] mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Business Information</h4>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <div><strong>Name:</strong> {businessInfo.businessName}</div>
                    {businessInfo.website && (
                      <div><strong>Website:</strong> {businessInfo.website}</div>
                    )}
                    <div><strong>Industry:</strong> {businessInfo.industry}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Wallet Config */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Wallet className="w-5 h-5 text-[#7f5efd] mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Wallet Configuration</h4>
                  <div className="mt-2 space-y-2">
                    <div className="text-sm text-gray-600">
                      <strong>Type:</strong> {walletConfig.walletType === 'generate' ? 'Generated New Wallets' : 'Existing Wallets'}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(walletConfig.wallets).map(crypto => (
                        <Badge key={crypto} variant="secondary">
                          {crypto}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Config */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Settings className="w-5 h-5 text-[#7f5efd] mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Payment Settings</h4>
                  <div className="mt-2 space-y-2">
                    <div className="text-sm text-gray-600">
                      <strong>Gateway Fee:</strong> 0.5% (no conversion), 1% (auto-convert enabled)
                    </div>
                    <div>
                      <span className="text-sm text-gray-600"><strong>Accepted Cryptos:</strong></span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {paymentConfig.acceptedCryptos.map(crypto => (
                          <Badge key={crypto} className="bg-[#7f5efd] text-white">
                            {crypto}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-gradient-to-r from-[#7f5efd]/5 to-blue-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-3">What&apos;s next?</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-[#7f5efd] rounded-full"></div>
                <span>Create your first payment link</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-[#7f5efd] rounded-full"></div>
                <span>Generate QR codes for in-person payments</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-[#7f5efd] rounded-full"></div>
                <span>Monitor your payments in real-time</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-[#7f5efd] rounded-full"></div>
                <span>Track your earnings and analytics</span>
              </div>
            </div>
          </div>

          {/* Important Reminders */}
          {walletConfig.walletType === 'generate' && walletConfig.mnemonic && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-medium text-amber-800 mb-2">🔐 Important Reminder</h4>
              <p className="text-sm text-amber-700">
                Don&apos;t forget to save your recovery phrase securely! You&apos;ll need it to import your 
                wallets into apps like Coinbase Wallet, MetaMask, or Exodus.
              </p>
            </div>
          )}

          {/* Finish Button */}
          <div className="pt-4">
            <Button
              onClick={onFinish}
              disabled={isLoading}
              className="w-full bg-[#7f5efd] hover:bg-[#7f5efd]/90 text-white py-3 text-base font-semibold"
              size="lg"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner className="w-5 h-5 mr-2" />
                  Setting up your account...
                </>
              ) : (
                <>
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Support */}
          <div className="text-center pt-4">
            <p className="text-xs text-gray-500">
              Questions? We&apos;re here to help at{' '}
              <a href="mailto:support@cryptrac.com" className="text-[#7f5efd] hover:underline">
                support@cryptrac.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

