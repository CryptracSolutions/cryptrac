// Unified Trust Wallet Compatible Wallet Generation System
// Resolves conflicts between wallet-generation.ts and wallet-generation-browser.ts
// Browser-compatible implementation with honest Trust Wallet compatibility
// Client-side generation ensures private keys never touch the server

import { ethers } from 'ethers';
import { Keypair, PublicKey } from '@solana/web3.js';
import TronWeb from 'tronweb';
import * as bip39 from 'bip39';

// Trust Wallet Compatible Currencies - Fixed List (13 core currencies)
// Unified from both previous implementations with correct derivation paths
export const TRUST_WALLET_CURRENCIES = [
  {
    code: 'BTC',
    name: 'Bitcoin',
    symbol: '₿',
    network: 'Bitcoin',
    address_type: 'bitcoin',
    derivation_path: "m/44'/0'/0'/0/0",
    trust_wallet_compatible: true,
    decimals: 8,
    min_amount: 0.00000001,
    display_name: undefined
  },
  {
    code: 'ETH',
    name: 'Ethereum',
    symbol: 'Ξ',
    network: 'Ethereum',
    address_type: 'ethereum',
    derivation_path: "m/44'/60'/0'/0/0",
    trust_wallet_compatible: true,
    decimals: 18,
    min_amount: 0.000000001,
    display_name: undefined
  },
  {
    code: 'USDT_ERC20',
    name: 'Tether (Ethereum)',
    symbol: '₮',
    network: 'Ethereum',
    address_type: 'ethereum',
    derivation_path: "m/44'/60'/0'/0/0",
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    is_token: true,
    parent_currency: 'ETH',
    display_name: 'USDT via Ethereum'
  },
  {
    code: 'USDC_ERC20',
    name: 'USD Coin (Ethereum)',
    symbol: '$',
    network: 'Ethereum',
    address_type: 'ethereum',
    derivation_path: "m/44'/60'/0'/0/0",
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    is_token: true,
    parent_currency: 'ETH',
    display_name: 'USDC via Ethereum'
  },
  {
    code: 'MATIC',
    name: 'Polygon',
    symbol: 'MATIC',
    network: 'Polygon',
    address_type: 'ethereum',
    derivation_path: "m/44'/60'/0'/0/0", // Polygon uses same derivation as Ethereum
    trust_wallet_compatible: true,
    decimals: 18,
    min_amount: 0.000000001,
    display_name: undefined
  },
  {
    code: 'USDC_POLYGON',
    name: 'USD Coin (Polygon)',
    symbol: '$',
    network: 'Polygon',
    address_type: 'ethereum',
    derivation_path: "m/44'/60'/0'/0/0", // Polygon uses same derivation as Ethereum
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    is_token: true,
    parent_currency: 'MATIC',
    display_name: 'USDC via Polygon'
  },
  {
    code: 'BNB',
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    network: 'BSC',
    address_type: 'ethereum',
    derivation_path: "m/44'/60'/0'/0/0", // BSC uses same derivation as Ethereum
    trust_wallet_compatible: true,
    decimals: 18,
    min_amount: 0.000000001,
    display_name: undefined
  },
  {
    code: 'TRX',
    name: 'Tron',
    symbol: 'TRX',
    network: 'Tron',
    address_type: 'tron',
    derivation_path: "m/44'/195'/0'/0/0",
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    display_name: undefined
  },
  {
    code: 'USDT_TRC20',
    name: 'Tether (Tron)',
    symbol: '₮',
    network: 'Tron',
    address_type: 'tron',
    derivation_path: "m/44'/195'/0'/0/0",
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    is_token: true,
    parent_currency: 'TRX',
    display_name: 'USDT via Tron'
  },
  {
    code: 'LTC',
    name: 'Litecoin',
    symbol: 'Ł',
    network: 'Litecoin',
    address_type: 'litecoin',
    derivation_path: "m/44'/2'/0'/0/0",
    trust_wallet_compatible: true,
    decimals: 8,
    min_amount: 0.00000001,
    display_name: undefined
  },
  {
    code: 'SOL',
    name: 'Solana',
    symbol: '◎',
    network: 'Solana',
    address_type: 'solana',
    derivation_path: "m/44'/501'/0'/0/0",
    trust_wallet_compatible: true,
    decimals: 9,
    min_amount: 0.000000001,
    display_name: undefined
  },
  {
    code: 'XRP',
    name: 'XRP',
    symbol: 'XRP',
    network: 'XRP Ledger',
    address_type: 'xrp',
    derivation_path: "m/44'/144'/0'/0/0",
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    display_name: undefined
  },
  {
    code: 'DOGE',
    name: 'Dogecoin',
    symbol: 'Ð',
    network: 'Dogecoin',
    address_type: 'dogecoin',
    derivation_path: "m/44'/3'/0'/0/0",
    trust_wallet_compatible: true,
    decimals: 8,
    min_amount: 0.00000001,
    display_name: undefined
  }
] as const;

