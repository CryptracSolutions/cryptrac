# QR Code Standards Research Findings

## Key Standards Identified

### BIP-21 (Bitcoin Improvement Proposal 21)
- Standard format for Bitcoin QR codes: `bitcoin:<address>?amount=<amount>&label=<label>&message=<message>`
- Widely supported by Bitcoin wallets
- Industry standard for UTXO-based cryptocurrencies

### EIP-681 (Ethereum Improvement Proposal 681)
- Standard for Ethereum payment URIs
- Format: `ethereum:<address>?value=<wei_amount>&chainId=<chain_id>`
- For ERC-20 tokens: `ethereum:<contract_address>/transfer?address=<recipient>&uint256=<amount>`

### EIP-831 (Ethereum Improvement Proposal 831)
- Extension of EIP-681 for more complex Ethereum transactions

## Compatibility Issues Discovered

### Major Problem: Inconsistent Wallet Support
- **Key Finding**: "No wallets actually support everything in EIP-681 and EIP-831"
- Coinbase uses EIP-681, creating compatibility issues with wallets using older standards
- QR codes are described as "very problematic" due to these compatibility issues

### Wallet-Specific Compatibility
- **Coinbase Wallet**: Supports BIP-21 ✓, Does NOT support EIP-681 ❌
- **Bitcoin.com Wallet**: Has issues with EIP-681, requires "legacy address" option for third-party wallet compatibility

## Research Sources
- cypherpunk.org analysis of cryptocurrency URIs (2019)
- Coinbase vs ZenGo QR code standards dispute (CoinDesk, 2021)
- ArcBlock ERC-681 analysis (2024)
- Various wallet compatibility reports

## Next Research Areas
1. Specific wallet deep linking schemes (MetaMask, Trust Wallet, Phantom)
2. Exchange QR scanner requirements (Binance, Coinbase, Kraken, etc.)
3. Hardware wallet QR support (Ledger Live, Trezor Suite)
4. Mobile vs desktop wallet differences



## MetaMask Deep Linking Specifications

### Official MetaMask Deep Link Formats

#### 1. Open Dapp in In-App Browser
```
https://metamask.app.link/dapp/{dappUrl}
```

#### 2. Send Native Currency
```
https://metamask.app.link/send/{recipient}@{chainId}?value={wei_amount}
```
- `recipient`: Address of the recipient
- `chainId`: (Optional) Chain ID of the network to use
- `value`: Amount to be transferred, in the native currency's smallest unit (wei)

**Example**: Send 0.01 POL (1e16 wei) on Polygon (chain ID 137)
```
https://metamask.app.link/send/0x0000000@137?value=1e16
```

#### 3. Send ERC-20 Token
```
https://metamask.app.link/send/{contractAddress}@{chainId}/transfer?address={recipient}&uint256={token_amount}
```
- `contractAddress`: Contract address of the ERC-20 token
- `chainId`: (Optional) Chain ID of the network to use
- `address`: Address of the recipient
- `uint256`: Amount to be transferred, in the token's smallest unit

**Example**: Send 1 USDC (1e6 units) on Linea (chain ID 59144)
```
https://metamask.app.link/send/0x176211869cA2b568f2A7D4EE941E073a821EE1ff@59144/transfer?address=0x0000000&uint256=1e6
```

#### 4. Buy Crypto (On-ramp)
```
https://metamask.app.link/buy?chainId={chainId}&address={contractAddress}&amount={fiat_amount}
```

#### 5. Sell Crypto (Off-ramp)
```
https://metamask.app.link/sell?chainId={chainId}&amount={crypto_amount}
```

### Key Insights for QR Code Generation
1. **QR Code Conversion**: MetaMask documentation explicitly states "You can also convert deeplinks to QR codes, so users can scan them with a mobile device"
2. **Automatic Network Switching**: If chainId is specified, MetaMask automatically switches to the correct network
3. **Fallback Behavior**: If user doesn't have the mobile app installed, deeplinks route to a landing page for app download
4. **Amount Precision**: Native currency amounts must be in wei (smallest unit), ERC-20 amounts in token's smallest unit


