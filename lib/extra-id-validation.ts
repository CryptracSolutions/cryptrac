export const EXTRA_ID_PATTERNS = {
  XRP: /^[0-9]{1,10}$/,
  XLM: /^.{1,28}$/
};

export const CURRENCIES_REQUIRING_EXTRA_ID = ['XRP', 'XLM'];

export function requiresExtraId(currency: string): boolean {
  return CURRENCIES_REQUIRING_EXTRA_ID.includes(currency.toUpperCase());
}

export function validateExtraId(currency: string, extraId: string): boolean {
  const pattern = EXTRA_ID_PATTERNS[currency.toUpperCase() as keyof typeof EXTRA_ID_PATTERNS];
  return pattern ? pattern.test(extraId) : false;
}

export function getExtraIdLabel(currency: string): string {
  switch (currency.toUpperCase()) {
    case 'XRP': return 'Destination Tag';
    case 'XLM': return 'Memo';
    default: return 'Extra ID';
  }
}

export function getExtraIdPlaceholder(currency: string): string {
  switch (currency.toUpperCase()) {
    case 'XRP': return 'Enter destination tag (e.g., 123456789)';
    case 'XLM': return 'Enter memo (e.g., cryptrac_merchant_001)';
    default: return 'Enter extra ID';
  }
}

export function getExtraIdDescription(currency: string): string {
  switch (currency.toUpperCase()) {
    case 'XRP': return 'Numeric destination tag (1-10 digits). Include only if your wallet or exchange requires it.';
    case 'XLM': return 'Memo (1-28 characters). Include only if your wallet or exchange requires it.';
    default: return 'Extra ID (only if required by your wallet)';
  }
}
