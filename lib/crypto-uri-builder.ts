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

// Round UP to avoid underpayment due to wallet truncation
function ceilToDecimals(value: number, decimals: number): number {
  if (!Number.isFinite(value)) return 0
  const factor = Math.pow(10, decimals)
  // Add a tiny epsilon to protect against floating point artifacts that could round down
  return Math.ceil((value + Number.EPSILON) * factor) / factor
}

export function formatAmountForDisplay(amount: number): string {
  if (!Number.isFinite(amount)) return '0.00000'
  const roundedUp = ceilToDecimals(amount, 5)
  return roundedUp.toFixed(5)
}

export function buildCryptoPaymentURI(request: CryptoPaymentRequest): URIResult {
  const { currency, address, extraId, amount } = request
  const upper = (currency || '').toUpperCase()
  const needsExtraId = ['XRP', 'XLM', 'EOS'].includes(upper)
  // Always return address-only for broad wallet compatibility
  const uri = address
  return {
    uri,
    includesAmount: false,
    includesExtraId: false,
    scheme: 'address',
    fallbackAddress: address,
    roundedAmount: ceilToDecimals(amount, 5),
    formattedAmount: formatAmountForDisplay(amount),
  }
}
