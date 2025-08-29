import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export const locales = ['en', 'es', 'fr'] as const;
export type Locale = typeof locales[number];

export const defaultLocale: Locale = 'en';

/**
 * Get the current locale from cookies or default to 'en'
 */
export function getCurrentLocale(): Locale {
  try {
    const cookieStore = cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value;
    return locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;
  } catch {
    return defaultLocale;
  }
}

/**
 * Translation utility for API error messages
 * This allows server-side API routes to return translated error messages
 */
export async function translateError(
  errorKey: string,
  locale: Locale = getCurrentLocale(),
  params?: Record<string, string | number>
): Promise<string> {
  try {
    // Dynamically import the translation file
    const messages = await import(`../messages/${locale}.json`);
    
    // Navigate to the error key (e.g., "errors.invalidEmail")
    const keys = errorKey.split('.');
    let translation: any = messages.default || messages;
    
    for (const key of keys) {
      translation = translation[key];
      if (!translation) break;
    }
    
    // If translation not found, fall back to English
    if (!translation && locale !== 'en') {
      return translateError(errorKey, 'en', params);
    }
    
    // If still not found, return the key itself
    if (!translation) {
      return errorKey;
    }
    
    // Replace parameters in the translation (e.g., {{amount}} -> $100)
    if (params && typeof translation === 'string') {
      return Object.entries(params).reduce((str, [key, value]) => {
        return str.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      }, translation);
    }
    
    return translation;
  } catch (error) {
    console.error('Translation error:', error);
    return errorKey;
  }
}

/**
 * Translation utility for success messages
 */
export async function translateSuccess(
  successKey: string,
  locale: Locale = getCurrentLocale(),
  params?: Record<string, string | number>
): Promise<string> {
  return translateError(successKey, locale, params);
}

/**
 * Translation utility for any message key
 */
export async function translate(
  messageKey: string,
  locale: Locale = getCurrentLocale(),
  params?: Record<string, string | number>
): Promise<string> {
  return translateError(messageKey, locale, params);
}

/**
 * Create a translated API response with proper structure
 */
export async function createTranslatedResponse(
  success: boolean,
  messageKey: string,
  data?: any,
  locale: Locale = getCurrentLocale(),
  params?: Record<string, string | number>
) {
  const message = await translate(messageKey, locale, params);
  
  return {
    success,
    message,
    data: data || null,
    ...(success ? {} : { error: message })
  };
}

/**
 * Helper to get request locale from headers or cookies
 */
export function getRequestLocale(request: Request): Locale {
  try {
    // Try to get locale from Accept-Language header
    const acceptLanguage = request.headers.get('Accept-Language');
    if (acceptLanguage) {
      const preferredLocale = acceptLanguage.split(',')[0].split('-')[0];
      if (locales.includes(preferredLocale as Locale)) {
        return preferredLocale as Locale;
      }
    }
    
    // Try to get locale from cookie in the request
    const cookieHeader = request.headers.get('Cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim());
      const localeCookie = cookies.find(c => c.startsWith('NEXT_LOCALE='));
      if (localeCookie) {
        const locale = localeCookie.split('=')[1];
        if (locales.includes(locale as Locale)) {
          return locale as Locale;
        }
      }
    }
    
    return defaultLocale;
  } catch {
    return defaultLocale;
  }
}

/**
 * Common error messages for API validation
 */
export const ErrorKeys = {
  // Generic errors
  GENERIC: 'errors.generic',
  NETWORK_ERROR: 'errors.networkError',
  UNAUTHORIZED: 'errors.unauthorized',
  FORBIDDEN: 'errors.forbidden',
  NOT_FOUND: 'errors.notFound',
  VALIDATION_ERROR: 'errors.validationError',
  SERVER_ERROR: 'errors.serverError',
  TIMEOUT: 'errors.timeout',
  RATE_LIMITED: 'errors.rateLimited',
  
  // Input validation
  INVALID_INPUT: 'errors.invalidInput',
  MISSING_FIELD: 'errors.missingField',
  INVALID_EMAIL: 'errors.invalidEmail',
  PASSWORD_TOO_SHORT: 'errors.passwordTooShort',
  PASSWORD_TOO_WEAK: 'errors.passwordTooWeak',
  
  // Authentication
  INVALID_CREDENTIALS: 'auth.invalidCredentials',
  EMAIL_REQUIRED: 'auth.emailRequired',
  PASSWORD_REQUIRED: 'auth.passwordRequired',
  PASSWORD_MISMATCH: 'auth.passwordMismatch',
  SESSION_NOT_AVAILABLE: 'auth.sessionNotAvailable',
  UNEXPECTED_ERROR: 'auth.unexpectedError',
  PLEASE_ENTER_CREDENTIALS: 'auth.pleaseEnterCredentials',
  
  // Payment errors
  PAYMENT_FAILED: 'errors.paymentFailed',
  INSUFFICIENT_FUNDS: 'errors.insufficientFunds',
  WALLET_NOT_FOUND: 'errors.walletNotFound',
  INVALID_WALLET_ADDRESS: 'errors.invalidWalletAddress',
  CURRENCY_NOT_SUPPORTED: 'errors.currencyNotSupported',
  EXPIRED_PAYMENT: 'errors.expiredPayment',
  DUPLICATE_PAYMENT: 'errors.duplicatePayment',
  TRANSACTION_NOT_FOUND: 'errors.transactionNotFound'
} as const;

/**
 * Success message keys
 */
export const SuccessKeys = {
  // Generic success
  GENERIC: 'success.generic',
  SAVED: 'success.saved',
  CREATED: 'success.created',
  UPDATED: 'success.updated',
  DELETED: 'success.deleted',
  SENT: 'success.sent',
  COPIED: 'success.copied',
  EXPORTED: 'success.exported',
  IMPORTED: 'success.imported',
  
  // Specific operations
  PAYMENT_COMPLETED: 'success.paymentCompleted',
  SUBSCRIPTION_CREATED: 'success.subscriptionCreated',
  INVOICE_GENERATED: 'success.invoiceGenerated',
  WALLET_ADDED: 'success.walletAdded',
  PROFILE_UPDATED: 'success.profileUpdated',
  SETTINGS_SAVED: 'success.settingsSaved'
} as const;

// Next.js internationalization config
export default getRequestConfig(async ({ locale }) => {
  return {
    messages: (await import(`../messages/${locale}.json`)).default
  };
});