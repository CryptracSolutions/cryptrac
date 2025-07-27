"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { ArrowRight, ArrowLeft, Wallet, Plus, Trash2, Copy, Eye, EyeOff, Shield, AlertTriangle, Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { Badge } from '@/app/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import toast from 'react-hot-toast'

interface WalletConfigData {
  walletType: 'generate' | 'existing'
  wallets: Record<string, string>
  mnemonic?: string
  selectedCurrencies?: string[]
}

interface WalletSetupStepProps {
  data: WalletConfigData
  onComplete: (data: WalletConfigData) => void
  onPrevious: () => void
}

interface CurrencyInfo {
  code: string
  name: string
  symbol: string
  network?: string
  is_token?: boolean
  parent_currency?: string
  trust_wallet_compatible?: boolean
  address_format?: string
  enabled: boolean
  min_amount: number
  max_amount?: number
  decimals: number
  icon_url?: string
}

interface GeneratedWallet {
  address: string
  currency: string
  network: string
  derivation_path?: string
  public_key?: string
}

export default function WalletSetupStep({ data, onComplete, onPrevious }: WalletSetupStepProps) {
  const [formData, setFormData] = useState<WalletConfigData>(data)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMnemonic, setShowMnemonic] = useState(false)
  const [mnemonicCopied, setMnemonicCopied] = useState(false)
  
  // Dynamic currency support
  const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyInfo[]>([])
  const [popularCurrencies, setPopularCurrencies] = useState<string[]>([])
  const [loadingCurrencies, setLoadingCurrencies] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [validationStates, setValidationStates] = useState<Record<string, 'validating' | 'valid' | 'invalid' | null>>({})

  // Load available currencies on component mount
  useEffect(() => {
    loadAvailableCurrencies()
  }, [])

  const loadAvailableCurrencies = async () => {
    try {
      setLoadingCurrencies(true)
      
      // Load popular currencies first for better UX
      const popularResponse = await fetch('/api/currencies?popular=true')
      if (popularResponse.ok) {
        const popularData = await popularResponse.json()
        if (popularData.success) {
          setAvailableCurrencies(popularData.currencies)
          setPopularCurrencies(popularData.currencies.map((c: CurrencyInfo) => c.code))
        }
      }
      
      // Then load all currencies
      const allResponse = await fetch('/api/currencies')
      if (allResponse.ok) {
        const allData = await allResponse.json()
        if (allData.success) {
          setAvailableCurrencies(allData.currencies)
        }
      }
      
    } catch (error) {
      console.error('Failed to load currencies:', error)
      toast.error('Failed to load available currencies')
      
      // Fallback to basic currencies
      setAvailableCurrencies([
        { code: 'BTC', name: 'Bitcoin', symbol: '₿', enabled: true, min_amount: 0.00000001, decimals: 8, trust_wallet_compatible: true },
        { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', enabled: true, min_amount: 0.000000001, decimals: 18, trust_wallet_compatible: true },
        { code: 'USDT', name: 'Tether', symbol: '₮', enabled: true, min_amount: 0.000001, decimals: 6, trust_wallet_compatible: true },
        { code: 'USDC', name: 'USD Coin', symbol: '$', enabled: true, min_amount: 0.000001, decimals: 6, trust_wallet_compatible: true },
        { code: 'LTC', name: 'Litecoin', symbol: 'Ł', enabled: true, min_amount: 0.00000001, decimals: 8, trust_wallet_compatible: true }
      ])
      setPopularCurrencies(['BTC', 'ETH', 'USDT', 'USDC', 'LTC'])
    } finally {
      setLoadingCurrencies(false)
    }
  }

  const validateWalletAddress = async (crypto: string, address: string): Promise<boolean> => {
    if (!address.trim()) return false
    
    try {
      setValidationStates(prev => ({ ...prev, [crypto]: 'validating' }))
      
      const response = await fetch('/api/wallets/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.trim(), currency: crypto })
      })
      
      if (response.ok) {
        const data = await response.json()
        const isValid = data.validation?.valid || false
        setValidationStates(prev => ({ ...prev, [crypto]: isValid ? 'valid' : 'invalid' }))
        return isValid
      }
      
      setValidationStates(prev => ({ ...prev, [crypto]: 'invalid' }))
      return false
    } catch (error) {
      console.error('Address validation failed:', error)
      setValidationStates(prev => ({ ...prev, [crypto]: 'invalid' }))
      return false
    }
  }

  const handleGenerateWallets = async () => {
    try {
      setIsGenerating(true)
      
      // Use selected currencies or default to popular ones
      const currenciesToGenerate = formData.selectedCurrencies && formData.selectedCurrencies.length > 0 
        ? formData.selectedCurrencies 
        : popularCurrencies.slice(0, 8) // Top 8 popular currencies
      
      const response = await fetch('/api/wallets/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currencies: currenciesToGenerate,
          generation_method: 'trust_wallet'
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate wallets')
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.message || 'Wallet generation failed')
      }
      
      // Convert generated wallets to our format
      const generatedWallets: Record<string, string> = {}
      result.data.wallets.forEach((wallet: GeneratedWallet) => {
        generatedWallets[wallet.currency] = wallet.address
      })
      
      setFormData(prev => ({
        ...prev,
        walletType: 'generate',
        wallets: generatedWallets,
        mnemonic: result.mnemonic
      }))
      
      toast.success(`Generated ${result.data.wallets.length} wallet addresses!`)
      
    } catch (error) {
      console.error('Wallet generation failed:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate wallets')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAddWallet = () => {
    const availableCryptos = availableCurrencies.filter(
      crypto => !formData.wallets[crypto.code] && crypto.trust_wallet_compatible
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
    
    // Clear any errors and validation states for this wallet
    const newErrors = { ...errors }
    delete newErrors[crypto]
    setErrors(newErrors)
    
    const newValidationStates = { ...validationStates }
    delete newValidationStates[crypto]
    setValidationStates(newValidationStates)
  }

  const handleWalletChange = (crypto: string, address: string) => {
    setFormData(prev => ({
      ...prev,
      wallets: { ...prev.wallets, [crypto]: address }
    }))
    
    // Clear error when user starts typing
    if (errors[crypto]) {
      const newErrors = { ...errors }
      delete newErrors[crypto]
      setErrors(newErrors)
    }
    
    // Reset validation state
    setValidationStates(prev => ({ ...prev, [crypto]: null }))
    
    // Validate address after a short delay
    if (address.trim()) {
      setTimeout(() => validateWalletAddress(crypto, address), 500)
    }
  }

  const handleCurrencyChange = (oldCrypto: string, newCrypto: string) => {
    const newWallets = { ...formData.wallets }
    const address = newWallets[oldCrypto]
    delete newWallets[oldCrypto]
    newWallets[newCrypto] = address
    
    setFormData(prev => ({ ...prev, wallets: newWallets }))
    
    // Update errors and validation states
    const newErrors = { ...errors }
    if (newErrors[oldCrypto]) {
      delete newErrors[oldCrypto]
      setErrors(newErrors)
    }
    
    const newValidationStates = { ...validationStates }
    delete newValidationStates[oldCrypto]
    setValidationStates(newValidationStates)
    
    // Validate new currency if address exists
    if (address.trim()) {
      validateWalletAddress(newCrypto, address)
    }
  }

  const validateForm = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {}

    if (Object.keys(formData.wallets).length === 0) {
      newErrors.general = 'Please add at least one wallet address'
    }

    // Validate all wallet addresses
    const validationPromises = Object.entries(formData.wallets).map(async ([crypto, address]) => {
      if (!address.trim()) {
        newErrors[crypto] = 'Address is required'
        return false
      }
      
      const isValid = await validateWalletAddress(crypto, address)
      if (!isValid) {
        newErrors[crypto] = `Invalid ${crypto} address format`
        return false
      }
      
      return true
    })

    await Promise.all(validationPromises)
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!(await validateForm())) {
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
      toast.success('Mnemonic copied to clipboard!')
      setTimeout(() => setMnemonicCopied(false), 2000)
    }
  }

  const getCurrencyInfo = (code: string) => {
    return availableCurrencies.find(c => c.code === code) || {
      code,
      name: code,
      symbol: code,
      enabled: true,
      min_amount: 0.00000001,
      decimals: 8,
      trust_wallet_compatible: true
    }
  }

  const getValidationIcon = (crypto: string) => {
    const state = validationStates[crypto]
    switch (state) {
      case 'validating':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      case 'valid':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'invalid':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return null
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
          {loadingCurrencies && (
            <div className="flex items-center justify-center mt-4">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm text-gray-500">Loading available currencies...</span>
            </div>
          )}
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
                    <strong>Secure & Trust Wallet Compatible:</strong> We&apos;ll generate new wallet addresses for you. 
                    You&apos;ll get a recovery phrase to import into Trust Wallet or any compatible wallet app.
                  </AlertDescription>
                </Alert>

                {!Object.keys(formData.wallets).length ? (
                  <div className="text-center py-8">
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">Select Cryptocurrencies</h3>
                      <p className="text-sm text-gray-600">
                        Choose which cryptocurrencies you want to accept. We recommend starting with popular ones.
                      </p>
                      
                      {!loadingCurrencies && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-lg p-4">
                          {availableCurrencies
                            .filter(currency => currency.trust_wallet_compatible)
                            .slice(0, 20) // Show top 20 currencies
                            .map((currency) => (
                            <div key={currency.code} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={currency.code}
                                checked={formData.selectedCurrencies?.includes(currency.code) || popularCurrencies.includes(currency.code)}
                                onChange={(e) => {
                                  const checked = e.target.checked
                                  if (checked) {
                                    setFormData(prev => ({
                                      ...prev,
                                      selectedCurrencies: [...(prev.selectedCurrencies || []), currency.code]
                                    }))
                                  } else {
                                    setFormData(prev => ({
                                      ...prev,
                                      selectedCurrencies: (prev.selectedCurrencies || []).filter(c => c !== currency.code)
                                    }))
                                  }
                                }}
                                className="h-4 w-4 text-[#7f5efd] border-gray-300 rounded focus:ring-[#7f5efd]"
                              />
                              <label htmlFor={currency.code} className="text-sm font-medium cursor-pointer">
                                {currency.symbol} {currency.code}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <Button
                      type="button"
                      onClick={handleGenerateWallets}
                      disabled={isGenerating || loadingCurrencies}
                      className="bg-[#7f5efd] hover:bg-[#7f5efd]/90 text-white mt-6"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating Wallets...
                        </>
                      ) : (
                        'Generate Wallet Addresses'
                      )}
                    </Button>
                    <p className="text-sm text-gray-500 mt-2">
                      This will create secure addresses compatible with Trust Wallet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Generated Wallets */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">Your Generated Wallets:</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateWallets}
                          disabled={isGenerating}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Regenerate
                        </Button>
                      </div>
                      {Object.entries(formData.wallets).map(([crypto, address]) => {
                        const currencyInfo = getCurrencyInfo(crypto)
                        return (
                          <div key={crypto} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3 flex-1">
                              <Badge variant="secondary">{currencyInfo.symbol} {crypto}</Badge>
                              <span className="text-sm font-mono text-gray-600 truncate max-w-xs">
                                {address}
                              </span>
                              {currencyInfo.network && (
                                <Badge variant="outline" className="text-xs">
                                  {currencyInfo.network}
                                </Badge>
                              )}
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
                            You&apos;ll need it to import these wallets into Trust Wallet, MetaMask, or any compatible wallet.
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
                            💡 Import this phrase into Trust Wallet to access your funds
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
                    We support {availableCurrencies.length}+ cryptocurrencies.
                  </AlertDescription>
                </Alert>

                {/* Wallet Inputs */}
                <div className="space-y-4">
                  {Object.entries(formData.wallets).map(([crypto, address]) => {
                    const currencyInfo = getCurrencyInfo(crypto)
                    const availableForChange = availableCurrencies.filter(
                      c => c.code !== crypto && !formData.wallets[c.code] && c.trust_wallet_compatible
                    )
                    
                    return (
                      <div key={crypto} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Select
                              value={crypto}
                              onValueChange={(newCrypto) => handleCurrencyChange(crypto, newCrypto)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={crypto}>
                                  {currencyInfo.symbol} {crypto}
                                </SelectItem>
                                {availableForChange.map((currency) => (
                                  <SelectItem key={currency.code} value={currency.code}>
                                    {currency.symbol} {currency.code}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className="text-sm text-gray-600">
                              {currencyInfo.name}
                            </span>
                            {currencyInfo.network && (
                              <Badge variant="outline" className="text-xs">
                                {currencyInfo.network}
                              </Badge>
                            )}
                          </div>
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
                        <div className="relative">
                          <Input
                            type="text"
                            placeholder={`Enter your ${crypto} wallet address`}
                            value={address}
                            onChange={(e) => handleWalletChange(crypto, e.target.value)}
                            className={`font-mono text-sm pr-10 ${
                              errors[crypto] ? 'border-red-300 focus:border-red-500' : 
                              validationStates[crypto] === 'valid' ? 'border-green-300 focus:border-green-500' :
                              validationStates[crypto] === 'invalid' ? 'border-red-300 focus:border-red-500' : ''
                            }`}
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            {getValidationIcon(crypto)}
                          </div>
                        </div>
                        {errors[crypto] && (
                          <p className="text-sm text-red-600">{errors[crypto]}</p>
                        )}
                        {validationStates[crypto] === 'valid' && (
                          <p className="text-sm text-green-600">✓ Valid {crypto} address</p>
                        )}
                      </div>
                    )
                  })}

                  {/* Add Wallet Button */}
                  {Object.keys(formData.wallets).length < availableCurrencies.filter(c => c.trust_wallet_compatible).length && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddWallet}
                      className="w-full border-dashed"
                      disabled={loadingCurrencies}
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
                disabled={isSubmitting || Object.keys(formData.wallets).length === 0 || isGenerating}
                className="bg-[#7f5efd] hover:bg-[#7f5efd]/90 text-white flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

