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
import { Copy, ExternalLink, Loader2, AlertCircle, CheckCircle, CheckCircle2, Clock, ArrowRight, RefreshCw, Shield, Zap, CreditCard, Filter, Globe, AlertTriangle, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import QRCode from 'qrcode'
import { groupCurrenciesByNetwork, getNetworkInfo, getCurrencyDisplayName, sortNetworksByPriority, NETWORKS } from '@/lib/crypto-networks'
import { requiresExtraId, getExtraIdLabel } from '@/lib/extra-id-validation'
import { buildCryptoPaymentURI, formatAmountForDisplay } from '@/lib/crypto-uri-builder'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

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
        // Use centralized URI builder for comprehensive cryptocurrency support
        const uriResult = buildCryptoPaymentURI({
          currency: data.payment.pay_currency,
          address: data.payment.pay_address,
          amount: data.payment.pay_amount,
          extraId: data.payment.payin_extra_id,
          label: paymentLink?.title || 'Cryptrac Payment',
          message: paymentLink?.description || 'Cryptocurrency payment'
        })
        
        const qrData = uriResult.uri
        
        console.log('🔗 Generated payment URI:', qrData)
        console.log('📋 URI includes amount:', uriResult.includesAmount)
        console.log('🏷️ URI includes extra ID:', uriResult.includesExtraId)
        
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
                  <div className="bg-gradient-to-br from-purple-50 to-white p-4 rounded-xl border border-purple-100 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Amount</span>
                      <span className="font-medium text-gray-900">${feeBreakdown.baseAmount.toFixed(2)} {paymentLink.currency.toUpperCase()}</span>
                    </div>
                    {paymentLink.tax_enabled && feeBreakdown.taxAmount > 0 && (
                      <>
                        {paymentLink.tax_rates.map((rate, index) => (
                          <div key={index} className="flex justify-between text-emerald-600">
                            <span>{rate.label} ({rate.percentage}%)</span>
                            <span className="font-medium">+${(feeBreakdown.baseAmount * (rate.percentage / 100)).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-semibold text-emerald-600 border-t border-purple-100 pt-2">
                          <span>Total Tax</span>
                          <span>+${feeBreakdown.taxAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-semibold border-t border-purple-100 pt-2">
                          <span className="text-gray-600">Subtotal with Tax</span>
                          <span className="text-gray-900">${feeBreakdown.subtotalWithTax.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    {feeBreakdown.platformFee > 0 && (
                      <div className="flex justify-between text-blue-600">
                        <span>Gateway Fee ({((paymentLink.fee_percentage || 0) * 100).toLocaleString(undefined, { maximumFractionDigits: 3, minimumFractionDigits: 0 })}%)</span>
                        <span className="font-medium">+${feeBreakdown.platformFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base border-t border-purple-100 pt-2">
                      <span className="text-gray-700">Total Amount</span>
                      <span className="text-[#7f5efd]">${feeBreakdown.customerTotal.toFixed(2)} {paymentLink.currency.toUpperCase()}</span>
                    </div>
                  </div>
                )}

                {!paymentData ? (
                  /* Currency Selection */
                  <div className="space-y-4">
                    <label className="text-sm font-semibold text-gray-700 block text-center">Select Payment Currency</label>
                    
                    {/* Network Filter Dropdown */}
                    {availableCurrencies.length > 0 && (() => {
                      const groupedCurrencies = groupCurrenciesByNetwork(
                        availableCurrencies.map(c => ({ code: c.code, name: c.name })),
                        paymentLink.accepted_cryptos
                      )
                      const availableNetworks = sortNetworksByPriority(Array.from(groupedCurrencies.keys()))
                      const selectedNetworkInfo = selectedNetwork !== 'all' ? getNetworkInfo(selectedNetwork) : null
                      
                      return (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-between h-10 border-purple-200 hover:border-[#7f5efd] hover:bg-purple-50"
                            >
                              <span className="flex items-center">
                                <Filter className="h-4 w-4 mr-2 text-[#7f5efd]" />
                                {selectedNetwork === 'all' ? 'All Networks' : selectedNetworkInfo?.displayName || 'Select Network'}
                              </span>
                              <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-full">
                            <DropdownMenuItem
                              onClick={() => setSelectedNetwork('all')}
                              className={cn(
                                "cursor-pointer",
                                selectedNetwork === 'all' && "bg-purple-50 text-[#7f5efd]"
                              )}
                            >
                              <Globe className="h-4 w-4 mr-2" />
                              All Networks
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {availableNetworks.map(networkId => {
                              const network = getNetworkInfo(networkId)
                              if (!network) return null
                              const currencyCount = groupedCurrencies.get(networkId)?.length || 0
                              
                              return (
                                <DropdownMenuItem
                                  key={networkId}
                                  onClick={() => setSelectedNetwork(networkId)}
                                  className={cn(
                                    "cursor-pointer justify-between",
                                    selectedNetwork === networkId && "bg-purple-50 text-[#7f5efd]"
                                  )}
                                >
                                  <span>{network.displayName}</span>
                                  <span className="ml-2 text-xs text-gray-500">({currencyCount})</span>
                                </DropdownMenuItem>
                              )
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )
                    })()}
                    
                    {availableCurrencies.length === 0 ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-[#7f5efd] mx-auto mb-4" />
                        <p className="text-base text-gray-600">Loading available currencies...</p>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {(() => {
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
                                <p className="text-base text-gray-500">No currencies available for this network</p>
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
                                className={cn(
                                  "border-2 rounded-lg p-3 cursor-pointer transition-all duration-200 flex items-center justify-between",
                                  isSelected 
                                    ? "border-[#7f5efd] bg-purple-50 shadow-md" 
                                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                                )}
                                onClick={() => setSelectedCurrency(currency.code)}
                              >
                                <div className="flex items-center space-x-3">
                                  <div className={cn(
                                    "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                    isSelected ? "border-[#7f5efd] bg-[#7f5efd]" : "border-gray-300"
                                  )}>
                                    {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900">{currency.code.toUpperCase()}</div>
                                    <div className="text-xs text-gray-500">{displayName}</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  {estimate && estimate.estimated_amount ? (
                                    <div className="font-medium text-gray-900">
                                      {estimate.estimated_amount.toFixed(6)}
                                    </div>
                                  ) : (
                                    <div className="text-sm text-gray-400">Calculating...</div>
                                  )}
                                  <div className="text-xs text-gray-500">{currency.code.toUpperCase()}</div>
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
                        className="w-full h-14 text-base font-semibold bg-gradient-to-r from-[#7f5efd] to-[#9b7cff] hover:from-[#7c3aed] hover:to-[#8b6cef] text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        {creatingPayment ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Creating Payment...
                          </>
                        ) : (
                          <>
                            Continue with {selectedCurrency.toUpperCase()}
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
                    {currentStatus && (
                      <div className="w-full bg-gradient-to-br from-purple-50 to-white p-4 rounded-xl border border-purple-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {currentStatus.payment_status === 'confirmed' || currentStatus.payment_status === 'finished' || currentStatus.payment_status === 'sending' ? (
                              <CheckCircle2 className="h-6 w-6 text-green-500 animate-pulse" />
                            ) : (
                              <Clock className="h-6 w-6 text-[#7f5efd] animate-spin" />
                            )}
                            <span className="font-semibold text-gray-700">
                              {currentStatus.payment_status === 'confirmed' || currentStatus.payment_status === 'finished' || currentStatus.payment_status === 'sending' ? 'Payment Confirmed!' : 'Awaiting Payment'}
                            </span>
                          </div>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-semibold",
                            currentStatus.payment_status === 'confirmed' || currentStatus.payment_status === 'finished' || currentStatus.payment_status === 'sending' 
                              ? "bg-green-100 text-green-700" 
                              : currentStatus.payment_status === 'confirming' 
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-purple-100 text-[#7f5efd]"
                          )}>
                            {currentStatus.payment_status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* QR Code and Payment Info */}
                    <div className="space-y-4">
                      {qrCodeDataUrl && (!paymentData.payin_extra_id || !requiresExtraId(paymentData.pay_currency) || extraIdConfirmed) && (
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 text-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={qrCodeDataUrl} alt="Payment QR Code" className="w-56 h-56 mx-auto mb-3" />
                          <p className="text-sm text-gray-600">Scan with your crypto wallet app</p>
                          {paymentData.payin_extra_id && requiresExtraId(paymentData.pay_currency) && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ {getExtraIdLabel(paymentData.pay_currency)} included in QR code
                            </p>
                          )}
                        </div>
                      )}
                      {qrCodeDataUrl && paymentData.payin_extra_id && requiresExtraId(paymentData.pay_currency) && !extraIdConfirmed && (
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-center">
                          <p className="text-sm font-medium text-yellow-800">Please confirm you will include the {getExtraIdLabel(paymentData.pay_currency).toLowerCase()} to reveal the QR code.</p>
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

                      {/* Extra ID */}
                      {paymentData.payin_extra_id && requiresExtraId(paymentData.pay_currency) && (
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
                              className="mt-1 h-4 w-4 text-yellow-700 border-yellow-300 rounded"
                              checked={extraIdConfirmed}
                              onChange={(e) => setExtraIdConfirmed(e.target.checked)}
                            />
                            <label htmlFor="confirm-extra-id" className="text-sm text-yellow-800">
                              I will include the {getExtraIdLabel(paymentData.pay_currency).toLowerCase()} above in my wallet before sending
                            </label>
                          </div>
                          <p className="text-xs text-yellow-800 mt-1">
                            Tip: In many wallets (e.g., Trust Wallet), paste this under “{getExtraIdLabel(paymentData.pay_currency)}” or “Memo”.
                          </p>
                        </div>
                      )}

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
