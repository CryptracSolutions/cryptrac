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
import { Checkbox } from '@/app/components/ui/checkbox'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
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
  X,
  AlertTriangle,
  Info,
  Wallet,
  Settings
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
  has_wallet?: boolean;
  wallet_address?: string;
  display_name?: string;
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
  chargeCustomerFee: boolean | null // null = inherit from merchant global setting
  autoConvertEnabled: boolean | null // null = inherit from merchant global setting
  preferredPayoutCurrency: string | null // null = inherit from merchant global setting
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
  charge_customer_fee: boolean | null
}

interface MerchantSettings {
  charge_customer_fee: boolean
  auto_convert_enabled: boolean
  preferred_payout_currency: string | null
}

export default function CreatePaymentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [createdLink, setCreatedLink] = useState<CreatedPaymentLink | null>(null)
  const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyInfo[]>([])
  const [loadingCurrencies, setLoadingCurrencies] = useState(true)
  const [merchantSettings, setMerchantSettings] = useState<MerchantSettings | null>(null)
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    amount: '',
    currency: 'USD',
    acceptedCryptos: [],
    expiresAt: '',
    maxUses: '',
    redirectUrl: '',
    chargeCustomerFee: null, // inherit from merchant
    autoConvertEnabled: null, // inherit from merchant
    preferredPayoutCurrency: null // inherit from merchant
  })
  
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    loadMerchantSupportedCurrencies()
  }, [])

  const loadMerchantSupportedCurrencies = async () => {
    try {
      setLoadingCurrencies(true)
      
      // Load merchant's supported currencies (only those with wallet addresses)
      const response = await fetch('/api/merchants/supported-currencies')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAvailableCurrencies(data.currencies)
          setMerchantSettings({
            charge_customer_fee: data.charge_customer_fee,
            auto_convert_enabled: false, // Will be loaded from merchant settings
            preferred_payout_currency: null // Will be loaded from merchant settings
          })
          
          // Pre-select all available currencies if merchant has wallets
          if (data.currencies.length > 0) {
            setFormData(prev => ({
              ...prev,
              acceptedCryptos: data.currencies.map((c: CurrencyInfo) => c.code)
            }))
          }
        } else {
          // No wallet addresses configured
          setAvailableCurrencies([])
          toast.error(data.message || 'No wallet addresses configured')
        }
      } else {
        throw new Error('Failed to load supported currencies')
      }
      
    } catch (error) {
      console.error('Failed to load merchant currencies:', error)
      toast.error('Failed to load available currencies. Please configure wallet addresses in your settings.')
      setAvailableCurrencies([])
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

    // Validate that all selected cryptocurrencies have wallet addresses
    const invalidCryptos = formData.acceptedCryptos.filter(crypto => 
      !availableCurrencies.find(c => c.code === crypto && c.has_wallet)
    )
    
    if (invalidCryptos.length > 0) {
      newErrors.acceptedCryptos = `Missing wallet addresses for: ${invalidCryptos.join(', ')}`
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

      // Create payment link with new fields
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
        charge_customer_fee: formData.chargeCustomerFee, // null = inherit from merchant
        auto_convert_enabled: formData.autoConvertEnabled, // null = inherit from merchant
        preferred_payout_currency: formData.preferredPayoutCurrency, // null = inherit from merchant
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
          redirect_url,
          charge_customer_fee
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
      trust_wallet_compatible: true,
      has_wallet: false
    }
  }

  const getEstimatedCryptoAmount = (currency: CurrencyInfo) => {
    if (!formData.amount || !currency.rate_usd) return null
    
    const usdAmount = parseFloat(formData.amount)
    if (isNaN(usdAmount)) return null
    
    const cryptoAmount = usdAmount / currency.rate_usd
    return cryptoAmount.toFixed(currency.decimals)
  }

  const getNetworkBadgeColor = (network: string) => {
    const colorMap: Record<string, string> = {
      'Bitcoin': 'bg-orange-100 text-orange-800',
      'Ethereum': 'bg-blue-100 text-blue-800',
      'BSC': 'bg-yellow-100 text-yellow-800',
      'Solana': 'bg-green-100 text-green-800',
      'Tron': 'bg-red-100 text-red-800',
      'TON': 'bg-indigo-100 text-indigo-800',
      'Dogecoin': 'bg-amber-100 text-amber-800',
      'XRP Ledger': 'bg-purple-100 text-purple-800',
      'Sui': 'bg-cyan-100 text-cyan-800',
      'Avalanche': 'bg-rose-100 text-rose-800'
    }
    return colorMap[network] || 'bg-gray-100 text-gray-800'
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
                
                {/* Fee information */}
                <div className="mt-3 text-sm text-gray-600">
                  {createdLink.charge_customer_fee === true && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      Gateway fee charged to customer
                    </Badge>
                  )}
                  {createdLink.charge_customer_fee === false && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Gateway fee absorbed by merchant
                    </Badge>
                  )}
                  {createdLink.charge_customer_fee === null && merchantSettings && (
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                      Using global setting: {merchantSettings.charge_customer_fee ? 'Customer pays fee' : 'Merchant pays fee'}
                    </Badge>
                  )}
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
                      acceptedCryptos: availableCurrencies.map(c => c.code),
                      expiresAt: '',
                      maxUses: '',
                      redirectUrl: '',
                      chargeCustomerFee: null,
                      autoConvertEnabled: null,
                      preferredPayoutCurrency: null
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

        {/* No wallet addresses warning */}
        {!loadingCurrencies && availableCurrencies.length === 0 && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>No wallet addresses configured.</strong> You need to add wallet addresses for cryptocurrencies 
              before creating payment links. 
              <Button 
                variant="link" 
                className="p-0 h-auto text-yellow-800 underline ml-1"
                onClick={() => router.push('/merchant/settings')}
              >
                Go to Settings
              </Button>
            </AlertDescription>
          </Alert>
        )}

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
                        <SelectItem value="CAD">CAD (C$)</SelectItem>
                        <SelectItem value="AUD">AUD (A$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Accepted Cryptocurrencies */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Accepted Cryptocurrencies *
                  </label>
                  {loadingCurrencies && (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  )}
                </div>
                
                {loadingCurrencies ? (
                  <div className="text-center py-8 text-gray-500">
                    Loading your configured cryptocurrencies...
                  </div>
                ) : availableCurrencies.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No wallet addresses configured</p>
                    <p className="text-sm">Add wallet addresses in your settings to create payment links</p>
                    <Button 
                      variant="outline" 
                      className="mt-3"
                      onClick={() => router.push('/merchant/settings')}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Go to Settings
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableCurrencies.map((currency) => {
                      const isSelected = formData.acceptedCryptos.includes(currency.code)
                      const estimatedAmount = getEstimatedCryptoAmount(currency)
                      
                      return (
                        <div
                          key={currency.code}
                          className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                            isSelected 
                              ? 'border-[#7f5efd] bg-[#7f5efd]/5' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleCryptoToggle(currency.code)}
                        >
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={isSelected}
                              onChange={() => handleCryptoToggle(currency.code)}
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{currency.symbol} {currency.code}</span>
                                {currency.network && (
                                  <Badge variant="outline" className={`text-xs ${getNetworkBadgeColor(currency.network)}`}>
                                    {currency.network}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {currency.display_name || currency.name}
                                {estimatedAmount && (
                                  <span className="ml-2 text-[#7f5efd]">
                                    ~{estimatedAmount} {currency.code}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                
                {errors.acceptedCryptos && (
                  <p className="text-sm text-red-600">{errors.acceptedCryptos}</p>
                )}
              </div>

              {/* Fee Settings */}
              {merchantSettings && (
                <div className="space-y-4">
                  <label className="text-sm font-medium text-gray-700">
                    Fee Settings
                  </label>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={formData.chargeCustomerFee === true}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({ 
                            ...prev, 
                            chargeCustomerFee: checked ? true : null 
                          }))
                        }
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">Charge customer gateway fee</div>
                        <div className="text-xs text-gray-500">
                          Customer pays the gateway fee instead of merchant
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={formData.chargeCustomerFee === false}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({ 
                            ...prev, 
                            chargeCustomerFee: checked ? false : null 
                          }))
                        }
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">Merchant absorbs gateway fee</div>
                        <div className="text-xs text-gray-500">
                          Merchant pays the gateway fee (customer pays exact amount)
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={formData.chargeCustomerFee === null}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({ 
                            ...prev, 
                            chargeCustomerFee: checked ? null : false 
                          }))
                        }
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">Use global setting</div>
                        <div className="text-xs text-gray-500">
                          Current: {merchantSettings.charge_customer_fee ? 'Customer pays fee' : 'Merchant pays fee'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Optional Settings */}
              <div className="space-y-4">
                <label className="text-sm font-medium text-gray-700">
                  Optional Settings
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-2 block">
                      Expires At
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
                    <label className="text-sm text-gray-600 mb-2 block">
                      Max Uses
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
                  <label className="text-sm text-gray-600 mb-2 block">
                    Redirect URL (After Payment)
                  </label>
                  <Input
                    type="url"
                    placeholder="https://yoursite.com/success"
                    value={formData.redirectUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, redirectUrl: e.target.value }))}
                    className={errors.redirectUrl ? 'border-red-300' : ''}
                  />
                  {errors.redirectUrl && (
                    <p className="text-sm text-red-600 mt-1">{errors.redirectUrl}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={loading || availableCurrencies.length === 0}
                  className="w-full bg-[#7f5efd] hover:bg-[#7f5efd]/90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Payment Link...
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

