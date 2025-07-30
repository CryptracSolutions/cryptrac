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
  charge_customer_fee: boolean | null
}

interface MerchantSettings {
  charge_customer_fee: boolean
  auto_convert_enabled: boolean
  preferred_payout_currency: string | null
}

// Generate a unique, URL-safe link ID
const generateLinkId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
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
    chargeCustomerFee: null, // null = inherit from merchant global setting
    autoConvertEnabled: null, // null = inherit from merchant global setting
    preferredPayoutCurrency: null // null = inherit from merchant global setting
  })

  const [errors, setErrors] = useState<FormErrors>({})

  // Load merchant settings and available currencies
  useEffect(() => {
    loadMerchantData()
  }, [])

  const loadMerchantData = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        router.push('/auth/login')
        return
      }

      // Load merchant settings
      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('charge_customer_fee, auto_convert_enabled, preferred_payout_currency, wallets')
        .eq('user_id', user.id)
        .single()

      if (merchantError) {
        console.error('Error loading merchant:', merchantError)
        toast.error('Failed to load merchant settings')
        return
      }

      console.log('✅ Merchant loaded:', merchant)

      setMerchantSettings({
        charge_customer_fee: merchant.charge_customer_fee || false,
        auto_convert_enabled: merchant.auto_convert_enabled || false,
        preferred_payout_currency: merchant.preferred_payout_currency
      })

      // Load available currencies with proper error handling
      try {
        const response = await fetch('/api/currencies?popular=false')
        const response = await fetch('/api/currencies?popular=true')
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const currenciesData = await response.json()
        console.log('📨 Currencies API response:', currenciesData)

        if (!currenciesData || !currenciesData.success) {
          throw new Error('Invalid API response format')
        }

        // Filter currencies to only show those with configured wallet addresses
        const merchantWallets = merchant.wallets || {}
        console.log('💰 Merchant wallets:', merchantWallets)
        
        const availableCurrencies = currenciesData.currencies.filter((currency: CurrencyInfo) => {
          const hasWallet = merchantWallets[currency.code]
          console.log(`🔍 ${currency.code}: has wallet = ${!!hasWallet}`)
          return hasWallet && currency.enabled
        }).map((currency: CurrencyInfo) => ({
          ...currency,
          has_wallet: true,
          wallet_address: merchantWallets[currency.code]
        }))

        console.log('✅ Available currencies after filtering:', availableCurrencies)
        setAvailableCurrencies(availableCurrencies)
        
        // Auto-select all available currencies as default
        setFormData(prev => ({
          ...prev,
          acceptedCryptos: availableCurrencies.map((c: CurrencyInfo) => c.code)
        }))

      } catch (currencyError) {
        console.error('Error loading currencies:', currencyError)
        
        // Fallback: Use merchant wallets directly if API fails
        const merchantWallets = merchant.wallets || {}
        const fallbackCurrencies = Object.keys(merchantWallets).map(code => ({
          code,
          name: code,
          symbol: code,
          network: 'Unknown',
          enabled: true,
          min_amount: 0.00000001,
          max_amount: 1000000,
          decimals: 8,
          has_wallet: true,
          wallet_address: merchantWallets[code],
          display_name: code
        }))

        console.log('🔄 Using fallback currencies from merchant wallets:', fallbackCurrencies)
        setAvailableCurrencies(fallbackCurrencies)
        
        setFormData(prev => ({
          ...prev,
          acceptedCryptos: fallbackCurrencies.map(c => c.code)
        }))

        if (fallbackCurrencies.length === 0) {
          toast.error('No configured wallet addresses found. Please configure wallets in settings.')
        } else {
          toast.success(`Loaded ${fallbackCurrencies.length} currencies from your wallet configuration`)
        }
      }

    } catch (error) {
      console.error('Error loading merchant data:', error)
      toast.error('Failed to load merchant data')
    } finally {
      setLoadingCurrencies(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Payment title is required'
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required'
    }

    if (formData.acceptedCryptos.length === 0) {
      newErrors.acceptedCryptos = 'At least one cryptocurrency must be selected'
    }

    if (formData.expiresAt && new Date(formData.expiresAt) <= new Date()) {
      newErrors.expiresAt = 'Expiration date must be in the future'
    }

    if (formData.maxUses && parseInt(formData.maxUses) <= 0) {
      newErrors.maxUses = 'Max uses must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
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
        console.error('Error fetching merchant:', merchantError)
        toast.error('Merchant account not found')
        return
      }

      // Generate unique link ID
      let linkId = generateLinkId()
      
      // Ensure link ID is unique (check database)
      let isUnique = false
      let attempts = 0
      while (!isUnique && attempts < 5) {
        const { data: existingLink } = await supabase
          .from('payment_links')
          .select('id')
          .eq('link_id', linkId)
          .single()
        
        if (!existingLink) {
          isUnique = true
        } else {
          linkId = generateLinkId()
          attempts++
        }
      }

      if (!isUnique) {
        toast.error('Failed to generate unique link ID. Please try again.')
        return
      }

      console.log('🔗 Generated unique link ID:', linkId)

      // Create payment link with correct database schema
      const paymentData = {
        merchant_id: merchant.id,
        link_id: linkId, // Add the generated link ID
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        accepted_cryptos: formData.acceptedCryptos,
        expires_at: formData.expiresAt || null,
        max_uses: formData.maxUses ? parseInt(formData.maxUses) : null,
        charge_customer_fee: formData.chargeCustomerFee, // null = inherit from merchant
        auto_convert_enabled: formData.autoConvertEnabled, // null = inherit from merchant
        preferred_payout_currency: formData.preferredPayoutCurrency, // null = inherit from merchant
        status: 'active' // Use 'status' column instead of 'is_active'
      }

      console.log('🔗 Creating payment link with data:', paymentData)

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
          charge_customer_fee
        `)
        .single()

      if (createError) {
        console.error('Error creating payment link:', createError)
        toast.error('Failed to create payment link')
        return
      }

      console.log('✅ Payment link created successfully:', createdPayment)

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

  const handleCopyLink = () => {
    if (createdLink) {
      navigator.clipboard.writeText(createdLink.payment_url)
      toast.success('Payment link copied to clipboard!')
    }
  }

  const handleCopyLinkId = () => {
    if (createdLink) {
      navigator.clipboard.writeText(createdLink.link_id)
      toast.success('Link ID copied to clipboard!')
    }
  }

  const resetForm = () => {
    setCreatedLink(null)
    setFormData({
      title: '',
      description: '',
      amount: '',
      currency: 'USD',
      acceptedCryptos: availableCurrencies.map(c => c.code),
      expiresAt: '',
      maxUses: '',
      chargeCustomerFee: null,
      autoConvertEnabled: null,
      preferredPayoutCurrency: null
    })
    setErrors({})
  }

  const getCurrencyDisplayName = (code: string) => {
    const currency = availableCurrencies.find(c => c.code === code)
    return currency?.display_name || currency?.name || code
  }

  const getInheritedValue = (value: boolean | null, merchantDefault: boolean) => {
    return value !== null ? value : merchantDefault
  }

  if (loadingCurrencies) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#7f5efd]" />
            <p className="text-gray-600">Loading payment creation form...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (createdLink) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push('/merchant/dashboard/payments')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Payments
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Payment Link Created!</h1>
            <p className="text-gray-600 mt-2">Your payment link is ready to use</p>
          </div>

          {/* Success Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span>Payment Link Successfully Created</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Link Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Payment Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Title:</span>
                      <span className="font-medium">{createdLink.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium">{createdLink.amount} {createdLink.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Link ID:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs">{createdLink.link_id}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyLinkId}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    {createdLink.expires_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expires:</span>
                        <span className="font-medium">
                          {new Date(createdLink.expires_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {createdLink.max_uses && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max Uses:</span>
                        <span className="font-medium">{createdLink.max_uses}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">QR Code</h3>
                  <div className="flex justify-center">
                    <QRCode value={createdLink.qr_code_data} size={150} />
                  </div>
                </div>
              </div>

              {/* Accepted Cryptocurrencies */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Accepted Cryptocurrencies</h3>
                <div className="flex flex-wrap gap-2">
                  {createdLink.accepted_cryptos.map((crypto) => (
                    <Badge key={crypto} variant="secondary" className="bg-[#7f5efd]/10 text-[#7f5efd] border-[#7f5efd]/20">
                      {getCurrencyDisplayName(crypto)}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Payment URL */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Payment URL</h3>
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <Input
                    value={createdLink.payment_url}
                    readOnly
                    className="bg-white border-gray-200"
                  />
                  <Button onClick={handleCopyLink} variant="outline" size="sm">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    onClick={() => window.open(createdLink.payment_url, '_blank')}
                    variant="outline"
                    size="sm"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open
                  </Button>
                </div>
              </div>

              {/* Success Flow Info */}
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Automatic Success Handling:</strong> After payment completion, customers will be automatically redirected to a Cryptrac-branded thank you page with receipt options (text/email).
                </AlertDescription>
              </Alert>

              {/* Actions */}
              <div className="flex space-x-4 pt-4">
                <Button onClick={resetForm} variant="outline">
                  Create Another Link
                </Button>
                <Button onClick={() => router.push('/merchant/dashboard/payments')}>
                  View All Payment Links
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/merchant/dashboard/payments')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Payments
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Create Payment Link</h1>
          <p className="text-gray-600 mt-2">Generate a secure payment link for your customers</p>
        </div>

        {/* Available Currencies Info */}
        {availableCurrencies.length === 0 && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>No wallet addresses configured.</strong> You need to configure wallet addresses in your{' '}
              <button
                onClick={() => router.push('/merchant/settings')}
                className="underline hover:no-underline"
              >
                merchant settings
              </button>{' '}
              before creating payment links.
            </AlertDescription>
          </Alert>
        )}

        {availableCurrencies.length > 0 && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Info className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Available currencies:</strong> Only cryptocurrencies with configured wallet addresses can be selected for payment links.
              You have {availableCurrencies.length} currencies available.
            </AlertDescription>
          </Alert>
        )}

        {/* Success Flow Info */}
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Automatic Success Handling:</strong> Customers will be automatically redirected to a Cryptrac-branded thank you page after payment completion, with options to receive receipts via text or email.
          </AlertDescription>
        </Alert>

        {/* Create Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Link2 className="w-5 h-5" />
              <span>Payment Link Details</span>
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
                    Description
                  </label>
                  <Textarea
                    placeholder="Optional description for the payment"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      Currency *
                    </label>
                    <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
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
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">
                  Accepted Cryptocurrencies *
                </label>
                {availableCurrencies.length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {availableCurrencies.map((currency) => (
                        <div key={currency.code} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <Checkbox
                            id={currency.code}
                            checked={formData.acceptedCryptos.includes(currency.code)}
                            onCheckedChange={(checked) => {
                              // Convert CheckedState to boolean
                              const isChecked = checked === true
                              if (isChecked) {
                                setFormData(prev => ({
                                  ...prev,
                                  acceptedCryptos: [...prev.acceptedCryptos, currency.code]
                                }))
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  acceptedCryptos: prev.acceptedCryptos.filter(c => c !== currency.code)
                                }))
                              }
                            }}
                          />
                          <div className="flex-1">
                            <label htmlFor={currency.code} className="text-sm font-medium text-gray-900 cursor-pointer">
                              {getCurrencyDisplayName(currency.code)}
                            </label>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {currency.network}
                              </Badge>
                              <div className="flex items-center space-x-1">
                                <Wallet className="w-3 h-3 text-green-600" />
                                <span className="text-xs text-green-600">Configured</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {errors.acceptedCryptos && (
                      <p className="text-sm text-red-600">{errors.acceptedCryptos}</p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No cryptocurrencies available</p>
                    <p className="text-sm">Configure wallet addresses in settings first</p>
                  </div>
                )}
              </div>

              {/* Advanced Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Advanced Settings</span>
                </h3>

                {/* Fee Override */}
                {merchantSettings && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="chargeCustomerFeeOverride"
                        checked={formData.chargeCustomerFee !== null}
                        onCheckedChange={(checked) => {
                          // Convert CheckedState to boolean and handle the logic
                          const isChecked = checked === true
                          setFormData(prev => ({
                            ...prev,
                            chargeCustomerFee: isChecked ? !merchantSettings.charge_customer_fee : null
                          }))
                        }}
                      />
                      <label htmlFor="chargeCustomerFeeOverride" className="text-sm font-medium text-gray-700">
                        Override fee setting for this payment link
                      </label>
                    </div>

                    {formData.chargeCustomerFee !== null && (
                      <div className="ml-6 space-y-2">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="chargeCustomerFee"
                            checked={formData.chargeCustomerFee === true}
                            onCheckedChange={(checked) => {
                              // Convert CheckedState to boolean
                              const isChecked = checked === true
                              setFormData(prev => ({ ...prev, chargeCustomerFee: isChecked }))
                            }}
                          />
                          <label htmlFor="chargeCustomerFee" className="text-sm text-gray-700">
                            Charge customer fee for this payment link
                          </label>
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 ml-6">
                      {formData.chargeCustomerFee !== null ? (
                        <span>
                          This payment link will {getInheritedValue(formData.chargeCustomerFee, merchantSettings.charge_customer_fee) ? 'charge' : 'not charge'} customers the processing fee
                        </span>
                      ) : (
                        <span>
                          Using merchant default: {merchantSettings.charge_customer_fee ? 'charge' : 'not charge'} customer fee
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Expiration Date
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
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/merchant/dashboard/payments')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || availableCurrencies.length === 0}
                  className="bg-[#7f5efd] hover:bg-[#6d4fd8]"
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