## Trust Wallet Deep Linking Specifications

### Official Trust Wallet Deep Link Formats

Trust Wallet supports two URL schemes:
- `https://link.trustwallet.com` - Routes to download page if app not installed, otherwise deeplinks
- `trust://` - Direct deeplink (use only when app is known to be installed)

#### 1. Send Payment (Most Important for QR Codes)
```
https://link.trustwallet.com/send?asset={UAI_format}&address={recipient}&amount={amount}&memo={memo}&data={data}
```

**Parameters:**
- `asset`: Asset in UAI (Universal Asset Identifier) format
- `address`: Recipient address (required)
- `amount`: Payment amount (optional)
- `memo`: Memo field (optional)
- `data`: Additional data (optional)

**Example**: Send 1 DAI to address
```
https://link.trustwallet.com/send?asset=c60_t0x6B175474E89094C44Da98b954EedeAC495271d0F&address=0x650b5e446edabad7eba7fa7bb2f6119b2630bfbb&amount=1&memo=test
```

#### 2. UAI Format (Universal Asset Identifier)
Trust Wallet uses a specific format for identifying assets:
- Native coins: `c{slip44_index}` (e.g., `c60` for Ethereum, `c0` for Bitcoin)
- ERC-20 tokens: `c60_t{contract_address}` (e.g., `c60_t0x6B175474E89094C44Da98b954EedeAC495271d0F` for DAI)

#### 3. Other Deep Link Functions
- **Open Coin**: `https://link.trustwallet.com/open_coin?asset={UAI}`
- **Add Asset**: `https://link.trustwallet.com/add_asset?asset={UAI}`
- **Swap**: `https://link.trustwallet.com/swap?from={UAI}&to={UAI}`
- **Buy Crypto**: `https://link.trustwallet.com/buy?asset={UAI}&provider={provider}&payment_method={method}`
- **DApp Browser**: `https://link.trustwallet.com/open_url?coin_id={slip44}&url={url}`

### Key Insights for QR Code Generation
1. **UAI Format Critical**: Trust Wallet requires specific Universal Asset Identifier format
2. **Amount Optional**: Amount parameter is optional, allowing for address-only QR codes
3. **Memo Support**: Built-in support for memo fields (important for XRP, XLM, etc.)
4. **Fallback Behavior**: HTTPS links provide app download fallback
5. **Multi-Network Support**: Uses SLIP-44 coin indices for network identification


## Phantom Wallet Deep Linking Specifications

### Official Phantom Deep Link Formats

Phantom supports two URL schemes:
- `https://phantom.app/ul/<version>/<method>` (recommended - universal links)
- `phantom://<version>/<method>` (custom protocol, not recommended)

**Current Status**: Only Solana is supported for deeplinks as of v22.04.11

#### 1. Swap Deep Link (Most Relevant for Payments)
```
https://phantom.app/ul/v1/swap?buy={CAIP-19_address}&sell={CAIP-19_address}
```

**Parameters:**
- `buy`: CAIP-19 address of token to buy, URL-encoded (defaults to SOL if omitted)
- `sell`: CAIP-19 address of token to sell, URL-encoded (defaults to SOL if omitted)

**Examples:**
- Swap SOL to WIF: `https://phantom.app/ul/v1/swap/?buy=solana%3A101%2Faddress%3AEKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm&sell=`
- Bridge USDC (Solana) to USDT (Ethereum): `https://phantom.app/ul/v1/swap/?buy=eip155%3A1%2Faddress%3A0xdAC17F958D2ee523a2206206994597C13D831ec7&sell=solana%3A101%2Faddress%3AEPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`

#### 2. CAIP-19 Format (Chain Agnostic Improvement Proposal)
Phantom uses CAIP-19 standard for asset identification:
- Solana: `solana:101/address:{mint_address}`
- Ethereum: `eip155:1/address:{contract_address}`

#### 3. Provider Methods
All provider methods follow format: `https://phantom.app/ul/<version>/<method>`

