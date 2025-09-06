// Simplified address-only URI builder for QR code generation
// Backwards-compatible surface: exports buildCryptoPaymentURI and formatAmountForDisplay

export interface CryptoPaymentRequest {
  currency: string
  address: string
  amount: number
  extraId?: string // Destination tag, memo, etc.
  label?: string
  message?: string
}

export interface URIResult {
  uri: string
  includesAmount: boolean
  includesExtraId: boolean
  scheme: string
  fallbackAddress: string
  roundedAmount: number
  formattedAmount: string
}

export function formatAmountForDisplay(amount: number): string {
  return Number.isFinite(amount) ? amount.toFixed(6) : '0.000000'
}

export function buildCryptoPaymentURI(request: CryptoPaymentRequest): URIResult {
  const { currency, address, extraId, amount } = request
  const upper = (currency || '').toUpperCase()
  const needsExtraId = ['XRP', 'XLM', 'HBAR', 'EOS'].includes(upper)
  const uri = needsExtraId && extraId ? `${address}:${extraId}` : address
  return {
    uri,
    includesAmount: false,
    includesExtraId: !!(needsExtraId && extraId),
    scheme: 'address',
    fallbackAddress: address,
    roundedAmount: amount,
    formattedAmount: formatAmountForDisplay(amount),
  }
}

