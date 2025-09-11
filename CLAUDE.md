# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev          # Start Next.js development server (http://localhost:3000)
npm run build        # Build production-ready application
npm run start        # Start production server (after build)
npm run lint         # Run ESLint (disabled during builds per next.config.ts)
```

## Environment Setup

### Required Environment Variables

#### Database & Authentication (Supabase)
- **`NEXT_PUBLIC_SUPABASE_URL`**: Your Supabase project URL
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Public anon key for client-side database access
- **`SUPABASE_SERVICE_ROLE_KEY`**: Service role key for server-side operations

#### Payment Processing (NOWPayments)
- **`NOWPAYMENTS_API_KEY`**: API key for creating payments and checking status
- **`NOWPAYMENTS_IPN_SECRET`**: Secret key for validating webhook signatures
- **`INTERNAL_API_KEY`**: Used for internal API calls between services

#### Email & Application
- **`SENDGRID_API_KEY`**: API key for sending transactional emails
- **`SENDGRID_FROM_EMAIL`**: Verified sender email address
- **`NEXT_PUBLIC_APP_URL`**: Base URL of your application

## Architecture Overview

### Core Stack
- **Framework**: Next.js 15.3.5 with App Router
- **Language**: TypeScript with strict type checking
- **Database**: Supabase (PostgreSQL) with real-time subscriptions and RLS
- **Styling**: Tailwind CSS v4 with Radix UI primitives
- **Payment Gateway**: NOWPayments API for cryptocurrency processing
- **Email**: SendGrid for transactional emails

### Directory Structure

```
app/
├── api/                    # API routes (Next.js Route Handlers)
│   ├── payments/          # Payment creation, status updates, management
│   ├── merchants/         # Merchant profile and business management
│   ├── subscriptions/     # Recurring payment and subscription logic
│   ├── nowpayments/       # Direct NOWPayments gateway integration
│   ├── webhooks/          # External webhook handlers
│   └── wallets/           # Cryptocurrency wallet operations
├── merchant/              # Merchant-facing dashboard and tools
│   ├── dashboard/         # Main merchant interface and analytics
│   ├── onboarding/        # New merchant setup flow
│   ├── subscriptions/     # Subscription management
│   └── settings/          # Account settings
├── pay/[id]/             # Public payment link pages (customer-facing)
├── smart-terminal/       # Point-of-sale interface
├── components/           # Shared UI components
├── globals.css           # Global styles and Tailwind imports
└── layout.tsx           # Root layout component

lib/                      # Utility functions and services
├── supabase-client.ts   # Client-side Supabase configuration
├── supabase-server.ts   # Server-side Supabase configuration
├── supabase-admin.ts    # Admin/service role Supabase client
├── nowpayments-dynamic.ts # NOWPayments API integration
├── email-client.ts      # SendGrid email client
├── utils.ts             # General utility functions
└── hooks/               # Custom React hooks

types/                    # TypeScript type definitions
├── api.ts               # API request/response types
├── database.ts          # Supabase database types
├── payments.ts          # Payment and transaction types
└── merchants.ts         # Merchant and business types

supabase/
├── migrations/          # Database migration files
└── functions/           # Edge functions for scheduled jobs
```

### Key Architectural Patterns

#### 1. Payment Flow
- **Payment Link Creation**: Merchants create links via `/api/payments/create`
- **Customer Payment**: Public pages at `/pay/[id]` with real-time status updates
- **Payment Processing**: NOWPayments handles crypto transactions with webhook confirmations
- **Status Management**: Real-time updates via Supabase subscriptions

#### 2. Database Schema

**Core Tables**:
- **`merchants`**: Business profiles and wallet configurations
  - `wallets`: JSON object storing wallet addresses by currency
  - `settings`: JSON object for merchant preferences
- **`payment_links`**: Payment definitions and metadata
  - `is_subscription`: Boolean for recurring payments
  - `subscription_config`: JSON for subscription settings
- **`transactions`**: Payment records and status tracking
  - `nowpayments_id`: External payment processor ID
  - `status`: Payment status enum (pending, confirming, confirmed, failed, expired)
- **`subscriptions`**: Recurring payment configurations
  - `billing_cycle`: Frequency (daily, weekly, monthly, yearly)
  - `amount_override`: Custom billing amount

#### 3. Authentication & Authorization
- **User Authentication**: Supabase Auth with email/password
- **Authorization**: Row-level security (RLS) policies for data isolation
- **API Protection**: Routes verify authentication via Supabase client
- **Internal APIs**: Protected with `INTERNAL_API_KEY` for service-to-service calls

## Common Development Tasks

### Adding a New Cryptocurrency

```typescript
// 1. Update wallet validation (/api/wallets/validate)
case 'NEW_COIN':
  return validateNewCoinAddress(address);

