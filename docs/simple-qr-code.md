# Simple QR Code System

Cryptrac uses address-only QR codes for maximum wallet compatibility.

## How It Works
1. Generate a QR code containing the wallet address (and extra ID if needed).
2. Customer scans with any wallet app.
3. Address auto-populates in the wallet.
4. Customer manually enters the payment amount.
5. Customer sends the payment.

## Implementation
```ts
import { formatAddressForQR } from '@/lib/simple-address-formatter'

const { qrContent } = formatAddressForQR('BTC', 'bc1qxy...', 'optional-extra-id')
// qrContent is "bc1qxy..." or "bc1qxy...:memo123" for extra-ID currencies
```

## Special Cases
- XRP, XLM, HBAR, EOS: Include extra ID after a colon separator.
- All others: Address only.

## Testing
Scan the code with common wallets; the address should populate automatically.

