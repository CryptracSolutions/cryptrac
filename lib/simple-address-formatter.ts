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

  // For maximum wallet compatibility, always encode ONLY the address in the QR.
  // Extra IDs (destination tags, memos, etc.) are displayed separately for the user
  // to copy/paste when required by their wallet or exchange.
  const qrContent = address

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
