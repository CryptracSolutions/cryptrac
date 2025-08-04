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
  nowpayments_payment_id: string
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
  const [customerEmail, setCustomerEmail] = useState<string>('')
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  
  const [loading, setLoading] = useState(true)
  const [estimatesLoading, setEstimatesLoading] = useState(false)
  const [creatingPayment, setCreatingPayment] = useState(false)
  const [error, setError] = useState<string>('')
  
  // Real-time status checking states
  const [statusChecking, setStatusChecking] = useState(false)
  const [lastStatusCheck, setLastStatusCheck] = useState<Date | null>(null)
  const [statusCheckCount, setStatusCheckCount] = useState(0)

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

  // Start status checking when payment is created
  useEffect(() => {
    if (paymentData && linkId) {
      startStatusChecking()
    }

    // Cleanup on unmount
    return () => {
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current)
        statusCheckIntervalRef.current = null
      }
    }
  }, [paymentData, linkId])

  const startStatusChecking = () => {
    console.log('🔄 Starting real-time status checking for payment link:', linkId)
    
    // Clear any existing interval
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current)
    }

    // Initial status check
    checkPaymentStatus()

    // Set up polling every 5 seconds
    statusCheckIntervalRef.current = setInterval(() => {
      checkPaymentStatus()
    }, 5000)
  }

  const checkPaymentStatus = async () => {
    if (!linkId || statusChecking) return

    try {
      setStatusChecking(true)
      setLastStatusCheck(new Date())
      setStatusCheckCount(prev => prev + 1)

      console.log(`🔍 Checking payment status (check #${statusCheckCount + 1})`)

      const response = await fetch(`/api/payments/${linkId}/status`)
      
      if (!response.ok) {
        throw new Error('Failed to check payment status')
      }

      const data = await response.json()

      if (data.success && data.payment) {
        const newStatus = data.payment.status
        const previousStatus = paymentStatus?.status

        console.log(`📊 Payment status: ${previousStatus} → ${newStatus}`)

        setPaymentStatus(data.payment)

        // Show status change notifications
        if (previousStatus !== newStatus) {
          switch (newStatus) {
            case 'confirming':
              toast.success('Payment received! Confirming on blockchain...')
              break
            case 'confirmed':
              toast.success('Payment confirmed successfully!')
              // Stop status checking
              if (statusCheckIntervalRef.current) {
                clearInterval(statusCheckIntervalRef.current)
                statusCheckIntervalRef.current = null
              }
              // Redirect to success page after a short delay
              setTimeout(() => {
                router.push(`/payment/success/${linkId}?payment_id=${data.payment.id}`)
              }, 2000)
              break
            case 'failed':
              toast.error('Payment failed. Please try again.')
              if (statusCheckIntervalRef.current) {
                clearInterval(statusCheckIntervalRef.current)
                statusCheckIntervalRef.current = null
              }
              break
            case 'expired':
              toast.error('Payment expired. Please create a new payment.')
              if (statusCheckIntervalRef.current) {
                clearInterval(statusCheckIntervalRef.current)
                statusCheckIntervalRef.current = null
              }
              break
          }
        }

        // Stop checking if payment is in final state
        if (['confirmed', 'failed', 'expired'].includes(newStatus)) {
          if (statusCheckIntervalRef.current) {
            clearInterval(statusCheckIntervalRef.current)
            statusCheckIntervalRef.current = null
          }
        }
      }

    } catch (error) {
      console.error('❌ Error checking payment status:', error)
      // Don't show error toast for status checks to avoid spam
    } finally {
      setStatusChecking(false)
    }
  }

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

      // Use the passed accepted cryptos parameter
      console.log('✅ Payment link accepts:', acceptedCryptos)

      // Define stable coin associations for auto-inclusion
      const stableCoinAssociations: Record<string, string[]> = {
        'ETH': ['USDT_ERC20', 'USDC_ERC20', 'DAI'],
        'SOL': ['USDT_SOL', 'USDC_SOL'],
        'BNB': ['USDT_BSC', 'USDC_BSC'],
        'MATIC': ['USDT_POLYGON', 'USDC_POLYGON'],
        'AVAX': ['USDT_AVAX', 'USDC_AVAX'],
        'TRX': ['USDT_TRC20']
      }

      // Expand accepted cryptos to include associated stable coins
      const expandedAcceptedCryptos = [...acceptedCryptos]
      const availableCurrencyCodes = data.currencies.map((c: CurrencyInfo) => c.code)

      acceptedCryptos.forEach(crypto => {
        if (stableCoinAssociations[crypto]) {
          stableCoinAssociations[crypto].forEach(stableCoin => {
            if (availableCurrencyCodes.includes(stableCoin) && !expandedAcceptedCryptos.includes(stableCoin)) {
              console.log(`✅ Adding available stable coin: ${stableCoin}`)
              expandedAcceptedCryptos.push(stableCoin)
            } else if (!availableCurrencyCodes.includes(stableCoin)) {
              console.log(`❌ Stable coin not available in API: ${stableCoin}`)
            }
          })
        }
      })

      console.log('📈 Expanded accepted cryptos (with available stable coins):', expandedAcceptedCryptos)

      // Filter to only accepted cryptocurrencies and their associated stable coins
      const filtered = data.currencies.filter((currency: CurrencyInfo) => {
        const isAccepted = expandedAcceptedCryptos.includes(currency.code)
        const isEnabled = currency.enabled
        if (isAccepted) {
          console.log(`🔍 Currency ${currency.code}: accepted=${isAccepted}, enabled=${isEnabled}`)
        }
        return isAccepted && isEnabled
      })

      console.log(`✅ Loaded ${filtered.length} available currencies (including stable coins):`, filtered.map((c: CurrencyInfo) => c.code))
      
      // Sort currencies for better organization: base currencies first, then their stable coins
      const sortedCurrencies = filtered.sort((a: CurrencyInfo, b: CurrencyInfo) => {
        // Define base currency priority order
        const baseCurrencyOrder = ['BTC', 'ETH', 'SOL', 'BNB', 'MATIC', 'AVAX', 'TRX', 'ADA', 'LTC', 'XRP']
        
        // Check if currencies are base currencies
        const aIsBase = baseCurrencyOrder.includes(a.code)
        const bIsBase = baseCurrencyOrder.includes(b.code)
        
        // Check if currencies are stable coins
        const aIsStable = a.code.includes('USDT') || a.code.includes('USDC')
        const bIsStable = b.code.includes('USDT') || b.code.includes('USDC')
        
        // Base currencies come first
        if (aIsBase && !bIsBase) return -1
        if (!aIsBase && bIsBase) return 1
        
        // Among base currencies, sort by priority order
        if (aIsBase && bIsBase) {
          const aIndex = baseCurrencyOrder.indexOf(a.code)
          const bIndex = baseCurrencyOrder.indexOf(b.code)
          return aIndex - bIndex
        }
        
        // Among stable coins, group by chain and sort USDT before USDC
        if (aIsStable && bIsStable) {
          const aChain = a.code.split('_')[1] || a.code.split('_')[0]
          const bChain = b.code.split('_')[1] || b.code.split('_')[0]
          
          if (aChain === bChain) {
            // Same chain: USDT before USDC
            if (a.code.includes('USDT') && b.code.includes('USDC')) return -1
            if (a.code.includes('USDC') && b.code.includes('USDT')) return 1
          }
          
          // Different chains: sort by chain priority
          const chainOrder = ['ETH', 'SOL', 'BSC', 'POLYGON', 'AVAX', 'TRX', 'ADA']
          const aChainIndex = chainOrder.indexOf(aChain)
          const bChainIndex = chainOrder.indexOf(bChain)
          return aChainIndex - bChainIndex
        }
        
        // Stable coins come after base currencies
        if (!aIsStable && bIsStable) return -1
        if (aIsStable && !bIsStable) return 1
        
        // Default alphabetical sort
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
          customer_email: customerEmail,
          // Tax information
          tax_enabled: paymentLink.tax_enabled,
          base_amount: paymentLink.base_amount,
          tax_rates: paymentLink.tax_rates,
          tax_amount: paymentLink.tax_amount,
          subtotal_with_tax: paymentLink.subtotal_with_tax
        }),
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

      // Generate QR code for payment address with improved wallet compatibility
      try {
        // For maximum wallet compatibility, use address-only format for most currencies
        let qrContent = data.payment.pay_address
        
        // Special handling for different wallet types
        if (selectedCurrency.toLowerCase() === 'btc') {
          // Bitcoin URI is widely supported
          qrContent = `bitcoin:${data.payment.pay_address}?amount=${data.payment.pay_amount}`
        } else if (selectedCurrency.toLowerCase() === 'eth' || selectedCurrency.includes('USDT') || selectedCurrency.includes('USDC') || selectedCurrency.includes('DAI')) {
          // For Ethereum and ERC-20 tokens, MetaMask prefers simple address format
          // Some wallets support ethereum: URI, but address-only is more universal
          qrContent = data.payment.pay_address
        }
        // For all other currencies, use address-only for maximum compatibility
        
        const qrDataUrl = await QRCode.toDataURL(qrContent, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        })
        setQrCodeDataUrl(qrDataUrl)
        console.log('✅ QR code generated with content:', qrContent)
      } catch (qrError) {
        console.error('Error generating QR code:', qrError)
        // Fallback to simple address if any error occurs
        try {
          const fallbackQrDataUrl = await QRCode.toDataURL(data.payment.pay_address, {
            width: 256,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          })
          setQrCodeDataUrl(fallbackQrDataUrl)
          console.log('✅ Fallback QR code generated with address only')
        } catch (fallbackError) {
          console.error('Error generating fallback QR code:', fallbackError)
        }
      }

      toast.success('Payment created! Send the exact amount to the address below.')

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

  const getBlockExplorerUrl = (txHash: string, currency: string) => {
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
          
          {/* Enhanced Payment Amount with Complete Fee Breakdown */}
          <div className="mt-6 bg-white rounded-lg p-6 shadow-sm border">
            {feeBreakdown && (paymentLink.tax_enabled || feeBreakdown.feeAmount > 0) ? (
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

                {/* Gateway Fee */}
                {feeBreakdown.feeAmount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      Gateway Fee ({feeBreakdown.feePercentage.toFixed(1)}% {feeBreakdown.effectiveAutoConvert ? 'Auto-convert' : 'Direct crypto'}):
                    </span>
                    <span className="text-gray-600">
                      {feeBreakdown.effectiveChargeCustomerFee ? '+' : ''}{formatCurrency(feeBreakdown.feeAmount, paymentLink.currency)}
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

                {/* Merchant Receives (for transparency) */}
                {!feeBreakdown.effectiveChargeCustomerFee && (
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
                ) : availableCurrencies.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No supported cryptocurrencies available for this payment link.</p>
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

            {/* Customer Email (Optional) */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <p className="text-sm text-gray-600">
                  Optional: Receive payment confirmation
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Create Payment Button */}
            <Button
              onClick={createPayment}
              disabled={!selectedCurrency || creatingPayment || availableCurrencies.length === 0}
              className="w-full h-12 text-lg"
            >
              {creatingPayment ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Creating Payment...
                </>
              ) : (
                <>
                  Create Payment
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
          </>
        ) : (
          /* Payment Created - Show Payment Details with Real-time Status */
          <>
            {/* Real-time Status Banner */}
            <Card className={`mb-6 ${statusConfig.bgColor} border ${statusConfig.borderColor}`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <StatusIcon className={`h-6 w-6 ${statusConfig.color} ${statusConfig.showSpinner ? 'animate-spin' : ''}`} />
                  <div className="flex-1">
                    <h3 className={`font-semibold ${statusConfig.color}`}>{statusConfig.title}</h3>
                    <p className="text-sm text-gray-600">{statusConfig.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className={`w-2 h-2 rounded-full ${statusChecking ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`} />
                      {statusChecking ? 'Checking...' : 'Live'}
                    </div>
                    {lastStatusCheck && (
                      <p className="text-xs text-gray-500">
                        Last check: {lastStatusCheck.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StatusIcon className={`h-6 w-6 ${statusConfig.color}`} />
                  Payment Details
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {currentStatus === 'waiting' ? 'Send the exact amount to the address below' :
                   currentStatus === 'confirming' ? 'Your payment is being confirmed on the blockchain' :
                   currentStatus === 'confirmed' ? 'Payment completed successfully' :
                   'Payment status updated'}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Payment Amount */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Amount to Send</Label>
                  <div className="mt-1">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCrypto(paymentData.pay_amount, paymentData.pay_currency.toUpperCase())}
                    </p>
                    <p className="text-sm text-gray-500">
                      ≈ {formatCurrency(paymentData.price_amount, paymentData.price_currency.toUpperCase())}
                    </p>
                  </div>
                </div>

                {/* Payment Address */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Payment Address</Label>
                  <div className="mt-1 flex gap-2">
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

                {/* Transaction Hash (if available) */}
                {paymentStatus?.tx_hash && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Transaction Hash</Label>
                    <div className="mt-1 flex gap-2">
                      <Input
                        value={paymentStatus.tx_hash}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(paymentStatus.tx_hash!)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {getBlockExplorerUrl(paymentStatus.tx_hash, paymentStatus.pay_currency) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const explorerUrl = getBlockExplorerUrl(paymentStatus.tx_hash!, paymentStatus.pay_currency)
                            if (explorerUrl) {
                              window.open(explorerUrl, '_blank')
                            }
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment Instructions */}
                {currentStatus === 'waiting' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">Important Instructions:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Send the exact amount shown above</li>
                      <li>• Use the exact address provided</li>
                      <li>• Payment will be confirmed automatically</li>
                      <li>• Do not close this page until payment is confirmed</li>
                    </ul>
                  </div>
                )}

                {/* Confirming Message */}
                {currentStatus === 'confirming' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">Payment Received!</h4>
                    <p className="text-sm text-blue-700">
                      Your payment has been detected and is being confirmed on the blockchain. This usually takes a few minutes.
                    </p>
                  </div>
                )}

                {/* Success Message */}
                {currentStatus === 'confirmed' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-2">Payment Confirmed!</h4>
                    <p className="text-sm text-green-700">
                      Your payment has been successfully processed. You will be redirected to the confirmation page shortly.
                    </p>
                  </div>
                )}

                {/* Failed Message */}
                {currentStatus === 'failed' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-800 mb-2">Payment Failed</h4>
                    <p className="text-sm text-red-700">
                      There was an issue with your payment. Please try creating a new payment or contact support.
                    </p>
                  </div>
                )}

                {/* Payment ID */}
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    Payment ID: {paymentData.payment_id}
                  </p>
                  {statusCheckCount > 0 && (
                    <p className="text-xs text-gray-400">
                      Status checks: {statusCheckCount}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

