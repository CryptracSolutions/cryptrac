'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Textarea } from '@/app/components/ui/textarea'
import { Badge } from '@/app/components/ui/badge'
import { QRCode } from '@/app/components/ui/qr-code'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { DashboardLayout } from '@/app/components/layout/dashboard-layout'
import { supabase } from '@/lib/supabase-browser'
import toast from 'react-hot-toast'
import { 
  ArrowLeft, 
  DollarSign, 
  ExternalLink, 
  Copy, 
  Link2, 
  CheckCircle,
  Loader2,
  X
} from 'lucide-react'

interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  network?: string;
  is_token?: boolean;
  parent_currency?: string;
  trust_wallet_compatible?: boolean;
  address_format?: string;
  enabled: boolean;
  min_amount: number;
  max_amount?: number;
  decimals: number;
  icon_url?: string;
  rate_usd?: number;
}

interface FormData {
  title: string
  description: string
  amount: string
  currency: string
  acceptedCryptos: string[]
  expiresAt: string
  maxUses: string
  redirectUrl: string
}

interface FormErrors {
  [key: string]: string
}

interface CreatedPaymentLink {
  id: string
  link_id: string
  title: string
  description: string
  amount: number
  currency: string
  payment_url: string
  qr_code_data: string
  accepted_cryptos: string[]
  expires_at: string | null
  max_uses: number | null
  redirect_url: string | null
}

