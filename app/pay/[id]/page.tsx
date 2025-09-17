'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
// import { Input } from '@/app/components/ui/input'
// import { Label } from '@/app/components/ui/label'
import { Badge } from '@/app/components/ui/badge'
// import { Separator } from '@/app/components/ui/separator'
import { Copy, Loader2, AlertCircle, CheckCircle2, Clock, ArrowRight, RefreshCw, Globe, AlertTriangle, ShoppingBag, Bitcoin, Coins, Network, TrendingUp, Smartphone, DollarSign, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import QRCode from 'qrcode'
import { groupCurrenciesByNetwork, getNetworkInfo, getCurrencyDisplayName, sortNetworksByPriority } from '@/lib/crypto-networks'
import { buildCurrencyMapping } from '@/lib/currency-mapping'
import { requiresExtraId, getExtraIdLabel } from '@/lib/extra-id-validation'
import { formatAmountForDisplay } from '@/lib/crypto-uri-builder'
import { formatAddressForQR } from '@/lib/simple-address-formatter'
import { trackURIGeneration } from '@/lib/uri-analytics'
import { loadDynamicConfig } from '@/lib/wallet-uri-config'
import type { DynamicConfig } from '@/lib/wallet-uri-config'
import { getOrCreateClientId } from '@/lib/ab-testing'
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/app/components/ui/select'
import { cn } from '@/lib/utils'
import { useRealTimePaymentStatus } from '@/lib/hooks/useRealTimePaymentStatus'

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
  base_amount: number
  currency: string
  accepted_cryptos: string[]
  expires_at: string | null
  max_uses: number | null
  charge_customer_fee: boolean | null
  auto_convert_enabled: boolean | null
  fee_percentage: number
  // Tax fields
  tax_enabled: boolean
  tax_rates: Array<{
    label: string
    percentage: number
  }>
  tax_amount: number
  subtotal_with_tax: number
  source?: string | null
  subscription_id?: string | null
  merchant: {
    business_name: string
    charge_customer_fee: boolean
    auto_convert_enabled: boolean
  }
  metadata?: {
    fee_breakdown?: {
      effective_charge_customer_fee?: boolean
    }
  }
}

interface CurrencyInfo {
  code: string
  name: string
  enabled: boolean
  min_amount?: number
  max_amount?: number
}

interface PaymentData {
  payment_id: string
  payment_status: string
  pay_address: string
  payin_extra_id?: string
  pay_amount: number
  pay_currency: string
  price_amount: number
  price_currency: string
  order_id: string
  order_description: string
  created_at: string
  updated_at: string
  outcome_amount?: number
  outcome_currency?: string
  actually_paid?: number
  tx_hash?: string
  network?: string
}

interface PaymentStatus {
  payment_id: string
  payment_status: string
  pay_address: string
  payin_extra_id?: string
  pay_amount: number
  pay_currency: string
  price_amount: number
  price_currency: string
  order_id: string
  order_description: string
  created_at: string
  updated_at: string
  outcome_amount?: number
  outcome_currency?: string
  actually_paid?: number
  tx_hash?: string
  network?: string
}

interface FeeBreakdown {
  baseAmount: number
  taxAmount: number
  subtotalWithTax: number
  platformFee: number
  customerTotal: number
  merchantReceives: number
}


