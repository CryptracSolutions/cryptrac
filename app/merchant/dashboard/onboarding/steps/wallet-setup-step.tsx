"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { ArrowRight, ArrowLeft, Wallet, Plus, Trash2, Copy, Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { Badge } from '@/app/components/ui/badge'

interface WalletConfigData {
  walletType: 'generate' | 'existing'
  wallets: Record<string, string>
  mnemonic?: string
}

interface WalletSetupStepProps {
  data: WalletConfigData
  onComplete: (data: WalletConfigData) => void
  onPrevious: () => void
}

const SUPPORTED_CRYPTOS = [
  { code: 'BTC', name: 'Bitcoin', symbol: '₿' },
  { code: 'ETH', name: 'Ethereum', symbol: 'Ξ' },
  { code: 'LTC', name: 'Litecoin', symbol: 'Ł' },
  { code: 'USDT', name: 'Tether', symbol: '₮' },
  { code: 'USDC', name: 'USD Coin', symbol: '$' }
]

export default function WalletSetupStep({ data, onComplete, onPrevious }: WalletSetupStepProps) {
  const [formData, setFormData] = useState<WalletConfigData>(data)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMnemonic, setShowMnemonic] = useState(false)
  const [mnemonicCopied, setMnemonicCopied] = useState(false)

  // Mock generated mnemonic (in real app, this would come from crypto library)
  const mockMnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"

  const validateWalletAddress = (crypto: string, address: string): boolean => {
    if (!address.trim()) return false
    
    // Basic validation patterns (in real app, use proper crypto libraries)
    const patterns: Record<string, RegExp> = {
      BTC: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/,
      ETH: /^0x[a-fA-F0-9]{40}$/,
      LTC: /^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$/,
      USDT: /^0x[a-fA-F0-9]{40}$/, // ERC-20
      USDC: /^0x[a-fA-F0-9]{40}$/, // ERC-20
    }
    
    return patterns[crypto]?.test(address) || false
  }

  const handleGenerateWallets = () => {
    // Mock wallet generation (in real app, use crypto libraries)
    const mockWallets: Record<string, string> = {
      BTC: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
      ETH: '0x742d35Cc6634C0532925a3b8D0C9C0E5C5F8b4C9',
      LTC: 'LdP8Qox1VAhCzLJNqrr74YovaWYyNBUWvL'
    }

    setFormData(prev => ({
      ...prev,
      walletType: 'generate',
      wallets: mockWallets,
      mnemonic: mockMnemonic
    }))
  }

  const handleAddWallet = () => {
    const availableCryptos = SUPPORTED_CRYPTOS.filter(
      crypto => !formData.wallets[crypto.code]
    )
    
    if (availableCryptos.length > 0) {
      const firstAvailable = availableCryptos[0].code
      setFormData(prev => ({
        ...prev,
        wallets: { ...prev.wallets, [firstAvailable]: '' }
      }))
    }
  }

  const handleRemoveWallet = (crypto: string) => {
    const newWallets = { ...formData.wallets }
    delete newWallets[crypto]
    setFormData(prev => ({ ...prev, wallets: newWallets }))
    
    // Clear any errors for this wallet
    const newErrors = { ...errors }
    delete newErrors[crypto]
    setErrors(newErrors)
  }

  const handleWalletChange = (crypto: string, address: string) => {
    setFormData(prev => ({
      ...prev,
      wallets: { ...prev.wallets, [crypto]: address }
    }))
    
    // Clear error when user starts typing
    if (errors[crypto]) {
      setErrors(prev => ({ ...prev, [crypto]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (Object.keys(formData.wallets).length === 0) {
      newErrors.general = 'Please add at least one wallet address'
    }

    Object.entries(formData.wallets).forEach(([crypto, address]) => {
      if (!address.trim()) {
        newErrors[crypto] = 'Address is required'
      } else if (!validateWalletAddress(crypto, address)) {
        newErrors[crypto] = `Invalid ${crypto} address format`
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    onComplete(formData)
    setIsSubmitting(false)
  }

  const copyMnemonic = async () => {
    if (formData.mnemonic) {
      await navigator.clipboard.writeText(formData.mnemonic)
      setMnemonicCopied(true)
      setTimeout(() => setMnemonicCopied(false), 2000)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#7f5efd] to-[#9f7aea] rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
            Set up your crypto wallets
          </CardTitle>
          <p className="text-gray-600">
            Configure where you want to receive cryptocurrency payments. All funds go directly to your wallets.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs 
              value={formData.walletType} 
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                walletType: value as 'generate' | 'existing',
                wallets: value === 'generate' ? prev.wallets : {},
                mnemonic: value === 'generate' ? prev.mnemonic : undefined
              }))}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="generate">Generate New</TabsTrigger>
                <TabsTrigger value="existing">Use Existing</TabsTrigger>
              </TabsList>

              {/* Generate New Wallets Tab */}
              <TabsContent value="generate" className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <Shield className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Secure & Easy:</strong> We'll generate new wallet addresses for you. 
                    You'll get a recovery phrase to import into any wallet app.
                  </AlertDescription>
                </Alert>

                {!formData.wallets.BTC ? (
                  <div className="text-center py-8">
                    <Button
                      type="button"
                      onClick={handleGenerateWallets}
                      className="bg-[#7f5efd] hover:bg-[#7f5efd]/90 text-white"
                      size="lg"
                    >
                      Generate Wallet Addresses
                    </Button>
                    <p className="text-sm text-gray-500 mt-2">
                      This will create secure addresses for Bitcoin, Ethereum, and Litecoin
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Generated Wallets */}
                    <div className="space-y-3">
                      <h3 className="font-medium text-gray-900">Your Generated Wallets:</h3>
                      {Object.entries(formData.wallets).map(([crypto, address]) => {
                        const cryptoInfo = SUPPORTED_CRYPTOS.find(c => c.code === crypto)
                        return (
                          <div key={crypto} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Badge variant="secondary">{crypto}</Badge>
                              <span className="text-sm font-mono text-gray-600 truncate max-w-xs">
                                {address}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => navigator.clipboard.writeText(address)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>

                    {/* Recovery Phrase */}
                    {formData.mnemonic && (
                      <div className="space-y-3">
                        <Alert className="border-amber-200 bg-amber-50">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <AlertDescription className="text-amber-800">
                            <strong>Important:</strong> Save your recovery phrase securely. 
                            You'll need it to import these wallets into Coinbase Wallet, MetaMask, or Exodus.
                          </AlertDescription>
                        </Alert>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">
                              Recovery Phrase (12 words)
                            </label>
                            <div className="flex space-x-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowMnemonic(!showMnemonic)}
                              >
                                {showMnemonic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={copyMnemonic}
                              >
                                <Copy className="w-4 h-4" />
                                {mnemonicCopied && <span className="ml-1 text-xs">Copied!</span>}
                              </Button>
                            </div>
                          </div>
                          <div className="p-3 bg-gray-100 rounded-lg font-mono text-sm">
                            {showMnemonic ? formData.mnemonic : '••• ••• ••• ••• ••• ••• ••• ••• ••• ••• ••• •••'}
                          </div>
                          <p className="text-xs text-gray-500">
                            💡 Import this phrase into your preferred wallet app to access your funds
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Use Existing Wallets Tab */}
              <TabsContent value="existing" className="space-y-4">
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertDescription className="text-blue-800">
                    Enter your existing wallet addresses. Payments will be sent directly to these addresses.
                  </AlertDescription>
                </Alert>

                {/* Wallet Inputs */}
                <div className="space-y-4">
                  {Object.entries(formData.wallets).map(([crypto, address]) => {
                    const cryptoInfo = SUPPORTED_CRYPTOS.find(c => c.code === crypto)
                    return (
                      <div key={crypto} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700">
                            {cryptoInfo?.name} ({crypto}) Address
                          </label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveWallet(crypto)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <Input
                          type="text"
                          placeholder={`Enter your ${crypto} wallet address`}
                          value={address}
                          onChange={(e) => handleWalletChange(crypto, e.target.value)}
                          className={errors[crypto] ? 'border-red-300 focus:border-red-500 font-mono text-sm' : 'font-mono text-sm'}
                        />
                        {errors[crypto] && (
                          <p className="text-sm text-red-600">{errors[crypto]}</p>
                        )}
                      </div>
                    )
                  })}

                  {/* Add Wallet Button */}
                  {Object.keys(formData.wallets).length < SUPPORTED_CRYPTOS.length && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddWallet}
                      className="w-full border-dashed"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Another Wallet
                    </Button>
                  )}

                  {errors.general && (
                    <p className="text-sm text-red-600">{errors.general}</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>

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
                disabled={isSubmitting || Object.keys(formData.wallets).length === 0}
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