export default function CreatePaymentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [createdLink, setCreatedLink] = useState<CreatedPaymentLink | null>(null)
  const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyInfo[]>([])
  const [loadingCurrencies, setLoadingCurrencies] = useState(true)
  const [popularCurrencies, setPopularCurrencies] = useState<string[]>([])
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    amount: '',
    currency: 'USD',
    acceptedCryptos: [],
    expiresAt: '',
    maxUses: '',
    redirectUrl: ''
  })
  
  const [errors, setErrors] = useState<FormErrors>({})

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
          
          // Pre-select popular cryptocurrencies
          setFormData(prev => ({
            ...prev,
            acceptedCryptos: popularData.currencies.slice(0, 5).map((c: CurrencyInfo) => c.code)
          }))
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
      const fallbackCurrencies = [
        { code: 'BTC', name: 'Bitcoin', symbol: '₿', enabled: true, min_amount: 0.00000001, decimals: 8, trust_wallet_compatible: true, rate_usd: 45000 },
        { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', enabled: true, min_amount: 0.000000001, decimals: 18, trust_wallet_compatible: true, rate_usd: 2800 },
        { code: 'USDT', name: 'Tether', symbol: '₮', enabled: true, min_amount: 0.000001, decimals: 6, trust_wallet_compatible: true, rate_usd: 1 },
        { code: 'USDC', name: 'USD Coin', symbol: '$', enabled: true, min_amount: 0.000001, decimals: 6, trust_wallet_compatible: true, rate_usd: 1 },
        { code: 'LTC', name: 'Litecoin', symbol: 'Ł', enabled: true, min_amount: 0.00000001, decimals: 8, trust_wallet_compatible: true, rate_usd: 85 }
      ]
      setAvailableCurrencies(fallbackCurrencies)
      setPopularCurrencies(['BTC', 'ETH', 'USDT', 'USDC', 'LTC'])
      setFormData(prev => ({
        ...prev,
        acceptedCryptos: ['BTC', 'ETH', 'USDT', 'USDC', 'LTC']
      }))
    } finally {
      setLoadingCurrencies(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required'
    } else {
      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Amount must be a positive number'
      }
    }

    if (formData.acceptedCryptos.length === 0) {
      newErrors.acceptedCryptos = 'Please select at least one cryptocurrency'
    }

    if (formData.expiresAt && new Date(formData.expiresAt) <= new Date()) {
      newErrors.expiresAt = 'Expiration date must be in the future'
    }

    if (formData.maxUses && (parseInt(formData.maxUses) <= 0 || !Number.isInteger(parseFloat(formData.maxUses)))) {
      newErrors.maxUses = 'Max uses must be a positive integer'
    }

    if (formData.redirectUrl && !isValidUrl(formData.redirectUrl)) {
      newErrors.redirectUrl = 'Please enter a valid URL'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        toast.error('Please log in to create payment links')
        router.push('/auth/login')
        return
      }

      // Get merchant info
      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (merchantError || !merchant) {
        toast.error('Merchant account not found')
        return
      }

      // Create payment link
      const paymentData = {
        merchant_id: merchant.id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        accepted_cryptos: formData.acceptedCryptos,
        expires_at: formData.expiresAt || null,
        max_uses: formData.maxUses ? parseInt(formData.maxUses) : null,
        redirect_url: formData.redirectUrl.trim() || null,
        is_active: true
      }

      const { data: createdPayment, error: createError } = await supabase
        .from('payment_links')
        .insert(paymentData)
        .select(`
          id,
          link_id,
          title,
          description,
          amount,
          currency,
          accepted_cryptos,
          expires_at,
          max_uses,
          redirect_url
        `)
        .single()

      if (createError) {
        console.error('Error creating payment link:', createError)
        toast.error('Failed to create payment link')
        return
      }

      // Generate payment URL and QR code data
      const baseUrl = window.location.origin
      const paymentUrl = `${baseUrl}/pay/${createdPayment.link_id}`
      
      const paymentLinkData: CreatedPaymentLink = {
        ...createdPayment,
        payment_url: paymentUrl,
        qr_code_data: paymentUrl
      }

      setCreatedLink(paymentLinkData)
      toast.success('Payment link created successfully!')

    } catch (error) {
      console.error('Error creating payment link:', error)
      toast.error('Failed to create payment link')
    } finally {
      setLoading(false)
    }
  }

  const handleCryptoToggle = (crypto: string) => {
    setFormData(prev => ({
      ...prev,
      acceptedCryptos: prev.acceptedCryptos.includes(crypto)
        ? prev.acceptedCryptos.filter(c => c !== crypto)
        : [...prev.acceptedCryptos, crypto]
    }))
    
    // Clear error when user makes selection
    if (errors.acceptedCryptos) {
      setErrors(prev => ({ ...prev, acceptedCryptos: '' }))
    }
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard!`)
    } catch {
      toast.error('Failed to copy to clipboard')
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

  const getEstimatedCryptoAmount = (currency: CurrencyInfo) => {
    if (!formData.amount || !currency.rate_usd) return null
    
    const usdAmount = parseFloat(formData.amount)
    if (isNaN(usdAmount)) return null
    
    const cryptoAmount = usdAmount / currency.rate_usd
    return cryptoAmount.toFixed(currency.decimals)
  }

  if (createdLink) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto p-6">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">Payment Link Created!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">{createdLink.title}</h3>
                <p className="text-2xl font-bold text-[#7f5efd]">
                  ${createdLink.amount} {createdLink.currency}
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {createdLink.accepted_cryptos.map(crypto => {
                    const currencyInfo = getCurrencyInfo(crypto)
                    const estimatedAmount = getEstimatedCryptoAmount(currencyInfo)
                    return (
                      <Badge key={crypto} variant="secondary" className="text-xs">
                        {currencyInfo.symbol} {crypto}
                        {estimatedAmount && (
                          <span className="ml-1 text-gray-500">
                            (~{estimatedAmount})
                          </span>
                        )}
                      </Badge>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-center">
                <QRCode value={createdLink.qr_code_data} size={200} />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Payment URL
                  </label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={createdLink.payment_url}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(createdLink.payment_url, 'Payment URL')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={() => window.open(createdLink.payment_url, '_blank')}
                    className="flex-1"
                    variant="outline"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    onClick={() => router.push('/merchant/dashboard/payments')}
                    className="flex-1 bg-[#7f5efd] hover:bg-[#7f5efd]/90"
                  >
                    View All Payments
                  </Button>
                </div>

                <Button
                  onClick={() => {
                    setCreatedLink(null)
                    setFormData({
                      title: '',
                      description: '',
                      amount: '',
                      currency: 'USD',
                      acceptedCryptos: popularCurrencies.slice(0, 5),
                      expiresAt: '',
                      maxUses: '',
                      redirectUrl: ''
                    })
                  }}
                  variant="ghost"
                  className="w-full"
                >
                  Create Another Payment Link
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Payment Link</h1>
            <p className="text-gray-600">Generate a payment link to accept cryptocurrency</p>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-[#7f5efd]" />
              <span>Payment Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Payment Title *
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Product Purchase, Service Payment"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className={errors.title ? 'border-red-300' : ''}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600 mt-1">{errors.title}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Description (Optional)
                  </label>
                  <Textarea
                    placeholder="Additional details about this payment"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Amount *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      className={errors.amount ? 'border-red-300' : ''}
                    />
                    {errors.amount && (
                      <p className="text-sm text-red-600 mt-1">{errors.amount}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Currency
                    </label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="JPY">JPY (¥)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Accepted Cryptocurrencies */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">
                  Accepted Cryptocurrencies *
                </label>
                {loadingCurrencies ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span>Loading available currencies...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Popular Currencies */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-2">Popular Currencies</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {availableCurrencies
                          .filter(currency => popularCurrencies.includes(currency.code))
                          .map(currency => {
                            const isSelected = formData.acceptedCryptos.includes(currency.code)
                            const estimatedAmount = getEstimatedCryptoAmount(currency)
                            
                            return (
                              <div
                                key={currency.code}
                                onClick={() => handleCryptoToggle(currency.code)}
                                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'border-[#7f5efd] bg-[#7f5efd]/5'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium">{currency.symbol}</span>
                                    <span className="text-sm text-gray-600">{currency.code}</span>
                                  </div>
                                  {isSelected && (
                                    <CheckCircle className="w-4 h-4 text-[#7f5efd]" />
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {currency.name}
                                  {currency.network && (
                                    <Badge variant="outline" className="ml-1 text-xs">
                                      {currency.network}
                                    </Badge>
                                  )}
                                </div>
                                {estimatedAmount && (
                                  <div className="text-xs text-gray-400 mt-1">
                                    ~{estimatedAmount} {currency.code}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                      </div>
                    </div>

                    {/* All Other Currencies */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-2">All Currencies</h4>
                      <div className="max-h-48 overflow-y-auto border rounded-lg p-2">
                        <div className="grid grid-cols-3 gap-1">
                          {availableCurrencies
                            .filter(currency => !popularCurrencies.includes(currency.code))
                            .map(currency => {
                              const isSelected = formData.acceptedCryptos.includes(currency.code)
                              
                              return (
                                <div
                                  key={currency.code}
                                  onClick={() => handleCryptoToggle(currency.code)}
                                  className={`p-2 text-xs border rounded cursor-pointer transition-colors ${
                                    isSelected
                                      ? 'border-[#7f5efd] bg-[#7f5efd]/5 text-[#7f5efd]'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span>{currency.symbol} {currency.code}</span>
                                    {isSelected && <CheckCircle className="w-3 h-3" />}
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      </div>
                    </div>

                    {/* Selected Summary */}
                    {formData.acceptedCryptos.length > 0 && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          Selected Cryptocurrencies ({formData.acceptedCryptos.length})
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {formData.acceptedCryptos.map(crypto => {
                            const currencyInfo = getCurrencyInfo(crypto)
                            return (
                              <Badge
                                key={crypto}
                                variant="secondary"
                                className="text-xs cursor-pointer hover:bg-red-100"
                                onClick={() => handleCryptoToggle(crypto)}
                              >
                                {currencyInfo.symbol} {crypto}
                                <X className="w-3 h-3 ml-1" />
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {errors.acceptedCryptos && (
                  <p className="text-sm text-red-600 mt-1">{errors.acceptedCryptos}</p>
                )}
              </div>

              {/* Advanced Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Advanced Options</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Expiration Date (Optional)
                    </label>
                    <Input
                      type="datetime-local"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                      className={errors.expiresAt ? 'border-red-300' : ''}
                    />
                    {errors.expiresAt && (
                      <p className="text-sm text-red-600 mt-1">{errors.expiresAt}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Max Uses (Optional)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Unlimited"
                      value={formData.maxUses}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxUses: e.target.value }))}
                      className={errors.maxUses ? 'border-red-300' : ''}
                    />
                    {errors.maxUses && (
                      <p className="text-sm text-red-600 mt-1">{errors.maxUses}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Redirect URL (Optional)
                  </label>
                  <Input
                    type="url"
                    placeholder="https://yourwebsite.com/success"
                    value={formData.redirectUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, redirectUrl: e.target.value }))}
                    className={errors.redirectUrl ? 'border-red-300' : ''}
                  />
                  {errors.redirectUrl && (
                    <p className="text-sm text-red-600 mt-1">{errors.redirectUrl}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Users will be redirected here after successful payment
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || loadingCurrencies}
                  className="bg-[#7f5efd] hover:bg-[#7f5efd]/90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4 mr-2" />
                      Create Payment Link
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

