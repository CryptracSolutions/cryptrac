"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/app/components/ui/button'
import WalletsManager from '@/app/components/settings/WalletsManager'
import TrustWalletGuide from '@/app/components/onboarding/trust-wallet-guide'
import Tooltip from '@/app/components/ui/tooltip'
import { CheckCircle, HelpCircle } from 'lucide-react'

interface WalletSetupStepProps {
  onNext: (wallets: Record<string, string>, walletExtraIds?: Record<string, string>) => void
  onBack: () => void
}

type MerchantSettings = Record<string, any> & {
  wallets: Record<string, string>
  wallet_extra_ids?: Record<string, string>
}

// Network logos mapping
const networkLogos: Record<string, string> = {
  'BTC': '₿',
  'ETH': 'Ξ', 
  'ETHBASE': 'Ξ',
  'SOL': '◎',
  'XRP': '●',
  'BNBBSC': '●',
  'ADA': '₳',
  'ALGO': 'A',
  'AVAX': '▲',
  'CRO': '◇',
  'DOGE': 'Ð',
  'HYPE': 'H',
  'LTC': 'Ł',
  'DOT': '●',
  'SUI': 'S',
  'TON': 'T',
  'TRX': '▼',
  'XLM': '*',
}


// Recommended currencies for merchants
const recommendedCurrencies = [
  { code: 'BTC', name: 'Bitcoin', logo: networkLogos['BTC'] },
  { code: 'ETH', name: 'Ethereum', logo: networkLogos['ETH'] },
  { code: 'ETHBASE', name: 'Ethereum', logo: networkLogos['ETHBASE'] },
  { code: 'SOL', name: 'Solana', logo: networkLogos['SOL'] },
  { code: 'ALGO', name: 'Algorand', logo: networkLogos['ALGO'] },
  { code: 'AVAX', name: 'Avalanche', logo: networkLogos['AVAX'] },
  { code: 'BNBBSC', name: 'Binance Coin (BSC)', logo: networkLogos['BNBBSC'] },
  { code: 'ADA', name: 'Cardano', logo: networkLogos['ADA'] },
  { code: 'CRO', name: 'Crypto.com Coin', logo: networkLogos['CRO'] },
  { code: 'DOGE', name: 'Dogecoin', logo: networkLogos['DOGE'] },
  { code: 'HYPE', name: 'Hyperliquid', logo: networkLogos['HYPE'] },
  { code: 'LTC', name: 'Litecoin', logo: networkLogos['LTC'] },
  { code: 'DOT', name: 'Polkadot', logo: networkLogos['DOT'] },
  { code: 'XRP', name: 'Ripple', logo: networkLogos['XRP'] },
  { code: 'SUI', name: 'Sui', logo: networkLogos['SUI'] },
  { code: 'TON', name: 'Toncoin', logo: networkLogos['TON'] },
  { code: 'TRX', name: 'Tron', logo: networkLogos['TRX'] },
  { code: 'XLM', name: 'Stellar', logo: networkLogos['XLM'] },
]

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
      Object.entries(settings.wallets).filter(([_, address]) =>
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

      {/* Action Buttons */}
      <div className="flex justify-center items-center gap-6">
        <Button
          variant="outline"
          onClick={() => setShowTrustWalletGuide(true)}
          className="flex items-center gap-2 border-[#7f5efd]/30 text-[#7f5efd] hover:bg-[#7f5efd]/5 hover:border-[#7f5efd]/50 shadow-sm transition-all duration-200"
        >
          <HelpCircle className="h-4 w-4" />
          Setup Guide
        </Button>

        <Tooltip
          trigger={
            <Button
              variant="outline"
              className="flex items-center gap-2 border-[#7f5efd]/30 text-[#7f5efd] hover:bg-[#7f5efd]/5 hover:border-[#7f5efd]/50 shadow-sm transition-all duration-200"
            >
              <span className="text-lg">⭐</span>
              Highly Recommended
            </Button>
          }
          title="Recommended Networks & Wallets"
          description="These are the most popular cryptocurrencies that Cryptrac merchants typically accept for payments"
          recommendedCurrencies={recommendedCurrencies}
          onCurrencyClick={handleCurrencyClick}
          className="w-full flex justify-center"
        />
      </div>

      {/* Wallets Manager - exact same component as /merchant/wallets */}
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
          {hasValidWallet ? 'Continue' : invalidWallets.length > 0 ? 'Fix invalid wallets' : 'Add at least one wallet'}
        </Button>
      </div>
    </div>
  )
}
