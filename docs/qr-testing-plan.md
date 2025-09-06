# QR Code Testing Plan

This plan validates Cryptrac’s QR URIs across standards, wallets, and platforms.

## Scenarios

- Standards: BIP‑21 (BTC/LTC/BCH/DASH/ZEC/RVN/KAS), EIP‑681 (ETH + ERC‑20), Solana Pay (SOL/SPL), TRX (Tron), XRP/XLM/HBAR/EOS with memos.
- Wallets: MetaMask, Trust Wallet, Phantom, Coinbase Wallet, OKX Wallet.
 - Wallets: MetaMask, Trust Wallet, Phantom, Coinbase Wallet (Base), OKX Wallet, Binance App.
 - Hardware: Ledger Live, Trezor Suite.
 - Exchanges: Kraken, Gemini, KuCoin, Bybit, Gate.io, Bitget.
- Platforms: iOS, Android, Desktop (browser extensions).

## Methods

- Automated sanity: `GET /api/dev/uri-check?merchant_id=...&amount=...&codes=...`.
  - Confirms address and amount inclusion; falls back to standard if an override fails validation.
- Manual scan matrix: Device x Wallet x Chain.
  - Validate auto‑fill of address and amount; for memo chains ensure extra ID is displayed.
  - For Solana Pay, confirm label/message/memo appear as expected; reference(s) visible in transaction explorer.
  - For Coinbase Wallet, verify BTC (BIP‑21) and ETH (EIP‑681) flows.
  - For OKX Wallet, verify wrapper URI opens and populates.
  - For Ledger Live and Trezor Suite, verify BIP‑21 (BTC) and EIP‑681 (ETH) links open/parse correctly on mobile.
  - For exchange apps, test scanning BIP‑21/EIP‑681 where applicable.

## Pass Criteria

- 95%+ of top 20 coins by volume auto‑fill address and amount in at least one major wallet.
- 100% of approved codes generate a scannable URI or raw address.
- No malformed URIs; no partial underpayment risk due to rounding.
 - 0 deprecated Phantom links (phantom://) in generated URIs; all Solana uses Solana Pay.
