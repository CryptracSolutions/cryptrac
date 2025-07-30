import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Badge } from '@/app/components/ui/badge'
import { Separator } from '@/app/components/ui/separator'
import { Copy, QrCode, ExternalLink, Loader2, AlertCircle, CheckCircle, Clock, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import QRCode from 'qrcode'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface PaymentLink {
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
  merchant: {
    business_name: string
    charge_customer_fee: boolean
  }
}

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
}

interface EstimateData {
  currency: string
  estimated_amount: number
  currency_from: string
  amount_from: number
  fiat_equivalent?: number
  min_amount?: number
  max_amount?: number
  rate: number
}

interface PaymentData {
  payment_id: string
  payment_status: string
  pay_address: string
  price_amount: number
  price_currency: string
  pay_amount: number
  pay_currency: string
  order_id?: string
  order_description?: string
  purchase_id?: string
  created_at: string
  updated_at: string
  outcome_amount?: number
  outcome_currency?: string
}

const FIAT_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' }
]

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const linkId = params.id as string

  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null)
  const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyInfo[]>([])
  const [estimates, setEstimates] = useState<Record<string, EstimateData>>({})
  const [selectedCurrency, setSelectedCurrency] = useState<string>('')
  const [customerEmail, setCustomerEmail] = useState<string>('')
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  
  const [loading, setLoading] = useState(true)
  const [estimatesLoading, setEstimatesLoading] = useState(false)
  const [creatingPayment, setCreatingPayment] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (linkId) {
      loadPaymentLink()
    }
  }, [linkId])

  useEffect(() => {
    if (paymentLink && availableCurrencies.length > 0) {
      loadEstimates()
    }
  }, [paymentLink, availableCurrencies])

  const loadPaymentLink = async () => {
    try {
      setLoading(true)
      console.log('🔍 Loading payment link:', linkId)

      const { data: paymentLinkData, error: linkError } = await supabase
        .from('payment_links')
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
          charge_customer_fee,
          merchants!inner(business_name, charge_customer_fee)
        `)
        .eq('link_id', linkId)
        .eq('status', 'active')
        .single()

      if (linkError || !paymentLinkData) {
        console.error('Payment link not found:', linkError)
        setError('Payment link not found or has expired')
        return
      }

      // Transform the data to match our interface - handle the merchants array
      const merchantData = Array.isArray(paymentLinkData.merchants) 
        ? paymentLinkData.merchants[0] 
        : paymentLinkData.merchants

      const transformedData: PaymentLink = {
        id: paymentLinkData.id,
        link_id: paymentLinkData.link_id,
        title: paymentLinkData.title,
        description: paymentLinkData.description,
        amount: paymentLinkData.amount,
        currency: paymentLinkData.currency,
        accepted_cryptos: paymentLinkData.accepted_cryptos,
        expires_at: paymentLinkData.expires_at,
        max_uses: paymentLinkData.max_uses,
        charge_customer_fee: paymentLinkData.charge_customer_fee,
        merchant: {
          business_name: merchantData.business_name,
          charge_customer_fee: merchantData.charge_customer_fee
        }
      }

      console.log('✅ Payment link loaded:', transformedData)
      setPaymentLink(transformedData)

      // Load available currencies from dynamic API
      await loadAvailableCurrencies(transformedData.accepted_cryptos)

    } catch (error) {
      console.error('Error loading payment link:', error)
      setError('Failed to load payment information')
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableCurrencies = async (acceptedCryptos: string[]) => {
    try {
      console.log('📡 Loading currencies from dynamic API...')
      
      const response = await fetch('/api/currencies?popular=false')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error('Failed to load currencies')
      }

      // Filter to only accepted cryptocurrencies
      const filtered = data.currencies.filter((currency: CurrencyInfo) => 
        acceptedCryptos.includes(currency.code) && currency.enabled
      )

      console.log(`✅ Loaded ${filtered.length} available currencies:`, filtered.map((c: CurrencyInfo) => c.code))
      setAvailableCurrencies(filtered)

      // Auto-select first currency if available
      if (filtered.length > 0 && !selectedCurrency) {
        setSelectedCurrency(filtered[0].code)
      }

    } catch (error) {
      console.error('Error loading currencies:', error)
      setError('Failed to load available cryptocurrencies')
    }
  }

  const loadEstimates = async () => {
    if (!paymentLink || availableCurrencies.length === 0) return

    try {
      setEstimatesLoading(true)
      console.log('📊 Loading estimates for currencies...')

      const response = await fetch('/api/nowpayments/estimate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: paymentLink.amount,
          currency_from: paymentLink.currency.toLowerCase(),
          currencies: availableCurrencies.map(c => c.code.toLowerCase())
        })
      })

      const data = await response.json()
      
      if (data.success && data.estimates) {
        console.log(`✅ Loaded ${data.estimates.length} estimates`)
        
        const estimatesMap: Record<string, EstimateData> = {}
        data.estimates.forEach((estimate: EstimateData) => {
          estimatesMap[estimate.currency.toUpperCase()] = estimate
        })
        
        setEstimates(estimatesMap)
      } else {
        console.error('❌ Failed to get estimates:', data.error || 'Unknown error')
        setError('Failed to load conversion rates')
      }

    } catch (error) {
      console.error('❌ Error fetching estimates:', error)
      setError('Failed to load conversion rates')
    } finally {
      setEstimatesLoading(false)
    }
  }

  const createPayment = async () => {
    if (!selectedCurrency || !paymentLink) {
      toast.error('Please select a cryptocurrency')
      return
    }

    try {
      console.log('🔄 Creating payment for currency:', selectedCurrency)
      setCreatingPayment(true)

      const response = await fetch('/api/nowpayments/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_amount: paymentLink.amount,
          price_currency: paymentLink.currency.toLowerCase(),
          pay_currency: selectedCurrency.toLowerCase(),
          order_id: `cryptrac_${paymentLink.link_id}_${Date.now()}`,
          order_description: paymentLink.title,
          ipn_callback_url: `${window.location.origin}/api/webhooks/nowpayments`
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create payment')
      }

      const data = await response.json()

      if (!data.success || !data.payment) {
        throw new Error(data.error || 'Failed to create payment')
      }

      console.log('✅ Payment created successfully:', data.payment)
      setPaymentData(data.payment)

      // Generate QR code for payment address
      try {
        const qrDataUrl = await QRCode.toDataURL(data.payment.pay_address, {
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

      toast.success('Payment created! Send the exact amount to the address below.')

    } catch (error) {
      console.error('❌ Error creating payment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create payment')
    } finally {
      setCreatingPayment(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const formatCurrency = (amount: number, currencyCode: string) => {
    const currency = FIAT_CURRENCIES.find(c => c.code === currencyCode)
    return `${currency?.symbol || ''}${amount.toFixed(2)} ${currencyCode}`
  }

  const formatCrypto = (amount: number, currencyCode: string, decimals: number = 8) => {
    return `${amount.toFixed(decimals)} ${currencyCode}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading payment information...</p>
        </div>
      </div>
    )
  }

  if (error || !paymentLink) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Not Found</h2>
            <p className="text-gray-600 mb-4">
              {error || 'This payment link is invalid or has expired.'}
            </p>
            <Button onClick={() => router.push('/')}>
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">Payment Created</h1>
            <p className="mt-2 text-gray-600">Send the exact amount to complete your payment</p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Payment Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Amount */}
              <div className="text-center p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                <p className="text-sm text-blue-600 mb-2">Send exactly</p>
                <p className="text-3xl font-bold text-blue-900">
                  {formatCrypto(paymentData.pay_amount, paymentData.pay_currency.toUpperCase())}
                </p>
                <p className="text-sm text-blue-600 mt-2">
                  ≈ {formatCurrency(paymentData.price_amount, paymentData.price_currency.toUpperCase())}
                </p>
              </div>

              {/* Payment Address */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Payment Address</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={paymentData.pay_address}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(paymentData.pay_address)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* QR Code */}
              {qrCodeDataUrl && (
                <div className="text-center">
                  <Label className="text-sm font-medium text-gray-700">QR Code</Label>
                  <div className="mt-2">
                    <img
                      src={qrCodeDataUrl}
                      alt="Payment Address QR Code"
                      className="mx-auto border rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Scan with your wallet app
                    </p>
                  </div>
                </div>
              )}

              {/* Payment Details */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment ID:</span>
                  <span className="font-mono">{paymentData.payment_id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                    {paymentData.payment_status}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Network:</span>
                  <span>{availableCurrencies.find(c => c.code === selectedCurrency)?.network || 'Unknown'}</span>
                </div>
              </div>

              {/* Important Notes */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Important Notes:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Send the exact amount shown above</li>
                  <li>• Use the correct network ({availableCurrencies.find(c => c.code === selectedCurrency)?.network})</li>
                  <li>• Payment will be confirmed automatically</li>
                  <li>• You will be redirected to a confirmation page after payment</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  Check Payment Status
                </Button>
                <Button
                  onClick={() => router.push(`/payment/success/${paymentData.payment_id}`)}
                  className="flex-1"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Merchant Info */}
          <Card className="bg-gray-50">
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-gray-600">
                Payment to <span className="font-medium">{paymentLink.merchant.business_name}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Powered by Cryptrac
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{paymentLink.title}</h1>
          {paymentLink.description && (
            <p className="mt-2 text-gray-600">{paymentLink.description}</p>
          )}
          <div className="mt-4">
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(paymentLink.amount, paymentLink.currency)}
            </p>
            <p className="text-sm text-gray-500">
              Payment to {paymentLink.merchant.business_name}
            </p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Cryptocurrency</CardTitle>
            <p className="text-sm text-gray-600">
              Choose how you'd like to pay
            </p>
          </CardHeader>
          <CardContent>
            {estimatesLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-600">Loading conversion rates...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableCurrencies.map((currency) => {
                  const estimate = estimates[currency.code]
                  const isSelected = selectedCurrency === currency.code
                  
                  return (
                    <div
                      key={currency.code}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedCurrency(currency.code)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{currency.code}</span>
                            <Badge variant="secondary" className="text-xs">
                              {currency.network}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{currency.display_name}</p>
                        </div>
                        <div className="text-right">
                          {estimate ? (
                            <>
                              <p className="font-medium">
                                {formatCrypto(estimate.estimated_amount, currency.code, currency.decimals)}
                              </p>
                              <p className="text-sm text-gray-500">
                                Rate: 1 {paymentLink.currency} = {estimate.rate.toFixed(6)} {currency.code}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-gray-500">Loading rate...</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Optional Email */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Email Receipt (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="email"
              placeholder="Enter your email for receipt"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Create Payment Button */}
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={createPayment}
              disabled={!selectedCurrency || creatingPayment || estimatesLoading}
              className="w-full"
              size="lg"
            >
              {creatingPayment ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating Payment...
                </>
              ) : (
                <>
                  Create Payment
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
            
            {selectedCurrency && estimates[selectedCurrency] && (
              <div className="mt-4 text-center text-sm text-gray-600">
                You will pay approximately{' '}
                <span className="font-medium">
                  {formatCrypto(
                    estimates[selectedCurrency].estimated_amount,
                    selectedCurrency,
                    availableCurrencies.find(c => c.code === selectedCurrency)?.decimals || 8
                  )}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            Powered by Cryptrac • Secure cryptocurrency payments
          </p>
        </div>
      </div>
    </div>
  )
}

