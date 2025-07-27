"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { ArrowRight, ArrowLeft, Wallet, Plus, Trash2, Copy, Eye, EyeOff, Shield, AlertTriangle, Loader2, CheckCircle, XCircle, RefreshCw, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { Badge } from '@/app/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import toast from 'react-hot-toast'
import { getTrustWalletCurrencies, generateWallets, validateAddress, getDisplayName } from '@/lib/wallet-generation-real'

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
  display_name?: string
}

interface GeneratedWallet {
  address: string
  currency: string
  network: string
  derivation_path?: string
  public_key?: string
  display_name?: string
  address_type: string
}

export default function WalletSetupStep({ data, onComplete, onPrevious }: WalletSetupStepProps) {
  const [formData, setFormData] = useState<WalletConfigData>(data)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMnemonic, setShowMnemonic] = useState(false)
  const [mnemonicCopied, setMnemonicCopied] = useState(false)
  
  // Trust Wallet currencies (fixed list)
  const trustWalletCurrencies = getTrustWalletCurrencies()
  
  // Dynamic currency support for "Use Existing" option
  const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyInfo[]>([])
  const [loadingCurrencies, setLoadingCurrencies] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [validationStates, setValidationStates] = useState<Record<string, 'validating' | 'valid' | 'invalid' | null>>({})

  // Load available currencies for "Use Existing" option
  useEffect(() => {
    if (formData.walletType === 'existing') {
      loadAvailableCurrencies()
    }
  }, [formData.walletType])

  const loadAvailableCurrencies = async () => {
    try {
      setLoadingCurrencies(true)
      
      const response = await fetch('/api/currencies')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAvailableCurrencies(data.currencies)
        }
      }
      
    } catch (error) {
      console.error('Failed to load currencies:', error)
      toast.error('Failed to load available currencies')
      
      // Fallback to Trust Wallet currencies
      setAvailableCurrencies(trustWalletCurrencies.map(currency => ({
        code: currency.code,
        name: currency.name,
        symbol: currency.symbol,
        network: currency.network,
        enabled: true,
        min_amount: currency.min_amount,
        decimals: currency.decimals,
        trust_wallet_compatible: currency.trust_wallet_compatible,
        display_name: currency.display_name
      })))
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
      
      // Generate all Trust Wallet compatible currencies
      const currenciesToGenerate = trustWalletCurrencies.map(c => c.code)
      
      const result = await generateWallets({
        currencies: currenciesToGenerate,
        generation_method: 'trust_wallet'
      })
      
      // Convert generated wallets to our format
      const generatedWallets: Record<string, string> = {}
      result.wallets.forEach((wallet: GeneratedWallet) => {
        generatedWallets[wallet.currency] = wallet.address
      })
      
      setFormData(prev => ({
        ...prev,
        walletType: 'generate',
        wallets: generatedWallets,
        mnemonic: result.mnemonic
      }))
      
      toast.success(`Generated ${result.wallets.length} wallet addresses!`)
      
    } catch (error) {
      console.error('Wallet generation failed:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate wallets')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAddWallet = () => {
    const availableCryptos = availableCurrencies.filter(
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

    // For generated wallets, we don't need to validate each address
    if (formData.walletType === 'generate') {
      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    }

    // Validate all wallet addresses for existing wallets
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
    
    console.log('Form submitted, validating...')
    
    const isValid = await validateForm()
    if (!isValid) {
      console.log('Form validation failed:', errors)
      return
    }

    console.log('Form validation passed, proceeding...')
    setIsSubmitting(true)
    
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 500))
      
      console.log('Calling onComplete with data:', formData)
      onComplete(formData)
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      toast.error('Failed to save wallet configuration')
    } finally {
      setIsSubmitting(false)
    }
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
    // First check Trust Wallet currencies
    const trustWalletCurrency = trustWalletCurrencies.find(c => c.code === code)
    if (trustWalletCurrency) {
      return {
        code: trustWalletCurrency.code,
        name: trustWalletCurrency.name,
        symbol: trustWalletCurrency.symbol,
        network: trustWalletCurrency.network,
        enabled: true,
        min_amount: trustWalletCurrency.min_amount,
        decimals: trustWalletCurrency.decimals,
        trust_wallet_compatible: true,
        display_name: trustWalletCurrency.display_name
      }
    }
    
    // Then check available currencies for existing wallets
    return availableCurrencies.find(c => c.code === code) || {
      code,
      name: code,
      symbol: code,
      enabled: true,
      min_amount: 0.00000001,
      decimals: 8,
      trust_wallet_compatible: false
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

  const getNetworkBadgeColor = (network: string) => {
    const colorMap: Record<string, string> = {
      'Bitcoin': 'bg-orange-100 text-orange-800',
      'Ethereum': 'bg-blue-100 text-blue-800',
      'Polygon': 'bg-purple-100 text-purple-800',
      'BSC': 'bg-yellow-100 text-yellow-800',
      'Tron': 'bg-red-100 text-red-800',
      'Litecoin': 'bg-gray-100 text-gray-800',
      'Solana': 'bg-green-100 text-green-800',
      'XRP Ledger': 'bg-indigo-100 text-indigo-800',
      'Dogecoin': 'bg-amber-100 text-amber-800'
    }
    return colorMap[network] || 'bg-gray-100 text-gray-800'
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
                <TabsTrigger value="generate">Generate New (Recommended)</TabsTrigger>
                <TabsTrigger value="existing">Use Existing</TabsTrigger>
              </TabsList>

              {/* Generate New Wallets Tab */}
              <TabsContent value="generate" className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <Shield className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Trust Wallet Compatible:</strong> We&apos;ll generate wallet addresses for all major cryptocurrencies. 
                    You&apos;ll get a recovery phrase to import into Trust Wallet or any compatible wallet app.
                  </AlertDescription>
                </Alert>

                {!Object.keys(formData.wallets).length ? (
                  <div className="text-center py-8">
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Trust Wallet Compatible Currencies</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          We&apos;ll generate addresses for these {trustWalletCurrencies.length} cryptocurrencies that work perfectly with Trust Wallet:
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto border rounded-lg p-4 bg-gray-50">
                          {trustWalletCurrencies.map((currency) => (
                            <div key={currency.code} className="flex items-center space-x-2 p-2 bg-white rounded border">
                              <div className="flex-1">
                                <div className="font-medium text-sm">{currency.symbol} {currency.code}</div>
                                <div className="text-xs text-gray-500">{currency.display_name || currency.name}</div>
                                <Badge variant="outline" className={`text-xs mt-1 ${getNetworkBadgeColor(currency.network)}`}>
                                  {currency.network}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <Button
                        type="button"
                        onClick={handleGenerateWallets}
                        disabled={isGenerating}
                        className="bg-[#7f5efd] hover:bg-[#6d4fd2] text-white px-8 py-3 text-lg"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            Generating Wallets...
                          </>
                        ) : (
                          <>
                            <Wallet className="w-5 h-5 mr-2" />
                            Generate All {trustWalletCurrencies.length} Wallets
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">Generated Wallet Addresses</h3>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {Object.keys(formData.wallets).length} addresses generated
                      </Badge>
                    </div>

                    {/* Mnemonic Display */}
                    {formData.mnemonic && (
                      <Alert className="border-amber-200 bg-amber-50">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800">
                          <div className="space-y-3">
                            <div>
                              <strong>IMPORTANT: Save your recovery phrase!</strong>
                              <p className="text-sm mt-1">
                                This 12-word phrase is the only way to recover your wallets. Import it into Trust Wallet to access your funds.
                              </p>
                            </div>
                            
                            <div className="bg-white p-3 rounded border border-amber-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-amber-800">Recovery Phrase:</span>
                                <div className="flex space-x-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowMnemonic(!showMnemonic)}
                                    className="text-amber-700 border-amber-300"
                                  >
                                    {showMnemonic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={copyMnemonic}
                                    className="text-amber-700 border-amber-300"
                                  >
                                    <Copy className="w-4 h-4" />
                                    {mnemonicCopied ? 'Copied!' : 'Copy'}
                                  </Button>
                                </div>
                              </div>
                              <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                                {showMnemonic ? formData.mnemonic : '••• ••• ••• ••• ••• ••• ••• ••• ••• ••• ••• •••'}
                              </div>
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Trust Wallet Compatibility Notice */}
                    <Alert className="border-blue-200 bg-blue-50">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        <strong>Address Compatibility:</strong> EVM-compatible addresses (ETH, BNB, MATIC, tokens) will match Trust Wallet exactly. 
                        For Bitcoin, Litecoin, Dogecoin, and XRP, you&apos;ll need to manually find the correct addresses in Trust Wallet after importing your seed phrase.
                      </AlertDescription>
                    </Alert>

                    {/* Generated Addresses */}
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {Object.entries(formData.wallets).map(([crypto, address]) => {
                        const currencyInfo = getCurrencyInfo(crypto)
                        const isPlaceholder = address.includes('PLACEHOLDER')
                        return (
                          <div key={crypto} className={`p-3 border rounded-lg ${isPlaceholder ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{currencyInfo.symbol} {crypto}</span>
                                <Badge variant="outline" className={`text-xs ${getNetworkBadgeColor(currencyInfo.network || '')}`}>
                                  {currencyInfo.network}
                                </Badge>
                                {isPlaceholder && (
                                  <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                                    Manual Setup Required
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="font-mono text-sm bg-white p-2 rounded border break-all">
                              {isPlaceholder ? `Import seed phrase into Trust Wallet to get ${crypto} address` : address}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGenerateWallets}
                      disabled={isGenerating}
                      className="w-full"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate All Addresses
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Use Existing Wallets Tab */}
              <TabsContent value="existing" className="space-y-4">
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Use Your Existing Wallets:</strong> Add wallet addresses for cryptocurrencies you want to accept. 
                    You can add more currencies later in your dashboard settings.
                  </AlertDescription>
                </Alert>

                {loadingCurrencies && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">Loading available currencies...</span>
                  </div>
                )}

                <div className="space-y-4">
                  {Object.entries(formData.wallets).map(([crypto, address]) => {
                    const currencyInfo = getCurrencyInfo(crypto)
                    return (
                      <div key={crypto} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Select
                              value={crypto}
                              onValueChange={(newCrypto) => handleCurrencyChange(crypto, newCrypto)}
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {availableCurrencies
                                  .filter(currency => !formData.wallets[currency.code] || currency.code === crypto)
                                  .map((currency) => (
                                  <SelectItem key={currency.code} value={currency.code}>
                                    <div className="flex items-center space-x-2">
                                      <span>{currency.symbol} {currency.code}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {currency.network || 'Unknown'}
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            {currencyInfo.trust_wallet_compatible && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                Trust Wallet
                              </Badge>
                            )}
                          </div>
                          
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveWallet(crypto)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Input
                              placeholder={`Enter your ${crypto} wallet address`}
                              value={address}
                              onChange={(e) => handleWalletChange(crypto, e.target.value)}
                              className={errors[crypto] ? 'border-red-300' : ''}
                            />
                            {getValidationIcon(crypto)}
                          </div>
                          
                          {currencyInfo.display_name && (
                            <p className="text-xs text-gray-500">
                              Network: {currencyInfo.display_name}
                            </p>
                          )}
                          
                          {errors[crypto] && (
                            <p className="text-sm text-red-600">{errors[crypto]}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {!loadingCurrencies && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddWallet}
                      disabled={availableCurrencies.filter(c => !formData.wallets[c.code]).length === 0}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Another Cryptocurrency
                    </Button>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {errors.general && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {errors.general}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onPrevious}
                disabled={isSubmitting}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting || Object.keys(formData.wallets).length === 0}
                className="bg-[#7f5efd] hover:bg-[#6d4fd2] text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Setting up...
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