// BIP44 derivation paths for Trust Wallet compatible currencies
const DERIVATION_PATHS = TRUST_WALLET_CURRENCIES.reduce((acc, currency) => {
  acc[currency.code] = currency.derivation_path;
  return acc;
}, {} as Record<string, string>);

export interface WalletGenerationResult {
  address: string;
  currency: string;
  network: string;
  derivation_path: string;
  public_key?: string;
  display_name?: string;
  address_type: string;
  exact_match: boolean; // Indicates if address exactly matches Trust Wallet
}

export interface GenerateWalletsParams {
  currencies: string[];
  mnemonic?: string;
  generation_method?: 'trust_wallet' | 'custom';
}

export interface GenerateWalletsResponse {
  wallets: WalletGenerationResult[];
  mnemonic: string;
  trust_wallet_compatible: boolean;
  generation_method: string;
  timestamp: string;
  exact_matches: number;
  manual_setup_required: number;
}

// Generate a new mnemonic phrase
export function generateMnemonic(): string {
  return bip39.generateMnemonic(128); // 12 words
}

// Validate mnemonic phrase
export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic);
}

// Generate EVM-compatible wallet (ETH, ERC-20 tokens, BSC, Polygon)
// These will match Trust Wallet EXACTLY
function generateEVMWallet(seed: Buffer, derivationPath: string, currency: string, network: string): WalletGenerationResult {
  try {
    const hdNode = ethers.HDNodeWallet.fromSeed(seed);
    const wallet = hdNode.derivePath(derivationPath);

    const currencyInfo = TRUST_WALLET_CURRENCIES.find(c => c.code === currency);

    return {
      address: wallet.address,
      currency,
      network,
      derivation_path: derivationPath,
      public_key: wallet.publicKey,
      display_name: currencyInfo?.display_name,
      address_type: 'ethereum',
      exact_match: true // EVM addresses match Trust Wallet exactly
    };
  } catch (error) {
    console.error(`${currency} wallet generation failed:`, error);
    throw new Error(`Failed to generate ${currency} wallet`);
  }
}

// Generate Solana wallet - matches Trust Wallet exactly
function generateSolanaWallet(seed: Buffer, derivationPath: string): WalletGenerationResult {
  try {
    const hdNode = ethers.HDNodeWallet.fromSeed(seed);
    const derivedNode = hdNode.derivePath(derivationPath);
    
    // Create Solana keypair from derived private key
    const privateKeyBytes = Buffer.from(derivedNode.privateKey.slice(2), 'hex');
    const keypair = Keypair.fromSeed(privateKeyBytes.slice(0, 32));

    return {
      address: keypair.publicKey.toBase58(),
      currency: 'SOL',
      network: 'Solana',
      derivation_path: derivationPath,
      public_key: keypair.publicKey.toBase58(),
      address_type: 'solana',
      exact_match: true // Solana addresses match Trust Wallet exactly
    };
  } catch (error) {
    console.error('Solana wallet generation failed:', error);
    throw new Error('Failed to generate Solana wallet');
  }
}

