'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Badge } from '@/app/components/ui/badge'
import { Separator } from '@/app/components/ui/separator'
import { Copy, QrCode, ExternalLink, Loader2, AlertCircle, CheckCircle, Clock, ArrowRight, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
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
  merchant: {
    business_name: string
    charge_customer_fee: boolean
    auto_convert_enabled: boolean
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

interface EstimateData {
  currency_from: string
  currency_to: string
  amount_from: number
  estimated_amount: number
  fee_amount: number
  fee_percentage: number
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
  if (['ETH', 'USDT', 'USDC', 'USDTERC20'].includes(currency_upper)) {
    return `https://etherscan.io/tx/${txHash}`
  }
  
  // BSC and BEP-20 tokens
  if (['BNB', 'BNBBSC', 'BSC', 'USDTBSC', 'USDCBSC'].includes(currency_upper)) {
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
  if (['TRX', 'USDTTRC20'].includes(currency_upper)) {
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
  if (['BASE', 'USDCBASE'].includes(currency_upper)) {
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
  const id = params?.id as string
  
  // State management
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null)
  const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyInfo[]>([])
  const [selectedCurrency, setSelectedCurrency] = useState<string>('')
  const [estimates, setEstimates] = useState<EstimateData[]>([])
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [estimatesLoading, setEstimatesLoading] = useState(false)
  const [creatingPayment, setCreatingPayment] = useState(false)
  const [error, setError] = useState<string>('')
  
  // Status monitoring state
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [monitoringInterval, setMonitoringInterval] = useState(5000) // Start with 5 seconds
  const [consecutiveFailures, setConsecutiveFailures] = useState(0)
  const [lastStatusCheck, setLastStatusCheck] = useState<number>(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const visibilityRef = useRef<boolean>(true)
  
  // Fee calculation
  const feeBreakdown = paymentLink ? calculateFeeBreakdown(paymentLink) : null

  function calculateFeeBreakdown(link: PaymentLink): FeeBreakdown {
    const baseAmount = link.base_amount
    const taxAmount = link.tax_amount
    const subtotalWithTax = link.subtotal_with_tax
    
    // Platform fee calculation
    const platformFeeRate = link.merchant.charge_customer_fee ? link.fee_percentage : 0
    const platformFee = subtotalWithTax * (platformFeeRate / 100)
    
    const customerTotal = subtotalWithTax + platformFee
    const merchantReceives = subtotalWithTax - (link.merchant.charge_customer_fee ? 0 : subtotalWithTax * (link.fee_percentage / 100))
    
    return {
      baseAmount,
      taxAmount,
      subtotalWithTax,
      platformFee,
      customerTotal,
      merchantReceives
    }
  }

  // FIXED: Payment Status Monitoring Function
  const checkPaymentStatusOptimized = async () => {
    if (!paymentData?.payment_id || !visibilityRef.current) {
      return
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      // FIXED: Use correct endpoint - /api/payments/[id]/status instead of /api/nowpayments/payment-status
      const response = await fetch(`/api/payments/${paymentData.payment_id}/status`, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.payment) {
        console.log('📊 Payment status update:', data.payment.payment_status)
        setPaymentStatus(data.payment)
        setLastStatusCheck(Date.now())
        setConsecutiveFailures(0) // Reset failure count on success
        
        // Adaptive interval based on status and time elapsed
        const status = data.payment.payment_status
        const timeElapsed = Date.now() - new Date(paymentData.created_at).getTime()
        
        let newInterval = 5000 // Default 5 seconds
        
        if (status === 'waiting') {
          // Waiting status: start fast, then slow down
          if (timeElapsed < 60000) { // First minute
            newInterval = 3000 // 3 seconds
          } else if (timeElapsed < 300000) { // First 5 minutes
            newInterval = 5000 // 5 seconds
          } else if (timeElapsed < 900000) { // First 15 minutes
            newInterval = 10000 // 10 seconds
          } else {
            newInterval = 15000 // 15 seconds after 15 minutes
          }
        } else if (status === 'confirming') {
          // Confirming status: check more frequently
          if (timeElapsed < 120000) { // First 2 minutes
            newInterval = 2000 // 2 seconds
          } else if (timeElapsed < 600000) { // First 10 minutes
            newInterval = 5000 // 5 seconds
          } else {
            newInterval = 10000 // 10 seconds after 10 minutes
          }
        } else if (['finished', 'partially_paid', 'failed', 'refunded', 'expired'].includes(status)) {
          // Final states: stop monitoring
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          setIsMonitoring(false)
          
          // Redirect to success page for completed payments
          if (status === 'finished') {
            setTimeout(() => {
              router.push(`/payment/success/${paymentData.payment_id}`)
            }, 2000)
          }
          
          return
        }
        
        // Update interval if it changed significantly
        if (Math.abs(newInterval - monitoringInterval) > 1000) {
          setMonitoringInterval(newInterval)
          
          // Restart interval with new timing
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = setInterval(checkPaymentStatusOptimized, newInterval)
          }
        }
        
      } else {
        throw new Error(data.error || 'Failed to get payment status')
      }
      
    } catch (error) {
      console.error('Error checking payment status:', error)
      
      // Exponential backoff on consecutive failures
      const newFailureCount = consecutiveFailures + 1
      setConsecutiveFailures(newFailureCount)
      
      // Increase interval on failures, max 30 seconds
      const backoffInterval = Math.min(5000 * Math.pow(1.5, newFailureCount), 30000)
      
      if (Math.abs(backoffInterval - monitoringInterval) > 1000) {
        setMonitoringInterval(backoffInterval)
        
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = setInterval(checkPaymentStatusOptimized, backoffInterval)
        }
      }
    }
  }

  // Start monitoring payment status
  const startStatusMonitoring = () => {
    if (isMonitoring || !paymentData?.payment_id) return
    
    console.log('🔄 Starting optimized payment status monitoring...')
    setIsMonitoring(true)
    setMonitoringInterval(5000) // Start with 5 seconds
    setConsecutiveFailures(0)
    
    // Initial check
    checkPaymentStatusOptimized()
    
    // Set up interval
    intervalRef.current = setInterval(checkPaymentStatusOptimized, 5000)
  }

  // Stop monitoring
  const stopStatusMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsMonitoring(false)
    console.log('⏹️ Stopped payment status monitoring')
  }

  // Page visibility handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden
      visibilityRef.current = isVisible
      
      if (isVisible && isMonitoring && paymentData?.payment_id) {
        console.log('👁️ Page visible - resuming status monitoring')
        // Resume monitoring when page becomes visible
        if (!intervalRef.current) {
          intervalRef.current = setInterval(checkPaymentStatusOptimized, monitoringInterval)
        }
      } else if (!isVisible && intervalRef.current) {
        console.log('🙈 Page hidden - pausing status monitoring')
        // Pause monitoring when page is hidden
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isMonitoring, paymentData?.payment_id, monitoringInterval])

  // Connection monitoring
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Connection restored - resuming monitoring')
      if (isMonitoring && paymentData?.payment_id && visibilityRef.current && !intervalRef.current) {
        intervalRef.current = setInterval(checkPaymentStatusOptimized, monitoringInterval)
      }
    }

    const handleOffline = () => {
      console.log('📡 Connection lost - pausing monitoring')
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isMonitoring, paymentData?.payment_id, monitoringInterval])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStatusMonitoring()
    }
  }, [])

  // Start monitoring when payment is created
  useEffect(() => {
    if (paymentData && !isMonitoring) {
      startStatusMonitoring()
    }
  }, [paymentData])

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

      // Filter currencies based on accepted cryptos
      const filtered = data.currencies.filter((currency: CurrencyInfo) => {
        return currency.enabled && acceptedCryptos.some(crypto => 
          crypto.toLowerCase() === currency.code.toLowerCase()
        )
      })

      // Sort currencies by priority
      const priorityOrder = ['BTC', 'ETH', 'BNB', 'SOL', 'MATIC', 'TRX', 'TON', 'AVAX', 'NEAR']
      const sorted = filtered.sort((a: CurrencyInfo, b: CurrencyInfo) => {
        const aIndex = priorityOrder.indexOf(a.code.toUpperCase())
        const bIndex = priorityOrder.indexOf(b.code.toUpperCase())
        
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex
        }
        if (aIndex !== -1) return -1
        if (bIndex !== -1) return 1
        return a.code.localeCompare(b.code)
      })

      console.log('✅ Available currencies:', sorted.map((c: CurrencyInfo) => c.code))
      setAvailableCurrencies(sorted)

    } catch (error) {
      console.error('Error loading currencies:', error)
      setError('Failed to load available currencies')
    }
  }

  // FIXED: Sequential Estimate Loading Function
  const loadEstimates = async () => {
    if (!paymentLink || availableCurrencies.length === 0) return

    try {
      setEstimatesLoading(true)
      console.log('📊 Loading payment estimates sequentially...')

      const amount = feeBreakdown ? feeBreakdown.customerTotal : paymentLink.amount
      const newEstimates: EstimateData[] = []
      
      // FIXED: Load estimates sequentially with delays to avoid rate limiting
      for (let i = 0; i < availableCurrencies.length; i++) {
        const currency = availableCurrencies[i]
        
        try {
          console.log(`📊 Loading estimate ${i + 1}/${availableCurrencies.length}: ${currency.code}`)
          
          const response = await fetch('/api/nowpayments/estimate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              currency_from: paymentLink.currency.toLowerCase(),
              currency_to: currency.code.toLowerCase(),
              amount: amount,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              newEstimates.push({
                currency_from: paymentLink.currency,
                currency_to: currency.code,
                amount_from: amount,
                estimated_amount: data.estimate.estimated_amount,
                fee_amount: data.estimate.fee_amount || 0,
                fee_percentage: data.estimate.fee_percentage || 0
              })
              console.log(`✅ Estimate loaded for ${currency.code}: ${data.estimate.estimated_amount}`)
            } else {
              console.warn(`⚠️ Failed to get estimate for ${currency.code}:`, data.error)
            }
          } else if (response.status === 429) {
            console.warn(`⚠️ Rate limited for ${currency.code}, skipping`)
            // Add longer delay after rate limit
            await new Promise(resolve => setTimeout(resolve, 2000))
          } else {
            console.warn(`⚠️ HTTP ${response.status} for ${currency.code}`)
          }
          
        } catch (error) {
          console.error(`❌ Error loading estimate for ${currency.code}:`, error)
        }
        
        // Add delay between requests to avoid rate limiting (except for last request)
        if (i < availableCurrencies.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500)) // 500ms delay between requests
        }
      }

      setEstimates(newEstimates)
      console.log(`✅ Loaded ${newEstimates.length} estimates`)
      
    } catch (error) {
      console.error('❌ Error loading estimates:', error)
    } finally {
      setEstimatesLoading(false)
    }
  }

  // Load estimates when currencies are available
  useEffect(() => {
    if (paymentLink && availableCurrencies.length > 0) {
      loadEstimates()
    }
  }, [paymentLink, availableCurrencies])

  const createPayment = async () => {
    if (!selectedCurrency || !paymentLink) return

    try {
      setCreatingPayment(true)
      console.log('🔄 Creating payment for currency:', selectedCurrency)

      const amount = feeBreakdown ? feeBreakdown.customerTotal : paymentLink.amount

      const response = await fetch('/api/nowpayments/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_amount: amount,
          price_currency: paymentLink.currency,
          pay_currency: selectedCurrency,
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
      setPaymentData(data.payment)

      // Generate QR code for payment address
      if (data.payment.pay_address) {
        const qrDataUrl = await QRCode.toDataURL(data.payment.pay_address, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        setQrCodeDataUrl(qrDataUrl)
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
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!paymentLink) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Link Not Found</h1>
          <p className="text-gray-600">The payment link you're looking for doesn't exist or has expired.</p>
        </div>
      </div>
    )
  }

  const currentStatus = paymentStatus || paymentData

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{paymentLink.title}</h1>
          {paymentLink.description && (
            <p className="text-gray-600">{paymentLink.description}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            Powered by {paymentLink.merchant.business_name}
          </p>
        </div>

        {/* Payment Amount Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center">Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {feeBreakdown && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Amount:</span>
                  <span className="font-medium">${feeBreakdown.baseAmount.toFixed(2)} {paymentLink.currency.toUpperCase()}</span>
                </div>
                
                {paymentLink.tax_enabled && feeBreakdown.taxAmount > 0 && (
                  <>
                    {paymentLink.tax_rates.map((rate, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">{rate.label} ({rate.percentage}%):</span>
                        <span>${(feeBreakdown.baseAmount * (rate.percentage / 100)).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax Total:</span>
                      <span>${feeBreakdown.taxAmount.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal with Tax:</span>
                      <span className="font-medium">${feeBreakdown.subtotalWithTax.toFixed(2)}</span>
                    </div>
                  </>
                )}
                
                {feeBreakdown.platformFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Processing Fee ({paymentLink.fee_percentage}%):</span>
                    <span>${feeBreakdown.platformFee.toFixed(2)}</span>
                  </div>
                )}
                
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span>${feeBreakdown.customerTotal.toFixed(2)} {paymentLink.currency.toUpperCase()}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {!paymentData ? (
          /* Currency Selection */
          <Card>
            <CardHeader>
              <CardTitle>Select Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {availableCurrencies.length === 0 ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading available currencies...</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {availableCurrencies.map((currency) => {
                    const estimate = estimates.find(e => e.currency_to === currency.code)
                    const isSelected = selectedCurrency === currency.code
                    
                    return (
                      <div
                        key={currency.code}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedCurrency(currency.code)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-500' 
                                : 'border-gray-300'
                            }`}>
                              {isSelected && (
                                <div className="w-full h-full rounded-full bg-white scale-50"></div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{currency.code.toUpperCase()}</div>
                              <div className="text-sm text-gray-500">{currency.name}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            {estimate ? (
                              <div className="font-medium">
                                {estimate.estimated_amount.toFixed(6)}
                              </div>
                            ) : (
                              <div>Calculating...</div>
                            )}
                            <div className="text-sm text-gray-500">{currency.code.toUpperCase()}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              
              {selectedCurrency && (
                <Button 
                  onClick={createPayment} 
                  disabled={creatingPayment}
                  className="w-full"
                  size="lg"
                >
                  {creatingPayment ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Payment...
                    </>
                  ) : (
                    <>
                      Continue with {selectedCurrency.toUpperCase()}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Payment Instructions */
          <div className="space-y-6">
            {/* Payment Status */}
            {currentStatus && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {getStatusIcon(currentStatus.payment_status)}
                    <span>Payment Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge className={`${getStatusColor(currentStatus.payment_status)} border`}>
                      {formatStatus(currentStatus.payment_status)}
                    </Badge>
                    {currentStatus.tx_hash && (
                      <>
                        {(() => {
                          const explorerUrl = getBlockExplorerUrl(currentStatus.tx_hash!, currentStatus.pay_currency)
                          return explorerUrl ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(explorerUrl, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          ) : null
                        })()}
                      </>
                    )}
                  </div>
                  
                  {currentStatus.actually_paid && (
                    <div className="mt-3 text-sm text-gray-600">
                      Amount Received: {currentStatus.actually_paid} {currentStatus.pay_currency.toUpperCase()}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Payment Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Send Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Amount */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Amount to Send</Label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Input
                      value={`${paymentData.pay_amount} ${paymentData.pay_currency.toUpperCase()}`}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(paymentData.pay_amount.toString(), 'Amount')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Payment Address</Label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Input
                      value={paymentData.pay_address}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(paymentData.pay_address, 'Address')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* QR Code */}
                {qrCodeDataUrl && (
                  <div className="text-center">
                    <Label className="text-sm font-medium text-gray-700">QR Code</Label>
                    <div className="mt-2 inline-block p-4 bg-white rounded-lg border">
                      <img 
                        src={qrCodeDataUrl} 
                        alt="Payment QR Code" 
                        className="w-48 h-48 mx-auto"
                      />
                    </div>
                  </div>
                )}

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Payment Instructions:</h4>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Send exactly <strong>{paymentData.pay_amount} {paymentData.pay_currency.toUpperCase()}</strong> to the address above</li>
                    <li>Do not send any other amount or currency</li>
                    <li>Payment will be confirmed automatically</li>
                    <li>You will be redirected once payment is complete</li>
                  </ol>
                </div>

                {/* Monitoring Status */}
                {isMonitoring && (
                  <div className="text-center text-sm text-gray-500">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Monitoring payment status (checking every {Math.round(monitoringInterval / 1000)}s)</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

