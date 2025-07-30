import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Textarea } from '@/app/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Checkbox } from '@/app/components/ui/checkbox'
import { Badge } from '@/app/components/ui/badge'
import { ArrowLeft, Copy, QrCode, ExternalLink, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import QRCode from 'qrcode'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface CurrencyInfo {
  code: string
  name: string
  symbol: string
  network: string
  rate_usd: number
  min_amount: number
  max_amount: number
  decimals: number
  enabled: boolean
  trust_wallet_compatible: boolean
  display_name: string
  has_wallet?: boolean
  wallet_address?: string
}

interface FormData {
  title: string
  description: string
  amount: string
  currency: string
  acceptedCryptos: string[]
  expiresAt: string
  maxUses: string
  chargeCustomerFee: boolean | null
  autoConvertEnabled: boolean | null
  preferredPayoutCurrency: string | null
}

interface FormErrors {
  title?: string
  amount?: string
  acceptedCryptos?: string
}

interface MerchantSettings {
  charge_customer_fee: boolean
  auto_convert_enabled: boolean
  preferred_payout_currency: string | null
}

interface CreatedPaymentLink {
  id: string
  link_id: string
  title: string
  description: string | null
  amount: number
  currency: string
  accepted_cryptos: string[]
  expires_at: string | null
  max_uses: number | null
  charge_customer_fee: boolean | null
  payment_url: string
  qr_code_data: string
}

const FIAT_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' }
]