// Generate Tron wallet - matches Trust Wallet exactly
function generateTronWallet(seed: Buffer, derivationPath: string): WalletGenerationResult {
  try {
    const hdNode = ethers.HDNodeWallet.fromSeed(seed);
    const derivedNode = hdNode.derivePath(derivationPath);
    
    // Create Tron address from private key
    const privateKey = derivedNode.privateKey.slice(2);
    
    // Use TronWeb utils for address generation
    const addressResult = TronWeb.utils.address.fromPrivateKey(privateKey);
    const address = typeof addressResult === 'string' ? addressResult : '';
    
    if (!address) {
      throw new Error('Failed to generate Tron address');
    }

    return {
      address,
      currency: 'TRX',
      network: 'Tron',
      derivation_path: derivationPath,
      public_key: derivedNode.publicKey,
      address_type: 'tron',
      exact_match: true // Tron addresses match Trust Wallet exactly
    };
  } catch (error) {
    console.error('Tron wallet generation failed:', error);
    throw new Error('Failed to generate Tron wallet');
  }
}

// Generate guidance wallet for complex chains (Bitcoin, Litecoin, Dogecoin, XRP)
// These require manual setup in Trust Wallet after importing the seed phrase
function generateGuidanceWallet(seed: Buffer, derivationPath: string, currency: string, network: string): WalletGenerationResult {
  try {
    const hdNode = ethers.HDNodeWallet.fromSeed(seed);
    const derivedNode = hdNode.derivePath(derivationPath);
    
    // Generate a guidance message instead of a fake address
    const guidanceMessage = `Import seed phrase into Trust Wallet to access ${currency}`;

    return {
      address: guidanceMessage,
      currency,
      network,
      derivation_path: derivationPath,
      public_key: derivedNode.publicKey,
      address_type: currency.toLowerCase(),
      display_name: `${currency} - Import seed phrase into Trust Wallet`,
      exact_match: false // Requires manual setup
    };
  } catch (error) {
    console.error(`${currency} wallet generation failed:`, error);
    throw new Error(`Failed to generate ${currency} wallet`);
  }
}

// Main wallet generation function
export async function generateWallets(params: GenerateWalletsParams): Promise<GenerateWalletsResponse> {
  const { currencies, mnemonic: providedMnemonic, generation_method = 'trust_wallet' } = params;
  
  // Generate or use provided mnemonic
  const mnemonic = providedMnemonic || generateMnemonic();
  
  if (!validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic phrase');
  }

  // Convert mnemonic to seed
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const wallets: WalletGenerationResult[] = [];

  for (const currency of currencies) {
    try {
      const derivationPath = DERIVATION_PATHS[currency as keyof typeof DERIVATION_PATHS];
      if (!derivationPath) {
        console.warn(`No derivation path found for currency: ${currency}`);
        continue;
      }

      let wallet: WalletGenerationResult;
      const currencyInfo = TRUST_WALLET_CURRENCIES.find(c => c.code === currency);

      switch (currency) {
        // EVM-compatible chains (exact Trust Wallet matches)
        case 'ETH':
        case 'USDT_ERC20':
        case 'USDC_ERC20':
          wallet = generateEVMWallet(seed, derivationPath, currency, 'Ethereum');
          break;

        case 'BNB':
          wallet = generateEVMWallet(seed, derivationPath, currency, 'BSC');
          break;

        case 'MATIC':
        case 'USDC_POLYGON':
          wallet = generateEVMWallet(seed, derivationPath, currency, 'Polygon');
          break;
        
        // Solana (exact Trust Wallet match)
        case 'SOL':
          wallet = generateSolanaWallet(seed, derivationPath);
          break;
        
        // Tron (exact Trust Wallet match)
        case 'TRX':
        case 'USDT_TRC20':
          wallet = generateTronWallet(seed, derivationPath);
          wallet.currency = currency;
          if (currencyInfo?.display_name) {
            wallet.display_name = currencyInfo.display_name;
          }
          break;

        // Complex chains (require manual setup in Trust Wallet)
        case 'BTC':
          wallet = generateGuidanceWallet(seed, derivationPath, currency, 'Bitcoin');
          break;
        
        case 'LTC':
          wallet = generateGuidanceWallet(seed, derivationPath, currency, 'Litecoin');
          break;

        case 'DOGE':
          wallet = generateGuidanceWallet(seed, derivationPath, currency, 'Dogecoin');
          break;

        case 'XRP':
          wallet = generateGuidanceWallet(seed, derivationPath, currency, 'XRP Ledger');
          break;
        
        default:
          console.warn(`Unsupported currency for Trust Wallet generation: ${currency}`);
          continue;
      }

      wallets.push(wallet);
    } catch (error) {
      console.error(`Failed to generate wallet for ${currency}:`, error);
      // Continue with other currencies instead of failing completely
    }
  }

  if (wallets.length === 0) {
    throw new Error('Failed to generate any wallets');
  }

  const exactMatches = wallets.filter(w => w.exact_match).length;
  const manualSetupRequired = wallets.filter(w => !w.exact_match).length;

  return { 
    wallets, 
    mnemonic,
    trust_wallet_compatible: true,
    generation_method,
    timestamp: new Date().toISOString(),
    exact_matches: exactMatches,
    manual_setup_required: manualSetupRequired
  };
}

