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

interface PaymentStatus {
  id: string
  payment_id: string
  order_id: string
  status: string
  pay_currency: string
  pay_amount: number
  pay_address: string
  price_amount: number
  price_currency: string
  created_at: string
  updated_at: string
  tx_hash?: string
  customer_email?: string
}

const FIAT_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' }
]

const STATUS_CONFIG = {
  waiting: {
    title: 'Waiting for Payment',
    description: 'Send the exact amount to the address below',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: Clock,
    showSpinner: false
  },
  confirming: {
    title: 'Payment Received',
    description: 'Your payment is being confirmed on the blockchain',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: RefreshCw,
    showSpinner: true
  },
  confirmed: {
    title: 'Payment Confirmed',
    description: 'Your payment has been successfully processed',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: CheckCircle,
    showSpinner: false
  },
  failed: {
    title: 'Payment Failed',
    description: 'There was an issue with your payment',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: AlertCircle,
    showSpinner: false
  },
  expired: {
    title: 'Payment Expired',
    description: 'This payment has expired',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: AlertCircle,
    showSpinner: false
  }
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const linkId = params.id as string
  const statusCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null)
  const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyInfo[]>([])
  const [estimates, setEstimates] = useState<Record<string, EstimateData>>({})
  const [selectedCurrency, setSelectedCurrency] = useState<string>('')
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  
  const [loading, setLoading] = useState(true)
  const [estimatesLoading, setEstimatesLoading] = useState(false)
  const [creatingPayment, setCreatingPayment] = useState(false)
  const [error, setError] = useState<string>('')
  
  // Optimized status checking states
  const [statusChecking, setStatusChecking] = useState(false)
  const [lastStatusCheck, setLastStatusCheck] = useState<Date | null>(null)
  const [statusCheckCount, setStatusCheckCount] = useState(0)
  const [pollingInterval, setPollingInterval] = useState(5000) // Start with 5 seconds
  const [consecutiveFailures, setConsecutiveFailures] = useState(0)
  const [isPollingActive, setIsPollingActive] = useState(false)
  const [lastSuccessfulCheck, setLastSuccessfulCheck] = useState<Date | null>(null)

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

  // Adaptive polling intervals based on payment status and time elapsed
  const getAdaptivePollingInterval = (status: string, timeElapsed: number): number => {
    // If payment is confirmed or failed, stop polling
    if (['confirmed', 'failed', 'expired'].includes(status)) {
      return 0 // Stop polling
    }
    
    // For waiting status, poll more frequently initially
    if (status === 'waiting') {
      if (timeElapsed < 60000) return 3000 // First minute: every 3 seconds
      if (timeElapsed < 300000) return 5000 // Next 4 minutes: every 5 seconds
      if (timeElapsed < 900000) return 10000 // Next 10 minutes: every 10 seconds
      return 15000 // After 15 minutes: every 15 seconds
    }
    
    // For confirming status, poll more frequently
    if (status === 'confirming') {
      if (timeElapsed < 120000) return 2000 // First 2 minutes: every 2 seconds
      if (timeElapsed < 600000) return 5000 // Next 8 minutes: every 5 seconds
      return 10000 // After 10 minutes: every 10 seconds
    }
    
    // Default fallback
    return 5000
  }

  // Optimized status checking with exponential backoff on failures
  const checkPaymentStatusOptimized = async () => {
    if (!linkId || statusChecking || !isPollingActive) return

    try {
      setStatusChecking(true)
      setLastStatusCheck(new Date())
      setStatusCheckCount(prev => prev + 1)

      console.log(`🔍 Checking payment status (check #${statusCheckCount + 1}, interval: ${pollingInterval}ms)`)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(`/api/payments/${linkId}/status`, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success && data.payment) {
        const newStatus = data.payment.status
        const previousStatus = paymentStatus?.status

        console.log(`📊 Payment status: ${previousStatus} → ${newStatus}`)

        setPaymentStatus(data.payment)
        setConsecutiveFailures(0) // Reset failure counter on success
        setLastSuccessfulCheck(new Date())

        // Calculate time elapsed since payment creation
        const paymentCreated = paymentData?.created_at ? new Date(paymentData.created_at) : new Date()
        const timeElapsed = Date.now() - paymentCreated.getTime()

        // Update polling interval based on status and time
        const newInterval = getAdaptivePollingInterval(newStatus, timeElapsed)
        if (newInterval !== pollingInterval) {
          console.log(`🔄 Updating polling interval: ${pollingInterval}ms → ${newInterval}ms`)
          setPollingInterval(newInterval)
        }

        // Show status change notifications
        if (previousStatus !== newStatus) {
          switch (newStatus) {
            case 'confirming':
              toast.success('Payment received! Confirming on blockchain...')
              break
            case 'confirmed':
              toast.success('Payment confirmed successfully!')
              setIsPollingActive(false) // Stop polling
              // Redirect to success page after a short delay
              setTimeout(() => {
                router.push(`/payment/success/${linkId}?payment_id=${data.payment.id}`)
              }, 2000)
              break
            case 'failed':
              toast.error('Payment failed. Please try again.')
              setIsPollingActive(false) // Stop polling
              break
            case 'expired':
              toast.error('Payment expired. Please create a new payment.')
              setIsPollingActive(false) // Stop polling
              break
          }
        }

        // Stop checking if payment is in final state
        if (['confirmed', 'failed', 'expired'].includes(newStatus)) {
          setIsPollingActive(false)
        }
      } else {
        throw new Error(data.error || 'Invalid response from status API')
      }

    } catch (error) {
      console.error('❌ Error checking payment status:', error)
      
      const newFailureCount = consecutiveFailures + 1
      setConsecutiveFailures(newFailureCount)
      
      // Implement exponential backoff on failures
      if (newFailureCount >= 3) {
        const backoffInterval = Math.min(pollingInterval * Math.pow(2, newFailureCount - 3), 30000)
        console.warn(`⚠️ ${newFailureCount} consecutive failures, backing off to ${backoffInterval}ms`)
        setPollingInterval(backoffInterval)
      }
      
      // Stop polling after too many failures
      if (newFailureCount >= 10) {
        console.error('❌ Too many consecutive failures, stopping status polling')
        setIsPollingActive(false)
        toast.error('Unable to check payment status. Please refresh the page.')
      }
      
    } finally {
      setStatusChecking(false)
    }
  }

  // Optimized status checking starter
  const startOptimizedStatusChecking = () => {
    console.log('🔄 Starting optimized real-time status checking for payment link:', linkId)
    
    // Clear any existing interval
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current)
      statusCheckIntervalRef.current = null
    }

    setIsPollingActive(true)
    setConsecutiveFailures(0)
    setPollingInterval(5000) // Start with 5 seconds

    // Initial status check
    checkPaymentStatusOptimized()
  }

  // Dynamic interval management
  useEffect(() => {
    if (!isPollingActive || pollingInterval === 0) {
      // Clear interval if polling is inactive or interval is 0
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current)
        statusCheckIntervalRef.current = null
      }
      return
    }

    // Set up new interval with current polling interval
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current)
    }

    statusCheckIntervalRef.current = setInterval(() => {
      checkPaymentStatusOptimized()
    }, pollingInterval)

    // Cleanup function
    return () => {
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current)
        statusCheckIntervalRef.current = null
      }
    }
  }, [pollingInterval, isPollingActive, linkId])

  // Page visibility optimization - pause polling when page is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('📱 Page hidden, pausing status polling')
        setIsPollingActive(false)
      } else {
        console.log('📱 Page visible, resuming status polling')
        if (paymentData && !['confirmed', 'failed', 'expired'].includes(paymentStatus?.status || '')) {
          setIsPollingActive(true)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [paymentData, paymentStatus])

  // Connection status monitoring
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Connection restored, resuming status polling')
      if (paymentData && !['confirmed', 'failed', 'expired'].includes(paymentStatus?.status || '')) {
        setIsPollingActive(true)
        setConsecutiveFailures(0) // Reset failures on reconnection
      }
    }

    const handleOffline = () => {
      console.log('🌐 Connection lost, pausing status polling')
      setIsPollingActive(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [paymentData, paymentStatus])

  // Replace the existing useEffect that starts status checking
  useEffect(() => {
    if (paymentData && linkId) {
      startOptimizedStatusChecking()
    }

    // Cleanup on unmount
    return () => {
      setIsPollingActive(false)
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current)
        statusCheckIntervalRef.current = null
      }
    }
  }, [paymentData, linkId])

  const loadPaymentLink = async () => {
    try {
      setLoading(true)
      console.log('🔄 Loading payment link:', linkId)

      const { data: paymentLinkData, error: linkError } = await supabase
        .from('payment_links')
        .select(`
          id,
          link_id,
          title,
          description,
          amount,
          base_amount,
          currency,
          accepted_cryptos,
          expires_at,
          max_uses,
          charge_customer_fee,
          auto_convert_enabled,
          fee_percentage,
          tax_enabled,
          tax_rates,
          tax_amount,
          subtotal_with_tax,
          merchant:merchants(
            business_name,
            charge_customer_fee,
            auto_convert_enabled
          )
        `)
        .eq('link_id', linkId)
        .single()

      if (linkError) {
        console.error('Supabase error:', linkError)
        throw new Error('Payment link not found')
      }

      if (!paymentLinkData) {
        throw new Error('Payment link not found')
      }

      console.log('📄 Raw payment link data:', paymentLinkData)

      // Transform the data to match our interface
      const transformedData: PaymentLink = {
        id: paymentLinkData.id,
        link_id: paymentLinkData.link_id,
        title: paymentLinkData.title,
        description: paymentLinkData.description,
        amount: paymentLinkData.amount,
        base_amount: paymentLinkData.base_amount || paymentLinkData.amount,
        currency: paymentLinkData.currency,
        accepted_cryptos: paymentLinkData.accepted_cryptos || [],
        expires_at: paymentLinkData.expires_at,
        max_uses: paymentLinkData.max_uses,
        charge_customer_fee: paymentLinkData.charge_customer_fee,
        auto_convert_enabled: paymentLinkData.auto_convert_enabled,
        fee_percentage: paymentLinkData.fee_percentage || 0.01,
        tax_enabled: paymentLinkData.tax_enabled || false,
        tax_rates: paymentLinkData.tax_rates || [],
        tax_amount: paymentLinkData.tax_amount || 0,
        subtotal_with_tax: paymentLinkData.subtotal_with_tax || paymentLinkData.amount,
        merchant: {
          business_name: Array.isArray(paymentLinkData.merchant) 
            ? (paymentLinkData.merchant[0] as any)?.business_name || 'Unknown Business'
            : (paymentLinkData.merchant as any)?.business_name || 'Unknown Business',
          charge_customer_fee: Array.isArray(paymentLinkData.merchant) 
            ? (paymentLinkData.merchant[0] as any)?.charge_customer_fee || false
            : (paymentLinkData.merchant as any)?.charge_customer_fee || false,
          auto_convert_enabled: Array.isArray(paymentLinkData.merchant) 
            ? (paymentLinkData.merchant[0] as any)?.auto_convert_enabled || false
            : (paymentLinkData.merchant as any)?.auto_convert_enabled || false
        }
      }

      setPaymentLink(transformedData)
      
      // Load currencies with the accepted cryptos from the payment link
      await loadCurrencies(transformedData.accepted_cryptos)

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

      // Enhanced currency filtering: include base currencies AND their stable coins
      const expandedAcceptedCryptos = [...acceptedCryptos]
      
      // Updated stable coin mappings - ONLY USDT/USDC variations allowed
      const STABLE_COIN_MAPPING: Record<string, string[]> = {
        'ETH': ['USDT', 'USDTERC20', 'USDC'], // Ethereum network - only USDT/USDC
        'BNB': ['USDTBSC', 'USDCBSC'], // BSC network - only USDT/USDC
        'SOL': ['USDTSOL', 'USDCSOL'], // Solana network - only USDT/USDC
        'MATIC': ['USDTMATIC', 'USDCMATIC'], // Polygon network - only USDT/USDC
        'TRX': ['USDTTRC20'], // Tron network - only USDT (no USDC on Tron in NOWPayments)
        'TON': ['USDTTON'], // TON network - only USDT
        'ALGO': ['USDCALGO'], // Algorand network - only USDC
        'ARB': ['USDTARB', 'USDCARB'], // Arbitrum network - only USDT/USDC
        'OP': ['USDTOP', 'USDCOP'], // Optimism network - only USDT/USDC
        'BASE': ['USDCBASE'], // Base network - only USDC
        // Networks with no USDT/USDC support
        'NEAR': [], 
        'DOT': [], 
        'XLM': [], 
        'AVAX': [], 
        'BTC': [], 
        'LTC': [], 
        'ADA': [], 
        'XRP': []
      }
      
      // For each accepted crypto, find its related stable coins (USDT/USDC only)
      acceptedCryptos.forEach(crypto => {
        console.log(`🔍 Researching USDT/USDC stable coins for: ${crypto}`)
        
        const cryptoUpper = crypto.toUpperCase()
        const relatedStableCoins = STABLE_COIN_MAPPING[cryptoUpper] || []
        
        // Find stable coins that actually exist in NOWPayments
        const availableStableCoins = data.currencies.filter((currency: CurrencyInfo) => {
          const currencyCode = currency.code.toUpperCase()
          return relatedStableCoins.includes(currencyCode) && currency.enabled
        })
        
        // Add found stable coins
        availableStableCoins.forEach((stableCoin: CurrencyInfo) => {
          if (!expandedAcceptedCryptos.includes(stableCoin.code)) {
            console.log(`✅ Found USDT/USDC stable coin: ${stableCoin.code} (for ${crypto})`)
            expandedAcceptedCryptos.push(stableCoin.code)
          }
        })
      })

      console.log('📈 Expanded accepted cryptos (with USDT/USDC only):', expandedAcceptedCryptos)

      // Filter to only accepted cryptocurrencies (including base currencies)
      const filtered = data.currencies.filter((currency: CurrencyInfo) => {
        const currencyCodeUpper = currency.code.toUpperCase()
        const isAccepted = expandedAcceptedCryptos.some(acceptedCode => 
          acceptedCode.toUpperCase() === currencyCodeUpper
        )
        const isEnabled = currency.enabled
        
        if (isAccepted) {
          console.log(`🔍 Currency ${currency.code}: accepted=${isAccepted}, enabled=${isEnabled}`)
        }
        
        return isAccepted && isEnabled
      })

      console.log(`✅ Loaded ${filtered.length} available currencies:`, filtered.map((c: CurrencyInfo) => c.code))
      
      // Smart sorting: base currencies first, then stable coins
      const sortedCurrencies = filtered.sort((a: CurrencyInfo, b: CurrencyInfo) => {
        // Define base currency priority order
        const baseCurrencyOrder = ['BTC', 'ETH', 'SOL', 'BNB', 'MATIC', 'AVAX', 'TRX', 'ADA', 'LTC', 'XRP', 'DOT', 'TON', 'XLM', 'NEAR', 'ALGO', 'ARB', 'OP', 'BASE']
        
        // Check if currencies are base currencies
        const aIsBase = baseCurrencyOrder.includes(a.code.toUpperCase())
        const bIsBase = baseCurrencyOrder.includes(b.code.toUpperCase())
        
        // Base currencies come first
        if (aIsBase && !bIsBase) return -1
        if (!aIsBase && bIsBase) return 1
        
        // Among base currencies, sort by priority order
        if (aIsBase && bIsBase) {
          const aIndex = baseCurrencyOrder.indexOf(a.code.toUpperCase())
          const bIndex = baseCurrencyOrder.indexOf(b.code.toUpperCase())
          return aIndex - bIndex
        }
        
        // Among stable coins, sort alphabetically
        return a.code.localeCompare(b.code)
      })
      
      setAvailableCurrencies(sortedCurrencies)

      // Auto-select first currency if available
      if (sortedCurrencies.length > 0 && !selectedCurrency) {
        setSelectedCurrency(sortedCurrencies[0].code)
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
      console.log('💱 Loading estimates for', availableCurrencies.length, 'currencies')

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

        // Filter out currencies that don't have estimates
        const currenciesWithEstimates = availableCurrencies.filter(currency => 
          estimatesMap[currency.code.toUpperCase()]
        )
        
        if (currenciesWithEstimates.length !== availableCurrencies.length) {
          console.log(`🔧 Filtered out ${availableCurrencies.length - currenciesWithEstimates.length} currencies without estimates`)
          setAvailableCurrencies(currenciesWithEstimates)
          
          // Update selected currency if it was filtered out
          if (selectedCurrency && !estimatesMap[selectedCurrency.toUpperCase()]) {
            setSelectedCurrency(currenciesWithEstimates.length > 0 ? currenciesWithEstimates[0].code : '')
          }
        }
      } else {
        console.error('Failed to load estimates:', data.error)
      }
    } catch (error) {
      console.error('Error loading estimates:', error)
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
          price_amount: feeBreakdown ? feeBreakdown.customerTotal : paymentLink.amount,
          price_currency: paymentLink.currency.toLowerCase(),
          pay_currency: selectedCurrency.toLowerCase(),
          order_id: `cryptrac_${paymentLink.link_id}_${Date.now()}`,
          order_description: paymentLink.title,
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

      // Generate QR code
      if (data.payment.pay_address) {
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
      }

    } catch (error) {
      console.error('Error creating payment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create payment')
    } finally {
      setCreatingPayment(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
        toast.success('Copied!', {
          duration: 2000,
          position: 'top-center'
        })
      } else {
        // Fallback for older browsers or insecure contexts
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        textArea.remove()
        toast.success('Copied!', {
          duration: 2000,
          position: 'top-center'
        })
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      toast.error('Failed to copy to clipboard')
    }
  }

  const formatCurrency = (amount: number, currencyCode: string) => {
    const currency = FIAT_CURRENCIES.find(c => c.code === currencyCode)
    if (currency) {
      return `${currency.symbol}${amount.toFixed(2)}`
    }
    return `${amount.toFixed(2)} ${currencyCode}`
  }

  const formatCrypto = (amount: number, currencyCode: string, decimals: number = 8) => {
    return `${amount.toFixed(decimals)} ${currencyCode}`
  }

  // FIXED: getBlockExplorerUrl function with proper null handling
  const getBlockExplorerUrl = (txHash: string, currency: string): string | null => {
    const currencyUpper = currency.toUpperCase()
    
    if (currencyUpper === 'BTC') {
      return `https://blockstream.info/tx/${txHash}`
    } else if (currencyUpper === 'ETH' || currencyUpper.includes('ERC20') || currencyUpper.includes('USDT') || currencyUpper.includes('USDC')) {
      return `https://etherscan.io/tx/${txHash}`
    } else if (currencyUpper === 'LTC') {
      return `https://blockchair.com/litecoin/transaction/${txHash}`
    } else if (currencyUpper === 'SOL') {
      return `https://solscan.io/tx/${txHash}`
    } else if (currencyUpper === 'TRX' || currencyUpper.includes('TRC20')) {
      return `https://tronscan.org/#/transaction/${txHash}`
    } else if (currencyUpper === 'BNB' || currencyUpper.includes('BSC')) {
      return `https://bscscan.com/tx/${txHash}`
    } else if (currencyUpper === 'MATIC' || currencyUpper.includes('POLYGON')) {
      return `https://polygonscan.com/tx/${txHash}`
    }
    
    return null
  }

  // Calculate fee breakdown for display
  const calculateFeeBreakdown = () => {
    if (!paymentLink) return null

    const baseAmount = paymentLink.base_amount
    const taxAmount = paymentLink.tax_amount || 0
    const subtotalWithTax = paymentLink.subtotal_with_tax || baseAmount
    const feePercentage = paymentLink.fee_percentage || 0.01
    
    // Determine effective settings (payment link overrides or merchant defaults)
    const effectiveChargeCustomerFee = paymentLink.charge_customer_fee !== null 
      ? paymentLink.charge_customer_fee 
      : paymentLink.merchant.charge_customer_fee

    const effectiveAutoConvert = paymentLink.auto_convert_enabled !== null
      ? paymentLink.auto_convert_enabled
      : paymentLink.merchant.auto_convert_enabled

    // Calculate fee amount
    const feeAmount = subtotalWithTax * feePercentage

    // Calculate totals based on who pays the fee
    const customerTotal = effectiveChargeCustomerFee ? subtotalWithTax + feeAmount : subtotalWithTax
    const merchantReceives = effectiveChargeCustomerFee ? subtotalWithTax : subtotalWithTax - feeAmount

    return {
      baseAmount,
      taxAmount,
      subtotalWithTax,
      feeAmount,
      feePercentage: feePercentage * 100,
      customerTotal,
      merchantReceives,
      effectiveChargeCustomerFee,
      effectiveAutoConvert
    }
  }

  // Status indicator component for debugging (optional)
  const StatusPollingIndicator = () => {
    if (!isPollingActive) return null
    
    return (
      <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm shadow-lg">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span>Checking status every {pollingInterval / 1000}s</span>
        </div>
        {consecutiveFailures > 0 && (
          <div className="text-xs text-blue-200 mt-1">
            {consecutiveFailures} consecutive failures
          </div>
        )}
      </div>
    )
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
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Payment Link Not Found</h2>
              <p className="text-gray-600 mb-4">
                {error || "The payment link you're looking for doesn't exist or you don't have permission to view it."}
              </p>
              <Button onClick={() => router.push('/')}>
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const feeBreakdown = calculateFeeBreakdown()
  const currentStatus = paymentStatus?.status || 'waiting'
  const statusConfig = STATUS_CONFIG[currentStatus as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.waiting
  const StatusIcon = statusConfig.icon

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{paymentLink.title}</h1>
          {paymentLink.description && (
            <p className="text-gray-600">{paymentLink.description}</p>
          )}
          
          {/* Simplified Payment Amount with Fee Breakdown */}
          <div className="mt-6 bg-white rounded-lg p-6 shadow-sm border">
            {feeBreakdown && (paymentLink.tax_enabled || (feeBreakdown.effectiveChargeCustomerFee && feeBreakdown.feeAmount > 0)) ? (
              <div className="space-y-3">
                {/* Base Amount */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Base Amount:</span>
                  <span className="font-medium">
                    {formatCurrency(feeBreakdown.baseAmount, paymentLink.currency)}
                  </span>
                </div>
                
                {/* Individual Tax Rates */}
                {paymentLink.tax_enabled && paymentLink.tax_rates.map((taxRate, index) => {
                  // Use the actual tax amount from the payment link to avoid rounding discrepancies
                  const totalTaxPercentage = paymentLink.tax_rates.reduce((sum, rate) => sum + rate.percentage, 0)
                  const taxAmount = totalTaxPercentage > 0 ? (feeBreakdown.taxAmount * taxRate.percentage) / totalTaxPercentage : 0
                  return (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        {taxRate.label} ({taxRate.percentage}%):
                      </span>
                      <span className="text-gray-600">
                        {formatCurrency(taxAmount, paymentLink.currency)}
                      </span>
                    </div>
                  );
                })}
                
                {/* Total Tax */}
                {paymentLink.tax_enabled && feeBreakdown.taxAmount > 0 && (
                  <div className="flex justify-between items-center text-sm border-t pt-2">
                    <span className="text-gray-600">Total Tax:</span>
                    <span className="font-medium text-gray-700">
                      {formatCurrency(feeBreakdown.taxAmount, paymentLink.currency)}
                    </span>
                  </div>
                )}

                {/* Subtotal with Tax */}
                {paymentLink.tax_enabled && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal with Tax:</span>
                    <span className="font-medium">
                      {formatCurrency(feeBreakdown.subtotalWithTax, paymentLink.currency)}
                    </span>
                  </div>
                )}

                {/* Gateway Fee - Only show if customer pays the fee */}
                {feeBreakdown.effectiveChargeCustomerFee && feeBreakdown.feeAmount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      Gateway Fee ({feeBreakdown.feePercentage.toFixed(1)}%):
                    </span>
                    <span className="text-gray-600">
                      +{formatCurrency(feeBreakdown.feeAmount, paymentLink.currency)}
                    </span>
                  </div>
                )}

                {/* Customer Pays Total */}
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-lg font-medium">You Pay:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(feeBreakdown.customerTotal, paymentLink.currency)}
                  </span>
                </div>

                {/* Merchant Receives (for transparency) - Only show if customer doesn't pay fee */}
                {!feeBreakdown.effectiveChargeCustomerFee && feeBreakdown.feeAmount > 0 && (
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Merchant receives:</span>
                    <span>{formatCurrency(feeBreakdown.merchantReceives, paymentLink.currency)}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(paymentLink.amount, paymentLink.currency)}
                </p>
              </div>
            )}
            
            <p className="text-sm text-gray-500 mt-4 text-center">
              Payment to {paymentLink.merchant.business_name}
            </p>
          </div>
        </div>

        {!paymentData ? (
          <>
            {/* Cryptocurrency Selection */}
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
                ) : availableCurrencies.length > 0 ? (
                  <div className="grid gap-3">
                    {availableCurrencies.map((currency) => {
                      const estimate = estimates[currency.code.toUpperCase()]
                      const isSelected = selectedCurrency === currency.code
                      
                      return (
                        <div
                          key={currency.code}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedCurrency(currency.code)}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium">
                                  {currency.symbol || currency.code.substring(0, 2)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium">{currency.display_name || currency.name}</p>
                                <p className="text-sm text-gray-500">{currency.code}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              {estimate ? (
                                <>
                                  <p className="font-medium">
                                    {formatCrypto(estimate.estimated_amount, currency.code, currency.decimals)}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    ≈ {formatCurrency(estimate.fiat_equivalent || estimate.amount_from, estimate.currency_from.toUpperCase())}
                                  </p>
                                </>
                              ) : (
                                <p className="text-sm text-gray-400">Loading...</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No cryptocurrencies available</p>
                  </div>
                )}

                {selectedCurrency && availableCurrencies.length > 0 && (
                  <div className="mt-6">
                    <Button 
                      onClick={createPayment}
                      disabled={creatingPayment || !selectedCurrency}
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
                          Continue with {selectedCurrency}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Payment Status */}
            <Card className={`mb-6 ${statusConfig.borderColor} border-2`}>
              <CardContent className={`pt-6 ${statusConfig.bgColor}`}>
                <div className="flex items-center justify-center mb-4">
                  <div className={`p-3 rounded-full ${statusConfig.bgColor}`}>
                    <StatusIcon className={`h-8 w-8 ${statusConfig.color} ${statusConfig.showSpinner ? 'animate-spin' : ''}`} />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className={`text-xl font-semibold ${statusConfig.color} mb-2`}>
                    {statusConfig.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {statusConfig.description}
                  </p>
                  
                  {paymentStatus?.tx_hash && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">Transaction Hash:</p>
                      <div className="flex items-center justify-center space-x-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {paymentStatus.tx_hash.substring(0, 20)}...
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(paymentStatus.tx_hash!)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        {/* FIXED: Proper null handling for getBlockExplorerUrl */}
                        {(() => {
                          const explorerUrl = getBlockExplorerUrl(paymentStatus.tx_hash, paymentStatus.pay_currency)
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
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Details */}
            {currentStatus === 'waiting' && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                  <p className="text-sm text-gray-600">
                    Send exactly {formatCrypto(paymentData.pay_amount, paymentData.pay_currency)} to the address below
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Amount */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Amount to Send</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input
                          value={formatCrypto(paymentData.pay_amount, paymentData.pay_currency)}
                          readOnly
                          className="font-mono"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(paymentData.pay_amount.toString())}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Payment Address</Label>
                      <div className="flex items-center space-x-2 mt-1">
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
                        <div className="mt-2 inline-block p-4 bg-white rounded-lg border">
                          <img 
                            src={qrCodeDataUrl} 
                            alt="Payment QR Code" 
                            className="w-48 h-48 mx-auto"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Scan with your crypto wallet
                        </p>
                      </div>
                    )}

                    {/* Payment Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-900 mb-1">Important:</p>
                          <ul className="text-blue-800 space-y-1">
                            <li>• Send exactly the amount shown above</li>
                            <li>• Use the {paymentData.pay_currency} network only</li>
                            <li>• Payment will be confirmed automatically</li>
                            <li>• Do not send from an exchange directly</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Status Polling Indicator */}
        <StatusPollingIndicator />
      </div>
    </div>
  )
}

