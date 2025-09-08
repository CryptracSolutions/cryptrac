'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Badge } from '@/app/components/ui/badge'
import { Separator } from '@/app/components/ui/separator'
import { Copy, ExternalLink, Loader2, AlertCircle, CheckCircle, CheckCircle2, Clock, ArrowRight, RefreshCw, Shield, Zap, CreditCard, Filter, Globe, AlertTriangle, ChevronDown, ShoppingBag, Bitcoin, Coins, Network, TrendingUp, Smartphone, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'
import QRCode from 'qrcode'
import { groupCurrenciesByNetwork, getNetworkInfo, getCurrencyDisplayName, sortNetworksByPriority, NETWORKS } from '@/lib/crypto-networks'
import { buildCurrencyMapping } from '@/lib/currency-mapping'
import { requiresExtraId, getExtraIdLabel } from '@/lib/extra-id-validation'
import { buildCryptoPaymentURI, formatAmountForDisplay } from '@/lib/crypto-uri-builder'
import { formatAddressForQR } from '@/lib/simple-address-formatter'
import { trackURIGeneration } from '@/lib/uri-analytics'
import { loadDynamicConfig } from '@/lib/wallet-uri-config'
import type { DynamicConfig } from '@/lib/wallet-uri-config'
import { getOrCreateClientId } from '@/lib/ab-testing'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
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
const getBlockExplorerUrl = (txHash: string, currency: string): string | null => {
  if (!txHash) return null
  
  const currency_upper = currency.toUpperCase()
  
  // Bitcoin
  if (currency_upper === 'BTC') {
    return `https://blockchair.com/bitcoin/transaction/${txHash}`
  }
  
  // Ethereum and ERC-20 tokens
  if (['ETH', 'USDT', 'USDC', 'USDTERC20', 'DAI', 'PYUSD'].includes(currency_upper)) {
    return `https://etherscan.io/tx/${txHash}`
  }
  
  // BSC and BEP-20 tokens
  if (['BNB', 'BNBBSC', 'BSC', 'USDTBSC', 'USDCBSC', 'BUSDBSC'].includes(currency_upper)) {
    return `https://bscscan.com/tx/${txHash}`
  }
  
  // Solana and SPL tokens
  if (['SOL', 'USDTSOL', 'USDCSOL'].includes(currency_upper)) {
    return `https://solscan.io/tx/${txHash}`
  }
  
  // Polygon and Polygon tokens
  if (['MATIC', 'USDTMATIC', 'USDCMATIC'].includes(currency_upper)) {
    return `https://polygonscan.com/tx/${txHash}`
  }
  
  // Tron and TRC-20 tokens
  if (['TRX', 'USDTTRC20', 'TUSDTRC20'].includes(currency_upper)) {
    return `https://tronscan.org/#/transaction/${txHash}`
  }
  
  // Avalanche
  if (currency_upper === 'AVAX') {
    return `https://snowtrace.io/tx/${txHash}`
  }
  
  // Arbitrum
  if (['ARB', 'USDTARB', 'USDCARB'].includes(currency_upper)) {
    return `https://arbiscan.io/tx/${txHash}`
  }
  
  // Optimism
  if (['OP', 'USDTOP', 'USDCOP'].includes(currency_upper)) {
    return `https://optimistic.etherscan.io/tx/${txHash}`
  }
  
  // Base
  if (['ETHBASE', 'USDCBASE'].includes(currency_upper)) {
    return `https://basescan.org/tx/${txHash}`
  }
  
  // TON
  if (['TON', 'USDTTON'].includes(currency_upper)) {
    return `https://tonscan.org/tx/${txHash}`
  }
  
  // Algorand
  if (['ALGO', 'USDCALGO'].includes(currency_upper)) {
    return `https://algoexplorer.io/tx/${txHash}`
  }
  
  // Litecoin
  if (currency_upper === 'LTC') {
    return `https://blockchair.com/litecoin/transaction/${txHash}`
  }
  
  // Cardano
  if (currency_upper === 'ADA') {
    return `https://cardanoscan.io/transaction/${txHash}`
  }
  
  // XRP
  if (currency_upper === 'XRP') {
    return `https://xrpscan.com/tx/${txHash}`
  }
  
  // Polkadot
  if (currency_upper === 'DOT') {
    return `https://polkadot.subscan.io/extrinsic/${txHash}`
  }
  
  // Stellar
  if (currency_upper === 'XLM') {
    return `https://stellar.expert/explorer/public/tx/${txHash}`
  }
  
  // NEAR
  if (currency_upper === 'NEAR') {
    return `https://explorer.near.org/transactions/${txHash}`
  }
  
  return null
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
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
  const [dynamicConfig, setDynamicConfig] = useState<DynamicConfig | null>(null)
  const [clientId, setClientId] = useState<string>('anon')
  
  // Real-time payment status monitoring
  const { paymentStatus: realtimeStatus, connectionStatus } = useRealTimePaymentStatus({
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
          data.payment.pay_address,
          data.payment.payin_extra_id || undefined
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'confirming':
      case 'partially_paid':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'confirmed':
      case 'sending':
      case 'finished':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
      case 'refunded':
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirming':
      case 'partially_paid':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'confirmed':
      case 'sending':
      case 'finished':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'failed':
      case 'refunded':
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatStatus = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'Waiting for Payment'
      case 'confirming':
        return 'Confirming Payment'
      case 'partially_paid':
        return 'Partial Payment Received'
      case 'confirmed':
        return 'Payment Confirmed'
      case 'sending':
        return 'Sending to Merchant'
      case 'finished':
        return 'Payment Complete'
      case 'failed':
        return 'Payment Failed'
      case 'refunded':
        return 'Payment Refunded'
      case 'expired':
        return 'Payment Expired'
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-[#ede9fe] border-t-[#7f5efd] rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-[#ddd6fe] rounded-full animate-spin mx-auto" style={{ animationDelay: '0.5s' }}></div>
          </div>
          <h2 className="font-phonic text-xl font-normal text-gray-900 mb-2">Loading Payment Details</h2>
          <p className="font-phonic text-base font-normal text-gray-600">Please wait while we securely load your payment information...</p>
        </div>
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
                            <SelectContent className="rounded-xl border-purple-200 shadow-xl bg-gradient-to-br from-[#7f5efd] to-[#9b7cff] backdrop-blur-sm">
                              <SelectItem value="all" textValue="All Networks" className="hover:bg-white/10 rounded-lg transition-colors duration-200">
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
                                  <SelectItem key={networkId} value={networkId} textValue={network.displayName} className="hover:bg-white/10 rounded-lg transition-colors duration-200">
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
                          <SelectContent className="rounded-xl border-purple-200 shadow-xl bg-gradient-to-br from-[#7f5efd] to-[#9b7cff] backdrop-blur-sm">
                            {(() => {
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
                                    textValue={`${c.code.toUpperCase()} ${displayName}`}
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
                            })()}
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
                        </div>
                      )
                    })()}

                    {/* QR Code and Payment Info */}
                    <div className="space-y-4">
                      {qrCodeDataUrl && (!paymentData.payin_extra_id || !requiresExtraId(paymentData.pay_currency) || extraIdConfirmed) && (
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 text-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={qrCodeDataUrl} alt="Payment QR Code" className="w-56 h-56 mx-auto mb-3" />
                        </div>
                      )}
                      {/* Show Extra ID section for XRP, XLM, HBAR always, or for other currencies when confirmed */}
                      {paymentData.payin_extra_id && requiresExtraId(paymentData.pay_currency) && (
                        ['XRP', 'XLM', 'HBAR'].includes(paymentData.pay_currency.toUpperCase()) ||
                        (!['XRP', 'XLM', 'HBAR'].includes(paymentData.pay_currency.toUpperCase()) && extraIdConfirmed)
                      ) && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div className="flex-1">
                              <Label className="text-sm font-semibold text-yellow-900 block">
                                {getExtraIdLabel(paymentData.pay_currency)} Required
                              </Label>
                              <p className="text-sm text-yellow-800 mt-1">
                                Include this {getExtraIdLabel(paymentData.pay_currency).toLowerCase()} or the payment may be lost.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Input
                              value={paymentData.payin_extra_id}
                              readOnly
                              className="font-mono text-sm bg-white border-yellow-300"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(paymentData.payin_extra_id!, getExtraIdLabel(paymentData.pay_currency))}
                              className="border-yellow-600 text-yellow-700 hover:bg-yellow-50"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-start gap-2">
                            <input
                              id="confirm-extra-id"
                              type="checkbox"
                              className="mt-1 h-4 w-4 text-[#7f5efd] border-[#7f5efd] rounded focus:ring-[#7f5efd] focus:ring-2 checked:bg-[#7f5efd] checked:border-[#7f5efd]"
                              checked={extraIdConfirmed}
                              onChange={(e) => setExtraIdConfirmed(e.target.checked)}
                            />
                            <label htmlFor="confirm-extra-id" className="text-sm text-yellow-800">
                              I will include the {getExtraIdLabel(paymentData.pay_currency).toLowerCase()} above in my wallet before sending
                            </label>
                          </div>
                          <p className="text-xs text-yellow-800 mt-1">
                            Tip: In many wallets (e.g., Trust Wallet), paste this under "{getExtraIdLabel(paymentData.pay_currency)}" or "Memo".
                          </p>
                        </div>
                      )}

                      {/* Change Currency button (compact) - positioned below QR code */}
                      {(currentStatus && !['confirmed', 'finished', 'sending'].includes(currentStatus.payment_status)) && (
                        <div className="flex justify-center">
                          <button
                            type="button"
                            className="h-8 px-3 text-xs font-semibold rounded-md bg-[#7f5efd] hover:bg-[#7c3aed] text-white shadow-sm transition-colors"
                            onClick={() => {
                              setPaymentData(null as any)
                              setPaymentStatus(null)
                              setQrCodeDataUrl('')
                              setExtraIdConfirmed(false)
                            }}
                          >
                            Change Currency
                          </button>
                        </div>
                      )}

                      {/* Amount */}
                      <div className="bg-gradient-to-r from-purple-50 to-purple-25 p-4 rounded-lg border border-purple-200 text-center">
                        <p className="text-sm text-gray-600 mb-1">Send exactly</p>
                        <p className="text-2xl font-bold text-[#7f5efd]">{formatAmountForDisplay(paymentData.pay_amount)} {paymentData.pay_currency.toUpperCase()}</p>
                      </div>

                      {/* Address */}
                      <div className="w-full bg-gradient-to-br from-purple-50 to-white p-5 rounded-xl border-2 border-purple-200">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Wallet Address</span>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm text-gray-600 mb-1">Send to this address</p>
                              <p className="text-sm font-mono break-all text-gray-900 leading-relaxed tracking-wide">
                                {paymentData.pay_address}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(paymentData.pay_address, 'Address')}
                              className="ml-3 border-[#7f5efd] text-[#7f5efd] hover:bg-purple-50"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>


                      {/* Instructions */}
                      <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-4">
                        <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
                          <Shield className="h-5 w-5 mr-2" />
                          Payment Instructions
                        </h4>
                        <ol className="text-sm text-purple-800 space-y-2 list-decimal list-inside">
                          <li>Send exactly <strong className="text-[#7f5efd]">{formatAmountForDisplay(paymentData.pay_amount)} {paymentData.pay_currency.toUpperCase()}</strong> to the address above</li>
                          <li>Do not send any other amount or currency</li>
                          <li>Payment will be confirmed automatically</li>
                          <li>You will be redirected once payment is complete</li>
                        </ol>
                      </div>
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