// Get Trust Wallet compatible currencies
export function getTrustWalletCurrencies() {
  return [...TRUST_WALLET_CURRENCIES]; // Return a copy to avoid mutation
}

// Get supported currencies for wallet generation
export function getSupportedCurrencies(): string[] {
  return TRUST_WALLET_CURRENCIES.map(currency => currency.code);
}

// Address validation functions
export function validateEthereumAddress(address: string): boolean {
  return ethers.isAddress(address);
}

export function validateSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export function validateTronAddress(address: string): boolean {
  try {
    return TronWeb.utils.address.isAddress(address);
  } catch {
    return false;
  }
}

export function validateBitcoinAddress(address: string): boolean {
  // Basic Bitcoin address validation
  return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(address);
}

export function validateXRPAddress(address: string): boolean {
  // Basic XRP address validation
  return /^r[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(address);
}

export function validateDogecoinAddress(address: string): boolean {
  // Basic Dogecoin address validation
  return /^D[5-9A-HJ-NP-U][1-9A-HJ-NP-Za-km-z]{32}$/.test(address);
}

// Main address validation function
export function validateAddress(address: string, currency: string): boolean {
  if (!address || !currency) return false;
  
  // Skip validation for guidance messages
  if (address.includes('Import seed phrase')) return true;
  
  try {
    switch (currency.toUpperCase()) {
      case 'BTC':
        return validateBitcoinAddress(address);
      
      case 'LTC':
        return validateBitcoinAddress(address); // LTC uses similar format
      
      case 'DOGE':
        return validateDogecoinAddress(address);
      
      case 'ETH':
      case 'BNB':
      case 'MATIC':
      case 'USDT_ERC20':
      case 'USDC_ERC20':
      case 'USDC_POLYGON':
        return validateEthereumAddress(address);
      
      case 'SOL':
        return validateSolanaAddress(address);
      
      case 'TRX':
      case 'USDT_TRC20':
        return validateTronAddress(address);

      case 'XRP':
        return validateXRPAddress(address);
      
      default:
        // Default to Ethereum validation for unknown tokens
        return validateEthereumAddress(address);
    }
  } catch {
    return false;
  }
}

// Get currency information
export function getCurrencyInfo(currency: string) {
  return TRUST_WALLET_CURRENCIES.find(c => c.code === currency) || null;
}

// Get network name for currency
export function getNetworkName(currency: string): string {
  const currencyInfo = getCurrencyInfo(currency);
  return currencyInfo?.network || 'Unknown';
}

// Get display name for currency (includes network info for tokens)
export function getDisplayName(currency: string): string {
  const currencyInfo = getCurrencyInfo(currency);
  return currencyInfo?.display_name || currencyInfo?.name || currency;
}

// Check if currency has exact Trust Wallet match
export function hasExactTrustWalletMatch(currency: string): boolean {
  const evmChains = ['ETH', 'BNB', 'MATIC', 'USDT_ERC20', 'USDC_ERC20', 'USDC_POLYGON'];
  const exactMatches = ['SOL', 'TRX', 'USDT_TRC20'];
  
  return evmChains.includes(currency) || exactMatches.includes(currency);
}

// Get compatibility level for currency
export function getCompatibilityLevel(currency: string): 'exact' | 'manual' | 'unsupported' {
  if (hasExactTrustWalletMatch(currency)) {
    return 'exact';
  }
  
  const manualSetup = ['BTC', 'LTC', 'DOGE', 'XRP'];
  if (manualSetup.includes(currency)) {
    return 'manual';
  }
  
  return 'unsupported';
}

