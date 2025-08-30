"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/app/components/ui/button'
import WalletsManager from '@/app/components/settings/WalletsManager'
import TrustWalletGuide from '@/app/components/onboarding/trust-wallet-guide'
import { CheckCircle } from 'lucide-react'

interface WalletSetupStepProps {
  onNext: (wallets: Record<string, string>) => void
  onBack: () => void
}

type MerchantSettings = Record<string, any> & {
  wallets: Record<string, string>
}

export default function WalletSetupStep({ onNext, onBack }: WalletSetupStepProps) {
  const [showTrustWalletGuide, setShowTrustWalletGuide] = useState(false)
  const [settings, setSettings] = useState<MerchantSettings>({
    wallets: {}
  } as MerchantSettings)

  // Check if we have at least one valid wallet configured
  const hasValidWallet = Object.keys(settings.wallets).some(currency => 
    settings.wallets[currency] && settings.wallets[currency].trim()
  )

  const handleNext = () => {
    // Only pass wallets that have valid addresses
    const validWallets = Object.fromEntries(
      Object.entries(settings.wallets).filter(([_, address]) =>
        address && address.trim()
      )
    )
    onNext(validWallets)
  }

  return (
    <div className="space-y-8">
      {/* Header - matching the style of /merchant/wallets page */}
      <div className="space-y-4">
        <div>
          <h1 className="font-phonic text-3xl font-normal text-gray-900 mb-4">Set Up Your Crypto Wallets</h1>
          <p className="font-phonic text-base font-normal text-gray-600">
            Configure wallet addresses for the cryptocurrencies you want to accept. Major stablecoins will be automatically included for each ecosystem.
          </p>
        </div>
      </div>

      {/* Trust Wallet Guide Modal - Show at top when activated */}
      {showTrustWalletGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <TrustWalletGuide 
              onComplete={() => setShowTrustWalletGuide(false)} 
              onSkip={() => setShowTrustWalletGuide(false)} 
            />
          </div>
        </div>
      )}

      {/* Wallets Manager - exact same component as /merchant/wallets */}
      <WalletsManager
        settings={settings}
        setSettings={setSettings}
        setShowTrustWalletGuide={setShowTrustWalletGuide}
      />

      {/* Progress indicator */}
      {hasValidWallet && (
        <div className="flex items-center gap-2 justify-center text-green-600">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">
            {Object.keys(settings.wallets).filter(c => settings.wallets[c]?.trim()).length} wallet(s) configured
          </span>
        </div>
      )}

      {/* Navigation buttons for onboarding flow */}
      <div className="flex justify-between pt-6 border-t">
        <Button 
          variant="outline" 
          onClick={onBack} 
          className="px-8 h-12 text-base font-medium"
        >
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={!hasValidWallet}
          className="min-w-[140px] px-8 h-12 text-base font-medium bg-[#7f5efd] hover:bg-[#6b4fd8] text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {hasValidWallet ? 'Continue' : 'Add at least one wallet'}
        </Button>
      </div>
    </div>
  )
}