// Block explorer URLs for different networks

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  // const searchParams = useSearchParams()
  const id = params?.id as string
  
  // State management
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null)
  const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyInfo[]>([])
  const [selectedCurrency, setSelectedCurrency] = useState<string>('')
  const [selectedNetwork, setSelectedNetwork] = useState<string>('all')
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [extraIdConfirmed, setExtraIdConfirmed] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)
  const [creatingPayment, setCreatingPayment] = useState(false)
  const [error, setError] = useState<string>('')
  const [, setDynamicConfig] = useState<DynamicConfig | null>(null)
  const [, setClientId] = useState<string>('anon')
  
  // Real-time payment status monitoring
  const { } = useRealTimePaymentStatus({
    paymentId: paymentData?.payment_id || null,
    enabled: !!paymentData?.payment_id,
    onStatusChange: (updatedStatus) => {
      console.log(`🔄 Pay page status update received:`, updatedStatus)
      console.log(`📱 Current status state:`, paymentStatus)
      
      const newStatus = updatedStatus.payment_status
      console.log(`🎯 New status from real-time: ${newStatus}`)
      
      setPaymentStatus(prev => {
        console.log(`📊 Status state change: ${prev?.payment_status} → ${newStatus}`)
        if (!prev || newStatus !== prev.payment_status) {
          console.log(`✅ Status actually changing: ${prev?.payment_status} → ${newStatus}`)
          
          // Handle payment completion
          if (newStatus === 'finished' || 
              newStatus === 'confirmed' ||
              newStatus === 'sending') {
            console.log('✅ Payment completed via real-time update')
            // Redirect to success page
            router.push(`/payment/success/${paymentLink?.id}?payment_id=${updatedStatus.payment_id}`)
          }
          
          return updatedStatus;
        } else {
          console.log(`⚠️ Status unchanged: ${prev?.payment_status}`)
          return prev;
        }
      });
    },
    fallbackToPolling: true,
    pollingInterval: 2000 // Match Smart Terminal POS polling cadence
  })

  useEffect(() => {
    // Phase 3: load dynamic config and client id for A/B test bucketing
    (async () => {
      try { setDynamicConfig(await loadDynamicConfig()) } catch {}
      try { setClientId(getOrCreateClientId()) } catch {}
    })()
  }, [])

  // Ensure DAI on Ethereum: if the ETH network is selected and the current
  // currency is an Arbitrum-specific DAI code, normalize to plain DAI.
  useEffect(() => {
    if (selectedNetwork === 'ethereum' && selectedCurrency.toUpperCase() === 'DAIARB') {
      setSelectedCurrency('DAI')
    }
  }, [selectedNetwork, selectedCurrency])
  
  // Currency backend mapping for payment processing
  const [currencyBackendMapping, setCurrencyBackendMapping] = useState<Record<string, string>>({})
  
  // Fee calculation
  const feeBreakdown = paymentLink ? calculateFeeBreakdown(paymentLink) : null

  function calculateFeeBreakdown(link: PaymentLink): FeeBreakdown {
    const baseAmount = Number(link.base_amount) || 0
    const taxAmount = Number(link.tax_amount) || 0
    const subtotalWithTax = Number(link.subtotal_with_tax) || 0

    // Platform fee calculation using effective link setting
    const chargeCustomerFee =
      link.charge_customer_fee ??
      link.metadata?.fee_breakdown?.effective_charge_customer_fee ??
      false
    const feePercentage = Number(link.fee_percentage) || 0
    const feeAmount = subtotalWithTax * feePercentage
    const platformFee = chargeCustomerFee ? feeAmount : 0
    
    // Customer total: if charge_customer_fee is true, customer pays extra to offset NOWPayments fee deduction
    const customerTotal = chargeCustomerFee ? subtotalWithTax + feeAmount : subtotalWithTax
    
    // Merchant receives: NOWPayments always deducts fee from payout, regardless of charge_customer_fee
    // When charge_customer_fee is true, the extra customer payment offsets this deduction
    const merchantReceives = subtotalWithTax - feeAmount

    return {
      baseAmount,
      taxAmount,
      subtotalWithTax,
      platformFee,
      customerTotal,
      merchantReceives
    }
  }



  const loadPaymentLink = async () => {
    try {
      console.log('🔍 Loading payment link:', id)
      
      const { data, error } = await supabase
        .from('payment_links')
        .select(`
          *,
          merchant:merchants(business_name, charge_customer_fee, auto_convert_enabled)
        `)
        .eq('link_id', id)
        .single()

      if (error) {
        console.error('Supabase error:', error)
        throw new Error('Payment link not found')
      }

      if (!data) {
        throw new Error('Payment link not found')
      }

      // Check if payment link has expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        throw new Error('This payment link has expired')
      }

      console.log('✅ Payment link loaded:', data)

      // Transform the data to match our interface
      const transformedData: PaymentLink = {
        ...data,
        merchant: Array.isArray(data.merchant) ? data.merchant[0] : data.merchant
      }

      setPaymentLink(transformedData)
      
      // Load available currencies after payment link is loaded
      if (transformedData.accepted_cryptos && transformedData.accepted_cryptos.length > 0) {
        await loadCurrencies(transformedData.accepted_cryptos)
      }

    } catch (error) {
      console.error('Error loading payment link:', error)
      setError(error instanceof Error ? error.message : 'Failed to load payment link')
    } finally {
      setLoading(false)
    }
  }

  const loadCurrencies = async (acceptedCryptos: string[]) => {
    try {
      console.log('💱 Loading available currencies...')

      const response = await fetch('/api/nowpayments/currencies')
      const data = await response.json()

      if (!data.success || !data.currencies) {
        throw new Error('Failed to load currencies')
      }

      console.log(`📊 Loaded ${data.currencies.length} total currencies from NOWPayments`)
      console.log('✅ Payment link accepts:', acceptedCryptos)

      const { customerCurrencies, backendMappings } = buildCurrencyMapping({
        acceptedCryptos,
        npCurrencies: data.currencies,
      })

      setAvailableCurrencies(customerCurrencies)
      setCurrencyBackendMapping(backendMappings)
      console.log(`✅ Created ${customerCurrencies.length} customer-facing currencies`)
      console.log('📋 Backend mappings:', backendMappings)
      console.log('🎯 Final customer-facing currencies:', customerCurrencies.map((c: CurrencyInfo) => c.code))

    } catch (error) {
      console.error('Error loading currencies:', error)
      setError('Failed to load available currencies')
    }
  }


  const createPayment = async () => {
    if (!selectedCurrency || !paymentLink) return

    try {
      setCreatingPayment(true)
      console.log('🔄 Creating payment for currency:', selectedCurrency)
      
      // Use backend mapping for payment creation
      const backendCurrency = currencyBackendMapping[selectedCurrency] || selectedCurrency
      console.log('🔧 Currency mapping:', `${selectedCurrency} → ${backendCurrency}`)

      const amount = feeBreakdown ? feeBreakdown.customerTotal : paymentLink.amount

      const response = await fetch('/api/nowpayments/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_amount: amount,
          price_currency: paymentLink.currency,
          pay_currency: backendCurrency, // Use backend currency for API
          order_id: `cryptrac_${paymentLink.link_id}_${Date.now()}`,
          order_description: paymentLink.description || paymentLink.title,
          payment_link_id: paymentLink.id,
          // Tax information
          tax_enabled: paymentLink.tax_enabled,
          base_amount: paymentLink.base_amount,
          tax_rates: paymentLink.tax_rates,
          tax_amount: paymentLink.tax_amount,
          subtotal_with_tax: paymentLink.subtotal_with_tax
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to create payment')
      }

      console.log('✅ Payment created successfully:', data.payment)
      console.log(`🆕 Setting initial status from payment creation:`, data.payment.payment_status || 'pending');
      console.log(`🔍 Full payment data:`, data.payment);
      setPaymentData(data.payment)

      // Generate QR code for payment address with destination tag if needed
      if (data.payment.pay_address) {
        // Simple: address-only QR content (append extraId for special currencies)
        const { qrContent } = formatAddressForQR(
          data.payment.pay_currency,
          data.payment.pay_address
        )
        const qrData = qrContent
        
        console.log('🔗 Generated payment URI:', qrData)
        // Lightweight analytics (non-blocking)
        try {
          trackURIGeneration({
            currency: data.payment.pay_currency,
            walletDetected: '',
            uriType: 'address-only',
            uri: qrData,
          })
        } catch {}
        
        const qrDataUrl = await QRCode.toDataURL(qrData, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        setQrCodeDataUrl(qrDataUrl)

        // Reset confirmation when new payment loads
        setExtraIdConfirmed(false)
      }

    } catch (error) {
      console.error('Error creating payment:', error)
      setError(error instanceof Error ? error.message : 'Failed to create payment')
    } finally {
      setCreatingPayment(false)
    }
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard`)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      toast.error('Failed to copy to clipboard')
    }
  }



  // Load payment link on component mount
  useEffect(() => {
    if (id) {
      loadPaymentLink()
    }
    }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#7f5efd]"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center container-narrow">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="font-phonic text-3xl font-normal tracking-tight text-gray-900 mb-4">Payment Error</h1>
          <p className="font-phonic text-base font-normal text-gray-600 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()} size="lg" className="font-phonic text-base font-normal px-8 py-3 shadow-lg bg-[#7f5efd] hover:bg-[#7c3aed] text-white">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!paymentLink) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center container-narrow">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-gray-500" />
          </div>
          <h1 className="font-phonic text-3xl font-normal tracking-tight text-gray-900 mb-4">Payment Link Not Found</h1>
          <p className="font-phonic text-base font-normal text-gray-600">The payment link you&apos;re looking for doesn&apos;t exist or has expired.</p>
        </div>
      </div>
    )
  }

  const currentStatus = paymentStatus || paymentData
  const needsExtra = !!(paymentData?.payin_extra_id && requiresExtraId(paymentData.pay_currency))

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-2 sm:p-4 bg-gradient-to-br from-purple-50 via-white to-purple-50">
      <div className="w-full max-w-2xl">
        <Card className="w-full border-0 shadow-2xl bg-white/95 backdrop-blur-sm rounded-3xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-[#7f5efd] to-[#9b7cff]"></div>
          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pt-4">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-[#7f5efd] mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Payment Details</h2>
                <p className="text-base text-gray-600">Please wait while we securely load your payment information...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-semibold text-gray-900 mb-4">Payment Error</h1>
                <p className="text-base text-gray-600 mb-6">{error}</p>
                <Button onClick={() => window.location.reload()} className="bg-[#7f5efd] hover:bg-[#7c3aed] text-white">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : !paymentLink ? (
              <div className="text-center py-12">
                <AlertCircle className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <h1 className="text-2xl font-semibold text-gray-900 mb-4">Payment Link Not Found</h1>
                <p className="text-base text-gray-600">The payment link you&apos;re looking for doesn&apos;t exist or has expired.</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-semibold text-gray-900">{paymentLink.title}</h1>
                  {paymentLink.description && (
                    <p className="text-base text-gray-600">{paymentLink.description}</p>
                  )}
                  {paymentLink.subscription_id && (
                    <Badge className="bg-blue-100 text-blue-800">Recurring Invoice</Badge>
                  )}
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                    <span>Powered by</span>
                    <span className="font-medium text-gray-900">{paymentLink.merchant.business_name}</span>
                  </div>
                </div>

                {/* Payment Details */}
                {feeBreakdown && (
                  <div className="bg-gradient-to-br from-purple-50 to-white p-3 rounded-xl border border-purple-100" aria-live="polite">
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingBag className="h-4 w-4 text-[#7f5efd]" />
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Order Summary</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-semibold text-gray-900">${feeBreakdown.baseAmount.toFixed(2)}</span>
                      </div>
                      {paymentLink.tax_enabled && feeBreakdown.taxAmount > 0 && (
                        <div className="flex justify-between items-center text-[#7f5efd]">
                          <span>Tax</span>
                          <span className="font-medium">+${feeBreakdown.taxAmount.toFixed(2)}</span>
                        </div>
                      )}
                      {feeBreakdown.platformFee > 0 && (
                        <div className="flex justify-between items-center text-[#7f5efd]">
                          <span>Gateway fee</span>
                          <span className="font-medium">+${feeBreakdown.platformFee.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center font-bold border-t border-purple-100 pt-1">
                        <span className="text-gray-700">Total</span>
                        <span className="text-[#7f5efd]">${feeBreakdown.customerTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {!paymentData ? (
                  /* Currency Selection */
                  <div className="space-y-4">
                    {/* Network Selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Network className="h-4 w-4 text-[#7f5efd]" />
                        Network
                      </label>
                      
                      {/* Network Filter */}
                      {availableCurrencies.length > 0 && (() => {
                        const groupedCurrencies = groupCurrenciesByNetwork(
                          availableCurrencies.map(c => ({ code: c.code, name: c.name })),
                          paymentLink.accepted_cryptos
                        )
                        const availableNetworks = sortNetworksByPriority(Array.from(groupedCurrencies.keys()))
                        
                        const getNetworkIcon = (networkId: string) => {
                          switch (networkId) {
                            case 'bitcoin': return <Bitcoin className="h-4 w-4 text-white" />
                            case 'ethereum': return <Zap className="h-4 w-4 text-white" />
                            case 'binance': return <TrendingUp className="h-4 w-4 text-white" />
                            case 'solana': return <Zap className="h-4 w-4 text-white" />
                            case 'polygon': return <Network className="h-4 w-4 text-white" />
                            case 'tron': return <Globe className="h-4 w-4 text-white" />
                            case 'ton': return <Smartphone className="h-4 w-4 text-white" />
                            case 'arbitrum': return <TrendingUp className="h-4 w-4 text-white" />
                            case 'optimism': return <CheckCircle2 className="h-4 w-4 text-white" />
                            case 'base': return <DollarSign className="h-4 w-4 text-white" />
                            case 'avalanche': return <Network className="h-4 w-4 text-white" />
                            case 'algorand': return <Coins className="h-4 w-4 text-white" />
                            case 'litecoin': return <Coins className="h-4 w-4 text-white" />
                            case 'cardano': return <Coins className="h-4 w-4 text-white" />
                            case 'polkadot': return <Network className="h-4 w-4 text-white" />
                            case 'chainlink': return <Globe className="h-4 w-4 text-white" />
                            default: return <Network className="h-4 w-4 text-white" />
                          }
                        }
                        
                        return (
                          <Select value={selectedNetwork} onValueChange={(v) => setSelectedNetwork(v)}>
                            <SelectTrigger className="w-full h-12 bg-gradient-to-r from-white to-purple-50 border-2 border-purple-200 hover:border-[#7f5efd] focus:border-[#7f5efd] rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.02] text-gray-900">
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const iconClass = "h-4 w-4 text-[#7f5efd]"
                                  switch (selectedNetwork) {
                                    case 'all':
                                      return <Globe className={iconClass} />
                                    case 'bitcoin':
                                      return <Bitcoin className={iconClass} />
                                    case 'ethereum':
                                      return <Zap className={iconClass} />
                                    case 'binance':
                                      return <TrendingUp className={iconClass} />
                                    case 'solana':
                                      return <Zap className={iconClass} />
                                    case 'polygon':
                                      return <Network className={iconClass} />
                                    case 'tron':
                                      return <Globe className={iconClass} />
                                    case 'ton':
                                      return <Smartphone className={iconClass} />
                                    case 'arbitrum':
                                      return <TrendingUp className={iconClass} />
                                    case 'optimism':
                                      return <CheckCircle2 className={iconClass} />
                                    case 'base':
                                      return <DollarSign className={iconClass} />
                                    case 'avalanche':
                                      return <Network className={iconClass} />
                                    case 'algorand':
                                      return <Coins className={iconClass} />
                                    case 'litecoin':
                                      return <Coins className={iconClass} />
                                    case 'cardano':
                                      return <Coins className={iconClass} />
                                    case 'polkadot':
                                      return <Network className={iconClass} />
                                    case 'chainlink':
                                      return <Globe className={iconClass} />
                                    default:
                                      return <Network className={iconClass} />
                                  }
                                })()}
                                <span className="font-semibold">
                                  {selectedNetwork === 'all'
                                    ? 'All Networks'
                                    : (getNetworkInfo(selectedNetwork)?.displayName || 'Network')}
                                </span>
                              </div>
                            </SelectTrigger>
                            <SelectContent 
                              position="popper"
                              sideOffset={5}
                              className="rounded-xl border-purple-200 shadow-xl bg-gradient-to-br from-[#7f5efd] to-[#9b7cff] backdrop-blur-sm z-50"
                            >
                              <SelectItem value="all" className="hover:bg-white/10 rounded-lg transition-colors duration-200">
                                <div className="flex items-center gap-2">
                                  <Globe className="h-4 w-4 text-white" />
                                  <span className="font-bold text-white">All Networks</span>
                                </div>
                              </SelectItem>
                              {availableNetworks.map(networkId => {
                                const network = getNetworkInfo(networkId)
                                if (!network) return null
                                const currencyCount = groupedCurrencies.get(networkId)?.length || 0
                                return (
                                  <SelectItem key={networkId} value={networkId} className="hover:bg-white/10 rounded-lg transition-colors duration-200">
                                    <div className="flex items-center justify-between w-full">
                                      <div className="flex items-center gap-2">
                                        {getNetworkIcon(networkId)}
                                        <span className="font-bold text-white">{network.displayName}</span>
                                      </div>
                                      <span className="text-sm font-bold text-white bg-white/20 px-2 py-0.5 rounded-md ml-4">
                                        {currencyCount}
                                      </span>
                                    </div>
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        )
                      })()}
                    </div>
                    
                    {/* Currency Selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Coins className="h-4 w-4 text-[#7f5efd]" />
                        Currency
                      </label>
                      {availableCurrencies.length === 0 ? (
                        <div className="text-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-[#7f5efd] mx-auto mb-4" />
                          <p className="text-base text-gray-600">Loading available currencies...</p>
                        </div>
                      ) : (
                        <Select value={selectedCurrency} onValueChange={(value) => setSelectedCurrency(value)}>
                          <SelectTrigger className="w-full h-12 bg-gradient-to-r from-white to-purple-50 border-2 border-purple-200 hover:border-[#7f5efd] focus:border-[#7f5efd] rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.02] text-gray-900">
                            {selectedCurrency ? (() => {
                              const current = availableCurrencies.find(c => c.code === selectedCurrency)
                              const displayName = current?.name || getCurrencyDisplayName(selectedCurrency)
                              const getCurrencyIconLocal = (currencyCode: string) => {
                                const code = currencyCode.toUpperCase()
                                if (code === 'BTC') return <Bitcoin className="h-4 w-4 text-[#7f5efd]" />
                                if (code.includes('USDT') || code.includes('USDC') || code.includes('DAI') || code.includes('PYUSD') || code.includes('BUSD') || code.includes('TUSD')) return <DollarSign className="h-4 w-4 text-[#7f5efd]" />
                                if (code === 'ETH' || code.includes('ETH')) return <Zap className="h-4 w-4 text-[#7f5efd]" />
                                if (code === 'SOL' || code.includes('SOL')) return <Zap className="h-4 w-4 text-[#7f5efd]" />
                                if (code === 'BNB' || code.includes('BNB')) return <TrendingUp className="h-4 w-4 text-[#7f5efd]" />
                                if (code === 'MATIC') return <Network className="h-4 w-4 text-[#7f5efd]" />
                                if (code === 'TRX') return <Globe className="h-4 w-4 text-[#7f5efd]" />
                                if (code === 'TON') return <Smartphone className="h-4 w-4 text-[#7f5efd]" />
                                if (code === 'ARB') return <TrendingUp className="h-4 w-4 text-[#7f5efd]" />
                                if (code === 'OP') return <CheckCircle2 className="h-4 w-4 text-[#7f5efd]" />
                                if (code === 'AVAX') return <Network className="h-4 w-4 text-[#7f5efd]" />
                                if (code === 'ALGO') return <Coins className="h-4 w-4 text-[#7f5efd]" />
                                if (code === 'LTC') return <Coins className="h-4 w-4 text-[#7f5efd]" />
                                if (code === 'ADA') return <Coins className="h-4 w-4 text-[#7f5efd]" />
                                if (code === 'DOT') return <Network className="h-4 w-4 text-[#7f5efd]" />
                                if (code === 'LINK') return <Globe className="h-4 w-4 text-[#7f5efd]" />
                                return <Coins className="h-4 w-4 text-[#7f5efd]" />
                              }
                              return (
                                <div className="flex items-center gap-2">
                                  {getCurrencyIconLocal(selectedCurrency)}
                                  <span className="font-bold">{selectedCurrency.toUpperCase()}</span>
                                  <span className="text-gray-600">{displayName}</span>
                                </div>
                              )
                            })() : (
                              <span className="text-gray-500">Select a currency</span>
                            )}
                          </SelectTrigger>
                          <SelectContent 
                            position="popper"
                            sideOffset={5}
                            className="rounded-xl border-purple-200 shadow-xl bg-gradient-to-br from-[#7f5efd] to-[#9b7cff] backdrop-blur-sm z-50"
                          >
                            {useMemo(() => {
                              // Filter currencies based on selected network
                              let filteredCurrencies = availableCurrencies

                              if (selectedNetwork !== 'all') {
                                const groupedCurrencies = groupCurrenciesByNetwork(
                                  availableCurrencies.map(c => ({ code: c.code, name: c.name })),
                                  paymentLink.accepted_cryptos
                                )
                                const networkCurrencies = groupedCurrencies.get(selectedNetwork) || []
                                const networkCurrencyCodes = new Set(networkCurrencies.map(c => c.code))
                                filteredCurrencies = availableCurrencies.filter(c => networkCurrencyCodes.has(c.code))
                              }

                              // Swap: when Ethereum network is selected, show DAI (ETH)
                              // instead of any Arbitrum-specific DAI code that may leak in
                              if (selectedNetwork === 'ethereum') {
                                filteredCurrencies = filteredCurrencies.map(c =>
                                  c.code.toUpperCase() === 'DAIARB'
                                    ? { ...c, code: 'DAI', name: getCurrencyDisplayName('DAI') }
                                    : c
                                )
                                // Deduplicate if both DAI and DAIARB were present
                                const seen = new Set<string>()
                                filteredCurrencies = filteredCurrencies.filter(c => {
                                  const key = c.code.toUpperCase()
                                  if (seen.has(key)) return false
                                  seen.add(key)
                                  return true
                                })
                              }
                              
                              const getCurrencyIcon = (currencyCode: string) => {
                                const code = currencyCode.toUpperCase()
                                // Bitcoin
                                if (code === 'BTC') return <Bitcoin className="h-4 w-4 text-white" />
                                // Stablecoins
                                if (code.includes('USDT')) return <DollarSign className="h-4 w-4 text-white" />
                                if (code.includes('USDC')) return <DollarSign className="h-4 w-4 text-white" />
                                if (code.includes('DAI')) return <DollarSign className="h-4 w-4 text-white" />
                                if (code.includes('PYUSD')) return <DollarSign className="h-4 w-4 text-white" />
                                if (code.includes('BUSD') || code.includes('TUSD')) return <DollarSign className="h-4 w-4 text-white" />
                                // Major cryptocurrencies
                                if (code === 'ETH' || code.includes('ETH')) return <Zap className="h-4 w-4 text-white" />
                                if (code === 'SOL' || code.includes('SOL')) return <Zap className="h-4 w-4 text-white" />
                                if (code === 'BNB' || code.includes('BNB')) return <TrendingUp className="h-4 w-4 text-white" />
                                if (code === 'MATIC') return <Network className="h-4 w-4 text-white" />
                                if (code === 'TRX') return <Globe className="h-4 w-4 text-white" />
                                if (code === 'TON') return <Smartphone className="h-4 w-4 text-white" />
                                if (code === 'ARB') return <TrendingUp className="h-4 w-4 text-white" />
                                if (code === 'OP') return <CheckCircle2 className="h-4 w-4 text-white" />
                                if (code === 'AVAX') return <Network className="h-4 w-4 text-white" />
                                if (code === 'ALGO') return <Coins className="h-4 w-4 text-white" />
                                if (code === 'LTC') return <Coins className="h-4 w-4 text-white" />
                                if (code === 'ADA') return <Coins className="h-4 w-4 text-white" />
                                if (code === 'DOT') return <Network className="h-4 w-4 text-white" />
                                if (code === 'LINK') return <Globe className="h-4 w-4 text-white" />
                                return <Coins className="h-4 w-4 text-white" />
                              }
                              
                              return filteredCurrencies.map((c) => {
                                const displayName = c.name || getCurrencyDisplayName(c.code)
                                const isAvailable = c.enabled
                                return (
                                  <SelectItem
                                    key={c.code}
                                    value={c.code}
                                    disabled={!isAvailable}
                                    className={cn(
                                      "hover:bg-white/10 rounded-lg transition-colors duration-200",
                                      !isAvailable && "opacity-50 cursor-not-allowed"
                                    )}
                                    title={!isAvailable ? 'Temporarily unavailable' : undefined}
                                  >
                                    <div className="flex items-center gap-2">
                                      {getCurrencyIcon(c.code)}
                                      <span className="font-bold text-white">{c.code.toUpperCase()}</span>
                                      <span className="text-sm text-white/80">{displayName}</span>
                                    </div>
                                  </SelectItem>
                                )
                              })
                            }, [availableCurrencies, selectedNetwork, paymentLink?.accepted_cryptos])}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    
                    {selectedCurrency && (
                      <Button 
                        onClick={createPayment} 
                        disabled={creatingPayment}
                        className="w-full h-14 text-base font-semibold bg-gradient-to-r from-[#7f5efd] to-[#9b7cff] hover:from-[#7c3aed] hover:to-[#8b6cef] text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        {creatingPayment ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Creating Payment...
                          </>
                        ) : (
                          <>
                            Pay with {selectedCurrency.toUpperCase()}
                            <ArrowRight className="h-5 w-5" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                ) : (
                  /* Payment Display */
                  <div className="space-y-4">
                    {/* Payment Status */}
                    {currentStatus && (() => {
                      const status = currentStatus.payment_status
                      const isConfirmed = status === 'confirmed' || status === 'finished' || status === 'sending'
                      return (
                        <div className="w-full bg-gradient-to-br from-purple-50 to-white p-4 rounded-xl border border-purple-100">
                          {!isConfirmed ? (
                            <>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-6 w-6 text-[#7f5efd] animate-spin" />
                                  <span className="font-semibold text-gray-700">Awaiting Payment</span>
                                </div>
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-[#7f5efd]">
                                  {status.toUpperCase()}
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                              <div className="flex items-center gap-2 justify-center md:justify-start">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <div className="text-center md:text-left">
                                  <p className="font-semibold text-green-800 leading-tight">Payment Confirmed</p>
                                  <p className="text-xs text-green-600">Transaction has been confirmed</p>
                                </div>
                              </div>
                            </div>
                          )}
                          {/* Pre-send confirmation removed per design */}
                        </div>
                      )
                    })()}

                    {/* QR Code and Payment Info */}
                    <div className="space-y-4">
                      {qrCodeDataUrl && (!needsExtra || extraIdConfirmed) && (
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 text-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={qrCodeDataUrl} alt="Payment QR Code" className="w-56 h-56 mx-auto mb-3" />
                        </div>
                      )}
                      {needsExtra && !extraIdConfirmed && (
                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-[#7f5efd] border-purple-300 rounded accent-[#7f5efd] focus:ring-[#7f5efd]"
                              checked={extraIdConfirmed}
                              onChange={(e) => setExtraIdConfirmed(e.target.checked)}
                              aria-label={`Confirm including ${getExtraIdLabel(paymentData.pay_currency).toLowerCase()}`}
                            />
                            <label className="text-sm font-medium text-purple-900 select-none" onClick={() => setExtraIdConfirmed(v => !v)}>
                              Please confirm you will include the {getExtraIdLabel(paymentData.pay_currency).toLowerCase()} to reveal the QR code.
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Change Currency button (compact) - positioned below QR code */}
                      {(currentStatus && !['confirmed', 'finished', 'sending'].includes(currentStatus.payment_status)) && (
                        <div className="flex justify-center">
                          <button
                            type="button"
                            className="h-8 px-3 text-xs font-semibold rounded-md bg-[#7f5efd] hover:bg-[#7c3aed] text-white shadow-sm transition-colors"
                            onClick={() => {
                              setPaymentData(null)
                              setPaymentStatus(null)
                              setQrCodeDataUrl('')
                              setExtraIdConfirmed(false)
                            }}
                          >
                            Change Currency
                          </button>
                        </div>
                      )}

                      {/* Destination Tag/Memo Warning (centered, above amount) */}
                      {paymentData.payin_extra_id && requiresExtraId(paymentData.pay_currency) && (
                        <div className="w-full bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                          <AlertTriangle className="h-4 w-4 text-[#7f5efd] mx-auto mb-1" />
                          <p className="text-xs font-semibold text-purple-900 mb-1">
                            {getExtraIdLabel(paymentData.pay_currency)} Required
                          </p>
                          <div className="bg-white p-1.5 rounded-md border border-purple-200 mb-1">
                            <p className="text-sm font-mono text-[#7f5efd] font-semibold break-all">
                              {paymentData.payin_extra_id}
                            </p>
                          </div>
                          <p className="text-xs text-purple-900">Include this {getExtraIdLabel(paymentData.pay_currency).toLowerCase()} or the payment may be lost.</p>
                          <p className="text-[11px] text-purple-900 mt-1">In many wallets (e.g., Trust Wallet), paste under “{getExtraIdLabel(paymentData.pay_currency)}” or “Memo”.</p>
                        </div>
                      )}

                      {/* Amount */}
                      <div className="bg-gradient-to-r from-purple-50 to-purple-25 p-4 rounded-lg border border-purple-200 text-center">
                        <p className="text-sm text-gray-600 mb-1">Send exactly</p>
                        <p className="text-2xl font-bold text-[#7f5efd]">{formatAmountForDisplay(paymentData.pay_amount)} {paymentData.pay_currency.toUpperCase()}</p>
                      </div>

                      {/* Address */}
                      <div className="w-full bg-gradient-to-br from-purple-50 to-white p-3 rounded-xl border border-purple-200">
                        <div className="mb-2 text-center">
                          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Wallet Address</span>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm text-center relative">
                          <p className="text-xs text-gray-600 mb-1">Send to this address</p>
                          <p className="text-sm font-mono break-all text-[#7f5efd] leading-relaxed tracking-wide font-semibold">
                            {paymentData.pay_address}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(paymentData.pay_address, 'Address')}
                            className="absolute right-2 top-2 border-[#7f5efd] text-[#7f5efd] hover:bg-purple-50"
                            aria-label="Copy address"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Destination Tag/Memo Warning moved above */}


                      {/* Instructions removed per request */}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
