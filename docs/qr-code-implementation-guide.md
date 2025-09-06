# Cryptrac Universal Crypto QR Code Generation – Implementation Guide

This guide explains how the QR code URI generation system is structured, how to extend it for wallets and exchanges, and how to validate behavior. It focuses on standards-first URIs with wallet-specific overrides and robust fallbacks.

## Architecture Overview

- Standard URI Builder: `lib/crypto-uri-builder.ts`
  - Generates standards-compliant URIs (BIP‑21, EIP‑681, Solana Pay, etc.).
  - Handles decimal rounding and consistent formatting.
  - Supports destination tags/memos for XRP/XLM/HBAR/EOS.
  - NEW: Full Solana Pay support, including optional `spl-token`, `reference[]`, `label`, `message`, and `memo`.

- Wallet Detection + Best URI: `lib/wallet-uri-helper.ts`
  - Detects active wallet hints (MetaMask, Trust, Phantom, Coinbase Wallet, OKX) via providers and UA.
  - Scores candidate URIs (wallet-specific, standard, address-only) and returns the best option.

- Wallet Overrides Catalog: `lib/wallet-uri-overrides.ts`
  - Static mapping of wallet-specific deeplinks per currency.
  - Updated Phantom overrides for Solana to use Solana Pay (`solana:`) instead of deprecated `phantom://`.
  - Trust Wallet links use `https://link.trustwallet.com` where provided for mobile-friendly fallback.
  - Coinbase Wallet (aka Base Wallet): currently standards-first (BIP-21/EIP-681). Universal links can be added when verified.

- QR Rendering: `app/components/ui/qr-code.tsx`
  - Generates a QR image from the chosen URI (uses QR Server API).

## Standards Adherence

- Bitcoin + UTXO (BIP‑21): `bitcoin:<address>?amount=<amount>`
  - Also applied to LTC (`litecoin:`), BCH (`bitcoincash:`), DOGE (`dogecoin:`), and added for DASH (`dash:`), ZEC (`zcash:`), RVN (`ravencoin:`), KAS (`kaspa:`).

- Ethereum (EIP‑681): `ethereum:<address>?value=<wei>[&chainId=<id>]`
  - ERC‑20: `ethereum:<contract>/transfer?address=<to>&uint256=<amount>[&chainId=<id>]`
  - Correct USDC mainnet contract: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`.

- Solana Pay: `solana:<recipient>?amount=<amount>&spl-token=<mint>&reference=<ref>&label=<label>&message=<msg>&memo=<memo>`
  - Implemented with multi‑reference support and optional metadata.

- Tron: `tron:<address>?amount=<amount>` (simple amount param for TRX).

- Extra ID chains: XRP (`xrp:` + `dt=`), XLM (`stellar:` + `memo=`), HBAR (`hbar:` + `memo=`), EOS (`eosio:` + `memo=`).

## Wallet‑Specific Deep Links

Wallet overrides are used when a wallet is detected and a known best scheme exists:

- MetaMask: Prefer official `https://metamask.app.link/send/...` formats for native and ERC‑20.
- Trust Wallet: Prefer `https://link.trustwallet.com/send?asset=...` with UAI format when available.
- Phantom: Use Solana Pay (`solana:`) for SOL and SPL transfers (universal links are primarily for swap/connect flows).
- Coinbase Wallet: No special EIP‑681 override currently; rely on standard and fallback (BIP‑21 for BTC, EIP‑681 for ETH). Detection supports "Coinbase Wallet" and "Base Wallet".
- OKX Wallet: Use standard schemes unless a confirmed payment deeplink is provided.

Notes:
- When no wallet hint is available, the system falls back to standards.
- On iOS, universal/https links are weighted higher by the scorer.

## Integration Points

1) Build a URI for a payment (standards‑first):

```ts
import { buildCryptoPaymentURI } from '@/lib/crypto-uri-builder';

const { uri } = buildCryptoPaymentURI({
  currency: 'ETH',
  address: '0xRecipient',
  amount: 0.05,
  label: 'Cryptrac Payment',
  message: 'Order #1234',
});
```

2) Build best URI (wallet + platform aware):

```ts
import { buildBestURI } from '@/lib/wallet-uri-helper';

const best = buildBestURI({
  currency: 'USDCSOL',
  address: 'RecipientSolPubkey',
  amount: 10,
});

// best.uri -> encode into QR
```

3) Solana Pay with extras (SPL token + reference + memo):

```ts
const { uri } = buildCryptoPaymentURI({
  currency: 'USDCSOL',
  address: 'RecipientSolPubkey',
  amount: 12.5,
  label: 'Cryptrac',
  message: 'Invoice 4567',
  memo: 'cryptrac-4567',
  reference: ['RefPubkey1', 'RefPubkey2'],
});
```

4) Render QR code:

```tsx
import { QRCode } from '@/app/components/ui/qr-code';

<QRCode value={best.uri} size={240} />
```

## Adding/Correcting Wallet Overrides

- File: `lib/wallet-uri-overrides.ts`
- Add/modify the `overrides` array for a currency code, with `wallet`, `scheme`, and a short `notes` string.
- Prefer official universal links (https) when the vendor documents them; otherwise use scheme URIs.

## Error Handling

- Address + amount validation occurs in `lib/uri-validation.ts`.
- Builder caps decimal precision (defaults to 6) and rounds amounts up to avoid underpayment.
- For extra‑ID chains, the builder places the memo/destination tag in the correct param.
- When an unknown currency/token is encountered, system falls back to address‑only (still scannable).

## Testing Plan (Summary)

1) Unit validation via `app/api/dev/uri-check/route.ts`:
   - Pass a merchant with wallets configured, exercise multiple codes and amounts.
   - Ensure chosen URIs include address and amount.

2) Mobile wallet scanning:
   - MetaMask: Native + ERC‑20 deeplinks; verify chain switching and amount auto‑fill.
   - Trust Wallet: UAI links with/without memo; verify amount and memo handling.
   - Phantom: SOL + SPL Solana Pay; verify label/message/memo/reference display.
   - Coinbase Wallet: BTC (BIP‑21) and ETH address‑only fallback.
   - OKX Wallet: Standard scheme scanning for ETH/SOL/TRX.

3) Hardware wallets:
   - Ledger Live mobile: Scan BIP‑21 (BTC) and EIP‑681 (ETH) URIs.
   - Trezor Suite mobile: Scan BIP‑21 (BTC) and evaluate ERC‑20 address‑only fallback.

4) Regression:
   - Verify all 142 approved codes at least return a valid address or standard URI.
   - Spot‑check top 20 by volume across chains.

## Notes on Exchange Apps

- Exchange deposit QR codes typically present addresses (no amounts) and are app‑controlled.
- Binance Pay, Kraken, Gemini, KuCoin, Bybit, Gate.io, Bitget often require proprietary payloads/APIs. Use address‑only or standards as fallback until official deep links are verified and added.