// 2. Add currency mapping (dashboard components)
const CURRENCY_NAMES = {
  ...existing_currencies,
  'new_coin': 'New Coin (NEW)',
};

// 3. Update type definitions
type SupportedCurrency = 'btc' | 'eth' | 'new_coin' | ...;
```

### Creating New API Endpoints

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication check
    const supabase = createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Database operations
    const { data, error: dbError } = await supabase
      .from('table_name')
      .select('*')
      .eq('user_id', user.id);

    if (dbError) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // 3. Return consistent response
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Database Migration Pattern

```sql
-- migrations/003_add_feature.sql
CREATE TABLE feature_table (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE feature_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own features"
ON feature_table FOR SELECT
USING (merchant_id IN (
  SELECT id FROM merchants WHERE user_id = auth.uid()
));

-- Add indexes
CREATE INDEX idx_feature_table_merchant_id ON feature_table(merchant_id);
```

## Important Implementation Details

### 1. Wallet Validation
- **Endpoint**: `/api/wallets/validate`
- **Purpose**: Validate cryptocurrency addresses before storage
- **Implementation**: Uses blockchain-specific validation libraries
- **Supported**: Bitcoin, Ethereum, Litecoin, ERC-20 tokens

### 2. Currency Support
- **Dynamic Lists**: Fetched from NOWPayments API for real-time availability
- **Stablecoin Associations**: Automatic USDC, USDT, DAI associations
- **Exchange Rates**: Real-time rate fetching for accurate calculations

### 3. Non-Custodial Architecture
- Payments go directly to merchant wallets (no intermediary custody)
- Cryptrac never holds or controls merchant funds
- Enhanced security through decentralized payment processing

### 4. Real-time Features
- **Supabase Subscriptions**: Real-time payment status updates
- **Live Currency Rates**: Dynamic rate updates
- **Payment Confirmations**: Instant notifications when confirmed

### 5. API Authentication
- **Internal Services**: Use `INTERNAL_API_KEY` header for server-to-server calls
- **User Authentication**: Supabase Auth client manages user sessions
- **Webhook Authentication**: NOWPayments webhooks validated using IPN secret

## Error Handling Patterns

```typescript
// Consistent error handling
try {
  const result = await riskyOperation();
  return { data: result, error: null };
} catch (error) {
  console.error('Operation failed:', error);
  
  if (process.env.NODE_ENV === 'production') {
    // Send to error tracking service
  }
  
  return { 
    data: null, 
    error: 'Operation failed. Please try again.' 
  };
}
```

## Security Considerations

### Data Protection
- Never log or expose API keys, wallet private keys, or sensitive information
- Sanitize all user inputs to prevent injection attacks
- Implement rate limiting on payment creation and API endpoints
- Always use HTTPS in production

### Cryptocurrency Security
- Application never handles private keys or controls user funds
- Validate wallet addresses before storage to prevent loss of funds
- Always verify payments through blockchain or payment processor
- Validate webhook signatures to prevent fraudulent notifications

### Authentication Security
- Secure session handling with proper expiration
- Enforce strong password requirements
- Consider implementing 2FA for merchant accounts
- Implement account lockout after failed login attempts

## Performance Optimization

### Frontend
- Utilize Next.js automatic code splitting
- Use Next.js Image component for optimized loading
- Implement lazy loading for non-critical components
- Implement proper caching strategies for API responses

### Backend
- Use proper indexes and query optimization
- Cache frequently requested data
- Optimize database connection usage
- Use edge functions for time-intensive operations

### Monitoring
- Track page load times and API response times
- Monitor user behavior and conversion rates
- Track and alert on error rate increases
- Monitor payment completion rates

## Testing Strategy

### Recommended Setup
```bash
# Install testing dependencies
npm install --save-dev jest @types/jest @testing-library/react @testing-library/jest-dom

# Add test scripts to package.json
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage"
```

### Focus Areas
- **Unit Testing**: Utility functions, API handlers, payment logic
- **Integration Testing**: API endpoints with database interactions
- **Frontend Testing**: Component behavior and user interactions
- **E2E Testing**: Complete payment flows and merchant onboarding