### Key Insights for QR Code Generation
1. **Universal Links Preferred**: HTTPS links recommended over custom protocol
2. **CAIP-19 Standard**: Uses standardized chain-agnostic asset identification
3. **Cross-Chain Support**: Can bridge between Solana and Ethereum
4. **No Session Required**: Swap deeplinks don't require prior connection
5. **Mobile App Only**: Deeplinks must be handled by app or tapped by user (not for web browsers)
6. **Solana Focus**: Currently only supports Solana blockchain for deeplinks


## Solana Pay Specification (Official Standard)

### Summary
- **Standard protocol** to encode Solana transaction requests within URLs
- **Inspiration**: Based on BIP-21 (Bitcoin) and EIP-681 (Ethereum) standards
- **Implementation Status**: Rough consensus reached, implemented in Phantom, FTX, and Slope wallets
- **QR Code Integration**: URLs can be encoded in QR codes or NFC tags

### Transfer Request Format
```
solana:<recipient>
    ?amount=<amount>
    &spl-token=<spl-token>
    &reference=<reference>
    &label=<label>
    &message=<message>
    &memo=<memo>
```

#### Parameters Specification

**1. Recipient** (Required)
- **Format**: Base58-encoded public key of native SOL account
- **Usage**: Single field as pathname
- **Note**: Associated token accounts must not be used directly

**2. Amount** (Optional)
- **Format**: Non-negative integer or decimal number in "user" units
- **For SOL**: Native SOL units (not lamports)
- **For Tokens**: Use `uiAmountString` format, not raw amount
- **Validation**: Must have leading 0 before decimal if < 1
- **Behavior**: If not provided, wallet prompts user for amount

**3. SPL Token** (Optional)
- **Format**: Base58-encoded public key of SPL Token mint account
- **Usage**: Specifies token type for transfer
- **Convention**: Must use Associated Token Account (ATA)
- **Instructions**: Requires `TokenProgram.Transfer` or `TokenProgram.TransferChecked`

**4. Reference** (Optional)
- **Format**: Base58-encoded 32-byte arrays
- **Usage**: Multiple reference fields allowed
- **Purpose**: Client IDs for transaction tracking
- **Implementation**: Included as read-only, non-signer keys

**5. Label** (Optional)
- **Format**: URL-encoded UTF-8 string
- **Purpose**: Describes source of transfer request (brand, store, app, person)
- **Display**: Wallet should URL-decode and display to user

**6. Message** (Optional)
- **Format**: URL-encoded UTF-8 string
- **Purpose**: Describes nature of transfer request (item, order ID, thank you note)
- **Display**: Wallet should URL-decode and display to user

**7. Memo** (Optional)
- **Format**: URL-encoded UTF-8 string
- **Purpose**: Included in SPL Memo instruction in payment transaction
- **Privacy**: Will be recorded by validators, should not include private information
- **Implementation**: Added as second-to-last instruction before transfer

### Examples from Official Specification

**1. Transfer 1 SOL:**
```
solana:mvines9iiHiQTysrwkJjGf2gb9Ex9jXJX8ns3qwf2kN?amount=1&label=Michael
```

**2. Transfer 0.01 USDC:**
```
solana:mvines9iiHiQTysrwkJjGf2gb9Ex9jXJX8ns3qwf2kN?amount=0.01&spl-token=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

**3. Transfer SOL (user prompted for amount):**
```
solana:mvines9iiHiQTysrwkJjGf2gb9Ex9jXJX8ns3qwf2kN&label=Michael
```

### Transaction Request Format
```
solana:<link>
```
- **Link**: URL-encoded absolute HTTPS URL for interactive requests
- **Usage**: For complex transactions requiring backend interaction

### Key Insights for QR Code Generation
1. **Standard Compliance**: Official Solana ecosystem standard with broad wallet support
2. **Non-Interactive**: Parameters in URL directly compose transaction (no backend required)
3. **Flexible Amount**: Amount parameter is optional, allowing address-only QR codes
4. **Rich Metadata**: Supports labels, messages, and memos for enhanced UX
5. **Reference Tracking**: Built-in support for transaction tracking via reference fields
6. **Token Support**: Native support for both SOL and SPL tokens
7. **Validator Recording**: Memo field is permanently recorded on blockchain

