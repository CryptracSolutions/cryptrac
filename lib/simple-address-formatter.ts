import { APPROVED_CURRENCIES } from './approved-currencies'

export interface AddressFormatResult {
  qrContent: string
  displayAddress: string
  needsExtraId: boolean
  extraIdLabel?: string
}

// Currencies that require extra IDs (destination tags, memos, etc.)
const EXTRA_ID_CURRENCIES: Record<string, string> = {
  XRP: 'Destination Tag',
  XLM: 'Memo',
  EOS: 'Memo',
}

export function formatAddressForQR(
  currency: string,
  address: string,
  extraId?: string
): AddressFormatResult {
  const upperCurrency = (currency || '').toUpperCase()
  const needsExtraId = upperCurrency in EXTRA_ID_CURRENCIES
  const extraIdLabel = EXTRA_ID_CURRENCIES[upperCurrency]

  // For currencies that need extra IDs, append with colon separator
  const qrContent = needsExtraId && extraId ? `${address}:${extraId}` : address

  return {
    qrContent,
    displayAddress: address,
    needsExtraId,
    extraIdLabel,
  }
}

// Simple validation - just check if address looks valid
export function isValidAddress(address: string): boolean {
  return !!address && address.length > 10 && !/\s/.test(address)
}

