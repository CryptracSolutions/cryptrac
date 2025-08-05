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

  // Optimized status checking with adaptive intervals and page visibility
  const checkPaymentStatusOptimized = async () => {
    if (!paymentData?.payment_id || !visibilityRef.current) {
      return
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch(`/api/nowpayments/payment-status?payment_id=${paymentData.payment_id}`, {
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
      console.log('✅ Payment link accepts:', acceptedCryptos)

      // COMPREHENSIVE BACKEND DETECTION - Find all possible alternatives
      const CURRENCY_ALTERNATIVES: Record<string, string[]> = {
        // Bitcoin alternatives
        'BTC': ['BTC', 'BITCOIN', 'BTCLN', 'BTCSEGWIT'],
        
        // Ethereum alternatives
        'ETH': ['ETH', 'ETHEREUM', 'ETHBSC', 'ETHMATIC', 'ETHARB', 'ETHOP'],
        
        // BNB/BSC alternatives
        'BNB': ['BNB', 'BNBBSC', 'BSC', 'BNB_BSC', 'BINANCE', 'BNBCHAIN'],
        
        // Solana alternatives
        'SOL': ['SOL', 'SOLANA', 'SOLSPL'],
        
        // Polygon/Matic alternatives
        'MATIC': ['MATIC', 'POLYGON', 'MATICMATIC', 'POLYGONMATIC'],
        
        // Avalanche alternatives
        'AVAX': ['AVAX', 'AVALANCHE', 'AVAXC', 'AVAXCCHAIN'],
        
        // Tron alternatives
        'TRX': ['TRX', 'TRON', 'TRXTRC20'],
        
        // TON alternatives
        'TON': ['TON', 'TONCOIN', 'TONCHAIN'],
        
        // Litecoin alternatives
        'LTC': ['LTC', 'LITECOIN', 'LTCLN'],
        
        // Cardano alternatives
        'ADA': ['ADA', 'CARDANO', 'ADACARDANO'],
        
        // Polkadot alternatives
        'DOT': ['DOT', 'POLKADOT', 'DOTPOLKADOT'],
        
        // XRP alternatives
        'XRP': ['XRP', 'RIPPLE', 'XRPRIPPLE'],
        
        // NEAR alternatives
        'NEAR': ['NEAR', 'NEARPROTOCOL', 'NEARNEAR'],
        
        // Algorand alternatives
        'ALGO': ['ALGO', 'ALGORAND', 'ALGOALGORAND'],
        
        // Stellar alternatives
        'XLM': ['XLM', 'STELLAR', 'XLMSTELLAR'],
        
        // Arbitrum alternatives
        'ARB': ['ARB', 'ARBITRUM', 'ARBARBITRUM', 'ARBETH'],
        
        // Optimism alternatives
        'OP': ['OP', 'OPTIMISM', 'OPOPTIMISM', 'OPETH'],
        
        // Base alternatives
        'BASE': ['BASE', 'BASECHAIN', 'BASECOIN'],
        
        // Additional popular currencies with alternatives
        'DOGE': ['DOGE', 'DOGECOIN', 'DOGEBSC'],
        'SHIB': ['SHIB', 'SHIBAINU', 'SHIBBSC'],
        'UNI': ['UNI', 'UNISWAP', 'UNIBSC'],
        'LINK': ['LINK', 'CHAINLINK', 'LINKBSC'],
        'ATOM': ['ATOM', 'COSMOS', 'ATOMCOSMOS'],
        'FTM': ['FTM', 'FANTOM', 'FTMFANTOM'],
        'AAVE': ['AAVE', 'AAVEBSC', 'AAVEMATIC'],
        'CRO': ['CRO', 'CRONOS', 'CROCRONOS']
      }

      // BACKEND MAPPING - Create mapping from display currency to actual NOWPayments currency
      const currencyMapping: Record<string, string> = {}
      
      // Stable coin mappings - ONLY USDT/USDC variations allowed
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

      // STEP 1: Find backend mappings for primary currencies
      console.log('🔍 Step 1: Creating backend mappings for primary currencies...')
      
      acceptedCryptos.forEach(crypto => {
        const cryptoUpper = crypto.toUpperCase()
        console.log(`🔍 Finding backend mapping for: ${crypto}`)
        
        // Get all possible alternatives for this currency
        const alternatives = CURRENCY_ALTERNATIVES[cryptoUpper] || [cryptoUpper]
        
        // Find which alternative exists in NOWPayments
        let foundMapping = false
        for (const alt of alternatives) {
          const found = data.currencies.find((currency: CurrencyInfo) => 
            currency.code.toUpperCase() === alt && currency.enabled
          )
          if (found) {
            currencyMapping[cryptoUpper] = found.code
            console.log(`✅ Backend mapping: ${crypto} → ${found.code}`)
            foundMapping = true
            break
          }
        }
        
        // If no predefined alternative found, try dynamic search
        if (!foundMapping) {
          const dynamicMatch = data.currencies.find((currency: CurrencyInfo) => {
            const code = currency.code.toUpperCase()
            return (
              code.includes(cryptoUpper) || 
              code.startsWith(cryptoUpper) ||
              code === `${cryptoUpper}BSC` ||
              code === `${cryptoUpper}ERC20` ||
              code === `${cryptoUpper}TRC20`
            ) && currency.enabled
          })
          
          if (dynamicMatch) {
            currencyMapping[cryptoUpper] = dynamicMatch.code
            console.log(`✅ Dynamic backend mapping: ${crypto} → ${dynamicMatch.code}`)
            foundMapping = true
          }
        }
        
        if (!foundMapping) {
          console.warn(`⚠️ No backend mapping found for: ${crypto}`)
        }
      })

      // STEP 2: Create clean customer-facing currency list
      console.log('🔍 Step 2: Creating clean customer-facing currency list...')
      
      const customerFacingCurrencies: CurrencyInfo[] = []
      
      // Add primary currencies (only if backend mapping exists)
      acceptedCryptos.forEach(crypto => {
        const cryptoUpper = crypto.toUpperCase()
        const backendCode = currencyMapping[cryptoUpper]
        
        if (backendCode) {
          // Find the actual currency info from NOWPayments
          const backendCurrency = data.currencies.find((currency: CurrencyInfo) => 
            currency.code === backendCode
          )
          
          if (backendCurrency) {
            // Create a customer-facing version with clean display name
            const customerCurrency: CurrencyInfo = {
              ...backendCurrency,
              code: crypto, // Display the clean primary code (BNB, not BNBBSC)
              name: backendCurrency.name.replace(/BSC|ERC20|TRC20|SOL|MATIC|ARB|OP/gi, '').trim()
            }
            
            customerFacingCurrencies.push(customerCurrency)
            console.log(`✅ Added primary currency: ${crypto} (backend: ${backendCode})`)
          }
        }
      })

      // Add USDT/USDC stablecoins (only for networks that support them)
      acceptedCryptos.forEach(crypto => {
        const cryptoUpper = crypto.toUpperCase()
        const stableCoins = STABLE_COIN_MAPPING[cryptoUpper] || []
        
        console.log(`🔍 Researching USDT/USDC stable coins for: ${crypto}`)
        
        stableCoins.forEach(stableCoinCode => {
          const stableCoin = data.currencies.find((currency: CurrencyInfo) => 
            currency.code.toUpperCase() === stableCoinCode && currency.enabled
          )
          
          if (stableCoin) {
            // Create backend mapping for stablecoin
            currencyMapping[stableCoin.code.toUpperCase()] = stableCoin.code
            
            customerFacingCurrencies.push(stableCoin)
            console.log(`✅ Added USDT/USDC stable coin: ${stableCoin.code} (for ${crypto})`)
          }
        })
      })

      console.log(`✅ Created ${customerFacingCurrencies.length} customer-facing currencies`)
      console.log('📋 Backend mappings:', currencyMapping)

      // STEP 3: Smart sorting - Primary currencies first, then stablecoins
      const sortedCurrencies = customerFacingCurrencies.sort((a: CurrencyInfo, b: CurrencyInfo) => {
        // Define base currency priority order
        const baseCurrencyOrder = ['BTC', 'ETH', 'BNB', 'SOL', 'MATIC', 'AVAX', 'TRX', 'ADA', 'LTC', 'XRP', 'DOT', 'TON', 'XLM', 'NEAR', 'ALGO', 'ARB', 'OP', 'BASE']
        
        // Check if currencies are base currencies (primary tokens)
        const aIsBase = baseCurrencyOrder.includes(a.code.toUpperCase())
        const bIsBase = baseCurrencyOrder.includes(b.code.toUpperCase())
        
        // Check if currencies are stable coins
        const aIsStable = a.code.toUpperCase().includes('USD')
        const bIsStable = b.code.toUpperCase().includes('USD')
        
        // Primary currencies come first
        if (aIsBase && !aIsStable && (!bIsBase || bIsStable)) return -1
        if (bIsBase && !bIsStable && (!aIsBase || aIsStable)) return 1
        
        // Among primary currencies, sort by priority order
        if (aIsBase && bIsBase && !aIsStable && !bIsStable) {
          const aIndex = baseCurrencyOrder.indexOf(a.code.toUpperCase())
          const bIndex = baseCurrencyOrder.indexOf(b.code.toUpperCase())
          return aIndex - bIndex
        }
        
        // Stablecoins come after primary currencies
        if (!aIsStable && bIsStable) return -1
        if (aIsStable && !bIsStable) return 1
        
        // Among stablecoins, sort alphabetically
        return a.code.localeCompare(b.code)
      })
      
      // Store the backend mapping globally for payment processing
      ;(window as any).cryptracCurrencyMapping = currencyMapping
      
      setAvailableCurrencies(sortedCurrencies)

      // Auto-select first currency if available
      if (sortedCurrencies.length > 0 && !selectedCurrency) {
        setSelectedCurrency(sortedCurrencies[0].code)
      }

      console.log('🎯 Final customer-facing currencies:', sortedCurrencies.map((c: CurrencyInfo) => c.code))
      console.log('🔧 Backend mapping stored for payment processing')

    } catch (error) {
      console.error('Error loading currencies:', error)
      setError('Failed to load available cryptocurrencies')
    }
  }

  const loadEstimates = async () => {
    if (!paymentLink || availableCurrencies.length === 0) return

    try {
      setEstimatesLoading(true)
      console.log('📊 Loading payment estimates...')

      const amount = feeBreakdown ? feeBreakdown.customerTotal : paymentLink.amount
      const estimatePromises = availableCurrencies.map(async (currency) => {
        try {
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

          const data = await response.json()
          
          if (data.success) {
            return {
              currency_from: paymentLink.currency,
              currency_to: currency.code,
              amount_from: amount,
              estimated_amount: data.estimate.estimated_amount,
              fee_amount: data.estimate.fee_amount || 0,
              fee_percentage: data.estimate.fee_percentage || 0
            }
          }
          
          return null
        } catch (error) {
          console.error(`Error getting estimate for ${currency.code}:`, error)
          return null
        }
      })

      const results = await Promise.all(estimatePromises)
      const validEstimates = results.filter((estimate): estimate is EstimateData => estimate !== null)
      
      setEstimates(validEstimates)
      console.log(`✅ Loaded ${validEstimates.length} estimates`)

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

      // Get the backend currency mapping
      const currencyMapping = (window as any).cryptracCurrencyMapping || {}
      const backendCurrency = currencyMapping[selectedCurrency.toUpperCase()] || selectedCurrency
      
      console.log(`🔧 Currency mapping: ${selectedCurrency} → ${backendCurrency}`)

      const response = await fetch('/api/nowpayments/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_amount: feeBreakdown ? feeBreakdown.customerTotal : paymentLink.amount,
          price_currency: paymentLink.currency.toLowerCase(),
          pay_currency: backendCurrency.toLowerCase(), // Use backend currency code
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
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy to clipboard')
    }
  }

  // Load payment link on component mount
  useEffect(() => {
    if (id) {
      loadPaymentLink()
    }
  }, [id])

  // Load estimates when currencies are available
  useEffect(() => {
    if (paymentLink && availableCurrencies.length > 0) {
      loadEstimates()
    }
  }, [paymentLink, availableCurrencies])

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
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Payment Error</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => router.push('/')} variant="outline">
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!paymentLink) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Payment Link Not Found</h2>
              <p className="text-gray-600 mb-4">The payment link you're looking for doesn't exist or has expired.</p>
              <Button onClick={() => router.push('/')} variant="outline">
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show payment interface if no payment created yet
  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{paymentLink.title}</CardTitle>
                  <p className="text-gray-600 mt-1">{paymentLink.merchant.business_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">
                    {feeBreakdown ? `$${feeBreakdown.customerTotal.toFixed(2)}` : `$${paymentLink.amount.toFixed(2)}`}
                  </p>
                  <p className="text-sm text-gray-500">{paymentLink.currency}</p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {paymentLink.description && (
                <div>
                  <p className="text-gray-700">{paymentLink.description}</p>
                </div>
              )}

              {/* Fee Breakdown */}
              {feeBreakdown && (feeBreakdown.taxAmount > 0 || feeBreakdown.platformFee > 0) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-3">Payment Breakdown</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Base Amount:</span>
                      <span>${feeBreakdown.baseAmount.toFixed(2)}</span>
                    </div>
                    {feeBreakdown.taxAmount > 0 && (
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>${feeBreakdown.taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {feeBreakdown.platformFee > 0 && (
                      <div className="flex justify-between">
                        <span>Processing Fee ({paymentLink.fee_percentage}%):</span>
                        <span>${feeBreakdown.platformFee.toFixed(2)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Total:</span>
                      <span>${feeBreakdown.customerTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Currency Selection */}
              <div>
                <Label className="text-base font-medium">Select Payment Method</Label>
                <p className="text-sm text-gray-600 mb-4">Choose your preferred cryptocurrency</p>
                
                {availableCurrencies.length === 0 ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-gray-600">Loading payment methods...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {availableCurrencies.map((currency) => {
                      const estimate = estimates.find(e => e.currency_to === currency.code)
                      
                      return (
                        <div
                          key={currency.code}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            selectedCurrency === currency.code
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedCurrency(currency.code)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{currency.code}</div>
                              <div className="text-sm text-gray-600">{currency.name}</div>
                            </div>
                            <div className="text-right">
                              {estimatesLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : estimate && estimate.estimated_amount && typeof estimate.estimated_amount === 'number' ? (
                                <>
                                  <div className="font-medium">
                                    {estimate.estimated_amount.toFixed(6)}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {currency.code}
                                  </div>
                                </>
                              ) : (
                                <div className="text-sm text-gray-400">
                                  Calculating...
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Continue Button */}
              <Button
                onClick={createPayment}
                disabled={!selectedCurrency || creatingPayment || availableCurrencies.length === 0}
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
                    Continue with {selectedCurrency || 'Cryptocurrency'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show payment details and status
  const currentStatus = paymentStatus || paymentData
  const statusColor = {
    'waiting': 'text-yellow-600',
    'confirming': 'text-blue-600',
    'confirmed': 'text-green-600',
    'finished': 'text-green-600',
    'partially_paid': 'text-orange-600',
    'failed': 'text-red-600',
    'refunded': 'text-gray-600',
    'expired': 'text-red-600'
  }[currentStatus.payment_status] || 'text-gray-600'

  const statusIcon = {
    'waiting': <Clock className="h-5 w-5" />,
    'confirming': <Loader2 className="h-5 w-5 animate-spin" />,
    'confirmed': <CheckCircle className="h-5 w-5" />,
    'finished': <CheckCircle className="h-5 w-5" />,
    'partially_paid': <AlertCircle className="h-5 w-5" />,
    'failed': <AlertCircle className="h-5 w-5" />,
    'refunded': <AlertCircle className="h-5 w-5" />,
    'expired': <AlertCircle className="h-5 w-5" />
  }[currentStatus.payment_status] || <Clock className="h-5 w-5" />

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{paymentLink.title}</CardTitle>
                <p className="text-gray-600 mt-1">{paymentLink.merchant.business_name}</p>
              </div>
              <div className="text-right">
                <div className={`flex items-center gap-2 ${statusColor}`}>
                  {statusIcon}
                  <Badge variant={currentStatus.payment_status === 'finished' ? 'default' : 'secondary'}>
                    {currentStatus.payment_status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Payment Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Payment Instructions</h3>
              <p className="text-blue-800 text-sm">
                Send exactly <strong>{currentStatus.pay_amount} {currentStatus.pay_currency}</strong> to the address below.
                {currentStatus.payment_status === 'waiting' && ' Your payment will be confirmed automatically.'}
              </p>
            </div>

            {/* Payment Details */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Payment Address</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={currentStatus.pay_address}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(currentStatus.pay_address)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Amount</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={`${currentStatus.pay_amount} ${currentStatus.pay_currency}`}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(currentStatus.pay_amount.toString())}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Network</Label>
                  <Input
                    value={currentStatus.pay_currency}
                    readOnly
                    className="mt-1"
                  />
                </div>
              </div>

              {/* QR Code */}
              {qrCodeDataUrl && (
                <div className="text-center">
                  <Label className="text-sm font-medium text-gray-700">QR Code</Label>
                  <div className="mt-2 inline-block p-4 bg-white rounded-lg border">
                    <img src={qrCodeDataUrl} alt="Payment QR Code" className="w-48 h-48" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Scan with your wallet app</p>
                </div>
              )}

              {/* Transaction Hash */}
              {currentStatus.tx_hash && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Transaction Hash</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={currentStatus.tx_hash}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(currentStatus.tx_hash!)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
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
                  </div>
                </div>
              )}

              {/* Status Updates */}
              {isMonitoring && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Monitoring payment status...</span>
                    <span className="text-xs">
                      (checking every {Math.round(monitoringInterval / 1000)}s)
                    </span>
                  </div>
                </div>
              )}

              {/* Payment Status Messages */}
              {currentStatus.payment_status === 'waiting' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <Clock className="h-5 w-5" />
                    <span className="font-medium">Waiting for Payment</span>
                  </div>
                  <p className="text-yellow-700 text-sm mt-1">
                    Please send the exact amount to the address above. We'll automatically detect your payment.
                  </p>
                </div>
              )}

              {currentStatus.payment_status === 'confirming' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="font-medium">Confirming Payment</span>
                  </div>
                  <p className="text-blue-700 text-sm mt-1">
                    Your payment has been detected and is being confirmed on the blockchain.
                  </p>
                </div>
              )}

              {currentStatus.payment_status === 'finished' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Payment Completed</span>
                  </div>
                  <p className="text-green-700 text-sm mt-1">
                    Your payment has been successfully processed. You will be redirected shortly.
                  </p>
                </div>
              )}

              {['failed', 'expired', 'partially_paid'].includes(currentStatus.payment_status) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">
                      {currentStatus.payment_status === 'failed' && 'Payment Failed'}
                      {currentStatus.payment_status === 'expired' && 'Payment Expired'}
                      {currentStatus.payment_status === 'partially_paid' && 'Partial Payment'}
                    </span>
                  </div>
                  <p className="text-red-700 text-sm mt-1">
                    {currentStatus.payment_status === 'failed' && 'There was an issue processing your payment. Please try again or contact support.'}
                    {currentStatus.payment_status === 'expired' && 'This payment has expired. Please create a new payment.'}
                    {currentStatus.payment_status === 'partially_paid' && 'We received a partial payment. Please send the remaining amount or contact support.'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