const generateLinkId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export default function CreatePaymentLinkPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    amount: '',
    currency: 'USD',
    acceptedCryptos: [],
    expiresAt: '',
    maxUses: '',
    chargeCustomerFee: null,
    autoConvertEnabled: null,
    preferredPayoutCurrency: null
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyInfo[]>([])
  const [merchantSettings, setMerchantSettings] = useState<MerchantSettings>({
    charge_customer_fee: false,
    auto_convert_enabled: false,
    preferred_payout_currency: null
  })
  const [loadingCurrencies, setLoadingCurrencies] = useState(true)
  const [createdLink, setCreatedLink] = useState<CreatedPaymentLink | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
        console.log('📡 Fetching currencies from dynamic API...')
        const response = await fetch('/api/currencies?popular=false')
        
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
          display_name: code,
          rate_usd: 0,
          trust_wallet_compatible: true
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
      newErrors.acceptedCryptos = 'Select at least one cryptocurrency'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
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

      // Generate QR code
      try {
        const qrDataUrl = await QRCode.toDataURL(paymentUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        setQrCodeDataUrl(qrDataUrl)
      } catch (qrError) {
        console.error('Error generating QR code:', qrError)
      }

    } catch (error) {
      console.error('Error creating payment link:', error)
      toast.error('Failed to create payment link')
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  if (createdLink) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Payment Link Created!</h1>
            <p className="mt-2 text-gray-600">Your payment link is ready to share</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Payment Link Details */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Link Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Title</Label>
                  <p className="text-gray-900">{createdLink.title}</p>
                </div>
                
                {createdLink.description && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Description</Label>
                    <p className="text-gray-900">{createdLink.description}</p>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium text-gray-700">Amount</Label>
                  <p className="text-gray-900">
                    {FIAT_CURRENCIES.find(c => c.code === createdLink.currency)?.symbol}
                    {createdLink.amount.toFixed(2)} {createdLink.currency}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Accepted Cryptocurrencies</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {createdLink.accepted_cryptos.map(crypto => (
                      <Badge key={crypto} variant="secondary" className="text-xs">
                        {crypto}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Payment URL</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={createdLink.payment_url}
                      readOnly
                      className="text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(createdLink.payment_url)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => window.open(createdLink.payment_url, '_blank')}
                    className="flex-1"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Test Payment
                  </Button>
                  <Button
                    onClick={() => router.push('/merchant/dashboard/payments')}
                    className="flex-1"
                  >
                    View All Links
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* QR Code */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  QR Code
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                {qrCodeDataUrl ? (
                  <div className="space-y-4">
                    <img
                      src={qrCodeDataUrl}
                      alt="Payment QR Code"
                      className="mx-auto border rounded-lg"
                    />
                    <p className="text-sm text-gray-600">
                      Customers can scan this QR code to access the payment page
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const link = document.createElement('a')
                        link.download = `payment-qr-${createdLink.link_id}.png`
                        link.href = qrCodeDataUrl
                        link.click()
                      }}
                    >
                      Download QR Code
                    </Button>
                  </div>
                ) : (
                  <div className="py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    <p className="text-sm text-gray-600 mt-2">Generating QR code...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Success Flow Information */}
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900">Automatic Success Handling</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    After customers complete their payment, they will be automatically redirected to a 
                    Cryptrac-branded thank you page with payment confirmation and receipt options 
                    (email/SMS). No additional setup required.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/merchant/dashboard/payments')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payments
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Create Payment Link</h1>
          <p className="mt-2 text-gray-600">Generate a secure payment link for your customers</p>
        </div>

        {loadingCurrencies ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading available currencies...</p>
            </CardContent>
          </Card>
        ) : availableCurrencies.length === 0 ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-red-900 mb-2">No wallet addresses configured</h3>
              <p className="text-red-700 mb-4">
                You need to configure wallet addresses in your merchant settings before creating payment links.
              </p>
              <Button
                onClick={() => router.push('/merchant/settings')}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Configure wallet addresses in settings first
              </Button>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Link Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Payment Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Product Purchase, Service Payment"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className={errors.title ? 'border-red-300' : ''}
                  />
                  {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Optional description for the payment"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      className={errors.amount ? 'border-red-300' : ''}
                    />
                    {errors.amount && <p className="text-sm text-red-600 mt-1">{errors.amount}</p>}
                  </div>

                  <div>
                    <Label htmlFor="currency">Currency *</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIAT_CURRENCIES.map(currency => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.name} ({currency.symbol})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Accepted Cryptocurrencies *</CardTitle>
                <p className="text-sm text-gray-600">
                  Only cryptocurrencies with configured wallet addresses can be selected for payment links.
                  You have {availableCurrencies.length} currencies available.
                </p>
              </CardHeader>
              <CardContent>
                {errors.acceptedCryptos && (
                  <p className="text-sm text-red-600 mb-4">{errors.acceptedCryptos}</p>
                )}
                
                <div className="grid gap-3 max-h-64 overflow-y-auto">
                  {availableCurrencies.map(currency => (
                    <div key={currency.code} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={currency.code}
                        checked={formData.acceptedCryptos.includes(currency.code)}
                        onCheckedChange={(checked) => {
                          const isChecked = checked === true
                          setFormData(prev => ({
                            ...prev,
                            acceptedCryptos: isChecked
                              ? [...prev.acceptedCryptos, currency.code]
                              : prev.acceptedCryptos.filter(c => c !== currency.code)
                          }))
                        }}
                      />
                      <div className="flex-1">
                        <Label htmlFor={currency.code} className="font-medium cursor-pointer">
                          {currency.code}
                        </Label>
                        <p className="text-sm text-gray-600">{currency.display_name}</p>
                        <p className="text-xs text-gray-500">Network: {currency.network}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Configured
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      acceptedCryptos: availableCurrencies.map(c => c.code)
                    }))}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, acceptedCryptos: [] }))}
                  >
                    Clear All
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="feeOverride"
                      checked={formData.chargeCustomerFee !== null}
                      onCheckedChange={(checked) => {
                        const isChecked = checked === true
                        setFormData(prev => ({
                          ...prev,
                          chargeCustomerFee: isChecked ? !merchantSettings.charge_customer_fee : null
                        }))
                      }}
                    />
                    <Label htmlFor="feeOverride" className="text-sm font-medium">
                      Override fee setting for this payment link
                    </Label>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">
                    Using merchant default: {merchantSettings.charge_customer_fee ? 'charge' : 'not charge'} customer fee
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiresAt">Expiration Date</Label>
                    <Input
                      id="expiresAt"
                      type="datetime-local"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxUses">Max Uses</Label>
                    <Input
                      id="maxUses"
                      type="number"
                      min="1"
                      placeholder="Unlimited"
                      value={formData.maxUses}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxUses: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/merchant/dashboard/payments')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || availableCurrencies.length === 0}
                className="min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Payment Link'
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

