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
import { Copy, ExternalLink, Loader2, AlertCircle, CheckCircle, Clock, ArrowRight, RefreshCw, Shield, Zap, CreditCard, Filter, Globe, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import QRCode from 'qrcode'
import { groupCurrenciesByNetwork, getNetworkInfo, getCurrencyDisplayName, sortNetworksByPriority, NETWORKS } from '@/lib/crypto-networks'
import { requiresExtraId, getExtraIdLabel } from '@/lib/extra-id-validation'

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
  if (['ETH', 'USDT', 'USDC', 'USDTERC20', 'DAI', 'PYUSD'].includes(currency_upper)) {
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
  const id = params?.id as string
  
  // State management
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null)
  const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyInfo[]>([])
  const [selectedCurrency, setSelectedCurrency] = useState<string>('')
  const [selectedNetwork, setSelectedNetwork] = useState<string>('all')
  const [estimates, setEstimates] = useState<Record<string, EstimateData>>({})
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [extraIdConfirmed, setExtraIdConfirmed] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)
  const [creatingPayment, setCreatingPayment] = useState(false)
  const [error, setError] = useState<string>('')
  
  // Status monitoring state
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [monitoringInterval, setMonitoringInterval] = useState(5000) // Start with 5 seconds
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const visibilityRef = useRef<boolean>(true)
  const consecutiveFailures = useRef<number>(0)
  const monitoringStartTime = useRef<number>(Date.now())
  
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
        const currentStatus = data.payment
        setPaymentStatus(currentStatus)
        
        console.log(`🔄 Payment status: ${currentStatus.payment_status}`)
        
        // Handle status changes
        if (currentStatus.payment_status === 'finished' || 
            currentStatus.payment_status === 'confirmed' ||
            currentStatus.payment_status === 'sending') {
          
          console.log('✅ Payment completed, stopping monitoring')
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          
          // Redirect to success page
          router.push(`/payment/success/${paymentLink?.id}?payment_id=${paymentData.payment_id}`)
          return
        }
        
        // Adaptive interval based on status and time elapsed
        const timeElapsed = Date.now() - monitoringStartTime.current
        let newInterval = 5000 // Default 5 seconds
        
        if (currentStatus.payment_status === 'waiting') {
          if (timeElapsed < 60000) newInterval = 3000      // First minute: 3s
          else if (timeElapsed < 300000) newInterval = 5000 // Next 4 minutes: 5s
          else if (timeElapsed < 600000) newInterval = 10000 // Next 5 minutes: 10s
          else newInterval = 15000                          // After 10 minutes: 15s
        } else if (currentStatus.payment_status === 'confirming') {
          newInterval = 2000 // More frequent for confirming status
        }
        
        // Update interval if it changed
        if (newInterval !== monitoringInterval) {
          setMonitoringInterval(newInterval)
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = setInterval(checkPaymentStatusOptimized, newInterval)
          }
        }
        
        // Reset consecutive failures on success
        consecutiveFailures.current = 0
        
      } else {
        console.warn('⚠️ Invalid payment status response:', data)
      }
      
    } catch (error) {
      console.error('❌ Error checking payment status:', error)
      
      // Increment consecutive failures
      consecutiveFailures.current++
      
      // Exponential backoff for failures
      if (consecutiveFailures.current >= 3) {
        const backoffInterval = Math.min(30000, 5000 * Math.pow(2, consecutiveFailures.current - 3))
        console.log(`⚠️ ${consecutiveFailures.current} consecutive failures, backing off to ${backoffInterval}ms`)
        
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          if (consecutiveFailures.current < 10) { // Stop after 10 failures
            intervalRef.current = setInterval(checkPaymentStatusOptimized, backoffInterval)
          } else {
            console.error('❌ Too many consecutive failures, stopping status monitoring')
            intervalRef.current = null
          }
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
    consecutiveFailures.current = 0
    monitoringStartTime.current = Date.now()
    
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
    }, [isMonitoring, paymentData?.payment_id, monitoringInterval]); // eslint-disable-line react-hooks/exhaustive-deps

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
    }, [isMonitoring, paymentData?.payment_id, monitoringInterval]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
    useEffect(() => {
      return () => {
        stopStatusMonitoring()
      }
    }, []);

  // Start monitoring when payment is created
    useEffect(() => {
      if (paymentData && !isMonitoring) {
        startStatusMonitoring()
      }
    }, [paymentData]); // eslint-disable-line react-hooks/exhaustive-deps

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

      // Comprehensive alternative mapping for all currencies
      const currencyAlternatives: Record<string, string[]> = {
        // Major cryptocurrencies
        'BTC': ['BTC', 'BITCOIN', 'BTCLN', 'BTCSEGWIT'],
        'ETH': ['ETH', 'ETHEREUM', 'ETHBSC', 'ETHMATIC', 'ETHARB', 'ETHOP', 'ETHBASE', 'BASEETH', 'ETH_BASE'],
        'BNB': ['BNB', 'BNBBSC', 'BSC', 'BNB_BSC', 'BINANCE', 'BNBCHAIN'],
        'SOL': ['SOL', 'SOLANA', 'SOLSPL'],
        'ADA': ['ADA', 'CARDANO'],
        'DOT': ['DOT', 'POLKADOT'],
        'MATIC': ['MATIC', 'POLYGON', 'MATICMATIC'],
        'AVAX': ['AVAX', 'AVALANCHE', 'AVAXC'],
        'TRX': ['TRX', 'TRON'],
        'LTC': ['LTC', 'LITECOIN'],
        'XRP': ['XRP', 'RIPPLE'],
        'TON': ['TON', 'TONCOIN'],
        'NEAR': ['NEAR', 'NEARPROTOCOL'],
        'ALGO': ['ALGO', 'ALGORAND'],
        'XLM': ['XLM', 'STELLAR'],
        'ARB': ['ARB', 'ARBITRUM'],
        'OP': ['OP', 'OPTIMISM'],
        'ETHBASE': ['ETHBASE', 'BASE', 'BASECHAIN', 'BASEETH', 'ETH_BASE'],
        
        // Stablecoins
        'USDT': ['USDT', 'USDTERC20', 'USDTBSC', 'USDTTRC20', 'USDTMATIC', 'USDTSOL', 'USDTTON', 'USDTARB', 'USDTOP'],
        'USDC': ['USDC', 'USDCERC20', 'USDCBSC', 'USDCMATIC', 'USDCSOL', 'USDCALGO', 'USDCARB', 'USDCOP', 'USDCBASE'],
        'DAI': ['DAI', 'DAIERC20'],
        'PYUSD': ['PYUSD', 'PYUSDERC20']
      }

      // Dynamic network patterns for comprehensive detection
      const networkPatterns = [
        'BSC', 'ERC20', 'TRC20', 'SOL', 'MATIC', 'ARB', 'OP', 'BASE', 'AVAX', 'TON', 'ALGO', 'NEAR'
      ]

      console.log('🔍 Step 1: Creating backend mappings for primary currencies...')
      
      // Step 1: Create backend mappings for all accepted currencies
      const backendMappings: Record<string, string> = {}
      
      for (const acceptedCrypto of acceptedCryptos) {
        console.log(`🔍 Finding backend mapping for: ${acceptedCrypto}`)
        
        // Try predefined alternatives first
        const alternatives = currencyAlternatives[acceptedCrypto.toUpperCase()] || []
        let backendCurrency = null
        
        // Check predefined alternatives
        for (const alt of alternatives) {
          const found = data.currencies.find((c: CurrencyInfo) => 
            c.code.toUpperCase() === alt.toUpperCase() && c.enabled
          )
          if (found) {
            backendCurrency = found.code
            break
          }
        }
        
        // If no predefined alternative found, try dynamic patterns
        if (!backendCurrency) {
          const baseCode = acceptedCrypto.toUpperCase()
          for (const pattern of networkPatterns) {
            const dynamicCode = `${baseCode}${pattern}`
            const found = data.currencies.find((c: CurrencyInfo) => 
              c.code.toUpperCase() === dynamicCode && c.enabled
            )
            if (found) {
              backendCurrency = found.code
              break
            }
          }
        }
        
        // Fallback to exact match
        if (!backendCurrency) {
          const exactMatch = data.currencies.find((c: CurrencyInfo) => 
            c.code.toUpperCase() === acceptedCrypto.toUpperCase() && c.enabled
          )
          if (exactMatch) {
            backendCurrency = exactMatch.code
          }
        }
        
        if (backendCurrency) {
          backendMappings[acceptedCrypto] = backendCurrency
          console.log(`✅ Backend mapping: ${acceptedCrypto} → ${backendCurrency}`)
        } else {
          console.warn(`⚠️ No backend mapping found for: ${acceptedCrypto}`)
        }
      }
      
      // Store backend mappings globally
      setCurrencyBackendMapping(backendMappings)
      
      console.log('🔍 Step 2: Creating clean customer-facing currency list...')
      
      // Step 2: Create clean customer-facing currency list
      const customerCurrencies: CurrencyInfo[] = []
      
      // Add primary currencies (clean display names)
      for (const acceptedCrypto of acceptedCryptos) {
        if (backendMappings[acceptedCrypto]) {
          // Find the actual currency info from NOWPayments
          const backendCode = backendMappings[acceptedCrypto]
          const currencyInfo = data.currencies.find((c: CurrencyInfo) => 
            c.code === backendCode && c.enabled
          )
          
          if (currencyInfo) {
            // Create clean customer-facing currency
            customerCurrencies.push({
              code: acceptedCrypto, // Display the clean code (BNB, not BNBBSC)
              name: currencyInfo.name,
              enabled: true,
              min_amount: currencyInfo.min_amount,
              max_amount: currencyInfo.max_amount
            })
            console.log(`✅ Added primary currency: ${acceptedCrypto} (backend: ${backendCode})`)
          }
        }
      }
      
      // Add supported stablecoins for each network
      const stablecoinMapping: Record<string, string[]> = {
        'BNB': ['USDTBSC', 'USDCBSC'],
        'ETH': ['USDTERC20', 'USDC', 'DAI', 'PYUSD'],
        'SOL': ['USDTSOL', 'USDCSOL'],
        'TRX': ['USDTTRC20'],
        'TON': ['USDTTON'],
        'MATIC': ['USDTMATIC', 'USDCMATIC'],
        'ARB': ['USDTARB', 'USDCARB'],
        'OP': ['USDTOP', 'USDCOP'],
        'ETHBASE': ['USDCBASE'],
        'ALGO': ['USDCALGO']
      }
      
      for (const acceptedCrypto of acceptedCryptos) {
        const stablecoins = stablecoinMapping[acceptedCrypto] || []
        console.log(`🔍 Researching stable coins for: ${acceptedCrypto}`)
        
        for (const stablecoin of stablecoins) {
          const stablecoinInfo = data.currencies.find((c: CurrencyInfo) => 
            c.code.toUpperCase() === stablecoin.toUpperCase() && c.enabled
          )
          
          if (stablecoinInfo) {
            if (
              stablecoin.toUpperCase().includes('USDT') ||
              stablecoin.toUpperCase().includes('USDC') ||
              ['DAI', 'PYUSD'].includes(stablecoin.toUpperCase())
            ) {
              customerCurrencies.push({
                code: stablecoinInfo.code,
                name: stablecoinInfo.name,
                enabled: true,
                min_amount: stablecoinInfo.min_amount,
                max_amount: stablecoinInfo.max_amount
              })

              backendMappings[stablecoinInfo.code] = stablecoinInfo.code

              console.log(`✅ Added stable coin: ${stablecoinInfo.code} (for ${acceptedCrypto})`)
            }
          }
        }
      }
      
      // Sort currencies: Primary currencies first, then stablecoins
      const sortedCurrencies = customerCurrencies.sort((a: CurrencyInfo, b: CurrencyInfo) => {
        const aPrimary = acceptedCryptos.includes(a.code)
        const bPrimary = acceptedCryptos.includes(b.code)
        const aStablecoin =
          a.code.toUpperCase().includes('USDT') ||
          a.code.toUpperCase().includes('USDC') ||
          ['DAI', 'PYUSD'].includes(a.code.toUpperCase())
        const bStablecoin =
          b.code.toUpperCase().includes('USDT') ||
          b.code.toUpperCase().includes('USDC') ||
          ['DAI', 'PYUSD'].includes(b.code.toUpperCase())
        
        // Primary currencies first
        if (aPrimary && !bPrimary) return -1
        if (!aPrimary && bPrimary) return 1
        
        // Among primary currencies, sort by priority
        if (aPrimary && bPrimary) {
          const priorityOrder = ['BTC', 'ETH', 'BNB', 'SOL', 'MATIC', 'TRX', 'TON', 'AVAX', 'NEAR']
          const aIndex = priorityOrder.indexOf(a.code.toUpperCase())
          const bIndex = priorityOrder.indexOf(b.code.toUpperCase())
          
          if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
          if (aIndex !== -1) return -1
          if (bIndex !== -1) return 1
          return a.code.localeCompare(b.code)
        }
        
        // Stablecoins last, sorted alphabetically
        if (aStablecoin && bStablecoin) {
          return a.code.localeCompare(b.code)
        }
        
        return a.code.localeCompare(b.code)
      })

      console.log(`✅ Created ${sortedCurrencies.length} customer-facing currencies`)
      console.log('📋 Backend mappings:', backendMappings)
      console.log('🎯 Final customer-facing currencies:', sortedCurrencies.map((c: CurrencyInfo) => c.code))
      
      // Update state
      setAvailableCurrencies(sortedCurrencies)
      setCurrencyBackendMapping(backendMappings)
      
      console.log('🔧 Backend mapping stored for payment processing')

    } catch (error) {
      console.error('Error loading currencies:', error)
      setError('Failed to load available currencies')
    }
  }

  // Load currency estimates in small parallel batches for better performance
  const loadEstimates = async () => {
    if (!paymentLink || availableCurrencies.length === 0) return

    console.log('📊 Loading payment estimates...')

    const amount = feeBreakdown ? feeBreakdown.customerTotal : paymentLink.amount
    const newEstimates: Record<string, EstimateData> = {}
    const batchSize = 3

    for (let i = 0; i < availableCurrencies.length; i += batchSize) {
      const batch = availableCurrencies.slice(i, i + batchSize)

      const results = await Promise.all(
        batch.map(async (currency) => {
          const backendCurrency = currencyBackendMapping[currency.code] || currency.code
          try {
            const response = await fetch('/api/nowpayments/estimate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                amount,
                currency_from: paymentLink.currency.toLowerCase(),
                currency_to: backendCurrency.toLowerCase(),
              }),
            })

            if (response.ok) {
              const data = await response.json()
              if (data.success && data.estimate) {
                console.log(`✅ Estimate loaded for ${currency.code}: ${data.estimate.estimated_amount}`)
                return {
                  code: currency.code,
                  estimate: {
                    currency_from: paymentLink.currency,
                    currency_to: currency.code,
                    amount_from: amount,
                    estimated_amount: data.estimate.estimated_amount,
                    fee_amount: data.estimate.fee_amount || 0,
                    fee_percentage: data.estimate.fee_percentage || 0,
                  } as EstimateData,
                }
              } else {
                console.warn(`⚠️ Failed to get estimate for ${currency.code}:`, data.error)
              }
            } else {
              console.warn(`⚠️ HTTP ${response.status} for ${currency.code}`)
            }
          } catch (error) {
            console.error(`❌ Error loading estimate for ${currency.code}:`, error)
          }
          return null
        })
      )

      results.forEach((result) => {
        if (result) {
          newEstimates[result.code] = result.estimate
        }
      })
    }

    setEstimates(newEstimates)
    console.log(`✅ Loaded ${Object.keys(newEstimates).length} estimates`)
  }

  // Load estimates when currencies are available
  useEffect(() => {
    if (paymentLink && availableCurrencies.length > 0) {
      loadEstimates()
    }
    }, [paymentLink, availableCurrencies]); // eslint-disable-line react-hooks/exhaustive-deps

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
      setPaymentData(data.payment)

      // Generate QR code for payment address with destination tag if needed
      if (data.payment.pay_address) {
        let qrData = data.payment.pay_address
        
        // Add destination tag/memo to QR code for supported currencies using proper URI schemes
        if (data.payment.payin_extra_id && requiresExtraId(data.payment.pay_currency)) {
          const currency = data.payment.pay_currency.toUpperCase()
          if (currency === 'XRP') {
            // XRP URI scheme: xrp://address?dt=tag&amount=amount
            qrData = `xrp:${data.payment.pay_address}?dt=${data.payment.payin_extra_id}&amount=${data.payment.pay_amount}`
          } else if (currency === 'XLM') {
            // Stellar URI scheme: web+stellar:pay?destination=address&memo=memo&amount=amount
            qrData = `web+stellar:pay?destination=${data.payment.pay_address}&memo=${data.payment.payin_extra_id}&amount=${data.payment.pay_amount}`
          } else if (currency === 'HBAR') {
            // Hedera URI scheme: hbar://address?memo=memo&amount=amount
            qrData = `hbar:${data.payment.pay_address}?memo=${data.payment.payin_extra_id}&amount=${data.payment.pay_amount}`
          }
        } else if (data.payment.pay_currency) {
          // Add amount to QR code for currencies without destination tags
          const currency = data.payment.pay_currency.toUpperCase()
          if (currency === 'BTC') {
            qrData = `bitcoin:${data.payment.pay_address}?amount=${data.payment.pay_amount}`
          } else if (currency === 'ETH') {
            qrData = `ethereum:${data.payment.pay_address}?value=${data.payment.pay_amount * Math.pow(10, 18)}`
          }
        }
        
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
    <div className="min-h-screen bg-background py-8">
      <div className="container-narrow">
        {/* Trust Indicators Header */}
        <div className="flex items-center justify-center space-x-6 mb-8 text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-[#7f5efd]" />
            <span className="font-phonic font-normal">Secure Payment</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-[#7f5efd]" />
            <span className="font-phonic font-normal">Instant Processing</span>
          </div>
          <div className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4 text-[#7f5efd]" />
            <span className="font-phonic font-normal">Non-Custodial</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-phonic text-3xl font-normal tracking-tight text-gray-900 mb-4">
            {paymentLink.title}
          </h1>
          {paymentLink.description && (
            <p className="font-phonic text-base font-normal text-gray-600 mb-4">{paymentLink.description}</p>
          )}
          {paymentLink.subscription_id && (
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 mb-4">
              <span className="font-phonic text-sm text-blue-800">Recurring Invoice</span>
            </div>
          )}
          <div className="flex items-center justify-center space-x-2 text-gray-500">
            <span className="font-phonic text-sm">Powered by</span>
            <span className="font-phonic text-sm font-medium text-gray-900">{paymentLink.merchant.business_name}</span>
          </div>
        </div>

        {/* Payment Amount Card */}
        <Card className="mb-8 border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 bg-white group">
          <CardHeader className="text-center pb-4">
            <CardTitle className="font-phonic text-3xl font-normal text-gray-900">Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {feeBreakdown && (
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="font-phonic text-base text-gray-600">Base Amount:</span>
                  <span className="font-phonic text-base font-medium text-gray-900">${feeBreakdown.baseAmount.toFixed(2)} {paymentLink.currency.toUpperCase()}</span>
                </div>
                
                {paymentLink.tax_enabled && feeBreakdown.taxAmount > 0 && (
                  <>
                    {paymentLink.tax_rates.map((rate, index) => (
                      <div key={index} className="flex justify-between text-sm py-1">
                        <span className="font-phonic text-sm text-gray-600">{rate.label} ({rate.percentage}%):</span>
                        <span className="font-phonic text-sm text-gray-700">${(feeBreakdown.baseAmount * (rate.percentage / 100)).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center py-2 border-t border-gray-100">
                      <span className="font-phonic text-base font-normal text-gray-600">Tax Total:</span>
                      <span className="font-phonic text-base font-medium text-gray-900">${feeBreakdown.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="font-phonic text-base font-normal text-gray-600">Subtotal with Tax:</span>
                      <span className="font-phonic text-base font-medium text-gray-900">${feeBreakdown.subtotalWithTax.toFixed(2)}</span>
                    </div>
                  </>
                )}
                
                {feeBreakdown.platformFee > 0 && (
                  <div className="flex justify-between text-sm py-1">
                    <span className="font-phonic text-sm text-gray-600">Gateway Fee ({((paymentLink.fee_percentage || 0) * 100).toLocaleString(undefined, { maximumFractionDigits: 3, minimumFractionDigits: 0 })}%):</span>
                    <span className="font-phonic text-sm text-gray-700">${feeBreakdown.platformFee.toFixed(2)}</span>
                  </div>
                )}
                
                <Separator className="my-4" />
                <div className="flex justify-between items-center py-3 bg-[#f5f3ff] rounded-lg px-4">
                  <span className="font-phonic text-xl font-normal text-gray-900">Total Amount:</span>
                  <span className="font-phonic text-3xl font-medium text-[#7c3aed]">${feeBreakdown.customerTotal.toFixed(2)} {paymentLink.currency.toUpperCase()}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {!paymentData ? (
          /* Currency Selection */
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 bg-white group">
            <CardHeader className="text-center pb-6">
              <CardTitle className="font-phonic text-3xl font-normal text-gray-900">Select Payment Method</CardTitle>
              <p className="font-phonic text-base font-normal text-gray-600">Choose your preferred cryptocurrency</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Network Filter */}
              {availableCurrencies.length > 0 && (() => {
                const groupedCurrencies = groupCurrenciesByNetwork(
                  availableCurrencies.map(c => ({ code: c.code, name: c.name })),
                  paymentLink.accepted_cryptos
                )
                const availableNetworks = sortNetworksByPriority(Array.from(groupedCurrencies.keys()))
                
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-phonic text-sm font-normal text-gray-700 flex items-center">
                        <Filter className="h-4 w-4 mr-1" />
                        Filter by Network
                      </Label>
                      {selectedNetwork !== 'all' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedNetwork('all')}
                          className="text-xs text-[#7f5efd] hover:text-[#7c3aed]"
                        >
                          Clear filter
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={selectedNetwork === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedNetwork('all')}
                        className={`font-phonic text-sm ${
                          selectedNetwork === 'all'
                            ? 'bg-[#7f5efd] hover:bg-[#7c3aed] text-white'
                            : 'border-gray-300 hover:border-[#7f5efd] hover:text-[#7f5efd]'
                        }`}
                      >
                        <Globe className="h-3 w-3 mr-1" />
                        All Networks
                      </Button>
                      {availableNetworks.map(networkId => {
                        const network = getNetworkInfo(networkId)
                        if (!network) return null
                        const currencyCount = groupedCurrencies.get(networkId)?.length || 0
                        
                        return (
                          <Button
                            key={networkId}
                            variant={selectedNetwork === networkId ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedNetwork(networkId)}
                            className={`font-phonic text-sm ${
                              selectedNetwork === networkId
                                ? 'bg-[#7f5efd] hover:bg-[#7c3aed] text-white'
                                : 'border-gray-300 hover:border-[#7f5efd] hover:text-[#7f5efd]'
                            }`}
                          >
                            {network.displayName}
                            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-white/20">
                              {currencyCount}
                            </span>
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
              
              {availableCurrencies.length === 0 ? (
                <div className="text-center py-12">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-[#ede9fe] border-t-[#7f5efd] rounded-full animate-spin mx-auto mb-4"></div>
                  </div>
                  <p className="font-phonic text-base font-normal text-gray-600">Loading available currencies...</p>
                </div>
              ) : (
                <div className="grid gap-4">
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
                    
                    if (filteredCurrencies.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <p className="font-phonic text-base text-gray-500">No currencies available for this network</p>
                        </div>
                      )
                    }
                    
                    return filteredCurrencies.map((currency) => {
                      const estimate = estimates[currency.code]
                      const isSelected = selectedCurrency === currency.code
                      const displayName = getCurrencyDisplayName(currency.code)
                    
                    return (
                      <div
                        key={currency.code}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'border-[#7f5efd] bg-[#f5f3ff] shadow-md' 
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}
                        onClick={() => setSelectedCurrency(currency.code)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected 
                                ? 'border-[#7f5efd] bg-[#7f5efd]' 
                                : 'border-gray-300'
                            }`}>
                              {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                              )}
                            </div>
                            <div>
                              <div className="font-phonic text-base font-medium text-gray-900">{currency.code.toUpperCase()}</div>
                              <div className="font-phonic text-sm text-gray-500">{displayName}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            {estimate && estimate.estimated_amount && typeof estimate.estimated_amount === 'number' && estimate.estimated_amount !== null ? (
                              <div className="font-phonic text-lg font-medium text-gray-900">
                                {estimate.estimated_amount.toFixed(6)}
                              </div>
                            ) : (
                              <div className="font-phonic text-base text-gray-400">Calculating...</div>
                            )}
                            <div className="font-phonic text-sm text-gray-500">{currency.code.toUpperCase()}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                  })()}
                </div>
              )}
              
              {selectedCurrency && (
                <Button 
                  onClick={createPayment} 
                  disabled={creatingPayment}
                  className="w-full h-14 font-phonic text-base font-normal px-8 py-3 shadow-lg bg-[#7f5efd] hover:bg-[#7c3aed] text-white"
                  size="lg"
                >
                  {creatingPayment ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                      Creating Payment...
                    </>
                  ) : (
                    <>
                      Continue with {selectedCurrency.toUpperCase()}
                      <ArrowRight className="h-5 w-5 ml-3" />
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Payment Instructions */
          <div className="space-y-8">
            {/* Payment Status */}
            {currentStatus && (
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 bg-white group">
                <CardHeader>
                  <CardTitle className="font-phonic text-xl font-normal flex items-center space-x-3">
                    {getStatusIcon(currentStatus.payment_status)}
                    <span>Payment Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge className={`${getStatusColor(currentStatus.payment_status)} border px-4 py-2 text-sm font-semibold`}>
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
                              className="font-phonic text-base font-normal border-[#7f5efd] text-[#7f5efd] hover:bg-[#f5f3ff] shadow-sm"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Transaction
                            </Button>
                          ) : null
                        })()}
                      </>
                    )}
                  </div>
                  
                  {currentStatus.actually_paid && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-sm text-green-800">
                        <span className="font-semibold">Amount Received:</span> {currentStatus.actually_paid} {currentStatus.pay_currency.toUpperCase()}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Payment Instructions */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 bg-white group">
              <CardHeader className="text-center">
                <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Send Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Amount */}
                <div>
                  <Label className="font-phonic text-sm font-normal text-gray-700 mb-3 block">Amount to Send</Label>
                  <div className="flex items-center space-x-3">
                    <Input
                      value={`${paymentData.pay_amount} ${paymentData.pay_currency.toUpperCase()}`}
                      readOnly
                      className="font-mono text-lg font-semibold bg-gray-50"
                    />
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => copyToClipboard(paymentData.pay_amount.toString(), 'Amount')}
                      className="font-phonic text-base font-normal border-[#7f5efd] text-[#7f5efd] hover:bg-[#f5f3ff] shadow-sm"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <Label className="font-phonic text-sm font-normal text-gray-700 mb-3 block">Payment Address</Label>
                  <div className="flex items-center space-x-3">
                    <Input
                      value={paymentData.pay_address}
                      readOnly
                      className="font-mono text-sm bg-gray-50"
                    />
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => copyToClipboard(paymentData.pay_address, 'Address')}
                      className="font-phonic text-base font-normal border-[#7f5efd] text-[#7f5efd] hover:bg-[#f5f3ff] shadow-sm"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Destination Tag/Memo for currencies that require it */}
                {paymentData.payin_extra_id && requiresExtraId(paymentData.pay_currency) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <Label className="font-phonic text-sm font-semibold text-yellow-800 block">
                          {getExtraIdLabel(paymentData.pay_currency)} Required
                        </Label>
                        <p className="text-sm text-yellow-700 mt-1">
                          You must include this {getExtraIdLabel(paymentData.pay_currency).toLowerCase()} when sending your payment. 
                          Payments without the correct {getExtraIdLabel(paymentData.pay_currency).toLowerCase()} may be lost.
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
                        size="lg"
                        onClick={() => copyToClipboard(paymentData.payin_extra_id!, getExtraIdLabel(paymentData.pay_currency))}
                        className="font-phonic text-base font-normal border-yellow-600 text-yellow-700 hover:bg-yellow-50 shadow-sm"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-start gap-2">
                      <input
                        id="confirm-extra-id"
                        type="checkbox"
                        className="mt-1 h-4 w-4 text-yellow-700 border-yellow-300 rounded"
                        checked={extraIdConfirmed}
                        onChange={(e) => setExtraIdConfirmed(e.target.checked)}
                      />
                      <label htmlFor="confirm-extra-id" className="text-sm text-yellow-800">
                        I will include the {getExtraIdLabel(paymentData.pay_currency).toLowerCase()} above in my wallet before sending
                      </label>
                    </div>
                    <p className="font-phonic text-xs font-normal text-yellow-700 mt-2">
                      Tip: In Trust Wallet and many exchanges, look for a field named “{getExtraIdLabel(paymentData.pay_currency)}” or “Memo” and paste the value above before sending.
                    </p>
                  </div>
                )}

                {/* QR Code (single) */}
                {qrCodeDataUrl && (!paymentData.payin_extra_id || !requiresExtraId(paymentData.pay_currency) || extraIdConfirmed) && (
                  <div className="text-center">
                    <Label className="font-phonic text-sm font-normal text-gray-700 mb-4 block">QR Code</Label>
                    <div className="inline-block p-6 bg-white rounded-lg border-2 border-gray-200 shadow-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrCodeDataUrl}
                        alt="Payment QR Code"
                        className="w-56 h-56 mx-auto"
                      />
                    </div>
                    <p className="font-phonic text-sm font-normal text-gray-500 mt-3">
                      Scan with your crypto wallet app
                    </p>
                    {paymentData.payin_extra_id && requiresExtraId(paymentData.pay_currency) && (
                      <p className="font-phonic text-xs font-normal text-green-600 mt-2">
                        ✓ {getExtraIdLabel(paymentData.pay_currency)} included in QR code
                      </p>
                    )}
                  </div>
                )}

                {/* If extra required but not confirmed, show reminder instead of QR */}
                {qrCodeDataUrl && paymentData.payin_extra_id && requiresExtraId(paymentData.pay_currency) && !extraIdConfirmed && (
                  <div className="text-center">
                    <div className="inline-block p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                      <p className="font-phonic text-sm font-semibold text-yellow-800">
                        Please confirm you will include the {getExtraIdLabel(paymentData.pay_currency).toLowerCase()} to reveal the QR code.
                      </p>
                    </div>
                  </div>
                )}

                {/* Instructions */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                  <h4 className="font-phonic font-normal text-blue-900 mb-4 flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Payment Instructions
                  </h4>
                  <ol className="font-phonic text-sm font-normal text-blue-800 space-y-2 list-decimal list-inside">
                    <li>Send exactly <strong className="text-blue-900">{paymentData.pay_amount} {paymentData.pay_currency.toUpperCase()}</strong> to the address above</li>
                    <li>Do not send any other amount or currency</li>
                    <li>Payment will be confirmed automatically</li>
                    <li>You will be redirected once payment is complete</li>
                  </ol>
                </div>

                {/* Monitoring Status */}
                {isMonitoring && (
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
                      <Loader2 className="h-5 w-5 animate-spin text-[#7f5efd]" />
                      <span className="font-phonic font-normal">Monitoring payment status (checking every {Math.round(monitoringInterval / 1000)}s)</span>
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
