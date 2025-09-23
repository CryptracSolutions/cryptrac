"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import WalletsManager from '@/app/components/settings/WalletsManager'
import TrustWalletGuide from '@/app/components/onboarding/trust-wallet-guide'
import { Dialog, DialogContent } from '@/app/components/ui/dialog'
import Tooltip from '@/app/components/ui/tooltip'
import { RECOMMENDED_CURRENCIES } from '@/lib/recommended-currencies'
import { CheckCircle, HelpCircle, Wallet, Star, ArrowLeft } from 'lucide-react'
import { LazyMount } from '@/app/components/ui/lazy-mount'

interface WalletSetupStepProps {
  onNext: (wallets: Record<string, string>, walletExtraIds?: Record<string, string>) => void
  onBack: () => void
}

type MerchantSettings = Record<string, unknown> & {
  wallets: Record<string, string>
  wallet_extra_ids?: Record<string, string>
}

// Recommended currencies for merchants (shared with wallets page)
const recommendedCurrencies = RECOMMENDED_CURRENCIES

export default function WalletSetupStep({ onNext, onBack }: WalletSetupStepProps) {
  const [showTrustWalletGuide, setShowTrustWalletGuide] = useState(false)
  const [settings, setSettings] = useState<MerchantSettings>({
    wallets: {},
    wallet_extra_ids: {}
  } as MerchantSettings)
  const [focusCurrency, setFocusCurrency] = useState<string | undefined>()
  const [invalidWallets, setInvalidWallets] = useState<string[]>([]);

  // Check if we have at least one valid wallet configured
  const hasValidWallet = Object.keys(settings.wallets).some(currency => 
    settings.wallets[currency] && settings.wallets[currency].trim()
  ) && invalidWallets.length === 0;

  const handleNext = () => {
    // Only pass wallets that have valid addresses
    const validWallets = Object.fromEntries(
      Object.entries(settings.wallets).filter(([, address]) =>
        address && address.trim()
      )
    )
    
    // Only pass extra_ids for wallets that are configured
    const validExtraIds = settings.wallet_extra_ids ? Object.fromEntries(
      Object.entries(settings.wallet_extra_ids).filter(([currency, extraId]) =>
        validWallets[currency] && extraId && extraId.trim()
      )
    ) : undefined
    
    onNext(validWallets, validExtraIds)
  }

  const handleCurrencyClick = (currencyCode: string) => {
    setFocusCurrency(currencyCode)
    // Clear the focus after a short delay to allow re-clicking the same currency
    setTimeout(() => setFocusCurrency(undefined), 2000)
  }


  return (
    <div className="max-w-3xl mx-auto max-md:px-1">
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm max-md:rounded-2xl max-md:border max-md:border-[#7f5efd]/10">
        <CardHeader className="text-center space-y-6 max-md:space-y-4 max-md:px-6 max-md:text-left">
          <div className="w-20 h-20 bg-gradient-to-br from-[#7f5efd] to-[#9f7aea] rounded-full flex items-center justify-center mx-auto shadow-lg max-md:mx-0 max-md:w-16 max-md:h-16">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-4">
            <CardTitle className="text-2xl font-bold text-gray-900 leading-tight max-md:text-[1.625rem]">
              Set Up Your Crypto Wallets
            </CardTitle>
            <p className="text-lg text-gray-600 leading-relaxed max-w-lg mx-auto max-md:text-base max-md:mx-0">
              Configure wallet addresses for the cryptocurrencies you want to accept. Major stablecoins will be automatically included for each ecosystem.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center items-center gap-6 max-md:flex-col max-md:items-stretch max-md:gap-4">
            <Button
              variant="outline"
              onClick={() => setShowTrustWalletGuide(true)}
              className="flex items-center justify-center gap-2 border-[#7f5efd]/30 text-[#7f5efd] hover:bg-[#7f5efd]/5 hover:border-[#7f5efd]/50 shadow-sm transition-all duration-200 max-md:w-full max-md:h-12"
            >
              <HelpCircle className="h-4 w-4" />
              Setup Guide
            </Button>

            <Tooltip
              trigger={
                <Button
                  variant="outline"
                  className="flex items-center justify-center gap-2 border-[#7f5efd]/30 text-[#7f5efd] hover:bg-[#7f5efd]/5 hover:border-[#7f5efd]/50 shadow-sm transition-all duration-200 max-md:w-full max-md:h-12"
                >
                  <Star className="h-4 w-4" />
                  Highly Recommended
                </Button>
              }
              title="Recommended Networks & Wallets"
              description="These are the most popular cryptocurrencies that Cryptrac merchants typically accept for payments"
              recommendedCurrencies={recommendedCurrencies}
              onCurrencyClick={handleCurrencyClick}
            />
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-8 max-md:p-6 max-md:space-y-6">
          {/* Setup Guide Modal */}
          <Dialog open={showTrustWalletGuide} onOpenChange={setShowTrustWalletGuide}>
            <DialogContent className="w-[92vw] max-w-[92vw] sm:max-w-3xl md:max-w-4xl bg-transparent border-0 shadow-none p-0 max-h-[90vh] overflow-y-auto overscroll-contain max-md:w-[95vw]">
              <TrustWalletGuide
                onComplete={() => setShowTrustWalletGuide(false)}
                onSkip={() => setShowTrustWalletGuide(false)}
              />
            </DialogContent>
          </Dialog>

      {/* Wallets Manager - exact same component as /merchant/wallets */}
      <LazyMount
        className="block"
        placeholder={(
          <Card className="border border-dashed border-[#7f5efd]/40">
            <CardContent className="p-6 space-y-4">
              <div className="h-4 w-40 rounded bg-[#7f5efd]/10 animate-pulse" />
              <div className="h-16 rounded bg-[#7f5efd]/5 animate-pulse" />
              <div className="h-16 rounded bg-[#7f5efd]/5 animate-pulse" />
            </CardContent>
          </Card>
        )}
      >
        <WalletsManager
          settings={settings}
          setSettings={setSettings}
          focusCurrency={focusCurrency}
          onValidationChange={(currency, isValid) => {
            setInvalidWallets(prev => {
              if (isValid) {
                return prev.filter(c => c !== currency);
              } else if (!prev.includes(currency)) {
                return [...prev, currency];
              }
              return prev;
            });
          }}
        />
      </LazyMount>

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
      <div className="flex justify-between pt-8 max-md:flex-col max-md:gap-3 max-md:pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex items-center justify-center max-md:h-12 max-md:w-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button
          onClick={handleNext}
          disabled={!hasValidWallet}
          className="bg-[#7f5efd] hover:bg-[#7f5efd]/90 text-white flex items-center justify-center max-md:h-12 max-md:w-full"
        >
          {hasValidWallet ? 'Continue' : invalidWallets.length > 0 ? 'Fix invalid wallets' : 'Add at least one wallet'}
        </Button>
      </div>
        </CardContent>
      </Card>
    </div>
  )
}
