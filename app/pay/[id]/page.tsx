'use client'

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
        accepted_cryptos: paymentLinkData.accepted_cryptos,
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
      console.log('🔍 Accepted cryptos from payment link:', acceptedCryptos)
      
      const response = await fetch('/api/currencies?popular=false')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error('Failed to load currencies')
      }

      console.log('📊 Total currencies from API:', data.currencies.length)

      // Create comprehensive mapping between our internal currency codes and NOWPayments API codes
      const currencyCodeMapping: Record<string, string> = {
        // === USDT (Tether) Variants ===
        'USDT_SOL': 'USDTSOL',           // Tether on Solana
        'USDT_ERC20': 'USDTERC20',       // Tether on Ethereum
        'USDT_ETH': 'USDTERC20',         // Alternative naming for Ethereum
        'USDT_BSC': 'USDTBSC',           // Tether on BSC
        'USDT_BNB': 'USDTBSC',           // Alternative naming for BSC
        'USDT_POLYGON': 'USDTMATIC',     // Tether on Polygon
        'USDT_MATIC': 'USDTMATIC',       // Alternative naming for Polygon
        'USDT_AVALANCHE': 'USDTAVAX',    // Tether on Avalanche
        'USDT_AVAX': 'USDTAVAX',         // Alternative naming for Avalanche
        'USDT_TRON': 'USDTTRC20',        // Tether on Tron
        'USDT_TRX': 'USDTTRC20',         // Alternative naming for Tron
        'USDT_ARBITRUM': 'USDTARB',      // Tether on Arbitrum
        'USDT_ARB': 'USDTARB',           // Alternative naming for Arbitrum
        'USDT_OPTIMISM': 'USDTOP',       // Tether on Optimism
        'USDT_OP': 'USDTOP',             // Alternative naming for Optimism
        
        // === USDC (USD Coin) Variants ===
        'USDC_SOL': 'USDCSOL',           // USD Coin on Solana
        'USDC_ERC20': 'USDCERC20',       // USD Coin on Ethereum
        'USDC_ETH': 'USDCERC20',         // Alternative naming for Ethereum
        'USDC_BSC': 'USDCBSC',           // USD Coin on BSC
        'USDC_BNB': 'USDCBSC',           // Alternative naming for BSC
        'USDC_POLYGON': 'USDCMATIC',     // USD Coin on Polygon
        'USDC_MATIC': 'USDCMATIC',       // Alternative naming for Polygon
        'USDC_AVALANCHE': 'USDCAVAX',    // USD Coin on Avalanche
        'USDC_AVAX': 'USDCAVAX',         // Alternative naming for Avalanche
        'USDC_ARBITRUM': 'USDCARB',      // USD Coin on Arbitrum
        'USDC_ARB': 'USDCARB',           // Alternative naming for Arbitrum
        'USDC_OPTIMISM': 'USDCOP',       // USD Coin on Optimism
        'USDC_OP': 'USDCOP',             // Alternative naming for Optimism
        
        // === BUSD (Binance USD) Variants ===
        'BUSD_BSC': 'BUSDBSC',           // Binance USD on BSC
        'BUSD_BNB': 'BUSDBSC',           // Alternative naming for BSC
        'BUSD_ERC20': 'BUSDERC20',       // Binance USD on Ethereum
        'BUSD_ETH': 'BUSDERC20',         // Alternative naming for Ethereum
        
        // === DAI Variants ===
        'DAI_ERC20': 'DAIERC20',         // DAI on Ethereum
        'DAI_ETH': 'DAIERC20',           // Alternative naming for Ethereum
        'DAI_BSC': 'DAIBSC',             // DAI on BSC
        'DAI_BNB': 'DAIBSC',             // Alternative naming for BSC
        'DAI_POLYGON': 'DAIMATIC',       // DAI on Polygon
        'DAI_MATIC': 'DAIMATIC',         // Alternative naming for Polygon
        
        // === TUSD (TrueUSD) Variants ===
        'TUSD_ERC20': 'TUSDERC20',       // TrueUSD on Ethereum
        'TUSD_ETH': 'TUSDERC20',         // Alternative naming for Ethereum
        'TUSD_BSC': 'TUSDBSC',           // TrueUSD on BSC
        'TUSD_BNB': 'TUSDBSC',           // Alternative naming for BSC
        
        // === FRAX Variants ===
        'FRAX_ERC20': 'FRAXERC20',       // FRAX on Ethereum
        'FRAX_ETH': 'FRAXERC20',         // Alternative naming for Ethereum
        
        // === LUSD Variants ===
        'LUSD_ERC20': 'LUSDERC20',       // LUSD on Ethereum
        'LUSD_ETH': 'LUSDERC20',         // Alternative naming for Ethereum
        
        // === USDD Variants ===
        'USDD_TRON': 'USDDTRC20',        // USDD on Tron
        'USDD_TRX': 'USDDTRC20',         // Alternative naming for Tron
        
        // === USDP (Pax Dollar) Variants ===
        'USDP_ERC20': 'USDPERC20',       // USDP on Ethereum
        'USDP_ETH': 'USDPERC20',         // Alternative naming for Ethereum
        
        // === GUSD (Gemini Dollar) Variants ===
        'GUSD_ERC20': 'GUSDERC20',       // GUSD on Ethereum
        'GUSD_ETH': 'GUSDERC20',         // Alternative naming for Ethereum
        
        // === PYUSD (PayPal USD) Variants ===
        'PYUSD_ERC20': 'PYUSDERC20',     // PYUSD on Ethereum
        'PYUSD_ETH': 'PYUSDERC20',       // Alternative naming for Ethereum
        
        // === USDE (Ethena USDe) Variants ===
        'USDE_ERC20': 'USDEERC20',       // USDe on Ethereum
        'USDE_ETH': 'USDEERC20',         // Alternative naming for Ethereum
        
        // === FDUSD Variants ===
        'FDUSD_ERC20': 'FDUSDERC20',     // FDUSD on Ethereum
        'FDUSD_ETH': 'FDUSDERC20',       // Alternative naming for Ethereum
        'FDUSD_BSC': 'FDUSDBSC',         // FDUSD on BSC
        'FDUSD_BNB': 'FDUSDBSC',         // Alternative naming for BSC
      }

      // Create reverse mapping for NOWPayments codes to our internal codes
      const reverseMapping: Record<string, string> = {}
      Object.entries(currencyCodeMapping).forEach(([internal, nowpayments]) => {
        reverseMapping[nowpayments] = internal
      })

      // Convert accepted cryptos to NOWPayments format for filtering
      const nowpaymentsAcceptedCryptos = acceptedCryptos.map(crypto => 
        currencyCodeMapping[crypto] || crypto
      )

      console.log('🔍 Accepted cryptos (internal format):', acceptedCryptos)
      console.log('🔍 Accepted cryptos (NOWPayments format):', nowpaymentsAcceptedCryptos)

      // Define comprehensive stable coin associations based on NOWPayments API
      const stableCoinAssociations: Record<string, string[]> = {
        'ETH': [
          'USDT', 'USDTERC20',           // Tether variants
          'USDC', 'USDCERC20',           // USD Coin variants  
          'DAI', 'DAIERC20',             // DAI variants
          'BUSD', 'BUSDERC20',           // Binance USD variants
          'TUSD', 'TUSDERC20',           // TrueUSD variants
          'FRAXERC20',                   // FRAX
          'LUSDERC20',                   // LUSD
          'USDPERC20',                   // USDP (Pax Dollar)
          'GUSDERC20',                   // GUSD (Gemini Dollar)
          'PYUSDERC20',                  // PYUSD (PayPal USD)
          'USDEERC20',                   // USDE (Ethena USDe)
          'FDUSDERC20'                   // FDUSD
        ],
        'SOL': [
          'USDCSOL',                     // USD Coin on Solana
          'USDTSOL'                      // Tether on Solana
        ],
        'BNB': [
          'USDTBSC',                     // Tether on BSC
          'USDCBSC',                     // USD Coin on BSC
          'BUSDBSC',                     // Binance USD on BSC
          'DAIBSC',                      // DAI on BSC
          'TUSDBSC',                     // TrueUSD on BSC
          'FDUSDBSC'                     // FDUSD on BSC
        ],
        'MATIC': [
          'USDTMATIC',                   // Tether on Polygon
          'USDCMATIC',                   // USD Coin on Polygon
          'DAIMATIC'                     // DAI on Polygon
        ],
        'AVAX': [
          'USDTAVAX',                    // Tether on Avalanche
          'USDCAVAX'                     // USD Coin on Avalanche
        ],
        'TRX': [
          'USDTTRC20',                   // Tether on Tron
          'USDDTRC20'                    // USDD on Tron
        ],
        'ARB': [
          'USDTARB',                     // Tether on Arbitrum
          'USDCARB'                      // USD Coin on Arbitrum
        ],
        'OP': [
          'USDTOP',                      // Tether on Optimism
          'USDCOP'                       // USD Coin on Optimism
        ]
      }

      // Create expanded list including associated stable coins that exist in the API
      const expandedAcceptedCryptos = [...nowpaymentsAcceptedCryptos]
      
      // First, get all available currency codes from the API
      const availableCurrencyCodes = data.currencies.map((c: CurrencyInfo) => c.code)
      
      acceptedCryptos.forEach(crypto => {
        if (stableCoinAssociations[crypto]) {
          console.log(`🔗 Checking stable coins for ${crypto}:`, stableCoinAssociations[crypto])
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
              disabled={!selectedCurrency || creatingPayment}
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
          /* Payment Created - Show Payment Details */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                Payment Created
              </CardTitle>
              <p className="text-sm text-gray-600">
                Send the exact amount to the address below
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

              {/* Payment Status */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">Waiting for Payment</p>
                    <p className="text-sm text-yellow-700">
                      Send the exact amount to complete your payment
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment ID */}
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Payment ID: {paymentData.payment_id}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

